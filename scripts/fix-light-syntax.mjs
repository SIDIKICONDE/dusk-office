/**
 * Corrige la syntaxe des thèmes clairs : retire les foregrounds « texte clair »
 * hérités du pipeline sombre (ex. #d1e0e8) qui deviennent illisibles sur fond clair.
 */
import { luminanceFromHex } from "./color-utils.mjs";

/** Foregrounds typiques des thèmes sombres → ardoise lisible sur fond clair. */
const DARK_PIPELINE_FG_TO_LIGHT = {
  d1e0e8: "1e293b",
  d0dce4: "1e293b",
  cfe8f0: "1e293b",
  e5e7eb: "334155",
  f8f8f2: "1e293b",
  fafafa: "1e293b",
};

/** @param {string} hex */
export function remapLightSyntaxForeground(hex, fallback = "1e293b") {
  if (typeof hex !== "string" || !hex.startsWith("#")) return hex;
  const m = hex.match(/^#([0-9a-f]{6})([0-9a-f]{2})?$/i);
  if (!m) return hex;
  const rgb = m[1].toLowerCase();
  const alpha = m[2] || "";
  const rep = DARK_PIPELINE_FG_TO_LIGHT[rgb];
  if (rep) return `#${rep}${alpha}`;
  const lum = luminanceFromHex(`#${rgb}`);
  if (lum != null && lum > 0.55) return `#${fallback}${alpha}`;
  return hex;
}

/** @param {unknown} tokens */
export function normalizeLightTokenColors(tokens) {
  if (!Array.isArray(tokens)) return;
  for (const block of tokens) {
    const fg = block?.settings?.foreground;
    if (typeof fg === "string") block.settings.foreground = remapLightSyntaxForeground(fg);
  }
}

/** @param {unknown} sem */
export function normalizeLightSemanticTokenColors(sem) {
  if (!sem || typeof sem !== "object") return;
  for (const [key, val] of Object.entries(sem)) {
    if (typeof val === "string") sem[key] = remapLightSyntaxForeground(val);
    else if (val && typeof val === "object" && typeof val.foreground === "string")
      val.foreground = remapLightSyntaxForeground(val.foreground);
  }
}

/** @param {{ tokenColors?: unknown; semanticTokenColors?: unknown }} theme */
export function normalizeLightSyntax(theme) {
  normalizeLightTokenColors(theme.tokenColors);
  normalizeLightSemanticTokenColors(theme.semanticTokenColors);
}
