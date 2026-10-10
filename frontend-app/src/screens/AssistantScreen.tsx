import React, { useState } from 'react';
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
import {
  assistantApi,
  ShoppingAssistantResult,
  KnowledgeRagResult,
  OpsQueryResult,
} from '../api/assistant';
import { NeomorphCard } from '../components/NeomorphCard';
import { NeomorphButton } from '../components/NeomorphButton';
import { NeomorphInput } from '../components/NeomorphInput';
import { useCart } from '../context/CartContext';

type AssistantMode = 'shopping' | 'knowledge' | 'ops';

interface AssistantScreenProps {
  initialPrompt?: string;
  initialMode?: AssistantMode;
}

export const AssistantScreen: React.FC<AssistantScreenProps> = ({
  initialPrompt = '',
  initialMode = 'shopping',
}) => {
  const { addToCart } = useCart();
  const [mode, setMode] = useState<AssistantMode>(initialMode);
  const [query, setQuery] = useState<string>(initialPrompt);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Results
  const [shoppingResult, setShoppingResult] = useState<ShoppingAssistantResult | null>(null);
  const [knowledgeResult, setKnowledgeResult] = useState<KnowledgeRagResult | null>(null);
  const [opsResult, setOpsResult] = useState<OpsQueryResult | null>(null);

  const [executingTool, setExecutingTool] = useState<boolean>(false);
  const [toolResultMsg, setToolResultMsg] = useState<string | null>(null);

  const handleSubmit = async (q = query) => {
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    setToolResultMsg(null);

    try {
      if (mode === 'shopping') {
        const res = await assistantApi.queryShopping(q);
        setShoppingResult(res);
      } else if (mode === 'knowledge') {
        const res = await assistantApi.queryKnowledge(q);
        setKnowledgeResult(res);
      } else {
        const res = await assistantApi.queryOps(q);
        setOpsResult(res);
      }
    } catch (err: any) {
      setError(err.message || 'AI request failed');
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteAction = async (action: string, input: any) => {
    setExecutingTool(true);
    setToolResultMsg(null);
    try {
      const res = await assistantApi.executeAgentAction(action, input);
      if (res.ok) {
        setToolResultMsg(`Action "${action}" executed successfully! Order status updated.`);
      } else {
        setToolResultMsg(`Action error: ${res.error || 'Execution blocked'}`);
      }
    } catch (e: any) {
      setToolResultMsg(`Failed: ${e.message}`);
    } finally {
      setExecutingTool(false);
    }
  };

  // Demo prompt presets
  const shoppingPrompts = [
    'Suggest laptop under $1000 for Java+AI',
    'Best smartphone under $500 with good camera',
    'Air fryer for family cooking under $200',
    'Noise cancelling headphones for remote work',
  ];

  const knowledgePrompts = [
    'Can I return opened laptop?',
    'What is the refund timeline for card payments?',
    'What are Prime membership shipping benefits?',
    'How long is the standard warranty on electronics?',
  ];

  const opsPrompts = [
    'Where is ORD-1001? Can I cancel it?',
    'Where is ORD-2001?',
    'List all my recent orders',
    'Check inventory for LAP101',
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Mode Selector Tabs */}
      <View style={styles.tabContainer}>
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabBtn, mode === 'shopping' && styles.activeTabBtn]}
            onPress={() => {
              setMode('shopping');
              setError(null);
            }}
          >
            <Text style={[styles.tabBtnText, mode === 'shopping' && styles.activeTabText]}>
              🛍️ Shopping AI
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, mode === 'knowledge' && styles.activeTabBtn]}
            onPress={() => {
              setMode('knowledge');
              setError(null);
            }}
          >
            <Text style={[styles.tabBtnText, mode === 'knowledge' && styles.activeTabText]}>
              📚 Policy RAG
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, mode === 'ops' && styles.activeTabBtn]}
            onPress={() => {
              setMode('ops');
              setError(null);
            }}
          >
            <Text style={[styles.tabBtnText, mode === 'ops' && styles.activeTabText]}>
              ⚡ Ops Agent
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Description header */}
      <View style={styles.bannerSection}>
        <NeomorphCard variant="raisedSoft" style={styles.modeCard} padding={16}>
          <View style={styles.modeHeader}>
            <Text style={styles.modeIcon}>
              {mode === 'shopping' ? '🛍️' : mode === 'knowledge' ? '📚' : '⚡'}
            </Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.modeTitle}>
                {mode === 'shopping'
                  ? 'Grounded Shopping Discovery'
                  : mode === 'knowledge'
                  ? 'Grounded Policy & Warranty RAG'
                  : 'Audited Agent Operations'}
              </Text>
              <Text style={styles.modeSub}>
                {mode === 'shopping'
                  ? 'Extracts constraints, validates catalog, ranks deterministically with verified DB facts.'
                  : mode === 'knowledge'
                  ? 'Answers strictly from approved docs with citations & confidence ratings.'
                  : 'Orchestrates tool actions (tracking, cancellation, inventory) with safety guards.'}
              </Text>
            </View>
          </View>
        </NeomorphCard>
      </View>

      {/* Preset Prompts (1-Tap Demos) */}
      <View style={styles.presetsSection}>
        <Text style={styles.presetsTitle}>Golden Journey Examples (1-Tap):</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetScroll}>
          {(mode === 'shopping'
            ? shoppingPrompts
            : mode === 'knowledge'
            ? knowledgePrompts
            : opsPrompts
          ).map((p, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.presetPill}
              onPress={() => {
                setQuery(p);
                handleSubmit(p);
              }}
            >
              <Text style={styles.presetPillText}>{p}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Input box */}
      <View style={styles.inputSection}>
        <NeomorphInput
          value={query}
          onChangeText={setQuery}
          placeholder={
            mode === 'shopping'
              ? 'e.g. Suggest laptop under $1000 for Java+AI'
              : mode === 'knowledge'
              ? 'e.g. Can I return opened laptop?'
              : 'e.g. Where is ORD-1001? Can I cancel?'
          }
          onSubmitEditing={() => handleSubmit()}
          icon={<Text style={{ fontSize: 16 }}>✨</Text>}
        />
        <View style={{ marginTop: 10 }}>
          <NeomorphButton
            title={loading ? 'Processing through AI...' : 'Submit to Assistant'}
            onPress={() => handleSubmit()}
            loading={loading}
            variant="primary"
            size="md"
          />
        </View>
      </View>

      {/* Error state */}
      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
        </View>
      )}

      {/* Tool Execution Banner */}
      {toolResultMsg && (
        <View style={styles.toolBanner}>
          <Text style={styles.toolBannerText}>⚡ {toolResultMsg}</Text>
        </View>
      )}

      {/* RESULTS DISPLAY */}

      {/* 1) Shopping Assistant Results */}
      {mode === 'shopping' && shoppingResult && (
        <View style={styles.resultContainer}>
          <NeomorphCard variant="glow" style={styles.resultCard} padding={18}>
            <View style={styles.traceHeader}>
              <View style={styles.traceBadge}>
                <Text style={styles.traceText}>Trace ID: {shoppingResult.traceId}</Text>
              </View>
              {shoppingResult.engine === 'langchain-lcel' && (
                <View style={[styles.budgetPill, { backgroundColor: '#D1FAE5' }]}>
                  <Text style={{ color: '#065F46', fontSize: 10, fontWeight: '800' }}>🦜️🔗 LangChain LCEL</Text>
                </View>
              )}
              {shoppingResult.budget && (
                <View style={styles.budgetPill}>
                  <Text style={styles.budgetText}>Budget: ≤ ${shoppingResult.budget}</Text>
                </View>
              )}
            </View>

            {shoppingResult.interpretedRequirement && (
              <Text style={styles.interpretedText}>
                🎯 Interpreted Need: "{shoppingResult.interpretedRequirement}"
              </Text>
            )}

            {shoppingResult.clarifyingQuestion && (
              <View style={styles.clarifyBox}>
                <Text style={styles.clarifyTitle}>Clarification needed:</Text>
                <Text style={styles.clarifyText}>{shoppingResult.clarifyingQuestion}</Text>
              </View>
            )}

            {shoppingResult.message && (
              <Text style={styles.messageText}>{shoppingResult.message}</Text>
            )}

            {/* Recommendations */}
            <Text style={styles.recSectionTitle}>
              Grounded Recommendations ({shoppingResult.recommendations.length}):
            </Text>

            {shoppingResult.recommendations.map((rec, i) => (
              <View key={rec.productId} style={styles.recCard}>
                <View style={styles.recTopRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.recName}>{rec.productName}</Text>
                    <Text style={styles.recId}>ID: {rec.productId}</Text>
                  </View>
                  <View style={styles.matchBadge}>
                    <Text style={styles.matchText}>{rec.matchType}</Text>
                  </View>
                </View>

                {/* Grounded Explanation */}
                <View style={styles.reasonBox}>
                  <Text style={styles.reasonTitle}>Verified Grounding Reason:</Text>
                  <Text style={styles.reasonText}>{rec.reason}</Text>
                </View>

                <View style={styles.recBottomRow}>
                  <View>
                    <Text style={styles.recPrice}>${rec.price?.toFixed(2)}</Text>
                    <Text style={styles.recScore}>⭐ {rec.rating} • Score: {rec.score}%</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.addCartPill}
                    onPress={() => addToCart(rec.productId, 1)}
                  >
                    <Text style={styles.addCartPillText}>+ Add to Cart</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </NeomorphCard>
        </View>
      )}

      {/* 2) Knowledge RAG Results */}
      {mode === 'knowledge' && knowledgeResult && (
        <View style={styles.resultContainer}>
          <NeomorphCard variant="glow" style={styles.resultCard} padding={18}>
            <View style={styles.traceHeader}>
              <View
                style={[
                  styles.confPill,
                  knowledgeResult.confidence === 'HIGH'
                    ? styles.confHigh
                    : knowledgeResult.confidence === 'MEDIUM'
                    ? styles.confMed
                    : styles.confLow,
                ]}
              >
                <Text style={styles.confText}>
                  Confidence: {knowledgeResult.confidence}
                </Text>
              </View>
              <Text style={styles.traceIdText}>Trace: {knowledgeResult.traceId?.slice(0, 16)}</Text>
            </View>

            {/* Answer */}
            <View style={styles.answerBox}>
              <Text style={styles.answerTitle}>Grounded Policy Answer:</Text>
              <Text style={styles.answerText}>{knowledgeResult.answer}</Text>
            </View>

            {/* Citations */}
            {knowledgeResult.sources?.length > 0 && (
              <View style={styles.citationsSection}>
                <Text style={styles.citationHeader}>Approved Sources & Citations:</Text>
                {knowledgeResult.sources.map((src, i) => (
                  <View key={i} style={styles.sourceCard}>
                    <Text style={styles.sourceDoc}>
                      📄 {src.document} <Text style={styles.sourceSec}>§{src.section}</Text>
                    </Text>
                    <Text style={styles.sourceMeta}>
                      Version: {src.version} • Effective: {src.effectiveDate} • Chunk: {src.chunkId}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </NeomorphCard>
        </View>
      )}

      {/* 3) Ops Agent Results */}
      {mode === 'ops' && opsResult && (
        <View style={styles.resultContainer}>
          <NeomorphCard variant="glow" style={styles.resultCard} padding={18}>
            <View style={styles.traceHeader}>
              <View style={styles.agentPill}>
                <Text style={styles.agentPillText}>
                  {opsResult.selectedAgent || 'Agent Orchestrator'}
                </Text>
              </View>
              <Text style={styles.traceIdText}>Run: {opsResult.agentRunId?.slice(0, 12)}</Text>
            </View>

            <View style={styles.opsAnswerBox}>
              <Text style={styles.opsAnswerTitle}>Factual Status Report:</Text>
              <Text style={styles.opsAnswerText}>{opsResult.answer}</Text>
            </View>

            {/* Suggested actions / tool buttons */}
            {opsResult.suggestedActions?.length > 0 && (
              <View style={styles.actionsSection}>
                <Text style={styles.actionsHeader}>Eligible Agent Actions:</Text>
                {opsResult.suggestedActions.map((act, i) => (
                  <View key={i} style={styles.actionPromptCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.actionName}>Tool: {act.action}</Text>
                      <Text style={styles.actionTarget}>
                        Order: {act.input?.orderId} ({act.input?.reason})
                      </Text>
                    </View>

                    <NeomorphButton
                      title={executingTool ? 'Executing...' : 'Cancel Order (Simulated)'}
                      onPress={() => handleExecuteAction(act.action, act.input)}
                      loading={executingTool}
                      variant="danger"
                      size="sm"
                    />
                  </View>
                ))}
              </View>
            )}
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
  tabContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSunken,
    borderRadius: 24,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(215, 190, 195, 0.4)',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  activeTabBtn: {
    backgroundColor: colors.surface,
    ...Platform.select({
      web: {
        boxShadow: '3px 3px 8px #DECED2, -3px -3px 8px #FFFFFF',
      } as any,
    }),
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: '800',
  },
  bannerSection: {
    paddingHorizontal: 16,
    marginTop: 12,
  },
  modeCard: {
    backgroundColor: '#FAF5F7',
  },
  modeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modeIcon: {
    fontSize: 28,
  },
  modeTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  modeSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  presetsSection: {
    marginTop: 14,
    paddingLeft: 16,
  },
  presetsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 6,
  },
  presetScroll: {
    flexDirection: 'row',
  },
  presetPill: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(225, 29, 72, 0.15)',
    ...Platform.select({
      web: {
        boxShadow: '2px 2px 6px rgba(0,0,0,0.06)',
      } as any,
    }),
  },
  presetPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  inputSection: {
    paddingHorizontal: 16,
    marginTop: 14,
  },
  errorBox: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  errorText: {
    color: '#991B1B',
    fontSize: 13,
    fontWeight: '600',
  },
  toolBanner: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#D1FAE5',
    borderWidth: 1,
    borderColor: '#6EE7B7',
  },
  toolBannerText: {
    color: '#065F46',
    fontSize: 13,
    fontWeight: '700',
  },
  resultContainer: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  resultCard: {
    backgroundColor: '#FCF8F9',
  },
  traceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  traceBadge: {
    backgroundColor: '#FFE4E8',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  traceText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  budgetPill: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  budgetText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0369A1',
  },
  interpretedText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryDark,
    marginBottom: 10,
  },
  clarifyBox: {
    backgroundColor: '#FFFBEB',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 10,
  },
  clarifyTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
  },
  clarifyText: {
    fontSize: 13,
    color: '#78350F',
    marginTop: 2,
  },
  messageText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 10,
  },
  recSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 6,
    marginBottom: 10,
  },
  recCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(225, 29, 72, 0.1)',
  },
  recTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  recName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  recId: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
  },
  matchBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  matchText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#065F46',
  },
  reasonBox: {
    backgroundColor: '#FAF5F7',
    padding: 10,
    borderRadius: 10,
    marginTop: 8,
  },
  reasonTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  reasonText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 17,
  },
  recBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  recPrice: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  recScore: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
  },
  addCartPill: {
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  addCartPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  confPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  confHigh: {
    backgroundColor: '#D1FAE5',
  },
  confMed: {
    backgroundColor: '#FEF3C7',
  },
  confLow: {
    backgroundColor: '#FEE2E2',
  },
  confText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1E1215',
  },
  traceIdText: {
    fontSize: 10,
    color: colors.textMuted,
  },
  answerBox: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(225, 29, 72, 0.1)',
  },
  answerTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 4,
  },
  answerText: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  citationsSection: {
    marginTop: 14,
  },
  citationHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  sourceCard: {
    backgroundColor: '#FAF5F7',
    padding: 10,
    borderRadius: 10,
    marginBottom: 6,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  sourceDoc: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  sourceSec: {
    color: colors.primary,
    fontWeight: '800',
  },
  sourceMeta: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  agentPill: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  agentPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0369A1',
  },
  opsAnswerBox: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(225, 29, 72, 0.1)',
  },
  opsAnswerTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 4,
  },
  opsAnswerText: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  actionsSection: {
    marginTop: 14,
  },
  actionsHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  actionPromptCard: {
    backgroundColor: '#FFF0F2',
    padding: 12,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(225, 29, 72, 0.2)',
  },
  actionName: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  actionTarget: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
