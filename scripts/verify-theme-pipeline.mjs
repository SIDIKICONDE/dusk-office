#!/usr/bin/env node
/**
 * Vérifie la cohérence des listes (palette UI, syntaxe, fichiers) pour éviter les dérives.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PALETTE_VARIANT_IDS, SYNTAX_MERGE_SLUGS } from "./theme-wins.mjs";
import { palettes } from "./syntax-variant-palettes.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const themesDir = path.join(root, "themes");
const palettesPath = path.join(root, "scripts", "palettes-extended-ui.json");

function main() {
  const pe = JSON.parse(fs.readFileSync(palettesPath, "utf8"));
  const missPalette = PALETTE_VARIANT_IDS.filter((id) => !(id in pe));
  if (missPalette.length) {
    throw new Error(
      `palettes-extended-ui.json manque des entrées pour PALETTE_VARIANT_IDS: ${missPalette.join(", ")}`,
    );
  }

  const missSyntax = SYNTAX_MERGE_SLUGS.filter((s) => !(s in palettes));
  if (missSyntax.length) {
    throw new Error(
      `syntax-variant-palettes.mjs manque des palettes pour SYNTAX_MERGE_SLUGS: ${missSyntax.join(", ")}`,
    );
  }

  for (const slug of SYNTAX_MERGE_SLUGS) {
    const f = path.join(themesDir, `dusk-${slug}.json`);
    if (!fs.existsSync(f)) {
      throw new Error(`Thème attendu par merge-syntax: ${path.relative(root, f)}`);
    }
  }

  for (const id of PALETTE_VARIANT_IDS) {
    const f = path.join(themesDir, `${id}.json`);
    if (!fs.existsSync(f)) {
      throw new Error(`Thème attendu par merge-extended-ui: ${path.relative(root, f)}`);
    }
  }

  /** Après merge-extended-ui, toutes les variantes palette doivent partager le même ensemble de clés `colors`. */
  const union = new Set();
  /** @type {Map<string, Set<string>>} */
  const byId = new Map();
  for (const id of PALETTE_VARIANT_IDS) {
    const theme = JSON.parse(
      fs.readFileSync(path.join(themesDir, `${id}.json`), "utf8"),
    );
    const keys = new Set(Object.keys(theme.colors || {}));
    byId.set(id, keys);
    for (const k of keys) union.add(k);
  }
  for (const id of PALETTE_VARIANT_IDS) {
    const keys = byId.get(id);
    const missing = [...union].filter((k) => !keys.has(k)).sort();
    if (missing.length) {
      throw new Error(
        `Variantes palette: ${id}.json manque des clés colors présentes ailleurs: ${missing.join(", ")}`,
      );
    }
  }

  const extraPaletteKeys = Object.keys(pe).filter((k) => !PALETTE_VARIANT_IDS.includes(k));
  if (extraPaletteKeys.length) {
    console.warn(
      "WARN palettes-extended-ui.json a des clés non utilisées par merge-extended:",
      extraPaletteKeys.join(", "),
    );
  }

  console.log(
    "OK pipeline:",
    PALETTE_VARIANT_IDS.length,
    "variantes palette,",
    SYNTAX_MERGE_SLUGS.length,
    "slugs syntaxe",
  );
}

try {
  main();
} catch (e) {
  console.error(e.message || e);
  process.exit(1);
}
