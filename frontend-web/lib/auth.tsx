'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, setToken, getToken } from './api';

export type User = {
  id: string;
  email: string;
  fullName?: string;
  role: string;
  membershipTier?: string;
  preferences?: any;
};

export interface SamplePersona {
  email: string;
  name: string;
  role: string;
  membership: string;
  tagline: string;
  scenario: string;
  avatar: string;
}

export const SAMPLE_PERSONAS: SamplePersona[] = [
  {
    email: 'customer@example.com',
    name: 'Ananya Rao',
    role: 'CUSTOMER',
    membership: 'BASIC',
    tagline: 'Student / Dev Shopper',
    scenario: 'Looking for laptop under $1000 for Java + AI. Has 2 past orders.',
    avatar: '👩‍💻',
  },
  {
    email: 'prime@example.com',
    name: 'Rahul Sharma',
    role: 'CUSTOMER',
    membership: 'PRIME',
    tagline: 'Prime Member',
    scenario: 'Ordered Google Pixel 7a. Tracking shipment & checking return policies.',
    avatar: '📦',
  },
  {
    email: 'premium@example.com',
    name: 'Vikram Mehta',
    role: 'CUSTOMER',
    membership: 'PREMIUM',
    tagline: 'VIP Premium Shopper',
    scenario: 'Demands fastest SLA, premium hardware and high-value orders.',
    avatar: '💎',
  },
  {
    email: 'sneha@example.com',
    name: 'Sneha Patel',
    role: 'CUSTOMER',
    membership: 'BASIC',
    tagline: 'Budget & Compare Explorer',
    scenario: 'Comparing budget laptops & accessories; active wishlist saved.',
    avatar: '🔍',
  },
  {
    email: 'meera@example.com',
    name: 'Meera Joshi',
    role: 'CUSTOMER',
    membership: 'BASIC',
    tagline: 'Home & Appliance Buyer',
    scenario: 'Looking for Philips Air Fryer XL; uses plain-language assistant.',
    avatar: '🍳',
  },
  {
    email: 'support@example.com',
    name: 'Support Agent',
    role: 'SUPPORT_AGENT',
    membership: 'PRIME',
    tagline: 'L1 Customer Support',
    scenario: 'Resolves order issues, tracks carrier events, creates support tickets.',
    avatar: '🎧',
  },
  {
    email: 'ops@example.com',
    name: 'Ops Manager',
    role: 'OPS_MANAGER',
    membership: 'PRIME',
    tagline: 'Fulfillment & Inventory',
    scenario: 'Reviews approvals queue, adjusts inventory, oversees audit logs.',
    avatar: '⚙️',
  },
  {
    email: 'catalog@example.com',
    name: 'Catalog Manager',
    role: 'CATALOG_MANAGER',
    membership: 'PRIME',
    tagline: 'Catalog & Products',
    scenario: 'Manages products, categories, specs and pricing.',
    avatar: '🏷️',
  },
  {
    email: 'knowledge@example.com',
    name: 'Knowledge Admin',
    role: 'KNOWLEDGE_ADMIN',
    membership: 'PRIME',
    tagline: 'RAG Knowledge Curator',
    scenario: 'Uploads and activates policy documents, manages chunk embeddings.',
    avatar: '📚',
  },
  {
    email: 'admin@example.com',
    name: 'Admin',
    role: 'ADMIN',
    membership: 'PREMIUM',
    tagline: 'Super Administrator',
    scenario: 'Full platform access across catalog, inventory, audit, and approvals.',
    avatar: '👑',
  },
];

type Ctx = {
  user: User | null;
  token: string | null;
  login: (email: string, password?: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => void;
  quickSwitch: (email: string) => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthCtx = createContext<Ctx>({
  user: null,
  token: null,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  quickSwitch: async () => {},
  refresh: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('ss_user');
      if (cached) {
        try { return JSON.parse(cached); } catch {}
      }
    }
    return null;
  });
  const [token, setTok] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('ss_token');
    }
    return null;
  });

  const saveAuth = (tokenVal: string | null, userVal: User | null) => {
    setToken(tokenVal);
    setTok(tokenVal);
    setUser(userVal);
    if (typeof window !== 'undefined') {
      if (userVal) localStorage.setItem('ss_user', JSON.stringify(userVal));
      else localStorage.removeItem('ss_user');
    }
  };

  const refresh = async () => {
    const t = getToken();
    if (!t) {
      // Auto-authenticate default persona (Ananya Rao) so visitor immediately sees active state
      try {
        await quickSwitch('customer@example.com');
      } catch {
        saveAuth(null, null);
      }
      return;
    }
    try {
      const me = await api<User>('/auth/me');
      saveAuth(t, me);
    } catch {
      // Token expired, fallback to default persona login
      try {
        await quickSwitch('customer@example.com');
      } catch {
        saveAuth(null, null);
      }
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const login = async (email: string, password = 'Password123') => {
    const r: any = await api('/auth/login', {
      method: 'POST',
      body: { email, password },
      auth: false,
    });
    saveAuth(r.accessToken, r.user);
  };

  const register = async (email: string, password: string, fullName: string) => {
    const r: any = await api('/auth/register', {
      method: 'POST',
      body: { email, password, fullName },
      auth: false,
    });
    saveAuth(r.accessToken, r.user);
  };

  const quickSwitch = async (email: string) => {
    await login(email, 'Password123');
  };

  const logout = () => {
    saveAuth(null, null);
  };

  return (
    <AuthCtx.Provider value={{ user, token, login, register, logout, quickSwitch, refresh }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
export const isStaff = (u: User | null) =>
  !!u && ['SUPPORT_AGENT', 'OPS_MANAGER', 'CATALOG_MANAGER', 'KNOWLEDGE_ADMIN', 'ADMIN'].includes(u.role);
