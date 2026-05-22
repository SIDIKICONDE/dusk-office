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
const {
  THEME_BASE,
  THEME_VARIANTS,
  ADAPTIVE_LANGUAGE_RULES,
  stripThemeDisplayLabel,
} = require("../lib/theme-common.js");

const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const labels = (pkg.contributes?.themes || []).map((t) => stripThemeDisplayLabel(t.label));
const expectedOrder = [...THEME_VARIANTS, THEME_BASE];

let failed = false;

if (expectedOrder.length !== labels.length) {
  console.error(
    `Ordre attendu (${expectedOrder.length}) ≠ contributes.themes (${labels.length})`,
  );
  failed = true;
}

for (const label of labels) {
  if (!expectedOrder.includes(label)) {
    console.error(`Thème inconnu dans package.json: ${label}`);
    failed = true;
  }
}

for (let i = 0; i < expectedOrder.length; i++) {
  const expected = expectedOrder[i];
  const actual = labels[i];
  if (expected !== actual) {
    console.error(
      `Ordre package.json[${i}]: attendu "${expected}", reçu "${actual ?? "(manquant)"}"`,
    );
    failed = true;
  }
}

for (const [lang, rule] of Object.entries(ADAPTIVE_LANGUAGE_RULES)) {
  for (const period of ["light", "dark"]) {
    if (!THEME_VARIANTS.includes(rule[period]) && rule[period] !== THEME_BASE) {
      console.error(`ADAPTIVE_LANGUAGE_RULES.${lang}.${period} invalide: ${rule[period]}`);
      failed = true;
    }
  }
}

if (failed) process.exit(1);
console.log(
  `OK runtime constants — ${THEME_VARIANTS.length} variantes + base, ${Object.keys(ADAPTIVE_LANGUAGE_RULES).length} langues`,
);
