/**
 * Shared WCAG color utilities for the Dusk Office build pipeline.
 * Re-exports lib/terminal/terminal-contrast.js so CI scripts and runtime share one implementation.
 */
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const tc = require("../lib/terminal/terminal-contrast.js");

export const parseHexColor = tc.parseHexColor;
export const luminance = tc.luminance;
export const contrastRatio = tc.contrastRatio;
export const composite = tc.composite;

/** @param {string} hex */
export function luminanceFromHex(hex) {
  const parsed = parseHexColor(hex);
  if (!parsed) return null;
  return luminance({ r: parsed.r, g: parsed.g, b: parsed.b });
}
