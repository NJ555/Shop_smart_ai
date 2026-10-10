'use strict';
// Tool Execution Layer: schema-checked, role-gated, audited. Agents never touch DB directly
// outside these tools; all user-facing claims must come from tool outputs.
const db = require('../../db');
const config = require('../../config');
const { uid, nowIso } = require('../../utils/ids');
const { audit, outbox } = require('../../middleware/idempotency');
const { chatComplete } = require('../../utils/llm');
const { rephraseOpsWithLangChain } = require('../../utils/langchain');
const { OPS_SYSTEM } = require('../../utils/prompts');

const STAFF = ['SUPPORT_AGENT', 'OPS_MANAGER', 'ADMIN', 'CATALOG_MANAGER', 'KNOWLEDGE_ADMIN'];

function canSeeOrder(user, order) {
  return order.user_id === user.id || STAFF.includes(user.role) || user.role === 'AGENT_RUNTIME';
}

const tools = {
  'order.get': {
    roles: ['CUSTOMER', ...STAFF, 'AGENT_RUNTIME'],
    run({ orderId }, user) {
      const o = db.get('SELECT * FROM orders WHERE id=? OR order_number=?', [orderId, orderId]);
      if (!o) return { ok: false, error: 'ORDER_NOT_FOUND', message: 'Order not found' };
      if (!canSeeOrder(user, o)) return { ok: false, error: 'FORBIDDEN', message: 'Not your order' };
      const items = db.all('SELECT product_id, product_name_snapshot, unit_price_snapshot, quantity FROM order_items WHERE order_id=?', [o.id]);
      return { ok: true, data: { orderId: o.id, orderNumber: o.order_number, status: o.status, total: o.total, items } };
    },
  },
  'order.list_by_customer': {
    roles: ['CUSTOMER', ...STAFF, 'AGENT_RUNTIME'],
    run({ customerId }, user) {
      const id = customerId || user.id;
      if (id !== user.id && !STAFF.includes(user.role)) return { ok: false, error: 'FORBIDDEN', message: 'Cannot list other customer orders' };
      const rows = db.all('SELECT id, order_number, status, total, created_at FROM orders WHERE user_id=? ORDER BY created_at DESC LIMIT 20', [id]);
      return { ok: true, data: { orders: rows } };
    },
  },
  'shipment.track': {
    roles: ['CUSTOMER', ...STAFF, 'AGENT_RUNTIME'],
    run({ orderId }, user) {
      const o = db.get('SELECT * FROM orders WHERE id=? OR order_number=?', [orderId, orderId]);
      if (!o) return { ok: false, error: 'ORDER_NOT_FOUND', message: 'Order not found' };
      if (!canSeeOrder(user, o)) return { ok: false, error: 'FORBIDDEN', message: 'Not your order' };
      const s = db.get('SELECT * FROM shipments WHERE order_id=?', [o.id]);
      if (!s) return { ok: false, error: 'NO_SHIPMENT', message: 'No shipment yet' };
      const events = db.all('SELECT status, description, occurred_at FROM shipment_events WHERE shipment_id=? ORDER BY occurred_at', [s.id]);
      return { ok: true, data: { orderId: o.id, orderNumber: o.order_number, orderStatus: o.status, shipmentStatus: s.status, trackingNumber: s.tracking_number, eta: s.eta, events } };
    },
  },
  'inventory.check': {
    roles: ['CUSTOMER', ...STAFF, 'AGENT_RUNTIME'],
    run({ productId }) {
      const inv = db.get('SELECT available_quantity FROM inventory_levels WHERE product_id=?', [productId]);
      const p = db.get('SELECT id, name, price FROM products WHERE id=?', [productId]);
      if (!p) return { ok: false, error: 'PRODUCT_NOT_FOUND', message: 'Product not found' };
      return { ok: true, data: { productId, name: p.name, price: p.price, available: inv ? inv.available_quantity : 0 } };
    },
  },
  'catalog.search_alternatives': {
    roles: ['CUSTOMER', ...STAFF, 'AGENT_RUNTIME'],
    run({ productId, limit = 3 }) {
      const p = db.get('SELECT * FROM products WHERE id=?', [productId]);
      if (!p) return { ok: false, error: 'PRODUCT_NOT_FOUND', message: 'Product not found' };
      const rows = db.all(`SELECT p.id, p.name, p.price, p.rating, i.available_quantity FROM products p
        JOIN inventory_levels i ON i.product_id=p.id
        WHERE p.category_id=? AND p.id!=? AND p.is_active=1 AND i.available_quantity>0 ORDER BY p.rating DESC LIMIT ?`, [p.category_id, productId, Math.min(5, limit)]);
      return { ok: true, data: { alternatives: rows } };
    },
  },
  'order.cancel_simulated': {
    roles: ['CUSTOMER', 'SUPPORT_AGENT', 'OPS_MANAGER', 'ADMIN', 'AGENT_RUNTIME'],
    run({ orderId, reason = 'CUSTOMER_REQUEST' }, user) {
      const o = db.get('SELECT * FROM orders WHERE id=? OR order_number=?', [orderId, orderId]);
      if (!o) return { ok: false, error: 'ORDER_NOT_FOUND', message: 'Order not found' };
      if (!canSeeOrder(user, o)) return { ok: false, error: 'FORBIDDEN', message: 'Not your order' };
      if (['SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(o.status)) {
        return { ok: false, error: 'ORDER_NOT_ELIGIBLE_FOR_CANCELLATION', message: 'Order has already been shipped.' };
      }
      if (o.status === 'CANCELLED') return { ok: true, data: { orderId: o.id, status: 'CANCELLED', refundStatus: 'ALREADY_CANCELLED' } };
      const now = nowIso();
      const before = { status: o.status };
      db.run(`UPDATE orders SET status='CANCELLED', updated_at=? WHERE id=?`, [now, o.id]);
      const items = db.all('SELECT * FROM order_items WHERE order_id=?', [o.id]);
      for (const it of items) db.run('UPDATE inventory_levels SET available_quantity=available_quantity+?, reserved_quantity=max(0,reserved_quantity-?), version=version+1 WHERE product_id=?', [it.quantity, it.quantity, it.product_id]);
      const needsApproval = o.total > config.refundApprovalThreshold && user.role === 'CUSTOMER';
      db.run('INSERT INTO refunds (id, order_id, amount, reason, status, created_at) VALUES (?,?,?,?,?,?)',
        [uid('ref'), o.id, o.total, reason, needsApproval ? 'SIMULATED_REFUND_REQUESTED' : 'SIMULATED_REFUND_COMPLETED', now]);
      outbox({ aggregateType: 'order', aggregateId: o.id, eventType: 'order.cancelled', payload: { orderId: o.id, via: 'agent-tool' } });
      audit({ actorId: user.id, actorType: 'AGENT', action: 'order.cancel_simulated', entityType: 'order', entityId: o.id, before, after: { status: 'CANCELLED' }, traceId: '' });
      return { ok: true, data: { orderId: o.id, orderNumber: o.order_number, status: 'CANCELLED', refundStatus: needsApproval ? 'SIMULATED_REFUND_REQUESTED' : 'SIMULATED_REFUND_INITIATED' } };
    },
  },
  'refund.create_simulated': {
    roles: ['OPS_MANAGER', 'ADMIN'],
    run({ orderId, amount, reason = 'CUSTOMER_REQUEST' }, user) {
      const o = db.get('SELECT * FROM orders WHERE id=? OR order_number=?', [orderId, orderId]);
      if (!o) return { ok: false, error: 'ORDER_NOT_FOUND', message: 'Order not found' };
      if (amount > o.total) return { ok: false, error: 'REFUND_EXCEEDS_TOTAL', message: 'Refund amount exceeds order total' };
      if (amount > config.refundApprovalThreshold) {
        const aid = uid('apr');
        db.run('INSERT INTO approvals (id, kind, reference_id, requested_by, reason, payload, status, created_at) VALUES (?,?,?,?,?,?,?,?)',
          [aid, 'refund', o.id, user.id, reason, JSON.stringify({ orderId: o.id, amount }), 'PENDING', nowIso()]);
        return { ok: true, data: { status: 'PENDING_APPROVAL', approvalId: aid } };
      }
      const rid = uid('ref');
      db.run('INSERT INTO refunds (id, order_id, amount, reason, status, created_at) VALUES (?,?,?,?,?,?)', [rid, o.id, amount, reason, 'SIMULATED_REFUND_COMPLETED', nowIso()]);
      return { ok: true, data: { refundId: rid, status: 'SIMULATED_REFUND_COMPLETED' } };
    },
  },
  'support.ticket.create': {
    roles: ['CUSTOMER', ...STAFF, 'AGENT_RUNTIME'],
    run({ subject, message, orderId = null, category = 'GENERAL' }, user) {
      const id = uid('tkt');
      db.run('INSERT INTO support_tickets (id, user_id, order_id, category, status, priority, subject, created_at) VALUES (?,?,?,?,?,?,?,?)',
        [id, user.id, orderId, category, 'OPEN', 'MEDIUM', subject || 'Agent-created ticket', nowIso()]);
      if (message) db.run('INSERT INTO support_messages (id, ticket_id, sender_role, message, created_at) VALUES (?,?,?,?,?)', [uid('msg'), id, 'AGENT', message, nowIso()]);
      return { ok: true, data: { ticketId: id } };
    },
  },
  'support.escalate': {
    roles: [...STAFF, 'AGENT_RUNTIME'],
    run({ ticketId, reason = '' }) {
      const t = db.get('SELECT * FROM support_tickets WHERE id=?', [ticketId]);
      if (!t) return { ok: false, error: 'TICKET_NOT_FOUND', message: 'Ticket not found' };
      db.run(`UPDATE support_tickets SET status='PENDING', priority='HIGH' WHERE id=?`, [ticketId]);
      return { ok: true, data: { ticketId, status: 'PENDING' } };
    },
  },
  'fulfillment.flag_exception': {
    roles: ['SUPPORT_AGENT', 'OPS_MANAGER', 'ADMIN', 'AGENT_RUNTIME'],
    run({ orderId, reason }) {
      const o = db.get('SELECT * FROM orders WHERE id=? OR order_number=?', [orderId, orderId]);
      if (!o) return { ok: false, error: 'ORDER_NOT_FOUND', message: 'Order not found' };
      const s = db.get('SELECT * FROM shipments WHERE order_id=?', [o.id]);
      if (s) {
        db.run(`UPDATE shipments SET status='DELAYED', updated_at=? WHERE id=?`, [nowIso(), s.id]);
        db.run('INSERT INTO shipment_events (id, shipment_id, status, description, occurred_at, source) VALUES (?,?,?,?,?,?)', [uid('sev'), s.id, 'DELAYED', reason || 'Flagged by agent', nowIso(), 'AGENT']);
      }
      return { ok: true, data: { orderId: o.id, flagged: true } };
    },
  },
};

function logToolCall(runId, tool, input, result) {
  const now = nowIso();
  db.run('INSERT INTO agent_tool_calls (id, agent_run_id, tool_name, input_json, output_json, status, error_code, started_at, ended_at) VALUES (?,?,?,?,?,?,?,?,?)',
    [uid('tlc'), runId, tool, JSON.stringify(input), JSON.stringify(result).slice(0, 4000), result.ok ? 'SUCCESS' : 'ERROR', result.ok ? null : result.error, now, now]);
}

async function handleOpsQuery({ user, query, traceId: trace }) {
  const q = query.toLowerCase();
  const orderMatch = query.match(/ORD-[A-Za-z0-9]+/i);
  const orderId = orderMatch ? orderMatch[0].toUpperCase() : null;
  const wantsCancel = /cancel/.test(q);
  const wantsTrack = /where|track|status|delay|arriv|eta|shipment|deliver/.test(q);
  const wantsInventory = /stock|inventory|available|in stock/.test(q);
  const runId = uid('run');
  const now = nowIso();
  const intent = wantsCancel ? 'CANCEL_ORDER' : wantsTrack ? 'TRACK_ORDER' : wantsInventory ? 'CHECK_INVENTORY' : 'GENERAL_OPS';
  const agent = wantsCancel ? 'Order Support Agent' : wantsTrack ? 'Shipment Tracking Agent' : wantsInventory ? 'Inventory Agent' : 'Orchestrator';
  db.run('INSERT INTO agent_runs (id, user_id, intent, selected_agent, status, input_query, result, approval_status, trace_id, created_at) VALUES (?,?,?,?,?,?,?,?,?,?)',
    [runId, user.id, intent, agent, 'RUNNING', query, '{}', 'NOT_REQUIRED', trace, now]);

  const toolOutputs = {};
  let answer = '';
  const suggestedActions = [];
  if (orderId) {
    const og = tools['order.get'].run({ orderId }, user);
    logToolCall(runId, 'order.get', { orderId }, og);
    toolOutputs.order = og;
    const st = tools['shipment.track'].run({ orderId }, user);
    logToolCall(runId, 'shipment.track', { orderId }, st);
    toolOutputs.shipment = st;
    if (og.ok && st.ok) {
      const eligible = !['SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'].includes(og.data.status);
      answer = `Order ${og.data.orderNumber} is ${og.data.status}. Shipment is ${st.data.shipmentStatus}${st.data.eta ? `, ETA ${st.data.eta.slice(0, 10)}` : ''} (tracking ${st.data.trackingNumber}). ` +
        (eligible ? 'It is eligible for cancellation before shipment.' : 'It can no longer be cancelled because it has shipped.');
      if (wantsCancel && eligible) suggestedActions.push({ action: 'order.cancel_simulated', requiresApproval: false, input: { orderId: og.data.orderId, reason: 'CUSTOMER_REQUEST' } });
    } else {
      answer = `I couldn't find order ${orderId}. Please check the order number in Order History.`;
    }
  } else if (wantsInventory) {
    answer = 'Tell me the product ID (e.g. LAP101) and I will check live stock via inventory.check.';
  } else {
    const list = tools['order.list_by_customer'].run({}, user);
    logToolCall(runId, 'order.list_by_customer', {}, list);
    toolOutputs.orders = list;
    const n = list.ok ? list.data.orders.length : 0;
    answer = n ? `You have ${n} order(s). The most recent is ${list.data.orders[0].order_number} (${list.data.orders[0].status}). Ask "Where is ORD-xxx?" for live tracking.` : 'You have no orders yet. Add products to cart and checkout to create one.';
  }
  // LangChain LCEL phrasing over verified facts (grounded; template stands on failure)
  try {
    const phrased = await rephraseOpsWithLangChain(query, toolOutputs, answer);
    if (phrased) answer = phrased;
  } catch {
    try {
      const phrased = await chatComplete([
        { role: 'system', content: OPS_SYSTEM },
        { role: 'user', content: `User asked: ${query}\nVerified facts: ${JSON.stringify(toolOutputs).slice(0, 2500)}\nDraft: ${answer}\nRestate factually in 1-3 sentences. Always explicitly state whether the order is eligible for cancellation (eligible unless SHIPPED/OUT_FOR_DELIVERY/DELIVERED/CANCELLED).` },
      ], { maxTokens: 250 });
      if (phrased) answer = phrased;
    } catch { /* keep template */ }
  }
  db.run(`UPDATE agent_runs SET status='COMPLETED', result=?, completed_at=? WHERE id=?`, [JSON.stringify({ answer, suggestedActions }).slice(0, 4000), nowIso(), runId]);
  return { answer, suggestedActions, agentRunId: runId, intent, selectedAgent: agent, engine: 'langchain-lcel' };
}

module.exports = { tools, logToolCall, handleOpsQuery };
