#!/usr/bin/env node
/**
 * Vérifie que lib/theme-common.js reste aligné avec package.json.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const require = createRequire(import.meta.url);
const { THEME_VARIANTS, ADAPTIVE_LANGUAGE_RULES } = require("../lib/theme-common.js");

const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const labels = (pkg.contributes?.themes || []).map((t) => t.label);

let failed = false;

if (THEME_VARIANTS.length !== labels.length) {
  console.error(`THEME_VARIANTS (${THEME_VARIANTS.length}) ≠ contributes.themes (${labels.length})`);
  failed = true;
}

for (const label of labels) {
  if (!THEME_VARIANTS.includes(label)) {
    console.error(`Manquant dans THEME_VARIANTS: ${label}`);
    failed = true;
  }
}

for (const label of THEME_VARIANTS) {
  if (!labels.includes(label)) {
    console.error(`En trop dans THEME_VARIANTS: ${label}`);
    failed = true;
  }
}

for (const [lang, rule] of Object.entries(ADAPTIVE_LANGUAGE_RULES)) {
  for (const period of ["light", "dark"]) {
    if (!THEME_VARIANTS.includes(rule[period])) {
      console.error(`ADAPTIVE_LANGUAGE_RULES.${lang}.${period} invalide: ${rule[period]}`);
      failed = true;
    }
  }
}

if (failed) process.exit(1);
console.log(
  `OK runtime constants — ${THEME_VARIANTS.length} thèmes, ${Object.keys(ADAPTIVE_LANGUAGE_RULES).length} langues`,
);
