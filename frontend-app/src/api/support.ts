import { request } from './client';

export interface SupportMessage {
  id: string;
  sender: string;
  message: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  user_id: string;
  orderId?: string | null;
  category: string;
  status: 'OPEN' | 'PENDING' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  subject: string;
  created_at: string;
  messages: SupportMessage[];
}

export const supportApi = {
  getTickets: async (): Promise<{ items: SupportTicket[] }> => {
    return request<{ items: SupportTicket[] }>('/support/tickets');
  },

  getTicket: async (id: string): Promise<SupportTicket> => {
    return request<SupportTicket>(`/support/tickets/${id}`);
  },

  createTicket: async (data: {
    subject: string;
    message?: string;
    orderId?: string | null;
    category?: string;
    priority?: string;
  }): Promise<SupportTicket> => {
    return request<SupportTicket>('/support/tickets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  sendMessage: async (ticketId: string, message: string): Promise<{ ok: boolean }> => {
    return request<{ ok: boolean }>(`/support/tickets/${ticketId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  },

  escalateTicket: async (ticketId: string, reason?: string): Promise<SupportTicket> => {
    return request<SupportTicket>(`/support/tickets/${ticketId}/escalate`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },
};
