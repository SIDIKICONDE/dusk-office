#!/usr/bin/env node
/**
 * Ensures terminal.foreground and ANSI colors stay readable on terminal.background.
 * Delegates to lib/terminal/terminal-contrast.js (single source of truth with runtime + tests).
 *
 * Usage: node scripts/verify-terminal-contrast.mjs
 * Env: MIN_FG_RATIO (default 4.5), MIN_ANSI_RATIO (default 2.9)
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const {
  MIN_TERMINAL_FG_RATIO,
  MIN_TERMINAL_ANSI_RATIO,
  checkTerminalContrast,
} = require("../lib/terminal/terminal-contrast.js");
const { mergeThemeColors } = require("../lib/terminal/theme-merge.js");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const pkgPath = path.join(root, "package.json");

const MIN_FG = Number(process.env.MIN_FG_RATIO) || MIN_TERMINAL_FG_RATIO;
const MIN_ANSI = Number(process.env.MIN_ANSI_RATIO) || MIN_TERMINAL_ANSI_RATIO;

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
    let merged;
    try {
      merged = mergeThemeColors(full);
    } catch (e) {
      throw new Error(`${rel}: ${e.message || e}`);
    }

    const fails = checkTerminalContrast(merged, uiTheme, {
      minFgRatio: MIN_FG,
      minAnsiRatio: MIN_ANSI,
    });
    total++;
    if (fails.length) {
      allFailures.push({ rel, fails });
    }
  }

  if (allFailures.length) {
    for (const { rel, fails } of allFailures) {
      console.error(`\n${rel}:`);
      for (const f of fails) console.error(`  - ${f}`);
    }
    throw new Error(
      `verify-terminal-contrast: ${allFailures.length} theme(s) below threshold (see above).`,
    );
  }

  console.log(
    "OK terminal contrast:",
    total,
    "themes — terminal.foreground ≥",
    `${MIN_FG}:1 vs terminal.background; ANSI (except black) ≥`,
    `${MIN_ANSI}:1 on all themes`,
  );
}

try {
  main();
} catch (e) {
  console.error(e.message || e);
  process.exit(1);
}
