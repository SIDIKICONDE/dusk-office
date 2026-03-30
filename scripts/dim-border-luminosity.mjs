#!/usr/bin/env node
/**
 * Réduit la luminosité perçue des bordures : alpha plus bas + RGB légèrement assombri (#RRGGBBAA).
 * Ne pas appliquer à nyx-hc.json (contraste élevé volontaire).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const themesDir = path.join(__dirname, "..", "themes");

/** Retrait sur le canal alpha */
const ALPHA_SUB = 22;
/** Plancher pour garder des bordures encore visibles */
const MIN_ALPHA = 36;
/** Facteur multiplicatif sur R, G, B (0–255) */
const RGB_DIM = 0.88;

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
function dimBorderHex(hex) {
  if (typeof hex !== "string" || !hex.startsWith("#")) return hex;
  const h = hex.slice(1);
  if (h.length !== 8) return hex;
  let r = parseInt(h.slice(0, 2), 16);
  let g = parseInt(h.slice(2, 4), 16);
  let b = parseInt(h.slice(4, 6), 16);
  let a = parseInt(h.slice(6, 8), 16);
  r = Math.max(0, Math.min(255, Math.round(r * RGB_DIM)));
  g = Math.max(0, Math.min(255, Math.round(g * RGB_DIM)));
  b = Math.max(0, Math.min(255, Math.round(b * RGB_DIM)));
  a = Math.max(MIN_ALPHA, a - ALPHA_SUB);
  const rr = r.toString(16).padStart(2, "0");
  const gg = g.toString(16).padStart(2, "0");
  const bb = b.toString(16).padStart(2, "0");
  const aa = a.toString(16).padStart(2, "0");
  return `#${rr}${gg}${bb}${aa}`;
}

function main() {
  const files = fs
    .readdirSync(themesDir)
    .filter((f) =>
      /^nyx-(minuit|abime|recif|baie|aube|brume|cendre|nebuleuse|light|ivoire|ivoire-sombre)\.json$/.test(f)
    );

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
      const next = dimBorderHex(v);
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
