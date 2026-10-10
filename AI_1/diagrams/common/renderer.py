"""
ShopSmart AI - Common Renderer Engine
Provides high-level drawing primitives using Matplotlib to produce clean,
publication-grade architectural diagrams, state machines, sequence flows, and ERDs.
Outputs .png (300 DPI), .svg (Scalable Vector Graphics), and exports .mmd (Mermaid).
"""

import os
from pathlib import Path
from typing import List, Tuple, Optional, Dict, Any
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import FancyBboxPatch, Rectangle, Circle
from .style import COLORS, FONTS


def create_canvas(
    width: float = 16.0,
    height: float = 10.0,
    title: str = "",
    subtitle: str = "",
    prd_ref: str = "",
    scope: str = "MVP",
) -> Tuple[plt.Figure, plt.Axes]:
    """
    Creates canvas with standardized header and background styling.
    Coordinates are normalized from (0, 0) at bottom-left to (width, height) at top-right.
    """
    fig, ax = plt.subplots(figsize=(width, height), dpi=100)
    
    # Fill background
    fig.patch.set_facecolor(COLORS["bg_canvas"])
    ax.set_facecolor(COLORS["bg_canvas"])
    
    ax.set_xlim(0, width)
    ax.set_ylim(0, height)
    ax.axis("off")
    
    # Header container
    header_y = height - 0.75
    
    # Title
    ax.text(
        0.5,
        header_y + 0.35,
        title,
        color=COLORS["text_dark"],
        fontdict=FONTS["title"],
        va="top",
        ha="left",
    )
    
    # Subtitle with PRD reference
    sub_text = f"{subtitle}  |  PRD Ref: {prd_ref}" if prd_ref else subtitle
    ax.text(
        0.5,
        header_y - 0.05,
        sub_text,
        color=COLORS["text_muted"],
        fontdict=FONTS["subtitle"],
        va="top",
        ha="left",
    )
    
    # Scope badge on top right
    scope_color_bg = (
        COLORS["badge_mvp_bg"] if scope == "MVP"
        else COLORS["badge_future_bg"] if "POST" in scope or "FUTURE" in scope
        else COLORS["badge_sim_bg"]
    )
    scope_color_text = (
        COLORS["badge_mvp_text"] if scope == "MVP"
        else COLORS["badge_future_text"] if "POST" in scope or "FUTURE" in scope
        else COLORS["badge_sim_text"]
    )
    
    badge_width = 1.8
    badge_height = 0.38
    badge_x = width - badge_width - 0.5
    badge_y = header_y + 0.1
    
    badge_patch = FancyBboxPatch(
        (badge_x, badge_y),
        badge_width,
        badge_height,
        boxstyle="round,pad=0.05,rounding_size=0.1",
        facecolor=scope_color_bg,
        edgecolor=scope_color_text,
        linewidth=1.2,
        zorder=10,
    )
    ax.add_patch(badge_patch)
    
    ax.text(
        badge_x + badge_width / 2,
        badge_y + badge_height / 2,
        f"SCOPE: {scope}",
        color=scope_color_text,
        fontdict=FONTS["node_badge"],
        va="center",
        ha="center",
        zorder=11,
    )
    
    # Thin divider line under header
    ax.plot([0.5, width - 0.5], [header_y - 0.25, header_y - 0.25], color="#CBD5E1", lw=1.2)
    
    return fig, ax


def draw_group(
    ax: plt.Axes,
    x: float,
    y: float,
    width: float,
    height: float,
    title: str,
    bg_color: str,
    border_color: str,
    border_style: str = "solid",
    subtitle: Optional[str] = None,
    header_align: str = "left",
) -> None:
    """Draws outer container grouping related subsystems or layers."""
    linestyle = "--" if border_style == "dashed" else "-"
    
    box = FancyBboxPatch(
        (x, y),
        width,
        height,
        boxstyle="round,pad=0.08,rounding_size=0.2",
        facecolor=bg_color,
        edgecolor=border_color,
        linewidth=1.5,
        linestyle=linestyle,
        zorder=1,
    )
    ax.add_patch(box)
    
    # Header text
    header_x = x + 0.25 if header_align == "left" else x + width / 2
    header_ha = "left" if header_align == "left" else "center"
    header_y = y + height - 0.25
    
    ax.text(
        header_x,
        header_y,
        title.upper(),
        color=border_color,
        fontdict=FONTS["group_header"],
        va="top",
        ha=header_ha,
        zorder=2,
    )
    
    if subtitle:
        ax.text(
            header_x,
            header_y - 0.22,
            subtitle,
            color=COLORS["text_muted"],
            fontdict=FONTS["node_body"],
            va="top",
            ha=header_ha,
            zorder=2,
        )


def draw_node(
    ax: plt.Axes,
    x: float,
    y: float,
    width: float,
    height: float,
    title: str,
    subtitle_lines: Optional[List[str]] = None,
    bg_color: Optional[str] = None,
    border_color: Optional[str] = None,
    accent_bar_color: Optional[str] = None,
    badge: Optional[str] = None,
    shape: str = "round",
    zorder: int = 5,
) -> None:
    """Draws component node with clean typography, optional accent bar and subtitle lines."""
    bg = bg_color or COLORS["node_primary_bg"]
    border = border_color or COLORS["node_primary_border"]
    
    box = FancyBboxPatch(
        (x, y),
        width,
        height,
        boxstyle="round,pad=0.05,rounding_size=0.12",
        facecolor=bg,
        edgecolor=border,
        linewidth=1.2,
        zorder=zorder,
    )
    ax.add_patch(box)
    
    # Optional left vertical accent stripe
    if accent_bar_color:
        accent_strip = FancyBboxPatch(
            (x, y),
            0.12,
            height,
            boxstyle="round,pad=0.02,rounding_size=0.05",
            facecolor=accent_bar_color,
            edgecolor=accent_bar_color,
            linewidth=0.5,
            zorder=zorder + 1,
        )
        ax.add_patch(accent_strip)
    
    text_x = x + 0.25 if accent_bar_color else x + width / 2
    ha = "left" if accent_bar_color else "center"
    
    # Title positioning
    if subtitle_lines:
        title_y = y + height - 0.22
    else:
        title_y = y + height / 2 + 0.05
    
    ax.text(
        text_x,
        title_y,
        title,
        color=COLORS["text_dark"],
        fontdict=FONTS["node_header"],
        va="top" if subtitle_lines else "center",
        ha=ha,
        zorder=zorder + 2,
    )
    
    # Optional badge
    if badge:
        b_width = len(badge) * 0.09 + 0.22
        b_height = 0.22
        b_x = x + width - b_width - 0.1
        b_y = y + height - b_height - 0.1
        b_patch = FancyBboxPatch(
            (b_x, b_y),
            b_width,
            b_height,
            boxstyle="round,pad=0.02,rounding_size=0.05",
            facecolor=COLORS["badge_mvp_bg"] if "MVP" in badge else COLORS["badge_sim_bg"],
            edgecolor=COLORS["badge_mvp_text"] if "MVP" in badge else COLORS["badge_sim_text"],
            linewidth=0.8,
            zorder=zorder + 3,
        )
        ax.add_patch(b_patch)
        ax.text(
            b_x + b_width / 2,
            b_y + b_height / 2,
            badge,
            color=COLORS["badge_mvp_text"] if "MVP" in badge else COLORS["badge_sim_text"],
            fontdict=FONTS["node_badge"],
            va="center",
            ha="center",
            zorder=zorder + 4,
        )
    
    # Subtitle bullet lines
    if subtitle_lines:
        line_y = title_y - 0.22
        for line in subtitle_lines:
            ax.text(
                text_x,
                line_y,
                line,
                color=COLORS["text_body"],
                fontdict=FONTS["node_body"],
                va="top",
                ha=ha,
                zorder=zorder + 2,
            )
            line_y -= 0.18


def draw_database(
    ax: plt.Axes,
    x: float,
    y: float,
    width: float,
    height: float,
    title: str,
    subtitle_lines: Optional[List[str]] = None,
    bg_color: Optional[str] = None,
    border_color: Optional[str] = None,
    badge: Optional[str] = None,
) -> None:
    """Draws database cylinder representation."""
    bg = bg_color or COLORS["node_amber_bg"]
    border = border_color or COLORS["node_amber_border"]
    
    draw_node(
        ax=ax,
        x=x,
        y=y,
        width=width,
        height=height,
        title=f"[( {title} )]",
        subtitle_lines=subtitle_lines,
        bg_color=bg,
        border_color=border,
        accent_bar_color=COLORS["node_amber_accent"],
        badge=badge,
    )


def draw_arrow(
    ax: plt.Axes,
    start: Tuple[float, float],
    end: Tuple[float, float],
    label: Optional[str] = None,
    color: Optional[str] = None,
    style: str = "->",
    connectionstyle: str = "arc3,rad=0.0",
    dashed: bool = False,
    label_pos: float = 0.5,
    label_offset: Tuple[float, float] = (0.0, 0.12),
    zorder: int = 4,
) -> None:
    """Draws clear directional arrow with optional label pill."""
    arrow_color = color or COLORS["arrow_dark"]
    linestyle = "--" if dashed else "-"
    
    arrowprops = dict(
        arrowstyle="-|>",
        color=arrow_color,
        lw=1.5,
        linestyle=linestyle,
        connectionstyle=connectionstyle,
        mutation_scale=12,
    )
    
    ax.annotate(
        "",
        xy=end,
        xytext=start,
        arrowprops=arrowprops,
        zorder=zorder,
    )
    
    if label:
        lx = start[0] + (end[0] - start[0]) * label_pos + label_offset[0]
        ly = start[1] + (end[1] - start[1]) * label_pos + label_offset[1]
        
        # Label text with background box
        ax.text(
            lx,
            ly,
            label,
            color=arrow_color,
            fontdict=FONTS["arrow_label"],
            va="center",
            ha="center",
            bbox=dict(
                boxstyle="round,pad=0.15",
                facecolor=COLORS["bg_white"],
                edgecolor="#CBD5E1",
                linewidth=0.8,
                alpha=0.92,
            ),
            zorder=zorder + 1,
        )


def draw_legend(
    ax: plt.Axes,
    x: float,
    y: float,
    width: float,
    height: float,
    items: List[Tuple[str, str, str]],  # (label, facecolor, edgecolor)
    title: str = "LEGEND",
) -> None:
    """Draws standardized legend box."""
    box = FancyBboxPatch(
        (x, y),
        width,
        height,
        boxstyle="round,pad=0.05,rounding_size=0.1",
        facecolor=COLORS["bg_white"],
        edgecolor="#CBD5E1",
        linewidth=1.0,
        zorder=8,
    )
    ax.add_patch(box)
    
    ax.text(
        x + 0.15,
        y + height - 0.18,
        title,
        color=COLORS["text_dark"],
        fontdict=FONTS["legend_title"],
        va="top",
        ha="left",
        zorder=9,
    )
    
    item_y = y + height - 0.42
    for label, fc, ec in items:
        # Mini sample box
        sample = FancyBboxPatch(
            (x + 0.15, item_y - 0.08),
            0.28,
            0.15,
            boxstyle="round,pad=0.01,rounding_size=0.03",
            facecolor=fc,
            edgecolor=ec,
            linewidth=1.0,
            zorder=9,
        )
        ax.add_patch(sample)
        
        ax.text(
            x + 0.52,
            item_y,
            label,
            color=COLORS["text_body"],
            fontdict=FONTS["legend_item"],
            va="center",
            ha="left",
            zorder=9,
        )
        item_y -= 0.22


def save_diagram(fig: plt.Figure, base_filepath: str, mermaid_source: str) -> Dict[str, str]:
    """
    Saves .png (300 DPI), .svg (Scalable Vector), and .mmd (Mermaid) deliverables.
    Returns dictionary with written paths.
    """
    path = Path(base_filepath)
    parent = path.parent
    stem = path.stem
    
    os.makedirs(parent, exist_ok=True)
    
    png_path = parent / f"{stem}.png"
    svg_path = parent / f"{stem}.svg"
    mmd_path = parent / f"{stem}.mmd"
    
    # 1. Save High-Resolution PNG
    fig.savefig(
        png_path,
        dpi=300,
        bbox_inches="tight",
        facecolor=fig.get_facecolor(),
        edgecolor="none",
    )
    
    # 2. Save Scalable Vector Graphics SVG
    fig.savefig(
        svg_path,
        format="svg",
        bbox_inches="tight",
        facecolor=fig.get_facecolor(),
        edgecolor="none",
    )
    
    plt.close(fig)
    
    # 3. Save Mermaid Source (.mmd)
    with open(mmd_path, "w", encoding="utf-8") as f:
        f.write(mermaid_source.strip() + "\n")
        
    return {
        "png": str(png_path),
        "svg": str(svg_path),
        "mmd": str(mmd_path),
    }
