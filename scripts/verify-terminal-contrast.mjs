#!/usr/bin/env node
/**
 * Ensures terminal.foreground and ANSI colors (except black slots) stay readable
 * on terminal.background (aligned with panel via merge-extended-ui-colors).
 *
 * Default thresholds: terminal.foreground ≥ 4.5:1 (WCAG 2.1 AA body text),
 * other ANSI (except black / brightBlack) ≥ 2.9:1 on dark backgrounds (vs-dark / hc-black).
 * Light themes (vs): only terminal.foreground vs background.
 *
 * Usage: node scripts/verify-terminal-contrast.mjs
 * Env: MIN_FG_RATIO (default 4.5), MIN_ANSI_RATIO (default 2.9)
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parseHexColor as parseColor, luminance, contrastRatio } from "./color-utils.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const pkgPath = path.join(root, "package.json");

const MIN_FG = Number(process.env.MIN_FG_RATIO) || 4.5;
/** Dark-background ANSI: target 3:1; 2.9 avoids false positives on saturated hues (e.g. magenta on blue panel). */
const MIN_ANSI = Number(process.env.MIN_ANSI_RATIO) || 2.9;

const SKIP_ANSI = new Set([
  "terminal.ansiBlack",
  "terminal.ansiBrightBlack",
]);

const ANSI_KEYS = [
  "terminal.foreground",
  "terminal.ansiBlack",
  "terminal.ansiRed",
  "terminal.ansiGreen",
  "terminal.ansiYellow",
  "terminal.ansiBlue",
  "terminal.ansiMagenta",
  "terminal.ansiCyan",
  "terminal.ansiWhite",
  "terminal.ansiBrightBlack",
  "terminal.ansiBrightRed",
  "terminal.ansiBrightGreen",
  "terminal.ansiBrightYellow",
  "terminal.ansiBrightBlue",
  "terminal.ansiBrightMagenta",
  "terminal.ansiBrightCyan",
  "terminal.ansiBrightWhite",
];

/* luminance, contrastRatio, parseColor — imported from color-utils.mjs */

/** @param {{ r: number; g: number; b: number }} fg @param {number} a01 @param {{ r: number; g: number; b: number }} bg */
function composite(fg, a01, bg) {
  const a = Math.max(0, Math.min(1, a01));
  return {
    r: Math.round(fg.r * a + bg.r * (1 - a)),
    g: Math.round(fg.g * a + bg.g * (1 - a)),
    b: Math.round(fg.b * a + bg.b * (1 - a)),
  };
}

/**
 * Opaque terminal background: if alpha, composite on black (dark) or white (light)
 * by RGB luminance, to match a shell on dark vs light background.
 */
function terminalBgRgb(colorStr) {
  const p = parseColor(colorStr);
  if (!p) return null;
  if (p.alpha != null) {
    const a = parseInt(p.alpha, 16) / 255;
    const L = luminance({ r: p.r, g: p.g, b: p.b });
    const under = L < 0.2 ? { r: 0, g: 0, b: 0 } : { r: 255, g: 255, b: 255 };
    return composite({ r: p.r, g: p.g, b: p.b }, a, under);
  }
  return { r: p.r, g: p.g, b: p.b };
}

/** @param {string} colorStr @param {{ r: number; g: number; b: number }} bgRgb */
function effectiveFgRgb(colorStr, bgRgb) {
  const p = parseColor(colorStr);
  if (!p) return null;
  if (p.alpha != null) {
    const a = parseInt(p.alpha, 16) / 255;
    return composite({ r: p.r, g: p.g, b: p.b }, a, bgRgb);
  }
  return { r: p.r, g: p.g, b: p.b };
}

/** @param {string} file */
function readThemeJson(file) {
  const raw = fs.readFileSync(file, "utf8");
  return JSON.parse(raw);
}

/** @param {string} fromFile */
function resolveInclude(fromFile, includePath) {
  return path.normalize(path.join(path.dirname(fromFile), includePath));
}

/**
 * Merges the `include` chain (parent then child).
 * @param {string} file absolute path
 * @param {Set<string>} chain
 * @returns {Record<string, string>}
 */
function mergeColors(file, chain = new Set()) {
  const rel = path.relative(root, file);
  if (chain.has(rel)) {
    throw new Error(`Circular include chain: ${[...chain, rel].join(" -> ")}`);
  }
  chain.add(rel);

  const theme = readThemeJson(file);
  let base = {};
  if (theme.include) {
    if (typeof theme.include !== "string") {
      throw new Error(`${rel}: invalid include`);
    }
    const parentPath = resolveInclude(file, theme.include);
    if (!fs.existsSync(parentPath)) {
      throw new Error(`${rel}: include not found — ${path.relative(root, parentPath)}`);
    }
    base = mergeColors(parentPath, chain);
  }
  return { ...base, ...(theme.colors && typeof theme.colors === "object" ? theme.colors : {}) };
}

/**
 * @param {Record<string, string>} colors
 * @param {string} rel theme path for messages
 * @param {string} uiTheme vs | vs-dark | hc-black
 */
function checkTheme(colors, rel, uiTheme) {
  const bgStr = colors["terminal.background"];
  if (!bgStr || typeof bgStr !== "string") {
    throw new Error(`${rel}: terminal.background missing`);
  }
  const bgRgb = terminalBgRgb(bgStr);
  if (!bgRgb) {
    throw new Error(`${rel}: terminal.background not parseable (${bgStr})`);
  }
  const Lbg = luminance(bgRgb);

  const failures = [];
  const fgStr = colors["terminal.foreground"];
  if (fgStr && typeof fgStr === "string") {
    const fgRgb = effectiveFgRgb(fgStr, bgRgb);
    if (fgRgb) {
      const r = contrastRatio(luminance(fgRgb), Lbg);
      if (r < MIN_FG) {
        failures.push(
          `terminal.foreground ${fgStr} vs terminal.background ${bgStr} → ${r.toFixed(2)}:1 (min ${MIN_FG}:1)`,
        );
      }
    }
  }

  const lightUi = uiTheme === "vs";
  if (!lightUi) {
    for (const key of ANSI_KEYS) {
      if (key === "terminal.foreground") continue;
      if (SKIP_ANSI.has(key)) continue;
      const v = colors[key];
      if (typeof v !== "string") continue;
      const fgRgb = effectiveFgRgb(v, bgRgb);
      if (!fgRgb) continue;
      const r = contrastRatio(luminance(fgRgb), Lbg);
      if (r < MIN_ANSI) {
        failures.push(`${key} ${v} → ${r.toFixed(2)}:1 (min ${MIN_ANSI}:1)`);
      }
    }
  }

  return failures;
}

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
    if (!fs.existsSync(full)) continue;
    if (!full.endsWith(".json")) continue;

    const rel = path.relative(root, full);
    const uiTheme = typeof t.uiTheme === "string" ? t.uiTheme : "vs-dark";
    let merged;
    try {
      merged = mergeColors(full);
    } catch (e) {
      throw new Error(`${rel}: ${e.message || e}`);
    }

    const fails = checkTheme(merged, rel.replace(/\\/g, "/"), uiTheme);
    total++;
    if (fails.length) {
      allFailures.push({ rel: rel.replace(/\\/g, "/"), fails });
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
    MIN_FG + ":1 vs terminal.background;",
    "vs-dark/hc themes: ANSI (except black) ≥",
    MIN_ANSI + ":1;",
    "light (vs) themes: ANSI not checked (palette intended for dark backgrounds)",
  );
}

try {
  main();
} catch (e) {
  console.error(e.message || e);
  process.exit(1);
}
