#!/usr/bin/env node
/**
 * Reconstruit theme-sources/ à partir de themes/ actuel.
 * - Variantes palette : seulement colors avec themeWinsForKey + name/include ;
 *   semantic/token omis si générés par merge-syntax-into-variants.
 * - dusk.json, dusk-hc.json : copie complète.
 * - dusk-light, dusk-ivoire, dusk-ivoire-sombre : hors PALETTE_VARIANT_IDS (générés par build).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  PALETTE_VARIANT_IDS,
  SYNTAX_MERGE_SLUGS,
  idToSyntaxSlug,
  themeWinsForKey,
} from "./theme-wins.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const themesDir = path.join(root, "themes");
const sourcesDir = path.join(root, "theme-sources");

/** @param {Record<string, unknown>} colors */
function pickWinning(colors) {
  const out = {};
  if (!colors || typeof colors !== "object") return out;
  for (const [k, v] of Object.entries(colors)) {
    if (themeWinsForKey(k)) out[k] = v;
  }
  return out;
}

function main() {
  fs.mkdirSync(sourcesDir, { recursive: true });

  for (const id of PALETTE_VARIANT_IDS) {
    const file = `${id}.json`;
    const full = path.join(themesDir, file);
    if (!fs.existsSync(full)) {
      console.warn("Manquant:", file);
      continue;
    }
    const j = JSON.parse(fs.readFileSync(full, "utf8"));
    const slug = idToSyntaxSlug(id);
    const out = {
      $schema: j.$schema,
      name: j.name,
      include: j.include,
      colors: pickWinning(j.colors || {}),
    };
    if (!SYNTAX_MERGE_SLUGS.includes(slug)) {
      out.semanticTokenColors = j.semanticTokenColors;
      out.tokenColors = j.tokenColors;
    }
    const dest = path.join(sourcesDir, file);
    fs.writeFileSync(dest, JSON.stringify(out, null, 2) + "\n", "utf8");
    console.log("OK", file, "→ theme-sources (minimal)");
  }

  for (const base of ["dusk.json", "dusk-hc.json"]) {
    const full = path.join(themesDir, base);
    if (!fs.existsSync(full)) {
      console.warn("Manquant:", base);
      continue;
    }
    const j = JSON.parse(fs.readFileSync(full, "utf8"));
    const dest = path.join(sourcesDir, base);
    fs.writeFileSync(dest, JSON.stringify(j, null, 2) + "\n", "utf8");
    console.log("OK", base, "→ theme-sources (complet)");
  }
}

main();
