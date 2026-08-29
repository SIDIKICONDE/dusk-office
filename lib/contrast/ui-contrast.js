const {
  luminance,
  contrastRatio,
  parseColor,
  composite,
  effectiveForegroundRgb,
} = require("../terminal/terminal-contrast.js");
const { tokenColorForScope, PREVIEW_SCOPES } = require("../themes/theme-data.js");

/**
 * Editor & workbench contrast checker — the UI counterpart to the terminal
 * contrast check in lib/terminal/terminal-contrast.js. It scores readable
 * foreground/background pairs across the editor, syntax tokens, and the main
 * workbench chrome against WCAG thresholds, reusing the exact same luminance and
 * contrast-ratio math so terminal and UI reports never disagree.
 */

/** WCAG 2.1 AA: 4.5:1 for normal text, 3:1 for large text and UI components. */
const MIN_TEXT_RATIO = 4.5;
const MIN_UI_RATIO = 3.0;
/**
 * Syntax tokens (comments, strings, keywords…) use a 3:1 readability floor
 * rather than the 4.5:1 body-text bar. This keeps deliberately dimmed comments
 * legible without flattening the curated "eye-comfort" palette.
 */
const MIN_SYNTAX_RATIO = 3.0;

/**
 * Foreground/background workbench pairs to score.
 * @type {Array<[label:string, fgKey:string, bgKey:string, min:number]>}
 */
const UI_PAIRS = [
  // Normal text — WCAG AA 4.5:1.
  ["Editor text", "editor.foreground", "editor.background", MIN_TEXT_RATIO],
  ["Side bar text", "sideBar.foreground", "sideBar.background", MIN_TEXT_RATIO],
  ["Status bar text", "statusBar.foreground", "statusBar.background", MIN_TEXT_RATIO],
  ["Title bar text", "titleBar.activeForeground", "titleBar.activeBackground", MIN_TEXT_RATIO],
  ["Active tab text", "tab.activeForeground", "tab.activeBackground", MIN_TEXT_RATIO],
  ["Input text", "input.foreground", "input.background", MIN_TEXT_RATIO],
  ["List selection text", "list.activeSelectionForeground", "list.activeSelectionBackground", MIN_TEXT_RATIO],
  ["Notification text", "notifications.foreground", "notifications.background", MIN_TEXT_RATIO],
  // UI components / large text / signal glyphs — WCAG AA 3:1.
  ["Button text", "button.foreground", "button.background", MIN_UI_RATIO],
  ["Badge text", "badge.foreground", "badge.background", MIN_UI_RATIO],
  ["Activity bar badge", "activityBarBadge.foreground", "activityBarBadge.background", MIN_UI_RATIO],
  ["Error glyph", "editorError.foreground", "editor.background", MIN_UI_RATIO],
  ["Warning glyph", "editorWarning.foreground", "editor.background", MIN_UI_RATIO],
];

/** Light uiThemes composite alpha over white, dark/HC over black. */
function defaultUnderColor(uiTheme) {
  return uiTheme === "vs" || uiTheme === "hc-light"
    ? { r: 255, g: 255, b: 255 }
    : { r: 0, g: 0, b: 0 };
}

/**
 * Resolve a background color value to opaque RGB. When the value carries alpha,
 * it is composited over `baseRgb` (or the uiTheme default surface).
 */
function resolveBackgroundRgb(colorValue, uiTheme, baseRgb) {
  const parsed = parseColor(colorValue);
  if (!parsed) return null;
  if (parsed.alpha != null) {
    const alpha = parseInt(parsed.alpha, 16) / 255;
    return composite({ r: parsed.r, g: parsed.g, b: parsed.b }, alpha, baseRgb || defaultUnderColor(uiTheme));
  }
  return { r: parsed.r, g: parsed.g, b: parsed.b };
}

/**
 * Score every available editor/UI/syntax pair for a flattened theme.
 *
 * @param {Record<string, string | undefined>} colors flattened `colors`
 * @param {Array<object>} tokenColors flattened `tokenColors`
 * @param {string} uiTheme e.g. "vs-dark" | "vs" | "hc-black"
 * @param {{minTextRatio?:number, minUiRatio?:number, minSyntaxRatio?:number}} [options]
 * @returns {Array<{label:string, fgKey:string, bgKey:string, fg:string, bg:string, ratio:number, min:number, pass:boolean, kind:string}>}
 */
function checkUiContrast(colors, tokenColors, uiTheme, options = {}) {
  const minText = options.minTextRatio ?? MIN_TEXT_RATIO;
  const minUi = options.minUiRatio ?? MIN_UI_RATIO;
  const minSyntax = options.minSyntaxRatio ?? MIN_SYNTAX_RATIO;
  const results = [];

  const score = (label, fgKey, bgKey, fgValue, bgValue, min, kind, underRgb) => {
    const bgRgb = resolveBackgroundRgb(bgValue, uiTheme, underRgb);
    if (!bgRgb) return;
    const fgRgb = effectiveForegroundRgb(fgValue, bgRgb);
    if (!fgRgb) return;
    const ratio = contrastRatio(luminance(fgRgb), luminance(bgRgb));
    results.push({ label, fgKey, bgKey, fg: fgValue, bg: bgValue, ratio, min, pass: ratio >= min, kind });
  };

  for (const [label, fgKey, bgKey, baseMin] of UI_PAIRS) {
    const fgValue = colors[fgKey];
    const bgValue = colors[bgKey];
    if (typeof fgValue !== "string" || typeof bgValue !== "string") continue;
    const isUi = baseMin === MIN_UI_RATIO;
    score(label, fgKey, bgKey, fgValue, bgValue, isUi ? minUi : minText, isUi ? "ui" : "text");
  }

  // Syntax tokens vs the editor surface (3:1 readability floor).
  const editorBgValue = colors["editor.background"];
  const editorBgRgb = resolveBackgroundRgb(editorBgValue, uiTheme);
  if (editorBgRgb) {
    for (const [name, scope] of PREVIEW_SCOPES) {
      const fgValue = tokenColorForScope(tokenColors, scope);
      if (typeof fgValue !== "string") continue;
      score(`Syntax: ${name}`, scope, "editor.background", fgValue, editorBgValue, minSyntax, "syntax", editorBgRgb);
    }
  }

  return results;
}

/** Convenience filter: only the failing results from {@link checkUiContrast}. */
function failingUiContrast(colors, tokenColors, uiTheme, options = {}) {
  return checkUiContrast(colors, tokenColors, uiTheme, options).filter((r) => !r.pass);
}

module.exports = {
  MIN_TEXT_RATIO,
  MIN_UI_RATIO,
  MIN_SYNTAX_RATIO,
  UI_PAIRS,
  resolveBackgroundRgb,
  checkUiContrast,
  failingUiContrast,
};
