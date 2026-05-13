#!/usr/bin/env node
/**
 * Comprehensive WCAG AA contrast audit across all 26 Dusk Office themes.
 *
 * Walks `package.json` → `contributes.themes`, resolves each theme's `include`
 * chain, then checks ~20 critical foreground/background pairs (icons,
 * activity bar, title bar, tabs, sidebar, panels, breadcrumbs, inputs, menus,
 * buttons). Reports ratios with severity:
 *
 *  FAIL    ratio < 3   (unreadable, critical)
 *  WEAK    3 <= ratio < 4.5  (passes only as "large text")
 *  PASS    ratio >= 4.5  (WCAG AA for normal text)
 *
 * Run: node scripts/audit-contrast.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parseHexColor, luminance, contrastRatio, composite } from "./color-utils.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const themesDir = path.join(root, "themes");

// ---------------------------------------------------------------------------
// Color math (backed by color-utils.mjs)
// ---------------------------------------------------------------------------

function hexToRgb(hex) {
  const c = parseHexColor(hex);
  return c ? [c.r, c.g, c.b] : [0, 0, 0];
}

function alphaBlend(fg, bg) {
  const fgC = parseHexColor(fg);
  const bgC = parseHexColor(bg);
  if (!fgC || !bgC) return [0, 0, 0];
  const a = fgC.alpha ? parseInt(fgC.alpha, 16) / 255 : 1;
  const out = composite(fgC, a, bgC);
  return [out.r, out.g, out.b];
}

function ratio(fgHex, bgHex) {
  const fg = alphaBlend(fgHex, bgHex);
  const bg = hexToRgb(bgHex);
  const l1 = luminance({ r: fg[0], g: fg[1], b: fg[2] });
  const l2 = luminance({ r: bg[0], g: bg[1], b: bg[2] });
  return contrastRatio(l1, l2);
}

// ---------------------------------------------------------------------------
// Theme loading with include resolution
// ---------------------------------------------------------------------------

function loadTheme(absPath) {
  const data = JSON.parse(fs.readFileSync(absPath, "utf8"));
  const inc = data.include;
  if (typeof inc === "string" && inc.length > 0) {
    const parent = loadTheme(path.resolve(path.dirname(absPath), inc));
    return {
      ...parent,
      ...data,
      colors: { ...(parent.colors || {}), ...(data.colors || {}) },
    };
  }
  return data;
}

// ---------------------------------------------------------------------------
// Audit pairs — foreground key → fallback chain of background keys
// ---------------------------------------------------------------------------

const PAIRS = [
  ["editor.foreground", ["editor.background"]],
  ["editorLineNumber.foreground", ["editorGutter.background", "editor.background"]],
  ["editorLineNumber.activeForeground", ["editorGutter.background", "editor.background"]],
  ["icon.foreground", ["titleBar.activeBackground", "sideBar.background", "editor.background"]],
  ["titleBar.activeForeground", ["titleBar.activeBackground"]],
  ["titleBar.inactiveForeground", ["titleBar.inactiveBackground", "titleBar.activeBackground"]],
  ["activityBar.foreground", ["activityBar.background"]],
  ["activityBar.inactiveForeground", ["activityBar.background"]],
  ["sideBar.foreground", ["sideBar.background"]],
  ["sideBarTitle.foreground", ["sideBar.background"]],
  ["sideBarSectionHeader.foreground", ["sideBarSectionHeader.background", "sideBar.background"]],
  ["statusBar.foreground", ["statusBar.background"]],
  ["tab.activeForeground", ["tab.activeBackground", "editorGroupHeader.tabsBackground"]],
  ["tab.inactiveForeground", ["tab.inactiveBackground", "editorGroupHeader.tabsBackground"]],
  ["panelTitle.activeForeground", ["panel.background"]],
  ["panelTitle.inactiveForeground", ["panel.background"]],
  ["breadcrumb.foreground", ["breadcrumb.background", "editor.background"]],
  ["input.foreground", ["input.background"]],
  ["input.placeholderForeground", ["input.background"]],
  ["menu.foreground", ["menu.background"]],
  ["button.foreground", ["button.background"]],
  ["notifications.foreground", ["notifications.background"]],
  ["dropdown.foreground", ["dropdown.background"]],
  ["editor.selectionForeground", ["editor.background"]],
  ["list.hoverForeground", ["sideBar.background", "editor.background"]],
];

function pickBg(colors, candidates) {
  for (const k of candidates) {
    const v = colors[k];
    if (typeof v === "string" && v.startsWith("#")) {
      const hex = v.replace(/^#/, "");
      if (hex.length === 6 || hex.length === 8) return v;
    }
  }
  return null;
}

function severity(r) {
  if (r >= 4.5) return "PASS";
  if (r >= 3) return "WEAK";
  return "FAIL";
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const themes = pkg.contributes?.themes ?? [];

const results = [];
for (const t of themes) {
  if (!t.path) continue;
  const abs = path.resolve(root, t.path);
  if (!fs.existsSync(abs)) continue;
  const theme = loadTheme(abs);
  const colors = theme.colors || {};
  const checks = [];
  for (const [fgKey, bgChain] of PAIRS) {
    const fg = colors[fgKey];
    if (typeof fg !== "string" || !fg.startsWith("#")) continue;
    const bg = pickBg(colors, bgChain);
    if (!bg) continue;
    const r = ratio(fg, bg);
    checks.push({ fgKey, fg, bgKey: bgChain.find((k) => colors[k]), bg, r, sev: severity(r) });
  }
  results.push({ label: t.label, uiTheme: t.uiTheme, checks });
}

// ---------------------------------------------------------------------------
// Reporting
// ---------------------------------------------------------------------------

let totalFails = 0;
let totalWeaks = 0;

for (const { label, uiTheme, checks } of results) {
  const fails = checks.filter((c) => c.sev === "FAIL");
  const weaks = checks.filter((c) => c.sev === "WEAK");
  const status = fails.length ? "FAIL" : weaks.length ? "WEAK" : "OK";
  const stamp = status === "FAIL" ? "X" : status === "WEAK" ? "!" : "v";
  console.log(`\n[${stamp}] ${label}  (${uiTheme})  -- ${fails.length} FAIL, ${weaks.length} WEAK, ${checks.length - fails.length - weaks.length} PASS`);
  for (const c of fails) {
    console.log(`     FAIL  ${c.fgKey} (${c.fg}) on ${c.bgKey} (${c.bg})  ratio=${c.r.toFixed(2)}`);
  }
  for (const c of weaks) {
    console.log(`     WEAK  ${c.fgKey} (${c.fg}) on ${c.bgKey} (${c.bg})  ratio=${c.r.toFixed(2)}`);
  }
  totalFails += fails.length;
  totalWeaks += weaks.length;
}

console.log("\n" + "=".repeat(72));
console.log(`Total: ${totalFails} FAIL  /  ${totalWeaks} WEAK  across ${results.length} themes`);
console.log("=".repeat(72));

process.exit(totalFails > 0 ? 1 : 0);
