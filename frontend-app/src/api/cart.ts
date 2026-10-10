import { request } from './client';
import { Product } from './catalog';

export interface CartItem {
  itemId: string;
  quantity: number;
  product: Product;
  warnings: string[];
  lineTotal: number;
}

export interface CartView {
  cartId: string;
  items: CartItem[];
  subtotal: number;
  count: number;
}

export const cartApi = {
  getCart: async (): Promise<CartView> => {
    return request<CartView>('/cart');
  },

  addItem: async (productId: string, quantity: number = 1): Promise<CartView> => {
    return request<CartView>('/cart/items', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity }),
    });
  },

  updateQuantity: async (itemId: string, quantity: number): Promise<CartView> => {
    return request<CartView>(`/cart/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    });
  },

  removeItem: async (itemId: string): Promise<CartView> => {
    return request<CartView>(`/cart/items/${itemId}`, {
      method: 'DELETE',
    });
  },

  clearCart: async (): Promise<CartView> => {
    return request<CartView>('/cart', {
      method: 'DELETE',
    });
  },
};

export const wishlistApi = {
  getWishlist: async (): Promise<{ items: (Product & { addedAt: string })[] }> => {
    return request<{ items: (Product & { addedAt: string })[] }>('/wishlist');
  },

  addItem: async (productId: string): Promise<{ ok: boolean }> => {
    return request<{ ok: boolean }>('/wishlist/items', {
      method: 'POST',
      body: JSON.stringify({ productId }),
    });
  },

  removeItem: async (productId: string): Promise<{ ok: boolean }> => {
    return request<{ ok: boolean }>(`/wishlist/items/${productId}`, {
      method: 'DELETE',
    });
  },
};
