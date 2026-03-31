#!/usr/bin/env node
/**
 * Fusionne semanticTokenColors + tokenColors dans chaque themes/dusk-<slug>.json
 * (a lancer depuis extensions/dusk-theme)
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { syntaxBlocksFor } from "./syntax-variant-palettes.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const themesDir = path.join(__dirname, "..", "themes");

const slugs = [
  "abime",
  "aube",
  "baie",
  "brume",
  "cendre",
  "minuit",
  "nebuleuse",
  "recif",
];

for (const slug of slugs) {
  const file = path.join(themesDir, `dusk-${slug}.json`);
  const j = JSON.parse(fs.readFileSync(file, "utf8"));
  const { semanticTokenColors, tokenColors } = syntaxBlocksFor(slug);
  j.semanticTokenColors = semanticTokenColors;
  j.tokenColors = tokenColors;
  fs.writeFileSync(file, JSON.stringify(j, null, 2) + "\n", "utf8");
  console.log("OK", path.basename(file));
}
