"""
Diagram 05: Atomic Checkout & Inventory Reservation Sequence
PRD Sections: §5.8, §5.9, §11.6, §14.1, §15.2
Deliverables: 05_checkout_sequence.png, 05_checkout_sequence.svg, 05_checkout_sequence.mmd
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
        title="ShopSmart AI — Atomic Checkout, Inventory Reservation & Idempotency Sequence",
        subtitle="End-to-End Sequence: JWT Auth, Idempotency Cache, Pessimistic Stock Lock, Price Recalculation & Outbox Event",
        prd_ref="PRD §5.8, §5.9, §11.6, §14.1, §15.2",
        scope="MVP",
    )

    # 6 Vertical Participant Columns
    participants = [
        ("Customer Client\n(React 19 SPA)", 1.5, COLORS["node_blue_bg"], COLORS["node_blue_border"]),
        ("API Gateway\n& Auth Filter", 4.3, COLORS["node_rose_bg"], COLORS["node_rose_border"]),
        ("Order Service\n& Idempotency", 7.1, COLORS["node_indigo_bg"], COLORS["node_indigo_border"]),
        ("Cart Service\n(Price Reval)", 9.9, COLORS["node_purple_bg"], COLORS["node_purple_border"]),
        ("Inventory Service\n(Pessimistic Lock)", 12.7, COLORS["node_amber_bg"], COLORS["node_amber_border"]),
        ("PostgreSQL 15\n(ACID & Outbox)", 15.5, COLORS["node_emerald_bg"], COLORS["node_emerald_border"]),
    ]

    # Draw Participant Headers & Lifelines
    top_y = 9.2
    bottom_y = 1.2
    for name, x, bg, border in participants:
        # Header Box
        draw_node(
            ax,
            x=x - 1.1,
            y=top_y,
            width=2.2,
            height=0.75,
            title=name,
            bg_color=bg,
            border_color=border,
            shape="round",
        )
        # Lifeline dashed
        ax.plot([x, x], [top_y, bottom_y], color="#94A3B8", linestyle="--", lw=1.2, zorder=2)
        # Footer Box
        draw_node(
            ax,
            x=x - 0.9,
            y=bottom_y - 0.35,
            width=1.8,
            height=0.35,
            title=name.split("\n")[0],
            bg_color=bg,
            border_color=border,
        )

    # Steps / Sequence Annotations (Top to Bottom)
    
    # Step 1: Client submits checkout
    y_step1 = 8.5
    draw_arrow(
        ax,
        start=(1.5, y_step1),
        end=(4.3, y_step1),
        label="1. POST /api/v1/orders [Bearer JWT, Idempotency-Key: UUID]",
        color=COLORS["arrow_dark"],
        label_offset=(0.0, 0.15),
    )

    # Step 2: Auth check & forward
    y_step2 = 7.8
    draw_arrow(
        ax,
        start=(4.3, y_step2),
        end=(7.1, y_step2),
        label="2. Validate JWT (sub=usr_123, role=CUSTOMER)",
        color=COLORS["arrow_dark"],
        label_offset=(0.0, 0.15),
    )

    # Step 3: Idempotency Check
    y_step3 = 7.1
    draw_arrow(
        ax,
        start=(7.1, y_step3),
        end=(15.5, y_step3),
        label="3. SELECT * FROM idempotency_keys WHERE key = 'UUID'",
        color=COLORS["arrow_dark"],
        label_offset=(0.0, 0.15),
    )
    
    # Note: Idempotency Miss (New Request)
    draw_node(
        ax,
        x=7.5,
        y=6.4,
        width=7.5,
        height=0.45,
        title="[Idempotency Check]: Key not found -> Proceed with new checkout. (If found: replay stored response immediately)",
        bg_color=COLORS["node_slate_bg"],
        border_color=COLORS["node_slate_border"],
    )

    # Step 4: Cart Revalidation
    y_step4 = 5.8
    draw_arrow(
        ax,
        start=(7.1, y_step4),
        end=(9.9, y_step4),
        label="4. Revalidate Cart (Fetch current items & latest DB prices)",
        color=COLORS["arrow_dark"],
        label_offset=(0.0, 0.15),
    )

    # Step 5: Begin Transaction & Pessimistic Lock
    y_step5 = 5.0
    draw_arrow(
        ax,
        start=(7.1, y_step5),
        end=(12.7, y_step5),
        label="5. Reserve Stock (productId, qty) @Transactional",
        color=COLORS["arrow_dark"],
        label_offset=(0.0, 0.15),
    )

    y_step6 = 4.3
    draw_arrow(
        ax,
        start=(12.7, y_step6),
        end=(15.5, y_step6),
        label="6. SELECT available_qty FROM inventory_levels FOR UPDATE",
        color=COLORS["arrow_amber"],
        label_offset=(0.0, 0.15),
    )

    # Stock Lock Guard Box
    draw_node(
        ax,
        x=9.5,
        y=3.6,
        width=5.8,
        height=0.45,
        title="[Atomic Guard]: available_qty >= qty -> UPDATE inventory_levels SET available_qty = available_qty - qty",
        bg_color=COLORS["badge_mvp_bg"],
        border_color=COLORS["badge_mvp_text"],
    )

    # Step 7: Order Creation & Snapshots
    y_step7 = 3.0
    draw_arrow(
        ax,
        start=(7.1, y_step7),
        end=(15.5, y_step7),
        label="7. INSERT orders, order_items (price snapshot), mark cart CHECKED_OUT",
        color=COLORS["arrow_dark"],
        label_offset=(0.0, 0.15),
    )

    # Step 8: Transactional Outbox Insert
    y_step8 = 2.3
    draw_arrow(
        ax,
        start=(7.1, y_step8),
        end=(15.5, y_step8),
        label="8. INSERT outbox_events ('order.created'), save idempotency_key result -> COMMIT",
        color=COLORS["arrow_green"],
        label_offset=(0.0, 0.15),
    )

    # Step 9: Return 201 Created Response
    y_step9 = 1.6
    draw_arrow(
        ax,
        start=(7.1, y_step9),
        end=(1.5, y_step9),
        label="9. 201 Created: { orderId: 'ord_555', status: 'CREATED', paymentStatus: 'PAID_SIMULATED' }",
        color=COLORS["arrow_green"],
        dashed=True,
        label_offset=(0.0, 0.15),
    )

    # Legend
    legend_items = [
        ("Synchronous Request Call", COLORS["arrow_dark"], COLORS["arrow_dark"]),
        ("Pessimistic Concurrency Lock", COLORS["arrow_amber"], COLORS["arrow_amber"]),
        ("Transactional Outbox / Commit", COLORS["arrow_green"], COLORS["arrow_green"]),
        ("HTTP Response (Async/Return)", "#94A3B8", "#94A3B8"),
    ]
    draw_legend(ax, x=0.6, y=0.15, width=15.8, height=0.65, items=legend_items, title="SEQUENCE NOTATION LEGEND")

    # Mermaid
    mermaid_code = """sequenceDiagram
    autonumber
    actor Client as Customer (React 19)
    participant Gateway as API Gateway / Auth
    participant OrderSvc as Order Service
    participant CartSvc as Cart Service
    participant InvSvc as Inventory Service
    participant DB as PostgreSQL 15 (DB & Outbox)

    Client->>Gateway: POST /api/v1/orders<br/>[Bearer JWT, Idempotency-Key: UUID]
    Gateway->>OrderSvc: Validate JWT & Route Request
    
    rect rgb(240, 244, 255)
        Note over OrderSvc,DB: Step 1: Idempotency Verification
        OrderSvc->>DB: SELECT * FROM idempotency_keys WHERE key = UUID
        alt Key Exists (Duplicate Request)
            DB-->>OrderSvc: Return Cached Order Response
            OrderSvc-->>Client: 200 OK (Replay Original Order ord_555)
        else Key Not Found (First Execution)
            DB-->>OrderSvc: Null / Miss
        end
    end

    rect rgb(255, 245, 245)
        Note over OrderSvc,CartSvc: Step 2: Price & Cart Validation
        OrderSvc->>CartSvc: Revalidate Cart Items & Prices
        CartSvc->>DB: SELECT * FROM products WHERE id IN (items)
        CartSvc-->>OrderSvc: Server Recalculated Total ($1049.00)
    end

    rect rgb(254, 250, 235)
        Note over OrderSvc,DB: Step 3: Atomic Stock Lock & Reservation
        OrderSvc->>InvSvc: Reserve Stock @Transactional
        InvSvc->>DB: SELECT available_qty FROM inventory_levels FOR UPDATE
        alt Insufficient Stock (available_qty < qty)
            InvSvc-->>OrderSvc: StockConflictException
            OrderSvc-->>Client: 409 Conflict: "Product LAP101 out of stock"
        else Stock Available
            InvSvc->>DB: UPDATE inventory_levels SET available_qty = available_qty - qty
        end
    end

    rect rgb(240, 253, 244)
        Note over OrderSvc,DB: Step 4: Order Creation & Outbox Event
        OrderSvc->>DB: INSERT INTO orders (id, order_number, total, status='CREATED')
        OrderSvc->>DB: INSERT INTO order_items (snapshots: name, price, attributes)
        OrderSvc->>DB: UPDATE carts SET status = 'CHECKED_OUT'
        OrderSvc->>DB: INSERT INTO outbox_events (type='order.created', payload=...)
        OrderSvc->>DB: INSERT INTO idempotency_keys (key, response_json)
        OrderSvc->>DB: COMMIT TRANSACTION
    end

    OrderSvc-->>Client: 201 Created: { orderId: 'ord_555', orderNumber: 'ORD-555', status: 'CREATED', paymentStatus: 'PAID_SIMULATED' }
"""

    output_base = Path(__file__).resolve().parent / "05_checkout_sequence"
    return save_diagram(fig, str(output_base), mermaid_code)


if __name__ == "__main__":
    result = generate()
    print("Generated 05_checkout_sequence:", result)
