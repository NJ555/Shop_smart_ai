"""
ShopSmart AI — Central Diagram Automation Suite Generator
Entry point to regenerate, validate, and verify the entire system design diagram suite.

Usage:
    python generate_all.py                  # Generate all 15 diagrams (.png, .svg, .mmd)
    python generate_all.py --verify-only    # Verify all generated deliverables exist
    python generate_all.py --filter 01      # Generate only matching diagrams
"""

import os
import sys
import argparse
import time
from pathlib import Path
from typing import Dict, List, Tuple

# Ensure diagrams root is in sys.path
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

from common.mermaid_utils import validate_mermaid_source

# Diagram registry: (module_relative_path, display_name, prd_sections, scope)
DIAGRAM_REGISTRY = [
    # Architecture
    (
        "architecture.01_system_overview",
        "01_system_overview",
        "System Architecture Overview (Modular Monolith)",
        "PRD §4.1 - §4.5, §10, §22",
        "MVP",
    ),
    (
        "architecture.02_deployment_infrastructure",
        "02_deployment_infrastructure",
        "Local & Container Deployment Architecture",
        "PRD §4.4, §22.1 - §22.6",
        "MVP",
    ),
    (
        "architecture.03_mvp_vs_evolution",
        "03_mvp_vs_evolution",
        "MVP vs. Post-Hackathon Evolution",
        "PRD §2.1 - §2.4, §4.2, §23",
        "MVP vs FUTURE",
    ),
    # Workflows
    (
        "workflows.04_customer_journey",
        "04_customer_journey",
        "Customer End-to-End Journey Workflow",
        "PRD §3.1 - §3.3, §5.1 - §5.9",
        "MVP",
    ),
    (
        "workflows.05_checkout_sequence",
        "05_checkout_sequence",
        "Atomic Checkout & Stock Reservation Sequence",
        "PRD §5.8, §5.9, §11.6, §14.1, §15.2",
        "MVP",
    ),
    (
        "workflows.06_async_events_outbox",
        "06_async_events_outbox",
        "Async Events & Transactional Outbox Pattern",
        "PRD §4.5, §10.2, §12.1 - §12.3",
        "MVP",
    ),
    # AI
    (
        "ai.07_shopping_assistant_pipeline",
        "07_shopping_assistant_pipeline",
        "10-Stage AI Shopping Assistant Pipeline",
        "PRD §6.1 - §6.11, Appendix A",
        "MVP",
    ),
    (
        "ai.08_rag_knowledge_pipeline",
        "08_rag_knowledge_pipeline",
        "RAG Knowledge Ingestion & Hybrid Retrieval",
        "PRD §7.1 - §7.16, §13.5, Appendix B",
        "MVP",
    ),
    (
        "ai.09_agentic_operations",
        "09_agentic_operations",
        "Agentic Operations & Controlled Tool Execution",
        "PRD §8.1 - §8.15, Appendix C",
        "MVP",
    ),
    # Data Models
    (
        "data_models.10_entity_relationship_diagram",
        "10_entity_relationship_diagram",
        "Complete Database ERD & Relational Schema",
        "PRD §10.1, §10.2",
        "MVP",
    ),
    (
        "data_models.11_lifecycle_state_machines",
        "11_lifecycle_state_machines",
        "Unified Lifecycle State Machines Suite",
        "PRD §13.1 - §13.5, §14.4 - §14.5",
        "MVP",
    ),
    # Security
    (
        "security.12_security_rbac_trust_boundaries",
        "12_security_rbac_trust_boundaries",
        "Security Architecture, Trust Boundaries & RBAC",
        "PRD §5.1, §8.9 - §8.10, §18.1 - §18.6",
        "MVP",
    ),
    (
        "security.13_ai_safety_guardrails",
        "13_ai_safety_guardrails",
        "AI Safety, Anti-Hallucination & Guardrails",
        "PRD §6.10, §7.16, §8.14, §18.4",
        "MVP",
    ),
    # Operations
    (
        "operations.14_failure_modes_and_recovery",
        "14_failure_modes_and_recovery",
        "Failure Modes & Recovery Playbooks",
        "PRD §14, §15.1 - §15.9",
        "MVP",
    ),
    (
        "operations.15_observability_audit_eval",
        "15_observability_audit_eval",
        "Observability, AI Traces & Testing Strategy",
        "PRD §19.1 - §19.4, §20.1 - §20.4, §21",
        "MVP",
    ),
]


def format_size(num_bytes: int) -> str:
    if num_bytes >= 1024 * 1024:
        return f"{num_bytes / (1024 * 1024):.1f} MB"
    elif num_bytes >= 1024:
        return f"{num_bytes / 1024:.1f} KB"
    return f"{num_bytes} B"


def verify_diagram_deliverables(name: str, rel_path: str) -> Tuple[bool, str, Dict[str, int]]:
    subfolder = rel_path.split(".")[0]
    folder = BASE_DIR / subfolder
    
    png_file = folder / f"{name}.png"
    svg_file = folder / f"{name}.svg"
    mmd_file = folder / f"{name}.mmd"
    
    missing = []
    sizes = {}
    
    for f, ftype in [(png_file, "PNG"), (svg_file, "SVG"), (mmd_file, "MMD")]:
        if not f.exists():
            missing.append(f"Missing {ftype}")
        elif f.stat().st_size == 0:
            missing.append(f"Empty {ftype}")
        else:
            sizes[ftype.lower()] = f.stat().st_size
            
    # Validate mermaid content
    if mmd_file.exists() and mmd_file.stat().st_size > 0:
        with open(mmd_file, "r", encoding="utf-8") as mf:
            content = mf.read()
        is_valid, errs = validate_mermaid_source(content)
        if not is_valid:
            missing.append(f"Invalid MMD: {errs[0]}")
            
    if missing:
        return False, ", ".join(missing), sizes
    return True, "All 3 formats verified OK", sizes


def main():
    parser = argparse.ArgumentParser(description="ShopSmart AI Diagram Suite Automation")
    parser.add_argument("--verify-only", action="store_true", help="Only verify existing deliverables")
    parser.add_argument("--filter", type=str, default="", help="Filter diagram names matching substring")
    args = parser.parse_args()

    start_time = time.time()
    print("=" * 88)
    print("  SHOPSMART AI — SYSTEM DESIGN DIAGRAM AUTOMATION SUITE GENERATOR")
    print(f"  Directory: {BASE_DIR}")
    print("=" * 88)
    
    selected_diagrams = [
        item for item in DIAGRAM_REGISTRY
        if not args.filter or args.filter.lower() in item[1].lower()
    ]
    
    if not selected_diagrams:
        print(f"[!] No diagrams matched filter: '{args.filter}'")
        sys.exit(1)

    print(f"[*] Processing {len(selected_diagrams)} of {len(DIAGRAM_REGISTRY)} registered diagrams...\n")

    results = []
    
    for mod_name, file_stem, title, prd_ref, scope in selected_diagrams:
        print(f"--> [{file_stem}] {title}")
        
        if not args.verify_only:
            try:
                mod = __import__(mod_name, fromlist=["generate"])
                res = mod.generate()
            except Exception as e:
                print(f"    [X] Generation failed: {e}")
                results.append((file_stem, title, False, f"Error: {e}", {}))
                continue
                
        # Verification check
        ok, msg, sizes = verify_diagram_deliverables(file_stem, mod_name)
        status_tag = "[OK]" if ok else "[FAIL]"
        size_info = f"PNG: {format_size(sizes.get('png', 0))}, SVG: {format_size(sizes.get('svg', 0))}, MMD: {format_size(sizes.get('mmd', 0))}" if ok else msg
        print(f"    {status_tag} {size_info}")
        results.append((file_stem, title, ok, msg, sizes))

    # Summary Report Table
    print("\n" + "=" * 88)
    print("  DELIVERABLES VERIFICATION SUMMARY TABLE")
    print("=" * 88)
    print(f"{'#':<3} | {'Diagram Name':<32} | {'PNG':<10} | {'SVG':<10} | {'MMD':<10} | {'Status'}")
    print("-" * 88)

    all_passed = True
    total_png_size = 0
    total_svg_size = 0
    total_mmd_size = 0

    for idx, (stem, title, ok, msg, sizes) in enumerate(results, 1):
        if not ok:
            all_passed = False
        png_s = format_size(sizes.get("png", 0))
        svg_s = format_size(sizes.get("svg", 0))
        mmd_s = format_size(sizes.get("mmd", 0))
        status_str = "PASSED" if ok else "FAILED"
        
        total_png_size += sizes.get("png", 0)
        total_svg_size += sizes.get("svg", 0)
        total_mmd_size += sizes.get("mmd", 0)
        
        print(f"{idx:<3} | {stem:<32} | {png_s:<10} | {svg_s:<10} | {mmd_s:<10} | {status_str}")

    print("-" * 88)
    print(f"TOTALS: {len(results)} diagrams | PNG: {format_size(total_png_size)} | SVG: {format_size(total_svg_size)} | MMD: {format_size(total_mmd_size)}")
    elapsed = time.time() - start_time
    print(f"Suite completed in {elapsed:.2f}s | Result: {'ALL DELIVERABLES CREATED & VALIDATED' if all_passed else 'SOME DELIVERABLES FAILED'}")
    print("=" * 88)

    if not all_passed:
        sys.exit(1)


if __name__ == "__main__":
    main()
