#!/usr/bin/env node
/**
 * Dusk Office Audit — génère `themes/dusk-audit.json` depuis `dusk-light.json`.
 * Palette compliance : ardoise froide + accent or audit (pas de néons hérités du Light).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { normalizeLightSyntax } from "./fix-light-syntax.mjs";
import { applyLightTerminalAnsi } from "./light-terminal-ansi.mjs";
import {
  AUDIT_CHROME_UI,
  AUDIT_SETTINGS_UI,
  AUDIT_TAB_UI,
} from "./light-settings-ui.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const LIGHT_PATH = path.join(root, "themes", "dusk-light.json");
const OUT_PATH = path.join(root, "themes", "dusk-audit.json");

/** @param {string} str */
function mapColor(str) {
  if (typeof str !== "string" || !str.startsWith("#")) return str;
  const m = str.match(/^#([0-9a-f]{6})([0-9a-f]{2})?$/i);
  if (!m) return str;
  const rep = AUDIT_RGB_MAP[m[1].toLowerCase()];
  return rep ? `#${rep}${m[2] || ""}` : str;
}

/** Remap global Light → Audit (surfaces + fuites cyan). */
const AUDIT_RGB_MAP = {
  ffffff: "eef2f8",
  f8fafc: "eef2f8",
  f1f5f9: "edf1f5",
  eef2f7: "e8eef3",
  e8edf4: "e4eaef",
  e2e8f0: "dde4ea",
  cbd5e1: "c8d0d8",
  cfe8f0: "dde4e9",
  "64748b": "6b757d",
  "94a3b8": "8d8b84",
  "06b6d4": "556f83",
  "0ea5e9": "556f83",
  "22d3ee": "556f83",
  "0284c7": "4e738c",
  "0369a1": "3e5565",
  "38bdf8": "556f83",
  "319bb4": "556f83",
  "50b4c1": "658297",
  "6a9ab0": "7a8898",
  "6a9ab8": "658297",
  "7ab8c8": "658297",
  "7ab0c8": "658297",
  "5a9aaa": "556f83",
  "5a8fb0": "556f83",
  "9566c3": "7a8898",
  c084fc: "7a8898",
  "816bc2": "6b6080",
  "9694af": "7a8898",
  "39ac63": "4a7a62",
  "68b985": "4a7a62",
  db2777: "8b4a52",
  ec4899: "8b4a52",
  f472b6: "8b4a52",
  "9ccae0": "6b757d",
  "0f172a": "25313a",
  "1e293b": "25313a",
  "334155": "25313a",
  "475569": "475868",
};

/** Gagne sur applyLightTerminalAnsi (bordures panel/terminal génériques Light). */
const AUDIT_CHROME_FINAL = {
  "panel.border": "#8d8b84aa",
  "panelSectionHeader.border": "#8d8b8499",
  "panelInput.border": "#8d8b8499",
  "panelTitle.border": "#8d8b8499",
  "panelTitle.activeBorder": "#556f83cc",
  "terminal.border": "#8d8b84aa",
  "terminalStickyScroll.border": "#8d8b84aa",
  "terminal.tab.activeBorder": "#556f83",
  "editorIndentGuide.activeBackground1": "#556f8330",
  "editorIndentGuide.activeBackground2": "#8a734430",
  "editorIndentGuide.activeBackground3": "#556f831c",
  "editorIndentGuide.activeBackground4": "#8a73441c",
  "testing.peekBorder": "#556f8366",
  "notificationLink.foreground": "#4e738c",
  "notebook.focusedCellBorder": "#556f835a",
  "notebook.focusedEditorBorder": "#556f834b",
  "notebook.inactiveFocusedCellBorder": "#556f833d",
  "notebook.selectedCellBorder": "#556f832f",
};

/** Light / Tailwind syntax → teintes Audit (muted compliance). */
const SYNTAX_LIGHT_TO_AUDIT = {
  "475569": "4f677b",
  "166534": "4a7a62",
  "14532d": "3d6b52",
  "5b21b6": "6b6080",
  "9f1853": "8b4a52",
  "1d4ed8": "4e738c",
  "1e40af": "3e5565",
  "0f766e": "4a7a62",
  "b45309": "8a7344",
  "6d28d9": "6b6080",
  "c2410c": "8a6b48",
  "334155": "25313a",
  "9a3412": "8a6b48",
  "1e293b": "25313a",
  "0f172a": "25313a",
  d1e0e8: "25313a",
  d0dce4: "25313a",
  cfe8f0: "25313a",
  "be185d": "8b4a52",
  "a16207": "8a7344",
  "0369a1": "3e5565",
  "0284c7": "4e738c",
  "0e7490": "556f83",
  "0891b2": "4e738c",
  "34d399": "4a7a62",
  "a855f7": "5c6b82",
  "9333ea": "6b6080",
  "7c3aed": "6b6080",
  "8b5cf6": "7a8898",
  "ca8a04": "8a7344",
  "eab308": "9a8448",
  "f97316": "a67c52",
  "ea580c": "8a6b48",
  "92400e": "8a7344",
  "9694af": "7a8898",
  "22d3ee": "556f83",
  "06b6d4": "556f83",
  "0ea5e9": "556f83",
  db2777: "8b4a52",
  ec4899: "8b4a52",
  f472b6: "8b4a52",
  "9ccae0": "6b757d",
};

/** Surfaces & chrome Audit — hiérarchie claire, sans cyan Light résiduel. */
const AUDIT_UI_OVERRIDES = {
  "editor.background": "#edf1f5",
  "editorGutter.background": "#e8eef3",
  "editor.lineHighlightBackground": "#e0e7ee",
  "editor.lineHighlightBorder": "#c8d0d866",
  "sideBar.background": "#e8eef3",
  "sideBarSectionHeader.background": "#e4eaef",
  "sideBarTitle.foreground": "#556f83",
  "panel.background": "#e4eaef",
  "panel.border": "#8d8b84aa",
  "panelSectionHeader.background": "#e8eef3",
  "activityBar.background": "#dde4ea",
  "activityBarTop.background": "#eef2f8",
  "activityBar.foreground": "#25313a",
  "activityBar.activeBorder": "#556f83",
  "activityBar.activeBackground": "#556f8322",
  "editorGroupHeader.tabsBackground": "#e4eaef",
  "editorGroupHeader.noTabsBackground": "#e4eaef",
  "editorGroup.emptyBackground": "#e8eef3",
  "statusBar.background": "#e4eaef",
  "titleBar.activeBackground": "#eef2f8",
  "titleBar.inactiveBackground": "#e4eaef",
  "tab.activeBackground": "#eef2f8",
  "tab.inactiveBackground": "#e4eaef",
  "tab.unfocusedActiveBackground": "#e8eef5",
  "breadcrumb.background": "#eef2f8",
  "breadcrumbPicker.background": "#eef2f8",
  "focusBorder": "#556f83a6",
  "panelTitle.activeBorder": "#556f83cc",
  "panelTitle.border": "#8d8b8499",
  "panelTitle.activeForeground": "#25313a",
  "terminal.tab.activeBorder": "#556f83",
  "editorCursor.foreground": "#556f83",
  "editorCursor.background": "#edf1f5",
  "editor.findMatchBackground": "#b59a6a88",
  "editor.findMatchForeground": "#ffffff",
  "editor.findMatchBorder": "#9a846055",
  "editor.findMatchHighlightBackground": "#556f8330",
  "editor.findMatchHighlightBorder": "#556f8344",
  "editor.linkedEditingBackground": "#7a889833",
  "editor.symbolHighlightBackground": "#7a889822",
  "editor.symbolHighlightBorder": "#7a889833",
  "editor.wordHighlightTextBackground": "#7a889818",
  "editor.wordHighlightTextBorder": "#7a88982a",
  "editorBracketHighlight.foreground1": "#556f83",
  "editorBracketHighlight.foreground2": "#8a7344",
  "editorBracketHighlight.foreground3": "#7a8898",
  "editorBracketHighlight.foreground4": "#a67c52",
  "editorBracketHighlight.foreground5": "#4a7a62",
  "editorBracketHighlight.foreground6": "#9a8448",
  "button.background": "#6a8aa8ff",
  "button.hoverBackground": "#7a9ab8ff",
  "button.secondaryBackground": "#b59a6a22",
  "button.secondaryHoverBackground": "#b59a6a33",
  "badge.background": "#556f83aa",
  "textLink.foreground": "#4e738c",
  "textLink.activeForeground": "#3e5565",
  "chat.slashCommandForeground": "#3e5565",
  "chat.requestBorder": "#556f8344",
  "list.hoverBackground": "#556f8322",
  "list.focusBackground": "#556f8328",
  "menubar.selectionBackground": "#556f8333",
  "editorSuggestWidget.background": "#ffffff",
  "editorHoverWidget.background": "#e4eaef",
  "editorStickyScroll.background": "#eef2f8",
  ...AUDIT_SETTINGS_UI,
  ...AUDIT_CHROME_UI,
  ...AUDIT_TAB_UI,
};

const AUDIT_SEMANTIC = {
  class: { foreground: "#8a7344", bold: true },
  "class.declaration": { foreground: "#8a7344", bold: true },
  interface: { foreground: "#9a8448", italic: true },
  enum: "#8a7344",
  enumMember: "#6b6080",
  struct: "#8a7344",
  type: "#4e738c",
  typeAlias: { foreground: "#4e738c", italic: true },
  typeParameter: { foreground: "#4e738c", italic: true },
  namespace: "#556f83",
  module: "#556f83",
  function: "#3e5565",
  "function.declaration": "#3e5565",
  method: "#4e738c",
  "method.declaration": "#4e738c",
  macro: "#6b6080",
  decorator: { foreground: "#a67c52", italic: true },
  variable: "#25313a",
  "variable.readonly": "#6b6080",
  "variable.defaultLibrary": "#8a7344",
  property: "#4e738c",
  "property.readonly": "#4e738c",
  parameter: "#8a6b48",
  "selfParameter": { foreground: "#4f677b", italic: true },
  keyword: "#4f677b",
  operator: "#4e738c",
  number: "#5c6b82",
  string: "#4a7a62",
  regexp: "#4f677b",
  lifetime: { foreground: "#8a6b48", italic: true },
  label: { foreground: "#8a6b48", italic: true },
  comment: { foreground: "#6b757d", italic: true },
  "*.async": { italic: true },
  "*.static": { foreground: "#6b6080", italic: true },
  "*.abstract": { italic: true },
  "*.deprecated": { strikethrough: true },
  "class.defaultLibrary": "#9a8448",
  "variable.readonly.local": "#6b6080",
  "variable.readonly.global": "#6b6080",
  "variable.readonly.member": "#7a8898",
};

/** @param {string} c */
function mapSyntaxHex(c) {
  if (typeof c !== "string" || !c.startsWith("#")) return c;
  const m = c.match(/^#([0-9a-f]{6})([0-9a-f]{2})?$/i);
  if (!m) return c;
  const rep = SYNTAX_LIGHT_TO_AUDIT[m[1].toLowerCase()];
  return rep ? `#${rep}${m[2] || ""}` : c;
}

/** @param {unknown} sem */
function remapSemantic(sem) {
  if (!sem || typeof sem !== "object") return;
  for (const [key, val] of Object.entries(sem)) {
    if (typeof val === "string") sem[key] = mapSyntaxHex(val);
    else if (val && typeof val === "object" && typeof val.foreground === "string")
      val.foreground = mapSyntaxHex(val.foreground);
  }
  Object.assign(sem, structuredClone(AUDIT_SEMANTIC));
}

/** @param {unknown} tokens */
function remapTokenColors(tokens) {
  if (!Array.isArray(tokens)) return;
  for (const block of tokens) {
    const fg = block.settings?.foreground;
    if (typeof fg === "string") block.settings.foreground = mapSyntaxHex(fg);
    const bg = block.settings?.background;
    if (typeof bg === "string") block.settings.background = mapSyntaxHex(bg);
  }
}

/** @param {unknown} theme */
function applyAuditOverrides(theme) {
  Object.assign(theme.colors, AUDIT_UI_OVERRIDES);
  theme.colors["editor.selectionForeground"] = "#25313a";
  theme.colors["menu.selectionForeground"] = "#25313a";
  theme.colors["menubar.selectionForeground"] = "#25313a";
  remapSemantic(theme.semanticTokenColors);
  remapTokenColors(theme.tokenColors);
}

function main() {
  const light = JSON.parse(fs.readFileSync(LIGHT_PATH, "utf8"));
  const colors = {};
  for (const [k, v] of Object.entries(light.colors || {})) {
    colors[k] = typeof v === "string" ? mapColor(v) : v;
  }

  const theme = {
    $schema: "vscode://schemas/color-theme",
    name: "Dusk Office Audit",
    type: "light",
    include: "./dusk-light.json",
    colors,
    tokenColors: structuredClone(light.tokenColors),
    semanticTokenColors: structuredClone(light.semanticTokenColors),
  };

  applyAuditOverrides(theme);
  normalizeLightSyntax(theme);
  applyLightTerminalAnsi(theme.colors);
  Object.assign(theme.colors, AUDIT_CHROME_FINAL);

  fs.writeFileSync(OUT_PATH, JSON.stringify(theme, null, 2) + "\n", "utf8");
  console.log("OK", OUT_PATH, Object.keys(theme.colors).length, "couleurs");
}

main();
