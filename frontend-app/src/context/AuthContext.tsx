import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, authApi } from '../api/auth';
import { setAuthToken } from '../api/client';

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

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => void;
  quickSwitch: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Auto-login default persona (Ananya Rao) for immediate rich interactivity
  useEffect(() => {
    quickSwitch('customer@example.com').finally(() => {
      setIsLoading(false);
    });
  }, []);

  const login = async (email: string, password = 'Password123') => {
    setIsLoading(true);
    try {
      const res = await authApi.login(email, password);
      setAuthToken(res.accessToken);
      setToken(res.accessToken);
      setUser(res.user);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, fullName: string) => {
    setIsLoading(true);
    try {
      const res = await authApi.register(email, password, fullName);
      setAuthToken(res.accessToken);
      setToken(res.accessToken);
      setUser(res.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setAuthToken(null);
    setToken(null);
    setUser(null);
  };

  const quickSwitch = async (email: string) => {
    await login(email, 'Password123');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        quickSwitch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
