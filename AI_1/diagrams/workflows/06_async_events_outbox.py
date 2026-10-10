"""
Diagram 06: Async Events & Transactional Outbox Pattern
PRD Sections: §4.5, §10.2, §12.1 - §12.3, §23.3
Deliverables: 06_async_events_outbox.png, 06_async_events_outbox.svg, 06_async_events_outbox.mmd
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
        title="ShopSmart AI — Transactional Outbox Pattern & Async Event Architecture",
        subtitle="Atomic Local Event Sourcing, Reliable Outbox Poller, Event Contracts, and Decoupled Domain Consumers",
        prd_ref="PRD §4.5, §10.2, §12.1 - §12.3",
        scope="MVP (KAFKA-READY)",
    )

    # 1. Producer Transaction Boundary (Top Left)
    draw_group(
        ax,
        x=0.6,
        y=5.6,
        width=7.8,
        height=4.6,
        title="1. Atomic Transaction Boundary (Single DB Commit)",
        bg_color=COLORS["group_backend_bg"],
        border_color=COLORS["group_backend_border"],
        subtitle="Eliminates 2-Phase Commit & Dual-Write Failure Risks",
    )

    draw_node(
        ax,
        x=0.9,
        y=8.2,
        width=7.2,
        height=1.2,
        title="Domain Producer: Order / Shipment Service",
        subtitle_lines=[
            "@Transactional public OrderResponse checkout(...) {",
            "  orderRepository.save(order);",
            "  outboxRepository.save(new OutboxEvent('order.created', payload));",
            "}",
        ],
        accent_bar_color=COLORS["node_indigo_accent"],
        badge="PRODUCER",
    )

    draw_database(
        ax,
        x=0.9,
        y=6.0,
        width=3.4,
        height=1.8,
        title="orders table",
        subtitle_lines=[
            "id: UUID (PK)",
            "order_number: 'ORD-555'",
            "status: 'CREATED'",
            "total: 1049.00",
            "created_at: TIMESTAMP",
        ],
    )

    draw_database(
        ax,
        x=4.7,
        y=6.0,
        width=3.4,
        height=1.8,
        title="outbox_events table",
        subtitle_lines=[
            "id: UUID (PK)",
            "aggregate_type: 'ORDER'",
            "event_type: 'order.created'",
            "payload: JSONB",
            "status: 'PENDING' -> 'SENT'",
        ],
        badge="OUTBOX",
    )

    # Arrow inside transaction boundary
    draw_arrow(
        ax,
        start=(2.6, 8.2),
        end=(2.6, 7.8),
        label="Insert Entity",
        color=COLORS["arrow_dark"],
    )
    draw_arrow(
        ax,
        start=(6.4, 8.2),
        end=(6.4, 7.8),
        label="Insert Outbox",
        color=COLORS["arrow_dark"],
    )

    # 2. Outbox Relay / Polling Worker (Top Right)
    draw_group(
        ax,
        x=9.0,
        y=5.6,
        width=7.4,
        height=4.6,
        title="2. Reliable Outbox Dispatcher (Spring Poller / CDC)",
        bg_color=COLORS["group_ops_bg"],
        border_color=COLORS["group_ops_border"],
        subtitle="Guaranteed At-Least-Once Delivery to Internal Event Bus",
    )

    draw_node(
        ax,
        x=9.3,
        y=8.2,
        width=6.8,
        height=1.4,
        title="Outbox Event Processor (@Scheduled / Async)",
        subtitle_lines=[
            "1. Queries: SELECT * FROM outbox_events WHERE status='PENDING'",
            "2. Deserializes payload into strongly typed EventContract",
            "3. Dispatches event to ApplicationEventPublisher",
            "4. Updates outbox_events SET status='SENT', sent_at=NOW()",
        ],
        accent_bar_color=COLORS["node_purple_accent"],
        badge="RELAY",
    )

    draw_node(
        ax,
        x=9.3,
        y=6.0,
        width=6.8,
        height=1.8,
        title="Spring In-Process Event Bus (MVP) / Kafka Bridge (Future)",
        subtitle_lines=[
            "MVP Mode: Spring ApplicationEventPublisher (Synchronous/Async thread pool)",
            "Future Mode: Confluent Kafka Producer -> Topic: 'order-events'",
            "Zero refactoring needed in domain services when transitioning to Kafka",
        ],
        accent_bar_color=COLORS["node_amber_accent"],
        badge="EVENT BUS",
    )

    # Arrow from Outbox DB to Outbox Processor
    draw_arrow(
        ax,
        start=(8.1, 6.9),
        end=(9.3, 6.9),
        label="Poll PENDING Events",
        color=COLORS["arrow_green"],
    )

    # Arrow from Processor to Event Bus
    draw_arrow(
        ax,
        start=(12.7, 8.2),
        end=(12.7, 7.8),
        label="Publish Event",
        color=COLORS["arrow_purple"],
    )

    # 3. Asynchronous Event Consumers (Bottom Section)
    draw_group(
        ax,
        x=0.6,
        y=0.9,
        width=15.8,
        height=4.4,
        title="3. Decoupled Asynchronous Domain Consumers & Event Contracts",
        bg_color=COLORS["group_frontend_bg"],
        border_color=COLORS["group_frontend_border"],
        subtitle="Idempotent Event Handlers for Logistics, Inventory Reconciliation, Vector Indexing, and Audits",
    )

    # Consumer 1: Shipment Simulation
    draw_node(
        ax,
        x=0.9,
        y=1.3,
        width=3.5,
        height=3.4,
        title="Shipment Simulator",
        subtitle_lines=[
            "Event: order.created",
            "Handler: @Async @EventListener",
            "Action:",
            "  1. Creates shipment entity",
            "  2. Assigns SIM-TRACK-xxx",
            "  3. Emits LABEL_CREATED",
            "  4. Schedules simulated",
            "     IN_TRANSIT in 5s",
        ],
        accent_bar_color=COLORS["node_blue_accent"],
        badge="LOGISTICS",
    )

    # Consumer 2: Inventory Recovery
    draw_node(
        ax,
        x=4.8,
        y=1.3,
        width=3.5,
        height=3.4,
        title="Inventory Reconciliation",
        subtitle_lines=[
            "Event: order.cancelled",
            "Handler: StockReleaseHandler",
            "Action:",
            "  1. Fetches cancelled items",
            "  2. Atomically increments",
            "     available_quantity",
            "  3. Audits release in",
            "     audit_logs table",
        ],
        accent_bar_color=COLORS["node_amber_accent"],
        badge="STOCK SYNC",
    )

    # Consumer 3: Knowledge Vector Cache
    draw_node(
        ax,
        x=8.7,
        y=1.3,
        width=3.6,
        height=3.4,
        title="Knowledge Re-Indexer",
        subtitle_lines=[
            "Event: knowledge.document_published",
            "Handler: VectorReindexHandler",
            "Action:",
            "  1. Invalidates RAG cache",
            "  2. Marks previous versions",
            "     as SUPERSEDED",
            "  3. Refreshes HNSW index",
        ],
        accent_bar_color=COLORS["node_emerald_accent"],
        badge="RAG INDEX",
    )

    # Consumer 4: Audit & Agent Tracing
    draw_node(
        ax,
        x=12.6,
        y=1.3,
        width=3.5,
        height=3.4,
        title="Audit & Ops Monitor",
        subtitle_lines=[
            "Event: agent.action_completed",
            "Handler: AuditStreamHandler",
            "Action:",
            "  1. Records immutable log",
            "  2. Captures before/after diff",
            "  3. Updates Ops UI via SSE",
            "  4. Emits Micrometer metrics",
        ],
        accent_bar_color=COLORS["node_rose_accent"],
        badge="AUDIT LOG",
    )

    # Arrows from Event Bus to Consumers
    draw_arrow(
        ax,
        start=(10.0, 6.0),
        end=(2.6, 4.7),
        label="order.created",
        color=COLORS["arrow_blue"],
    )
    draw_arrow(
        ax,
        start=(11.5, 6.0),
        end=(6.5, 4.7),
        label="order.cancelled",
        color=COLORS["arrow_amber"],
    )
    draw_arrow(
        ax,
        start=(12.7, 6.0),
        end=(10.5, 4.7),
        label="knowledge.published",
        color=COLORS["arrow_emerald"],
    )
    draw_arrow(
        ax,
        start=(14.0, 6.0),
        end=(14.3, 4.7),
        label="agent.action_completed",
        color=COLORS["arrow_red"],
    )

    # Legend
    legend_items = [
        ("Atomic DB Transaction Boundary", COLORS["node_indigo_bg"], COLORS["node_indigo_border"]),
        ("Outbox Polling & Relay Engine", COLORS["node_purple_bg"], COLORS["node_purple_border"]),
        ("In-Process / Kafka Event Bus", COLORS["node_amber_bg"], COLORS["node_amber_border"]),
        ("Decoupled Asynchronous Consumer", COLORS["node_blue_bg"], COLORS["node_blue_border"]),
    ]
    draw_legend(ax, x=0.6, y=0.15, width=15.8, height=0.65, items=legend_items, title="OUTBOX PATTERN LEGEND")

    # Mermaid
    mermaid_code = """flowchart TB
    subgraph TxBoundary["Atomic Transaction Boundary (PostgreSQL Commit)"]
        DomainSvc["Domain Producer<br/>OrderService.checkout()"]
        Table_Order[("orders Table<br/>Status: CREATED")]
        Table_Outbox[("outbox_events Table<br/>Status: PENDING<br/>Type: order.created")]
        
        DomainSvc -->|Save Entity| Table_Order
        DomainSvc -->|Save Event| Table_Outbox
    end

    subgraph Relay["Outbox Event Relay (Spring @Scheduled / CDC)"]
        Poller["Outbox Event Poller<br/>SELECT WHERE status = PENDING"]
        EventBus{{"Event Publisher<br/>Spring Events (MVP) / Kafka (Future)"}}
        
        Table_Outbox -->|Poll PENDING| Poller
        Poller -->|Publish Event| EventBus
        Poller -.->|UPDATE status = SENT| Table_Outbox
    end

    subgraph Consumers["Decoupled Domain Consumers (@Async / Listeners)"]
        C_Ship["Shipment Simulator<br/>order.created -> Create Tracking & LABEL_CREATED"]
        C_Inv["Inventory Reconciliation<br/>order.cancelled -> Release Reserved Stock"]
        C_RAG["Knowledge Re-Indexer<br/>knowledge.document_published -> Invalidate Vector Cache"]
        C_Audit["Audit & Ops Stream<br/>agent.action_completed -> Append Immutable Audit Log"]
    end

    EventBus -->|order.created| C_Ship
    EventBus -->|order.cancelled| C_Inv
    EventBus -->|doc.published| C_RAG
    EventBus -->|action.completed| C_Audit

    classDef tx fill:#EEF2FF,stroke:#6366F1,stroke-width:2px;
    classDef relay fill:#F5F3FF,stroke:#8B5CF6,stroke-width:2px;
    classDef bus fill:#FEF3C7,stroke:#D97706,stroke-width:2px;
    classDef consumer fill:#EFF6FF,stroke:#3B82F6,stroke-width:2px;

    class DomainSvc,Table_Order,Table_Outbox tx;
    class Poller relay;
    class EventBus bus;
    class C_Ship,C_Inv,C_RAG,C_Audit consumer;
"""

    output_base = Path(__file__).resolve().parent / "06_async_events_outbox"
    return save_diagram(fig, str(output_base), mermaid_code)


if __name__ == "__main__":
    result = generate()
    print("Generated 06_async_events_outbox:", result)
