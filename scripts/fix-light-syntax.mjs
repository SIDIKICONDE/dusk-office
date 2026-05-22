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
  b8d4e4: "1e293b",
  e5e7eb: "334155",
  f8f8f2: "1e293b",
  fafafa: "1e293b",
};

/** Accents cyan clair du pipeline sombre — lisibles sur fond sombre, ~1.6:1 sur clair. */
const LIGHT_LOW_CONTRAST_ACCENTS = {
  "22d3ee": "1d4ed8",
  "06b6d4": "0369a1",
  "67e8f9": "0369a1",
  "38bdf8": "0284c7",
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
  const accent = LIGHT_LOW_CONTRAST_ACCENTS[rgb];
  if (accent) return `#${accent}${alpha}`;
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

/** @param {unknown} scope */
function tokenScopeKey(scope) {
  if (Array.isArray(scope)) return scope.slice().sort().join("|");
  return typeof scope === "string" ? scope : "";
}

/** Keep the last rule per scope list (removes build-time duplicates). */
export function dedupeTokenColors(tokenColors) {
  if (!Array.isArray(tokenColors)) return tokenColors;
  const seen = new Set();
  const out = [];
  for (let i = tokenColors.length - 1; i >= 0; i -= 1) {
    const block = tokenColors[i];
    const key = tokenScopeKey(block?.scope);
    if (seen.has(key)) continue;
    seen.add(key);
    out.unshift(block);
  }
  return out;
}

/** @param {{ tokenColors?: unknown; semanticTokenColors?: unknown }} theme */
export function normalizeLightSyntax(theme) {
  normalizeLightTokenColors(theme.tokenColors);
  normalizeLightSemanticTokenColors(theme.semanticTokenColors);
  if (Array.isArray(theme.tokenColors)) {
    theme.tokenColors = dedupeTokenColors(theme.tokenColors);
  }
}
