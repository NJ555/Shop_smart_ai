import { request } from './client';

export interface AdminOverview {
  users: number;
  products: number;
  orders: number;
  revenue: number;
  lowStock: { product_id: string; available_quantity: number }[];
  openTickets: number;
  pendingApprovals: number;
  activeDocs: number;
}

export interface InventoryItem {
  productId: string;
  name: string;
  price: number;
  stock: number;
  reserved: number;
}

export interface ApprovalItem {
  id: string;
  kind: string;
  reference_id: string;
  requested_by: string;
  reason: string;
  payload: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at: string;
}

export interface AuditLogItem {
  id: string;
  actor_id: string;
  actor_type: string;
  action: string;
  entity_type: string;
  entity_id: string;
  diff_json: string;
  trace_id: string;
  created_at: string;
}

export const adminApi = {
  getOverview: async (): Promise<AdminOverview> => {
    return request<AdminOverview>('/admin/overview');
  },

  getInventory: async (): Promise<{ items: InventoryItem[] }> => {
    return request<{ items: InventoryItem[] }>('/admin/inventory');
  },

  adjustInventory: async (productId: string, delta: number, reason?: string) => {
    return request<{ ok: boolean; stock: number }>(`/admin/inventory/${productId}/adjust`, {
      method: 'POST',
      body: JSON.stringify({ delta, reason: reason || 'MANUAL_ADJUST' }),
    });
  },

  getApprovals: async (): Promise<{ items: ApprovalItem[] }> => {
    // Both /admin/approvals and /agent/approvals work
    return request<{ items: ApprovalItem[] }>('/admin/approvals');
  },

  decideApproval: async (approvalId: string, approve: boolean) => {
    return request<{ ok: boolean; status: string }>(`/admin/approvals/${approvalId}/decide`, {
      method: 'POST',
      body: JSON.stringify({ approve }),
    });
  },

  getAuditLogs: async (): Promise<{ items: AuditLogItem[] }> => {
    return request<{ items: AuditLogItem[] }>('/admin/audit');
  },
};
