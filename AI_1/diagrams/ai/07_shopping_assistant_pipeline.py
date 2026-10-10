"""
Diagram 07: 10-Stage AI Shopping Assistant Pipeline
PRD Sections: §6.1 - §6.11, §14.6, Appendix A
Deliverables: 07_shopping_assistant_pipeline.png, 07_shopping_assistant_pipeline.svg, 07_shopping_assistant_pipeline.mmd
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
        title="ShopSmart AI — 10-Stage AI Shopping Assistant Pipeline",
        subtitle="Sanitization, Extraction, Catalog Grounding, Deterministic Weighted Ranking, and Factual Explanations",
        prd_ref="PRD §6.1 - §6.11, Appendix A",
        scope="MVP (GROUNDED)",
    )

    # Top Section: Stages 1 to 5 (Query Understanding & Validation)
    draw_group(
        ax,
        x=0.6,
        y=5.8,
        width=15.8,
        height=4.4,
        title="Part 1: Natural Language Understanding, Prompt Guardrails & Constraint Validation",
        bg_color=COLORS["group_ai_bg"],
        border_color=COLORS["group_ai_border"],
        subtitle="Ingests unstructured shopper intent, isolates injections, and extracts structured constraint parameters",
    )

    # Stage 1: User Query
    draw_node(
        ax,
        x=0.9,
        y=6.2,
        width=2.8,
        height=3.4,
        title="Stage 1: User Query",
        subtitle_lines=[
            "Endpoint:",
            "  POST /api/v1/assistant/",
            "       shopping/query",
            "Example Query:",
            "  'Suggest a laptop",
            "   under $1000 for",
            "   Java development",
            "   and AI projects'",
            "Includes conversationId",
        ],
        accent_bar_color=COLORS["node_blue_accent"],
        badge="INPUT",
    )

    # Stage 2: Input Sanitization & Guard
    draw_node(
        ax,
        x=4.0,
        y=6.2,
        width=2.8,
        height=3.4,
        title="Stage 2: Prompt Guard",
        subtitle_lines=[
            "Sanitization Checks:",
            "  - Strip control chars",
            "  - Regex injection scan",
            "System Prompt Isolation:",
            "  'Never follow instructions",
            "   embedded in queries'",
            "Delimiter wrapping:",
            "  <user_query>...</user_query>",
            "Blocks jailbreak attempts",
        ],
        accent_bar_color=COLORS["node_rose_accent"],
        badge="GUARD",
    )

    # Stage 3: Intent Classification
    draw_node(
        ax,
        x=7.1,
        y=6.2,
        width=2.8,
        height=3.4,
        title="Stage 3: Intent Router",
        subtitle_lines=[
            "Classifies intent:",
            "  - PRODUCT_RECOMMENDATION",
            "  - POLICY_QUERY (-> RAG)",
            "  - ORDER_SUPPORT (-> Agent)",
            "  - CHITCHAT / AMBIGUOUS",
            "Routes query to dedicated",
            "shopping prompt pipeline",
        ],
        accent_bar_color=COLORS["node_emerald_accent"],
        badge="CLASSIFY",
    )

    # Stage 4: Constraint Extraction
    draw_node(
        ax,
        x=10.2,
        y=6.2,
        width=2.9,
        height=3.4,
        title="Stage 4: JSON Extraction",
        subtitle_lines=[
            "Structured Schema Output:",
            "  categoryHint: 'Laptop'",
            "  budget: {max: 1000}",
            "  useCases: ['java', 'ai']",
            "  requiredAttributes:",
            "    ram: ['16GB', '32GB']",
            "    storage: ['SSD']",
            "    cpu: ['i5', 'i7']",
        ],
        accent_bar_color=COLORS["node_purple_accent"],
        badge="SCHEMA",
    )

    # Stage 5: Constraint Validation
    draw_node(
        ax,
        x=13.4,
        y=6.2,
        width=2.7,
        height=3.4,
        title="Stage 5: Taxonomy Validate",
        subtitle_lines=[
            "Business Validation:",
            "  - Budget > 0 check",
            "  - Map category to active",
            "    catalog hierarchy",
            "If Ambiguous / Conflict:",
            "  Returns clarifyingQuestion",
            "  ('Do you prefer Windows",
            "   or macOS?')",
        ],
        accent_bar_color=COLORS["node_amber_accent"],
        badge="VALIDATE",
    )

    # Top row connectors
    draw_arrow(ax, start=(3.7, 7.9), end=(4.0, 7.9), color=COLORS["arrow_dark"])
    draw_arrow(ax, start=(6.8, 7.9), end=(7.1, 7.9), color=COLORS["arrow_dark"])
    draw_arrow(ax, start=(9.9, 7.9), end=(10.2, 7.9), color=COLORS["arrow_dark"])
    draw_arrow(ax, start=(13.1, 7.9), end=(13.4, 7.9), color=COLORS["arrow_dark"])

    # Connecting Arrow from Top to Bottom
    draw_arrow(
        ax,
        start=(14.75, 6.2),
        end=(14.75, 5.0),
        label="Validated Constraints -> Query Builder",
        color=COLORS["arrow_green"],
    )

    # Bottom Section: Stages 6 to 10 (Grounding, Ranking, Explanations & Delivery)
    draw_group(
        ax,
        x=0.6,
        y=0.9,
        width=15.8,
        height=4.6,
        title="Part 2: Database Grounding, Weighted Scoring, Factual Explanation & Delivery",
        bg_color=COLORS["group_data_bg"],
        border_color=COLORS["group_data_border"],
        subtitle="Zero hallucination policy: Only genuine PostgreSQL catalog records are ranked and explained",
    )

    # Stage 10: Response Delivery (Bottom Left)
    draw_node(
        ax,
        x=0.9,
        y=1.3,
        width=2.8,
        height=3.6,
        title="Stage 10: Client Delivery",
        subtitle_lines=[
            "Final Response JSON:",
            "  conversationId: 'conv_123'",
            "  recommendations: [",
            "    { productId: 'LAP101',",
            "      productName: 'Dell 15',",
            "      reason: '16GB RAM...',",
            "      price: 949.00,",
            "      availability: IN_STOCK }",
            "  ]",
            "  traceId: 'trace_abc123'",
        ],
        accent_bar_color=COLORS["node_blue_accent"],
        badge="OUTPUT",
    )

    # Stage 9: Explanation Builder
    draw_node(
        ax,
        x=4.0,
        y=1.3,
        width=2.8,
        height=3.6,
        title="Stage 9: Factual Explainer",
        subtitle_lines=[
            "Strict Grounding Rules:",
            "  - Only cites attributes in DB",
            "  - Banned Superlatives:",
            "    'best in class', 'perfect'",
            "Factual Statement:",
            "  'Matches budget ($949 < $1000)",
            "   and features 16GB RAM + SSD",
            "   to support dev workloads'",
        ],
        accent_bar_color=COLORS["node_emerald_accent"],
        badge="EXPLAIN",
    )

    # Stage 8: Weighted Ranking
    draw_node(
        ax,
        x=7.1,
        y=1.3,
        width=2.8,
        height=3.6,
        title="Stage 8: Weighted Ranking",
        subtitle_lines=[
            "Deterministic Weights:",
            "  - Hard constraints: 100%",
            "  - Budget fit: 30%",
            "  - Spec/Use-case fit: 30%",
            "  - Customer rating: 20%",
            "  - Stock availability: 10%",
            "  - User preference: 10%",
            "Calculates score (e.g. 0.87)",
        ],
        accent_bar_color=COLORS["node_amber_accent"],
        badge="SCORING",
    )

    # Stage 7: DB Product Retrieval
    draw_node(
        ax,
        x=10.2,
        y=1.3,
        width=2.9,
        height=3.6,
        title="Stage 7: DB Retrieval",
        subtitle_lines=[
            "PostgreSQL Execution:",
            "  Returns real records with:",
            "  - productId, price, rating",
            "  - attributes (RAM, SSD)",
            "  - available_quantity",
            "Zero invented products.",
            "If 0 matches: safe fallback",
            "with budget increase tip.",
        ],
        accent_bar_color=COLORS["node_indigo_accent"],
        badge="DB GROUND",
    )

    # Stage 6: Catalog Query Builder (Bottom Right)
    draw_node(
        ax,
        x=13.4,
        y=1.3,
        width=2.7,
        height=3.6,
        title="Stage 6: Query Builder",
        subtitle_lines=[
            "Dynamic SQL Generator:",
            "  SELECT p.*, a.*, inv.*",
            "  FROM products p",
            "  JOIN inventory_levels inv",
            "  WHERE p.category_id = :catId",
            "    AND p.price <= 1000",
            "    AND p.is_active = TRUE",
            "Hard constraint filtering.",
        ],
        accent_bar_color=COLORS["node_purple_accent"],
        badge="SQL BUILD",
    )

    # Bottom row connectors (Right to Left flow)
    draw_arrow(ax, start=(13.4, 3.1), end=(13.1, 3.1), color=COLORS["arrow_dark"])
    draw_arrow(ax, start=(10.2, 3.1), end=(9.9, 3.1), color=COLORS["arrow_dark"])
    draw_arrow(ax, start=(7.1, 3.1), end=(6.8, 3.1), color=COLORS["arrow_dark"])
    draw_arrow(ax, start=(4.0, 3.1), end=(3.7, 3.1), color=COLORS["arrow_green"])

    # Legend
    legend_items = [
        ("Client Interaction & Sanitization", COLORS["node_blue_bg"], COLORS["node_blue_border"]),
        ("AI Extraction & Intent Routing", COLORS["node_purple_bg"], COLORS["node_purple_border"]),
        ("PostgreSQL Grounding & Queries", COLORS["node_indigo_bg"], COLORS["node_indigo_border"]),
        ("Deterministic Ranking & Scoring", COLORS["node_amber_bg"], COLORS["node_amber_border"]),
        ("Factual Explanations (Zero Hallucination)", COLORS["node_emerald_bg"], COLORS["node_emerald_border"]),
    ]
    draw_legend(ax, x=0.6, y=0.15, width=15.8, height=0.65, items=legend_items, title="PIPELINE STAGE LEGEND")

    # Mermaid
    mermaid_code = """flowchart TD
    subgraph Part1["Part 1: Intent Extraction & Validation"]
        S1["Stage 1: User Query<br/>'Suggest a laptop under $1000 for Java & AI'"]
        S2["Stage 2: Input Sanitization & Prompt Guard<br/>Strip control chars, delimiter isolation"]
        S3["Stage 3: Intent Classification<br/>PRODUCT_RECOMMENDATION vs POLICY vs AGENT"]
        S4["Stage 4: Constraint Extraction<br/>JSON: Category, Budget ($1000), RAM, SSD"]
        S5{"Stage 5: Taxonomy Validation<br/>Budget > 0, Valid Category?"}
        
        S1 --> S2 --> S3 --> S4 --> S5
        S5 -- Ambiguous / Invalid --> Clarify["Return Clarifying Question<br/>'Do you prefer Windows or Mac?'"]
    end

    subgraph Part2["Part 2: Database Grounding & Factual Delivery"]
        S6["Stage 6: Catalog Query Builder<br/>Dynamic SQL filtering price <= budget, active"]
        S7[("Stage 7: PostgreSQL Retrieval<br/>Fetch real products & inventory levels")]
        S7_Check{"Products Found?"}
        S7_Empty["No Matches Response<br/>Suggest budget increase or broader filters"]
        
        S8["Stage 8: Deterministic Weighted Ranking<br/>Hard Match + Budget (30%) + Specs (30%) + Rating (20%)"]
        S9["Stage 9: Factual Explanation Builder<br/>Cites DB attributes only; bans superlatives"]
        S10["Stage 10: Final Response & Trace<br/>JSON payload + Product Cards + TraceId"]

        S5 -- Valid Constraints --> S6
        S6 --> S7 --> S7_Check
        S7_Check -- No --> S7_Empty
        S7_Check -- Yes --> S8 --> S9 --> S10
    end

    classDef fe fill:#EFF6FF,stroke:#3B82F6,stroke-width:2px;
    classDef ai fill:#ECFDF5,stroke:#10B981,stroke-width:2px;
    classDef db fill:#FFFBEB,stroke:#F59E0B,stroke-width:2px;
    classDef guard fill:#FFE4E6,stroke:#E11D48,stroke-width:2px;

    class S1,S10 fe;
    class S2,Clarify,S7_Empty guard;
    class S3,S4,S8,S9 ai;
    class S6,S7 db;
"""

    output_base = Path(__file__).resolve().parent / "07_shopping_assistant_pipeline"
    return save_diagram(fig, str(output_base), mermaid_code)


if __name__ == "__main__":
    result = generate()
    print("Generated 07_shopping_assistant_pipeline:", result)
