/**
 * Pure (filesystem-free) theme helpers shared by the Theme Gallery preview and
 * the editor/UI contrast checker: TextMate scope matching, token-color lookup,
 * and the compact preview model. Because this module avoids `fs`/`path`, it
 * bundles cleanly into the web extension host. The Node-only include-chain
 * flattening lives in theme-merge-data.js (scripts/tests/build), and the runtime
 * reads pre-merged data from lib/generated/themes-bundle.js.
 */

/** True when a single TextMate scope selector applies to `target`. */
function selectorMatches(selector, target) {
  if (typeof selector !== "string") return false;
  return selector
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .some((part) => target === part || target.startsWith(`${part}.`));
}

/** True when a tokenColor rule's `scope` (string or array) applies to `target`. */
function scopeMatches(ruleScope, target) {
  if (Array.isArray(ruleScope)) return ruleScope.some((s) => selectorMatches(s, target));
  return selectorMatches(ruleScope, target);
}

/**
 * Resolve the effective foreground color for a TextMate scope. Later matching
 * rules win (most-specific variant overrides), mirroring how these themes are
 * authored (general scopes first, refinements last).
 *
 * @param {Array<object>} tokenColors flattened tokenColors
 * @param {string} scope e.g. "comment", "string", "entity.name.function"
 * @returns {string|null} hex color or null
 */
function tokenColorForScope(tokenColors, scope) {
  if (!Array.isArray(tokenColors)) return null;
  let found = null;
  for (const rule of tokenColors) {
    const fg = rule?.settings?.foreground;
    if (typeof fg === "string" && scopeMatches(rule.scope, scope)) {
      found = fg;
    }
  }
  return found;
}

/** Representative scopes surfaced in the preview card and contrast report. */
const PREVIEW_SCOPES = [
  ["comment", "comment"],
  ["string", "string"],
  ["keyword", "keyword"],
  ["function", "entity.name.function"],
  ["type", "entity.name.type"],
  ["number", "constant.numeric"],
  ["variable", "variable"],
];

/**
 * Compact, render-ready summary of a theme for the gallery card. All values are
 * hex strings (or undefined when the theme omits a key).
 *
 * @param {{type:string|undefined, colors:Record<string,string>, tokenColors:Array<object>}} themeData
 */
function buildThemePreviewModel(themeData) {
  const colors = themeData.colors || {};
  const isLight = themeData.type === "light";
  const pick = (...candidateKeys) => {
    for (const key of candidateKeys) {
      if (typeof colors[key] === "string") return colors[key];
    }
    return undefined;
  };

  const editorBackground = pick("editor.background") || (isLight ? "#ffffff" : "#1e1e1e");
  const editorForeground = pick("editor.foreground", "foreground") || (isLight ? "#1a1a1a" : "#d4d4d4");

  const tokens = {};
  for (const [name, scope] of PREVIEW_SCOPES) {
    tokens[name] = tokenColorForScope(themeData.tokenColors, scope) || editorForeground;
  }

  const terminalAnsi = [
    "terminal.ansiRed",
    "terminal.ansiYellow",
    "terminal.ansiGreen",
    "terminal.ansiCyan",
    "terminal.ansiBlue",
    "terminal.ansiMagenta",
  ]
    .map((key) => colors[key])
    .filter((value) => typeof value === "string");

  return {
    type: themeData.type || (isLight ? "light" : "dark"),
    editorBackground,
    editorForeground,
    accent: pick("focusBorder", "button.background", "activityBarBadge.background", "textLink.foreground"),
    titleBarBackground: pick("titleBar.activeBackground", "editorGroupHeader.tabsBackground", "editor.background"),
    activityBarBackground: pick("activityBar.background", "editor.background"),
    sideBarBackground: pick("sideBar.background", "editor.background"),
    statusBarBackground: pick("statusBar.background"),
    statusBarForeground: pick("statusBar.foreground"),
    lineHighlight: pick("editor.lineHighlightBackground"),
    selectionBackground: pick("editor.selectionBackground"),
    tokens,
    terminalAnsi,
  };
}

module.exports = {
  selectorMatches,
  scopeMatches,
  tokenColorForScope,
  PREVIEW_SCOPES,
  buildThemePreviewModel,
};
