#!/usr/bin/env node
/**
 * Réduit la visibilité des bordures / guides déjà présents dans themes/dusk-*.json
 * (les clés que la fusion ne réécrit pas).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const themesDir = path.join(__dirname, "..", "themes");

const ALPHA_FACTOR = 0.42;
const MIN_ALPHA = 10;

/** @param {string} hex */
function softenColor(hex) {
  if (typeof hex !== "string" || !hex.startsWith("#")) return hex;
  const h = hex.slice(1);
  if (h.length === 8) {
    const a = parseInt(h.slice(6, 8), 16);
    const na = Math.max(MIN_ALPHA, Math.round(a * ALPHA_FACTOR));
    return `#${h.slice(0, 6)}${na.toString(16).padStart(2, "0")}`;
  }
  if (h.length === 6) {
    return `#${h}55`;
  }
  return hex;
}

/** @param {string} k */
function shouldSoften(k) {
  if (k === "focusBorder" || k === "editor.lineHighlightBorder") return true;
  if (/editorIndentGuide/i.test(k)) return true;
  if (/editorBracketPairGuide/i.test(k)) return true;
  if (/border/i.test(k)) return true;
  if (/activeBorder$/i.test(k)) return true;
  return false;
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
      if (!shouldSoften(k)) continue;
      const v = colors[k];
      if (typeof v !== "string") continue;
      const next = softenColor(v);
      if (next !== v) {
        colors[k] = next;
        n++;
      }
    }
    fs.writeFileSync(full, JSON.stringify(theme, null, 2) + "\n", "utf8");
    console.log("OK", file, n, "clés adoucies");
  }
}

main();
