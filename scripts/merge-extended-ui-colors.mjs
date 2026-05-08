#!/usr/bin/env node
/**
 * Fusionne des clés workbench étendues dans themes/dusk-*.json.
 * Les couleurs déjà présentes dans le thème gardent la priorité.
 *
 * Palettes par variante : scripts/palettes-extended-ui.json (clés = dusk-* sans .json).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PALETTE_VARIANT_IDS, themeWinsForKey } from "./theme-wins.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const themesDir = path.join(__dirname, "..", "themes");
const palettesPath = path.join(__dirname, "palettes-extended-ui.json");

/** Rouge vif tirant vers l’orange : meilleure séparation visuelle vs balises ~#db2777. */
const EDITOR_ERROR_SQUIGGLE_FOREGROUND = "#ff6b6b";

/** @param {string} hex #RRGGBB @param {string} aa deux hex d'opacité */
const A = (hex, aa) => (hex.length === 7 ? hex + aa : hex);

/** Mélange sRGB de deux #RRGGBB (t=0 → a, t=1 → b). */
function mixHexRgb(a, b, t) {
  if (
    typeof a !== "string" ||
    typeof b !== "string" ||
    a.length < 7 ||
    b.length < 7 ||
    t <= 0
  )
    return a;
  if (t >= 1) return b.slice(0, 7);
  const ra = parseInt(a.slice(1, 3), 16);
  const ga = parseInt(a.slice(3, 5), 16);
  const ba = parseInt(a.slice(5, 7), 16);
  const rb = parseInt(b.slice(1, 3), 16);
  const gb = parseInt(b.slice(3, 5), 16);
  const bb = parseInt(b.slice(5, 7), 16);
  const h = (n) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, "0");
  const r = Math.round(ra * (1 - t) + rb * t);
  const g = Math.round(ga * (1 - t) + gb * t);
  const bl = Math.round(ba * (1 - t) + bb * t);
  return `#${h(r)}${h(g)}${h(bl)}`;
}

/** Fond terminal : un peu tiré vers l’éditeur (sidebar reste `panel`). */
const TERMINAL_BLEND_TOWARD_EDITOR = 0.26;

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
    "focusBorder": A(accentHi, "55"),
    "widget.border": A(border, "44"),
    "widget.shadow": "#00000066",
    "selection.background": A(accent, "44"),
    "sash.hoverBorder": A(accentHi, "44"),

    "sideBar.background": panel,
    "activityBar.background": widget,
    "activityBarTop.background": widget,
    "sideBarSectionHeader.background": widget,

    "panel.background": panel,
    "panel.border": A(border, "59"),
    /** Légère teinte accent sous les onglets du panneau (Terminal, Problèmes…). */
    "panelTitle.border": A(accentHi, "33"),
    "panelSectionHeader.background": widget,
    "panelSectionHeader.border": A(border, "59"),

    "titleBar.activeBackground": widget,
    "titleBar.inactiveBackground": panel,
    "titleBar.border": A(border, "59"),
    "commandCenter.background": widget,
    "commandCenter.border": A(border, "59"),
    "quickInputTitle.background": widget,
    "notificationCenterHeader.background": widget,

    "editor.foreground": fg,
    "editorCursor.foreground": accentHi,
    "editorLineNumber.foreground": A(fg, "55"),
    "editorLineNumber.activeForeground": accentHi,
    "editorGutter.modifiedBackground": A(warning, "cc"),
    "editorGutter.addedBackground": A(inserted, "cc"),
    "editorGutter.deletedBackground": A(removed, "cc"),
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
    "editorError.foreground": EDITOR_ERROR_SQUIGGLE_FOREGROUND,
    "editorWarning.foreground": warning,
    "editorInfo.foreground": info,
    "editorHint.foreground": accentHi,
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
    "diffEditor.insertedTextBackground": A(inserted, "2a"),
    "diffEditor.insertedTextBorder": A(inserted, "33"),
    "diffEditor.removedTextBackground": A(removed, "2a"),
    "diffEditor.removedTextBorder": A(removed, "33"),
    "diffEditor.insertedLineBackground": A(inserted, "22"),
    "diffEditor.removedLineBackground": A(removed, "22"),
    "diffEditor.unchangedCodeBackground": A(panel, "2a"),
    "diffEditor.unchangedRegionShadow": "#00000088",
    "diffEditor.move.border": A(purple, "44"),
    "diffEditor.moveActive.border": A(accentHi, "55"),
    "diffEditor.diagonalFill": A(accentSoft, "44"),

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

    "tree.indentGuidesStroke": A(border, "18"),
    "tree.inactiveIndentGuidesStroke": A(border, "0a"),

    "editorIndentGuide.background1": A(border, "26"),
    "editorIndentGuide.background2": A(border, "1a"),
    "editorIndentGuide.background3": A(border, "12"),
    "editorIndentGuide.background4": A(border, "0a"),
    "editorIndentGuide.activeBackground1": A(accentHi, "34"),
    "editorIndentGuide.activeBackground2": A(accent, "34"),
    "editorIndentGuide.activeBackground3": A(accentHi, "1e"),
    "editorIndentGuide.activeBackground4": A(accent, "1e"),

    "list.activeSelectionBackground": A(accent, "33"),
    "list.activeSelectionForeground": fg,
    "list.inactiveSelectionBackground": A(accent, "18"),
    "list.inactiveSelectionForeground": fg,
    "list.focusBackground": A(accent, "22"),
    "list.focusForeground": fg,
    "list.highlightForeground": accentHi,

    "breadcrumb.background": widget,
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

    "extensionButton.prominentBackground": A(accent, "cc"),
    "extensionButton.prominentForeground": "#0a0a0a",
    "extensionButton.prominentHoverBackground": A(accentHi, "dd"),
    "extensionButton.separator": A(border, "59"),

    "badge.background": A(accent, "aa"),
    "badge.foreground": "#0a0a0a",

    "input.foreground": fg,
    "input.placeholderForeground": A(fg, "55"),
    "input.background": widget,
    "input.border": A(border, "59"),
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
    "terminal.background": panel,
    "terminalStickyScroll.background": panel,
    "terminalStickyScroll.border": A(border, "44"),

    /** Git / SCM : couleurs tirées de la palette (explorateur, onglets, graphe SCM). */
    "gitDecoration.addedResourceForeground": inserted,
    "gitDecoration.modifiedResourceForeground": warning,
    "gitDecoration.deletedResourceForeground": removed,
    "gitDecoration.renamedResourceForeground": info,
    "gitDecoration.stageModifiedResourceForeground": accent,
    "gitDecoration.stageDeletedResourceForeground": removed,
    /** Non suivi : teinte « info » (lisible vs gris du texte liste, distinct du vert ajouté). */
    "gitDecoration.untrackedResourceForeground": info,
    "gitDecoration.ignoredResourceForeground": A(border, "cc"),
    "gitDecoration.conflictingResourceForeground": error,
    "gitDecoration.submoduleResourceForeground": purple,

    "scmGraph.foreground1": accentHi,
    "scmGraph.foreground2": info,
    "scmGraph.foreground3": purple,
    "scmGraph.foreground4": pink,
    "scmGraph.foreground5": success,
    "scmGraph.historyItemHoverAdditionsForeground": inserted,
    "scmGraph.historyItemHoverDeletionsForeground": removed,
    "scmGraph.historyItemHoverLabelForeground": fg,
    "scmGraph.historyItemRefColor": accentHi,
    "scmGraph.historyItemRemoteRefColor": info,
    "scmGraph.historyItemBaseRefColor": A(fg, "88"),
    "scmGraph.historyItemHoverDefaultLabelForeground": fg,
    "scmGraph.historyItemHoverDefaultLabelBackground": A(widget, "ee"),

    "git.blame.editorDecorationForeground": A(fg, "55"),

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
    "notifications.background": widget,
    "notifications.border": A(border, "44"),
    "notificationLink.foreground": accentHi,

    "peekViewEditor.matchHighlightBackground": A(amber, "33"),
    "peekViewResult.matchHighlightBackground": A(amber, "22"),

    "toolbar.hoverBackground": A(accent, "18"),
    "toolbar.activeBackground": A(accent, "28"),

    "menu.foreground": fg,
    "menu.background": widget,
    "menu.border": A(border, "59"),
    "menu.selectionBackground": A(accent, "33"),
    "menu.selectionForeground": fg,
    "menubar.selectionBackground": A(accent, "22"),

    "quickInput.foreground": fg,
    "quickInput.background": widget,
    "quickInputList.focusBackground": A(accent, "33"),

    "dropdown.foreground": fg,
    "dropdown.background": widget,
    "dropdown.border": A(border, "59"),
    "dropdown.listBackground": panel,

    "checkbox.background": widget,
    "checkbox.border": A(border, "59"),
    "checkbox.foreground": fg,

    "listFilterWidget.background": widget,

    "debugToolBar.background": widget,
    "debugExceptionWidget.background": A(error, "22"),
    "debugExceptionWidget.border": A(error, "55"),

    "problemsErrorIcon.foreground": error,
    "problemsWarningIcon.foreground": warning,
    "problemsInfoIcon.foreground": info,
    "profiles.sashBorder": A(border, "44"),

    // Markdown preview & texte intégré (GFM : liens, citations, blocs de code, alertes)
    "textLink.foreground": accentHi,
    "textLink.activeForeground": accent,
    "textBlockQuote.background": A(fg, "08"),
    "textBlockQuote.border": A(accent, "44"),
    "textCodeBlock.background": A(widget, "dd"),
    "textPreformat.background": A(accentSoft, "55"),
    "textPreformat.foreground": fg,
  };
}

/** @type {Record<string, Palette>} */
const PALETTES = /** @type {Record<string, Palette>} */ (
  JSON.parse(fs.readFileSync(palettesPath, "utf8"))
);

/** Réapplique buildExtended par-dessus le JSON variante sauf où themeWinsForKey. */
function applyPaletteOverlay(colors, extended) {
  for (const [k, v] of Object.entries(extended)) {
    if (!themeWinsForKey(k)) colors[k] = v;
  }
}

/**
 * Après fusion, impose panel/widget pour que les restes du fichier (enhance) ne laissent pas du noir / #010102.
 *
 * Hiérarchie visuelle (variantes où `panel` est plus sombre que `widget`) :
 * - `panel` → panneau bas (chrome), onglet actif ; **sidebar = fond éditeur** (même couleur que la zone principale).
 *   Le **fond du terminal** reste un mélange panel + éditeur.
 * - `widget` → title bar, activity bar, onglets inactifs, status bar…
 * - `editor.background` n’est **pas** défini ici : il vient de `theme-sources/` et doit rester
 *   **entre les deux en luminance** (pas plus clair que `widget`), sinon la zone d’édition « flotte »
 *   au-dessus du chrome. Certaines variantes (ex. Cendre, Minuit) choisissent volontairement un
 *   éditeur plus clair ; la garde ciblée est dans `verify-theme-pipeline.mjs` (Abyss = référence Light).
 */
function pinChromeFromPalette(colors, p) {
  const { panel, widget, border, fg, accentHi } = p;
  const edBg = colors["editor.background"];
  const edRgb =
    typeof edBg === "string" && edBg.startsWith("#") && edBg.length >= 7
      ? edBg.slice(0, 7)
      : null;
  const terminalBg =
    edRgb && panel.length >= 7
      ? mixHexRgb(panel, edRgb, TERMINAL_BLEND_TOWARD_EDITOR)
      : panel;
  colors["terminal.background"] = terminalBg;
  colors["terminalStickyScroll.background"] = terminalBg;
  colors["panel.background"] = panel;
  colors["panelTitle.activeForeground"] = fg;
  colors["panelTitle.inactiveForeground"] = A(fg, "88");
  colors["panelTitle.border"] = A(accentHi, "33");
  colors["panelTitle.activeBorder"] = A(accentHi, "55");
  colors["terminal.tab.activeBorder"] = accentHi;
  colors["sideBar.background"] =
    typeof edBg === "string" && edBg.startsWith("#") ? edBg : panel;
  colors["sideBarSectionHeader.background"] = widget;
  colors["activityBar.background"] = widget;
  colors["activityBarTop.background"] = widget;
  colors["statusBar.background"] = widget;
  colors["statusBar.noFolderBackground"] = panel;
  colors["statusBar.border"] = A(border, "59");
  colors["titleBar.activeBackground"] = widget;
  colors["titleBar.inactiveBackground"] = panel;
  colors["titleBar.border"] = A(border, "59");
  colors["commandCenter.background"] = widget;
  colors["commandCenter.border"] = A(border, "59");
  colors["quickInputTitle.background"] = widget;
  colors["notificationCenterHeader.background"] = widget;
  colors["editorGroupHeader.tabsBackground"] = widget;
  colors["editorGroupHeader.noTabsBackground"] = widget;
  colors["tab.inactiveBackground"] = widget;
  colors["tab.activeBackground"] = panel;

  if (typeof edBg === "string" && edBg.startsWith("#")) {
    colors["editorGroup.emptyBackground"] = edBg;
    colors["editorCursor.background"] = edBg;
  }
}

/** Ordre des clés stable et identique entre variantes (diffs prévisibles). */
function sortColorKeys(colors) {
  const sorted = /** @type {Record<string, string>} */ ({});
  for (const k of Object.keys(colors).sort()) sorted[k] = colors[k];
  return sorted;
}

function main() {
  const files = PALETTE_VARIANT_IDS.map((id) => `${id}.json`).filter((f) =>
    fs.existsSync(path.join(themesDir, f))
  );

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
    applyPaletteOverlay(theme.colors, extended);
    pinChromeFromPalette(theme.colors, palette);
    theme.colors = sortColorKeys(theme.colors);
    fs.writeFileSync(full, JSON.stringify(theme, null, 2) + "\n", "utf8");
    console.log("OK", file, Object.keys(theme.colors).length, "clés colors");
  }
}

main();
