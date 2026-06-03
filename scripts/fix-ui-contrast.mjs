#!/usr/bin/env node
/**
 * Final build pass: lift every editor/UI/syntax pair that falls below its WCAG
 * threshold up to a passing value, editing each offending color in the file that
 * *owns* it (walking the `include` chain), so inheritance is respected and a base
 * fix propagates to all variants.
 *
 * Wired as the last step of `make:full` (before `validate`): because the fix is
 * part of the pipeline, regenerated `themes/` always matches the committed
 * output and `verify-themes-fresh` stays green. The pass is idempotent — once a
 * pair passes, the checker never flags it again, so a second run is a no-op.
 *
 * Delegates all thresholds and math to lib/contrast/* (single source of truth
 * with the runtime command and the unit tests).
 *
 * Run: node scripts/fix-ui-contrast.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const {
  MIN_TEXT_RATIO,
  MIN_UI_RATIO,
  MIN_SYNTAX_RATIO,
  checkUiContrast,
  resolveBackgroundRgb,
} = require("../lib/contrast/ui-contrast.js");
const { adjustColorForContrast, fixComponentBackground } = require("../lib/contrast/contrast-fix.js");
const { scopeMatches } = require("../lib/themes/theme-data.js");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const THEMES_DIR = path.join(root, "themes");

const BADGE_FG_KEYS = new Set(["badge.foreground", "activityBarBadge.foreground"]);

// Shared parsed-file cache so a base fix is visible to every variant in one run.
const cache = new Map(); // absPath -> { json, changed }

function loadFile(abs) {
  let entry = cache.get(abs);
  if (!entry) {
    entry = { json: JSON.parse(fs.readFileSync(abs, "utf8")), changed: false };
    cache.set(abs, entry);
  }
  return entry;
}

/** Absolute paths of a theme's include chain, base first … leaf last. */
function chainPaths(leafAbs) {
  const order = [];
  const seen = new Set();
  let cur = leafAbs;
  while (cur && !seen.has(cur)) {
    seen.add(cur);
    order.unshift(cur);
    const { json } = loadFile(cur);
    cur = typeof json.include === "string" && json.include.length > 0
      ? path.resolve(path.dirname(cur), json.include)
      : null;
  }
  return order;
}

function mergeChain(order) {
  const colors = {};
  let tokenColors = [];
  for (const abs of order) {
    const { json } = loadFile(abs);
    if (json.colors && typeof json.colors === "object") Object.assign(colors, json.colors);
    if (Array.isArray(json.tokenColors)) tokenColors = tokenColors.concat(json.tokenColors);
  }
  return { colors, tokenColors };
}

/** Nearest file (leaf → base) that defines a colors key. */
function colorOwner(order, key) {
  for (let i = order.length - 1; i >= 0; i -= 1) {
    const { json } = loadFile(order[i]);
    if (json.colors && typeof json.colors[key] === "string") return order[i];
  }
  return null;
}

/** The tokenColor rule that wins for a scope (last match in merged order) + its file. */
function effectiveTokenRule(order, scope) {
  let found = null;
  for (const abs of order) {
    const { json } = loadFile(abs);
    if (!Array.isArray(json.tokenColors)) continue;
    for (const rule of json.tokenColors) {
      if (typeof rule?.settings?.foreground === "string" && scopeMatches(rule.scope, scope)) {
        found = { abs, rule };
      }
    }
  }
  return found;
}

function setColor(abs, key, value) {
  const entry = loadFile(abs);
  if (entry.json.colors[key] === value) return false;
  entry.json.colors[key] = value;
  entry.changed = true;
  return true;
}

const thresholds = { minTextRatio: MIN_TEXT_RATIO, minUiRatio: MIN_UI_RATIO, minSyntaxRatio: MIN_SYNTAX_RATIO };
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const summary = [];

for (const theme of pkg.contributes?.themes || []) {
  if (typeof theme?.path !== "string" || !theme.path.endsWith(".json")) continue;
  const leafAbs = path.resolve(root, theme.path);
  if (!fs.existsSync(leafAbs)) continue;
  const uiTheme = typeof theme.uiTheme === "string" ? theme.uiTheme : "vs-dark";

  const order = chainPaths(leafAbs);
  const merged = mergeChain(order);
  const fails = checkUiContrast(merged.colors, merged.tokenColors, uiTheme, thresholds).filter((r) => !r.pass);
  if (fails.length === 0) continue;

  const editorBgRgb = resolveBackgroundRgb(merged.colors["editor.background"], uiTheme);
  const fixes = [];

  for (const fail of fails) {
    if (fail.kind === "syntax") {
      if (!editorBgRgb) continue;
      const newFg = adjustColorForContrast(fail.fg, editorBgRgb, fail.min);
      if (newFg === fail.fg) continue;
      const owner = effectiveTokenRule(order, fail.fgKey);
      if (!owner) continue;
      if (owner.rule.settings.foreground !== newFg) {
        owner.rule.settings.foreground = newFg;
        loadFile(owner.abs).changed = true;
        fixes.push(`${fail.label}: ${fail.fg} → ${newFg}`);
      }
      continue;
    }

    if (BADGE_FG_KEYS.has(fail.fgKey)) {
      // Bake/lift the chip background so its ink reads.
      const newBg = fixComponentBackground(fail.bg, fail.fg, fail.min);
      if (newBg === fail.bg) continue;
      const owner = colorOwner(order, fail.bgKey);
      if (owner && setColor(owner, fail.bgKey, newBg)) {
        fixes.push(`${fail.label}: bg ${fail.bg} → ${newBg}`);
      }
      continue;
    }

    // Default (glyphs, any text pair): move the foreground away from its bg.
    const bgRgb = resolveBackgroundRgb(fail.bg, uiTheme);
    if (!bgRgb) continue;
    const newFg = adjustColorForContrast(fail.fg, bgRgb, fail.min);
    if (newFg === fail.fg) continue;
    const owner = colorOwner(order, fail.fgKey);
    if (owner && setColor(owner, fail.fgKey, newFg)) {
      fixes.push(`${fail.label}: ${fail.fg} → ${newFg}`);
    }
  }

  if (fixes.length) summary.push({ label: theme.label || theme.path, fixes });
}

// Persist every mutated file (preserve 2-space indent + trailing newline).
let writtenFiles = 0;
let totalFixes = 0;
for (const [abs, entry] of cache) {
  if (!entry.changed) continue;
  const trailing = fs.readFileSync(abs, "utf8").endsWith("\n") ? "\n" : "";
  fs.writeFileSync(abs, JSON.stringify(entry.json, null, 2) + trailing);
  writtenFiles += 1;
}

if (summary.length === 0) {
  console.log("[OK] fix-ui-contrast: no changes needed.");
} else {
  for (const { label, fixes } of summary) {
    console.log(`\n${label}`);
    for (const f of fixes) {
      console.log(`  ${f}`);
      totalFixes += 1;
    }
  }
  console.log(`\n[OK] fix-ui-contrast: ${totalFixes} fix(es) across ${writtenFiles} file(s).`);
}
