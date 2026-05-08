#!/usr/bin/env node

/**
 * Enhance all Dusk themes with:
 * 1. Advanced semantic tokens
 * 2. Git colors
 * 3. Terminal colors
 */

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const THEMES_DIR = join(__dirname, '..', 'themes');

// Advanced semantic tokens
const SEMANTIC_TOKENS = {
  // Variable kinds
  "variable": "#b8d4e4",
  "variable.readonly": "#9333ea",
  "variable.readonly.local": "#9333ea",
  "variable.readonly.global": "#7c3aed",
  "variable.readonly.member": "#8b5cf6",
  "variable.mutable": {
    "foreground": "#b8d4e4",
    "underline": true
  },
  "variable.constant": {
    "foreground": "#9333ea",
    "bold": true
  },
  
  // const vs let vs var
  "variable.declaration.const": {
    "foreground": "#9333ea",
    "bold": true
  },
  "variable.declaration.let": "#b8d4e4",
  "variable.declaration.var": {
    "foreground": "#b8d4e4",
    "italic": true
  },
  
  // Function types
  "function": "#06b6d4",
  "function.declaration": "#06b6d4",
  "function.definition": "#22d3ee",
  "function.call": "#22d3ee",
  "function.member": "#22d3ee",
  "function.static": {
    "foreground": "#0891b2",
    "italic": true
  },
  "function.private": {
    "foreground": "#06b6d4",
    "italic": true
  },
  
  // Async functions
  "function.async": {
    "foreground": "#06b6d4",
    "italic": true
  },
  "method.async": {
    "foreground": "#22d3ee",
    "italic": true
  },
  
  // Types
  "class": {
    "foreground": "#ca8a04",
    "bold": true
  },
  "class.declaration": {
    "foreground": "#ca8a04",
    "bold": true
  },
  "class.definition": "#ca8a04",
  "class.abstract": {
    "foreground": "#eab308",
    "italic": true
  },
  "interface": {
    "foreground": "#eab308",
    "italic": true
  },
  "interface.declaration": {
    "foreground": "#eab308",
    "italic": true
  },
  "struct": "#ca8a04",
  "struct.declaration": "#ca8a04",
  "enum": "#ca8a04",
  "enum.declaration": "#ca8a04",
  "enumMember": "#9333ea",
  
  // Type aliases and parameters
  "type": "#0891b2",
  "typeAlias": {
    "foreground": "#0891b2",
    "italic": true
  },
  "typeParameter": {
    "foreground": "#0891b2",
    "italic": true
  },
  
  // Namespaces and modules
  "namespace": "#0891b2",
  "namespace.declaration": {
    "foreground": "#0891b2",
    "bold": true
  },
  "module": "#0891b2",
  "module.declaration": {
    "foreground": "#0891b2",
    "bold": true
  },
  
  // Methods
  "method": "#22d3ee",
  "method.declaration": "#22d3ee",
  "method.definition": "#22d3ee",
  "method.static": {
    "foreground": "#0891b2",
    "italic": true
  },
  "method.private": {
    "foreground": "#22d3ee",
    "italic": true
  },
  "method.deprecated": {
    "foreground": "#22d3ee",
    "strikethrough": true
  },
  
  // Properties
  "property": "#0891b2",
  "property.readonly": "#0891b2",
  "property.static": {
    "foreground": "#0891b2",
    "italic": true
  },
  "property.private": {
    "foreground": "#0891b2",
    "italic": true
  },
  "property.deprecated": {
    "foreground": "#0891b2",
    "strikethrough": true
  },
  
  // Parameters
  "parameter": "#ea580c",
  "parameter.readonly": {
    "foreground": "#ea580c",
    "italic": true
  },
  "selfParameter": {
    "foreground": "#db2777",
    "italic": true
  },
  "selfKeyword": {
    "foreground": "#db2777",
    "italic": true
  },
  
  // Decorators and macros
  "decorator": {
    "foreground": "#f97316",
    "italic": true
  },
  "macro": "#9333ea",
  "macro.declaration": {
    "foreground": "#9333ea",
    "bold": true
  },
  "attribute": {
    "foreground": "#f97316",
    "italic": true
  },
  
  // Keywords
  "keyword": "#db2777",
  "keyword.control": "#db2777",
  "keyword.control.flow": {
    "foreground": "#db2777",
    "italic": true
  },
  "keyword.control.async": {
    "foreground": "#db2777",
    "italic": true
  },
  "keyword.control.import": "#db2777",
  "keyword.control.export": "#db2777",
  "keyword.modifier": {
    "foreground": "#db2777",
    "italic": true
  },
  "keyword.declaration": "#db2777",
  
  // Operators
  "operator": "#22d3ee",
  "operator.overloaded": {
    "foreground": "#22d3ee",
    "bold": true
  },
  
  // Literals
  "number": "#a855f7",
  "number.float": "#a855f7",
  "number.hex": "#a855f7",
  "number.binary": "#a855f7",
  "number.octal": "#a855f7",
  "string": "#34d399",
  "string.regex": "#ec4899",
  "string.escape": "#f472b6",
  "string.key": "#34d399",
  "boolean": "#a855f7",
  "null": {
    "foreground": "#a855f7",
    "italic": true
  },
  
  // Comments
  "comment": {
    "foreground": "#9ccae0",
    "italic": true
  },
  "comment.documentation": {
    "foreground": "#9ccae0",
    "italic": true
  },
  "comment.todo": {
    "foreground": "#fbbf24",
    "bold": true
  },
  "comment.note": {
    "foreground": "#38bdf8",
    "italic": true
  },
  "comment.warning": {
    "foreground": "#c9a85c",
    "bold": true
  },
  "comment.error": {
    "foreground": "#f87171",
    "bold": true
  },
  
  // Special
  "lifetime": {
    "foreground": "#ea580c",
    "italic": true
  },
  "label": {
    "foreground": "#ea580c",
    "italic": true
  },
  "punctuation": "#d1e0e8",
  "punctuation.bracket": "#d1e0e8",
  "punctuation.bracket.angle": "#22d3ee",
  "punctuation.delimiter": "#d1e0e8",
  "punctuation.separator": "#d1e0e8",
  
  // Modifiers (applied with *)
  "*.async": {
    "italic": true
  },
  "*.static": {
    "foreground": "#9333ea",
    "italic": true
  },
  "*.abstract": {
    "italic": true
  },
  "*.deprecated": {
    "strikethrough": true
  },
  "*.readonly": {
    "underline": true
  },
  "*.constant": {
    "bold": true
  },
  "*.private": {
    "italic": true
  },
  "*.protected": {
    "italic": true
  },
  "*.public": {},
  "*.unsafe": {
    "foreground": "#f87171"
  },
  
  // Library defaults
  "class.defaultLibrary": "#eab308",
  "function.defaultLibrary": "#0891b2",
  "variable.defaultLibrary": "#0891b2",
  "property.defaultLibrary": "#0891b2",
  "method.defaultLibrary": "#0891b2",
};

// Git decoration colors
const GIT_COLORS = {
  // Editor gutter (already in most themes, but ensure consistency)
  "editorGutter.modifiedBackground": "#c9a85ccc",
  "editorGutter.addedBackground": "#22c55ecc",
  "editorGutter.deletedBackground": "#ef4444cc",
  "editorGutter.commentRangeForeground": "#9ccae066",
  "editorGutter.commentGlyphForeground": "#22d3ee",
  "editorGutter.foldingControlForeground": "#4b6c7a",
  
  // Editor overview ruler
  "editorOverviewRuler.modifiedForeground": "#c9a85cdd",
  "editorOverviewRuler.addedForeground": "#22c55edd",
  "editorOverviewRuler.deletedForeground": "#ef4444dd",
  
  // Git decorations in explorer (aligné sur theme-sources/dusk.json + merge palette)
  "gitDecoration.addedResourceForeground": "#22c55e",
  "gitDecoration.modifiedResourceForeground": "#c9a85c",
  "gitDecoration.deletedResourceForeground": "#ef4444",
  "gitDecoration.renamedResourceForeground": "#38bdf8",
  "gitDecoration.stageModifiedResourceForeground": "#06b6d4",
  "gitDecoration.stageDeletedResourceForeground": "#ef4444",
  "gitDecoration.untrackedResourceForeground": "#38bdf8",
  "gitDecoration.ignoredResourceForeground": "#304f60cc",
  "gitDecoration.conflictingResourceForeground": "#f87171",
  "gitDecoration.submoduleResourceForeground": "#c084fc",
  "git.blame.editorDecorationForeground": "#d1e0e855",

  // SCM (Source Control Management)
  "scmGraph.foreground1": "#22d3ee",
  "scmGraph.foreground2": "#38bdf8",
  "scmGraph.foreground3": "#c084fc",
  "scmGraph.foreground4": "#f472b6",
  "scmGraph.foreground5": "#34d399",
  "scmGraph.historyItemHoverAdditionsForeground": "#22c55e",
  "scmGraph.historyItemHoverDeletionsForeground": "#ef4444",
  "scmGraph.historyItemHoverLabelForeground": "#d1e0e8",
  "scmGraph.historyItemRefColor": "#22d3ee",
  "scmGraph.historyItemRemoteRefColor": "#38bdf8",
  "scmGraph.historyItemBaseRefColor": "#d1e0e888",
  "scmGraph.historyItemHoverDefaultLabelForeground": "#d1e0e8",
  "scmGraph.historyItemHoverDefaultLabelBackground": "#010102ee",
  
  // Merge editor
  "merge.currentHeaderBackground": "#38bdf833",
  "merge.currentContentBackground": "#38bdf818",
  "merge.incomingHeaderBackground": "#34d39933",
  "merge.incomingContentBackground": "#34d39918",
  "merge.commonHeaderBackground": "#d1e0e822",
  "merge.commonContentBackground": "#d1e0e812",
  "merge.border": "#304f6055",
  
  // Diff editor
  "diffEditor.border": "#304f6044",
  "diffEditor.insertedTextBackground": "#22c55e2a",
  "diffEditor.insertedTextBorder": "#22c55e33",
  "diffEditor.removedTextBackground": "#ef44442a",
  "diffEditor.removedTextBorder": "#ef444433",
  "diffEditor.insertedLineBackground": "#22c55e22",
  "diffEditor.removedLineBackground": "#ef444422",
  "diffEditor.diagonalFill": "#2d5a7844",
  "diffEditor.unchangedCodeBackground": "#0101022a",
  "diffEditor.unchangedRegionShadow": "#00000088",
  "diffEditor.move.border": "#c084fc44",
  "diffEditor.moveActive.border": "#22d3ee55",
};

// Custom UI Colors (titleBar, sidebar, panel, notifications)
const UI_COLORS = {
  // Title bar
  "titleBar.activeBackground": "#010102",
  "titleBar.activeForeground": "#d1e0e8",
  "titleBar.inactiveBackground": "#000000",
  "titleBar.inactiveForeground": "#d1e0e888",
  "titleBar.border": "#304f6059",
  
  // Sidebar
  "sideBar.background": "#010202",
  "sideBar.foreground": "#d1e0e8",
  "sideBar.border": "#304f6059",
  "sideBarTitle.foreground": "#67e8f9",
  "sideBarSectionHeader.background": "#000000",
  "sideBarSectionHeader.border": "#304f6059",
  "sideBarSectionHeader.foreground": "#d1e0e8",
  "sideBar.dropBackground": "#06b6d433",
  
  // Panel
  "panel.background": "#010102",
  "panel.border": "#304f6059",
  "panelInput.border": "#304f6059",
  "panelTitle.activeForeground": "#d1e0e8",
  "panelTitle.activeBorder": "#304f6059",
  "panelTitle.inactiveForeground": "#d1e0e888",
  "panelSectionHeader.background": "#000000",
  "panelSectionHeader.border": "#304f6059",
  "panelSectionHeader.foreground": "#d1e0e8",
  "panelSection.dropBackground": "#06b6d433",
  
  // Notifications
  "notifications.background": "#02060b",
  "notifications.foreground": "#d1e0e8",
  "notifications.border": "#304f6044",
  "notificationsErrorIcon.foreground": "#f87171",
  "notificationsWarningIcon.foreground": "#c9a85c",
  "notificationsInfoIcon.foreground": "#38bdf8",
  "notificationCenter.border": "#304f6044",
  "notificationCenterHeader.background": "#010102",
  "notificationCenterHeader.foreground": "#d1e0e888",
  "notificationLink.foreground": "#22d3ee",
  "notificationToast.border": "#304f6044",
  
  // Status bar
  "statusBar.background": "#000000",
  "statusBar.foreground": "#d1e0e8cc",
  "statusBar.border": "#304f6059",
  "statusBar.debuggingBackground": "#f8717144",
  "statusBar.debuggingForeground": "#d1e0e8",
  "statusBar.noFolderBackground": "#010102",
  "statusBar.noFolderForeground": "#d1e0e8cc",
  "statusBarItem.activeBackground": "#06b6d444",
  "statusBarItem.hoverBackground": "#06b6d422",
  "statusBarItem.prominentForeground": "#22d3ee",
  "statusBarItem.prominentBackground": "#06b6d422",
  "statusBarItem.prominentHoverBackground": "#06b6d433",
  "statusBarItem.errorBackground": "#f8717144",
  "statusBarItem.errorForeground": "#f87171",
  "statusBarItem.warningBackground": "#c9a85c44",
  "statusBarItem.warningForeground": "#c9a85c",
  "statusBarItem.remoteBackground": "#c084fc44",
  "statusBarItem.remoteForeground": "#c084fc",
  "statusBarItem.remoteHoverBackground": "#c084fc33",
  "terminalCommandDecoration.successBackground": "#22c55e44",
  "testing.iconPassed": "#22c55e",
  "notebookStatusSuccessIcon.foreground": "#22c55e33",
  
  // Activity bar
  "activityBar.background": "#000000",
  "activityBar.foreground": "#22d3ee",
  "activityBar.inactiveForeground": "#4b6c7a",
  "activityBar.border": "#304f6059",
  "activityBar.activeBorder": "#22d3ee",
  "activityBar.activeBackground": "#06b6d422",
  "activityBar.dropBorder": "#06b6d433",
  "activityBarBadge.background": "#06b6d4aa",
  "activityBarBadge.foreground": "#0a0a0a",
  "activityBarTop.background": "#000000",
  "activityBarTop.foreground": "#22d3ee",
  "activityBarTop.inactiveForeground": "#4b6c7a",
  "activityBarTop.activeBorder": "#22d3ee",
  "activityBarTop.dropBorder": "#06b6d433",
  
  // Editor groups
  "editorGroup.emptyBackground": "#010203",
  "editorGroup.border": "#304f6059",
  "editorGroup.dropBackground": "#06b6d433",
  "editorGroup.focusedEmptyBorder": "#22d3ee55",
  "editorGroupHeader.tabsBackground": "#010102",
  "editorGroupHeader.tabsBorder": "#304f6059",
  "editorGroupHeader.noTabsBackground": "#010102",
  "editorGroupHeader.border": "#304f6059",
  
  // Tabs
  "tab.activeBackground": "#010203",
  "tab.activeForeground": "#d1e0e8",
  "tab.inactiveBackground": "#010102",
  "tab.inactiveForeground": "#d1e0e888",
  "tab.hoverBackground": "#010203aa",
  "tab.hoverForeground": "#d1e0e8",
  "tab.border": "#304f6059",
  "tab.activeBorder": "#22d3ee44",
  "tab.activeBorderTop": "#22d3ee44",
  "tab.unfocusedActiveBorder": "#06b6d444",
  "tab.unfocusedActiveBorderTop": "#06b6d444",
  "tab.unfocusedInactiveForeground": "#d1e0e855",
  "tab.lastPinnedBorder": "#304f6044",
  "tab.dragAndDropBorder": "#22d3ee44",
  "tab.selectedBackground": "#010203",
  "tab.selectedForeground": "#d1e0e8",
  "tab.selectedBorderTop": "#22d3ee55",
  
  // Breadcrumbs
  "breadcrumb.background": "#02060b",
  "breadcrumb.foreground": "#d1e0e8bb",
  "breadcrumb.focusForeground": "#d1e0e8",
  "breadcrumb.activeSelectionForeground": "#22d3ee",
  "breadcrumbPicker.background": "#02060b",
  
  // Lists and trees
  "list.hoverBackground": "#304f600f",
  "list.hoverForeground": "#d1e0e8",
  "list.activeSelectionBackground": "#304f601a",
  "list.activeSelectionForeground": "#d1e0e8",
  "list.inactiveSelectionBackground": "#304f6012",
  "list.inactiveSelectionForeground": "#d1e0e8",
  "list.focusBackground": "#304f601a",
  "list.focusForeground": "#d1e0e8",
  "list.highlightForeground": "#22d3ee",
  "list.errorForeground": "#f87171",
  "list.warningForeground": "#c9a85c",
  "listFilterWidget.background": "#02060b",
  "listFilterWidget.outline": "#06b6d444",
  "listFilterWidget.noMatchesOutline": "#f8717155",
  "tree.indentGuidesStroke": "#304f6024",
  "tree.inactiveIndentGuidesStroke": "#304f600e",
  "tree.tableOddRowsBackground": "#01010222",
  
  // Menus
  "menu.background": "#02060b",
  "menu.foreground": "#d1e0e8",
  "menu.border": "#304f6059",
  "menu.selectionBackground": "#06b6d433",
  "menu.selectionForeground": "#d1e0e8",
  "menu.selectionBorder": "#06b6d444",
  "menu.separatorBackground": "#304f6044",
  "menubar.selectionBackground": "#06b6d422",
  "menubar.selectionForeground": "#d1e0e8",
  "menubar.selectionBorder": "#06b6d444",
  
  // Command center
  "commandCenter.background": "#02060b",
  "commandCenter.foreground": "#d1e0e8",
  "commandCenter.border": "#304f6059",
  "commandCenter.activeBackground": "#06b6d422",
  "commandCenter.activeBorder": "#22d3ee44",
  "commandCenter.activeForeground": "#d1e0e8",
  "commandCenter.inactiveForeground": "#d1e0e888",
  
  // Quick input
  "quickInput.background": "#02060b",
  "quickInput.foreground": "#d1e0e8",
  "quickInputList.focusBackground": "#06b6d433",
  "quickInputList.focusForeground": "#d1e0e8",
  "quickInputList.focusIconForeground": "#22d3ee",
  "quickInputTitle.background": "#010102",
  
  // Input
  "input.background": "#02060b",
  "input.foreground": "#d1e0e8",
  "input.border": "#304f6059",
  "input.placeholderForeground": "#d1e0e855",
  "inputOption.activeBackground": "#06b6d444",
  "inputOption.activeBorder": "#22d3ee44",
  "inputOption.activeForeground": "#d1e0e8",
  "inputOption.hoverBackground": "#06b6d422",
  "inputValidation.errorBackground": "#f8717122",
  "inputValidation.errorBorder": "#f8717155",
  "inputValidation.errorForeground": "#f87171",
  "inputValidation.warningBackground": "#c9a85c22",
  "inputValidation.warningBorder": "#c9a85c55",
  "inputValidation.warningForeground": "#c9a85c",
  "inputValidation.infoBackground": "#38bdf822",
  "inputValidation.infoBorder": "#38bdf855",
  "inputValidation.infoForeground": "#38bdf8",
  
  // Dropdown
  "dropdown.background": "#02060b",
  "dropdown.foreground": "#d1e0e8",
  "dropdown.border": "#304f6059",
  "dropdown.listBackground": "#02060b",
  
  // Checkbox
  "checkbox.background": "#02060b",
  "checkbox.foreground": "#d1e0e8",
  "checkbox.border": "#304f6059",
  "checkbox.selectBackground": "#06b6d433",
  "checkbox.selectBorder": "#22d3ee44",
  
  // Buttons
  "button.background": "#06b6d4cc",
  "button.foreground": "#0a0a0a",
  "button.border": "#06b6d444",
  "button.hoverBackground": "#22d3eedd",
  "button.secondaryBackground": "#304f6044",
  "button.secondaryForeground": "#d1e0e8",
  "button.secondaryHoverBackground": "#06b6d433",
  "button.separator": "#304f6059",
  
  // Badge
  "badge.background": "#06b6d4aa",
  "badge.foreground": "#0a0a0a",
  
  // Progress bar
  "progressBar.background": "#22d3ee",
  
  // Keybinding label
  "keybindingLabel.background": "#304f6044",
  "keybindingLabel.foreground": "#d1e0e8",
  "keybindingLabel.border": "#304f6059",
  "keybindingLabel.bottomBorder": "#304f6059",
  
  // Scrollbar
  "scrollbar.shadow": "#00000044",
  "scrollbarSlider.background": "#304f6020",
  "scrollbarSlider.hoverBackground": "#304f6038",
  "scrollbarSlider.activeBackground": "#22d3ee44",
  
  // Widget
  "widget.border": "#304f6044",
  "widget.shadow": "#00000066",
};

// Editor Enhancements (line highlight, selection, search, word highlight)
const EDITOR_ENHANCEMENTS = {
  // Line highlight
  "editor.lineHighlightBackground": "#06b6d406",
  "editor.lineHighlightBorder": "#06b6d40c",
  "editor.rangeHighlightBackground": "#06b6d418",
  "editor.rangeHighlightBorder": "#06b6d422",
  
  // Selection
  "editor.selectionBackground": "#06b6d444",
  "editor.selectionForeground": "#d1e0e8",
  "editor.inactiveSelectionBackground": "#06b6d422",
  "editor.selectionHighlightBackground": "#22d3ee22",
  "editor.selectionHighlightBorder": "#22d3ee2a",
  
  // Search
  "editor.findMatchBackground": "#fbbf2466",
  "editor.findMatchForeground": "#d1e0e8",
  "editor.findMatchHighlightBackground": "#06b6d433",
  "editor.findMatchHighlightForeground": "#d1e0e8cc",
  "editor.findMatchBorder": "#fbbf2455",
  "editor.findMatchHighlightBorder": "#06b6d444",
  "editor.findRangeHighlightBackground": "#304f6055",
  "editor.findRangeHighlightBorder": "#304f6044",
  
  // Word highlight
  "editor.wordHighlightBackground": "#06b6d418",
  "editor.wordHighlightBorder": "#06b6d42a",
  "editor.wordHighlightStrongBackground": "#f472b622",
  "editor.wordHighlightStrongBorder": "#f472b633",
  "editor.wordHighlightTextBackground": "#c084fc18",
  "editor.wordHighlightTextBorder": "#c084fc2a",
  
  // Symbol highlight
  "editor.symbolHighlightBackground": "#c084fc22",
  "editor.symbolHighlightBorder": "#c084fc33",
  
  // Link
  "editor.linkedEditingBackground": "#c084fc33",
  "editorLink.activeForeground": "#22d3ee",
  
  // Hover (line highlight); widget uses editorHoverWidget.* in base theme
  "editor.hoverHighlightBackground": "#22d3ee18",
  
  // Ghost text
  "editorGhostText.foreground": "#d1e0e844",
  "editorGhostText.background": "#00000000",
  "editorGhostText.border": "#06b6d422",
  
  // Sticky scroll
  "editorStickyScroll.background": "#02060b",
  "editorStickyScroll.border": "#304f6044",
  "editorStickyScroll.shadow": "#00000055",
  "editorStickyScrollHover.background": "#06b6d418",
  
  // Whitespace
  "editorWhitespace.foreground": "#d1e0e818",
  
  // Indent guides
  "editorIndentGuide.background1": "#304f6024",
  "editorIndentGuide.background2": "#304f6018",
  "editorIndentGuide.background3": "#304f6010",
  "editorIndentGuide.background4": "#304f6008",
  "editorIndentGuide.activeBackground1": "#22d3ee30",
  "editorIndentGuide.activeBackground2": "#38bdf830",
  "editorIndentGuide.activeBackground3": "#c084fc1e",
  "editorIndentGuide.activeBackground4": "#f472b61e",
  
  // Rulers
  "editorRuler.foreground": "#304f6044",
  
  // Code lens
  "editorCodeLens.foreground": "#d1e0e888",
  
  // Inlay hints
  "editorInlayHint.background": "#304f6066",
  "editorInlayHint.foreground": "#d1e0e899",
  "editorInlayHint.typeForeground": "#38bdf8cc",
  "editorInlayHint.parameterForeground": "#fbbf24cc",
  "editorInlayHint.typeBackground": "#38bdf822",
  "editorInlayHint.parameterBackground": "#fbbf2422",
  
  // Lightbulb
  "editorLightBulb.foreground": "#c9a85c",
  "editorLightBulbAutoFix.foreground": "#22c55e",
  
  // Walkthrough
  "walkThrough.embeddedEditorBackground": "#010203",
};

// Restricted-mode banner uses banner.* (workbench.trust.* is not a VS Code color ID)
const WORKSPACE_TRUST_COLORS = {
  // Banner
  "banner.background": "#c9a85c33",
  "banner.foreground": "#c9a85c",
  "banner.iconForeground": "#c9a85c",
  
  // Status bar trust indicator
  "statusBarItem.prominentHoverBackground": "#06b6d433",
  
  // Editor trust
  
  // Restricted mode
  "extensionButton.prominentForeground": "#0a0a0a",
  "extensionButton.prominentBackground": "#06b6d4cc",
  "extensionButton.prominentHoverBackground": "#22d3eedd",
  "extensionButton.separator": "#304f6059",
  "extensionBadge.remoteBackground": "#c084fc44",
  "extensionBadge.remoteForeground": "#c084fc",
  "extensionIcon.starForeground": "#fbbf24",
  "extensionIcon.verifiedForeground": "#22c55e",
  "extensionIcon.preReleaseForeground": "#c084fc",
  "extensionIcon.sponsorForeground": "#f472b6",
  "extensionIcon.privateForeground": "#f87171",
  
  // Settings trust
  "settings.modifiedItemIndicator": "#c9a85c44",
  "settings.headerForeground": "#67e8f9",
  "settings.dropdownBackground": "#02060b",
  "settings.dropdownForeground": "#d1e0e8",
  "settings.dropdownBorder": "#304f6059",
  "settings.dropdownListBorder": "#304f6044",
  "settings.checkboxBackground": "#02060b",
  "settings.checkboxForeground": "#d1e0e8",
  "settings.checkboxBorder": "#304f6059",
  "settings.textInputBackground": "#02060b",
  "settings.textInputForeground": "#d1e0e8",
  "settings.textInputBorder": "#304f6059",
  "settings.numberInputBackground": "#02060b",
  "settings.numberInputForeground": "#d1e0e8",
  "settings.numberInputBorder": "#304f6059",
  "settings.focusedRowBackground": "#06b6d412",
  "settings.rowHoverBackground": "#304f6008",
  "settings.focusedRowBorder": "#06b6d444",
  "settings.sashBorder": "#304f6044",
  "settings.settingsHeaderHoverForeground": "#22d3ee",
};

// Terminal ANSI colors (full palette)
const TERMINAL_COLORS = {
  // Standard colors
  "terminal.background": "#010102",
  "terminal.foreground": "#d1e0e8",
  "terminal.border": "#304f6044",
  "terminal.selectionBackground": "#06b6d444",
  "terminal.inactiveSelectionBackground": "#06b6d422",
  "terminal.findMatchBackground": "#fbbf2455",
  "terminal.findMatchBorder": "#fbbf2455",
  "terminal.findMatchHighlightBackground": "#fbbf2433",
  "terminal.findMatchHighlightBorder": "#fbbf2444",
  "terminal.hoverHighlightBackground": "#22d3ee22",
  "terminalStickyScroll.background": "#010203",
  "terminalStickyScroll.border": "#304f6044",
  
  // ANSI colors (standard)
  "terminal.ansiBlack": "#1e1e1e",
  "terminal.ansiRed": "#f87171",
  "terminal.ansiGreen": "#22c55e",
  "terminal.ansiYellow": "#fbbf24",
  "terminal.ansiBlue": "#38bdf8",
  "terminal.ansiMagenta": "#c084fc",
  "terminal.ansiCyan": "#22d3ee",
  "terminal.ansiWhite": "#e5e5e5",
  
  // ANSI bright colors
  "terminal.ansiBrightBlack": "#6b7280",
  "terminal.ansiBrightRed": "#fca5a5",
  "terminal.ansiBrightGreen": "#86efac",
  "terminal.ansiBrightYellow": "#fde047",
  "terminal.ansiBrightBlue": "#93c5fd",
  "terminal.ansiBrightMagenta": "#f0abfc",
  "terminal.ansiBrightCyan": "#67e8f9",
  "terminal.ansiBrightWhite": "#fafafa",
  
  // Terminal cursor
  "terminalCursor.foreground": "#22d3ee",
  "terminalCursor.background": "#010102",
  
  // Terminal tabs
  "terminal.tab.activeBorder": "#22d3ee",
};

// Additional token colors for better syntax highlighting
const ADDITIONAL_TOKENS = [
  // Constants
  {
    "scope": ["constant", "constant.other", "support.constant"],
    "settings": { "foreground": "#a855f7" }
  },
  {
    "scope": ["constant.numeric", "constant.numeric.integer", "constant.numeric.float"],
    "settings": { "foreground": "#a855f7" }
  },
  {
    "scope": ["constant.numeric.hex", "constant.numeric.octal", "constant.numeric.binary"],
    "settings": { "foreground": "#a855f7" }
  },
  {
    "scope": ["constant.language", "constant.language.boolean", "constant.language.null"],
    "settings": { "foreground": "#a855f7", "fontStyle": "italic" }
  },
  {
    "scope": ["constant.character", "constant.character.escape"],
    "settings": { "foreground": "#34d399" }
  },
  {
    "scope": ["constant.other.key", "constant.other.property"],
    "settings": { "foreground": "#0891b2" }
  },
  
  // Storage modifiers
  {
    "scope": ["storage.modifier"],
    "settings": { "foreground": "#db2777", "fontStyle": "italic" }
  },
  {
    "scope": ["storage.modifier.async", "storage.modifier.const", "storage.modifier.static"],
    "settings": { "foreground": "#db2777", "fontStyle": "italic" }
  },
  {
    "scope": ["storage.modifier.readonly", "storage.modifier.final"],
    "settings": { "foreground": "#9333ea", "fontStyle": "italic" }
  },
  {
    "scope": ["storage.modifier.private", "storage.modifier.protected"],
    "settings": { "foreground": "#db2777", "fontStyle": "italic" }
  },
  
  // Decorators/Attributes
  {
    "scope": ["meta.decorator", "meta.decorator.python", "punctuation.decorator"],
    "settings": { "foreground": "#f97316", "fontStyle": "italic" }
  },
  {
    "scope": ["entity.name.function.decorator", "entity.name.function.preprocessor"],
    "settings": { "foreground": "#f97316" }
  },
  {
    "scope": ["meta.attribute", "support.attribute"],
    "settings": { "foreground": "#f97316", "fontStyle": "italic" }
  },
  
  // Async/Await
  {
    "scope": ["keyword.control.await", "keyword.control.async", "keyword.other.async"],
    "settings": { "foreground": "#db2777", "fontStyle": "italic" }
  },
  {
    "scope": ["entity.name.function.async", "entity.name.method.async"],
    "settings": { "foreground": "#06b6d4", "fontStyle": "italic" }
  },
  
  // Generics
  {
    "scope": ["punctuation.definition.generic", "punctuation.bracket.angle"],
    "settings": { "foreground": "#22d3ee" }
  },
  {
    "scope": ["meta.generic", "meta.type.parameters"],
    "settings": { "foreground": "#0891b2" }
  },
  
  // Type annotations
  {
    "scope": ["meta.type.annotation", "meta.return.type"],
    "settings": { "foreground": "#0891b2" }
  },
  {
    "scope": ["storage.type.function.arrow", "storage.type.function"],
    "settings": { "foreground": "#db2777" }
  },
  
  // Strings
  {
    "scope": ["string.template", "string.quoted.template"],
    "settings": { "foreground": "#34d399" }
  },
  {
    "scope": ["punctuation.definition.string.template", "punctuation.definition.template-expression"],
    "settings": { "foreground": "#34d399" }
  },
  {
    "scope": ["string.regexp", "string.regexp.js", "string.regexp.ts"],
    "settings": { "foreground": "#ec4899" }
  },
  {
    "scope": ["string.escape", "constant.character.escape"],
    "settings": { "foreground": "#f472b6" }
  },
  
  // Comments
  {
    "scope": ["comment.line.double-dash", "comment.line.double-slash", "comment.line.number-sign"],
    "settings": { "foreground": "#9ccae0", "fontStyle": "italic" }
  },
  {
    "scope": ["comment.block.documentation", "comment.documentation"],
    "settings": { "foreground": "#9ccae0", "fontStyle": "italic" }
  },
  {
    "scope": ["comment.todo", "comment.line.todo"],
    "settings": { "foreground": "#fbbf24", "fontStyle": "bold" }
  },
  {
    "scope": ["comment.note", "comment.line.note"],
    "settings": { "foreground": "#38bdf8", "fontStyle": "italic" }
  },
  {
    "scope": ["comment.warning", "comment.line.warning"],
    "settings": { "foreground": "#c9a85c", "fontStyle": "bold" }
  },
  {
    "scope": ["comment.error", "comment.line.error"],
    "settings": { "foreground": "#f87171", "fontStyle": "bold" }
  },
  
  // Function calls
  {
    "scope": ["meta.function-call", "meta.function-call.method"],
    "settings": { "foreground": "#22d3ee" }
  },
  {
    "scope": ["entity.name.function.call", "entity.name.function.member"],
    "settings": { "foreground": "#22d3ee" }
  },
  
  // Variables
  {
    "scope": ["variable.other.constant", "variable.other.constant.property"],
    "settings": { "foreground": "#9333ea", "fontStyle": "bold" }
  },
  {
    "scope": ["variable.other.member", "variable.other.property"],
    "settings": { "foreground": "#0891b2" }
  },
  {
    "scope": ["variable.other.global", "variable.other.global-property"],
    "settings": { "foreground": "#0891b2" }
  },
  
  // Operators
  {
    "scope": ["keyword.operator.arithmetic", "keyword.operator.assignment", "keyword.operator.comparison"],
    "settings": { "foreground": "#22d3ee" }
  },
  {
    "scope": ["keyword.operator.logical", "keyword.operator.bitwise"],
    "settings": { "foreground": "#22d3ee" }
  },
  {
    "scope": ["keyword.operator.new", "keyword.operator.delete", "keyword.operator.typeof"],
    "settings": { "foreground": "#db2777" }
  },
  {
    "scope": ["keyword.operator.spread", "keyword.operator.rest"],
    "settings": { "foreground": "#22d3ee" }
  },
  
  // Special keywords
  {
    "scope": ["keyword.other.import", "keyword.other.export", "keyword.other.from"],
    "settings": { "foreground": "#db2777" }
  },
  {
    "scope": ["keyword.control.import", "keyword.control.export", "keyword.control.from"],
    "settings": { "foreground": "#db2777" }
  },
  {
    "scope": ["keyword.other.declaration", "keyword.declaration"],
    "settings": { "foreground": "#db2777" }
  },
  
  // Punctuation
  {
    "scope": ["punctuation.separator", "punctuation.delimiter"],
    "settings": { "foreground": "#d1e0e8" }
  },
  {
    "scope": ["punctuation.bracket", "punctuation.parenthesis", "punctuation.curlybrace", "punctuation.squarebracket"],
    "settings": { "foreground": "#d1e0e8" }
  },
  {
    "scope": ["punctuation.section.block", "punctuation.section.function"],
    "settings": { "foreground": "#d1e0e8" }
  },
  
  // Rust specific
  {
    "scope": ["entity.name.lifetime", "storage.modifier.lifetime"],
    "settings": { "foreground": "#ea580c", "fontStyle": "italic" }
  },
  {
    "scope": ["entity.name.macro", "entity.name.function.macro"],
    "settings": { "foreground": "#9333ea" }
  },
  {
    "scope": ["keyword.unsafe", "keyword.other.unsafe"],
    "settings": { "foreground": "#f87171" }
  },
  
  // Python specific
  {
    "scope": ["entity.name.function.decorator.python", "meta.function.decorator.python"],
    "settings": { "foreground": "#f97316", "fontStyle": "italic" }
  },
  {
    "scope": ["storage.type.function.python", "keyword.type.python"],
    "settings": { "foreground": "#db2777" }
  },
  {
    "scope": ["support.type.python", "support.class.python"],
    "settings": { "foreground": "#ca8a04" }
  },
  
  // TypeScript/JavaScript specific
  {
    "scope": ["entity.name.type.interface", "entity.name.type.enum"],
    "settings": { "foreground": "#eab308", "fontStyle": "italic" }
  },
  {
    "scope": ["entity.name.type.alias", "entity.name.type.type-parameter"],
    "settings": { "foreground": "#0891b2", "fontStyle": "italic" }
  },
  {
    "scope": ["meta.type.declaration", "meta.interface.declaration"],
    "settings": { "foreground": "#0891b2" }
  },
  
  // JSX/TSX specific
  {
    "scope": ["meta.tag.name", "entity.name.tag.jsx", "entity.name.tag.tsx"],
    "settings": { "foreground": "#db2777" }
  },
  {
    "scope": ["meta.tag.attributes", "meta.jsx.attributes"],
    "settings": { "foreground": "#0891b2" }
  },
  {
    "scope": ["entity.other.attribute-name.jsx", "entity.other.attribute-name.tsx"],
    "settings": { "foreground": "#06b6d4" }
  },
  
  // CSS specific
  {
    "scope": ["entity.name.tag.css", "entity.name.tag.scss"],
    "settings": { "foreground": "#db2777" }
  },
  {
    "scope": ["entity.other.attribute-name.class.css", "entity.other.attribute-name.id.css"],
    "settings": { "foreground": "#06b6d4" }
  },
  {
    "scope": ["support.type.property-name.css", "support.type.property-name.scss"],
    "settings": { "foreground": "#0891b2" }
  },
  {
    "scope": ["support.constant.property-value.css"],
    "settings": { "foreground": "#34d399" }
  },
  {
    "scope": ["punctuation.definition.entity.css"],
    "settings": { "foreground": "#06b6d4" }
  },
  
  // JSON/YAML specific
  {
    "scope": ["string.quoted.double.json", "string.unquoted.yaml"],
    "settings": { "foreground": "#34d399" }
  },
  {
    "scope": ["constant.language.json", "constant.language.yaml"],
    "settings": { "foreground": "#a855f7" }
  },
  {
    "scope": ["punctuation.definition.key.json", "entity.name.key.yaml"],
    "settings": { "foreground": "#0891b2" }
  },
  
  // Markdown specific
  {
    "scope": ["markup.heading", "markup.heading.setext"],
    "settings": { "foreground": "#ca8a04", "fontStyle": "bold" }
  },
  {
    "scope": ["markup.bold", "markup.bold.string"],
    "settings": { "foreground": "#d1e0e8", "fontStyle": "bold" }
  },
  {
    "scope": ["markup.italic", "markup.italic.string"],
    "settings": { "foreground": "#d1e0e8", "fontStyle": "italic" }
  },
  {
    "scope": ["markup.strikethrough"],
    "settings": { "foreground": "#d1e0e8", "fontStyle": "strikethrough" }
  },
  {
    "scope": ["markup.inserted", "markup.inserted.git"],
    "settings": { "foreground": "#22c55e" }
  },
  {
    "scope": ["markup.deleted", "markup.deleted.git"],
    "settings": { "foreground": "#ef4444" }
  },
  {
    "scope": ["markup.underline", "markup.underline.link"],
    "settings": { "foreground": "#22d3ee", "fontStyle": "underline" }
  },
  {
    "scope": ["markup.raw", "markup.raw.block", "markup.raw.inline"],
    "settings": { "foreground": "#34d399" }
  },
  {
    "scope": ["punctuation.definition.heading", "punctuation.definition.bold", "punctuation.definition.italic"],
    "settings": { "foreground": "#db2777" }
  },
  {
    "scope": ["fenced_code.block.language", "markup.fenced_code.block"],
    "settings": { "foreground": "#0891b2" }
  },
];

async function enhanceTheme(filePath) {
  const content = await readFile(filePath, 'utf-8');
  const theme = JSON.parse(content);
  
  // Skip themes that use "include" - they inherit from parent themes
  if (theme.include) {
    // Only add colors for included themes
    theme.colors = {
      ...theme.colors,
      ...GIT_COLORS,
      ...TERMINAL_COLORS,
      ...UI_COLORS,
      ...EDITOR_ENHANCEMENTS,
      ...WORKSPACE_TRUST_COLORS,
    };
    
    await writeFile(filePath, JSON.stringify(theme, null, 2) + '\n');
    console.log(`✓ Enhanced (include theme): ${filePath}`);
    return;
  }
  
  // 1. Add/merge semantic tokens
  theme.semanticTokenColors = {
    ...theme.semanticTokenColors,
    ...SEMANTIC_TOKENS,
  };
  
  // 2. Add/merge all color groups
  theme.colors = {
    ...theme.colors,
    ...GIT_COLORS,
    ...TERMINAL_COLORS,
    ...UI_COLORS,
    ...EDITOR_ENHANCEMENTS,
    ...WORKSPACE_TRUST_COLORS,
  };
  
  // 3. Add additional token colors (avoid duplicates)
  theme.tokenColors = theme.tokenColors || [];
  
  const existingScopes = new Set(
    theme.tokenColors.flatMap((t) => {
      const sc = t?.scope;
      if (sc == null) return [];
      return Array.isArray(sc) ? sc : [sc];
    }),
  );

  for (const token of ADDITIONAL_TOKENS) {
    const scopes = Array.isArray(token.scope) ? token.scope : [token.scope];
    const hasAny = scopes.some((s) => s != null && existingScopes.has(s));
    
    if (!hasAny) {
      theme.tokenColors.push(token);
      scopes.forEach(s => existingScopes.add(s));
    }
  }
  
  // Ensure semantic highlighting is enabled
  theme.semanticHighlighting = true;
  
  // Sort token colors by specificity (more specific first)
  theme.tokenColors.sort((a, b) => {
    const aLen = Array.isArray(a.scope) ? a.scope.length : 1;
    const bLen = Array.isArray(b.scope) ? b.scope.length : 1;
    return bLen - aLen;
  });
  
  await writeFile(filePath, JSON.stringify(theme, null, 2) + '\n');
  console.log(`✓ Enhanced: ${filePath}`);
}

async function main() {
  const files = await readdir(THEMES_DIR);
  const jsonFiles = files.filter(f => f.endsWith('.json'));
  
  console.log(`Found ${jsonFiles.length} themes to enhance\n`);
  
  for (const file of jsonFiles) {
    const filePath = join(THEMES_DIR, file);
    try {
      await enhanceTheme(filePath);
    } catch (error) {
      console.error(`✗ Error enhancing ${file}:`, error.message);
    }
  }
  
  console.log('\n✓ All themes enhanced!');
}

main().catch(console.error);
