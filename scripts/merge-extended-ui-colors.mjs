#!/usr/bin/env node
/**
 * Fusionne des clés workbench étendues dans themes/dusk-*.json.
 * Les couleurs déjà présentes dans le thème gardent la priorité.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const themesDir = path.join(__dirname, "..", "themes");

/** @param {string} hex #RRGGBB @param {string} aa deux hex d'opacité */
const A = (hex, aa) => (hex.length === 7 ? hex + aa : hex);

/**
 * @typedef {object} Palette
 * @property {string} fg
 * @property {string} accent
 * @property {string} accentHi
 * @property {string} accentSoft
 * @property {string} widget
 * @property {string} panel
 * @property {string} border
 * @property {string} error
 * @property {string} warning
 * @property {string} info
 * @property {string} success
 * @property {string} inserted
 * @property {string} removed
 * @property {string} purple
 * @property {string} pink
 * @property {string} amber
 */

/** @param {Palette} p */
function buildExtended(p) {
  const {
    fg,
    accent,
    accentHi,
    accentSoft,
    widget,
    panel,
    border,
    error,
    warning,
    info,
    success,
    inserted,
    removed,
    purple,
    pink,
    amber,
  } = p;

  return {
    "descriptionForeground": A(fg, "aa"),
    "icon.foreground": A(fg, "cc"),
    "widget.border": A(border, "44"),
    "widget.shadow": "#00000066",
    "selection.background": A(accent, "44"),
    "sash.hoverBorder": A(accentHi, "44"),

    "editor.foreground": fg,
    "editorCursor.foreground": accentHi,
    "editor.selectionBackground": A(accent, "44"),
    "editor.selectionHighlightBackground": A(accentHi, "22"),
    "editor.selectionHighlightBorder": A(accentHi, "2a"),
    "editor.wordHighlightBackground": A(accent, "18"),
    "editor.wordHighlightBorder": A(accent, "2a"),
    "editor.wordHighlightStrongBackground": A(pink, "22"),
    "editor.wordHighlightStrongBorder": A(pink, "33"),
    "editor.wordHighlightTextBackground": A(purple, "18"),
    "editor.wordHighlightTextBorder": A(purple, "2a"),

    "editor.findMatchBackground": A(amber, "66"),
    "editor.findMatchHighlightBackground": A(accent, "33"),
    "editor.findRangeHighlightBackground": A(accentSoft, "55"),
    "editor.findMatchBorder": A(amber, "55"),
    "editor.findMatchHighlightBorder": A(accent, "44"),
    "editor.findRangeHighlightBorder": A(border, "44"),

    "editor.hoverHighlightBackground": A(accentHi, "18"),
    "editorLink.activeForeground": accentHi,
    "editor.foldBackground": A(accent, "12"),
    "editor.foldPlaceholderForeground": A(fg, "77"),
    "editor.linkedEditingBackground": A(purple, "33"),

    "editorBracketHighlight.foreground1": accentHi,
    "editorBracketHighlight.foreground2": info,
    "editorBracketHighlight.foreground3": purple,
    "editorBracketHighlight.foreground4": pink,
    "editorBracketHighlight.foreground5": success,
    "editorBracketHighlight.foreground6": amber,
    "editorBracketHighlight.unexpectedBracket.foreground": error,

    "editorBracketPairGuide.background1": A(accent, "33"),
    "editorBracketPairGuide.background2": A(info, "33"),
    "editorBracketPairGuide.background3": A(purple, "33"),
    "editorBracketPairGuide.background4": A(pink, "33"),
    "editorBracketPairGuide.background5": A(success, "33"),
    "editorBracketPairGuide.background6": A(amber, "33"),
    "editorBracketPairGuide.activeBackground1": A(accentHi, "44"),
    "editorBracketPairGuide.activeBackground2": A(info, "44"),
    "editorBracketPairGuide.activeBackground3": A(purple, "44"),
    "editorBracketPairGuide.activeBackground4": A(pink, "44"),
    "editorBracketPairGuide.activeBackground5": A(success, "44"),
    "editorBracketPairGuide.activeBackground6": A(amber, "44"),

    "editorStickyScroll.background": widget,
    "editorStickyScroll.border": A(border, "44"),
    "editorStickyScroll.shadow": "#00000055",
    "editorStickyScrollHover.background": A(accent, "18"),

    "editorGhostText.foreground": A(fg, "44"),
    "editorGhostText.background": "#00000000",
    "editorGhostText.border": A(accent, "22"),

    "editorWhitespace.foreground": A(fg, "18"),

    "editorInlayHint.background": A(accentSoft, "66"),
    "editorInlayHint.foreground": A(fg, "99"),
    "editorInlayHint.typeForeground": A(info, "cc"),
    "editorInlayHint.parameterForeground": A(amber, "cc"),

    "editorSuggestWidget.foreground": fg,
    "editorSuggestWidget.border": A(border, "44"),
    "editorSuggestWidget.selectedBackground": A(accent, "33"),
    "editorSuggestWidget.highlightForeground": accentHi,
    "editorHoverWidget.foreground": fg,
    "editorHoverWidget.border": A(border, "44"),

    "editorOverviewRuler.background": A(panel, "00"),
    "editorOverviewRuler.border": A(border, "22"),
    "editorOverviewRuler.findMatchForeground": A(amber, "cc"),
    "editorOverviewRuler.rangeHighlightForeground": A(accent, "aa"),
    "editorOverviewRuler.selectionHighlightForeground": A(accentHi, "aa"),
    "editorOverviewRuler.wordHighlightForeground": A(accent, "aa"),
    "editorOverviewRuler.wordHighlightStrongForeground": A(pink, "aa"),
    "editorOverviewRuler.wordHighlightTextForeground": A(purple, "aa"),
    "editorOverviewRuler.modifiedForeground": A(warning, "dd"),
    "editorOverviewRuler.addedForeground": A(inserted, "dd"),
    "editorOverviewRuler.deletedForeground": A(removed, "dd"),
    "editorOverviewRuler.errorForeground": A(error, "ee"),
    "editorOverviewRuler.warningForeground": A(warning, "ee"),
    "editorOverviewRuler.infoForeground": A(info, "ee"),
    "editorOverviewRuler.bracketMatchForeground": A(accentHi, "cc"),
    "editorOverviewRuler.inlineChatInserted": A(inserted, "aa"),
    "editorOverviewRuler.inlineChatRemoved": A(removed, "aa"),
    "editorOverviewRuler.currentContentForeground": A(warning, "cc"),
    "editorOverviewRuler.incomingContentForeground": A(info, "cc"),
    "editorOverviewRuler.commonContentForeground": A(fg, "88"),

    "minimap.findMatchHighlight": A(amber, "99"),
    "minimap.selectionHighlight": A(accent, "88"),
    "minimap.selectionOccurrenceHighlight": A(purple, "88"),
    "minimap.errorHighlight": A(error, "cc"),
    "minimap.warningHighlight": A(warning, "cc"),
    "minimap.infoHighlight": A(info, "cc"),
    "minimap.chatEditHighlight": A(inserted, "99"),
    "minimap.foregroundOpacity": "#ffffff88",

    "diffEditor.border": A(border, "44"),
    "diffEditor.insertedTextBackground": A(inserted, "22"),
    "diffEditor.insertedTextBorder": A(inserted, "2a"),
    "diffEditor.removedTextBackground": A(removed, "22"),
    "diffEditor.removedTextBorder": A(removed, "2a"),
    "diffEditor.insertedLineBackground": A(inserted, "18"),
    "diffEditor.removedLineBackground": A(removed, "18"),
        "diffEditor.move.border": A(purple, "44"),
    "diffEditor.moveActive.border": A(accentHi, "55"),

    "merge.currentHeaderBackground": A(info, "33"),
    "merge.currentContentBackground": A(info, "18"),
    "merge.incomingHeaderBackground": A(success, "33"),
    "merge.incomingContentBackground": A(success, "18"),
    "merge.commonHeaderBackground": A(fg, "22"),
    "merge.commonContentBackground": A(fg, "12"),
    "merge.border": A(border, "55"),

    "inlineChat.background": widget,
    "inlineChat.foreground": fg,
    "inlineChat.border": A(accent, "44"),
    "inlineChat.shadow": "#00000066",
    "inlineChatInput.background": panel,
    "inlineChatInput.border": A(border, "44"),
    "inlineChatInput.focusBorder": A(accentHi, "55"),
    "inlineChatInput.placeholderForeground": A(fg, "55"),
    "inlineChatDiff.inserted": A(inserted, "33"),
    "inlineChatDiff.removed": A(removed, "33"),

    "inlineEdit.gutterIndicator.background": panel,
    "inlineEdit.gutterIndicator.primaryBackground": A(accent, "33"),
    "inlineEdit.gutterIndicator.primaryForeground": accentHi,
    "inlineEdit.gutterIndicator.primaryBorder": A(accentHi, "44"),
    "inlineEdit.gutterIndicator.secondaryBackground": A(purple, "33"),
    "inlineEdit.gutterIndicator.secondaryForeground": purple,
    "inlineEdit.gutterIndicator.secondaryBorder": A(purple, "44"),
    "inlineEdit.gutterIndicator.successfulBackground": A(success, "33"),
    "inlineEdit.gutterIndicator.successfulForeground": success,
    "inlineEdit.gutterIndicator.successfulBorder": A(success, "44"),
    "inlineEdit.originalBackground": A(removed, "12"),
    "inlineEdit.modifiedBackground": A(inserted, "12"),
    "inlineEdit.originalChangedLineBackground": A(removed, "22"),
    "inlineEdit.originalChangedTextBackground": A(removed, "33"),
    "inlineEdit.modifiedChangedLineBackground": A(inserted, "22"),
    "inlineEdit.modifiedChangedTextBackground": A(inserted, "33"),
    "inlineEdit.originalBorder": A(removed, "33"),
    "inlineEdit.modifiedBorder": A(inserted, "33"),
    "inlineEdit.tabWillAcceptModifiedBorder": A(accentHi, "77"),
    "inlineEdit.tabWillAcceptOriginalBorder": A(amber, "77"),

    "tree.indentGuidesStroke": A(border, "44"),
    "tree.inactiveIndentGuidesStroke": A(border, "2a"),

    "list.activeSelectionForeground": fg,
    "list.inactiveSelectionBackground": A(accent, "18"),
    "list.inactiveSelectionForeground": fg,
    "list.focusBackground": A(accent, "22"),
    "list.focusForeground": fg,
    "list.highlightForeground": accentHi,

    "breadcrumb.foreground": A(fg, "bb"),
    "breadcrumb.focusForeground": fg,
    "breadcrumb.activeSelectionForeground": accentHi,
    "breadcrumbPicker.background": widget,

    "tab.activeForeground": fg,
    "tab.inactiveForeground": A(fg, "88"),
    "tab.activeBorder": A(accentHi, "44"),
    "tab.unfocusedActiveBorder": A(accent, "44"),
    "tab.lastPinnedBorder": A(border, "44"),

    "statusBar.foreground": A(fg, "cc"),
    "statusBar.debuggingBackground": A(error, "44"),
    "statusBarItem.hoverBackground": A(accent, "22"),
    "statusBarItem.prominentForeground": accentHi,

    "button.background": A(accent, "cc"),
    "button.foreground": "#0a0a0a",
    "button.hoverBackground": A(accentHi, "dd"),
    "button.secondaryBackground": A(border, "44"),
    "button.secondaryForeground": fg,
    "button.secondaryHoverBackground": A(accent, "33"),

    "badge.background": A(accent, "aa"),
    "badge.foreground": "#0a0a0a",

    "input.foreground": fg,
    "input.placeholderForeground": A(fg, "55"),
    "inputOption.activeBackground": A(accent, "33"),
    "inputOption.activeBorder": A(accentHi, "44"),
    "inputOption.activeForeground": fg,
    "inputValidation.errorBackground": A(error, "22"),
    "inputValidation.errorBorder": A(error, "55"),
    "inputValidation.warningBackground": A(warning, "22"),
    "inputValidation.warningBorder": A(warning, "55"),
    "inputValidation.infoBackground": A(info, "22"),
    "inputValidation.infoBorder": A(info, "55"),

    "scrollbarSlider.activeBackground": A(accentHi, "44"),

    "terminal.foreground": fg,
    "terminal.ansiBlack": "#1e1e1e",
    "terminal.ansiRed": error,
    "terminal.ansiGreen": inserted,
    "terminal.ansiYellow": amber,
    "terminal.ansiBlue": info,
    "terminal.ansiMagenta": purple,
    "terminal.ansiCyan": accentHi,
    "terminal.ansiWhite": "#e5e5e5",
    "terminal.ansiBrightBlack": "#6b7280",
    "terminal.ansiBrightRed": "#fca5a5",
    "terminal.ansiBrightGreen": "#86efac",
    "terminal.ansiBrightYellow": "#fde047",
    "terminal.ansiBrightBlue": "#93c5fd",
    "terminal.ansiBrightMagenta": "#f0abfc",
    "terminal.ansiBrightCyan": "#67e8f9",
    "terminal.ansiBrightWhite": "#fafafa",
    "terminal.selectionBackground": A(accent, "44"),
    "terminal.inactiveSelectionBackground": A(accent, "22"),
    "terminal.findMatchBackground": A(amber, "55"),
    "terminal.findMatchBorder": A(amber, "55"),
    "terminal.findMatchHighlightBackground": A(amber, "33"),
    "terminal.findMatchHighlightBorder": A(amber, "44"),
    "terminal.hoverHighlightBackground": A(accentHi, "22"),
    "terminal.border": A(border, "44"),
    "terminalStickyScroll.background": panel,
    "terminalStickyScroll.border": A(border, "44"),

    "notebook.editorBackground": widget,
    "notebook.cellEditorBackground": panel,
    "notebook.cellBorderColor": A(border, "44"),
    "notebook.focusedCellBorder": A(accentHi, "55"),
    "notebook.inactiveFocusedCellBorder": A(accent, "44"),
    "notebook.selectedCellBorder": A(accent, "33"),
    "notebook.focusedCellBackground": A(accent, "0c"),
    "notebook.selectedCellBackground": A(accent, "10"),
    "notebook.cellHoverBackground": A(fg, "08"),
    "notebook.outputContainerBackgroundColor": panel,
    "notebook.outputContainerBorderColor": A(border, "44"),
    "notebook.focusedEditorBorder": A(accentHi, "44"),

    "welcomePage.background": panel,
    "welcomePage.tileBackground": widget,
    "welcomePage.tileHoverBackground": A(accent, "18"),
    "welcomePage.tileBorder": A(border, "44"),
    "welcomePage.progress.background": A(border, "66"),
    "welcomePage.progress.foreground": accentHi,

    "editor.snippetTabstopHighlightBackground": A(amber, "33"),
    "editor.snippetTabstopHighlightBorder": A(amber, "44"),
    "editor.snippetFinalTabstopHighlightBackground": A(success, "33"),
    "editor.snippetFinalTabstopHighlightBorder": A(success, "44"),

    "editor.rangeHighlightBackground": A(purple, "18"),
    "editor.rangeHighlightBorder": A(purple, "2a"),
    "editor.symbolHighlightBackground": A(info, "18"),
    "editor.symbolHighlightBorder": A(info, "33"),

    "notifications.foreground": fg,
    "notifications.border": A(border, "44"),
    "notificationLink.foreground": accentHi,

    "peekViewEditor.matchHighlightBackground": A(amber, "33"),
    "peekViewResult.matchHighlightBackground": A(amber, "22"),

    "toolbar.hoverBackground": A(accent, "18"),
    "toolbar.activeBackground": A(accent, "28"),

    "menu.foreground": fg,
    "menu.selectionBackground": A(accent, "33"),
    "menu.selectionForeground": fg,
    "menubar.selectionBackground": A(accent, "22"),

    "quickInput.foreground": fg,
    "quickInputList.focusBackground": A(accent, "33"),

    "dropdown.foreground": fg,

    "debugToolBar.background": widget,
    "debugExceptionWidget.background": A(error, "22"),
    "debugExceptionWidget.border": A(error, "55"),

    "profiles.sashBorder": A(border, "44"),
  };
}

/** @type {Record<string, Palette>} */
const PALETTES = {
  "dusk-minuit": {
    fg: "#d1e0e8",
    accent: "#00bcd4",
    accentHi: "#00e5ff",
    accentSoft: "#1a2838",
    widget: "#010203",
    panel: "#010102",
    border: "#2e7d8f",
    error: "#f87171",
    warning: "#fbbf24",
    info: "#38bdf8",
    success: "#4ade80",
    inserted: "#22c55e",
    removed: "#ef4444",
    purple: "#c084fc",
    pink: "#f472b6",
    amber: "#fbbf24",
  },
  "dusk-abime": {
    fg: "#cfe8f0",
    accent: "#40c8e8",
    accentHi: "#67e8f9",
    accentSoft: "#2d5a78",
    widget: "#050e16",
    panel: "#030810",
    border: "#2d5a78",
    error: "#f87171",
    warning: "#fbbf24",
    info: "#38bdf8",
    success: "#4ade80",
    inserted: "#22c55e",
    removed: "#f43f5e",
    purple: "#c084fc",
    pink: "#f472b6",
    amber: "#fbbf24",
  },
  "dusk-recif": {
    fg: "#cffafe",
    accent: "#06b6d4",
    accentHi: "#00f5ff",
    accentSoft: "#0e7490",
    widget: "#021820",
    panel: "#011018",
    border: "#0891b2",
    error: "#fb7185",
    warning: "#fde047",
    info: "#38bdf8",
    success: "#4ade80",
    inserted: "#10b981",
    removed: "#f43f5e",
    purple: "#e879f9",
    pink: "#f472b6",
    amber: "#facc15",
  },
  "dusk-baie": {
    fg: "#ecfdf5",
    accent: "#22c55e",
    accentHi: "#4ade80",
    accentSoft: "#14532d",
    widget: "#072218",
    panel: "#051c14",
    border: "#1d8a6e",
    error: "#fb7185",
    warning: "#fbbf24",
    info: "#38bdf8",
    success: "#4ade80",
    inserted: "#16a34a",
    removed: "#dc2626",
    purple: "#a78bfa",
    pink: "#f472b6",
    amber: "#eab308",
  },
  "dusk-aube": {
    fg: "#fafcff",
    accent: "#0ea5e9",
    accentHi: "#00e8ff",
    accentSoft: "#4a6688",
    widget: "#2a4056",
    panel: "#243a4e",
    border: "#6a8aa8",
    error: "#f87171",
    warning: "#f59e0b",
    info: "#38bdf8",
    success: "#22c55e",
    inserted: "#16a34a",
    removed: "#dc2626",
    purple: "#a855f7",
    pink: "#ec4899",
    amber: "#d97706",
  },
  "dusk-brume": {
    fg: "#f4f9fc",
    accent: "#5a7a98",
    accentHi: "#5cefff",
    accentSoft: "#4a6080",
    widget: "#243240",
    panel: "#202c3a",
    border: "#647896",
    error: "#f87171",
    warning: "#f59e0b",
    info: "#38bdf8",
    success: "#4ade80",
    inserted: "#22c55e",
    removed: "#e11d48",
    purple: "#a78bfa",
    pink: "#f472b6",
    amber: "#d97706",
  },
  "dusk-cendre": {
    fg: "#e5e7eb",
    accent: "#9ca3af",
    accentHi: "#d1d5db",
    accentSoft: "#4b5563",
    widget: "#262a32",
    panel: "#1e2228",
    border: "#6b7280",
    error: "#f87171",
    warning: "#fbbf24",
    info: "#60a5fa",
    success: "#4ade80",
    inserted: "#22c55e",
    removed: "#ef4444",
    purple: "#a78bfa",
    pink: "#f472b6",
    amber: "#fbbf24",
  },
  "dusk-nebuleuse": {
    fg: "#f3e8ff",
    accent: "#a855f7",
    accentHi: "#e9d5ff",
    accentSoft: "#6b21a8",
    widget: "#140a26",
    panel: "#0c0618",
    border: "#7c3aed",
    error: "#fb7185",
    warning: "#fde047",
    info: "#93c5fd",
    success: "#6ee7b7",
    inserted: "#34d399",
    removed: "#f43f5e",
    purple: "#c084fc",
    pink: "#f0abfc",
    amber: "#fcd34d",
  },
};

function main() {
  const files = fs
    .readdirSync(themesDir)
    .filter((f) => /^dusk-(minuit|abime|recif|baie|aube|brume|cendre|nebuleuse)\.json$/.test(f));

  for (const file of files) {
    const id = file.replace(/\.json$/, "");
    const palette = PALETTES[id];
    if (!palette) {
      console.warn("Palette manquante:", id);
      continue;
    }
    const full = path.join(themesDir, file);
    const raw = fs.readFileSync(full, "utf8");
    const theme = JSON.parse(raw);
    const extended = buildExtended(palette);
    theme.colors = { ...extended, ...theme.colors };
    fs.writeFileSync(full, JSON.stringify(theme, null, 2) + "\n", "utf8");
    console.log("OK", file, Object.keys(theme.colors).length, "clés colors");
  }
}

main();
