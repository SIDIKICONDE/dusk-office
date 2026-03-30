#!/usr/bin/env python3
"""Nyx Marketplace icon — visible Abyss blue fill, very dark edges, multicolor starburst."""

try:
    from PIL import Image, ImageDraw, ImageFilter
except ImportError:
    raise SystemExit("Pillow required: pip install Pillow")

import argparse
import math
import os

# High-res render, then downscale for package.json
INTERNAL_SIZE = 1024
# Output size for PNG referenced by package.json (`icon`)
MARKETPLACE_ICON_SIZE = 520

# Background: Abyss-like tint (dimmed center) → very dark edges
BG_TINT_CENTER = (20, 48, 70)  # same family as #204866, darker
BG_EDGE_DARK = (3, 10, 20)  # even lower at the rim
# >1: tinted center persists longer before darkening toward edges
BG_GRADIENT_POWER = 1.55
BG_MAX_R_FRACTION = 0.92  # normalized radius (larger = softer gradient)

# Glow under the burst (matches background, subtle)
ACCENT_GLOW = (12, 34, 52)

STARBURST_RAY_COUNT = 12

# Motif size in the square (inner radius / branch reach / hub)
STARBURST_INNER_R = 0.064
STARBURST_OUTER_BASE = 0.500  # geometric cap (half side); light blur
STARBURST_HUB_R = 0.070
# Final icon corner radius (smaller = motif reads larger)
ICON_CORNER_RADIUS = 0.09

# One color per ray — Nyx Abyss accents (brackets / semantic)
RAY_COLORS = [
    (103, 232, 249),  # #67e8f9 cyan
    (56, 189, 248),   # #38bdf8 sky
    (96, 165, 250),   # #60a5fa blue
    (192, 132, 252),  # #c084fc violet
    (244, 114, 182),  # #f472b6 pink
    (244, 63, 94),    # #f43f5e coral
    (74, 222, 128),   # #4ade80 green
    (250, 204, 21),   # #facc15 yellow
    (251, 191, 36),   # #fbbf24 amber
    (52, 211, 153),   # #34d399 emerald
    (167, 139, 250),  # #a78bfa lavender
    (34, 211, 238),   # #22d3ee aqua cyan
]

# Central disk — solid warm color (contrast with rays)
HUB_COLOR = (251, 146, 60)  # #fb923c


def _pixel_center(size):
    """Integer geometric center (even) for symmetric PIL drawing."""
    c = size // 2
    return c, c


def create_dark_bg(size):
    """Radial: tinted center, very dark edges (curve keeps more chroma visible)."""
    cx, cy = _pixel_center(size)
    max_r = size * BG_MAX_R_FRACTION
    tc = BG_TINT_CENTER
    ed = BG_EDGE_DARK
    pw = BG_GRADIENT_POWER
    buf = bytearray(size * size * 4)
    i = 0
    for y in range(size):
        dy = y - cy
        for x in range(size):
            dist = math.hypot(x - cx, dy)
            t = min(1.0, dist / max_r)
            u = t**pw  # slow darkening: most of the icon keeps chroma
            r = int(tc[0] + (ed[0] - tc[0]) * u)
            g = int(tc[1] + (ed[1] - tc[1]) * u)
            b = int(tc[2] + (ed[2] - tc[2]) * u)
            buf[i : i + 4] = (r, g, b, 255)
            i += 4
    return Image.frombuffer("RGBA", (size, size), bytes(buf), "raw", "RGBA", 0, 1)


def xy_from_up(cx, cy, r, angle_rad):
    """angle_rad 0 = up, clockwise."""
    return cx + r * math.sin(angle_rad), cy - r * math.cos(angle_rad)


def _hub_bbox(size):
    cx, cy = _pixel_center(size)
    hub_r = int(round(size * STARBURST_HUB_R))
    return [cx - hub_r, cy - hub_r, cx + hub_r, cy + hub_r]


def iter_starburst_ray_quads(size):
    """Yields (index, (4 trapezoid points)) per ray."""
    cx, cy = _pixel_center(size)
    n = STARBURST_RAY_COUNT
    phase = math.pi / n
    inner_r = size * STARBURST_INNER_R
    base_outer = size * STARBURST_OUTER_BASE

    for i in range(n):
        a = 2 * math.pi * i / n + phase
        # min 0.84 → short rays longer than before (0.80)
        length_w = 0.92 + 0.08 * math.sin(3 * a + 0.4)
        outer_r = base_outer * length_w
        spread_in = 0.053 + 0.017 * math.sin(2 * a - 0.2)
        spread_out = 0.072 + 0.025 * math.sin(2 * a + 1.1)

        p_in_l = xy_from_up(cx, cy, inner_r, a - spread_in)
        p_in_r = xy_from_up(cx, cy, inner_r, a + spread_in)
        p_out_r = xy_from_up(cx, cy, outer_r, a + spread_out)
        p_out_l = xy_from_up(cx, cy, outer_r, a - spread_out)
        yield i, (p_in_l, p_in_r, p_out_r, p_out_l)


def draw_smooth_starburst_mask(size):
    """L mask: full starburst silhouette (shared alpha)."""
    layer = Image.new("L", (size, size), 0)
    draw = ImageDraw.Draw(layer)
    for _, quad in iter_starburst_ray_quads(size):
        draw.polygon(list(quad), fill=255)
    draw.ellipse(_hub_bbox(size), fill=255)
    return layer


def draw_colored_starburst_rgb(size):
    """RGB: each branch filled with RAY_COLORS[i], separate hub."""
    img = Image.new("RGB", (size, size), BG_TINT_CENTER)
    draw = ImageDraw.Draw(img)
    colors = RAY_COLORS
    if len(colors) < STARBURST_RAY_COUNT:
        raise ValueError("RAY_COLORS must have at least STARBURST_RAY_COUNT entries")

    for i, quad in iter_starburst_ray_quads(size):
        draw.polygon(list(quad), fill=colors[i])
    draw.ellipse(_hub_bbox(size), fill=HUB_COLOR)
    return img


def subtle_burst_shadow(size, mask_alpha):
    """Symmetric glow (no offset: avoids a false bottom-right visual center)."""
    shadow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    tint = Image.new("RGBA", (size, size), (*ACCENT_GLOW, 255))
    shadow.paste(tint, mask=mask_alpha)
    shadow = shadow.filter(ImageFilter.GaussianBlur(radius=size * 0.014))
    return shadow


def colored_burst_rgba(size, mask_l, blur_radius):
    """Per-branch colors + softened alpha (same silhouette as mask_l)."""
    a = mask_l.filter(ImageFilter.GaussianBlur(radius=blur_radius))
    rgb_img = draw_colored_starburst_rgb(size)
    r, g, b = rgb_img.split()
    return Image.merge("RGBA", (r, g, b, a))


def create_rounded_mask(size, corner_radius=0.15):
    """Rounded-rectangle mask."""
    mask = Image.new("L", (size, size), 0)
    draw = ImageDraw.Draw(mask)

    radius = int(size * corner_radius)
    draw.rounded_rectangle([0, 0, size, size], radius=radius, fill=255)
    return mask


def generate_icon(size=INTERNAL_SIZE):
    """High-res square: dark background + multicolor starburst, rounded corners."""
    print(f"Background ({size}×{size})...")
    bg = create_dark_bg(size)

    print("Mask + colored rays...")
    mask = draw_smooth_starburst_mask(size)
    r_soft = max(1, size * 0.0009)
    burst_soft = colored_burst_rgba(size, mask, r_soft)

    print("Glow + composite...")
    sh = subtle_burst_shadow(size, burst_soft.getchannel("A"))
    out = Image.alpha_composite(bg, sh)
    out = Image.alpha_composite(out, burst_soft)

    print("Rounded corners...")
    rounded_mask = create_rounded_mask(size, corner_radius=ICON_CORNER_RADIUS)
    final = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    final.paste(out, mask=rounded_mask)

    return final


def save_vscode_marketplace_icon(img, output_path, size=MARKETPLACE_ICON_SIZE):
    """Writes the PNG expected by package.json (`icon`, often 128×128)."""
    os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)
    out = img.resize((size, size), Image.LANCZOS)
    out.save(output_path, "PNG")
    print(f"  Extension icon: {output_path} ({size}×{size})")


def repo_root():
    return os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def main():
    parser = argparse.ArgumentParser(
        description="Generate the Nyx Marketplace icon (VS Code / Cursor)."
    )
    parser.add_argument(
        "--output",
        default=None,
        help="Path to output PNG (default: <repo>/images/icon.png)",
    )
    parser.add_argument(
        "--size",
        type=int,
        default=MARKETPLACE_ICON_SIZE,
        metavar="N",
        help=f"Final PNG side length (default: {MARKETPLACE_ICON_SIZE})",
    )
    parser.add_argument(
        "--no-preview",
        action="store_true",
        help="Do not write the high-res preview under scripts/",
    )
    args = parser.parse_args()

    default_icon = os.path.join(repo_root(), "images", "icon.png")
    output_path = os.path.abspath(args.output or default_icon)

    print(f"Marketplace output: {output_path}\n")

    icon_hires = generate_icon(INTERNAL_SIZE)

    print("\nExport…")
    save_vscode_marketplace_icon(icon_hires, output_path, size=args.size)

    if not args.no_preview:
        preview_path = os.path.join(
            os.path.dirname(os.path.abspath(__file__)),
            "nyx_icon_preview.png",
        )
        icon_hires.save(preview_path, "PNG")
        print(f"\nHD preview: {preview_path}")

    print("\nDone.")


if __name__ == "__main__":
    main()
