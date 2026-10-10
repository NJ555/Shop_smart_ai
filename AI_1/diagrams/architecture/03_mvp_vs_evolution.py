"""
Diagram 03: MVP vs Post-Hackathon Architectural Evolution
PRD Sections: §2.1 - §2.4, §4.2, §23.1 - §23.3
Deliverables: 03_mvp_vs_evolution.png, 03_mvp_vs_evolution.svg, 03_mvp_vs_evolution.mmd
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
        title="ShopSmart AI — MVP vs. Post-Hackathon Architectural Evolution",
        subtitle="Comparing Hackathon Modular Monolith with Production Event-Driven Microservices Target",
        prd_ref="PRD §2.1 - §2.4, §4.2, §23",
        scope="MVP vs FUTURE",
    )

    # Left Column: Hackathon MVP Architecture
    draw_group(
        ax,
        x=0.6,
        y=0.9,
        width=7.6,
        height=9.3,
        title="Hackathon MVP Architecture (Specified Baseline)",
        bg_color=COLORS["group_backend_bg"],
        border_color=COLORS["group_backend_border"],
        subtitle="Modular Monolith, In-Process Events & Controlled Simulation",
    )

    # MVP Frontend
    draw_node(
        ax,
        x=0.9,
        y=8.6,
        width=7.0,
        height=0.9,
        title="React 19 + Vite Frontend SPA",
        subtitle_lines=["Single web application serving Customer, Support, and Admin consoles", "State: React Query / Zustand, REST over HTTP :5173"],
        accent_bar_color=COLORS["node_blue_accent"],
        badge="MVP",
    )

    # MVP Backend
    draw_node(
        ax,
        x=0.9,
        y=6.9,
        width=7.0,
        height=1.4,
        title="Spring Boot 3 Modular Monolith (Java 21)",
        subtitle_lines=[
            "Cohesive in-process modules: auth, catalog, cart, order, shipment, knowledge",
            "Spring ApplicationEventPublisher for internal domain events",
            "Direct Spring AI integration with local/cloud mockable adapters",
            "Transactional outbox table for reliable future event propagation",
        ],
        accent_bar_color=COLORS["node_indigo_accent"],
        badge="MONOLITH",
    )

    # MVP Data Layer
    draw_database(
        ax,
        x=0.9,
        y=5.2,
        width=7.0,
        height=1.4,
        title="PostgreSQL 15 + PgVector (Single DB)",
        subtitle_lines=[
            "Single relational DB instance for all domain data & vector embeddings",
            "HNSW index on knowledge_chunks, JSONB attributes & preferences",
            "Pessimistic locking (SELECT FOR UPDATE) for stock concurrency",
        ],
        badge="SINGLE-REGION",
    )

    # MVP External Boundary (Simulated)
    draw_group(
        ax,
        x=0.9,
        y=2.2,
        width=7.0,
        height=2.7,
        title="Simulated External Boundaries (Out of Scope for MVP)",
        bg_color=COLORS["group_simulated_bg"],
        border_color=COLORS["group_simulated_border"],
        border_style="dashed",
        subtitle="Simulated behind clean service interfaces (PRD §2.4)",
    )

    draw_node(
        ax,
        x=1.1,
        y=3.6,
        width=3.2,
        height=0.9,
        title="Simulated Payments",
        subtitle_lines=["Marked PAID_SIMULATED", "No real money movement"],
        accent_bar_color=COLORS["node_slate_accent"],
        badge="SIMULATED",
    )

    draw_node(
        ax,
        x=4.5,
        y=3.6,
        width=3.2,
        height=0.9,
        title="Simulated Logistics",
        subtitle_lines=["Virtual carrier tracking", "Mock status transitions"],
        accent_bar_color=COLORS["node_slate_accent"],
        badge="SIMULATED",
    )

    draw_node(
        ax,
        x=1.1,
        y=2.4,
        width=3.2,
        height=0.9,
        title="Simulated Inventory",
        subtitle_lines=["Centralized stock counts", "No physical WMS sync"],
        accent_bar_color=COLORS["node_slate_accent"],
        badge="SIMULATED",
    )

    draw_node(
        ax,
        x=4.5,
        y=2.4,
        width=3.2,
        height=0.9,
        title="Mock AI Provider",
        subtitle_lines=["Deterministic test responses", "Demo reliability guarantee"],
        accent_bar_color=COLORS["node_emerald_accent"],
        badge="MOCK",
    )

    # MVP Deployment Box
    draw_node(
        ax,
        x=0.9,
        y=1.1,
        width=7.0,
        height=0.85,
        title="Deployment: Docker Compose Local Stack",
        subtitle_lines=["docker compose up -d db, local JVM & Vite processes"],
        accent_bar_color=COLORS["node_purple_accent"],
    )

    # Right Column: Post-Hackathon Production Target Architecture
    draw_group(
        ax,
        x=8.8,
        y=0.9,
        width=7.6,
        height=9.3,
        title="Post-Hackathon Production Target (Future Roadmap)",
        bg_color=COLORS["group_ai_bg"],
        border_color=COLORS["group_ai_border"],
        subtitle="Event-Driven Microservices, Apache Kafka & Real External Systems",
    )

    # Future Frontend
    draw_node(
        ax,
        x=9.1,
        y=8.6,
        width=7.0,
        height=0.9,
        title="Multi-Platform Frontends & Cloudflare CDN",
        subtitle_lines=["React 19 Web App + Native Mobile (iOS/Android) + Edge SSR", "Global edge caching of catalog assets and category hierarchy"],
        accent_bar_color=COLORS["node_blue_accent"],
        badge="POST-HACKATHON",
    )

    # Future Microservices
    draw_node(
        ax,
        x=9.1,
        y=6.9,
        width=7.0,
        height=1.4,
        title="Domain Microservices & AI Gateway (Kubernetes)",
        subtitle_lines=[
            "Decomposed Services: Auth, Catalog, Cart/Order, Fulfillment, Support",
            "Specialized AI Gateway with rate limiting, semantic caching & guardrails",
            "gRPC for low-latency internal service-to-service communication",
            "Resilience4j circuit breakers, automated failover, autoscaling pods",
        ],
        accent_bar_color=COLORS["node_emerald_accent"],
        badge="MICROSERVICES",
    )

    # Future Event Streaming Backbone (Kafka)
    draw_node(
        ax,
        x=9.1,
        y=5.2,
        width=7.0,
        height=1.4,
        title="Apache Kafka Event Streaming Cluster",
        subtitle_lines=[
            "Topics: order-events, shipment-events, inventory-events, audit-stream",
            "Kafka Connect + Debezium CDC for zero-loss outbox processing",
            "Confluent Schema Registry for strict Avro/Protobuf event contracts",
        ],
        accent_bar_color=COLORS["node_amber_accent"],
        badge="KAFKA CLUSTER",
    )

    # Future Real Integrations Group
    draw_group(
        ax,
        x=9.1,
        y=2.2,
        width=7.0,
        height=2.7,
        title="Real Enterprise Integrations (Production)",
        bg_color="#FFFFFF",
        border_color=COLORS["group_ai_border"],
        subtitle="Production Gateways & Real Logistics (PRD §2.3)",
    )

    draw_node(
        ax,
        x=9.3,
        y=3.6,
        width=3.2,
        height=0.9,
        title="Real Payments Gateway",
        subtitle_lines=["Stripe / Adyen / PayPal", "PCI-DSS compliance & webhooks"],
        accent_bar_color=COLORS["node_emerald_accent"],
        badge="REAL API",
    )

    draw_node(
        ax,
        x=12.7,
        y=3.6,
        width=3.2,
        height=0.9,
        title="Real Carrier Logistics",
        subtitle_lines=["FedEx / UPS / EasyPost APIs", "Live webhook GPS tracking"],
        accent_bar_color=COLORS["node_emerald_accent"],
        badge="REAL API",
    )

    draw_node(
        ax,
        x=9.3,
        y=2.4,
        width=3.2,
        height=0.9,
        title="Real WMS / ERP System",
        subtitle_lines=["SAP / Manhattan WMS", "Multi-warehouse real-time sync"],
        accent_bar_color=COLORS["node_emerald_accent"],
        badge="REAL WMS",
    )

    draw_node(
        ax,
        x=12.7,
        y=2.4,
        width=3.2,
        height=0.9,
        title="Production AI Pipelines",
        subtitle_lines=["LangSmith / OpenTelemetry eval", "Fine-tuned models & LLM cache"],
        accent_bar_color=COLORS["node_emerald_accent"],
        badge="EVAL TRACE",
    )

    # Future Deployment Box
    draw_node(
        ax,
        x=9.1,
        y=1.1,
        width=7.0,
        height=0.85,
        title="Multi-Region Cloud (AWS / GCP) + Multi-AZ PostgreSQL",
        subtitle_lines=["Aurora Multi-Region Read Replicas, Distributed Vector Index, Terraform"],
        accent_bar_color=COLORS["node_purple_accent"],
    )

    # Transition Indicator Arrow in Center
    draw_arrow(
        ax,
        start=(7.6, 5.8),
        end=(8.8, 5.8),
        label="Architectural Evolution\n(Clean Domain Boundaries Enable Split)",
        color=COLORS["arrow_green"],
        label_offset=(0.0, 0.45),
    )

    # Legend
    legend_items = [
        ("Hackathon MVP (Modular Monolith)", COLORS["node_indigo_bg"], COLORS["node_indigo_border"]),
        ("Simulated Hackathon Scope", COLORS["node_slate_bg"], COLORS["node_slate_border"]),
        ("Post-Hackathon Production Target", COLORS["node_emerald_bg"], COLORS["node_emerald_border"]),
        ("Streaming Backbone (Apache Kafka)", COLORS["node_amber_bg"], COLORS["node_amber_border"]),
    ]
    draw_legend(ax, x=0.6, y=0.15, width=15.8, height=0.65, items=legend_items, title="EVOLUTION ROADMAP LEGEND")

    # Mermaid
    mermaid_code = """flowchart LR
    subgraph MVP["Hackathon MVP (Modular Monolith)"]
        direction TB
        FE_MVP["React 19 + Vite Frontend SPA"]
        BE_MVP["Spring Boot 3 Modular Monolith<br/>Java 21, In-Memory Events"]
        DB_MVP[("PostgreSQL 15 + PgVector<br/>Single Database Instance")]
        
        subgraph Sim_MVP["Simulated Boundaries"]
            Sim_Pay["Simulated Payment<br/>PAID_SIMULATED"]
            Sim_Ship["Simulated Carrier Events"]
            Sim_WMS["Central Stock Counter"]
        end

        FE_MVP -->|REST /api/v1| BE_MVP
        BE_MVP -->|JDBC / JPA| DB_MVP
        BE_MVP -.-> Sim_Pay
        BE_MVP -.-> Sim_Ship
        BE_MVP -.-> Sim_WMS
    end

    subgraph Future["Post-Hackathon Production Target"]
        direction TB
        FE_Prod["Multi-Platform Web & Mobile + CDN"]
        
        subgraph Services_Prod["Decomposed Microservices (K8s)"]
            Svc_Auth["Auth Service"]
            Svc_Cat["Catalog Service"]
            Svc_Order["Order & Cart Service"]
            Svc_AI["AI Gateway & Agents"]
            Svc_Ship["Fulfillment Service"]
        end

        Kafka_Prod{{"Apache Kafka Event Bus<br/>order-events, shipment-events"}}
        DB_Prod[("Multi-Region DB Replicas<br/>Distributed PgVector Cluster")]

        subgraph Real_Prod["Real Enterprise Integrations"]
            Real_Pay["Stripe / Adyen Gateway"]
            Real_Ship["FedEx / UPS Carrier APIs"]
            Real_WMS["Enterprise WMS / ERP"]
        end

        FE_Prod --> Services_Prod
        Services_Prod <--> Kafka_Prod
        Services_Prod --> DB_Prod
        Services_Prod --> Real_Pay
        Services_Prod --> Real_Ship
        Services_Prod --> Real_WMS
    end

    MVP ==>|Evolution Path<br/>Extract Modules to Microservices| Future

    classDef mvp fill:#EEF2FF,stroke:#6366F1,stroke-width:2px;
    classDef sim fill:#F1F5F9,stroke:#64748B,stroke-width:2px,stroke-dasharray: 5 5;
    classDef prod fill:#ECFDF5,stroke:#10B981,stroke-width:2px;
    classDef kafka fill:#FEF3C7,stroke:#D97706,stroke-width:2px;

    class FE_MVP,BE_MVP,DB_MVP mvp;
    class Sim_Pay,Sim_Ship,Sim_WMS sim;
    class FE_Prod,Services_Prod,Svc_Auth,Svc_Cat,Svc_Order,Svc_AI,Svc_Ship,DB_Prod,Real_Pay,Real_Ship,Real_WMS prod;
    class Kafka_Prod kafka;
"""

    output_base = Path(__file__).resolve().parent / "03_mvp_vs_evolution"
    return save_diagram(fig, str(output_base), mermaid_code)


if __name__ == "__main__":
    result = generate()
    print("Generated 03_mvp_vs_evolution:", result)
