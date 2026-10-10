"""
ShopSmart AI - Common Styling and Design System
Provides cohesive colors, typography, and styling constants for all diagrams.
"""

# Palette: Clean, modern enterprise architectural theme
COLORS = {
    # Backgrounds & Canvas
    "bg_canvas": "#F8FAFC",       # Slate 50
    "bg_white": "#FFFFFF",
    "bg_card": "#FFFFFF",
    
    # Outer Group Containers
    "group_frontend_bg": "#EFF6FF",   # Blue 50
    "group_frontend_border": "#3B82F6", # Blue 500
    
    "group_backend_bg": "#EEF2FF",    # Indigo 50
    "group_backend_border": "#6366F1",  # Indigo 500
    
    "group_ai_bg": "#ECFDF5",         # Emerald 50
    "group_ai_border": "#10B981",      # Emerald 500
    
    "group_data_bg": "#FFFBEB",       # Amber 50
    "group_data_border": "#F59E0B",    # Amber 500
    
    "group_security_bg": "#FFF1F2",   # Rose 50
    "group_security_border": "#F43F5E",# Rose 500
    
    "group_ops_bg": "#F5F3FF",        # Purple 50
    "group_ops_border": "#8B5CF6",     # Purple 500
    
    "group_simulated_bg": "#F1F5F9",  # Slate 100
    "group_simulated_border": "#64748B",# Slate 500
    
    # Node Colors
    "node_primary_bg": "#FFFFFF",
    "node_primary_border": "#1E293B",  # Slate 800
    
    "node_blue_bg": "#DBEAFE",        # Blue 100
    "node_blue_border": "#2563EB",    # Blue 600
    "node_blue_accent": "#1D4ED8",
    
    "node_indigo_bg": "#E0E7FF",      # Indigo 100
    "node_indigo_border": "#4F46E5",  # Indigo 600
    "node_indigo_accent": "#4338CA",
    
    "node_emerald_bg": "#D1FAE5",     # Emerald 100
    "node_emerald_border": "#059669", # Emerald 600
    "node_emerald_accent": "#047857",
    
    "node_amber_bg": "#FEF3C7",       # Amber 100
    "node_amber_border": "#D97706",   # Amber 600
    "node_amber_accent": "#B45309",
    
    "node_rose_bg": "#FFE4E6",        # Rose 100
    "node_rose_border": "#E11D48",    # Rose 600
    "node_rose_accent": "#BE123C",
    
    "node_purple_bg": "#EDE9FE",      # Purple 100
    "node_purple_border": "#7C3AED",  # Purple 600
    "node_purple_accent": "#6D28D9",
    
    "node_slate_bg": "#E2E8F0",       # Slate 200
    "node_slate_border": "#475569",   # Slate 600
    "node_slate_accent": "#334155",
    
    # Text colors
    "text_dark": "#0F172A",          # Slate 900
    "text_body": "#334155",          # Slate 700
    "text_muted": "#64748B",         # Slate 500
    "text_light": "#FFFFFF",
    
    # Edges & Arrows
    "arrow_dark": "#334155",
    "arrow_blue": "#2563EB",
    "arrow_green": "#059669",
    "arrow_emerald": "#059669",
    "arrow_red": "#DC2626",
    "arrow_purple": "#7C3AED",
    "arrow_amber": "#D97706",
    "arrow_dashed": "#64748B",
    
    # Badges
    "badge_mvp_bg": "#DCFCE7",        # Emerald 100
    "badge_mvp_text": "#166534",      # Emerald 800
    "badge_sim_bg": "#F1F5F9",        # Slate 100
    "badge_sim_text": "#475569",      # Slate 600
    "badge_future_bg": "#F3E8FF",     # Purple 100
    "badge_future_text": "#6B21A8",   # Purple 800
}

# Typography font settings
FONTS = {
    "title": {"family": "sans-serif", "weight": "bold", "size": 17},
    "subtitle": {"family": "sans-serif", "weight": "normal", "size": 10},
    "group_header": {"family": "sans-serif", "weight": "bold", "size": 12},
    "node_header": {"family": "sans-serif", "weight": "bold", "size": 10},
    "node_body": {"family": "sans-serif", "weight": "normal", "size": 8.5},
    "node_badge": {"family": "sans-serif", "weight": "bold", "size": 7.5},
    "arrow_label": {"family": "sans-serif", "weight": "bold", "size": 8},
    "legend_title": {"family": "sans-serif", "weight": "bold", "size": 9},
    "legend_item": {"family": "sans-serif", "weight": "normal", "size": 8},
}
