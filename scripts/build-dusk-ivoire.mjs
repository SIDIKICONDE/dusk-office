#!/usr/bin/env node
/**
 * Writes themes/dusk-ivoire.json from dusk-light.json.
 * Warm paper base #F6EEDE, cream surfaces, copper / amber accents.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { normalizeLightSyntax } from "./fix-light-syntax.mjs";
import { applyLightTerminalAnsi } from "./light-terminal-ansi.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

/** Remap #RRGGBB - UI neutrals & blues -> cream / earth tones */
const RGB_MAP = {
  ffffff: "f6eede",
  f8fafc: "f6eede",
  fafafa: "f6eede",
  f1f5f9: "efe6d8",
  eef2f7: "ebe3d6",
  e8edf4: "e5dccf",
  e2e8f0: "ddd3c4",
  cbd5e1: "d4c9b8",
  cfe8f0: "ddd0c4",
  e5e5e5: "e0d6c8",
  "64748b": "6b5d4a",
  "94a3b8": "8b7d6a",
  "6b7280": "7a6c5c",
  "727e8f": "918374",
  "4d5a6b": "9a8b78",
  "30556a": "6e6256",
  "40c8e8": "b87650",
  "67e8f9": "c98962",
  "38bdf8": "a67c52",
  "319bb4": "b5695a",
  "50b4c1": "c17f59",
  "2b92c0": "9d6b4a",
  "1aa4b8": "8a6248",
  "318fa7": "7d5a42",
  "00b2c5": "b45309",
  "00e5ff": "c06030",
  "50d0f0": "ca8a56",
  "9566c3": "8b6b9e",
  c084fc: "9d7ab8",
  "816bc2": "766494",
  "4a80c2": "5a7898",
  "7298c4": "6d8090",
  "978cc4": "8b7a95",
  "39ac63": "3d8f55",
  "68b985": "5a916e",
  "1a9849": "1f7a40",
  bd3049: "a83845",
  bd588d: "a8577a",
  c05757: "b04a4a",
  c25767: "b85a5e",
  "0a0a0a": "2c2620",
  "1e1e1e": "2a2420",
  "0f172a": "2a2420",
  "1e293b": "2a2420",
  "334155": "3d352c",
  "475569": "453d34",
};

/** @param {string} str */
function mapColor(str) {
  if (typeof str !== "string" || !str.startsWith("#")) return str;
  const m = str.match(/^#([0-9a-fA-F]{6})([0-9a-fA-F]{2})?$/i);
  if (!m) return str;
  const rgb = m[1].toLowerCase();
  const a = m[2] || "";
  const next = RGB_MAP[rgb];
  if (next) return `#${next}${a}`;
  return str;
}

/**
 * Light syntax hex → Ivoire (warm paper): stronger separation on cream #f6eede.
 * Applied to tokenColors + semanticTokenColors only.
 */
const SYNTAX_LIGHT_TO_IVOIRE = {
  "475569": "3d4f58",
  "166534": "2d6b48",
  "14532d": "24603e",
  "5b21b6": "5c2d8a",
  "9f1853": "8b1748",
  "1d4ed8": "2a5f9e",
  "1e40af": "254680",
  "0f766e": "1f8776",
  "b45309": "92400e",
  "6d28d9": "6440a0",
  "c2410c": "a63c0c",
  "334155": "3d352c",
  "9a3412": "85330f",
  "1e293b": "2a2420",
  d1e0e8: "2a2420",
  d0dce4: "2a2420",
  cfe8f0: "2a2420",
  "be185d": "9d1748",
  "a16207": "7a5206",
};

/** @param {string} c */
function mapSyntaxHexToIvory(c) {
  if (typeof c !== "string" || !c.startsWith("#")) return c;
  const m = c.match(/^#([0-9a-f]{6})([0-9a-f]{2})?$/i);
  if (!m) return c;
  const rep = SYNTAX_LIGHT_TO_IVOIRE[m[1].toLowerCase()];
  return rep ? `#${rep}${m[2] || ""}` : c;
}

/** @param {unknown} sem */
function remapSemanticToIvory(sem) {
  if (!sem || typeof sem !== "object") return;
  for (const [key, val] of Object.entries(sem)) {
    if (typeof val === "string") sem[key] = mapSyntaxHexToIvory(val);
    else if (val && typeof val === "object" && typeof val.foreground === "string")
      val.foreground = mapSyntaxHexToIvory(val.foreground);
  }
}

/** @param {unknown} tokens */
function remapTokenColorsToIvory(tokens) {
  if (!Array.isArray(tokens)) return;
  for (const block of tokens) {
    const fg = block.settings?.foreground;
    if (typeof fg === "string") block.settings.foreground = mapSyntaxHexToIvory(fg);
  }
}

/** Warm UI contrast: focus, scrollbars, line highlight, muted text on cream */
const IVOIRE_UI_CONTRAST = {
  descriptionForeground: "#3d352ccc",
  "icon.foreground": "#3d352ceb",
  "widget.border": "#8a7a6a6e",
  focusBorder: "#7d5a42a6",
  // WCAG AA on #f6eede ivoire bg: stone-700-ish solid color clears 4.5:1
  "editorLineNumber.foreground": "#5c5045",
  "editorLineNumber.activeForeground": "#5c4532",
  "editor.foldPlaceholderForeground": "#5c504598",
  "editorGhostText.foreground": "#8a7d6f7a",
  "editorWhitespace.foreground": "#9a8b7840",
  "editorInlayHint.foreground": "#52483dd9",
  // WCAG AA: bump alpha 8c (~55%) → ee (~93%) to reach ≥4.5:1 on ivoire bg
  "inlineChatInput.placeholderForeground": "#5c5045ee",
  "input.placeholderForeground": "#5c5045ee",
  "breadcrumb.foreground": "#453d34de",
  // WCAG AA: bump alpha b8 (~72%) → ee (~93%) so inactive tabs reach ≥4.5:1
  "tab.inactiveForeground": "#4a4036ee",
  "statusBar.foreground": "#2a2420ee",
  // Hover surfaces — replace dark-theme-inherited values (#010203aa, #d1e0e8) that
  // produced black flashes / invisible white hover text on the cream Ivory base.
  // Warm amber tint at 13–20% alpha gives a clearly visible, palette-coherent highlight.
  "list.hoverBackground": "#c9896222",
  "list.hoverForeground": "#2a2420",
  "list.focusBackground": "#b8765033",
  "tab.hoverBackground": "#c9896222",
  "tab.unfocusedHoverBackground": "#c9896218",
  "menubar.selectionBackground": "#c9896233",
  // Active activity-bar icons — amber-700 instead of inherited #22d3ee cyan
  // (which produced 1.57:1 against the cream activity bar = invisible).
  "activityBar.foreground": "#92400e",
  "activityBar.activeBorder": "#92400e",
  "activityBar.activeBackground": "#c9896222",
  "activityBar.inactiveForeground": "#6b5f50",
  "editor.lineHighlightBackground": "#c9bbaa22",
  "editor.lineHighlightBorder": "#8a6d5236",
  "editorIndentGuide.background1": "#6b5d4a22",
  "editorIndentGuide.background2": "#6b5d4a16",
  "editorIndentGuide.background3": "#6b5d4a0e",
  "editorIndentGuide.background4": "#6b5d4a08",
  "editorIndentGuide.activeBackground1": "#c9896230",
  "editorIndentGuide.activeBackground2": "#b8765030",
  "editorIndentGuide.activeBackground3": "#c989621c",
  "editorIndentGuide.activeBackground4": "#b876501c",
  "tree.indentGuidesStroke": "#6b5d4a18",
  "tree.inactiveIndentGuidesStroke": "#6b5d4a0a",
  "sideBarTitle.foreground": "#b45309",
  "sideBarSectionHeader.foreground": "#3d362e",
  "panelTitle.activeForeground": "#a84418",
  "scrollbarSlider.background": "#7d6a5652",
  "scrollbarSlider.hoverBackground": "#5c4d407a",
  "sideBar.foreground": "#2a2420",
};

/** @param {unknown} out */
function applyIvoireContrast(out) {
  Object.assign(out.colors, IVOIRE_UI_CONTRAST);
  remapSemanticToIvory(out.semanticTokenColors);
  remapTokenColorsToIvory(out.tokenColors);
  const sem = out.semanticTokenColors;
  if (sem && typeof sem === "object" && typeof sem.variable === "string")
    sem.variable = "#3d3830";
  const ed = out.colors["editor.background"];
  if (typeof ed === "string" && ed.startsWith("#")) {
    out.colors["sideBar.background"] = ed;
  }
}

function main() {
  const light = JSON.parse(fs.readFileSync(path.join(root, "themes/dusk-light.json"), "utf8"));
  const colors = {};
  for (const [k, v] of Object.entries(light.colors || {})) {
    colors[k] = typeof v === "string" ? mapColor(v) : v;
  }

  const out = {
    $schema: "vscode://schemas/color-theme",
    name: "Dusk Office Ivory",
    type: "light",
    include: "./dusk.json",
    colors,
    tokenColors: structuredClone(light.tokenColors),
    semanticTokenColors: structuredClone(light.semanticTokenColors),
  };

  applyIvoireContrast(out);
  normalizeLightSyntax(out);
  applyLightTerminalAnsi(out.colors);

  const dest = path.join(root, "themes/dusk-ivoire.json");
  fs.writeFileSync(dest, JSON.stringify(out, null, 2) + "\n", "utf8");
  console.log("OK", dest, Object.keys(colors).length, "couleurs");
}

main();
