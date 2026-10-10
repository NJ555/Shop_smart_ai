"""
Diagram 11: Unified Lifecycle State Machines Suite
PRD Sections: §13.1 - §13.5, §14.4, §14.5
Deliverables: 11_lifecycle_state_machines.png, 11_lifecycle_state_machines.svg, 11_lifecycle_state_machines.mmd
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
        title="ShopSmart AI — Unified Lifecycle State Machines Suite",
        subtitle="5 Core Domain Lifecycles: Cart, Order, Shipment, Simulated Refund, and Knowledge Document",
        prd_ref="PRD §13.1 - §13.5, §14.4 - §14.5",
        scope="MVP STATE MACHINES",
    )

    # 1. Cart Lifecycle (Top Left)
    draw_group(
        ax,
        x=0.6,
        y=6.0,
        width=4.8,
        height=4.2,
        title="1. Cart Lifecycle (PRD §13.1)",
        bg_color=COLORS["group_frontend_bg"],
        border_color=COLORS["group_frontend_border"],
        subtitle="Session Shopping & Checkout Invariants",
    )

    draw_node(
        ax,
        x=0.9,
        y=8.4,
        width=2.0,
        height=1.0,
        title="ACTIVE",
        subtitle_lines=["Editable items", "Live price recheck", "Stock-capped qty"],
        accent_bar_color=COLORS["node_blue_accent"],
        badge="INITIAL",
    )

    draw_node(
        ax,
        x=3.2,
        y=8.4,
        width=2.0,
        height=1.0,
        title="CHECKED_OUT",
        subtitle_lines=["Order created", "Cart locked", "Items frozen"],
        accent_bar_color=COLORS["node_emerald_accent"],
        badge="TERMINAL",
    )

    draw_node(
        ax,
        x=0.9,
        y=6.4,
        width=2.0,
        height=1.0,
        title="ABANDONED",
        subtitle_lines=["Session timeout", "Stock released", "Historical log"],
        accent_bar_color=COLORS["node_slate_accent"],
        badge="TERMINAL",
    )

    draw_arrow(ax, start=(2.9, 8.9), end=(3.2, 8.9), label="Checkout\nSuccess", color=COLORS["arrow_green"])
    draw_arrow(ax, start=(1.9, 8.4), end=(1.9, 7.4), label="Expired\n(24h)", color=COLORS["arrow_dark"])

    # 2. Simulated Refund Lifecycle (Bottom Left)
    draw_group(
        ax,
        x=0.6,
        y=0.9,
        width=4.8,
        height=4.7,
        title="2. Simulated Refund Lifecycle (§13.4)",
        bg_color=COLORS["group_security_bg"],
        border_color=COLORS["group_security_border"],
        subtitle="Idempotent Simulated Reimbursement",
    )

    draw_node(
        ax,
        x=0.9,
        y=4.1,
        width=4.2,
        height=1.0,
        title="SIMULATED_REFUND_REQUESTED",
        subtitle_lines=["Triggered on cancellation / eligible return", "Enforces idempotencyKey unique constraint"],
        accent_bar_color=COLORS["node_rose_accent"],
        badge="REQUESTED",
    )

    draw_node(
        ax,
        x=0.9,
        y=2.6,
        width=4.2,
        height=1.0,
        title="SIMULATED_REFUND_APPROVED",
        subtitle_lines=["Auto-approved if < $100 threshold", "Requires Ops Manager sign-off if >= $100"],
        accent_bar_color=COLORS["node_amber_accent"],
        badge="APPROVED",
    )

    draw_node(
        ax,
        x=0.9,
        y=1.1,
        width=4.2,
        height=1.0,
        title="SIMULATED_REFUND_COMPLETED",
        subtitle_lines=["Ledger updated, order status reconciled", "Virtual credit simulated in customer history"],
        accent_bar_color=COLORS["node_emerald_accent"],
        badge="TERMINAL",
    )

    draw_arrow(ax, start=(3.0, 4.1), end=(3.0, 3.6), label="Threshold Check", color=COLORS["arrow_dark"])
    draw_arrow(ax, start=(3.0, 2.6), end=(3.0, 2.1), label="Execute Credit", color=COLORS["arrow_green"])

    # 3. Order Lifecycle (Top Right & Center)
    draw_group(
        ax,
        x=5.8,
        y=5.0,
        width=10.6,
        height=5.2,
        title="3. Order Lifecycle & Strict Cancellation Boundary (PRD §13.2, §14.4)",
        bg_color=COLORS["group_backend_bg"],
        border_color=COLORS["group_backend_border"],
        subtitle="Happy Fulfillment Path vs. Pre-Shipment Cancellation & Invariant Enforcement",
    )

    draw_node(
        ax,
        x=6.1,
        y=8.6,
        width=1.8,
        height=1.0,
        title="CREATED",
        subtitle_lines=["Order created", "Stock locked"],
        accent_bar_color=COLORS["node_indigo_accent"],
        badge="START",
    )

    draw_node(
        ax,
        x=8.4,
        y=8.6,
        width=1.9,
        height=1.0,
        title="CONFIRMED",
        subtitle_lines=["Payment simulated", "PAID_SIMULATED"],
        accent_bar_color=COLORS["node_indigo_accent"],
    )

    draw_node(
        ax,
        x=10.8,
        y=8.6,
        width=2.0,
        height=1.0,
        title="PROCESSING",
        subtitle_lines=["Warehouse staging", "Packaging order"],
        accent_bar_color=COLORS["node_indigo_accent"],
    )

    draw_node(
        ax,
        x=13.3,
        y=8.6,
        width=1.9,
        height=1.0,
        title="SHIPPED",
        subtitle_lines=["Carrier received", "Tracking active"],
        accent_bar_color=COLORS["node_amber_accent"],
    )

    draw_node(
        ax,
        x=13.3,
        y=6.8,
        width=2.4,
        height=1.1,
        title="OUT_FOR_DELIVERY",
        subtitle_lines=["Local courier dispatch", "Simulated ETA ready"],
        accent_bar_color=COLORS["node_amber_accent"],
    )

    draw_node(
        ax,
        x=13.3,
        y=5.2,
        width=1.9,
        height=1.0,
        title="DELIVERED",
        subtitle_lines=["Package received", "Fulfillment done"],
        accent_bar_color=COLORS["node_emerald_accent"],
        badge="TERMINAL",
    )

    # Cancelled State Box in Order Section
    draw_node(
        ax,
        x=6.1,
        y=5.4,
        width=4.2,
        height=1.4,
        title="CANCELLED",
        subtitle_lines=[
            "Cancellation Invariant Rules:",
            "  - Allowed from: CREATED, CONFIRMED, PROCESSING",
            "  - BLOCKED from: SHIPPED, OUT_FOR_DELIVERY",
            "  - Action: Releases stock & triggers refund",
        ],
        accent_bar_color=COLORS["node_rose_accent"],
        badge="TERMINAL",
    )

    # Happy path horizontal arrows
    draw_arrow(ax, start=(7.9, 9.1), end=(8.4, 9.1), color=COLORS["arrow_dark"])
    draw_arrow(ax, start=(10.3, 9.1), end=(10.8, 9.1), color=COLORS["arrow_dark"])
    draw_arrow(ax, start=(12.8, 9.1), end=(13.3, 9.1), color=COLORS["arrow_dark"])
    draw_arrow(ax, start=(14.25, 8.6), end=(14.25, 7.9), color=COLORS["arrow_dark"])
    draw_arrow(ax, start=(14.25, 6.8), end=(14.25, 6.2), color=COLORS["arrow_green"])

    # Cancellation allowed paths
    draw_arrow(ax, start=(7.0, 8.6), end=(7.0, 6.8), label="Cancel", color=COLORS["arrow_red"])
    draw_arrow(ax, start=(9.3, 8.6), end=(8.2, 6.8), label="Cancel", color=COLORS["arrow_red"])
    draw_arrow(ax, start=(11.5, 8.6), end=(9.5, 6.8), label="Cancel", color=COLORS["arrow_red"])

    # Blocked cancellation path indicator from SHIPPED
    draw_arrow(
        ax,
        start=(13.3, 8.9),
        end=(10.5, 6.4),
        label="BLOCKED: Shipped Orders Cannot Be Cancelled",
        color=COLORS["arrow_red"],
        dashed=True,
        connectionstyle="arc3,rad=0.15",
    )

    # 4. Shipment Lifecycle (Bottom Right Left side)
    draw_group(
        ax,
        x=5.8,
        y=0.9,
        width=5.1,
        height=3.8,
        title="4. Shipment Lifecycle (PRD §13.3)",
        bg_color=COLORS["group_ops_bg"],
        border_color=COLORS["group_ops_border"],
        subtitle="Tracking States & Delay Recovery Loop",
    )

    draw_node(ax, x=6.1, y=3.2, width=1.4, height=0.7, title="PENDING", badge="START")
    draw_node(ax, x=7.8, y=3.2, width=1.5, height=0.7, title="LABEL_CREATED")
    draw_node(ax, x=9.5, y=3.2, width=1.3, height=0.7, title="IN_TRANSIT")
    draw_node(ax, x=9.5, y=1.9, width=1.3, height=0.7, title="DELAYED", badge="EXCEPTION")
    draw_node(ax, x=7.8, y=1.2, width=1.5, height=0.7, title="OUT_FOR_DELIVERY")
    draw_node(ax, x=6.1, y=1.2, width=1.4, height=0.7, title="DELIVERED", badge="TERMINAL")

    draw_arrow(ax, start=(7.5, 3.55), end=(7.8, 3.55), color=COLORS["arrow_dark"])
    draw_arrow(ax, start=(9.3, 3.55), end=(9.5, 3.55), color=COLORS["arrow_dark"])
    draw_arrow(ax, start=(10.15, 3.2), end=(10.15, 2.6), label="Delay", color=COLORS["arrow_red"])
    draw_arrow(ax, start=(9.5, 2.25), end=(9.3, 3.2), label="Resume", color=COLORS["arrow_green"])
    draw_arrow(ax, start=(9.5, 3.2), end=(8.6, 1.9), color=COLORS["arrow_dark"])
    draw_arrow(ax, start=(7.8, 1.55), end=(7.5, 1.55), color=COLORS["arrow_green"])

    # 5. Knowledge Document Lifecycle (Bottom Right Right side)
    draw_group(
        ax,
        x=11.3,
        y=0.9,
        width=5.1,
        height=3.8,
        title="5. Knowledge Doc Lifecycle (§13.5)",
        bg_color=COLORS["group_ai_bg"],
        border_color=COLORS["group_ai_border"],
        subtitle="Version-Aware Publication & Archival",
    )

    draw_node(ax, x=11.6, y=3.2, width=1.8, height=0.8, title="DRAFT", subtitle_lines=["Uploaded doc"], badge="START")
    draw_node(ax, x=14.0, y=3.2, width=2.1, height=0.8, title="ACTIVE", subtitle_lines=["Live in RAG"], badge="RAG ACTIVE")
    draw_node(ax, x=14.0, y=1.5, width=2.1, height=0.8, title="SUPERSEDED", subtitle_lines=["New version published"])
    draw_node(ax, x=11.6, y=1.5, width=1.8, height=0.8, title="ARCHIVED", subtitle_lines=["Cold storage"], badge="TERMINAL")

    draw_arrow(ax, start=(13.4, 3.6), end=(14.0, 3.6), label="Admin\nPublish", color=COLORS["arrow_green"])
    draw_arrow(ax, start=(15.05, 3.2), end=(15.05, 2.3), label="New Ver\nActive", color=COLORS["arrow_amber"])
    draw_arrow(ax, start=(14.0, 1.9), end=(13.4, 1.9), label="Retire", color=COLORS["arrow_dark"])

    # Legend
    legend_items = [
        ("Normal State Transition", COLORS["arrow_dark"], COLORS["arrow_dark"]),
        ("Terminal Success / Fulfill", COLORS["arrow_green"], COLORS["arrow_green"]),
        ("Cancellation / Exception", COLORS["arrow_red"], COLORS["arrow_red"]),
        ("Blocked Transition (Invariant Violation)", COLORS["arrow_red"], COLORS["arrow_red"]),
    ]
    draw_legend(ax, x=0.6, y=0.15, width=15.8, height=0.65, items=legend_items, title="STATE MACHINE TRANSITIONS")

    # Mermaid
    mermaid_code = """stateDiagram-v2
    classDef happy fill:#ECFDF5,stroke:#10B981,stroke-width:2px;
    classDef cancel fill:#FFE4E6,stroke:#E11D48,stroke-width:2px;
    classDef normal fill:#EEF2FF,stroke:#6366F1,stroke-width:2px;
    classDef ex fill:#FEF3C7,stroke:#D97706,stroke-width:2px;

    %% 1. Cart Lifecycle
    state "Cart: ACTIVE" as Cart_Active
    state "Cart: CHECKED_OUT" as Cart_Done
    state "Cart: ABANDONED" as Cart_Aband

    [*] --> Cart_Active
    Cart_Active --> Cart_Done : Simulated checkout success
    Cart_Active --> Cart_Aband : Session expiry / timeout

    %% 2. Order Lifecycle
    state "Order: CREATED" as Ord_Created
    state "Order: CONFIRMED" as Ord_Confirmed
    state "Order: PROCESSING" as Ord_Proc
    state "Order: SHIPPED" as Ord_Shipped
    state "Order: OUT_FOR_DELIVERY" as Ord_Out
    state "Order: DELIVERED" as Ord_Delivered
    state "Order: CANCELLED" as Ord_Cancelled

    [*] --> Ord_Created
    Ord_Created --> Ord_Confirmed : Payment simulated (PAID_SIMULATED)
    Ord_Confirmed --> Ord_Proc : Warehouse fulfillment starts
    Ord_Proc --> Ord_Shipped : Shipment registered
    Ord_Shipped --> Ord_Out : Carrier transfer
    Ord_Out --> Ord_Delivered : Handoff complete

    Ord_Created --> Ord_Cancelled : User / Agent cancels
    Ord_Confirmed --> Ord_Cancelled : User / Agent cancels
    Ord_Proc --> Ord_Cancelled : Cancelled before dispatch
    Ord_Delivered --> [*]
    Ord_Cancelled --> [*]

    %% 3. Shipment Lifecycle
    state "Shipment: PENDING" as Ship_Pend
    state "Shipment: LABEL_CREATED" as Ship_Label
    state "Shipment: IN_TRANSIT" as Ship_Transit
    state "Shipment: DELAYED" as Ship_Delayed
    state "Shipment: OUT_FOR_DELIVERY" as Ship_Out
    state "Shipment: DELIVERED" as Ship_Done

    [*] --> Ship_Pend
    Ship_Pend --> Ship_Label : Tracking number allocated
    Ship_Label --> Ship_Transit : Carrier scan
    Ship_Transit --> Ship_Delayed : Exception event
    Ship_Delayed --> Ship_Transit : Transit resumed
    Ship_Transit --> Ship_Out : Local dispatch
    Ship_Out --> Ship_Done : Completed

    %% 4. Knowledge Doc Lifecycle
    state "Doc: DRAFT" as Doc_Draft
    state "Doc: ACTIVE" as Doc_Active
    state "Doc: SUPERSEDED" as Doc_Super
    state "Doc: ARCHIVED" as Doc_Arch

    [*] --> Doc_Draft
    Doc_Draft --> Doc_Active : Admin activation & PgVector indexing
    Doc_Active --> Doc_Super : Newer version activated
    Doc_Super --> Doc_Arch : Historical policy archived
"""

    output_base = Path(__file__).resolve().parent / "11_lifecycle_state_machines"
    return save_diagram(fig, str(output_base), mermaid_code)


if __name__ == "__main__":
    result = generate()
    print("Generated 11_lifecycle_state_machines:", result)
