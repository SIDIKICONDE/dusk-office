"""WCAG 2.1 color utilities aligned with lib/terminal-contrast.js."""

from __future__ import annotations

import math
import re
from dataclasses import dataclass
from typing import Iterable

HEX_COLOR = re.compile(r"^#[0-9a-fA-F]{3,8}$")


@dataclass(frozen=True)
class Rgb:
    r: int
    g: int
    b: int
    alpha: str | None = None


def parse_hex_color(value: str | None) -> Rgb | None:
    if not isinstance(value, str) or not value.startswith("#"):
        return None
    hex_digits = value[1:]
    if len(hex_digits) == 3 and re.fullmatch(r"[0-9a-fA-F]{3}", hex_digits):
        hex_digits = "".join(ch * 2 for ch in hex_digits)
    if re.fullmatch(r"[0-9a-fA-F]{6}", hex_digits):
        return Rgb(
            int(hex_digits[0:2], 16),
            int(hex_digits[2:4], 16),
            int(hex_digits[4:6], 16),
        )
    if re.fullmatch(r"[0-9a-fA-F]{8}", hex_digits):
        return Rgb(
            int(hex_digits[0:2], 16),
            int(hex_digits[2:4], 16),
            int(hex_digits[4:6], 16),
            hex_digits[6:8],
        )
    return None


def solid_hex(value: str | None) -> str:
    parsed = parse_hex_color(value or "")
    if not parsed:
        return value or "#000000"
    if parsed.alpha is not None:
        return f"#{parsed.r:02x}{parsed.g:02x}{parsed.b:02x}"
    return value if len(value or "") >= 7 else f"#{parsed.r:02x}{parsed.g:02x}{parsed.b:02x}"


def _linear(channel: int) -> float:
    normalized = channel / 255
    if normalized <= 0.03928:
        return normalized / 12.92
    return ((normalized + 0.055) / 1.055) ** 2.4


def luminance(rgb: Rgb | Iterable[int]) -> float:
    if isinstance(rgb, Rgb):
        r, g, b = rgb.r, rgb.g, rgb.b
    else:
        r, g, b = rgb
    return 0.2126 * _linear(r) + 0.7152 * _linear(g) + 0.0722 * _linear(b)


def contrast_ratio(l1: float, l2: float) -> float:
    light = max(l1, l2)
    dark = min(l1, l2)
    return (light + 0.05) / (dark + 0.05)


def contrast_ratio_hex(fg_hex: str, bg_hex: str) -> float:
    fg = solid_hex(fg_hex)
    bg = solid_hex(bg_hex)
    return round(contrast_ratio(luminance_from_hex(fg), luminance_from_hex(bg)), 2)


def luminance_from_hex(hex_color: str) -> float:
    parsed = parse_hex_color(hex_color)
    if not parsed:
        return 0.0
    return luminance(parsed)


def composite(fg: Rgb, alpha: float, bg: Rgb) -> Rgb:
    a = max(0.0, min(1.0, alpha))
    return Rgb(
        round(fg.r * a + bg.r * (1 - a)),
        round(fg.g * a + bg.g * (1 - a)),
        round(fg.b * a + bg.b * (1 - a)),
    )
