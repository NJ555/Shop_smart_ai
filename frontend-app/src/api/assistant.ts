import { request } from './client';

export interface Recommendation {
  productId: string;
  productName: string;
  reason: string;
  price: number;
  rating: number;
  availability: string;
  matchType: 'EXACT' | 'APPROXIMATE';
  score: number;
}

export interface ShoppingAssistantResult {
  conversationId: string;
  interpretedRequirement?: string;
  budget?: number | null;
  recommendations: Recommendation[];
  clarifyingQuestion?: string | null;
  message?: string;
  traceId: string;
  engine?: string;
}

export interface CitationSource {
  document: string;
  section: string;
  version: string;
  effectiveDate: string;
  chunkId: string;
}

export interface KnowledgeRagResult {
  answer: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
  sources: CitationSource[];
  followUpRequired: boolean;
  traceId: string;
  conversationId: string;
  engine?: string;
}

export interface SuggestedAction {
  action: string;
  requiresApproval: boolean;
  input: Record<string, any>;
}

export interface OpsQueryResult {
  answer: string;
  suggestedActions: SuggestedAction[];
  agentRunId: string;
  intent: string;
  selectedAgent: string;
  conversationId: string;
  traceId: string;
  engine?: string;
}

export const assistantApi = {
  queryShopping: async (query: string): Promise<ShoppingAssistantResult> => {
    return request<ShoppingAssistantResult>('/assistant/shopping/query', {
      method: 'POST',
      body: JSON.stringify({ query }),
    });
  },

  queryKnowledge: async (query: string, region?: string, category?: string): Promise<KnowledgeRagResult> => {
    return request<KnowledgeRagResult>('/assistant/knowledge/query', {
      method: 'POST',
      body: JSON.stringify({ query, region, category }),
    });
  },

  queryOps: async (query: string): Promise<OpsQueryResult> => {
    return request<OpsQueryResult>('/assistant/ops/query', {
      method: 'POST',
      body: JSON.stringify({ query }),
    });
  },

  executeAgentAction: async (tool: string, input: Record<string, any>, idempotencyKey?: string) => {
    const headers: Record<string, string> = {};
    if (idempotencyKey) headers['idempotency-key'] = idempotencyKey;

    return request<{ agentRunId: string; ok: boolean; data?: any; error?: string }>('/agent/actions/execute', {
      method: 'POST',
      headers,
      body: JSON.stringify({ tool, input, idempotencyKey }),
    });
  },
};
