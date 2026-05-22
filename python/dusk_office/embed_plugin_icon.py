#!/usr/bin/env python3
"""Embed marketplace icon PNG into JetBrains pluginIcon.svg (Pillow, no ImageMagick)."""

from __future__ import annotations

import argparse
import base64
import sys
from io import BytesIO
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    raise SystemExit("Pillow required: pip install 'dusk-office-tools[dev]'") from None


def build_plugin_icon_svg(png_bytes: bytes, size: int = 128) -> str:
    b64 = base64.standard_b64encode(png_bytes).decode("ascii")
    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<svg xmlns="http://www.w3.org/2000/svg" '
        'xmlns:xlink="http://www.w3.org/1999/xlink" '
        f'viewBox="0 0 {size} {size}" width="40" height="40">\n'
        f'  <image width="{size}" height="{size}" preserveAspectRatio="xMidYMid meet" '
        f'xlink:href="data:image/png;base64,{b64}"/>\n'
        "</svg>\n"
    )


def png_bytes_from_icon(source: Path, size: int) -> bytes:
    with Image.open(source) as img:
        img = img.convert("RGBA")
        img = img.resize((size, size), Image.Resampling.LANCZOS)
        buffer = BytesIO()
        img.save(buffer, format="PNG")
        return buffer.getvalue()


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Generate JetBrains pluginIcon.svg from PNG.")
    parser.add_argument("input", type=Path, help="Source PNG icon")
    parser.add_argument("-o", "--output", type=Path, required=True, help="Output SVG path")
    parser.add_argument("--size", type=int, default=128, help="Embedded PNG size (default: 128)")
    args = parser.parse_args(argv)

    if not args.input.is_file():
        parser.error(f"input not found: {args.input}")

    png_bytes = png_bytes_from_icon(args.input, args.size)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(build_plugin_icon_svg(png_bytes, args.size), encoding="utf-8")
    print(f"[OK] pluginIcon.svg <- {args.input}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
