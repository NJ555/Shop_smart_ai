import { request } from './client';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'CUSTOMER' | 'SUPPORT_AGENT' | 'OPS_MANAGER' | 'CATALOG_MANAGER' | 'KNOWLEDGE_ADMIN' | 'ADMIN' | 'AGENT_RUNTIME';
  membershipTier: 'BASIC' | 'PRIME' | 'PREMIUM';
  preferences?: {
    preferredCategories: string[];
    preferredBrands: string[];
    budgetMin: number | null;
    budgetMax: number | null;
  } | null;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: User;
}

export const authApi = {
  login: async (email: string, password: string):Promise<AuthResponse> => {
    return request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  register: async (email: string, password: string, fullName: string): Promise<AuthResponse> => {
    return request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, fullName }),
    });
  },

  me: async (): Promise<User> => {
    return request<User>('/auth/me');
  },

  updatePreferences: async (prefs: {
    fullName?: string;
    preferredCategories?: string[];
    preferredBrands?: string[];
    budgetMin?: number | null;
    budgetMax?: number | null;
  }) => {
    return request<{ ok: boolean }>('/auth/preferences', {
      method: 'PUT',
      body: JSON.stringify(prefs),
    });
  },
};
