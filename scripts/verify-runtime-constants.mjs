#!/usr/bin/env node
/**
 * Vérifie que lib/themes/theme-common.js reste aligné avec package.json.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import { THEME_ENUM_SPECS, buildThemeEnum, enumsEqual } from "./theme-package-enums.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const require = createRequire(import.meta.url);
const {
  THEME_BASE,
  THEME_VARIANTS,
  ADAPTIVE_LANGUAGE_RULES,
  stripThemeDisplayLabel,
} = require("../lib/themes/theme-common.js");
const { buildLandingThemeEntry } = require("../lib/themes/landing-preview.js");

const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const labels = (pkg.contributes?.themes || []).map((t) => stripThemeDisplayLabel(t.label));
const expectedOrder = [...THEME_VARIANTS, THEME_BASE];

let failed = false;

// VS Marketplace limite les keywords du package.json à 30 (erreur
// "You exceeded the number of allowed tags of 30" au publish).
const MAX_KEYWORDS = 30;
const keywords = pkg.keywords ?? [];
if (keywords.length > MAX_KEYWORDS) {
  console.error(
    `keywords: ${keywords.length} > ${MAX_KEYWORDS} — la limite VS Marketplace est de ${MAX_KEYWORDS}. Réduisez le tableau keywords de package.json.`,
  );
  failed = true;
}

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

for (const spec of THEME_ENUM_SPECS) {
  const enumValues = pkg.contributes?.configuration?.properties?.[spec.key]?.enum;
  if (!Array.isArray(enumValues)) {
    console.error(`${spec.key}: enum manquant`);
    failed = true;
    continue;
  }
  const expected = buildThemeEnum(spec.includeEmpty);
  if (!enumsEqual(enumValues, expected)) {
    console.error(`${spec.key}: enum désaligné avec ALL_DUSK_THEMES (lancer npm run sync:enums)`);
    failed = true;
  }
}

const landingPath = path.join(root, "docs", "landing-themes.js");
if (!fs.existsSync(landingPath)) {
  console.error("docs/landing-themes.js manquant — lancer npm run build:bundle");
  failed = true;
} else {
  const landingText = fs.readFileSync(landingPath, "utf8");
  const marker = "globalThis.DUSK_OFFICE_LANDING_THEMES = ";
  const markerAt = landingText.indexOf(marker);
  let landing;
  try {
    landing = JSON.parse(landingText.slice(markerAt + marker.length).replace(/;\s*$/, "").trim());
  } catch {
    landing = null;
  }
  const bundle = require("../lib/generated/themes-bundle.js");
  const expectedLanding = Array.isArray(bundle) ? bundle.map((entry) => buildLandingThemeEntry(entry)) : [];
  if (markerAt < 0 || !Array.isArray(landing)) {
    console.error("docs/landing-themes.js: payload invalide");
    failed = true;
  } else if (JSON.stringify(landing) !== JSON.stringify(expectedLanding)) {
    console.error("docs/landing-themes.js désaligné avec themes-bundle — lancer npm run build:bundle");
    failed = true;
  }
}

if (failed) process.exit(1);
console.log(
  `OK runtime constants — ${THEME_VARIANTS.length} variantes + base, ${Object.keys(ADAPTIVE_LANGUAGE_RULES).length} langues, ${THEME_ENUM_SPECS.length} enums`,
);
