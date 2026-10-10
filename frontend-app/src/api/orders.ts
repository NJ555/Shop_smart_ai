import { request } from './client';

export interface ShippingAddress {
  line1: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface OrderItemView {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  attributes: Record<string, string>;
}

export interface OrderView {
  orderId: string;
  orderNumber: string;
  status: 'CREATED' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';
  currency: string;
  subtotal: number;
  shippingFee: number;
  taxSimulated: number;
  total: number;
  membershipTier: string;
  shippingAddress: ShippingAddress;
  paymentStatus: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItemView[];
}

export interface ShipmentEvent {
  status: string;
  description: string;
  occurredAt: string;
}

export interface ShipmentTrackView {
  shipmentId: string;
  status: string;
  trackingNumber: string;
  carrier: string;
  eta: string;
  events: ShipmentEvent[];
}

export interface CheckoutResult {
  orderId: string;
  orderNumber: string;
  status: string;
  total: number;
  paymentStatus: string;
  createdAt: string;
}

export interface CancelOrderResult {
  orderId: string;
  orderNumber: string;
  status: string;
  refundStatus: string;
  approvalId?: string | null;
}

export const ordersApi = {
  createOrder: async (
    cartId: string,
    shippingAddress: ShippingAddress,
    idempotencyKey?: string
  ): Promise<CheckoutResult> => {
    const headers: Record<string, string> = {};
    if (idempotencyKey) headers['idempotency-key'] = idempotencyKey;

    return request<CheckoutResult>('/orders', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        cartId,
        shippingAddress,
        paymentMode: 'SIMULATED',
      }),
    });
  },

  getOrders: async (): Promise<{ items: OrderView[] }> => {
    return request<{ items: OrderView[] }>('/orders');
  },

  getOrder: async (idOrNumber: string): Promise<OrderView> => {
    return request<OrderView>(`/orders/${idOrNumber}`);
  },

  getShipment: async (idOrNumber: string): Promise<ShipmentTrackView> => {
    return request<ShipmentTrackView>(`/orders/${idOrNumber}/shipment`);
  },

  cancelOrder: async (idOrNumber: string, reason?: string, idempotencyKey?: string): Promise<CancelOrderResult> => {
    const headers: Record<string, string> = {};
    if (idempotencyKey) headers['idempotency-key'] = idempotencyKey;

    return request<CancelOrderResult>(`/orders/${idOrNumber}/cancel`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ reason: reason || 'CUSTOMER_REQUEST' }),
    });
  },
};
