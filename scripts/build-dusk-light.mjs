#!/usr/bin/env node
/**
 * Writes themes/dusk-light.json from dusk-abime.json (dark palette -> light).
 * Re-run after major changes to Dusk Office Abyss.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

/** Very dark #RRGGBB bases -> light surfaces */
const DARK_BG_TO_LIGHT = {
  "000000": "#e2e8f0",
  "02060c": "#e8edf4",
  "030810": "#f1f5f9",
  "040a10": "#f8fafc",
  "040a12": "#f1f5f9",
  "040c10": "#eef2f7",
  "040c12": "#f1f5f9",
  "050e16": "#ffffff",
  "061018": "#f8fafc",
  "122030": "#cbd5e1",
  "1e3448": "#94a3b8",
  "285868": "#94a3b8",
  "2d5a78": "#64748b",
};

/** Texte / icones clairs illisibles sur fond blanc (#RRGGBB ou #RRGGBBAA) */
const LIGHT_FG_TO_DARK = {
  cfe8f0: "#0f172a",
  cfe8f0aa: "#334155aa",
  cfe8f0cc: "#334155cc",
  cfe8f077: "#64748b77",
  cfe8f055: "#64748b55",
  cfe8f0bb: "#475569bb",
  cfe8f088: "#64748b88",
  cfe8f022: "#33415522",
  cfe8f012: "#33415512",
};

function luminance6(rgb) {
  const r = parseInt(rgb.slice(0, 2), 16) / 255;
  const g = parseInt(rgb.slice(2, 4), 16) / 255;
  const b = parseInt(rgb.slice(4, 6), 16) / 255;
  const lin = (v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  const R = lin(r),
    G = lin(g),
    B = lin(b);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

/** @param {string} s */
function mapHex(s, key) {
  if (typeof s !== "string" || !s.startsWith("#")) return s;
  const h = s.slice(1);
  if (h.length !== 6 && h.length !== 8) return s;
  const rgb = h.slice(0, 6).toLowerCase();
  const a = h.length === 8 ? h.slice(6).toLowerCase() : "";
  const fullLower = (rgb + a).toLowerCase();
  if (LIGHT_FG_TO_DARK[fullLower]) return LIGHT_FG_TO_DARK[fullLower];

  if (key.includes("shadow") && rgb === "000000") return "#64748b" + (a || "44");

  const rep = DARK_BG_TO_LIGHT[rgb];
  if (rep) {
    const out = rep.slice(1);
    return "#" + out + (a || "");
  }

  if (luminance6(rgb) < 0.08 && rgb !== "0a0a0a" && rgb !== "1e1e1e") {
    const fallback = "#f1f5f9";
    return "#" + fallback.slice(1) + (a || "");
  }

  return s;
}

/** UI + syntax contrast (muted text, scrollbars, focus) after abyss→light mapping */
const LIGHT_UI_CONTRAST_COLORS = {
  descriptionForeground: "#334155dd",
  "icon.foreground": "#334155eb",
  "widget.border": "#4d5a6b73",
  "editor.foldPlaceholderForeground": "#64748b99",
  "editorGhostText.foreground": "#94a3b878",
  "editorWhitespace.foreground": "#94a3b838",
  "editorInlayHint.foreground": "#64748bd9",
  "inlineChatInput.placeholderForeground": "#64748b8c",
  "breadcrumb.foreground": "#475569de",
  "tab.inactiveForeground": "#475569b8",
  "statusBar.foreground": "#1e293bee",
  "input.placeholderForeground": "#64748b8c",
  "activityBar.inactiveForeground": "#64748b",
  "tree.inactiveIndentGuidesStroke": "#64748b7a",
  "editor.lineHighlightBackground": "#e8edf3",
  "editor.lineHighlightBorder": "#cbd5e199",
  "sideBarSectionHeader.foreground": "#334155",
  "scrollbarSlider.background": "#94a3b88f",
  "scrollbarSlider.hoverBackground": "#64748bbb",
  focusBorder: "#0ea5e9b3",
  /** abyss palette omits this; without it, included dusk.json leaves sidebar text too light */
  "sideBar.foreground": "#1e293b",

  // Markdown preview (cohérent avec surfaces claires)
  "textLink.foreground": "#0284c7",
  "textLink.activeForeground": "#0369a1",
  "textBlockQuote.background": "#f1f5f9",
  "textBlockQuote.border": "#22d3ee55",
  "textCodeBlock.background": "#f8fafc",
  "textPreformat.background": "#e2e8f0",
  "textPreformat.foreground": "#1e293b",
  "textPreformat.border": "#cbd5e1",
  "markdownAlert.note.foreground": "#0284c7",
  "markdownAlert.tip.foreground": "#16a34a",
  "markdownAlert.important.foreground": "#9333ea",
  "markdownAlert.warning.foreground": "#d97706",
  "markdownAlert.caution.foreground": "#dc2626",
};

/** @param {unknown} out */
function applyLightContrast(out) {
  Object.assign(out.colors, LIGHT_UI_CONTRAST_COLORS);
  const sem = out.semanticTokenColors;
  if (sem && typeof sem === "object") {
    if (sem.comment && typeof sem.comment === "object")
      sem.comment.foreground = "#475569";
    if (typeof sem.variable === "string") sem.variable = "#1e293b";
  }
  const tokens = out.tokenColors;
  if (!Array.isArray(tokens)) return;
  for (const block of tokens) {
    const scopes = block.scope;
    const sc = Array.isArray(scopes) ? scopes.join(" ") : scopes;
    if (typeof sc === "string" && sc.includes("comment")) {
      if (block.settings && typeof block.settings === "object")
        block.settings.foreground = "#475569";
    }
  }
}

/** Preserves curated light syntax; UI colors still come from abyss mapping. */
function readExistingLightSyntax() {
  try {
    const p = path.join(root, "themes/dusk-light.json");
    const prev = JSON.parse(fs.readFileSync(p, "utf8"));
    if (Array.isArray(prev.tokenColors) && prev.tokenColors.length && prev.semanticTokenColors)
      return {
        tokenColors: structuredClone(prev.tokenColors),
        semanticTokenColors: structuredClone(prev.semanticTokenColors),
      };
  } catch {
    /* first run or invalid file */
  }
  return null;
}

function main() {
  const abime = JSON.parse(fs.readFileSync(path.join(root, "themes/dusk-abime.json"), "utf8"));
  const existingSyntax = readExistingLightSyntax();
  /** @type {Record<string, string>} */
  const colors = {};
  for (const [k, v] of Object.entries(abime.colors || {})) {
    colors[k] = typeof v === "string" ? mapHex(v, k) : v;
  }

  const out = {
    $schema: "vscode://schemas/color-theme",
    name: "Dusk Office Light",
    type: "light",
    include: "./dusk.json",
    colors,
    tokenColors: existingSyntax?.tokenColors ?? structuredClone(abime.tokenColors),
    semanticTokenColors: existingSyntax?.semanticTokenColors ?? structuredClone(abime.semanticTokenColors),
  };

  applyLightContrast(out);

  const dest = path.join(root, "themes/dusk-light.json");
  fs.writeFileSync(dest, JSON.stringify(out, null, 2) + "\n", "utf8");
  console.log("OK", dest, Object.keys(colors).length, "couleurs");
}

main();
