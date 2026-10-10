import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import {
  adminApi,
  AdminOverview,
  InventoryItem,
  ApprovalItem,
  AuditLogItem,
} from '../api/admin';
import { supportApi, SupportTicket } from '../api/support';
import { NeomorphCard } from '../components/NeomorphCard';
import { NeomorphButton } from '../components/NeomorphButton';
import { NeomorphInput } from '../components/NeomorphInput';

export const OpsAdminScreen: React.FC = () => {
  const { user } = useAuth();
  const isStaff =
    user &&
    ['SUPPORT_AGENT', 'OPS_MANAGER', 'ADMIN', 'CATALOG_MANAGER', 'KNOWLEDGE_ADMIN'].includes(
      user.role
    );

  const [staffTab, setStaffTab] = useState<'overview' | 'approvals' | 'inventory' | 'tickets' | 'audit'>('overview');
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Customer support ticket form state
  const [ticketSubject, setTicketSubject] = useState<string>('');
  const [ticketMessage, setTicketMessage] = useState<string>('');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyMessage, setReplyMessage] = useState<string>('');

  useEffect(() => {
    loadData();
  }, [staffTab, user]);

  const loadData = async () => {
    setLoading(true);
    setFeedbackMsg(null);
    try {
      if (isStaff) {
        if (staffTab === 'overview') {
          const ov = await adminApi.getOverview();
          setOverview(ov);
        } else if (staffTab === 'approvals') {
          const ap = await adminApi.getApprovals();
          setApprovals(ap.items || []);
        } else if (staffTab === 'inventory') {
          const inv = await adminApi.getInventory();
          setInventory(inv.items || []);
        } else if (staffTab === 'audit') {
          const logs = await adminApi.getAuditLogs();
          setAuditLogs(logs.items || []);
        }
      }
      // Both customer and staff can view tickets
      const tkts = await supportApi.getTickets();
      setTickets(tkts.items || []);
    } catch (e: any) {
      console.warn('OpsAdmin load error', e);
    } finally {
      setLoading(false);
    }
  };

  const handleDecideApproval = async (id: string, approve: boolean) => {
    try {
      await adminApi.decideApproval(id, approve);
      setFeedbackMsg(`Approval ${approve ? 'APPROVED' : 'REJECTED'} successfully!`);
      const ap = await adminApi.getApprovals();
      setApprovals(ap.items || []);
    } catch (e: any) {
      setFeedbackMsg(`Approval error: ${e.message}`);
    }
  };

  const handleAdjustInventory = async (productId: string, delta: number) => {
    try {
      const res = await adminApi.adjustInventory(productId, delta, 'MANUAL_OPS_ADJUST');
      setFeedbackMsg(`Stock updated! New quantity: ${res.stock}`);
      const inv = await adminApi.getInventory();
      setInventory(inv.items || []);
    } catch (e: any) {
      setFeedbackMsg(`Adjustment error: ${e.message}`);
    }
  };

  const handleCreateTicket = async () => {
    if (!ticketSubject.trim()) return;
    try {
      const t = await supportApi.createTicket({
        subject: ticketSubject,
        message: ticketMessage,
        category: 'GENERAL',
      });
      setFeedbackMsg(`Support Ticket ${t.id} created!`);
      setTicketSubject('');
      setTicketMessage('');
      const tkts = await supportApi.getTickets();
      setTickets(tkts.items || []);
    } catch (e: any) {
      setFeedbackMsg(`Error: ${e.message}`);
    }
  };

  const handleSendReply = async (ticketId: string) => {
    if (!replyMessage.trim()) return;
    try {
      await supportApi.sendMessage(ticketId, replyMessage);
      setReplyMessage('');
      const updated = await supportApi.getTicket(ticketId);
      setSelectedTicket(updated);
    } catch (e: any) {
      setFeedbackMsg(`Reply failed: ${e.message}`);
    }
  };

  const handleEscalate = async (ticketId: string) => {
    try {
      const updated = await supportApi.escalateTicket(ticketId, 'Customer priority escalated');
      setSelectedTicket(updated);
      setFeedbackMsg(`Ticket escalated to HIGH priority!`);
    } catch (e: any) {
      setFeedbackMsg(`Escalate failed: ${e.message}`);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.roleTag}>
          <Text style={styles.roleTagText}>{user?.role || 'CUSTOMER'}</Text>
        </View>
        <Text style={styles.title}>
          {isStaff ? 'Operations & Admin Console' : 'Customer Support & Tickets'}
        </Text>
        <Text style={styles.subtitle}>
          {isStaff
            ? 'Manage inventory, approve sensitive operations & inspect audit logs'
            : 'Get assistance from agents, submit tickets & track escalations'}
        </Text>
      </View>

      {feedbackMsg && (
        <View style={styles.feedbackBox}>
          <Text style={styles.feedbackText}>⚡ {feedbackMsg}</Text>
        </View>
      )}

      {/* STAFF VIEW */}
      {isStaff && (
        <View style={styles.staffContainer}>
          {/* Segment Tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
            {(['overview', 'approvals', 'inventory', 'tickets', 'audit'] as const).map((t) => (
              <TouchableOpacity
                key={t}
                onPress={() => setStaffTab(t)}
                style={[styles.staffTabPill, staffTab === t && styles.activeStaffTab]}
              >
                <Text style={[styles.staffTabText, staffTab === t && styles.activeStaffTabText]}>
                  {t === 'overview'
                    ? '📊 Metrics'
                    : t === 'approvals'
                    ? `🛡️ Approvals (${approvals.filter((a) => a.status === 'PENDING').length})`
                    : t === 'inventory'
                    ? '📦 Inventory'
                    : t === 'tickets'
                    ? `🎧 Tickets (${tickets.length})`
                    : '📜 Audit Logs'}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {loading ? (
            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <View style={{ marginTop: 12 }}>
              {/* 1) OVERVIEW TAB */}
              {staffTab === 'overview' && overview && (
                <View style={styles.overviewGrid}>
                  <NeomorphCard variant="raised" style={styles.metricCard} padding={16}>
                    <Text style={styles.metricNum}>${overview.revenue?.toFixed(2)}</Text>
                    <Text style={styles.metricLabel}>Total Simulated Revenue</Text>
                  </NeomorphCard>

                  <NeomorphCard variant="raised" style={styles.metricCard} padding={16}>
                    <Text style={styles.metricNum}>{overview.orders}</Text>
                    <Text style={styles.metricLabel}>Orders Placed</Text>
                  </NeomorphCard>

                  <NeomorphCard variant="raised" style={styles.metricCard} padding={16}>
                    <Text style={styles.metricNum}>{overview.users}</Text>
                    <Text style={styles.metricLabel}>Registered Users</Text>
                  </NeomorphCard>

                  <NeomorphCard variant="raised" style={styles.metricCard} padding={16}>
                    <Text style={styles.metricNum}>{overview.products}</Text>
                    <Text style={styles.metricLabel}>Catalog Products</Text>
                  </NeomorphCard>

                  <NeomorphCard variant="raised" style={styles.metricCard} padding={16}>
                    <Text style={[styles.metricNum, { color: colors.warning }]}>
                      {overview.pendingApprovals}
                    </Text>
                    <Text style={styles.metricLabel}>Pending Refund Approvals</Text>
                  </NeomorphCard>

                  <NeomorphCard variant="raised" style={styles.metricCard} padding={16}>
                    <Text style={[styles.metricNum, { color: colors.info }]}>
                      {overview.activeDocs}
                    </Text>
                    <Text style={styles.metricLabel}>Active Policy Docs</Text>
                  </NeomorphCard>
                </View>
              )}

              {/* 2) APPROVALS QUEUE */}
              {staffTab === 'approvals' && (
                <View style={styles.approvalsSection}>
                  <Text style={styles.sectionHeading}>
                    Pending Human Approval Requests ({approvals.length})
                  </Text>
                  {approvals.length === 0 ? (
                    <Text style={styles.emptyNote}>No pending approvals right now.</Text>
                  ) : (
                    approvals.map((appr) => (
                      <NeomorphCard key={appr.id} variant="raised" style={styles.approvalCard} padding={16}>
                        <View style={styles.apprHeader}>
                          <View>
                            <Text style={styles.apprKind}>KIND: {appr.kind.toUpperCase()}</Text>
                            <Text style={styles.apprId}>Ref ID: {appr.reference_id}</Text>
                          </View>
                          <View style={[styles.statusBadge, appr.status === 'PENDING' ? styles.statusAmber : styles.statusGreen]}>
                            <Text style={styles.statusBadgeText}>{appr.status}</Text>
                          </View>
                        </View>
                        <Text style={styles.apprReason}>{appr.reason}</Text>

                        {appr.status === 'PENDING' && (
                          <View style={styles.apprBtnRow}>
                            <TouchableOpacity
                              style={[styles.apprBtn, styles.approveBtn]}
                              onPress={() => handleDecideApproval(appr.id, true)}
                            >
                              <Text style={styles.apprBtnText}>✓ Approve Action</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.apprBtn, styles.rejectBtn]}
                              onPress={() => handleDecideApproval(appr.id, false)}
                            >
                              <Text style={styles.apprBtnText}>✕ Reject</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </NeomorphCard>
                    ))
                  )}
                </View>
              )}

              {/* 3) INVENTORY ADJUSTER */}
              {staffTab === 'inventory' && (
                <View style={styles.inventorySection}>
                  <Text style={styles.sectionHeading}>Live Stock Adjustment (Audited)</Text>
                  {inventory.map((it) => (
                    <NeomorphCard key={it.productId} variant="raisedSoft" style={styles.invCard} padding={14}>
                      <View style={styles.invRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.invName}>{it.name}</Text>
                          <Text style={styles.invPrice}>${it.price?.toFixed(2)} • ID: {it.productId}</Text>
                          <Text style={styles.invStock}>
                            Stock Available: <Text style={{ fontWeight: '900', color: colors.primaryDark }}>{it.stock}</Text> (Reserved: {it.reserved})
                          </Text>
                        </View>

                        <View style={styles.invAdjustBtns}>
                          <TouchableOpacity
                            style={styles.adjustPill}
                            onPress={() => handleAdjustInventory(it.productId, -5)}
                          >
                            <Text style={styles.adjustPillText}>-5</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.adjustPill, styles.addStockPill]}
                            onPress={() => handleAdjustInventory(it.productId, +10)}
                          >
                            <Text style={styles.adjustPillText}>+10</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </NeomorphCard>
                  ))}
                </View>
              )}

              {/* 4) TICKETS TAB */}
              {staffTab === 'tickets' && (
                <View style={styles.ticketsSection}>
                  <Text style={styles.sectionHeading}>Customer Support Queue ({tickets.length})</Text>
                  {tickets.map((t) => (
                    <TouchableOpacity key={t.id} onPress={() => setSelectedTicket(t)}>
                      <NeomorphCard variant="raised" style={styles.ticketCard} padding={14}>
                        <View style={styles.ticketHeader}>
                          <Text style={styles.ticketSubject}>{t.subject}</Text>
                          <View style={styles.priorityPill}>
                            <Text style={styles.priorityText}>{t.priority}</Text>
                          </View>
                        </View>
                        <Text style={styles.ticketStatus}>Status: {t.status} • Category: {t.category}</Text>
                        <Text style={styles.ticketMessagesCount}>
                          💬 {t.messages?.length || 0} messages in thread
                        </Text>
                      </NeomorphCard>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* 5) AUDIT LOGS */}
              {staffTab === 'audit' && (
                <View style={styles.auditSection}>
                  <Text style={styles.sectionHeading}>Immutable Audit Log Trail ({auditLogs.length})</Text>
                  {auditLogs.map((log) => (
                    <NeomorphCard key={log.id} variant="raisedSoft" style={styles.auditCard} padding={12}>
                      <View style={styles.auditHeader}>
                        <Text style={styles.auditAction}>{log.action}</Text>
                        <Text style={styles.auditActor}>{log.actor_type}</Text>
                      </View>
                      <Text style={styles.auditTarget}>
                        Entity: {log.entity_type} #{log.entity_id}
                      </Text>
                      <Text style={styles.auditDiff} numberOfLines={2}>
                        {log.diff_json}
                      </Text>
                      <Text style={styles.auditTime}>{new Date(log.created_at).toLocaleString()}</Text>
                    </NeomorphCard>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>
      )}

      {/* CUSTOMER VIEW: Create Support Ticket & Ticket List */}
      {!isStaff && (
        <View style={styles.customerSection}>
          <NeomorphCard variant="glow" style={styles.newTicketCard} padding={18}>
            <Text style={styles.cardHeading}>Open a Support Ticket</Text>
            <View style={{ gap: 10, marginTop: 10 }}>
              <NeomorphInput
                value={ticketSubject}
                onChangeText={setTicketSubject}
                placeholder="Subject (e.g. Question on return policy or order)"
              />
              <NeomorphInput
                value={ticketMessage}
                onChangeText={setTicketMessage}
                placeholder="Describe your issue or request in detail..."
                multiline
                numberOfLines={3}
              />
              <NeomorphButton
                title="Submit Support Request"
                onPress={handleCreateTicket}
                variant="primary"
                size="md"
              />
            </View>
          </NeomorphCard>

          <Text style={[styles.sectionHeading, { marginTop: 20 }]}>
            Your Support Tickets ({tickets.length})
          </Text>
          {tickets.length === 0 ? (
            <Text style={styles.emptyNote}>You haven't submitted any tickets yet.</Text>
          ) : (
            tickets.map((t) => (
              <TouchableOpacity key={t.id} onPress={() => setSelectedTicket(t)}>
                <NeomorphCard variant="raised" style={styles.ticketCard} padding={14}>
                  <View style={styles.ticketHeader}>
                    <Text style={styles.ticketSubject}>{t.subject}</Text>
                    <View style={styles.priorityPill}>
                      <Text style={styles.priorityText}>{t.status}</Text>
                    </View>
                  </View>
                  <Text style={styles.ticketMessagesCount}>
                    💬 {t.messages?.length || 0} messages in conversation
                  </Text>
                </NeomorphCard>
              </TouchableOpacity>
            ))
          )}
        </View>
      )}

      {/* Selected Ticket Conversation Thread Modal / Drawer */}
      {selectedTicket && (
        <View style={styles.threadOverlay}>
          <NeomorphCard variant="raisedFloating" style={styles.threadCard} padding={16}>
            <View style={styles.threadHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.threadTitle}>{selectedTicket.subject}</Text>
                <Text style={styles.threadMeta}>
                  Status: {selectedTicket.status} • Priority: {selectedTicket.priority}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedTicket(null)}
                style={styles.closeThreadBtn}
              >
                <Text style={styles.closeThreadText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Messages Scroll */}
            <ScrollView style={styles.threadMessages} showsVerticalScrollIndicator={false}>
              {selectedTicket.messages?.map((m) => (
                <View
                  key={m.id}
                  style={[
                    styles.msgBubble,
                    m.sender === 'CUSTOMER' ? styles.customerMsg : styles.agentMsg,
                  ]}
                >
                  <Text style={styles.msgSender}>{m.sender}</Text>
                  <Text style={styles.msgText}>{m.message}</Text>
                  <Text style={styles.msgTime}>
                    {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              ))}
            </ScrollView>

            {/* Actions: Reply + Escalate */}
            <View style={styles.threadInputRow}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <NeomorphInput
                  value={replyMessage}
                  onChangeText={setReplyMessage}
                  placeholder="Type reply message..."
                />
              </View>
              <NeomorphButton
                title="Send"
                onPress={() => handleSendReply(selectedTicket.id)}
                variant="primary"
                size="sm"
              />
            </View>

            <TouchableOpacity
              style={styles.escalateBtn}
              onPress={() => handleEscalate(selectedTicket.id)}
            >
              <Text style={styles.escalateBtnText}>⚡ Escalate to High Priority</Text>
            </TouchableOpacity>
          </NeomorphCard>
        </View>
      )}

      <View style={{ height: 120 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  roleTag: {
    backgroundColor: '#FFE4E8',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  roleTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  feedbackBox: {
    marginHorizontal: 16,
    marginTop: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#D1FAE5',
  },
  feedbackText: {
    color: '#065F46',
    fontWeight: '700',
    fontSize: 13,
  },
  staffContainer: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  tabsScroll: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  staffTabPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(225, 29, 72, 0.12)',
  },
  activeStaffTab: {
    backgroundColor: colors.primary,
  },
  staffTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  activeStaffTabText: {
    color: '#FFFFFF',
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricCard: {
    width: '48%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricNum: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.primaryDark,
  },
  metricLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 10,
  },
  approvalsSection: {
    marginTop: 8,
  },
  approvalCard: {
    marginBottom: 10,
  },
  apprHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  apprKind: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },
  apprId: {
    fontSize: 11,
    color: colors.textMuted,
  },
  apprReason: {
    fontSize: 13,
    color: colors.textSecondary,
    marginVertical: 8,
  },
  apprBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  apprBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 14,
    alignItems: 'center',
  },
  approveBtn: {
    backgroundColor: colors.success,
  },
  rejectBtn: {
    backgroundColor: colors.danger,
  },
  apprBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusAmber: {
    backgroundColor: '#FEF3C7',
  },
  statusGreen: {
    backgroundColor: '#D1FAE5',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  inventorySection: {
    marginTop: 8,
  },
  invCard: {
    marginBottom: 8,
  },
  invRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  invName: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  invPrice: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  invStock: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  invAdjustBtns: {
    flexDirection: 'row',
    gap: 6,
  },
  adjustPill: {
    backgroundColor: '#FFE4E8',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  addStockPill: {
    backgroundColor: '#D1FAE5',
  },
  adjustPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  ticketsSection: {
    marginTop: 8,
  },
  ticketCard: {
    marginBottom: 8,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketSubject: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
    flex: 1,
  },
  priorityPill: {
    backgroundColor: '#FFE4E8',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
  },
  ticketStatus: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
  },
  ticketMessagesCount: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 4,
  },
  auditSection: {
    marginTop: 8,
  },
  auditCard: {
    marginBottom: 6,
  },
  auditHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  auditAction: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },
  auditActor: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '700',
  },
  auditTarget: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  auditDiff: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  auditTime: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 4,
  },
  customerSection: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  newTicketCard: {
    backgroundColor: '#FCF8F9',
  },
  cardHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  emptyNote: {
    fontSize: 13,
    color: colors.textMuted,
    paddingVertical: 14,
  },
  threadOverlay: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  threadCard: {
    backgroundColor: colors.surface,
    maxHeight: 450,
  },
  threadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  threadTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  threadMeta: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  closeThreadBtn: {
    padding: 6,
  },
  closeThreadText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textMuted,
  },
  threadMessages: {
    maxHeight: 220,
    paddingVertical: 10,
  },
  msgBubble: {
    padding: 10,
    borderRadius: 12,
    marginBottom: 8,
    maxWidth: '85%',
  },
  customerMsg: {
    backgroundColor: '#FFE4E8',
    alignSelf: 'flex-start',
  },
  agentMsg: {
    backgroundColor: '#DBEAFE',
    alignSelf: 'flex-end',
  },
  msgSender: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textMuted,
    marginBottom: 2,
  },
  msgText: {
    fontSize: 13,
    color: colors.textPrimary,
  },
  msgTime: {
    fontSize: 9,
    color: colors.textMuted,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  threadInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  escalateBtn: {
    marginTop: 8,
    alignItems: 'center',
    paddingVertical: 6,
  },
  escalateBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
});
