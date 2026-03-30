#!/usr/bin/env python3
"""Icône marketplace Nyx — fond bleu Abîme visible, bords très sombres, starburst multicolore."""

try:
    from PIL import Image, ImageDraw, ImageFilter
except ImportError:
    raise SystemExit("Pillow requis : pip install Pillow")

import argparse
import math
import os

# Rendu interne haute résolution, puis redimensionnement pour package.json
INTERNAL_SIZE = 1024
# Taille de sortie du PNG référencé par package.json (`icon`)
MARKETPLACE_ICON_SIZE = 520

# Fond : teinte Abîme (luminosité réduite) → bords très sombres
BG_TINT_CENTER = (20, 48, 70)  # même famille que #204866, plus sombre
BG_EDGE_DARK = (3, 10, 20)  # bord encore plus bas
# >1 : le centre reste teinté plus longtemps avant de foncer vers les bords
BG_GRADIENT_POWER = 1.55
BG_MAX_R_FRACTION = 0.92  # rayon normalisé (plus grand = dégradé plus doux)

# Halo sous l’éclat (assorti au fond, discret)
ACCENT_GLOW = (12, 34, 52)

STARBURST_RAY_COUNT = 12

# Taille du motif dans le carré (rayon intérieur / portée des branches / hub)
STARBURST_INNER_R = 0.064
STARBURST_OUTER_BASE = 0.500  # plafond géométrique (demi-côté) ; flou léger
STARBURST_HUB_R = 0.070
# Coins de l’icône finale (plus petit = motif visuellement plus grand)
ICON_CORNER_RADIUS = 0.09

# Une couleur par rayon — accents Nyx Abîme (brackets / sémantique)
RAY_COLORS = [
    (103, 232, 249),  # #67e8f9 cyan
    (56, 189, 248),   # #38bdf8 ciel
    (96, 165, 250),   # #60a5fa bleu
    (192, 132, 252),  # #c084fc violet
    (244, 114, 182),  # #f472b6 rose
    (244, 63, 94),    # #f43f5e corail
    (74, 222, 128),   # #4ade80 vert
    (250, 204, 21),   # #facc15 jaune
    (251, 191, 36),   # #fbbf24 ambre
    (52, 211, 153),   # #34d399 émeraude
    (167, 139, 250),  # #a78bfa lavande
    (34, 211, 238),   # #22d3ee cyan eau
]

# Disque central — propre couleur (chaud, contraste avec les rayons)
HUB_COLOR = (251, 146, 60)  # #fb923c


def _pixel_center(size):
    """Centre géométrique entier (pair) pour dessins PIL symétriques."""
    c = size // 2
    return c, c


def create_dark_bg(size):
    """Radial : centre nettement teinté, bords très foncés (courbe = plus de teinte visible)."""
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
            u = t**pw  # retarder l’assombrissement : la plupart de l’icône garde la chroma
            r = int(tc[0] + (ed[0] - tc[0]) * u)
            g = int(tc[1] + (ed[1] - tc[1]) * u)
            b = int(tc[2] + (ed[2] - tc[2]) * u)
            buf[i : i + 4] = (r, g, b, 255)
            i += 4
    return Image.frombuffer("RGBA", (size, size), bytes(buf), "raw", "RGBA", 0, 1)


def xy_from_up(cx, cy, r, angle_rad):
    """angle_rad 0 = haut, sens horaire."""
    return cx + r * math.sin(angle_rad), cy - r * math.cos(angle_rad)


def _hub_bbox(size):
    cx, cy = _pixel_center(size)
    hub_r = int(round(size * STARBURST_HUB_R))
    return [cx - hub_r, cy - hub_r, cx + hub_r, cy + hub_r]


def iter_starburst_ray_quads(size):
    """Itère (index, (4 points du trapèze)) pour chaque rayon."""
    cx, cy = _pixel_center(size)
    n = STARBURST_RAY_COUNT
    phase = math.pi / n
    inner_r = size * STARBURST_INNER_R
    base_outer = size * STARBURST_OUTER_BASE

    for i in range(n):
        a = 2 * math.pi * i / n + phase
        # min 0.84 → rayons courts aussi plus longs qu’avant (0.80)
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
    """Masque L : silhouette complète du starburst (alpha commun)."""
    layer = Image.new("L", (size, size), 0)
    draw = ImageDraw.Draw(layer)
    for _, quad in iter_starburst_ray_quads(size):
        draw.polygon(list(quad), fill=255)
    draw.ellipse(_hub_bbox(size), fill=255)
    return layer


def draw_colored_starburst_rgb(size):
    """RGB : chaque branche remplie avec RAY_COLORS[i], hub séparé."""
    img = Image.new("RGB", (size, size), BG_TINT_CENTER)
    draw = ImageDraw.Draw(img)
    colors = RAY_COLORS
    if len(colors) < STARBURST_RAY_COUNT:
        raise ValueError("RAY_COLORS doit avoir au moins STARBURST_RAY_COUNT entrées")

    for i, quad in iter_starburst_ray_quads(size):
        draw.polygon(list(quad), fill=colors[i])
    draw.ellipse(_hub_bbox(size), fill=HUB_COLOR)
    return img


def subtle_burst_shadow(size, mask_alpha):
    """Halo symétrique (pas de décalage : évite un faux centre visuel bas-droite)."""
    shadow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    tint = Image.new("RGBA", (size, size), (*ACCENT_GLOW, 255))
    shadow.paste(tint, mask=mask_alpha)
    shadow = shadow.filter(ImageFilter.GaussianBlur(radius=size * 0.014))
    return shadow


def colored_burst_rgba(size, mask_l, blur_radius):
    """Couleurs par branche + alpha adoucie (même silhouette que mask_l)."""
    a = mask_l.filter(ImageFilter.GaussianBlur(radius=blur_radius))
    rgb_img = draw_colored_starburst_rgb(size)
    r, g, b = rgb_img.split()
    return Image.merge("RGBA", (r, g, b, a))


def create_rounded_mask(size, corner_radius=0.15):
    """Masque rectangle aux coins arrondis."""
    mask = Image.new("L", (size, size), 0)
    draw = ImageDraw.Draw(mask)

    radius = int(size * corner_radius)
    draw.rounded_rectangle([0, 0, size, size], radius=radius, fill=255)
    return mask


def generate_icon(size=INTERNAL_SIZE):
    """Image carrée haute résolution : fond sombre + starburst multicolore, coins arrondis."""
    print(f"Fond ({size}×{size})...")
    bg = create_dark_bg(size)

    print("Masque + branches colorées...")
    mask = draw_smooth_starburst_mask(size)
    r_soft = max(1, size * 0.0009)
    burst_soft = colored_burst_rgba(size, mask, r_soft)

    print("Halo + composite...")
    sh = subtle_burst_shadow(size, burst_soft.getchannel("A"))
    out = Image.alpha_composite(bg, sh)
    out = Image.alpha_composite(out, burst_soft)

    print("Coins arrondis...")
    rounded_mask = create_rounded_mask(size, corner_radius=ICON_CORNER_RADIUS)
    final = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    final.paste(out, mask=rounded_mask)

    return final


def save_vscode_marketplace_icon(img, output_path, size=MARKETPLACE_ICON_SIZE):
    """Écrit l’PNG attendu par package.json (champ `icon`, typiquement 128×128)."""
    os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)
    out = img.resize((size, size), Image.LANCZOS)
    out.save(output_path, "PNG")
    print(f"  Icône extension : {output_path} ({size}×{size})")


def repo_root():
    return os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def main():
    parser = argparse.ArgumentParser(
        description="Génère l’icône marketplace pour l’extension Nyx (VS Code / Cursor)."
    )
    parser.add_argument(
        "--output",
        default=None,
        help=f"Chemin du PNG marketplace (défaut : <racine>/images/icon.png)",
    )
    parser.add_argument(
        "--size",
        type=int,
        default=MARKETPLACE_ICON_SIZE,
        metavar="N",
        help=f"Taille côté du PNG final (défaut : {MARKETPLACE_ICON_SIZE})",
    )
    parser.add_argument(
        "--no-preview",
        action="store_true",
        help="Ne pas écrire la preview haute résolution dans scripts/",
    )
    args = parser.parse_args()

    default_icon = os.path.join(repo_root(), "images", "icon.png")
    output_path = os.path.abspath(args.output or default_icon)

    print(f"Sortie marketplace : {output_path}\n")

    icon_hires = generate_icon(INTERNAL_SIZE)

    print("\nExport...")
    save_vscode_marketplace_icon(icon_hires, output_path, size=args.size)

    if not args.no_preview:
        preview_path = os.path.join(
            os.path.dirname(os.path.abspath(__file__)),
            "nyx_icon_preview.png",
        )
        icon_hires.save(preview_path, "PNG")
        print(f"\nPreview HD : {preview_path}")

    print("\nTerminé.")


if __name__ == "__main__":
    main()
