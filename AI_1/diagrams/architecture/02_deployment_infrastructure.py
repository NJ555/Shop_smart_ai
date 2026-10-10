"""
Diagram 02: Deployment & Infrastructure Architecture (Local Docker Compose)
PRD Sections: §4.4, §22.1 - §22.6
Deliverables: 02_deployment_infrastructure.png, 02_deployment_infrastructure.svg, 02_deployment_infrastructure.mmd
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
        title="ShopSmart AI — Local & Container Deployment Architecture",
        subtitle="Docker Compose Topography, Container Networks, Port Mappings, Volumes, and Seed Pipeline",
        prd_ref="PRD §4.4, §22.1 - §22.6",
        scope="MVP",
    )

    # 1. Developer / Evaluator Host Workstation Outer Group
    draw_group(
        ax,
        x=0.6,
        y=0.9,
        width=15.8,
        height=9.3,
        title="Evaluation Host Machine (Developer Workstation / Demo Environment)",
        bg_color=COLORS["bg_canvas"],
        border_color="#94A3B8",
        border_style="solid",
        subtitle="Local OS: Windows / macOS / Linux with Docker Desktop & Docker Compose 2.0+",
    )

    # Browser / Client Box on Host
    draw_node(
        ax,
        x=1.0,
        y=8.2,
        width=3.6,
        height=1.4,
        title="Host Web Browser",
        subtitle_lines=[
            "URL: http://localhost:5173",
            "React 19 Single Page App",
            "Inspect DevTools & Network Tabs",
        ],
        accent_bar_color=COLORS["node_blue_accent"],
        bg_color=COLORS["node_blue_bg"],
        border_color=COLORS["node_blue_border"],
    )

    # Terminal / CLI Runner Box on Host
    draw_node(
        ax,
        x=12.2,
        y=8.2,
        width=3.8,
        height=1.4,
        title="Developer CLI / Runner",
        subtitle_lines=[
            "docker compose up -d db",
            "./mvnw spring-boot:run",
            "npm run dev (Port 5173)",
        ],
        accent_bar_color=COLORS["node_slate_accent"],
        bg_color=COLORS["node_slate_bg"],
        border_color=COLORS["node_slate_border"],
    )

    # 2. Docker Compose Network Group
    draw_group(
        ax,
        x=1.0,
        y=1.2,
        width=15.0,
        height=6.6,
        title="Bridge Network: shopsmart-network (docker-compose.yml)",
        bg_color="#FFFFFF",
        border_color=COLORS["group_backend_border"],
        subtitle="Internal Container DNS Resolution, Isolated Subnet, and Bridged Port Forwards",
    )

    # Container 1: Frontend
    draw_group(
        ax,
        x=1.3,
        y=4.5,
        width=4.3,
        height=3.0,
        title="Container: frontend",
        bg_color=COLORS["group_frontend_bg"],
        border_color=COLORS["group_frontend_border"],
        subtitle="Node 20-Alpine | Vite 6 | React 19",
    )

    draw_node(
        ax,
        x=1.5,
        y=5.8,
        width=3.9,
        height=0.9,
        title="Vite Dev Server (Port 5173)",
        subtitle_lines=["Hot Module Replacement (HMR)", "Host Port Binding: 5173:5173"],
        accent_bar_color=COLORS["node_blue_accent"],
    )

    draw_node(
        ax,
        x=1.5,
        y=4.7,
        width=3.9,
        height=0.9,
        title="Frontend Environment",
        subtitle_lines=[
            "VITE_API_BASE_URL=",
            "  http://localhost:8080/api/v1",
        ],
        accent_bar_color=COLORS["node_blue_accent"],
    )

    # Container 2: Backend
    draw_group(
        ax,
        x=6.0,
        y=3.5,
        width=5.2,
        height=4.0,
        title="Container: backend",
        bg_color=COLORS["group_backend_bg"],
        border_color=COLORS["group_backend_border"],
        subtitle="Eclipse Temurin JDK 21 | Spring Boot 3.3 | Spring AI",
    )

    draw_node(
        ax,
        x=6.2,
        y=6.0,
        width=4.8,
        height=0.9,
        title="Spring Boot App (Port 8080)",
        subtitle_lines=["HikariCP Connection Pool (20 conns)", "Host Port Binding: 8080:8080"],
        accent_bar_color=COLORS["node_indigo_accent"],
    )

    draw_node(
        ax,
        x=6.2,
        y=4.8,
        width=4.8,
        height=1.0,
        title="Backend Environment Variables",
        subtitle_lines=[
            "SPRING_DATASOURCE_URL=jdbc:postgresql://db:5432/shopsmart",
            "AI_PROVIDER=mock (or openai / ollama)",
            "JWT_SECRET=production-grade-hmac-key-256",
        ],
        accent_bar_color=COLORS["node_indigo_accent"],
    )

    draw_node(
        ax,
        x=6.2,
        y=3.7,
        width=4.8,
        height=0.9,
        title="Spring AI Model Provider Adapter",
        subtitle_lines=[
            "Deterministic Mock Mode (No API keys needed)",
            "Cloud LLM Fallback (OpenAI gpt-4o / Ollama local)",
        ],
        accent_bar_color=COLORS["node_emerald_accent"],
        badge="SWAPPABLE",
    )

    # Container 3: Database (PostgreSQL + PgVector)
    draw_group(
        ax,
        x=11.6,
        y=2.5,
        width=4.2,
        height=5.0,
        title="Container: db",
        bg_color=COLORS["group_data_bg"],
        border_color=COLORS["group_data_border"],
        subtitle="pgvector/pgvector:pg15 (Port 5432)",
    )

    draw_database(
        ax,
        x=11.8,
        y=5.5,
        width=3.8,
        height=1.1,
        title="PostgreSQL 15 Engine",
        subtitle_lines=["Relational Schema, Constraints", "Host Port Binding: 5432:5432"],
    )

    draw_database(
        ax,
        x=11.8,
        y=4.2,
        width=3.8,
        height=1.1,
        title="PgVector Extension",
        subtitle_lines=["vector(1536) / vector(384)", "HNSW Index for Fast Cosine KNN"],
        badge="PGVECTOR",
    )

    draw_node(
        ax,
        x=11.8,
        y=2.7,
        width=3.8,
        height=1.3,
        title="Mounted Volumes & Seeds",
        subtitle_lines=[
            "Named Volume: shopsmart_pgdata",
            "/docker-entrypoint-initdb.d/:",
            "  - 01_init_schema.sql (Flyway/DDL)",
            "  - 02_seed_catalog_and_users.sql",
        ],
        accent_bar_color=COLORS["node_amber_accent"],
    )

    # Seed and Config Box
    draw_group(
        ax,
        x=1.3,
        y=1.5,
        width=10.0,
        height=1.8,
        title="Seeded Hackathon Datasets & Document Storage Volume",
        bg_color=COLORS["group_ops_bg"],
        border_color=COLORS["group_ops_border"],
        subtitle="Deterministic Live Evaluation Bootstrap Data (PRD Appendix D)",
    )

    draw_node(
        ax,
        x=1.5,
        y=1.7,
        width=3.0,
        height=1.0,
        title="Catalog & Users Seed",
        subtitle_lines=[
            "3 Categories (Laptops, Phones, etc)",
            "20+ Products with Attributes",
            "3 Seeded Users (Cust, Supp, Admin)",
        ],
        accent_bar_color=COLORS["node_purple_accent"],
    )

    draw_node(
        ax,
        x=4.8,
        y=1.7,
        width=3.0,
        height=1.0,
        title="Policy Document Store",
        subtitle_lines=[
            "Mounted: ./docs/policies/*.pdf",
            "Return, Refund & Shipping v2026.1",
            "Chunked & Embedded on Startup",
        ],
        accent_bar_color=COLORS["node_purple_accent"],
    )

    draw_node(
        ax,
        x=8.1,
        y=1.7,
        width=3.0,
        height=1.0,
        title="Simulated State Seed",
        subtitle_lines=[
            "2 Sample Orders (Created / Shipped)",
            "1 Simulated Shipment Timeline",
            "Simulated Inventory Stock Levels",
        ],
        accent_bar_color=COLORS["node_purple_accent"],
    )

    # Arrows
    # Browser to Frontend (Port 5173)
    draw_arrow(
        ax,
        start=(2.8, 8.2),
        end=(2.8, 7.5),
        label="HTTP :5173 (Assets & SPA HTML)",
        color=COLORS["arrow_blue"],
    )

    # Browser to Backend (Port 8080)
    draw_arrow(
        ax,
        start=(4.6, 8.5),
        end=(7.5, 7.5),
        label="XHR / Fetch -> http://localhost:8080/api/v1",
        color=COLORS["arrow_dark"],
        connectionstyle="arc3,rad=-0.15",
    )

    # Backend to Database (Internal DNS db:5432)
    draw_arrow(
        ax,
        start=(11.2, 5.5),
        end=(11.8, 5.5),
        label="JDBC: db:5432",
        color=COLORS["arrow_dark"],
    )

    # Legend
    legend_items = [
        ("Host Machine / Dev Boundary", COLORS["bg_canvas"], "#94A3B8"),
        ("Docker Containerized Service", COLORS["node_indigo_bg"], COLORS["node_indigo_border"]),
        ("Persistent DB / Volume Storage", COLORS["node_amber_bg"], COLORS["node_amber_border"]),
        ("Seeded Bootstrap Artifacts", COLORS["node_purple_bg"], COLORS["node_purple_border"]),
    ]
    draw_legend(ax, x=0.6, y=0.15, width=15.8, height=0.65, items=legend_items, title="INFRASTRUCTURE LEGEND")

    # Mermaid
    mermaid_code = """flowchart TB
    subgraph Host["Developer Workstation / Evaluation Host"]
        Browser["Host Web Browser<br/>http://localhost:5173"]
        CLI["Developer CLI Tools<br/>docker compose | mvnw | npm"]

        subgraph DockerNet["Docker Bridge Network (shopsmart-network)"]
            subgraph Container_FE["Container: frontend (Node 20 / Vite)"]
                Vite["Vite Dev Server<br/>Port 5173:5173<br/>React 19 Frontend SPA"]
            end

            subgraph Container_BE["Container: backend (Java 21 / Spring Boot 3)"]
                SpringApp["Spring Boot 3 App<br/>Port 8080:8080<br/>HikariCP Pool (20 conns)"]
                SpringAI["Spring AI Adapters<br/>AI_PROVIDER=mock | openai | ollama"]
            end

            subgraph Container_DB["Container: db (pgvector/pgvector:pg15)"]
                PG["PostgreSQL 15 Server<br/>Port 5432:5432"]
                PgVector["PgVector Extension<br/>HNSW Vector Index"]
                InitScripts["Entrypoint Init SQL<br/>01_init_schema.sql<br/>02_seed_data.sql"]
            end

            subgraph Volumes["Host Mounted Volumes"]
                Vol_DB[("shopsmart_pgdata<br/>Named Volume")]
                Vol_Docs["./docs/policies/<br/>Policy PDFs & MD"]
            end
        end
    end

    Browser -->|HTTP :5173| Vite
    Browser -->|REST API :8080/api/v1| SpringApp
    CLI -.->|docker compose up| DockerNet
    SpringApp -->|JDBC: db:5432/shopsmart| PG
    SpringAI -->|Embeddings & KNN Queries| PgVector
    InitScripts -->|Exec on first boot| PG
    PG --- Vol_DB
    SpringApp --- Vol_Docs

    classDef fe fill:#EFF6FF,stroke:#3B82F6,stroke-width:2px;
    classDef be fill:#EEF2FF,stroke:#6366F1,stroke-width:2px;
    classDef db fill:#FFFBEB,stroke:#F59E0B,stroke-width:2px;
    classDef vol fill:#F5F3FF,stroke:#8B5CF6,stroke-width:2px;
    classDef host fill:#F8FAFC,stroke:#94A3B8,stroke-width:2px;

    class Browser,CLI host;
    class Vite,Container_FE fe;
    class SpringApp,SpringAI,Container_BE be;
    class PG,PgVector,InitScripts,Container_DB db;
    class Vol_DB,Vol_Docs,Volumes vol;
"""

    output_base = Path(__file__).resolve().parent / "02_deployment_infrastructure"
    return save_diagram(fig, str(output_base), mermaid_code)


if __name__ == "__main__":
    result = generate()
    print("Generated 02_deployment_infrastructure:", result)
