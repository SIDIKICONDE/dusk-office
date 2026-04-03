#!/usr/bin/env node
/**
 * Copie theme-sources/*.json → themes/ (même nom) avant le pipeline.
 * Éditer uniquement theme-sources/ ; ne copie pas dusk-hc.json (produit par build-dusk-hc.mjs
 * après Abyss). dusk-light / dusk-ivoire* : absents de theme-sources, générés par build.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const SKIP_SYNC = new Set(["dusk-hc.json"]);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const sourcesDir = path.join(root, "theme-sources");
const themesDir = path.join(root, "themes");

function main() {
  if (!fs.existsSync(sourcesDir)) {
    console.warn("theme-sources/ absent — ignoré (créez-le ou lancez npm run theme:sources:extract).");
    return;
  }
  const files = fs.readdirSync(sourcesDir).filter((f) => f.endsWith(".json"));
  if (files.length === 0) {
    console.warn("theme-sources/ vide — ignoré.");
    return;
  }
  fs.mkdirSync(themesDir, { recursive: true });
  for (const f of files) {
    if (SKIP_SYNC.has(f)) continue;
    const src = path.join(sourcesDir, f);
    const dest = path.join(themesDir, f);
    fs.copyFileSync(src, dest);
    console.log("OK", f, "→ themes/");
  }
}

main();
