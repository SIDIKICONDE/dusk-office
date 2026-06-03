/**
 * Extrait une palette portable (workbench complet + éditeur + terminal + syntaxe) depuis un thème VS Code résolu.
 */
import {
  buildStructuredUi,
  normalizeWorkbenchColors,
  uiGet,
} from "./theme-export-ui.mjs";
import { remapLightSyntaxForeground } from "../../scripts/fix-light-syntax.mjs";

/** @typedef {{ scope?: string | string[]; settings?: { foreground?: string; background?: string; fontStyle?: string } }} TokenColorRule */

/** @typedef {{
 *   slug: string;
 *   name: string;
 *   type: 'dark' | 'light';
 *   editor: { background: string; foreground: string; cursor?: string; selection?: string; lineHighlight?: string };
 *   ui: { accent?: string; border?: string; panel?: string };
 *   workbench: Record<string, string>;
 *   workbenchUi: Record<string, Record<string, string>>;
 *   terminal: { background: string; foreground: string; ansi: Record<string, string> };
 *   syntax: Record<string, string>;
 *   codeLens?: string;
 * }} ExportPalette */

const ANSI_KEYS = [
  "black",
  "red",
  "green",
  "yellow",
  "blue",
  "magenta",
  "cyan",
  "white",
  "brightBlack",
  "brightRed",
  "brightGreen",
  "brightYellow",
  "brightBlue",
  "brightMagenta",
  "brightCyan",
  "brightWhite",
];

/** Dernière règle tokenColors qui matche un scope cible (comportement proche VS Code). */
const SYNTAX_SCOPE_TARGETS = [
  ["comment", ["comment", "punctuation.definition.comment"]],
  ["string", ["string", "string.quoted"]],
  ["keyword", ["keyword", "storage.type", "storage.modifier"]],
  ["function", ["entity.name.function", "support.function", "meta.function"]],
  ["type", ["entity.name.type", "support.type", "storage.type"]],
  ["variable", ["variable", "variable.other"]],
  ["constant", ["constant", "constant.numeric", "constant.language"]],
  ["number", ["constant.numeric"]],
  ["boolean", ["constant.language.boolean"]],
  ["operator", ["keyword.operator"]],
  ["punctuation", ["punctuation", "punctuation.separator"]],
  ["tag", ["entity.name.tag", "meta.tag"]],
  ["attribute", ["entity.other.attribute-name"]],
  ["property", ["variable.other.property", "constant.other.key"]],
  ["component", ["support.class.component", "entity.name.function.component"]],
  ["jsxTag", ["punctuation.definition.tag.jsx", "punctuation.definition.tag.tsx", "meta.tag.jsx", "meta.tag.tsx"]],
  ["error", ["invalid", "invalid.illegal"]],
];

/**
 * @param {string} hex
 * @returns {string}
 */
export function solidHex(hex) {
  if (typeof hex !== "string" || !hex.startsWith("#")) return hex;
  if (hex.length === 9) return `#${hex.slice(1, 7)}`;
  if (hex.length === 5) return `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
  return hex.length === 7 ? hex : hex;
}

/**
 * @param {TokenColorRule[]} tokenColors
 * @param {string[]} targets
 * @returns {string | undefined}
 */
export function colorForScopes(tokenColors, targets) {
  let found;
  for (const rule of tokenColors) {
    const scopes = rule.scope
      ? Array.isArray(rule.scope)
        ? rule.scope
        : [rule.scope]
      : [];
    const fg = rule.settings?.foreground;
    if (!fg || typeof fg !== "string") continue;
    for (const scope of scopes) {
      for (const target of targets) {
        if (
          scope === target ||
          scope.startsWith(`${target}.`) ||
          target.startsWith(`${scope}.`)
        ) {
          found = solidHex(fg);
        }
      }
    }
  }
  return found;
}

/**
 * @param {Record<string, string>} colors
 * @param {string} key
 * @param {string} fallback
 */
function pick(colors, key, fallback) {
  const v = colors[key];
  return typeof v === "string" ? solidHex(v) : fallback;
}

/**
 * @param {{
 *   slug: string;
 *   name: string;
 *   type: 'dark' | 'light';
 *   colors: Record<string, string>;
 *   tokenColors: TokenColorRule[];
 * }} theme
 * @returns {ExportPalette}
 */
export function buildExportPalette(theme) {
  const { colors, tokenColors, slug, name, type } = theme;
  const workbench = normalizeWorkbenchColors(colors);
  const workbenchUi = buildStructuredUi(workbench);
  const editorBg = pick(colors, "editor.background", type === "light" ? "#f8f6f2" : "#020304");
  const editorFg = pick(colors, "editor.foreground", type === "light" ? "#1a1a1a" : "#d1e0e8");
  const termBg = pick(
    colors,
    "terminal.background",
    pick(colors, "panel.background", editorBg),
  );
  const termFg = pick(colors, "terminal.foreground", editorFg);

  /** @type {Record<string, string>} */
  const syntax = {};
  for (const [key, targets] of SYNTAX_SCOPE_TARGETS) {
    const c =
      colorForScopes(tokenColors, targets) ??
      fallbackSyntax(key, editorFg, editorBg, type);
    syntax[key] = c;
  }

  if (type === "light") {
    for (const key of Object.keys(syntax)) {
      syntax[key] = remapLightSyntaxForeground(syntax[key], editorFg);
    }
  }

  const codeLens = solidHex(
    pick(
      colors,
      "editorCodeLens.foreground",
      type === "light" ? "#475569" : syntax.comment ?? editorFg,
    ),
  );

  /** @type {Record<string, string>} */
  const ansi = {};
  for (const key of ANSI_KEYS) {
    const vscodeKey =
      key === "brightBlack"
        ? "terminal.ansiBrightBlack"
        : key.startsWith("bright")
          ? `terminal.ansiBright${key.slice(6)}`
          : `terminal.ansi${key.charAt(0).toUpperCase()}${key.slice(1)}`;
    const v = colors[vscodeKey];
    if (typeof v === "string") ansi[key] = solidHex(v);
  }

  return {
    slug,
    name,
    type,
    editor: {
      background: editorBg,
      foreground: editorFg,
      cursor: pick(colors, "editorCursor.foreground", editorFg),
      selection: pick(colors, "editor.selectionBackground", editorBg),
      lineHighlight: pick(colors, "editor.lineHighlightBackground", editorBg),
    },
    ui: {
      accent: uiGet(workbenchUi, "focusBorder", pick(colors, "focusBorder", editorFg)),
      border: uiGet(workbenchUi, "sideBar.border", pick(colors, "sideBar.border", editorBg)),
      panel: uiGet(workbenchUi, "panel.background", pick(colors, "panel.background", editorBg)),
      sidebar: uiGet(workbenchUi, "sideBar.background", editorBg),
      activityBar: uiGet(workbenchUi, "activityBar.background", editorBg),
      statusBar: uiGet(workbenchUi, "statusBar.background", editorBg),
      titleBar: uiGet(workbenchUi, "titleBar.activeBackground", editorBg),
      tabActive: uiGet(workbenchUi, "tab.activeBackground", editorBg),
      tabInactive: uiGet(workbenchUi, "tab.inactiveBackground", editorBg),
    },
    workbench,
    workbenchUi,
    terminal: {
      background: termBg,
      foreground: termFg,
      ansi,
    },
    syntax,
    codeLens,
  };
}

/**
 * @param {string} role
 * @param {string} fg
 * @param {string} bg
 * @param {'dark' | 'light'} type
 */
function fallbackSyntax(role, fg, bg, type) {
  const dark = type === "dark";
  const table = dark
    ? {
        comment: "#9ccae0",
        string: "#7aa88a",
        keyword: "#a86878",
        function: "#7ab0c8",
        type: "#b89040",
        variable: fg,
        constant: "#9a8ab0",
        number: "#9a8ab0",
        boolean: "#9a8ab0",
        operator: "#7ab0c8",
        punctuation: fg,
        tag: "#a86878",
        attribute: "#c08060",
        property: "#6a9ab8",
        component: "#b89040",
        jsxTag: "#a86878",
        error: "#c97565",
      }
    : {
        comment: "#64748b",
        string: "#15803d",
        keyword: "#b45309",
        function: "#0369a1",
        type: "#a16207",
        variable: fg,
        constant: "#7c3aed",
        number: "#7c3aed",
        boolean: "#7c3aed",
        operator: "#0369a1",
        punctuation: fg,
        tag: "#b45309",
        attribute: "#c2410c",
        property: "#0369a1",
        component: "#a16207",
        jsxTag: "#b45309",
        error: "#dc2626",
      };
  return table[role] ?? fg;
}
