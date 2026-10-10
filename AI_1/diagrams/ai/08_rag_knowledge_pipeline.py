"""
Diagram 08: RAG Knowledge Assistant Ingestion & Retrieval Pipeline
PRD Sections: §7.1 - §7.16, §13.5, Appendix B
Deliverables: 08_rag_knowledge_pipeline.png, 08_rag_knowledge_pipeline.svg, 08_rag_knowledge_pipeline.mmd
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
        title="ShopSmart AI — RAG Knowledge Assistant Ingestion & Hybrid Retrieval Pipeline",
        subtitle="Version-Aware Ingestion, PgVector HNSW Storage, Hybrid Filtering, Grounded Citations, and Fallback Guards",
        prd_ref="PRD §7.1 - §7.16, §13.5, Appendix B",
        scope="MVP (GROUNDED RAG)",
    )

    # --- TOP ROW: Ingestion Pipeline ---
    draw_group(
        ax,
        x=0.6,
        y=5.8,
        width=15.8,
        height=4.4,
        title="Pipeline Stream 1: Enterprise Document Ingestion, Section Chunking & PgVector Storage",
        bg_color=COLORS["group_ops_bg"],
        border_color=COLORS["group_ops_border"],
        subtitle="Knowledge Admin uploads approved policies; parses, chunks, embeds, and indexes into PostgreSQL PgVector",
    )

    # Ingestion 1: Upload & Metadata
    draw_node(
        ax,
        x=0.9,
        y=6.2,
        width=2.8,
        height=3.4,
        title="1. Document Upload",
        subtitle_lines=[
            "Admin Console Upload:",
            "  POST /api/v1/admin/",
            "       knowledge/documents",
            "Formats: PDF, MD, JSON",
            "Metadata Form:",
            "  - title: 'Laptop Return'",
            "  - category: RETURN_POLICY",
            "  - version: '2026.1'",
            "  - effectiveDate: 2026-01-01",
            "  - region: 'US' / Global",
        ],
        accent_bar_color=COLORS["node_purple_accent"],
        badge="ADMIN UPLOAD",
    )

    # Ingestion 2: Parsing & Validation
    draw_node(
        ax,
        x=4.0,
        y=6.2,
        width=2.8,
        height=3.4,
        title="2. Parsing & Cleanse",
        subtitle_lines=[
            "Format Parsers:",
            "  - PDF: text & table extract",
            "  - MD: headings hierarchy",
            "  - JSON: flatten entities",
            "Validation Rules:",
            "  - Reject unparseable scans",
            "  - Compute SHA-256 checksum",
            "  - Status set to DRAFT",
            "  - Heading anchor preservation",
        ],
        accent_bar_color=COLORS["node_indigo_accent"],
        badge="PARSING",
    )

    # Ingestion 3: Section-Aware Chunking
    draw_node(
        ax,
        x=7.1,
        y=6.2,
        width=2.8,
        height=3.4,
        title="3. Section Chunking",
        subtitle_lines=[
            "Chunking Strategy:",
            "  - Size: 600 - 900 tokens",
            "  - Overlap: 80 - 120 tokens",
            "  - Section-aware splitting",
            "Chunk Payload:",
            "  - chunkId: 'chk_991'",
            "  - heading: 'Opened Products'",
            "  - content: policy text...",
            "  - metadata: JSONB attributes",
        ],
        accent_bar_color=COLORS["node_indigo_accent"],
        badge="CHUNKING",
    )

    # Ingestion 4: Embedding Generation
    draw_node(
        ax,
        x=10.2,
        y=6.2,
        width=2.8,
        height=3.4,
        title="4. Vector Embedding",
        subtitle_lines=[
            "Spring AI EmbeddingModel:",
            "  - Deterministic Mock (Demo)",
            "  - text-embedding-3-small",
            "Dense Vector Array:",
            "  - Dimension: 1536 / 384",
            "  - Normalized float[]",
            "Batch processing with retry",
            "and rate limit protection",
        ],
        accent_bar_color=COLORS["node_emerald_accent"],
        badge="SPRING AI",
    )

    # Ingestion 5: PgVector Storage & Activation
    draw_database(
        ax,
        x=13.3,
        y=6.2,
        width=2.8,
        height=3.4,
        title="5. PgVector Store",
        subtitle_lines=[
            "knowledge_chunks table:",
            "  embedding: VECTOR",
            "  HNSW Cosine Index",
            "Activation Workflow:",
            "  - Admin clicks 'Activate'",
            "  - Status -> ACTIVE",
            "  - Older versions marked",
            "    SUPERSEDED automatically",
        ],
        badge="PGVECTOR HNSW",
    )

    # Top row connectors
    draw_arrow(ax, start=(3.7, 7.9), end=(4.0, 7.9), color=COLORS["arrow_dark"])
    draw_arrow(ax, start=(6.8, 7.9), end=(7.1, 7.9), color=COLORS["arrow_dark"])
    draw_arrow(ax, start=(9.9, 7.9), end=(10.2, 7.9), color=COLORS["arrow_dark"])
    draw_arrow(ax, start=(13.0, 7.9), end=(13.3, 7.9), color=COLORS["arrow_emerald"])

    # Connecting Arrow from Top to Bottom
    draw_arrow(
        ax,
        start=(14.7, 6.2),
        end=(14.7, 5.0),
        label="HNSW Index Active for Queries",
        color=COLORS["arrow_green"],
    )

    # --- BOTTOM ROW: Retrieval & Grounding ---
    draw_group(
        ax,
        x=0.6,
        y=0.9,
        width=15.8,
        height=4.6,
        title="Pipeline Stream 2: Cross-Channel Hybrid Retrieval, Contradiction Resolution & Grounded Generation",
        bg_color=COLORS["group_ai_bg"],
        border_color=COLORS["group_ai_border"],
        subtitle="Shared identically across Customer Chat and Support Agent Console for 100% policy consistency",
    )

    # Retrieval 5: Client Response with Citations (Bottom Left)
    draw_node(
        ax,
        x=0.9,
        y=1.3,
        width=2.8,
        height=3.6,
        title="10. Grounded Response",
        subtitle_lines=[
            "Response with Citation:",
            "  answer: 'Opened laptops can",
            "   be returned within 7 days",
            "   without physical damage'",
            "  confidence: HIGH",
            "  sources: [",
            "    document: 'Laptop Return',",
            "    section: 'Opened Products',",
            "    version: '2026.1',",
            "    chunkId: 'chk_991' ]",
        ],
        accent_bar_color=COLORS["node_blue_accent"],
        badge="RESPONSE",
    )

    # Retrieval 4: Grounded LLM Generation
    draw_node(
        ax,
        x=4.0,
        y=1.3,
        width=2.8,
        height=3.6,
        title="9. Grounded Generation",
        subtitle_lines=[
            "Strict Prompt Rules:",
            "  - Only use provided context",
            "  - Do not use outside facts",
            "  - Cite exact source chunk IDs",
            "  - Do not speculate",
            "Anti-Hallucination Guard:",
            "  Response validator checks",
            "  for source citations",
        ],
        accent_bar_color=COLORS["node_emerald_accent"],
        badge="PROMPT GUARD",
    )

    # Retrieval 3: Contradiction & Confidence Filter
    draw_node(
        ax,
        x=7.1,
        y=1.3,
        width=2.8,
        height=3.6,
        title="8. Conflict & Confidence",
        subtitle_lines=[
            "Contradiction Policy:",
            "  1. Prefer latest effectiveDate",
            "  2. Prefer regional over global",
            "  3. If unresolved conflict:",
            "     - confidence -> LOW",
            "     - caveat policy ambiguity",
            "     - suggest human escalation",
            "     - flag admin review queue",
        ],
        accent_bar_color=COLORS["node_amber_accent"],
        badge="RESOLVER",
    )

    # Retrieval 2: Similarity Threshold Guard
    draw_node(
        ax,
        x=10.2,
        y=1.3,
        width=2.8,
        height=3.6,
        title="7. Similarity Guard",
        subtitle_lines=[
            "KNN Distance Threshold:",
            "  Top K chunks (K=5)",
            "  cosine_similarity >= 0.72",
            "NO EVIDENCE FALLBACK:",
            "  If all chunks < threshold:",
            "  - confidence: NONE",
            "  - 'I don't have enough",
            "     approved policy info'",
            "  - Zero guessing allowed",
        ],
        accent_bar_color=COLORS["node_rose_accent"],
        badge="THRESHOLD",
    )

    # Retrieval 1: User / Support Query (Bottom Right)
    draw_node(
        ax,
        x=13.3,
        y=1.3,
        width=2.8,
        height=3.6,
        title="6. Knowledge Query",
        subtitle_lines=[
            "Channel Request:",
            "  POST /api/v1/assistant/",
            "       knowledge/query",
            "Query: 'Can I return an",
            "        opened laptop?'",
            "Filters Passed:",
            "  status = 'ACTIVE'",
            "  latest effectiveDate",
            "  region = 'US' (if known)",
        ],
        accent_bar_color=COLORS["node_blue_accent"],
        badge="QUERY",
    )

    # Bottom row connectors (Right to Left flow)
    draw_arrow(ax, start=(13.3, 3.1), end=(13.0, 3.1), color=COLORS["arrow_dark"])
    draw_arrow(ax, start=(10.2, 3.1), end=(9.9, 3.1), color=COLORS["arrow_dark"])
    draw_arrow(ax, start=(7.1, 3.1), end=(6.8, 3.1), color=COLORS["arrow_dark"])
    draw_arrow(ax, start=(4.0, 3.1), end=(3.7, 3.1), color=COLORS["arrow_green"])

    # Legend
    legend_items = [
        ("Document Ingestion & Admin Actions", COLORS["node_purple_bg"], COLORS["node_purple_border"]),
        ("PgVector HNSW Storage & Indexes", COLORS["node_amber_bg"], COLORS["node_amber_border"]),
        ("Similarity Guards & Fallbacks", COLORS["node_rose_bg"], COLORS["node_rose_border"]),
        ("Grounded LLM Generation & Citations", COLORS["node_emerald_bg"], COLORS["node_emerald_border"]),
    ]
    draw_legend(ax, x=0.6, y=0.15, width=15.8, height=0.65, items=legend_items, title="RAG PIPELINE LEGEND")

    # Mermaid
    mermaid_code = """flowchart TD
    subgraph Ingestion["Stream 1: Document Ingestion & PgVector Embedding"]
        Doc_Upload["Admin Uploads PDF / MD / JSON<br/>Metadata: Title, Category, Version, Region"]
        Doc_Parse["Parse & Clean Text<br/>Heading anchors, Strip invalid artifacts"]
        Doc_Chunk["Section-Aware Chunking<br/>600-900 tokens, 80-120 token overlap"]
        Doc_Embed["Spring AI EmbeddingModel<br/>Generate 1536d / 384d dense vector"]
        DB_Store[("PgVector Storage<br/>knowledge_chunks table (HNSW index)<br/>Status: ACTIVE, Version Superseding")]
        
        Doc_Upload --> Doc_Parse --> Doc_Chunk --> Doc_Embed --> DB_Store
    end

    subgraph Retrieval["Stream 2: Hybrid Retrieval & Grounded Generation"]
        Query_In["Customer / Support Query<br/>'Can I return an opened laptop?'"]
        KNN_Search["Hybrid KNN Cosine Search<br/>Filter: status=ACTIVE, latest version, region"]
        Threshold_Check{"Cosine Similarity >= Threshold?"}
        Fallback_NoEv["Safe Fallback (confidence: NONE)<br/>'I don't have enough approved info...'"]
        Conflict_Check{"Contradictory Active Policies?"}
        Resolve_Date["Prefer Latest effectiveDate<br/>Flag confidence: LOW + Support Escalation"]
        Grounded_Gen["Grounded Answer Generation<br/>Strict Chunk-Only Context, Zero Speculation"]
        Response_Out["Deliver Answer with Citations<br/>Document Name, Section, Version, ChunkId"]

        Query_In --> KNN_Search
        DB_Store -.->|Vector KNN Match| KNN_Search
        KNN_Search --> Threshold_Check
        Threshold_Check -- Below Threshold --> Fallback_NoEv
        Threshold_Check -- Above Threshold --> Conflict_Check
        Conflict_Check -- Yes --> Resolve_Date --> Grounded_Gen
        Conflict_Check -- No (Clear Evidence) --> Grounded_Gen
        Grounded_Gen --> Response_Out
    end

    classDef ops fill:#F5F3FF,stroke:#8B5CF6,stroke-width:2px;
    classDef db fill:#FFFBEB,stroke:#F59E0B,stroke-width:2px;
    classDef ai fill:#ECFDF5,stroke:#10B981,stroke-width:2px;
    classDef guard fill:#FFE4E6,stroke:#E11D48,stroke-width:2px;

    class Doc_Upload,Doc_Parse,Doc_Chunk,Doc_Embed ops;
    class DB_Store db;
    class Query_In,Response_Out ai;
    class KNN_Search,Conflict_Check,Resolve_Date,Grounded_Gen ai;
    class Threshold_Check,Fallback_NoEv guard;
"""

    output_base = Path(__file__).resolve().parent / "08_rag_knowledge_pipeline"
    return save_diagram(fig, str(output_base), mermaid_code)


if __name__ == "__main__":
    result = generate()
    print("Generated 08_rag_knowledge_pipeline:", result)
