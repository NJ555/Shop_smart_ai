"""
Diagram 01: System Architecture Overview (Modular Monolith)
PRD Sections: §4.1, §4.2, §4.3, §4.4, §10, §22
Deliverables: 01_system_overview.png, 01_system_overview.svg, 01_system_overview.mmd
"""

import os
import sys
from pathlib import Path

# Add diagrams root to sys.path
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
        title="ShopSmart AI — System Architecture Overview (Modular Monolith)",
        subtitle="End-to-End Component Boundaries, AI Layer Integration, and Grounded Data Persistence",
        prd_ref="PRD §4.1 - §4.5, §10, §22",
        scope="MVP",
    )

    # 1. Frontend Layer Group
    draw_group(
        ax,
        x=0.8,
        y=8.8,
        width=15.4,
        height=1.4,
        title="Frontend Layer (React 19 + Vite - Responsive Web Application)",
        bg_color=COLORS["group_frontend_bg"],
        border_color=COLORS["group_frontend_border"],
        subtitle="Customer Storefront, Assistant Interfaces, Support Workspace & Admin Operations",
    )

    # Frontend Nodes
    draw_node(
        ax,
        x=1.1,
        y=9.0,
        width=2.7,
        height=0.85,
        title="Customer Storefront",
        subtitle_lines=["Search, Filters, PDP, Compare", "Cart & Wishlist UI"],
        accent_bar_color=COLORS["node_blue_accent"],
        bg_color=COLORS["node_blue_bg"],
        border_color=COLORS["node_blue_border"],
    )

    draw_node(
        ax,
        x=4.2,
        y=9.0,
        width=2.8,
        height=0.85,
        title="AI Shopping Assistant UI",
        subtitle_lines=["NL Conversational Query", "Grounded Recs & Reasons"],
        accent_bar_color=COLORS["node_emerald_accent"],
        bg_color=COLORS["node_emerald_bg"],
        border_color=COLORS["node_emerald_border"],
    )

    draw_node(
        ax,
        x=7.4,
        y=9.0,
        width=2.8,
        height=0.85,
        title="Knowledge Assistant UI",
        subtitle_lines=["Policy & Manual Q&A", "Source Citations & Badges"],
        accent_bar_color=COLORS["node_emerald_accent"],
        bg_color=COLORS["node_emerald_bg"],
        border_color=COLORS["node_emerald_border"],
    )

    draw_node(
        ax,
        x=10.6,
        y=9.0,
        width=2.6,
        height=0.85,
        title="Support Agent Console",
        subtitle_lines=["Customer / Order Context", "Consistent Policy Answers"],
        accent_bar_color=COLORS["node_purple_accent"],
        bg_color=COLORS["node_purple_bg"],
        border_color=COLORS["node_purple_border"],
    )

    draw_node(
        ax,
        x=13.6,
        y=9.0,
        width=2.3,
        height=0.85,
        title="Admin Ops Console",
        subtitle_lines=["Catalog, Docs, Inventory", "Action Approval Queue"],
        accent_bar_color=COLORS["node_purple_accent"],
        bg_color=COLORS["node_purple_bg"],
        border_color=COLORS["node_purple_border"],
    )

    # Arrow from Frontend to Backend
    draw_arrow(
        ax,
        start=(8.5, 8.8),
        end=(8.5, 8.1),
        label="HTTPS / REST JSON (/api/v1/*) + Bearer JWT",
        color=COLORS["arrow_dark"],
    )

    # 2. Backend Layer Group (Modular Monolith)
    draw_group(
        ax,
        x=0.8,
        y=3.5,
        width=15.4,
        height=4.6,
        title="Spring Boot 3 Backend (Modular Monolith - Java 21)",
        bg_color=COLORS["group_backend_bg"],
        border_color=COLORS["group_backend_border"],
        subtitle="Cohesive Domain Modules, Spring AI Integration, and Strict Cross-Cutting Enforcement",
    )

    # Cross-Cutting Gateway / Filter Bar
    draw_node(
        ax,
        x=1.1,
        y=7.2,
        width=14.8,
        height=0.6,
        title="Cross-Cutting Gateway: JWT Auth Filter | RBAC Authorization | Jakarta Validation | Idempotency Interceptor | Micrometer Tracing",
        accent_bar_color=COLORS["node_rose_accent"],
        bg_color=COLORS["node_rose_bg"],
        border_color=COLORS["node_rose_border"],
    )

    # Core Domain Modules (Row 1)
    draw_node(
        ax,
        x=1.1,
        y=5.8,
        width=2.2,
        height=1.15,
        title="Identity & Profile",
        subtitle_lines=["User Auth, Roles", "Preferences, Tiers", "BCrypt Hashing"],
        accent_bar_color=COLORS["node_indigo_accent"],
    )

    draw_node(
        ax,
        x=3.6,
        y=5.8,
        width=2.2,
        height=1.15,
        title="Catalog & Search",
        subtitle_lines=["Hierarchical Categories", "Attributes, Pricing", "Filtering & Sorting"],
        accent_bar_color=COLORS["node_indigo_accent"],
    )

    draw_node(
        ax,
        x=6.1,
        y=5.8,
        width=2.2,
        height=1.15,
        title="Cart & Wishlist",
        subtitle_lines=["Stock-Capped Items", "Server Recalculation", "Item State Validate"],
        accent_bar_color=COLORS["node_indigo_accent"],
    )

    draw_node(
        ax,
        x=8.6,
        y=5.8,
        width=2.3,
        height=1.15,
        title="Order & Checkout",
        subtitle_lines=["Idempotent Checkout", "Pessimistic Stock Lock", "Price Snapshotting"],
        accent_bar_color=COLORS["node_indigo_accent"],
    )

    draw_node(
        ax,
        x=11.2,
        y=5.8,
        width=2.3,
        height=1.15,
        title="Shipment Service",
        subtitle_lines=["Simulated Carrier Events", "Tracking Timeline", "ETA Calculation"],
        accent_bar_color=COLORS["node_slate_accent"],
        badge="SIMULATED",
    )

    draw_node(
        ax,
        x=13.8,
        y=5.8,
        width=2.1,
        height=1.15,
        title="Support & Tickets",
        subtitle_lines=["Ticket Escalation", "Ops Case Queue", "Conversation Log"],
        accent_bar_color=COLORS["node_indigo_accent"],
    )

    # AI Subsystem Box (Nested inside Backend)
    draw_group(
        ax,
        x=1.1,
        y=3.8,
        width=10.0,
        height=1.75,
        title="Spring AI Subsystem (Grounded Intelligence)",
        bg_color=COLORS["group_ai_bg"],
        border_color=COLORS["group_ai_border"],
        subtitle="Prompt Guardrails, Strict Catalog Grounding, and Deterministic Fallbacks",
    )

    draw_node(
        ax,
        x=1.3,
        y=4.0,
        width=3.0,
        height=1.05,
        title="AI Shopping Assistant",
        subtitle_lines=["NL Constraint Extraction", "DB Catalog Ranking", "Factual Reasons"],
        accent_bar_color=COLORS["node_emerald_accent"],
        badge="GROUNDED",
    )

    draw_node(
        ax,
        x=4.6,
        y=4.0,
        width=3.0,
        height=1.05,
        title="Knowledge RAG Engine",
        subtitle_lines=["Chunk Ingestion (PDF/MD)", "Hybrid Vector Retrieval", "Citations & Confidence"],
        accent_bar_color=COLORS["node_emerald_accent"],
        badge="CITED",
    )

    draw_node(
        ax,
        x=7.9,
        y=4.0,
        width=3.0,
        height=1.05,
        title="Agentic Orchestrator",
        subtitle_lines=["Intent Planning & Routing", "Controlled Tool Execution", "Human Approval Gates"],
        accent_bar_color=COLORS["node_emerald_accent"],
        badge="CONTROLLED",
    )

    # Operations & Outbox Subsystems
    draw_node(
        ax,
        x=11.4,
        y=4.0,
        width=2.3,
        height=1.35,
        title="Admin Ops & Audit",
        subtitle_lines=["Catalog / Doc CRUD", "Stock Manual Adjust", "Immutable Audit Log"],
        accent_bar_color=COLORS["node_purple_accent"],
    )

    draw_node(
        ax,
        x=14.0,
        y=4.0,
        width=1.9,
        height=1.35,
        title="Transactional Outbox",
        subtitle_lines=["Event Publishing", "Async State Sync", "Future Kafka Ready"],
        accent_bar_color=COLORS["node_slate_accent"],
    )

    # Arrows from Backend to Data Layer
    draw_arrow(
        ax,
        start=(5.5, 3.5),
        end=(5.5, 2.7),
        label="Spring Data JPA / JDBC / Vector Queries",
        color=COLORS["arrow_dark"],
    )

    draw_arrow(
        ax,
        start=(12.5, 3.5),
        end=(12.5, 2.7),
        label="Audit & Event Persistence",
        color=COLORS["arrow_dark"],
    )

    # 3. Data Layer Group (PostgreSQL + PgVector)
    draw_group(
        ax,
        x=0.8,
        y=0.9,
        width=11.2,
        height=1.8,
        title="Data Persistence Layer (PostgreSQL 15+ Single Source of Truth)",
        bg_color=COLORS["group_data_bg"],
        border_color=COLORS["group_data_border"],
        subtitle="Relational Integrity, PgVector Embeddings, Audit Trail & Idempotency Storage",
    )

    draw_database(
        ax,
        x=1.1,
        y=1.1,
        width=2.5,
        height=1.1,
        title="Relational Domain",
        subtitle_lines=["users, products, categories", "inventory_levels, carts, orders"],
    )

    draw_database(
        ax,
        x=3.9,
        y=1.1,
        width=2.6,
        height=1.1,
        title="PgVector Store",
        subtitle_lines=["knowledge_documents", "knowledge_chunks (HNSW vector)"],
        badge="VECTOR",
    )

    draw_database(
        ax,
        x=6.8,
        y=1.1,
        width=2.4,
        height=1.1,
        title="AI Runs & Traces",
        subtitle_lines=["assistant_conversations", "agent_runs, agent_tool_calls"],
    )

    draw_database(
        ax,
        x=9.5,
        y=1.1,
        width=2.2,
        height=1.1,
        title="Audit & Events",
        subtitle_lines=["audit_logs, outbox_events", "idempotency_keys"],
    )

    # 4. External / Simulated Boundaries Group
    draw_group(
        ax,
        x=12.3,
        y=0.9,
        width=3.9,
        height=1.8,
        title="Simulated External Boundaries",
        bg_color=COLORS["group_simulated_bg"],
        border_color=COLORS["group_simulated_border"],
        border_style="dashed",
        subtitle="Explicit Hackathon Scope Isolation",
    )

    draw_node(
        ax,
        x=12.5,
        y=1.1,
        width=1.7,
        height=1.1,
        title="Simulated Logistics",
        subtitle_lines=["Virtual Carrier", "Shipment Events", "Mock Tracking"],
        badge="MOCK",
        bg_color=COLORS["node_slate_bg"],
        border_color=COLORS["node_slate_border"],
    )

    draw_node(
        ax,
        x=14.3,
        y=1.1,
        width=1.7,
        height=1.1,
        title="Model Adapters",
        subtitle_lines=["Mock AI Mode", "OpenAI / Ollama", "Deterministic Demo"],
        badge="SWAPPABLE",
        bg_color=COLORS["node_slate_bg"],
        border_color=COLORS["node_slate_border"],
    )

    # Legend
    legend_items = [
        ("Frontend (React 19 / Vite)", COLORS["node_blue_bg"], COLORS["node_blue_border"]),
        ("Backend Services (Java 21 / Spring)", COLORS["node_indigo_bg"], COLORS["node_indigo_border"]),
        ("AI / RAG / Agents (Spring AI)", COLORS["node_emerald_bg"], COLORS["node_emerald_border"]),
        ("Data Layer (Postgres + PgVector)", COLORS["node_amber_bg"], COLORS["node_amber_border"]),
        ("Simulated / Out-of-Scope Boundary", COLORS["node_slate_bg"], COLORS["node_slate_border"]),
    ]
    draw_legend(ax, x=0.8, y=0.1, width=15.4, height=0.68, items=legend_items, title="ARCHITECTURE COMPONENT LEGEND")

    # Mermaid Representation
    mermaid_code = """flowchart TB
    subgraph Frontend["Frontend Layer (React 19 + Vite)"]
        UI_Store["Customer Storefront<br/>Search, Filters, PDP, Cart, Wishlist"]
        UI_ShopAI["AI Shopping Assistant UI<br/>NL Queries, Grounded Recommendations"]
        UI_RAG["Knowledge Assistant UI<br/>Policy Q&A with Citations"]
        UI_Support["Support Agent Console<br/>Customer & Order Context"]
        UI_Admin["Admin Ops Console<br/>Catalog, Docs, Approvals"]
    end

    subgraph Backend["Spring Boot 3 Backend (Modular Monolith)"]
        Gateway["Cross-Cutting Gateway: JWT Auth | RBAC | Validation | Idempotency | Tracing"]
        
        subgraph DomainModules["Core Domain Modules"]
            Mod_Auth["Identity & Profile<br/>Users, Preferences, Tiers"]
            Mod_Cat["Catalog & Search<br/>Categories, Products, Attributes"]
            Mod_Cart["Cart & Wishlist<br/>Stock Limits, Recalculation"]
            Mod_Order["Order & Checkout<br/>Atomicity, Locks, Snapshots"]
            Mod_Ship["Shipment Service<br/>Simulated Carrier Events"]
            Mod_Support["Support & Tickets<br/>Escalations & Logging"]
        end

        subgraph AISubsystem["Spring AI Subsystem"]
            AI_Shop["AI Shopping Assistant<br/>Grounded Ranking & Reasons"]
            AI_RAG["Knowledge RAG Engine<br/>PgVector Hybrid Search & Citations"]
            AI_Agent["Agentic Orchestrator<br/>Tools, Routing & Human Approvals"]
        end

        Mod_Ops["Admin Ops & Audit Logger"]
        Mod_Outbox["Transactional Outbox Publisher"]
    end

    subgraph DataLayer["Data Layer (PostgreSQL 15+ Single Source of Truth)"]
        DB_Rel["Relational Tables<br/>users, products, carts, orders, inventory"]
        DB_Vec["PgVector Store<br/>knowledge_documents, knowledge_chunks"]
        DB_Audit["Audit & State Tables<br/>audit_logs, agent_runs, idempotency_keys, outbox_events"]
    end

    subgraph SimulatedExt["Simulated Boundaries (Hackathon Scope)"]
        Sim_Logistics["Simulated Carrier & Logistics Engine"]
        Sim_AI["Mock / External AI Provider (OpenAI/Ollama/Mock)"]
    end

    Frontend -->|HTTPS REST /api/v1/* + JWT| Gateway
    Gateway --> DomainModules
    Gateway --> AISubsystem
    DomainModules --> DB_Rel
    AISubsystem --> DB_Vec
    AISubsystem --> DB_Rel
    Mod_Order --> Mod_Outbox
    Mod_Outbox --> DB_Audit
    Mod_Ops --> DB_Audit
    Mod_Ship -.-> Sim_Logistics
    AISubsystem -.-> Sim_AI

    classDef fe fill:#EFF6FF,stroke:#3B82F6,stroke-width:2px;
    classDef be fill:#EEF2FF,stroke:#6366F1,stroke-width:2px;
    classDef ai fill:#ECFDF5,stroke:#10B981,stroke-width:2px;
    classDef db fill:#FFFBEB,stroke:#F59E0B,stroke-width:2px;
    classDef sim fill:#F1F5F9,stroke:#64748B,stroke-width:2px,stroke-dasharray: 5 5;

    class UI_Store,UI_ShopAI,UI_RAG,UI_Support,UI_Admin fe;
    class Gateway,Mod_Auth,Mod_Cat,Mod_Cart,Mod_Order,Mod_Ship,Mod_Support,Mod_Ops,Mod_Outbox be;
    class AI_Shop,AI_RAG,AI_Agent ai;
    class DB_Rel,DB_Vec,DB_Audit db;
    class Sim_Logistics,Sim_AI sim;
"""

    output_base = Path(__file__).resolve().parent / "01_system_overview"
    return save_diagram(fig, str(output_base), mermaid_code)


if __name__ == "__main__":
    result = generate()
    print("Generated 01_system_overview:", result)
