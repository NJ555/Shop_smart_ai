"""
Mermaid syntax validator and formatting utilities.
Ensures that all generated .mmd files conform to strict syntax standards.
"""

import re
from typing import Tuple, List


VALID_DIAGRAM_TYPES = [
    "flowchart",
    "graph",
    "sequencediagram",
    "statediagram",
    "statediagram-v2",
    "erdiagram",
    "classdiagram",
    "gitgraph",
    "pie",
]


def validate_mermaid_source(content: str) -> Tuple[bool, List[str]]:
    """
    Validates mermaid source string for structural correctness.
    Returns (is_valid, list_of_errors).
    """
    errors = []
    lines = [line.strip() for line in content.strip().splitlines() if line.strip() and not line.strip().startswith("%%")]
    
    if not lines:
        return False, ["Mermaid content is empty."]
        
    first_line = lines[0].lower()
    
    # Check diagram header
    has_valid_header = any(first_line.startswith(dtype) for dtype in VALID_DIAGRAM_TYPES)
    if not has_valid_header:
        errors.append(f"Invalid or missing diagram declaration in first line: '{lines[0]}'")
        
    # Check bracket balance
    # In ER diagrams, cardinality operators like '||--o{' and '}o--||' use '{' and '}' as cardinality markers
    test_content = content
    if first_line.startswith("erdiagram"):
        # Strip relationship cardinality arrows like ||--o{, }o--||, etc.
        test_content = re.sub(r"[|o}{]+--+[|o}{]+", "", test_content)

    bracket_pairs = [("(", ")"), ("[", "]"), ("{", "}")]
    for open_b, close_b in bracket_pairs:
        open_count = test_content.count(open_b)
        close_count = test_content.count(close_b)
        if open_count != close_count:
            errors.append(f"Mismatched brackets '{open_b}' ({open_count}) vs '{close_b}' ({close_count})")
            
    # Check quote balance
    quote_count = content.count('"')
    if quote_count % 2 != 0:
        errors.append(f"Mismatched double quotes (odd count: {quote_count})")
        
    return len(errors) == 0, errors
