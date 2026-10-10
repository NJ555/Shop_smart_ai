"""
Diagram 09: Agentic Operations Architecture & Controlled Tool Execution
PRD Sections: §8.1 - §8.15, §11.11, Appendix C
Deliverables: 09_agentic_operations.png, 09_agentic_operations.svg, 09_agentic_operations.mmd
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
        title="ShopSmart AI — Agentic Operations Architecture & Controlled Tool Execution",
        subtitle="Multi-Agent Orchestration, Strict Tool Allowlists, Idempotency Guard, Human Approval Gate & Audit Trails",
        prd_ref="PRD §8.1 - §8.15, Appendix C",
        scope="MVP (CONTROLLED AGENTS)",
    )

    # 1. Incoming Request & Orchestration Layer (Top Left)
    draw_group(
        ax,
        x=0.6,
        y=5.8,
        width=4.8,
        height=4.4,
        title="1. Request & Orchestrator",
        bg_color=COLORS["group_frontend_bg"],
        border_color=COLORS["group_frontend_border"],
        subtitle="Conversational Intent & Planning",
    )

    draw_node(
        ax,
        x=0.9,
        y=8.2,
        width=4.2,
        height=1.4,
        title="Support Agent / Customer Query",
        subtitle_lines=[
            "Request: 'Where is order ORD-123 and",
            "          can I cancel it?'",
            "POST /api/v1/assistant/ops/query",
            "Caller Token: Role SUPPORT_AGENT / CUSTOMER",
        ],
        accent_bar_color=COLORS["node_blue_accent"],
        badge="INPUT",
    )

    draw_node(
        ax,
        x=0.9,
        y=6.2,
        width=4.2,
        height=1.6,
        title="Orchestrator Agent (Spring AI)",
        subtitle_lines=[
            "Intent Routing & Execution Planning:",
            "  - Parses multi-step goal (Lookup -> Check -> Cancel)",
            "  - Verifies user authorization boundary",
            "  - Dispatches sub-tasks to specialized domain agents",
            "  - Never interacts directly with database",
        ],
        accent_bar_color=COLORS["node_emerald_accent"],
        badge="ORCHESTRATOR",
    )

    draw_arrow(ax, start=(3.0, 8.2), end=(3.0, 7.8), color=COLORS["arrow_dark"])

    # 2. Specialized Domain Agents (Top Right)
    draw_group(
        ax,
        x=5.8,
        y=5.8,
        width=10.6,
        height=4.4,
        title="2. Specialized Domain Agents (Scoped Responsibilities)",
        bg_color=COLORS["group_ai_bg"],
        border_color=COLORS["group_ai_border"],
        subtitle="Domain-bounded sub-agents with strict tool allowlists (PRD §8.3)",
    )

    draw_node(
        ax,
        x=6.1,
        y=8.0,
        width=3.2,
        height=1.6,
        title="Order Support Agent",
        subtitle_lines=[
            "Tools: order.get, order.list",
            "Cancellation eligibility rules:",
            "  - Status != SHIPPED",
            "  - Idempotency key required",
        ],
        accent_bar_color=COLORS["node_emerald_accent"],
        badge="ORDER AGENT",
    )

    draw_node(
        ax,
        x=9.5,
        y=8.0,
        width=3.3,
        height=1.6,
        title="Shipment Tracking Agent",
        subtitle_lines=[
            "Tools: shipment.track",
            "Carrier event analysis:",
            "  - Detects in-transit delays",
            "  - Formats customer timeline",
        ],
        accent_bar_color=COLORS["node_emerald_accent"],
        badge="SHIPMENT AGENT",
    )

    draw_node(
        ax,
        x=13.0,
        y=8.0,
        width=3.2,
        height=1.6,
        title="Inventory Agent",
        subtitle_lines=[
            "Tools: inventory.check,",
            "       catalog.search_alternatives",
            "Suggests real in-stock substitutes",
            "if primary product is unavailable",
        ],
        accent_bar_color=COLORS["node_emerald_accent"],
        badge="INVENTORY AGENT",
    )

    draw_node(
        ax,
        x=6.1,
        y=6.1,
        width=3.2,
        height=1.5,
        title="Knowledge RAG Agent",
        subtitle_lines=[
            "Tools: knowledge.query",
            "Answers return/warranty",
            "policy with source citations",
        ],
        accent_bar_color=COLORS["node_emerald_accent"],
        badge="RAG AGENT",
    )

    draw_node(
        ax,
        x=9.5,
        y=6.1,
        width=3.3,
        height=1.5,
        title="Fulfillment Exception Agent",
        subtitle_lines=[
            "Tools: fulfillment.flag_exception",
            "Flags stuck packages, creates",
            "audit event for ops manager",
        ],
        accent_bar_color=COLORS["node_emerald_accent"],
        badge="EXCEPTION AGENT",
    )

    draw_node(
        ax,
        x=13.0,
        y=6.1,
        width=3.2,
        height=1.5,
        title="Escalation Agent",
        subtitle_lines=[
            "Tools: support.ticket.create,",
            "       support.escalate",
            "Transfers conversation to human",
        ],
        accent_bar_color=COLORS["node_emerald_accent"],
        badge="ESCALATION",
    )

    # Connector from Orchestrator to Domain Agents
    draw_arrow(
        ax,
        start=(5.1, 7.0),
        end=(5.8, 7.0),
        label="Route Intent",
        color=COLORS["arrow_green"],
    )

    # 3. Tool Execution Layer & Invariants (Middle to Bottom Left)
    draw_group(
        ax,
        x=0.6,
        y=0.9,
        width=8.0,
        height=4.6,
        title="3. Controlled Tool Execution Layer & Guardrails",
        bg_color=COLORS["group_security_bg"],
        border_color=COLORS["group_security_border"],
        subtitle="Schema Validation, RBAC Enforcement, Idempotency & Retries (PRD §8.6, §8.11)",
    )

    draw_node(
        ax,
        x=0.9,
        y=3.6,
        width=7.4,
        height=1.4,
        title="Security & Schema Enforcement Interceptor",
        subtitle_lines=[
            "1. JSON Schema Validation: Strict typing on tool input & output",
            "2. RBAC Policy Check: Requires AGENT_RUNTIME role or active user context",
            "3. Idempotency Key Validation: Mutating tools require UUID key header",
            "4. Timeouts & Retries: Reads (2s / 2 retries), Writes (5s / 1 retry)",
        ],
        accent_bar_color=COLORS["node_rose_accent"],
        badge="SECURITY GATE",
    )

    draw_node(
        ax,
        x=0.9,
        y=1.3,
        width=7.4,
        height=2.0,
        title="Controlled Domain Tool Registry",
        subtitle_lines=[
            "Read-Only Tools (Auto-Executed):",
            "  - order.get(orderId) | shipment.track(orderId) | inventory.check(productId)",
            "Controlled Mutating Tools (Protected by Invariants):",
            "  - order.cancel_simulated(orderId, reason, idempotencyKey)",
            "  - refund.create_simulated(orderId, amount, idempotencyKey)",
            "  - support.ticket.create(userId, orderId, category, priority)",
        ],
        accent_bar_color=COLORS["node_rose_accent"],
    )

    # Connector from Agents to Tool Execution Layer
    draw_arrow(
        ax,
        start=(11.0, 5.8),
        end=(4.5, 5.0),
        label="Invoke Authorized Tool Call",
        color=COLORS["arrow_red"],
        connectionstyle="arc3,rad=-0.1",
    )

    # 4. Human-in-the-Loop Approval Gate & Domain Services (Bottom Right)
    draw_group(
        ax,
        x=9.0,
        y=0.9,
        width=7.4,
        height=4.6,
        title="4. Human-in-the-Loop Gate & Audit Trail",
        bg_color=COLORS["group_ops_bg"],
        border_color=COLORS["group_ops_border"],
        subtitle="Admin Approvals for Irreversible Actions & Immutable Logging",
    )

    draw_node(
        ax,
        x=9.3,
        y=3.6,
        width=6.8,
        height=1.4,
        title="Human Approval Gate (Admin Console)",
        subtitle_lines=[
            "Sensitive Actions Halted (Status: PENDING_APPROVAL):",
            "  - Simulated refunds above threshold ($100+)",
            "  - Manual inventory stock adjustments",
            "  - Publishing new policy documents",
            "Ops Manager clicks 'Approve' -> Executes via Domain Service",
        ],
        accent_bar_color=COLORS["node_purple_accent"],
        badge="APPROVAL GATE",
    )

    draw_node(
        ax,
        x=9.3,
        y=1.3,
        width=6.8,
        height=2.0,
        title="Domain Services & Audit Logging",
        subtitle_lines=[
            "Verified Domain Service Execution:",
            "  - OrderService.cancelOrder() [revalidates order state]",
            "  - RefundService.createRefund() [simulated refund issued]",
            "Immutable Persistence:",
            "  - agent_runs table (runId, intent, status, actor_type)",
            "  - agent_tool_calls table (inputs, outputs, latency, status)",
            "  - audit_logs table (before/after state diff)",
        ],
        accent_bar_color=COLORS["node_amber_accent"],
        badge="AUDIT TRAIL",
    )

    # Arrow from Tool Layer to Approval Gate / Services
    draw_arrow(
        ax,
        start=(8.3, 4.3),
        end=(9.3, 4.3),
        label="Sensitive Action Check",
        color=COLORS["arrow_purple"],
    )
    draw_arrow(
        ax,
        start=(12.7, 3.6),
        end=(12.7, 3.3),
        label="Approved -> Execute",
        color=COLORS["arrow_green"],
    )

    # Legend
    legend_items = [
        ("Agent Request & Orchestration", COLORS["node_blue_bg"], COLORS["node_blue_border"]),
        ("Specialized Domain Agents", COLORS["node_emerald_bg"], COLORS["node_emerald_border"]),
        ("Tool Security & Schema Interceptor", COLORS["node_rose_bg"], COLORS["node_rose_border"]),
        ("Human Approval Gate (Admin)", COLORS["node_purple_bg"], COLORS["node_purple_border"]),
        ("Domain Services & Audit Log", COLORS["node_amber_bg"], COLORS["node_amber_border"]),
    ]
    draw_legend(ax, x=0.6, y=0.15, width=15.8, height=0.65, items=legend_items, title="AGENTIC ARCHITECTURE LEGEND")

    # Mermaid
    mermaid_code = """flowchart TB
    subgraph ClientReq["1. User / Support Request"]
        Query["Request: 'Where is ORD-123 and can I cancel it?'<br/>Role: SUPPORT_AGENT / CUSTOMER"]
        Orchestrator["Orchestrator Agent<br/>Intent Planning & Sub-Goal Decomposition"]
        Query --> Orchestrator
    end

    subgraph DomainAgents["2. Specialized Domain Agents"]
        Agent_Order["Order Support Agent<br/>order.get, order.list"]
        Agent_Ship["Shipment Tracking Agent<br/>shipment.track"]
        Agent_Inv["Inventory Agent<br/>inventory.check, alternatives"]
        Agent_RAG["Knowledge Agent<br/>knowledge.query"]
        Agent_Esc["Escalation Agent<br/>support.ticket.create"]
    end

    Orchestrator -->|Route Task| DomainAgents

    subgraph ToolLayer["3. Tool Execution Layer & Invariants"]
        Guard_Auth["RBAC & Security Filter<br/>Verify Caller Role & Allowlist"]
        Guard_Schema["Schema Validator & Idempotency<br/>Validate JSON Schema, Enforce UUID Key"]
        Tool_Registry{{"Tool Execution Router"}}
        
        Guard_Auth --> Guard_Schema --> Tool_Registry
    end

    DomainAgents -->|Invoke Tool| Guard_Auth

    subgraph Approval["4. Human Approval Gate & Domain Services"]
        Check_Sensitive{"Action Sensitive?<br/>(Refund > $100, Stock Edit)"}
        Queue_Approval["Admin Approval Queue<br/>Status: PENDING_APPROVAL"]
        Domain_Services["Domain Services & DB Execution<br/>OrderService, InventoryService"]
        Audit_Log[("Audit & Trace Persistence<br/>agent_runs, agent_tool_calls, audit_logs")]

        Tool_Registry --> Check_Sensitive
        Check_Sensitive -- Yes --> Queue_Approval
        Queue_Approval -- Admin Approves --> Domain_Services
        Check_Sensitive -- No (Read/Safe) --> Domain_Services
        Domain_Services --> Audit_Log
    end

    classDef fe fill:#EFF6FF,stroke:#3B82F6,stroke-width:2px;
    classDef ai fill:#ECFDF5,stroke:#10B981,stroke-width:2px;
    classDef sec fill:#FFE4E6,stroke:#E11D48,stroke-width:2px;
    classDef ops fill:#F5F3FF,stroke:#8B5CF6,stroke-width:2px;
    classDef db fill:#FFFBEB,stroke:#F59E0B,stroke-width:2px;

    class Query,Orchestrator fe;
    class Agent_Order,Agent_Ship,Agent_Inv,Agent_RAG,Agent_Esc ai;
    class Guard_Auth,Guard_Schema,Tool_Registry sec;
    class Check_Sensitive,Queue_Approval ops;
    class Domain_Services,Audit_Log db;
"""

    output_base = Path(__file__).resolve().parent / "09_agentic_operations"
    return save_diagram(fig, str(output_base), mermaid_code)


if __name__ == "__main__":
    result = generate()
    print("Generated 09_agentic_operations:", result)
