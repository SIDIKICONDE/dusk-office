/**
 * Workbench UI structuré + conversions vers les clés Zed / Neovim / Helix.
 */
import { solidHex } from "./theme-export-palette.mjs";

/** Regroupe les clés VS Code workbench par zone UI. */
export const UI_GROUPS = {
  activityBar: [
    "activityBar.background",
    "activityBar.foreground",
    "activityBar.border",
    "activityBar.activeBorder",
    "activityBar.activeBackground",
    "activityBar.activeFocusBorder",
    "activityBar.inactiveForeground",
    "activityBarBadge.background",
    "activityBarBadge.foreground",
    "activityBarTop.background",
    "activityBarTop.foreground",
    "activityBarTop.inactiveForeground",
  ],
  sideBar: [
    "sideBar.background",
    "sideBar.foreground",
    "sideBar.border",
    "sideBarTitle.foreground",
    "sideBarSectionHeader.background",
    "sideBarSectionHeader.foreground",
    "sideBarSectionHeader.border",
    "sideBar.dropBackground",
  ],
  statusBar: [
    "statusBar.background",
    "statusBar.foreground",
    "statusBar.border",
    "statusBar.debuggingBackground",
    "statusBar.debuggingForeground",
    "statusBar.noFolderBackground",
    "statusBar.noFolderForeground",
    "statusBarItem.activeBackground",
    "statusBarItem.hoverBackground",
    "statusBarItem.prominentBackground",
    "statusBarItem.remoteBackground",
    "statusBarItem.remoteForeground",
    "statusBarItem.errorBackground",
    "statusBarItem.warningBackground",
  ],
  titleBar: [
    "titleBar.activeBackground",
    "titleBar.activeForeground",
    "titleBar.inactiveBackground",
    "titleBar.inactiveForeground",
    "titleBar.border",
  ],
  tabs: [
    "tab.activeBackground",
    "tab.activeForeground",
    "tab.activeBorder",
    "tab.activeBorderTop",
    "tab.inactiveBackground",
    "tab.inactiveForeground",
    "tab.border",
    "tab.hoverBackground",
    "tab.hoverForeground",
    "tab.unfocusedActiveBackground",
    "tab.unfocusedActiveForeground",
    "tab.unfocusedInactiveBackground",
    "tab.unfocusedInactiveForeground",
    "editorGroupHeader.tabsBackground",
    "editorGroupHeader.noTabsBackground",
    "editorGroupHeader.border",
    "editorGroup.border",
    "editorGroup.emptyBackground",
  ],
  panel: [
    "panel.background",
    "panel.border",
    "panelTitle.activeForeground",
    "panelTitle.inactiveForeground",
    "panelTitle.activeBorder",
    "panelSectionHeader.background",
    "panelSectionHeader.foreground",
    "panelSectionHeader.border",
    "panelSection.dropBackground",
  ],
  editorChrome: [
    "editorGutter.background",
    "editorGutter.modifiedBackground",
    "editorGutter.addedBackground",
    "editorGutter.deletedBackground",
    "editorLineNumber.foreground",
    "editorLineNumber.activeForeground",
    "editorLineNumber.dimForeground",
    "editorIndentGuide.background1",
    "editorIndentGuide.activeBackground1",
    "editorBracketHighlight.foreground1",
    "editorBracketHighlight.foreground2",
    "editorBracketHighlight.foreground3",
    "editorBracketHighlight.foreground4",
    "editorBracketHighlight.foreground5",
    "editorBracketHighlight.foreground6",
    "editorWidget.background",
    "editorWidget.foreground",
    "editorWidget.border",
    "editorSuggestWidget.background",
    "editorSuggestWidget.foreground",
    "editorSuggestWidget.border",
    "editorSuggestWidget.selectedBackground",
    "editorHoverWidget.background",
    "editorHoverWidget.foreground",
    "editorHoverWidget.border",
    "peekView.border",
    "peekViewEditor.background",
    "peekViewTitle.background",
  ],
  input: [
    "input.background",
    "input.foreground",
    "input.border",
    "input.placeholderForeground",
    "inputOption.activeBackground",
    "inputOption.activeForeground",
    "inputOption.activeBorder",
    "dropdown.background",
    "dropdown.foreground",
    "dropdown.border",
    "checkbox.background",
    "checkbox.foreground",
    "checkbox.border",
  ],
  button: [
    "button.background",
    "button.foreground",
    "button.border",
    "button.hoverBackground",
    "button.secondaryBackground",
    "button.secondaryForeground",
    "button.secondaryHoverBackground",
  ],
  list: [
    "list.activeSelectionBackground",
    "list.activeSelectionForeground",
    "list.inactiveSelectionBackground",
    "list.hoverBackground",
    "list.hoverForeground",
    "list.focusBackground",
    "list.focusForeground",
    "list.highlightForeground",
    "list.dropBackground",
    "list.filterMatchBackground",
    "tree.indentGuidesStroke",
    "tree.inactiveIndentGuidesStroke",
  ],
  menu: [
    "menu.background",
    "menu.foreground",
    "menu.border",
    "menu.selectionBackground",
    "menu.selectionForeground",
    "menu.separatorBackground",
    "menubar.selectionBackground",
    "menubar.selectionForeground",
  ],
  notification: [
    "notifications.background",
    "notifications.foreground",
    "notifications.border",
    "notificationCenter.border",
    "notificationCenterHeader.background",
    "notificationCenterHeader.foreground",
    "notificationToast.border",
  ],
  scrollbar: [
    "scrollbar.shadow",
    "scrollbarSlider.background",
    "scrollbarSlider.hoverBackground",
    "scrollbarSlider.activeBackground",
  ],
  breadcrumb: [
    "breadcrumb.background",
    "breadcrumb.foreground",
    "breadcrumb.focusForeground",
    "breadcrumb.activeSelectionForeground",
    "breadcrumbPicker.background",
  ],
  git: [
    "gitDecoration.addedResourceForeground",
    "gitDecoration.modifiedResourceForeground",
    "gitDecoration.deletedResourceForeground",
    "gitDecoration.renamedResourceForeground",
    "gitDecoration.ignoredResourceForeground",
    "gitDecoration.conflictingResourceForeground",
    "gitDecoration.stageDeletedResourceForeground",
    "gitDecoration.stageModifiedResourceForeground",
    "gitDecoration.submoduleResourceForeground",
    "gitDecoration.untrackedResourceForeground",
  ],
  diff: [
    "diffEditor.insertedLineBackground",
    "diffEditor.removedLineBackground",
    "diffEditor.insertedTextBackground",
    "diffEditor.removedTextBackground",
    "diffEditor.border",
    "diffEditor.diagonalFill",
  ],
  terminalUi: [
    "terminal.border",
    "terminal.selectionBackground",
    "terminalCursor.foreground",
    "terminalCursor.background",
  ],
  global: [
    "focusBorder",
    "foreground",
    "descriptionForeground",
    "icon.foreground",
    "widget.border",
    "widget.shadow",
    "selection.background",
    "sash.hoverBorder",
    "progressBar.background",
    "badge.background",
    "badge.foreground",
  ],
};

/** Clés Zed Theme v0.2 (sous-ensemble + correspondance directe possible). */
const ZED_STYLE_KEYS = new Set([
  "background",
  "text",
  "text.muted",
  "text.accent",
  "text.disabled",
  "text.placeholder",
  "border",
  "border.variant",
  "border.focused",
  "border.selected",
  "border.disabled",
  "border.transparent",
  "icon",
  "icon.muted",
  "icon.disabled",
  "icon.placeholder",
  "icon.accent",
  "toolbar.background",
  "title_bar.background",
  "title_bar.inactive_background",
  "status_bar.background",
  "tab_bar.background",
  "tab.active_background",
  "tab.inactive_background",
  "panel.background",
  "panel.focused_border",
  "surface.background",
  "elevated_surface.background",
  "element.background",
  "element.hover",
  "element.active",
  "element.selected",
  "element.disabled",
  "ghost_element.background",
  "ghost_element.hover",
  "ghost_element.active",
  "ghost_element.selected",
  "ghost_element.disabled",
  "scrollbar.thumb.background",
  "scrollbar.thumb.hover_background",
  "scrollbar.thumb.border",
  "scrollbar.track.background",
  "scrollbar.track.border",
  "pane_group.border",
  "pane.focused_border",
  "drop_target.background",
  "error",
  "error.background",
  "error.border",
  "warning",
  "warning.background",
  "warning.border",
  "info",
  "info.background",
  "info.border",
  "success",
  "success.background",
  "success.border",
  "created",
  "created.background",
  "modified",
  "modified.background",
  "deleted",
  "deleted.background",
  "conflict",
  "conflict.background",
  "editor.background",
  "editor.foreground",
  "editor.gutter.background",
  "editor.active_line.background",
  "editor.highlighted_line.background",
  "editor.line_number",
  "editor.active_line_number",
  "editor.invisible",
  "editor.wrap_guide",
  "editor.active_wrap_guide",
  "editor.indent_guide",
  "editor.indent_guide_active",
  "editor.subheader.background",
  "terminal.background",
  "terminal.foreground",
  "terminal.bright_foreground",
  "terminal.dim_foreground",
  "terminal.ansi.black",
  "terminal.ansi.red",
  "terminal.ansi.green",
  "terminal.ansi.yellow",
  "terminal.ansi.blue",
  "terminal.ansi.magenta",
  "terminal.ansi.cyan",
  "terminal.ansi.white",
  "terminal.ansi.bright_black",
  "terminal.ansi.bright_red",
  "terminal.ansi.bright_green",
  "terminal.ansi.bright_yellow",
  "terminal.ansi.bright_blue",
  "terminal.ansi.bright_magenta",
  "terminal.ansi.bright_cyan",
  "terminal.ansi.bright_white",
]);

/** VS Code → Zed quand les noms ne correspondent pas. */
const VSCODE_TO_ZED_OVERRIDE = {
  "activityBar.background": "toolbar.background",
  "activityBar.foreground": "text.muted",
  "sideBar.background": "surface.background",
  "sideBar.foreground": "text",
  "sideBar.border": "border.variant",
  "statusBar.background": "status_bar.background",
  "statusBar.foreground": "text",
  "titleBar.activeBackground": "title_bar.background",
  "titleBar.inactiveBackground": "title_bar.inactive_background",
  "tab.activeBackground": "tab.active_background",
  "tab.inactiveBackground": "tab.inactive_background",
  "editorGroupHeader.tabsBackground": "tab_bar.background",
  "panel.background": "panel.background",
  "panel.border": "panel.focused_border",
  "focusBorder": "border.focused",
  "descriptionForeground": "text.muted",
  "icon.foreground": "icon",
  "widget.border": "border.variant",
  "scrollbarSlider.background": "scrollbar.thumb.background",
  "scrollbarSlider.hoverBackground": "scrollbar.thumb.hover_background",
  "scrollbarSlider.activeBackground": "scrollbar.thumb.hover_background",
  "list.activeSelectionBackground": "element.selected",
  "list.hoverBackground": "element.hover",
  "menu.background": "elevated_surface.background",
  "menu.selectionBackground": "element.selected",
  "input.background": "element.background",
  "button.background": "element.background",
  "button.hoverBackground": "element.hover",
  "editorError.foreground": "error",
  "editorWarning.foreground": "warning",
  "editorInfo.foreground": "info",
  "editorGutter.addedBackground": "created.background",
  "editorGutter.modifiedBackground": "modified.background",
  "editorGutter.deletedBackground": "deleted.background",
  "gitDecoration.addedResourceForeground": "created",
  "gitDecoration.modifiedResourceForeground": "modified",
  "gitDecoration.deletedResourceForeground": "deleted",
  "gitDecoration.conflictingResourceForeground": "conflict",
};

/**
 * @param {Record<string, string>} colors
 * @returns {Record<string, string>}
 */
export function normalizeWorkbenchColors(colors) {
  /** @type {Record<string, string>} */
  const out = {};
  for (const [k, v] of Object.entries(colors)) {
    if (typeof v === "string") out[k] = solidHex(v);
  }
  return out;
}

/**
 * @param {Record<string, string>} colors
 */
export function buildStructuredUi(colors) {
  /** @type {Record<string, Record<string, string>>} */
  const ui = {};
  for (const [group, keys] of Object.entries(UI_GROUPS)) {
    /** @type {Record<string, string>} */
    const section = {};
    for (const key of keys) {
      if (typeof colors[key] === "string") {
        section[key] = colors[key];
      }
    }
    if (Object.keys(section).length > 0) ui[group] = section;
  }
  return ui;
}

/**
 * camelCase → snake_case (editor.lineHighlightBackground → editor.line_highlight_background)
 * @param {string} key
 */
export function vscodeKeyToZedKey(key) {
  return key.replace(/([A-Z])/g, "_$1").toLowerCase();
}

/**
 * terminal.ansiBrightRed → terminal.ansi.bright_red
 * @param {string} key
 */
export function vscodeTerminalKeyToZed(key) {
  if (key === "terminal.background" || key === "terminal.foreground") return key;
  const bright = key.match(/^terminal\.ansiBright([A-Z][a-z]+)$/);
  if (bright) return `terminal.ansi.bright_${bright[1].toLowerCase()}`;
  const norm = key.match(/^terminal\.ansi([A-Z][a-z]+)$/);
  if (norm) return `terminal.ansi.${norm[1].toLowerCase()}`;
  return null;
}

/**
 * @param {Record<string, string>} workbench
 * @returns {Record<string, string>}
 */
export function mapWorkbenchToZedStyle(workbench) {
  /** @type {Record<string, string>} */
  const style = {};

  const set = (zedKey, value) => {
    if (value && ZED_STYLE_KEYS.has(zedKey) && !style[zedKey]) {
      style[zedKey] = value;
    }
  };

  for (const [vscodeKey, value] of Object.entries(workbench)) {
    if (VSCODE_TO_ZED_OVERRIDE[vscodeKey]) {
      set(VSCODE_TO_ZED_OVERRIDE[vscodeKey], value);
    }
    const termZed = vscodeTerminalKeyToZed(vscodeKey);
    if (termZed) set(termZed, value);

    const snake = vscodeKeyToZedKey(vscodeKey);
    set(snake, value);
  }

  if (!style.background && workbench["editor.background"]) {
    style.background = workbench["editor.background"];
  }
  if (!style.text && workbench["editor.foreground"]) {
    style.text = workbench["editor.foreground"];
  }

  return style;
}

/**
 * @param {Record<string, Record<string, string>>} structured
 * @param {string} key
 * @param {string} [fallback]
 */
export function uiGet(structured, key, fallback = "") {
  for (const section of Object.values(structured)) {
    if (section[key]) return section[key];
  }
  return fallback;
}

/** @param {string} hex */
function hexRgb6(hex) {
  const h = String(hex).replace(/^#/, "").slice(0, 6);
  if (h.length !== 6) return null;
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

/** Mélange deux couleurs #RRGGBB (t=1 → b). */
export function mixHexRgb(a, b, t) {
  const ca = hexRgb6(a);
  const cb = hexRgb6(b);
  if (!ca || !cb || t <= 0) return a;
  if (t >= 1) return `#${b.replace(/^#/, "").slice(0, 6)}`;
  const h = (n) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, "0");
  const r = Math.round(ca.r * (1 - t) + cb.r * t);
  const g = Math.round(ca.g * (1 - t) + cb.g * t);
  const bl = Math.round(ca.b * (1 - t) + cb.b * t);
  return `#${h(r)}${h(g)}${h(bl)}`;
}

/**
 * Bordures / guides JetBrains moins agressifs (rapprochés du fond).
 * @param {string} fg
 * @param {string} bg
 * @param {{ slug?: string; dark?: boolean; strength?: 'chrome' | 'guide' | 'whitespace' }} [opts]
 */
export function softenHexTowardBg(fg, bg, opts = {}) {
  const { slug = "", dark = true, strength = "chrome" } = opts;
  const hc = /-hc$/.test(slug);
  const t = hc
    ? strength === "guide"
      ? 0.55
      : 0.5
    : strength === "guide"
      ? dark
        ? 0.88
        : 0.84
      : strength === "whitespace"
        ? dark
          ? 0.8
          : 0.76
        : dark
          ? 0.78
          : 0.72;
  return mixHexRgb(fg, bg, t);
}
