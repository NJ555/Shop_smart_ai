"""
Diagram 10: Complete Database ERD & Relational Schema
PRD Sections: §10.1, §10.2
Deliverables: 10_entity_relationship_diagram.png, 10_entity_relationship_diagram.svg, 10_entity_relationship_diagram.mmd
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
        title="ShopSmart AI — Complete Database Relational Schema & Entity Relationships",
        subtitle="17 Core Relational Entities: Identity, Catalog, Inventory, Commerce, Logistics, Support, PgVector RAG, Audit & Outbox",
        prd_ref="PRD §10.1, §10.2",
        scope="MVP SCHEMA",
    )

    # 4 Major Domain Clusters:
    # 1. Identity & Commerce (Top Left)
    # 2. Catalog & Inventory (Top Right)
    # 3. Orders, Logistics & Support (Bottom Left)
    # 4. Knowledge PgVector, AI Traces, Audit & Outbox (Bottom Right)

    # --- CLUSTER 1: Identity & Commerce (Top Left) ---
    draw_group(
        ax,
        x=0.6,
        y=5.8,
        width=7.8,
        height=4.4,
        title="1. Identity, Preferences & Shopping Cart",
        bg_color=COLORS["group_frontend_bg"],
        border_color=COLORS["group_frontend_border"],
        subtitle="User Profiles, Membership Tiers, Wishlists & Session Carts",
    )

    draw_database(
        ax,
        x=0.9,
        y=8.0,
        width=3.5,
        height=1.8,
        title="users",
        subtitle_lines=[
            "id: UUID (PK)",
            "email: VARCHAR(255) UNIQUE",
            "password_hash: VARCHAR(255)",
            "role: CUSTOMER | ADMIN...",
            "membership_tier: BASIC/PRIME",
            "status: ACTIVE | SUSPENDED",
        ],
    )

    draw_database(
        ax,
        x=4.7,
        y=8.0,
        width=3.4,
        height=1.8,
        title="customer_preferences",
        subtitle_lines=[
            "user_id: UUID (PK, FK users)",
            "preferred_categories: JSONB",
            "preferred_brands: JSONB",
            "budget_min, budget_max: NUM",
            "updated_at: TIMESTAMP",
        ],
    )

    draw_database(
        ax,
        x=0.9,
        y=6.0,
        width=3.5,
        height=1.8,
        title="carts / cart_items",
        subtitle_lines=[
            "carts: id (PK), user_id (FK), status",
            "cart_items: id (PK), cart_id (FK),",
            "  product_id (FK products),",
            "  quantity: INT >= 1",
            "UNIQUE(cart_id, product_id)",
        ],
    )

    draw_database(
        ax,
        x=4.7,
        y=6.0,
        width=3.4,
        height=1.8,
        title="wishlists / items",
        subtitle_lines=[
            "wishlists: id (PK), user_id (FK)",
            "wishlist_items: id (PK),",
            "  wishlist_id (FK),",
            "  product_id (FK products)",
            "UNIQUE(wishlist_id, product_id)",
        ],
    )

    # --- CLUSTER 2: Catalog & Inventory (Top Right) ---
    draw_group(
        ax,
        x=8.6,
        y=5.8,
        width=7.8,
        height=4.4,
        title="2. Catalog Taxonomy, Products & Inventory",
        bg_color=COLORS["group_data_bg"],
        border_color=COLORS["group_data_border"],
        subtitle="Hierarchy, EAV Attributes, Image Assets & Concurrency Locks",
    )

    draw_database(
        ax,
        x=8.9,
        y=8.0,
        width=3.5,
        height=1.8,
        title="categories",
        subtitle_lines=[
            "id: UUID (PK)",
            "name: VARCHAR(255)",
            "slug: VARCHAR(255) UNIQUE",
            "parent_id: UUID (FK self nullable)",
            "is_active: BOOLEAN default TRUE",
        ],
    )

    draw_database(
        ax,
        x=12.7,
        y=8.0,
        width=3.4,
        height=1.8,
        title="inventory_levels",
        subtitle_lines=[
            "product_id: UUID (PK, FK products)",
            "available_quantity: INT >= 0",
            "reserved_quantity: INT >= 0",
            "version: INT (Locking)",
            "updated_at: TIMESTAMP",
        ],
        badge="LOCKING",
    )

    draw_database(
        ax,
        x=8.9,
        y=6.0,
        width=3.5,
        height=1.8,
        title="products",
        subtitle_lines=[
            "id: UUID (PK)",
            "name, slug (UNIQUE), brand",
            "category_id: UUID (FK categories)",
            "price: NUMERIC(12,2) > 0",
            "rating: NUMERIC(3,2)",
            "is_active: BOOLEAN",
        ],
    )

    draw_database(
        ax,
        x=12.7,
        y=6.0,
        width=3.4,
        height=1.8,
        title="product_attributes & imgs",
        subtitle_lines=[
            "attributes: id, product_id (FK),",
            "  key (e.g. ram), value (16GB)",
            "images: id, product_id (FK),",
            "  url, is_primary, display_order",
        ],
    )

    # --- CLUSTER 3: Orders, Logistics & Support (Bottom Left) ---
    draw_group(
        ax,
        x=0.6,
        y=0.9,
        width=7.8,
        height=4.6,
        title="3. Orders, Snapshots, Shipments & Support",
        bg_color=COLORS["group_backend_bg"],
        border_color=COLORS["group_backend_border"],
        subtitle="Idempotent Purchases, Price Freezing, Carrier Events & Tickets",
    )

    draw_database(
        ax,
        x=0.9,
        y=3.3,
        width=3.5,
        height=2.0,
        title="orders & order_items",
        subtitle_lines=[
            "orders: id (PK), order_number (UQ),",
            "  user_id (FK), status, total,",
            "  idempotency_key (UQ), created_at",
            "order_items: id, order_id (FK),",
            "  product_name_snapshot, unit_price,",
            "  quantity, attributes_snapshot (JSON)",
        ],
        badge="SNAPSHOT",
    )

    draw_database(
        ax,
        x=4.7,
        y=3.3,
        width=3.4,
        height=2.0,
        title="shipments & events",
        subtitle_lines=[
            "shipments: id (PK), order_id (FK),",
            "  status, tracking_number, eta",
            "shipment_events: id (PK),",
            "  shipment_id (FK), status,",
            "  occurred_at, source",
            "Timeline: append-only log",
        ],
        badge="LOGISTICS",
    )

    draw_database(
        ax,
        x=0.9,
        y=1.2,
        width=3.5,
        height=1.9,
        title="refunds",
        subtitle_lines=[
            "id: UUID (PK)",
            "order_id: UUID (FK orders)",
            "amount: NUMERIC(12,2) <= total",
            "status: REQUESTED / APPROVED / COMPL",
            "idempotency_key: VARCHAR UNIQUE",
        ],
    )

    draw_database(
        ax,
        x=4.7,
        y=1.2,
        width=3.4,
        height=1.9,
        title="support_tickets & msgs",
        subtitle_lines=[
            "support_tickets: id (PK), user_id (FK),",
            "  order_id (FK nullable), category,",
            "  status (OPEN/RESOLVED), priority",
            "support_messages: id, ticket_id (FK),",
            "  sender_role, message_text",
        ],
    )

    # --- CLUSTER 4: PgVector RAG, AI Traces, Audit & Outbox (Bottom Right) ---
    draw_group(
        ax,
        x=8.6,
        y=0.9,
        width=7.8,
        height=4.6,
        title="4. Knowledge PgVector, AI Runs, Audit & Outbox",
        bg_color=COLORS["group_ai_bg"],
        border_color=COLORS["group_ai_border"],
        subtitle="Vector Embeddings, Agent Tool Runs, Traceability & Reliable Events",
    )

    draw_database(
        ax,
        x=8.9,
        y=3.3,
        width=3.5,
        height=2.0,
        title="knowledge_docs & chunks",
        subtitle_lines=[
            "docs: id (PK), title, category,",
            "  version, effective_date, status",
            "chunks: id (PK), document_id (FK),",
            "  chunk_index, heading, content,",
            "  embedding: VECTOR(1536),",
            "  metadata: JSONB [HNSW INDEX]",
        ],
        badge="PGVECTOR",
    )

    draw_database(
        ax,
        x=12.7,
        y=3.3,
        width=3.4,
        height=2.0,
        title="assistant & agent traces",
        subtitle_lines=[
            "conversations: id, user_id (FK)",
            "messages: id, conv_id (FK), role, meta",
            "agent_runs: id (PK), intent, status",
            "agent_tool_calls: id, run_id (FK),",
            "  tool_name, input_json, output_json,",
            "  latency_ms, status",
        ],
        badge="TRACES",
    )

    draw_database(
        ax,
        x=8.9,
        y=1.2,
        width=3.5,
        height=1.9,
        title="outbox_events & idemp_keys",
        subtitle_lines=[
            "outbox_events: id (PK), aggregate_id,",
            "  event_type ('order.created'),",
            "  payload: JSONB, status: PENDING/SENT",
            "idempotency_keys: key (PK), endpoint,",
            "  request_hash, response_json, expires",
        ],
    )

    draw_database(
        ax,
        x=12.7,
        y=1.2,
        width=3.4,
        height=1.9,
        title="audit_logs",
        subtitle_lines=[
            "id: UUID (PK)",
            "actor_id, actor_type (USER/AGENT)",
            "action: CANCEL / REFUND / STOCK_EDIT",
            "entity_type, entity_id",
            "before_json, after_json: JSONB",
            "trace_id: VARCHAR(100)",
        ],
        badge="AUDIT LOG",
    )

    # Cross-Cluster Relational Connectors
    # users -> carts & orders
    draw_arrow(ax, start=(2.65, 8.0), end=(2.65, 7.8), label="1:1 active", color=COLORS["arrow_dark"])
    draw_arrow(ax, start=(2.65, 6.0), end=(2.65, 5.3), label="1:N orders", color=COLORS["arrow_dark"])

    # products -> inventory & order_items
    draw_arrow(ax, start=(10.65, 6.0), end=(12.7, 8.0), label="1:1 stock", color=COLORS["arrow_amber"])
    draw_arrow(ax, start=(8.9, 6.9), end=(4.4, 4.3), label="Snapshot ref", color=COLORS["arrow_dark"])

    # orders -> shipments & refunds
    draw_arrow(ax, start=(4.4, 4.3), end=(4.7, 4.3), label="1:1 shipment", color=COLORS["arrow_dark"])
    draw_arrow(ax, start=(2.65, 3.3), end=(2.65, 3.1), label="1:N refund", color=COLORS["arrow_dark"])

    # Legend
    legend_items = [
        ("Identity & Commerce Tables", COLORS["node_blue_bg"], COLORS["node_blue_border"]),
        ("Catalog & Inventory Locks", COLORS["node_amber_bg"], COLORS["node_amber_border"]),
        ("Orders & Logistics Snapshots", COLORS["node_indigo_bg"], COLORS["node_indigo_border"]),
        ("PgVector Embeddings & Audit Logs", COLORS["node_emerald_bg"], COLORS["node_emerald_border"]),
    ]
    draw_legend(ax, x=0.6, y=0.15, width=15.8, height=0.65, items=legend_items, title="RELATIONAL SCHEMA LEGEND")

    # Mermaid
    mermaid_code = """erDiagram
    users ||--o| customer_preferences : "has preferences"
    users ||--o{ wishlists : "owns"
    users ||--o{ carts : "owns"
    users ||--o{ orders : "places"
    users ||--o{ support_tickets : "creates"
    users ||--o{ assistant_conversations : "participates"

    categories ||--o{ categories : "parent_id"
    categories ||--o{ products : "contains"
    products ||--o{ product_attributes : "has"
    products ||--o{ product_images : "has"
    products ||--|| inventory_levels : "tracked by"

    wishlists ||--o{ wishlist_items : "contains"
    wishlist_items }o--|| products : "references"

    carts ||--o{ cart_items : "contains"
    cart_items }o--|| products : "references"

    orders ||--o{ order_items : "contains"
    order_items }o--|| products : "snapshot of"
    orders ||--o| shipments : "fulfilled by"
    shipments ||--o{ shipment_events : "tracks"
    orders ||--o{ refunds : "has"

    knowledge_documents ||--o{ knowledge_chunks : "chunked into"

    assistant_conversations ||--o{ assistant_messages : "contains"
    assistant_conversations ||--o{ agent_runs : "triggers"
    agent_runs ||--o{ agent_tool_calls : "executes"

    users {
        uuid id PK
        string email UK
        string password_hash
        string role
        string membership_tier
        string status
    }

    products {
        uuid id PK
        string name
        string slug UK
        uuid category_id FK
        numeric price
        numeric rating
        boolean is_active
    }

    inventory_levels {
        uuid product_id PK,FK
        int available_quantity
        int reserved_quantity
        int version
    }

    orders {
        uuid id PK
        string order_number UK
        uuid user_id FK
        string status
        numeric total
        string idempotency_key UK
        timestamp created_at
    }

    order_items {
        uuid id PK
        uuid order_id FK
        uuid product_id FK
        string product_name_snapshot
        numeric unit_price_snapshot
        int quantity
        jsonb attributes_snapshot
    }

    knowledge_chunks {
        uuid id PK
        uuid document_id FK
        int chunk_index
        string heading
        text content
        vector embedding
        jsonb metadata
    }

    agent_tool_calls {
        uuid id PK
        uuid agent_run_id FK
        string tool_name
        jsonb input_json
        jsonb output_json
        string status
    }
"""

    output_base = Path(__file__).resolve().parent / "10_entity_relationship_diagram"
    return save_diagram(fig, str(output_base), mermaid_code)


if __name__ == "__main__":
    result = generate()
    print("Generated 10_entity_relationship_diagram:", result)
