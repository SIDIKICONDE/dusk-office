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
 * @param {string} hex
 * @returns {{ r: number; g: number; b: number } | null}
 */
function hexRgb(hex) {
  if (typeof hex !== "string" || !hex.startsWith("#")) return null;
  let h = hex.slice(1);
  if (h.length === 3 || h.length === 4) {
    h = `${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`;
  } else {
    h = h.slice(0, 6);
  }
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

/**
 * @param {string} hex
 * @returns {number}
 */
function hexAlpha(hex) {
  if (typeof hex !== "string" || !hex.startsWith("#")) return 1;
  if (hex.length === 9) return parseInt(hex.slice(7, 9), 16) / 255;
  if (hex.length === 5) return parseInt(`${hex[4]}${hex[4]}`, 16) / 255;
  return 1;
}

/**
 * Bake a translucent #RRGGBBAA (or #RGBA) onto an opaque background.
 * JetBrains schemes have no alpha — flattening `#c9a22744` → `#c9a227` kills contrast.
 *
 * @param {string} fg
 * @param {string} bg
 * @returns {string}
 */
export function composeHexOnBackground(fg, bg) {
  const alpha = hexAlpha(fg);
  if (!(alpha < 1)) return solidHex(fg);
  const c = hexRgb(fg);
  const b = hexRgb(bg);
  if (!c || !b) return solidHex(fg);
  const h = (n) =>
    Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return `#${h(c.r * alpha + b.r * (1 - alpha))}${h(c.g * alpha + b.g * (1 - alpha))}${h(c.b * alpha + b.b * (1 - alpha))}`;
}

/**
 * Descendants that belong to another syntax role must not steal the base color.
 * `keyword.operator.*` is the operator role; `string.regexp` is not a string.
 *
 * @param {string} scope
 * @param {string} target
 */
function scopeBlockedForTarget(scope, target) {
  if (
    target === "keyword" &&
    (scope === "keyword.operator" || scope.startsWith("keyword.operator."))
  ) {
    return true;
  }
  if (
    (target === "string" || target === "string.quoted") &&
    (scope === "string.regexp" || scope.startsWith("string.regexp."))
  ) {
    return true;
  }
  return false;
}

/**
 * Last TextMate rule that applies to a target (exact, ancestor, or descendant),
 * excluding sibling-role descendants such as `keyword.operator` / `string.regexp`.
 *
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
        if (scopeBlockedForTarget(scope, target)) continue;
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
 * @param {Record<string, unknown> | undefined} semantic
 * @param {string} role
 * @returns {string | undefined}
 */
export function colorFromSemantic(semantic, role) {
  if (!semantic || typeof semantic !== "object") return undefined;
  const v = semantic[role];
  const hex = typeof v === "string" ? v : v && typeof v === "object" ? v.foreground : undefined;
  return typeof hex === "string" && hex.startsWith("#") ? solidHex(hex) : undefined;
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
 *   semanticTokenColors?: Record<string, unknown>;
 * }} theme
 * @returns {ExportPalette}
 */
export function buildExportPalette(theme) {
  const { colors, tokenColors, slug, name, type, semanticTokenColors } = theme;
  const workbench = normalizeWorkbenchColors(colors);
  const editorBg = pick(colors, "editor.background", type === "light" ? "#f8f6f2" : "#020304");
  const editorFg = pick(colors, "editor.foreground", type === "light" ? "#1a1a1a" : "#d1e0e8");
  const selectionRaw = colors["editor.selectionBackground"];
  const selection =
    typeof selectionRaw === "string"
      ? composeHexOnBackground(selectionRaw, editorBg)
      : editorBg;
  workbench["editor.selectionBackground"] = selection;
  const workbenchUi = buildStructuredUi(workbench);
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
      colorFromSemantic(semanticTokenColors, key) ??
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
      selection,
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
