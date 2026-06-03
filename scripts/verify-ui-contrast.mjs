#!/usr/bin/env node
/**
 * Ensures editor text, syntax tokens, and workbench chrome stay readable against
 * their backgrounds across every packaged variant. Delegates to
 * lib/contrast/ui-contrast.js (single source of truth with runtime + tests) and
 * lib/themes/theme-data.js for include-chain flattening.
 *
 * Usage: node scripts/verify-ui-contrast.mjs
 * Env: MIN_TEXT_RATIO (default 4.5), MIN_UI_RATIO (default 3.0)
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { mergeThemeData } = require("../lib/themes/theme-merge-data.js");
const { MIN_TEXT_RATIO, MIN_UI_RATIO, MIN_SYNTAX_RATIO, checkUiContrast } = require("../lib/contrast/ui-contrast.js");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const pkgPath = path.join(root, "package.json");

const minText = Number(process.env.MIN_TEXT_RATIO) || MIN_TEXT_RATIO;
const minUi = Number(process.env.MIN_UI_RATIO) || MIN_UI_RATIO;
const minSyntax = Number(process.env.MIN_SYNTAX_RATIO) || MIN_SYNTAX_RATIO;

function main() {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  const themes = pkg?.contributes?.themes;
  if (!Array.isArray(themes)) {
    throw new Error("package.json: contributes.themes missing");
  }

  let total = 0;
  const allFailures = [];

  for (const t of themes) {
    if (!t.path) continue;
    const full = path.resolve(root, t.path);
    if (!fs.existsSync(full) || !full.endsWith(".json")) continue;

    const rel = path.relative(root, full).replace(/\\/g, "/");
    const uiTheme = typeof t.uiTheme === "string" ? t.uiTheme : "vs-dark";
    let data;
    try {
      data = mergeThemeData(full);
    } catch (e) {
      throw new Error(`${rel}: ${e.message || e}`);
    }

    const fails = checkUiContrast(data.colors, data.tokenColors, uiTheme, {
      minTextRatio: minText,
      minUiRatio: minUi,
      minSyntaxRatio: minSyntax,
    }).filter((r) => !r.pass);
    total++;
    if (fails.length) {
      allFailures.push({ rel, fails });
    }
  }

  if (allFailures.length) {
    for (const { rel, fails } of allFailures) {
      console.error(`\n${rel}:`);
      for (const f of fails) {
        console.error(
          `  - ${f.label}: ${f.fg} on ${f.bg} = ${f.ratio.toFixed(2)}:1 (min ${f.min}:1) [${f.fgKey} / ${f.bgKey}]`,
        );
      }
    }
    throw new Error(
      `verify-ui-contrast: ${allFailures.length} theme(s) below threshold (see above).`,
    );
  }

  console.log(
    "OK editor/UI contrast:",
    total,
    "themes — text ≥",
    `${minText}:1; signal/UI ≥`,
    `${minUi}:1; syntax ≥`,
    `${minSyntax}:1 on all themes`,
  );
}

try {
  main();
} catch (e) {
  console.error(e.message || e);
  process.exit(1);
}
