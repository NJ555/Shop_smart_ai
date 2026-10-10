"""
Diagram 12: Security Architecture, Trust Boundaries & RBAC Matrix
PRD Sections: §5.1, §8.9 - §8.10, §18.1 - §18.6
Deliverables: 12_security_rbac_trust_boundaries.png, 12_security_rbac_trust_boundaries.svg, 12_security_rbac_trust_boundaries.mmd
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
        title="ShopSmart AI — Security Architecture, Trust Boundaries & RBAC Matrix",
        subtitle="Zero-Trust Enclaves, JWT Filter, Ownership Isolation, Role Matrix, and Human Approval Gates",
        prd_ref="PRD §5.1, §8.9 - §8.10, §18.1 - §18.6",
        scope="MVP (SECURITY & RBAC)",
    )

    # 1. Untrusted Public Zone & Perimeter Defense (Top Left)
    draw_group(
        ax,
        x=0.6,
        y=5.8,
        width=4.8,
        height=4.4,
        title="Zone 1: Public Internet & Perimeter",
        bg_color=COLORS["group_simulated_bg"],
        border_color=COLORS["group_simulated_border"],
        border_style="dashed",
        subtitle="Untrusted Traffic & Rate Limiting",
    )

    draw_node(
        ax,
        x=0.9,
        y=8.2,
        width=4.2,
        height=1.4,
        title="Untrusted Client Traffic",
        subtitle_lines=[
            "Web Browsers, Mobile Web, External Calls",
            "Potential threats: SQLi, XSS, Brute force,",
            "Token replay, Prompt injections, IDOR",
        ],
        accent_bar_color=COLORS["node_slate_accent"],
        badge="UNTRUSTED",
    )

    draw_node(
        ax,
        x=0.9,
        y=6.2,
        width=4.2,
        height=1.6,
        title="Perimeter Defense & Filters",
        subtitle_lines=[
            "1. CORS: Restricted to frontend origin",
            "2. Rate Limiting:",
            "   - Auth endpoints: 5 req/min",
            "   - Assistant endpoints: 20 req/min",
            "   - Checkout: 10 req/min",
            "3. RFC 7807 Problem JSON errors",
        ],
        accent_bar_color=COLORS["node_rose_accent"],
        badge="PERIMETER",
    )

    draw_arrow(ax, start=(3.0, 8.2), end=(3.0, 7.8), label="HTTPS (TLS 1.3)", color=COLORS["arrow_dark"])

    # 2. Authentication Boundary (Center Left)
    draw_group(
        ax,
        x=5.8,
        y=5.8,
        width=5.2,
        height=4.4,
        title="Zone 2: Authentication Gateway",
        bg_color=COLORS["group_frontend_bg"],
        border_color=COLORS["group_frontend_border"],
        subtitle="Cryptographic Identity Verification",
    )

    draw_node(
        ax,
        x=6.1,
        y=8.2,
        width=4.6,
        height=1.4,
        title="BCrypt Credential Verification",
        subtitle_lines=[
            "Registration & Login Endpoints:",
            "  - Passwords hashed with BCrypt (cost=12)",
            "  - RFC-compliant email uniqueness",
            "  - Zero plaintext credentials in logs",
        ],
        accent_bar_color=COLORS["node_blue_accent"],
        badge="BCRYPT",
    )

    draw_node(
        ax,
        x=6.1,
        y=6.2,
        width=4.6,
        height=1.6,
        title="Spring Security JWT Filter",
        subtitle_lines=[
            "Stateless Bearer Token Validation:",
            "  - sub: user_id (UUID)",
            "  - roles: ['CUSTOMER', ...]",
            "  - exp: 15 - 30 minutes expiration",
            "Server-side role extraction & context binding",
        ],
        accent_bar_color=COLORS["node_blue_accent"],
        badge="JWT FILTER",
    )

    draw_arrow(ax, start=(5.4, 7.0), end=(5.8, 7.0), color=COLORS["arrow_dark"])

    # 3. Data Isolation Boundary (Top Right)
    draw_group(
        ax,
        x=11.4,
        y=5.8,
        width=5.0,
        height=4.4,
        title="Zone 3: Tenant & Ownership Guard",
        bg_color=COLORS["group_security_bg"],
        border_color=COLORS["group_security_border"],
        subtitle="IDOR Prevention & Data Privacy (PRD §18.2)",
    )

    draw_node(
        ax,
        x=11.7,
        y=8.0,
        width=4.4,
        height=1.8,
        title="Strict Resource Ownership Checks",
        subtitle_lines=[
            "Enforced on all customer endpoints:",
            "  orders.user_id == jwt.sub",
            "  carts.user_id == jwt.sub",
            "  wishlists.user_id == jwt.sub",
            "Violations return 403 Forbidden / 404",
            "Prevent cross-customer snooping",
        ],
        accent_bar_color=COLORS["node_rose_accent"],
        badge="ANTI-IDOR",
    )

    draw_node(
        ax,
        x=11.7,
        y=6.0,
        width=4.4,
        height=1.6,
        title="PII Masking & Privacy Guard",
        subtitle_lines=[
            "Customer data protection (§18.5):",
            "  - Mask phone/email in agent traces",
            "  - Do not log full address unnecessarily",
            "  - DTO projections prevent mass assignment",
        ],
        accent_bar_color=COLORS["node_rose_accent"],
        badge="PII PRIVACY",
    )

    draw_arrow(ax, start=(11.0, 7.0), end=(11.4, 7.0), label="Authorized Context", color=COLORS["arrow_green"])

    # 4. RBAC Matrix & Human-in-the-Loop Approval (Bottom Section)
    draw_group(
        ax,
        x=0.6,
        y=0.9,
        width=15.8,
        height=4.6,
        title="Zone 4: Role-Based Access Control (RBAC) Hierarchy & Protected Operations Enclave",
        bg_color=COLORS["group_backend_bg"],
        border_color=COLORS["group_backend_border"],
        subtitle="Server-Enforced Role Privileges and Human Approval Gate for Irreversible Actions (PRD §5.1, §8.9)",
    )

    # 6 Roles displayed side-by-side
    roles = [
        ("CUSTOMER", "Customer Platform", ["Shop, Search, Filter", "AI Shopping Assistant", "Own Cart / Checkout", "Track own orders"], COLORS["node_blue_bg"], COLORS["node_blue_border"], "SELF"),
        ("SUPPORT_AGENT", "Customer Support", ["Read all customer orders", "Grounded RAG answers", "Create support tickets", "Escalate issues"], COLORS["node_indigo_bg"], COLORS["node_indigo_border"], "SUPPORT"),
        ("OPS_MANAGER", "Operations Mgmt", ["Inventory visibility", "Stock adjustments", "Fulfillment overrides", "Approve refunds"], COLORS["node_purple_bg"], COLORS["node_purple_border"], "OPS"),
        ("CATALOG_MGR", "Catalog Manager", ["Category hierarchy CRUD", "Product create/update", "Upload product images", "Disable products"], COLORS["node_amber_bg"], COLORS["node_amber_border"], "CATALOG"),
        ("KNOWLEDGE_ADM", "Knowledge Admin", ["Upload policy documents", "Preview RAG chunks", "Activate documents", "Review contradictions"], COLORS["node_emerald_bg"], COLORS["node_emerald_border"], "KNOWLEDGE"),
        ("ADMIN", "System Admin", ["Full system access", "Change pricing/promos", "Manage all users", "Audit log inspector"], COLORS["node_rose_bg"], COLORS["node_rose_border"], "FULL ADMIN"),
    ]

    rx = 0.9
    for r_title, r_sub, r_bullets, r_bg, r_border, r_badge in roles:
        draw_node(
            ax,
            x=rx,
            y=1.3,
            width=2.4,
            height=3.6,
            title=f"Role: {r_title}",
            subtitle_lines=[f"Domain: {r_sub}"] + [f"- {b}" for b in r_bullets],
            bg_color=r_bg,
            border_color=r_border,
            accent_bar_color=r_border,
            badge=r_badge,
        )
        rx += 2.6

    # Legend
    legend_items = [
        ("Public / Untrusted Zone", COLORS["node_slate_bg"], COLORS["node_slate_border"]),
        ("Authentication Gateway", COLORS["node_blue_bg"], COLORS["node_blue_border"]),
        ("Tenant Ownership & PII Guard", COLORS["node_rose_bg"], COLORS["node_rose_border"]),
        ("RBAC Role Boundaries", COLORS["node_indigo_bg"], COLORS["node_indigo_border"]),
    ]
    draw_legend(ax, x=0.6, y=0.15, width=15.8, height=0.65, items=legend_items, title="SECURITY ARCHITECTURE LEGEND")

    # Mermaid
    mermaid_code = """flowchart TB
    subgraph Zone1["Zone 1: Public Perimeter (Untrusted)"]
        Client["Browser Client / Untrusted Caller"]
        Perimeter["Perimeter Security: CORS + Rate Limiter + Problem JSON"]
        Client -->|HTTPS TLS 1.3| Perimeter
    end

    subgraph Zone2["Zone 2: Authentication Gateway"]
        AuthFilter["Spring Security JWT Filter"]
        BCrypt["BCrypt Password Verifier (Cost 12)"]
        Perimeter -->|Bearer JWT Header| AuthFilter
        Perimeter -->|Login POST| BCrypt
        BCrypt -->|Issue Token| AuthFilter
    end

    subgraph Zone3["Zone 3: Tenant & Ownership Guard"]
        IDOR_Check{"Resource Ownership Check<br/>orders.user_id == jwt.sub?"}
        PII_Mask["PII Protection & DTO Filtering<br/>Mask sensitive customer data"]
        AuthFilter --> IDOR_Check
        IDOR_Check -- No --> Reject[403 Forbidden / 404]
        IDOR_Check -- Yes --> PII_Mask
    end

    subgraph Zone4["Zone 4: RBAC Role Enclave"]
        Role_Cust["CUSTOMER<br/>Browse, Cart, Checkout, Own Orders"]
        Role_Supp["SUPPORT_AGENT<br/>Order Lookup, Grounded RAG, Escalations"]
        Role_Ops["OPS_MANAGER<br/>Stock Adjustments, Refund Approvals"]
        Role_Cat["CATALOG_MANAGER<br/>Category & Product CRUD"]
        Role_Know["KNOWLEDGE_ADMIN<br/>Upload & Activate Policy Docs"]
        Role_Admin["ADMIN<br/>Full Access & System Configuration"]
        Role_Runtime["AGENT_RUNTIME<br/>Strict Tool Execution Allowlist"]
    end

    PII_Mask --> Zone4

    classDef pub fill:#F1F5F9,stroke:#64748B,stroke-width:2px;
    classDef auth fill:#EFF6FF,stroke:#3B82F6,stroke-width:2px;
    classDef guard fill:#FFE4E6,stroke:#E11D48,stroke-width:2px;
    classDef rbac fill:#EEF2FF,stroke:#6366F1,stroke-width:2px;

    class Client,Perimeter pub;
    class AuthFilter,BCrypt auth;
    class IDOR_Check,PII_Mask,Reject guard;
    class Role_Cust,Role_Supp,Role_Ops,Role_Cat,Role_Know,Role_Admin,Role_Runtime rbac;
"""

    output_base = Path(__file__).resolve().parent / "12_security_rbac_trust_boundaries"
    return save_diagram(fig, str(output_base), mermaid_code)


if __name__ == "__main__":
    result = generate()
    print("Generated 12_security_rbac_trust_boundaries:", result)
