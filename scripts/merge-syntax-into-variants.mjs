#!/usr/bin/env node
/**
 * Fusionne semanticTokenColors + tokenColors dans chaque themes/dusk-<slug>.json
 * (a lancer depuis extensions/dusk-theme)
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { syntaxBlocksFor } from "./syntax-variant-palettes.mjs";
import { SYNTAX_MERGE_SLUGS } from "./theme-wins.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const themesDir = path.join(__dirname, "..", "themes");

for (const slug of SYNTAX_MERGE_SLUGS) {
  const file = path.join(themesDir, `dusk-${slug}.json`);
  if (!fs.existsSync(file)) {
    console.error(
      `merge-syntax: fichier manquant — ${path.relative(path.join(__dirname, ".."), file)}`,
    );
    process.exit(1);
  }
  const j = JSON.parse(fs.readFileSync(file, "utf8"));
  const { semanticTokenColors, tokenColors } = syntaxBlocksFor(slug);
  j.semanticTokenColors = semanticTokenColors;
  j.tokenColors = tokenColors;
  fs.writeFileSync(file, JSON.stringify(j, null, 2) + "\n", "utf8");
  console.log("OK", path.basename(file));
}
