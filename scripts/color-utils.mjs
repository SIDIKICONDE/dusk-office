/**
 * Shared WCAG color utilities for the Dusk Office build pipeline.
 * Single source of truth — avoids luminance/contrast/parse drift across scripts.
 */

/**
 * Parse a CSS hex color string to an RGB(A) object.
 * Accepts #RGB, #RRGGBB, #RRGGBBAA.
 * @param {string} s
 * @returns {{ r: number; g: number; b: number; alpha?: string } | null}
 */
export function parseHexColor(s) {
  if (typeof s !== "string" || !s.startsWith("#")) return null;
  let h = s.slice(1);
  if (/^[0-9a-fA-F]{3}$/.test(h))
    h = [...h].map((ch) => ch + ch).join("");
  if (/^[0-9a-fA-F]{6}$/.test(h))
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
    };
  if (/^[0-9a-fA-F]{8}$/.test(h))
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
      alpha: h.slice(6, 8),
    };
  return null;
}

/**
 * WCAG relative luminance from 0–255 RGB values.
 * @param {{ r: number; g: number; b: number }} c
 * @returns {number}
 */
export function luminance(c) {
  const lin = (v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  const R = lin(c.r),
    G = lin(c.g),
    B = lin(c.b);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

/**
 * WCAG relative luminance directly from a hex string (#RRGGBB).
 * @param {string} hex
 * @returns {number | null}
 */
export function luminanceFromHex(hex) {
  if (typeof hex !== "string" || !/^#[0-9a-fA-F]{6}/.test(hex)) return null;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return luminance({ r, g, b });
}

/**
 * WCAG contrast ratio between two relative luminance values.
 * @param {number} L1
 * @param {number} L2
 * @returns {number}
 */
export function contrastRatio(L1, L2) {
  const light = Math.max(L1, L2);
  const dark = Math.min(L1, L2);
  return (light + 0.05) / (dark + 0.05);
}

/**
 * Alpha-composite foreground over background.
 * @param {{ r: number; g: number; b: number }} fg
 * @param {number} a01 alpha 0–1
 * @param {{ r: number; g: number; b: number }} bg
 * @returns {{ r: number; g: number; b: number }}
 */
export function composite(fg, a01, bg) {
  const a = Math.max(0, Math.min(1, a01));
  return {
    r: Math.round(fg.r * a + bg.r * (1 - a)),
    g: Math.round(fg.g * a + bg.g * (1 - a)),
    b: Math.round(fg.b * a + bg.b * (1 - a)),
  };
}
