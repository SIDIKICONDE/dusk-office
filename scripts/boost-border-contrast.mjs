#!/usr/bin/env node
/**
 * Augmente légèrement le contraste des bordures (canal alpha des #RRGGBBAA).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const themesDir = path.join(__dirname, "..", "themes");

/** Ajout sur le canal alpha (0–255), plafonné à ff (~+9 % d’opacité max) */
const ALPHA_DELTA = 24;

/** @param {string} k */
function isBorderKey(k) {
  if (k === "focusBorder" || k === "editor.lineHighlightBorder") return true;
  if (/editorIndentGuide/i.test(k)) return true;
  if (/editorBracketPairGuide/i.test(k)) return true;
  if (/border/i.test(k)) return true;
  if (/activeBorder$/i.test(k)) return true;
  return false;
}

/** @param {string} hex */
function boostAlpha(hex) {
  if (typeof hex !== "string" || !hex.startsWith("#")) return hex;
  const h = hex.slice(1);
  if (h.length === 8) {
    const rgb = h.slice(0, 6);
    const a = parseInt(h.slice(6, 8), 16);
    const na = Math.min(255, a + ALPHA_DELTA);
    return `#${rgb}${na.toString(16).padStart(2, "0")}`;
  }
  return hex;
}

function main() {
  const files = fs
    .readdirSync(themesDir)
    .filter((f) => /^dusk-(minuit|abime|recif|baie|aube|brume|cendre|nebuleuse)\.json$/.test(f));

  for (const file of files) {
    const full = path.join(themesDir, file);
    const theme = JSON.parse(fs.readFileSync(full, "utf8"));
    const { colors } = theme;
    if (!colors) continue;
    let n = 0;
    for (const k of Object.keys(colors)) {
      if (!isBorderKey(k)) continue;
      const v = colors[k];
      if (typeof v !== "string") continue;
      const next = boostAlpha(v);
      if (next !== v) {
        colors[k] = next;
        n++;
      }
    }
    fs.writeFileSync(full, JSON.stringify(theme, null, 2) + "\n", "utf8");
    console.log("OK", file, n, "clés");
  }
}

main();
