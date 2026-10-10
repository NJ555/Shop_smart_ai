"""
Diagram 04: Comprehensive Customer Journey Workflow
PRD Sections: §3.1 - §3.3, §5.1 - §5.9, §11.2 - §11.8
Deliverables: 04_customer_journey.png, 04_customer_journey.svg, 04_customer_journey.mmd
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
        title="ShopSmart AI — End-to-End Customer Experience Journey",
        subtitle="7-Stage Lifecycle: Authentication, Discovery, AI Assistance, Evaluation, Cart, Checkout, and Tracking",
        prd_ref="PRD §3.1 - §3.3, §5.1 - §5.9",
        scope="MVP",
    )

    # 7 Journey Stages horizontally aligned in two rows (Stage 1-4 top, Stage 5-7 bottom)
    
    # --- ROW 1: Discovery & Evaluation ---
    draw_group(
        ax,
        x=0.6,
        y=5.8,
        width=15.8,
        height=4.4,
        title="Part 1: Onboarding, Discovery, AI Shopping Consultation & Evaluation",
        bg_color=COLORS["group_frontend_bg"],
        border_color=COLORS["group_frontend_border"],
        subtitle="Customer Personas (Ananya, Rahul, Sneha, Vikram) engaging storefront & conversational intelligence",
    )

    # Stage 1: Auth & Preferences
    draw_node(
        ax,
        x=0.9,
        y=6.2,
        width=3.5,
        height=3.4,
        title="Stage 1: Authentication & Tiers",
        subtitle_lines=[
            "1. User Registration / Login",
            "   POST /api/v1/auth/login",
            "2. BCrypt validation -> JWT issued",
            "   (15-30 min access token)",
            "3. Roles: CUSTOMER, PRIME, etc",
            "4. Preferences loaded:",
            "   - Preferred categories & brands",
            "   - Budget ranges & default address",
        ],
        accent_bar_color=COLORS["node_blue_accent"],
        badge="JWT AUTH",
    )

    # Stage 2: Product Discovery & Search
    draw_node(
        ax,
        x=4.8,
        y=6.2,
        width=3.5,
        height=3.4,
        title="Stage 2: Catalog Discovery",
        subtitle_lines=[
            "1. Browse Category Hierarchy",
            "2. Keyword Search over text:",
            "   GET /api/v1/products/search",
            "3. Faceted Filter Parameters:",
            "   - priceRange: minPrice, maxPrice",
            "   - brand: Apple, Dell, Lenovo",
            "   - rating >= 4.0, availability",
            "4. Preserves filter state in URL",
            "5. Empty State: suggestions only",
        ],
        accent_bar_color=COLORS["node_indigo_accent"],
        badge="CATALOG",
    )

    # Stage 3: AI Shopping Assistant Consultation
    draw_node(
        ax,
        x=8.7,
        y=6.2,
        width=3.6,
        height=3.4,
        title="Stage 3: AI Shopping Assistant",
        subtitle_lines=[
            "1. Customer asks natural language:",
            "   'Suggest laptop under $1000",
            "    for Java development & AI'",
            "2. POST /api/v1/assistant/shopping",
            "3. Model extracts structured constraints",
            "4. Server queries REAL PostgreSQL",
            "5. Deterministic weighted ranking",
            "6. Returns recommendations + reasons",
            "   (Zero hallucinated specs/prices)",
        ],
        accent_bar_color=COLORS["node_emerald_accent"],
        badge="GROUNDED AI",
    )

    # Stage 4: Evaluation, Compare & Wishlist
    draw_node(
        ax,
        x=12.6,
        y=6.2,
        width=3.5,
        height=3.4,
        title="Stage 4: Product Evaluation",
        subtitle_lines=[
            "1. Product Detail Page (PDP):",
            "   - Image gallery, rating badges",
            "   - Full specs & delivery estimate",
            "2. Product Comparison Screen:",
            "   - Side-by-side attributes (up to 4)",
            "   - GET /api/v1/products/compare",
            "3. Persistent Wishlist:",
            "   - Save items across sessions",
            "   - 'Move to Cart' single action",
        ],
        accent_bar_color=COLORS["node_purple_accent"],
        badge="DECISION",
    )

    # Connectors for Row 1
    draw_arrow(ax, start=(4.4, 7.9), end=(4.8, 7.9), label="Select Browse", color=COLORS["arrow_dark"])
    draw_arrow(ax, start=(8.3, 7.9), end=(8.7, 7.9), label="Consult AI", color=COLORS["arrow_emerald"])
    draw_arrow(ax, start=(12.3, 7.9), end=(12.6, 7.9), label="View Details", color=COLORS["arrow_purple"])

    # Connecting Arrow from Stage 4 to Stage 5
    draw_arrow(
        ax,
        start=(14.35, 6.2),
        end=(14.35, 5.0),
        label="Add to Cart / Move to Cart",
        color=COLORS["arrow_dark"],
    )

    # --- ROW 2: Fulfillment & Tracking ---
    draw_group(
        ax,
        x=0.6,
        y=0.9,
        width=15.8,
        height=4.6,
        title="Part 2: Cart Management, Atomic Checkout, Order Lifecycle & Shipment Tracking",
        bg_color=COLORS["group_data_bg"],
        border_color=COLORS["group_data_border"],
        subtitle="Transactional Integrity, Stock Atomicity, Simulated Payment & Carrier Tracking Events",
    )

    # Stage 7: Order History & Tracking (Bottom Left)
    draw_node(
        ax,
        x=0.9,
        y=1.3,
        width=4.5,
        height=3.6,
        title="Stage 7: Order Tracking & Support",
        subtitle_lines=[
            "1. Customer views Order History & Details:",
            "   GET /api/v1/orders/{orderId}/shipment",
            "2. Shipment Timeline Visualization:",
            "   - PENDING -> LABEL_CREATED",
            "   - IN_TRANSIT -> OUT_FOR_DELIVERY",
            "   - DELIVERED (or DELAYED event)",
            "3. Cancellation Support:",
            "   - Self-service cancel if NOT shipped",
            "   - If shipped, cancel blocked with explanation",
            "4. Post-Purchase AI Support:",
            "   - 'Where is order ORD-123?'",
            "   - RAG Return Policy Q&A with citations",
        ],
        accent_bar_color=COLORS["node_indigo_accent"],
        badge="TRACKING",
    )

    # Stage 6: Atomic Checkout (Bottom Middle)
    draw_node(
        ax,
        x=5.8,
        y=1.3,
        width=4.8,
        height=3.6,
        title="Stage 6: Simulated Atomic Checkout",
        subtitle_lines=[
            "1. POST /api/v1/orders",
            "   Header: Idempotency-Key (UUID)",
            "2. Server-Side Price & Tax Recalculation",
            "   (Client prices strictly ignored)",
            "3. Pessimistic Inventory Reservation:",
            "   SELECT FOR UPDATE on inventory_levels",
            "4. Atomic Transaction Commit:",
            "   - Order created with product snapshot",
            "   - Cart marked CHECKED_OUT",
            "   - Payment simulated: PAID_SIMULATED",
            "   - outbox_events entry: order.created",
            "5. Customer receives unique ORD-xxx ID",
        ],
        accent_bar_color=COLORS["node_amber_accent"],
        badge="TRANSACTION",
    )

    # Stage 5: Cart Management (Bottom Right)
    draw_node(
        ax,
        x=11.0,
        y=1.3,
        width=5.1,
        height=3.6,
        title="Stage 5: Cart Assembly & Revalidation",
        subtitle_lines=[
            "1. POST /api/v1/cart/items (quantity, productId)",
            "2. Real-time Inventory Cap Validation:",
            "   - Blocks quantity > available_quantity",
            "3. Active Cart Lifecycle:",
            "   - Item quantity update / removal",
            "   - Auto-detect disabled/out-of-stock items",
            "4. Pre-Checkout Verification:",
            "   - Revalidates current catalog price",
            "   - Warns customer if price changed",
            "5. Membership perks applied (Free shipping tier)",
        ],
        accent_bar_color=COLORS["node_rose_accent"],
        badge="CART STATE",
    )

    # Connectors for Row 2 (Right to Left flow)
    draw_arrow(
        ax,
        start=(11.0, 3.1),
        end=(10.6, 3.1),
        label="Click Checkout",
        color=COLORS["arrow_dark"],
    )

    draw_arrow(
        ax,
        start=(5.8, 3.1),
        end=(5.4, 3.1),
        label="Order Confirmed",
        color=COLORS["arrow_green"],
    )

    # Legend
    legend_items = [
        ("Customer Onboarding & Discovery", COLORS["node_blue_bg"], COLORS["node_blue_border"]),
        ("AI Grounded Assistance", COLORS["node_emerald_bg"], COLORS["node_emerald_border"]),
        ("Evaluation & Wishlist", COLORS["node_purple_bg"], COLORS["node_purple_border"]),
        ("Cart & Pricing Revalidation", COLORS["node_rose_bg"], COLORS["node_rose_border"]),
        ("Atomic Checkout & Logistics", COLORS["node_amber_bg"], COLORS["node_amber_border"]),
    ]
    draw_legend(ax, x=0.6, y=0.15, width=15.8, height=0.65, items=legend_items, title="CUSTOMER JOURNEY STAGES")

    # Mermaid
    mermaid_code = """flowchart TD
    subgraph S1["Stage 1: Authentication & Profile"]
        Auth_Reg["Register / Login<br/>POST /api/v1/auth/login"]
        Auth_JWT["JWT Access Token Issued<br/>BCrypt Hash & Role Claims"]
        Auth_Pref["Load Customer Preferences<br/>Category, Brand, Budget & Tier"]
        Auth_Reg --> Auth_JWT --> Auth_Pref
    end

    subgraph S2["Stage 2: Catalog Discovery"]
        Cat_Browse["Browse Hierarchical Categories"]
        Cat_Search["Keyword & Faceted Search<br/>Price, Brand, Rating Filters"]
        Cat_Empty{"Results Found?"}
        Cat_Suggest["Show Suggestions & AI Prompt"]
        Cat_Browse --> Cat_Search --> Cat_Empty
        Cat_Empty -- No --> Cat_Suggest
    end

    subgraph S3["Stage 3: AI Shopping Assistant"]
        AI_Query["Natural Language Query<br/>'Laptop under $1000 for Java & AI'"]
        AI_Extract["Structured JSON Extraction<br/>Constraints & Preferences"]
        AI_Ground["Query Real PostgreSQL<br/>Zero Hallucinated Products"]
        AI_Rank["Weighted Ranking & Reasons<br/>Budget, Specs, Ratings"]
        AI_Query --> AI_Extract --> AI_Ground --> AI_Rank
    end

    subgraph S4["Stage 4: Product Evaluation"]
        PDP["Product Detail Page (PDP)<br/>Specs, Images & Availability"]
        Compare["Side-by-Side Compare (Up to 4)"]
        Wishlist["Save to Persistent Wishlist"]
        PDP --> Compare
        PDP --> Wishlist
    end

    subgraph S5["Stage 5: Cart Management"]
        Cart_Add["Add Item with Quantity<br/>Stock Cap Validation"]
        Cart_Reval["Server-Side Revalidation<br/>Detect Price/Stock Changes"]
        Cart_Add --> Cart_Reval
    end

    subgraph S6["Stage 6: Simulated Atomic Checkout"]
        Check_Req["POST /api/v1/orders<br/>Idempotency-Key Header"]
        Check_Lock["SELECT FOR UPDATE<br/>Pessimistic Stock Lock"]
        Check_Commit["Atomic Transaction Commit<br/>Order + Snapshot + Outbox Event"]
        Check_Req --> Check_Lock --> Check_Commit
    end

    subgraph S7["Stage 7: Tracking & Post-Purchase"]
        Track_Status["Shipment Timeline<br/>LABEL_CREATED -> IN_TRANSIT -> DELIVERED"]
        Track_Cancel{"Cancel Requested?"}
        Track_CheckShipped{"Order Shipped?"}
        Track_DoCancel["Cancel & Simulated Refund"]
        Track_BlockCancel["Reject: Order In Transit"]
        
        Track_Status --> Track_Cancel
        Track_Cancel -- Yes --> Track_CheckShipped
        Track_CheckShipped -- No --> Track_DoCancel
        Track_CheckShipped -- Yes --> Track_BlockCancel
    end

    Auth_Pref --> Cat_Browse
    Cat_Empty -- Yes --> PDP
    Cat_Suggest --> AI_Query
    AI_Rank --> PDP
    PDP --> Cart_Add
    Wishlist -->|Move to Cart| Cart_Add
    Cart_Reval --> Check_Req
    Check_Commit --> Track_Status

    classDef fe fill:#EFF6FF,stroke:#3B82F6,stroke-width:2px;
    classDef ai fill:#ECFDF5,stroke:#10B981,stroke-width:2px;
    classDef cart fill:#FFE4E6,stroke:#E11D48,stroke-width:2px;
    classDef order fill:#FFFBEB,stroke:#F59E0B,stroke-width:2px;
    classDef track fill:#EEF2FF,stroke:#6366F1,stroke-width:2px;

    class S1,S2 fe;
    class S3 ai;
    class S4,S5 cart;
    class S6 order;
    class S7 track;
"""

    output_base = Path(__file__).resolve().parent / "04_customer_journey"
    return save_diagram(fig, str(output_base), mermaid_code)


if __name__ == "__main__":
    result = generate()
    print("Generated 04_customer_journey:", result)
