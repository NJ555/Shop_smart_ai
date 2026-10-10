"""
Diagram 14: Failure Modes & Recovery Playbooks Architecture
PRD Sections: §14, §15.1 - §15.9
Deliverables: 14_failure_modes_and_recovery.png, 14_failure_modes_and_recovery.svg, 14_failure_modes_and_recovery.mmd
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
    draw_arrow,
    draw_legend,
    save_diagram,
)


def generate():
    fig, ax = create_canvas(
        width=17.0,
        height=11.2,
        title="ShopSmart AI — Failure Modes & Recovery Playbooks Architecture",
        subtitle="Detection, Containment, Compensating Transactions, Idempotent Replays & Graceful Fallbacks",
        prd_ref="PRD §14, §15.1 - §15.9",
        scope="MVP (FAULT TOLERANT)",
    )

    # 4 Quadrants:
    # 1. Checkout & Inventory Failures (Top Left)
    # 2. AI Model & Extraction Failures (Top Right)
    # 3. Knowledge & RAG Retrieval Failures (Bottom Left)
    # 4. Agent Tool & Security Boundary Failures (Bottom Right)

    # --- QUADRANT 1: Checkout & Inventory Failures ---
    draw_group(
        ax,
        x=0.6,
        y=5.8,
        width=7.7,
        height=4.4,
        title="1. Checkout, Stock & Concurrency Failures (§15.2, §15.4)",
        bg_color=COLORS["group_data_bg"],
        border_color=COLORS["group_data_border"],
        subtitle="Idempotency Cache, Pessimistic Lock Rollback & Price Re-checks",
    )

    draw_node(
        ax,
        x=0.9,
        y=8.0,
        width=7.1,
        height=1.8,
        title="Scenario A: Duplicate Checkout Double-Click",
        subtitle_lines=[
            "Detection: Idempotency-Key UUID header conflict in idempotency_keys table",
            "Root Cause: Network lag causing customer to click 'Place Order' twice",
            "Recovery: Replays cached response without creating second order or double charging",
            "Outcome: 200 OK returned with original orderId (Zero duplicate billing)",
        ],
        accent_bar_color=COLORS["node_amber_accent"],
        badge="IDEMPOTENCY",
    )

    draw_node(
        ax,
        x=0.9,
        y=6.0,
        width=7.1,
        height=1.8,
        title="Scenario B: Concurrent Stock Race / Oversell Attempt",
        subtitle_lines=[
            "Detection: available_quantity < cart.quantity during SELECT FOR UPDATE",
            "Root Cause: Multiple shoppers purchasing last remaining unit concurrently",
            "Recovery: Transaction rollback, locks released, cart line item marked OUT_OF_STOCK",
            "Outcome: 409 Conflict returned with alternative in-stock recommendations",
        ],
        accent_bar_color=COLORS["node_rose_accent"],
        badge="CONCURRENCY",
    )

    # --- QUADRANT 2: AI Model & Extraction Failures ---
    draw_group(
        ax,
        x=8.7,
        y=5.8,
        width=7.7,
        height=4.4,
        title="2. AI Model, Timeout & Schema Failures (§15.5)",
        bg_color=COLORS["group_ai_bg"],
        border_color=COLORS["group_ai_border"],
        subtitle="Prompt Retries, Circuit Breakers & Deterministic Catalog Search",
    )

    draw_node(
        ax,
        x=9.0,
        y=8.0,
        width=7.1,
        height=1.8,
        title="Scenario C: Model Timeout (> 10s) / Rate Limit",
        subtitle_lines=[
            "Detection: Spring AI / HTTP Client TimeoutException after 10,000 ms",
            "Root Cause: Provider latency spike, network blip, or rate limit quota",
            "Recovery: Circuit breaker trips -> switches to local keyword search & category facets",
            "Outcome: User receives graceful message: 'AI busy, here are top category laptops'",
        ],
        accent_bar_color=COLORS["node_indigo_accent"],
        badge="TIMEOUT",
    )

    draw_node(
        ax,
        x=9.0,
        y=6.0,
        width=7.1,
        height=1.8,
        title="Scenario D: Malformed JSON Output / Hallucinated Specs",
        subtitle_lines=[
            "Detection: Jackson deserialization / Jakarta Bean Validation failure",
            "Root Cause: LLM non-determinism, missing closing bracket, or hallucinated fields",
            "Recovery: Auto-retries once with corrective prompt; if second failure -> rule fallback",
            "Outcome: System never crashes; invalid payload discarded, trace logged",
        ],
        accent_bar_color=COLORS["node_rose_accent"],
        badge="SCHEMA FAIL",
    )

    # --- QUADRANT 3: Knowledge & RAG Failures ---
    draw_group(
        ax,
        x=0.6,
        y=0.9,
        width=7.7,
        height=4.6,
        title="3. Knowledge Assistant & RAG Evidence Failures (§15.7)",
        bg_color=COLORS["group_ops_bg"],
        border_color=COLORS["group_ops_border"],
        subtitle="Threshold Checks, Conflict Resolution & Safe Fallbacks",
    )

    draw_node(
        ax,
        x=0.9,
        y=3.3,
        width=7.1,
        height=1.9,
        title="Scenario E: Missing Evidence / Unsupported Question",
        subtitle_lines=[
            "Detection: Top-K PgVector cosine similarity score < threshold (0.72)",
            "Root Cause: Question about unseeded policy, personal opinion, or out-of-scope topic",
            "Recovery: Model strictly forbidden from guessing -> confidence set to NONE",
            "Outcome: Safe response: 'I don't have enough approved information to answer that.'",
        ],
        accent_bar_color=COLORS["node_purple_accent"],
        badge="NO EVIDENCE",
    )

    draw_node(
        ax,
        x=0.9,
        y=1.2,
        width=7.1,
        height=1.9,
        title="Scenario F: Contradictory Active Policy Documents",
        subtitle_lines=[
            "Detection: Multiple active chunks state conflicting return windows (e.g. 7d vs 14d)",
            "Root Cause: Overlapping policy revisions during transitional period",
            "Recovery: Prefers latest effectiveDate; sets confidence = LOW; caveats policy variance",
            "Outcome: Suggests support ticket escalation; logs contradiction in Admin review queue",
        ],
        accent_bar_color=COLORS["node_amber_accent"],
        badge="CONFLICT",
    )

    # --- QUADRANT 4: Agent Tool & Operational Failures ---
    draw_group(
        ax,
        x=8.7,
        y=0.9,
        width=7.7,
        height=4.6,
        title="4. Agent Tool, Security & Fulfillment Failures (§15.3, §15.6)",
        bg_color=COLORS["group_security_bg"],
        border_color=COLORS["group_security_border"],
        subtitle="Cancellation Guards, Tool Timeouts & Unauthorized Interceptions",
    )

    draw_node(
        ax,
        x=9.0,
        y=3.3,
        width=7.1,
        height=1.9,
        title="Scenario G: Cancellation Attempt After Shipment Dispatch",
        subtitle_lines=[
            "Detection: Order state machine invariant check: status == 'SHIPPED'",
            "Root Cause: Customer asks assistant to cancel an order already picked up by carrier",
            "Recovery: System rejects transition; cancellation API returns 400 Bad Request",
            "Outcome: Assistant explains: 'Order has already shipped; you may initiate a return upon arrival.'",
        ],
        accent_bar_color=COLORS["node_rose_accent"],
        badge="INVARIANT VIOLATION",
    )

    draw_node(
        ax,
        x=9.0,
        y=1.2,
        width=7.1,
        height=1.9,
        title="Scenario H: Unauthorized Mutation / Tool Timeout",
        subtitle_lines=[
            "Detection: RBAC check fails or tool call exceeds 5s write timeout",
            "Root Cause: Customer token attempting admin tool, or internal service delay",
            "Recovery: Execution halted; audit log records security alert; safe error payload",
            "Outcome: Agent NEVER claims false success; informs user action could not complete",
        ],
        accent_bar_color=COLORS["node_rose_accent"],
        badge="AUTHZ REJECT",
    )

    # Legend
    legend_items = [
        ("Concurrency & Stock Recovery", COLORS["node_amber_bg"], COLORS["node_amber_border"]),
        ("AI Model & Schema Protection", COLORS["node_indigo_bg"], COLORS["node_indigo_border"]),
        ("RAG Grounding & Safe Fallback", COLORS["node_purple_bg"], COLORS["node_purple_border"]),
        ("Security & State Machine Guards", COLORS["node_rose_bg"], COLORS["node_rose_border"]),
    ]
    draw_legend(ax, x=0.6, y=0.15, width=15.8, height=0.65, items=legend_items, title="RECOVERY STRATEGY LEGEND")

    # Mermaid
    mermaid_code = """flowchart TD
    subgraph CommerceFailures["1. Commerce & Stock Failures"]
        F1["Duplicate Checkout Click"] -->|Idempotency Key Conflict| R1["Replay Cached Order Response<br/>Zero duplicate charge"]
        F2["Concurrent Stock Oversell"] -->|SELECT FOR UPDATE Shortage| R2["Transaction Rollback<br/>Return 409 Conflict + Alternatives"]
    end

    subgraph AIFailures["2. AI Model & Schema Failures"]
        F3["Model Timeout (> 10s)"] -->|TimeoutException| R3["Circuit Breaker Fallback<br/>Keyword search + Category Facets"]
        F4["Malformed Model JSON"] -->|Validation Failure| R4["Auto-Retry Once<br/>Deterministic Fallback if fails"]
    end

    subgraph RAGFailures["3. Knowledge & Evidence Failures"]
        F5["Missing Policy Evidence"] -->|Similarity < 0.72| R5["Safe Fallback (confidence: NONE)<br/>Zero hallucination allowed"]
        F6["Contradictory Policies"] -->|Date Comparison| R6["Select Latest effectiveDate<br/>Flag confidence: LOW + Flag Review"]
    end

    subgraph AgentFailures["4. Agent & Security Failures"]
        F7["Cancel Shipped Order"] -->|State Check: SHIPPED| R7["Block Cancellation<br/>Explain shipping status & return SLA"]
        F8["Unauthorized Mutation"] -->|RBAC Filter Fails| R8["Block Action<br/>403 Forbidden + Audit Log Alert"]
    end

    classDef c1 fill:#FEF3C7,stroke:#D97706,stroke-width:2px;
    classDef c2 fill:#EEF2FF,stroke:#6366F1,stroke-width:2px;
    classDef c3 fill:#F5F3FF,stroke:#8B5CF6,stroke-width:2px;
    classDef c4 fill:#FFE4E6,stroke:#E11D48,stroke-width:2px;

    class F1,R1,F2,R2 c1;
    class F3,R3,F4,R4 c2;
    class F5,R5,F6,R6 c3;
    class F7,R7,F8,R8 c4;
"""

    output_base = Path(__file__).resolve().parent / "14_failure_modes_and_recovery"
    return save_diagram(fig, str(output_base), mermaid_code)


if __name__ == "__main__":
    result = generate()
    print("Generated 14_failure_modes_and_recovery:", result)
