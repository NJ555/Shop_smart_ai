'use client';
import React, { Suspense, useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../lib/api';

type TabType = 'shopping' | 'knowledge' | 'ops';

type Msg = {
  role: 'user' | 'ai';
  text: string;
  data?: any;
  tab?: TabType;
  timestamp: string;
};

const SUGGESTIONS: Record<TabType, string[]> = {
  shopping: [
    'Suggest a laptop under $1000 for Java development and AI projects.',
    'Find a smartphone with 50MP camera and 5000mAh battery.',
    'Show air fryers with digital touchscreen under $150.',
  ],
  knowledge: [
    'Can I return an opened laptop?',
    'What is the return window for Prime members?',
    'How do warranty replacements work for appliances?',
  ],
  ops: [
    'Where is my order ORD-1001? Can I cancel it?',
    'Check shipping status for ORD-1002',
    'What is the status of my order ORD-1003?',
  ],
};

function AssistantContent() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as TabType) || 'shopping';
  const initialQ = searchParams.get('q') || '';

  const [tab, setTab] = useState<TabType>(initialTab);
  const [q, setQ] = useState<string>(initialQ || SUGGESTIONS[initialTab][0]);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [busy, setBusy] = useState(false);
  const [hasAutoRun, setHasAutoRun] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [msgs, busy]);

  const executeQuery = async (queryText: string, currentTab = tab) => {
    if (!queryText.trim() || busy) return;
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMsgs((m) => [...m, { role: 'user', text: queryText, tab: currentTab, timestamp: now }]);
    setBusy(true);

    try {
      if (currentTab === 'shopping') {
        const r: any = await api('/assistant/shopping/query', {
          method: 'POST',
          body: { query: queryText },
        });
        const summary =
          r.clarifyingQuestion ||
          r.message ||
          `${r.interpretedRequirement || 'Found'} — ${r.recommendations?.length || 0} matching product(s)`;
        setMsgs((m) => [
          ...m,
          {
            role: 'ai',
            text: summary,
            data: r,
            tab: currentTab,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      } else if (currentTab === 'knowledge') {
        const r: any = await api('/assistant/knowledge/query', {
          method: 'POST',
          body: { query: queryText },
        });
        setMsgs((m) => [
          ...m,
          {
            role: 'ai',
            text: r.answer,
            data: r,
            tab: currentTab,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      } else {
        const r: any = await api('/assistant/ops/query', {
          method: 'POST',
          body: { query: queryText },
        });
        setMsgs((m) => [
          ...m,
          {
            role: 'ai',
            text: r.answer,
            data: r,
            tab: currentTab,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } catch (e: any) {
      setMsgs((m) => [
        ...m,
        {
          role: 'ai',
          text: `⚠️ Error executing query: ${e.message}`,
          tab: currentTab,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
    setBusy(false);
  };

  useEffect(() => {
    if (initialQ && !hasAutoRun) {
      setHasAutoRun(true);
      executeQuery(initialQ, initialTab);
    }
  }, [initialQ, initialTab]);

  const switchTab = (t: TabType) => {
    setTab(t);
    setQ(SUGGESTIONS[t][0]);
  };

  return (
    <div>
      {/* HEADER */}
      <div className="hero" style={{ padding: '24px', marginBottom: 20 }}>
        <span className="hero-tag">🦜️🔗 LANGCHAIN (LCEL) · TOKENHARBOR DEEPSEEK · CATALOG GROUNDED</span>
        <h1 style={{ fontSize: '26px' }}>ShopSmart AI Intelligence Hub</h1>
        <p style={{ margin: 0, fontSize: '14px' }}>
          Real-time cognitive assistants powered by <b>LangChain LCEL chains</b> for catalog recommendations, cited policy verification, and
          audited order operations.
        </p>

        {/* MODE TABS */}
        <div className="tabs" style={{ margin: '16px 0 0' }}>
          <button
            className={`tab ${tab === 'shopping' ? 'active' : ''}`}
            onClick={() => switchTab('shopping')}
          >
            🛒 Shopping Assistant
          </button>
          <button
            className={`tab ${tab === 'knowledge' ? 'active' : ''}`}
            onClick={() => switchTab('knowledge')}
          >
            📜 Policy Knowledge RAG
          </button>
          <button
            className={`tab ${tab === 'ops' ? 'active' : ''}`}
            onClick={() => switchTab('ops')}
          >
            🤖 Autonomous Ops Agent
          </button>
        </div>
      </div>

      {/* QUICK SUGGESTIONS */}
      <div className="card sunken" style={{ padding: '12px 16px', marginBottom: 16 }}>
        <div className="prompt-pill-label" style={{ marginBottom: 6 }}>
          ⚡ 1-Tap Example Prompts:
        </div>
        <div className="prompt-pills-row" style={{ marginTop: 0 }}>
          {SUGGESTIONS[tab].map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              className="prompt-pill"
              onClick={() => {
                setQ(prompt);
                executeQuery(prompt, tab);
              }}
            >
              <span>✨</span>
              <span>{prompt}</span>
            </button>
          ))}
        </div>
      </div>

      {/* CONVERSATION STREAM */}
      <div className="card glow" style={{ minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {msgs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--muted)' }}>
              <div style={{ fontSize: '40px', marginBottom: 12 }}>
                {tab === 'shopping' ? '🛍️' : tab === 'knowledge' ? '📚' : '⚙️'}
              </div>
              <h3 style={{ margin: '0 0 6px', color: 'var(--ink)' }}>
                {tab === 'shopping'
                  ? 'Shopping AI Assistant'
                  : tab === 'knowledge'
                  ? 'Policy Knowledge RAG'
                  : 'Operations & Order Agent'}
              </h3>
              <p style={{ maxWidth: '500px', margin: '0 auto', fontSize: '13px' }}>
                Ask questions or click any of the 1-tap example pills above to see live TokenHarbor LLM
                grounded responses.
              </p>
            </div>
          ) : (
            msgs.map((m, idx) => (
              <div
                key={idx}
                style={{
                  alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: m.role === 'user' ? '80%' : '94%',
                }}
              >
                {/* User Message */}
                {m.role === 'user' ? (
                  <div
                    style={{
                      background: 'linear-gradient(135deg, #E11D48 0%, #FF4D6D 100%)',
                      color: '#FFFFFF',
                      padding: '12px 18px',
                      borderRadius: '20px 20px 4px 20px',
                      boxShadow: '4px 6px 16px rgba(225, 29, 72, 0.3)',
                      fontWeight: 600,
                      fontSize: '14px',
                    }}
                  >
                    {m.text}
                    <div
                      style={{
                        fontSize: '10px',
                        opacity: 0.8,
                        textAlign: 'right',
                        marginTop: 4,
                      }}
                    >
                      {m.timestamp}
                    </div>
                  </div>
                ) : (
                  /* AI Response */
                  <div
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid var(--line)',
                      padding: '18px',
                      borderRadius: '4px 20px 20px 20px',
                      boxShadow: '4px 6px 16px rgba(0, 0, 0, 0.06)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: '18px' }}>🤖</span>
                      <strong style={{ fontSize: '13px', color: 'var(--primary)' }}>
                        ShopSmart AI
                      </strong>
                      {m.data?.engine === 'langchain-lcel' && (
                        <span className="badge b-green" style={{ fontSize: '10px' }}>
                          🦜️🔗 LangChain LCEL
                        </span>
                      )}
                      {m.data?.confidence && (
                        <span
                          className={`badge ${
                            m.data.confidence === 'HIGH' ? 'b-green' : 'b-amber'
                          }`}
                        >
                          Confidence: {m.data.confidence}
                        </span>
                      )}
                      <span className="muted" style={{ fontSize: '11px', marginLeft: 'auto' }}>
                        {m.timestamp}
                      </span>
                    </div>

                    <div style={{ fontSize: '14px', lineHeight: '22px', color: 'var(--ink)' }}>
                      {m.text}
                    </div>

                    {/* Grounded Recommendations */}
                    {m.data?.recommendations && m.data.recommendations.length > 0 && (
                      <div style={{ marginTop: 16 }}>
                        <div
                          style={{
                            fontSize: '12px',
                            fontWeight: 800,
                            color: 'var(--muted)',
                            textTransform: 'uppercase',
                            marginBottom: 8,
                          }}
                        >
                          Grounded Catalog Matches ({m.data.recommendations.length})
                        </div>
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                            gap: 12,
                          }}
                        >
                          {m.data.recommendations.map((rec: any) => (
                            <div key={rec.productId} className="card sunken" style={{ padding: 14 }}>
                              <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'flex-start',
                                }}
                              >
                                <div>
                                  <Link
                                    href={`/product/${rec.productId}`}
                                    style={{
                                      fontWeight: 800,
                                      fontSize: '14px',
                                      color: 'var(--ink)',
                                      textDecoration: 'none',
                                    }}
                                  >
                                    {rec.productName}
                                  </Link>
                                  <div className="muted" style={{ fontSize: '12px', marginTop: 2 }}>
                                    ${rec.price} · ★ {rec.rating} · Match Score: {rec.score}
                                  </div>
                                </div>
                                <span className="badge b-green">
                                  {rec.availability || 'IN_STOCK'}
                                </span>
                              </div>

                              <div className="reason-box">{rec.reason}</div>

                              <button
                                className="btn"
                                style={{
                                  width: '100%',
                                  padding: '8px 12px',
                                  fontSize: '12px',
                                  marginTop: 8,
                                }}
                                onClick={async () => {
                                  try {
                                    await api('/cart/items', {
                                      method: 'POST',
                                      body: { productId: rec.productId, quantity: 1 },
                                    });
                                    alert(`Added "${rec.productName}" to cart! 🛒`);
                                  } catch (e: any) {
                                    alert(e.message);
                                  }
                                }}
                              >
                                🛒 Add to Cart
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Policy RAG Sources */}
                    {m.data?.sources && m.data.sources.length > 0 && (
                      <div style={{ marginTop: 16 }}>
                        <div
                          style={{
                            fontSize: '12px',
                            fontWeight: 800,
                            color: 'var(--muted)',
                            textTransform: 'uppercase',
                            marginBottom: 8,
                          }}
                        >
                          Verified Document Citations
                        </div>
                        {m.data.sources.map((src: any, sIdx: number) => (
                          <div key={sIdx} className="source-card">
                            <strong style={{ fontSize: '12px', color: 'var(--primary)' }}>
                              📜 {src.document} (v{src.version || 1}) — Section §{src.section}
                            </strong>
                            <div
                              style={{
                                fontSize: '11px',
                                color: 'var(--muted)',
                                marginTop: 4,
                                fontStyle: 'italic',
                              }}
                            >
                              "{src.snippet || src.text || 'Document policy excerpt verified'}"
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Ops Agent Actions */}
                    {m.data?.suggestedActions && m.data.suggestedActions.length > 0 && (
                      <div style={{ marginTop: 16 }}>
                        <div
                          style={{
                            fontSize: '12px',
                            fontWeight: 800,
                            color: 'var(--muted)',
                            textTransform: 'uppercase',
                            marginBottom: 8,
                          }}
                        >
                          Available Autonomous Actions
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {m.data.suggestedActions.map((action: any, aIdx: number) => (
                            <button
                              key={aIdx}
                              className="btn"
                              style={{ padding: '8px 16px', fontSize: '12px' }}
                              onClick={async () => {
                                try {
                                  await api('/agent/actions/execute', {
                                    method: 'POST',
                                    body: {
                                      agentRunId: m.data.agentRunId,
                                      tool: action.action,
                                      input: action.input,
                                    },
                                  });
                                  alert(`Executed action: ${action.action}! Check Orders.`);
                                } catch (e: any) {
                                  alert(e.message);
                                }
                              }}
                            >
                              ⚡ Execute: {action.action}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Ops Reasoning Trace */}
                    {m.data?.steps && m.data.steps.length > 0 && (
                      <div style={{ marginTop: 14 }}>
                        <details style={{ fontSize: '12px', color: 'var(--muted)' }}>
                          <summary style={{ cursor: 'pointer', fontWeight: 700 }}>
                            View Agent Reasoning Trace ({m.data.steps.length} steps)
                          </summary>
                          <div style={{ marginTop: 6, paddingLeft: 12 }}>
                            {m.data.steps.map((step: any, stIdx: number) => (
                              <div key={stIdx} style={{ margin: '4px 0' }}>
                                • {step.thought || step.action || JSON.stringify(step)}
                              </div>
                            ))}
                          </div>
                        </details>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}

          {busy && (
            <div
              style={{
                alignSelf: 'flex-start',
                background: '#FFFFFF',
                padding: '12px 18px',
                borderRadius: '20px',
                border: '1px solid var(--line)',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <span style={{ fontSize: '16px' }}>✨</span>
              <span style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: 600 }}>
                TokenHarbor LLM is synthesizing response...
              </span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* INPUT FORM */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            executeQuery(q, tab);
          }}
          style={{
            display: 'flex',
            gap: 10,
            marginTop: 20,
            paddingTop: 16,
            borderTop: '1px solid var(--line)',
          }}
        >
          <input
            className="input"
            type="text"
            placeholder={
              tab === 'shopping'
                ? 'Describe what product you need (specs, budget, use-case)...'
                : tab === 'knowledge'
                ? 'Ask any policy or return question...'
                : 'Ask order status, tracking, or cancellation...'
            }
            value={q}
            onChange={(e) => setQ(e.target.value)}
            disabled={busy}
          />
          <button type="submit" className="btn" disabled={busy || !q.trim()}>
            {busy ? 'Running...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AssistantPage() {
  return (
    <Suspense fallback={<div className="card">Loading Assistant Hub...</div>}>
      <AssistantContent />
    </Suspense>
  );
}
