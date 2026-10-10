"""
Diagram 15: Observability, AI Traces, Audit Logging & Testing Strategy
PRD Sections: §19.1 - §19.4, §20.1 - §20.4, §21, Appendix D, Appendix E
Deliverables: 15_observability_audit_eval.png, 15_observability_audit_eval.svg, 15_observability_audit_eval.mmd
"""

import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from common.style import COLORS
from common.renderer import (
    create_canvas,
    draw_group,
    draw_node,
    draw_database,
    draw_arrow,
    draw_legend,
    save_diagram,
)


def generate():
    fig, ax = create_canvas(
        width=17.0,
        height=11.2,
        title="ShopSmart AI — Observability, AI Tracing, Audit Logging & Testing Architecture",
        subtitle="End-to-End Trace Propagation, AI Trace Records, Immutable Audit Logging, Golden Datasets & E2E Demos",
        prd_ref="PRD §19.1 - §19.4, §20.1 - §20.4, §21",
        scope="MVP (OBSERVABLE & TESTED)",
    )

    # 3 Major Horizontal Panels:
    # Top: Observability & Distributed AI Trace Propagation (§19.1 - §19.3)
    # Middle: Audit Logging & Explainability Trail (§19.4)
    # Bottom: Testing Pyramid, Golden RAG Datasets & Live Demo Checklists (§20, §21)

    # --- TOP PANEL: Distributed Tracing & AI Metrics ---
    draw_group(
        ax,
        x=0.6,
        y=6.8,
        width=15.8,
        height=3.4,
        title="1. Distributed Trace Propagation & Micrometer Metrics (PRD §19.1 - §19.3)",
        bg_color=COLORS["group_frontend_bg"],
        border_color=COLORS["group_frontend_border"],
        subtitle="Unified traceId correlated across React Frontend, Spring AI pipelines, Tool execution, and PostgreSQL",
    )

    draw_node(
        ax,
        x=0.9,
        y=7.1,
        width=3.6,
        height=2.7,
        title="Trace ID Lifecycle",
        subtitle_lines=[
            "1. Client Header: X-Trace-Id / MDC",
            "   (e.g. trace_abc123)",
            "2. Bound to Spring Security context",
            "3. Injected into Spring AI Prompts",
            "4. Logged in tool execution frames",
            "5. Returned in JSON error/success",
            "6. Attached to audit log entries",
        ],
        accent_bar_color=COLORS["node_blue_accent"],
        badge="TRACE ID",
    )

    draw_node(
        ax,
        x=4.9,
        y=7.1,
        width=5.4,
        height=2.7,
        title="AI Interaction Trace Schema (assistant_messages.metadata)",
        subtitle_lines=[
            "Persisted JSON Trace Structure:",
            "  conversationId: 'conv_123'",
            "  traceId: 'trace_k_123'",
            "  userQuery: 'Can I return an opened laptop?'",
            "  sanitizedQuery: (clean string, injections stripped)",
            "  retrievedChunks: ['chk_991', 'chk_992'] (with cosine scores)",
            "  rawModelOutput: (unvalidated completion)",
            "  validatedOutput: (Jackson validated response)",
            "  latencyMs: 1420ms | modelProvider: 'mock/openai'",
        ],
        accent_bar_color=COLORS["node_emerald_accent"],
        badge="AI TRACE",
    )

    draw_node(
        ax,
        x=10.7,
        y=7.1,
        width=5.4,
        height=2.7,
        title="Key System Operational Metrics (Micrometer / Actuator)",
        subtitle_lines=[
            "API Latency SLAs (PRD §17.1):",
            "  - Catalog Search p95: < 500ms | PDP: < 300ms",
            "  - Shopping Assistant p95: < 5.0s | RAG: < 7.0s",
            "AI Quality & Reliability Gauges:",
            "  - Grounded Recommendation Hit Rate (%)",
            "  - RAG Citation Accuracy & No-Evidence Fallback Rate",
            "  - Agent Tool Execution Success Rate (> 99%)",
        ],
        accent_bar_color=COLORS["node_indigo_accent"],
        badge="METRICS",
    )

    # --- MIDDLE PANEL: Audit Logging & Explainability Trail ---
    draw_group(
        ax,
        x=0.6,
        y=3.8,
        width=15.8,
        height=2.7,
        title="2. Immutable Audit Logging & Decision Explainability (PRD §19.4)",
        bg_color=COLORS["group_data_bg"],
        border_color=COLORS["group_data_border"],
        subtitle="Complete post-mortem visibility into state mutations, tool actions, and human approvals",
    )

    draw_database(
        ax,
        x=0.9,
        y=4.1,
        width=4.8,
        height=2.0,
        title="audit_logs Table",
        subtitle_lines=[
            "id: UUID (PK), trace_id: VARCHAR",
            "actor_id: UUID, actor_type: USER | AGENT | ADMIN",
            "action: ORDER_CANCEL | REFUND_SIM | STOCK_EDIT",
            "entity_type: 'ORDER', entity_id: 'ord_555'",
            "before_json, after_json: JSONB (state diff)",
            "created_at: TIMESTAMP",
        ],
        badge="IMMUTABLE",
    )

    draw_database(
        ax,
        x=6.1,
        y=4.1,
        width=4.8,
        height=2.0,
        title="agent_runs & tool_calls",
        subtitle_lines=[
            "agent_runs: id (PK), conversation_id (FK),",
            "  intent: 'ORDER_CANCEL', status: COMPLETED",
            "agent_tool_calls: id, run_id (FK), tool_name,",
            "  input_json, output_json, error_code,",
            "  started_at, ended_at, latency_ms",
        ],
        badge="AGENT LOG",
    )

    draw_node(
        ax,
        x=11.3,
        y=4.1,
        width=4.8,
        height=2.0,
        title="Explainability Requirements",
        subtitle_lines=[
            "Customer & Auditor Transparency:",
            "  - Shopping: Cites matched budget, RAM, SSD",
            "  - Policy RAG: Cites doc name, section & version",
            "  - Agent: Displays exact tool invoked & outcome",
            "Zero black-box decisions permitted.",
        ],
        accent_bar_color=COLORS["node_amber_accent"],
        badge="EXPLAINABLE",
    )

    # --- BOTTOM PANEL: Testing Pyramid & Demo Scenarios ---
    draw_group(
        ax,
        x=0.6,
        y=0.9,
        width=15.8,
        height=2.6,
        title="3. Testing Strategy, Golden Evaluation Datasets & Live Evaluation Demos (PRD §20, §21)",
        bg_color=COLORS["group_ops_bg"],
        border_color=COLORS["group_ops_border"],
        subtitle="Multi-level test coverage, ground-truth benchmark datasets, and structured live evaluation flows",
    )

    draw_node(
        ax,
        x=0.9,
        y=1.15,
        width=4.8,
        height=2.0,
        title="Testing Pyramid (PRD §20.1)",
        subtitle_lines=[
            "1. Unit Tests (JUnit 5 / Mockito):",
            "   - State machines, validators, ranking logic",
            "2. Integration Tests (Testcontainers):",
            "   - Real PostgreSQL + PgVector container",
            "   - Outbox poller & mock AI model tests",
            "3. E2E Customer Flow Tests",
        ],
        accent_bar_color=COLORS["node_purple_accent"],
        badge="TEST PYRAMID",
    )

    draw_node(
        ax,
        x=6.1,
        y=1.15,
        width=4.8,
        height=2.0,
        title="RAG Golden Dataset (§20.3)",
        subtitle_lines=[
            "Curated Ground-Truth Benchmark:",
            "  - 20 Policy Q&A Grounded Pairs",
            "  - 5 Product Manual Q&A Pairs",
            "  - 5 No-Answer Fallback Validation Cases",
            "  - 3 Contradictory Policy Resolution Cases",
            "  - 3 Outdated / Superseded Document Tests",
        ],
        accent_bar_color=COLORS["node_emerald_accent"],
        badge="GOLDEN DATASET",
    )

    draw_node(
        ax,
        x=11.3,
        y=1.15,
        width=4.8,
        height=2.0,
        title="5 Live Demo Scenarios (§21)",
        subtitle_lines=[
            "Evaluator Live Verification Checklists:",
            "  Demo 1: AI Product Discovery & Cart Add",
            "  Demo 2: Grounded Policy Q&A with Citations",
            "  Demo 3: Order Tracking & Safe Cancellation",
            "  Demo 4: Admin Catalog & Stock Override",
            "  Demo 5: Failure Recovery & Idempotency",
        ],
        accent_bar_color=COLORS["node_blue_accent"],
        badge="LIVE DEMO",
    )

    # Legend
    legend_items = [
        ("Distributed Tracing & SLAs", COLORS["node_blue_bg"], COLORS["node_blue_border"]),
        ("AI Traces & Schema Validation", COLORS["node_emerald_bg"], COLORS["node_emerald_border"]),
        ("Immutable Audit & Tool Logs", COLORS["node_amber_bg"], COLORS["node_amber_border"]),
        ("Testing Pyramid & Golden Data", COLORS["node_purple_bg"], COLORS["node_purple_border"]),
    ]
    draw_legend(ax, x=0.6, y=0.15, width=15.8, height=0.65, items=legend_items, title="OBSERVABILITY & TESTING LEGEND")

    # Mermaid
    mermaid_code = """flowchart TB
    subgraph Tracing["1. Distributed Tracing & Metrics (Micrometer / Actuator)"]
        TraceId["X-Trace-Id Header<br/>Generated at Gateway"]
        MDC["MDC Logging Context<br/>Propagated to AI & Tools"]
        Metrics["Performance SLAs<br/>Search < 500ms | AI < 5s | RAG < 7s"]
        
        TraceId --> MDC --> Metrics
    end

    subgraph AITrace["2. AI Interaction Trace Record"]
        TraceRecord["assistant_messages.metadata<br/>userQuery, sanitizedQuery, retrievedChunks, rawOutput, validatedOutput, latencyMs"]
    end

    subgraph AuditTrail["3. Immutable Audit Logging & State Diff"]
        Table_Audit[("audit_logs Table<br/>actor, action, before_json, after_json, trace_id")]
        Table_AgentRuns[("agent_runs & agent_tool_calls<br/>runId, tool_name, inputs, outputs, status")]
    end

    subgraph Testing["4. Testing Pyramid & Golden Datasets"]
        UnitTests["Unit Tests (JUnit 5)<br/>Validators, State Machines, Ranking"]
        IntegrationTests["Integration Tests<br/>Testcontainers PostgreSQL + PgVector"]
        GoldenDataset["RAG Golden Dataset<br/>20 Policy Q&A, 5 Manuals, 5 No-Answer, 3 Conflicts"]
        LiveDemos["Live Evaluation Demos<br/>Demo 1-5 End-to-End Scenarios"]

        UnitTests --> IntegrationTests --> GoldenDataset --> LiveDemos
    end

    MDC --> TraceRecord
    TraceRecord --> Table_Audit
    MDC --> Table_AgentRuns

    classDef trace fill:#EFF6FF,stroke:#3B82F6,stroke-width:2px;
    classDef ai fill:#ECFDF5,stroke:#10B981,stroke-width:2px;
    classDef audit fill:#FFFBEB,stroke:#F59E0B,stroke-width:2px;
    classDef test fill:#F5F3FF,stroke:#8B5CF6,stroke-width:2px;

    class TraceId,MDC,Metrics trace;
    class TraceRecord ai;
    class Table_Audit,Table_AgentRuns audit;
    class UnitTests,IntegrationTests,GoldenDataset,LiveDemos test;
"""

    output_base = Path(__file__).resolve().parent / "15_observability_audit_eval"
    return save_diagram(fig, str(output_base), mermaid_code)


if __name__ == "__main__":
    result = generate()
    print("Generated 15_observability_audit_eval:", result)
