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
  "variable.readonly": "#7a68a0",
  "variable.readonly.local": "#7a68a0",
  "variable.readonly.global": "#6a58a0",
  "variable.readonly.member": "#8a78a8",
  "variable.mutable": {
    "foreground": "#b8d4e4",
    "underline": true
  },
  "variable.constant": {
    "foreground": "#7a68a0",
    "bold": true
  },
  
  // const vs let vs var
  "variable.declaration.const": {
    "foreground": "#7a68a0",
    "bold": true
  },
  "variable.declaration.let": "#b8d4e4",
  "variable.declaration.var": {
    "foreground": "#b8d4e4",
    "italic": true
  },
  
  // Function types
  "function": "#5a8fb0",
  "function.declaration": "#5a8fb0",
  "function.definition": "#7ab0c8",
  "function.call": "#7ab0c8",
  "function.member": "#7ab0c8",
  "function.static": {
    "foreground": "#6a9ab8",
    "italic": true
  },
  "function.private": {
    "foreground": "#5a8fb0",
    "italic": true
  },
  
  // Async functions
  "function.async": {
    "foreground": "#5a8fb0",
    "italic": true
  },
  "method.async": {
    "foreground": "#7ab0c8",
    "italic": true
  },
  
  // Types
  "class": {
    "foreground": "#b89040",
    "bold": true
  },
  "class.declaration": {
    "foreground": "#b89040",
    "bold": true
  },
  "class.definition": "#b89040",
  "class.abstract": {
    "foreground": "#c9a050",
    "italic": true
  },
  "interface": {
    "foreground": "#c9a050",
    "italic": true
  },
  "interface.declaration": {
    "foreground": "#c9a050",
    "italic": true
  },
  "struct": "#b89040",
  "struct.declaration": "#b89040",
  "enum": "#b89040",
  "enum.declaration": "#b89040",
  "enumMember": "#7a68a0",
  
  // Type aliases and parameters
  "type": "#6a9ab8",
  "typeAlias": {
    "foreground": "#6a9ab8",
    "italic": true
  },
  "typeParameter": {
    "foreground": "#6a9ab8",
    "italic": true
  },
  
  // Namespaces and modules
  "namespace": "#6a9ab8",
  "namespace.declaration": {
    "foreground": "#6a9ab8",
    "bold": true
  },
  "module": "#6a9ab8",
  "module.declaration": {
    "foreground": "#6a9ab8",
    "bold": true
  },
  
  // Methods
  "method": "#7ab0c8",
  "method.declaration": "#7ab0c8",
  "method.definition": "#7ab0c8",
  "method.static": {
    "foreground": "#6a9ab8",
    "italic": true
  },
  "method.private": {
    "foreground": "#7ab0c8",
    "italic": true
  },
  "method.deprecated": {
    "foreground": "#7ab0c8",
    "strikethrough": true
  },
  
  // Properties
  "property": "#6a9ab8",
  "property.readonly": "#6a9ab8",
  "property.static": {
    "foreground": "#6a9ab8",
    "italic": true
  },
  "property.private": {
    "foreground": "#6a9ab8",
    "italic": true
  },
  "property.deprecated": {
    "foreground": "#6a9ab8",
    "strikethrough": true
  },
  
  // Parameters
  "parameter": "#b87050",
  "parameter.readonly": {
    "foreground": "#b87050",
    "italic": true
  },
  "selfParameter": {
    "foreground": "#a86878",
    "italic": true
  },
  "selfKeyword": {
    "foreground": "#a86878",
    "italic": true
  },
  
  // Decorators and macros
  "decorator": {
    "foreground": "#c08060",
    "italic": true
  },
  "macro": "#7a68a0",
  "macro.declaration": {
    "foreground": "#7a68a0",
    "bold": true
  },
  "attribute": {
    "foreground": "#c08060",
    "italic": true
  },
  
  // Keywords
  "keyword": "#a86878",
  "keyword.control": "#a86878",
  "keyword.control.flow": {
    "foreground": "#a86878",
    "italic": true
  },
  "keyword.control.async": {
    "foreground": "#a86878",
    "italic": true
  },
  "keyword.control.import": "#a86878",
  "keyword.control.export": "#a86878",
  "keyword.modifier": {
    "foreground": "#a86878",
    "italic": true
  },
  "keyword.declaration": "#a86878",
  
  // Operators
  "operator": "#7ab0c8",
  "operator.overloaded": {
    "foreground": "#7ab0c8",
    "bold": true
  },
  
  // Literals
  "number": "#9a8ab0",
  "number.float": "#9a8ab0",
  "number.hex": "#9a8ab0",
  "number.binary": "#9a8ab0",
  "number.octal": "#9a8ab0",
  "string": "#7aa88a",
  "string.regex": "#a87080",
  "string.escape": "#b87888",
  "string.key": "#7aa88a",
  "boolean": "#9a8ab0",
  "null": {
    "foreground": "#9a8ab0",
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
    "foreground": "#c9a85c",
    "bold": true
  },
  "comment.note": {
    "foreground": "#6a9ab8",
    "italic": true
  },
  "comment.warning": {
    "foreground": "#c9a85c",
    "bold": true
  },
  "comment.error": {
    "foreground": "#c97565",
    "bold": true
  },
  
  // Special
  "lifetime": {
    "foreground": "#b87050",
    "italic": true
  },
  "label": {
    "foreground": "#b87050",
    "italic": true
  },
  "punctuation": "#d1e0e8",
  "punctuation.bracket": "#d1e0e8",
  "punctuation.bracket.angle": "#7ab0c8",
  "punctuation.delimiter": "#d1e0e8",
  "punctuation.separator": "#d1e0e8",
  
  // Modifiers (applied with *)
  "*.async": {
    "italic": true
  },
  "*.static": {
    "foreground": "#7a68a0",
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
    "foreground": "#c97565"
  },
  
  // Library defaults
  "class.defaultLibrary": "#c9a050",
  "function.defaultLibrary": "#6a9ab8",
  "variable.defaultLibrary": "#6a9ab8",
  "property.defaultLibrary": "#6a9ab8",
  "method.defaultLibrary": "#6a9ab8",
};

// Git decoration colors
const GIT_COLORS = {
  // Editor gutter (already in most themes, but ensure consistency)
  "editorGutter.modifiedBackground": "#c9a85ccc",
  "editorGutter.addedBackground": "#5a9a6acc",
  "editorGutter.deletedBackground": "#c97565cc",
  "editorGutter.commentRangeForeground": "#9ccae066",
  "editorGutter.commentGlyphForeground": "#7ab0c8",
  "editorGutter.foldingControlForeground": "#4b6c7a",
  
  // Editor overview ruler
  "editorOverviewRuler.modifiedForeground": "#c9a85cdd",
  "editorOverviewRuler.addedForeground": "#5a9a6add",
  "editorOverviewRuler.deletedForeground": "#c97565dd",
  
  // Git decorations in explorer (aligné sur theme-sources/dusk.json + merge palette)
  "gitDecoration.addedResourceForeground": "#5a9a6a",
  "gitDecoration.modifiedResourceForeground": "#c9a85c",
  "gitDecoration.deletedResourceForeground": "#c97565",
  "gitDecoration.renamedResourceForeground": "#6a9ab8",
  "gitDecoration.stageModifiedResourceForeground": "#5a8fb0",
  "gitDecoration.stageDeletedResourceForeground": "#c97565",
  "gitDecoration.untrackedResourceForeground": "#6a9ab8",
  "gitDecoration.ignoredResourceForeground": "#304f60cc",
  "gitDecoration.conflictingResourceForeground": "#c97565",
  "gitDecoration.submoduleResourceForeground": "#9a8ab8",
  "git.blame.editorDecorationForeground": "#d1e0e855",

  // SCM (Source Control Management)
  "scmGraph.foreground1": "#7ab0c8",
  "scmGraph.foreground2": "#6a9ab8",
  "scmGraph.foreground3": "#9a8ab8",
  "scmGraph.foreground4": "#b87888",
  "scmGraph.foreground5": "#7aa88a",
  "scmGraph.historyItemHoverAdditionsForeground": "#5a9a6a",
  "scmGraph.historyItemHoverDeletionsForeground": "#c97565",
  "scmGraph.historyItemHoverLabelForeground": "#d1e0e8",
  "scmGraph.historyItemRefColor": "#7ab0c8",
  "scmGraph.historyItemRemoteRefColor": "#6a9ab8",
  "scmGraph.historyItemBaseRefColor": "#d1e0e888",
  "scmGraph.historyItemHoverDefaultLabelForeground": "#d1e0e8",
  "scmGraph.historyItemHoverDefaultLabelBackground": "#010102ee",
  
  // Merge editor
  "merge.currentHeaderBackground": "#6a9ab833",
  "merge.currentContentBackground": "#6a9ab818",
  "merge.incomingHeaderBackground": "#7aa88a33",
  "merge.incomingContentBackground": "#7aa88a18",
  "merge.commonHeaderBackground": "#d1e0e822",
  "merge.commonContentBackground": "#d1e0e812",
  "merge.border": "#304f6055",
  
  // Diff editor
  "diffEditor.border": "#304f6044",
  "diffEditor.insertedTextBackground": "#5a9a6a2a",
  "diffEditor.insertedTextBorder": "#5a9a6a33",
  "diffEditor.removedTextBackground": "#c975652a",
  "diffEditor.removedTextBorder": "#c9756533",
  "diffEditor.insertedLineBackground": "#5a9a6a22",
  "diffEditor.removedLineBackground": "#c9756522",
  "diffEditor.diagonalFill": "#2d5a7844",
  "diffEditor.unchangedCodeBackground": "#0101022a",
  "diffEditor.unchangedRegionShadow": "#00000088",
  "diffEditor.move.border": "#9a8ab844",
  "diffEditor.moveActive.border": "#7ab0c855",
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
  "sideBarTitle.foreground": "#8ab5c8",
  "sideBarSectionHeader.background": "#000000",
  "sideBarSectionHeader.border": "#304f6059",
  "sideBarSectionHeader.foreground": "#d1e0e8",
  "sideBar.dropBackground": "#5a8fb033",
  
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
  "panelSection.dropBackground": "#5a8fb033",
  
  // Notifications
  "notifications.background": "#02060b",
  "notifications.foreground": "#d1e0e8",
  "notifications.border": "#304f6044",
  "notificationsErrorIcon.foreground": "#c97565",
  "notificationsWarningIcon.foreground": "#c9a85c",
  "notificationsInfoIcon.foreground": "#6a9ab8",
  "notificationCenter.border": "#304f6044",
  "notificationCenterHeader.background": "#010102",
  "notificationCenterHeader.foreground": "#d1e0e888",
  "notificationLink.foreground": "#7ab0c8",
  "notificationToast.border": "#304f6044",
  
  // Status bar
  "statusBar.background": "#000000",
  "statusBar.foreground": "#d1e0e8cc",
  "statusBar.border": "#304f6059",
  "statusBar.debuggingBackground": "#c9756544",
  "statusBar.debuggingForeground": "#d1e0e8",
  "statusBar.noFolderBackground": "#010102",
  "statusBar.noFolderForeground": "#d1e0e8cc",
  "statusBarItem.activeBackground": "#5a8fb044",
  "statusBarItem.hoverBackground": "#5a8fb022",
  "statusBarItem.prominentForeground": "#7ab0c8",
  "statusBarItem.prominentBackground": "#5a8fb022",
  "statusBarItem.prominentHoverBackground": "#5a8fb033",
  "statusBarItem.errorBackground": "#c9756544",
  "statusBarItem.errorForeground": "#c97565",
  "statusBarItem.warningBackground": "#c9a85c44",
  "statusBarItem.warningForeground": "#c9a85c",
  "statusBarItem.remoteBackground": "#9a8ab844",
  "statusBarItem.remoteForeground": "#9a8ab8",
  "statusBarItem.remoteHoverBackground": "#9a8ab833",
  "terminalCommandDecoration.successBackground": "#5a9a6a44",
  "testing.iconPassed": "#5a9a6a",
  "notebookStatusSuccessIcon.foreground": "#5a9a6a",
  
  // Activity bar
  "activityBar.background": "#000000",
  "activityBar.foreground": "#7ab0c8",
  "activityBar.inactiveForeground": "#4b6c7a",
  "activityBar.border": "#304f6059",
  "activityBar.activeBorder": "#7ab0c8",
  "activityBar.activeBackground": "#5a8fb022",
  "activityBar.dropBorder": "#5a8fb033",
  "activityBarBadge.background": "#5a8fb0aa",
  "activityBarBadge.foreground": "#0a0a0a",
  "activityBarTop.background": "#000000",
  "activityBarTop.foreground": "#7ab0c8",
  "activityBarTop.inactiveForeground": "#4b6c7a",
  "activityBarTop.activeBorder": "#7ab0c8",
  "activityBarTop.dropBorder": "#5a8fb033",
  
  // Editor groups
  "editorGroup.emptyBackground": "#010203",
  "editorGroup.border": "#304f6059",
  "editorGroup.dropBackground": "#5a8fb033",
  "editorGroup.focusedEmptyBorder": "#7ab0c855",
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
  "tab.activeBorder": "#7ab0c844",
  "tab.activeBorderTop": "#7ab0c844",
  "tab.unfocusedActiveBorder": "#5a8fb044",
  "tab.unfocusedActiveBorderTop": "#5a8fb044",
  "tab.unfocusedInactiveForeground": "#d1e0e855",
  "tab.lastPinnedBorder": "#304f6044",
  "tab.dragAndDropBorder": "#7ab0c844",
  "tab.selectedBackground": "#010203",
  "tab.selectedForeground": "#d1e0e8",
  "tab.selectedBorderTop": "#7ab0c855",
  
  // Breadcrumbs
  "breadcrumb.background": "#02060b",
  "breadcrumb.foreground": "#d1e0e8bb",
  "breadcrumb.focusForeground": "#d1e0e8",
  "breadcrumb.activeSelectionForeground": "#7ab0c8",
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
  "list.highlightForeground": "#7ab0c8",
  "list.errorForeground": "#c97565",
  "list.warningForeground": "#c9a85c",
  "listFilterWidget.background": "#02060b",
  "listFilterWidget.outline": "#5a8fb044",
  "listFilterWidget.noMatchesOutline": "#c9756555",
  "tree.indentGuidesStroke": "#304f6024",
  "tree.inactiveIndentGuidesStroke": "#304f600e",
  "tree.tableOddRowsBackground": "#01010222",
  
  // Menus
  "menu.background": "#02060b",
  "menu.foreground": "#d1e0e8",
  "menu.border": "#304f6059",
  "menu.selectionBackground": "#5a8fb033",
  "menu.selectionForeground": "#d1e0e8",
  "menu.selectionBorder": "#5a8fb044",
  "menu.separatorBackground": "#304f6044",
  "menubar.selectionBackground": "#5a8fb022",
  "menubar.selectionForeground": "#d1e0e8",
  "menubar.selectionBorder": "#5a8fb044",
  
  // Command center
  "commandCenter.background": "#02060b",
  "commandCenter.foreground": "#d1e0e8",
  "commandCenter.border": "#304f6059",
  "commandCenter.activeBackground": "#5a8fb022",
  "commandCenter.activeBorder": "#7ab0c844",
  "commandCenter.activeForeground": "#d1e0e8",
  "commandCenter.inactiveForeground": "#d1e0e888",
  
  // Quick input
  "quickInput.background": "#02060b",
  "quickInput.foreground": "#d1e0e8",
  "quickInputList.focusBackground": "#5a8fb033",
  "quickInputList.focusForeground": "#d1e0e8",
  "quickInputList.focusIconForeground": "#7ab0c8",
  "quickInputTitle.background": "#010102",
  
  // Input
  "input.background": "#02060b",
  "input.foreground": "#d1e0e8",
  "input.border": "#304f6059",
  "input.placeholderForeground": "#d1e0e855",
  "inputOption.activeBackground": "#5a8fb044",
  "inputOption.activeBorder": "#7ab0c844",
  "inputOption.activeForeground": "#d1e0e8",
  "inputOption.hoverBackground": "#5a8fb022",
  "inputValidation.errorBackground": "#c9756522",
  "inputValidation.errorBorder": "#c9756555",
  "inputValidation.errorForeground": "#c97565",
  "inputValidation.warningBackground": "#c9a85c22",
  "inputValidation.warningBorder": "#c9a85c55",
  "inputValidation.warningForeground": "#c9a85c",
  "inputValidation.infoBackground": "#6a9ab822",
  "inputValidation.infoBorder": "#6a9ab855",
  "inputValidation.infoForeground": "#6a9ab8",
  
  // Dropdown
  "dropdown.background": "#02060b",
  "dropdown.foreground": "#d1e0e8",
  "dropdown.border": "#304f6059",
  "dropdown.listBackground": "#02060b",
  
  // Checkbox
  "checkbox.background": "#02060b",
  "checkbox.foreground": "#d1e0e8",
  "checkbox.border": "#304f6059",
  "checkbox.selectBackground": "#5a8fb033",
  "checkbox.selectBorder": "#7ab0c844",
  
  // Buttons
  "button.background": "#5a8fb0cc",
  "button.foreground": "#0a0a0a",
  "button.border": "#5a8fb044",
  "button.hoverBackground": "#7ab0c8dd",
  "button.secondaryBackground": "#304f6044",
  "button.secondaryForeground": "#d1e0e8",
  "button.secondaryHoverBackground": "#5a8fb033",
  "button.separator": "#304f6059",
  
  // Badge
  "badge.background": "#5a8fb0aa",
  "badge.foreground": "#0a0a0a",
  
  // Progress bar
  "progressBar.background": "#7ab0c8",
  
  // Keybinding label
  "keybindingLabel.background": "#304f6044",
  "keybindingLabel.foreground": "#d1e0e8",
  "keybindingLabel.border": "#304f6059",
  "keybindingLabel.bottomBorder": "#304f6059",
  
  // Scrollbar
  "scrollbar.shadow": "#00000044",
  "scrollbarSlider.background": "#304f6020",
  "scrollbarSlider.hoverBackground": "#304f6038",
  "scrollbarSlider.activeBackground": "#7ab0c844",
  
  // Widget
  "widget.border": "#304f6044",
  "widget.shadow": "#00000066",
};

// Editor Enhancements (line highlight, selection, search, word highlight)
const EDITOR_ENHANCEMENTS = {
  // Line highlight
  "editor.lineHighlightBackground": "#5a8fb006",
  "editor.lineHighlightBorder": "#5a8fb00c",
  "editor.rangeHighlightBackground": "#5a8fb018",
  "editor.rangeHighlightBorder": "#5a8fb022",
  
  // Selection
  "editor.selectionBackground": "#5a8fb044",
  "editor.selectionForeground": "#d1e0e8",
  "editor.inactiveSelectionBackground": "#5a8fb022",
  "editor.selectionHighlightBackground": "#7ab0c822",
  "editor.selectionHighlightBorder": "#7ab0c82a",
  
  // Search
  "editor.findMatchBackground": "#c9a85c66",
  "editor.findMatchForeground": "#d1e0e8",
  "editor.findMatchHighlightBackground": "#5a8fb033",
  "editor.findMatchHighlightForeground": "#d1e0e8cc",
  "editor.findMatchBorder": "#c9a85c55",
  "editor.findMatchHighlightBorder": "#5a8fb044",
  "editor.findRangeHighlightBackground": "#304f6055",
  "editor.findRangeHighlightBorder": "#304f6044",
  
  // Word highlight
  "editor.wordHighlightBackground": "#5a8fb018",
  "editor.wordHighlightBorder": "#5a8fb02a",
  "editor.wordHighlightStrongBackground": "#b8788822",
  "editor.wordHighlightStrongBorder": "#b8788833",
  "editor.wordHighlightTextBackground": "#9a8ab818",
  "editor.wordHighlightTextBorder": "#9a8ab82a",
  
  // Symbol highlight
  "editor.symbolHighlightBackground": "#9a8ab822",
  "editor.symbolHighlightBorder": "#9a8ab833",
  
  // Link
  "editor.linkedEditingBackground": "#9a8ab833",
  "editorLink.activeForeground": "#7ab0c8",
  
  // Hover (line highlight); widget uses editorHoverWidget.* in base theme
  "editor.hoverHighlightBackground": "#7ab0c818",
  
  // Ghost text
  "editorGhostText.foreground": "#d1e0e844",
  "editorGhostText.background": "#00000000",
  "editorGhostText.border": "#5a8fb022",
  
  // Sticky scroll
  "editorStickyScroll.background": "#02060b",
  "editorStickyScroll.border": "#304f6044",
  "editorStickyScroll.shadow": "#00000055",
  "editorStickyScrollHover.background": "#5a8fb018",
  
  // Whitespace
  "editorWhitespace.foreground": "#d1e0e818",
  
  // Indent guides
  "editorIndentGuide.background1": "#304f6024",
  "editorIndentGuide.background2": "#304f6018",
  "editorIndentGuide.background3": "#304f6010",
  "editorIndentGuide.background4": "#304f6008",
  "editorIndentGuide.activeBackground1": "#7ab0c830",
  "editorIndentGuide.activeBackground2": "#6a9ab830",
  "editorIndentGuide.activeBackground3": "#9a8ab81e",
  "editorIndentGuide.activeBackground4": "#b878881e",
  
  // Rulers
  "editorRuler.foreground": "#304f6044",
  
  // Code lens
  "editorCodeLens.foreground": "#d1e0e888",
  
  // Inlay hints
  "editorInlayHint.background": "#304f6066",
  "editorInlayHint.foreground": "#d1e0e899",
  "editorInlayHint.typeForeground": "#6a9ab8cc",
  "editorInlayHint.parameterForeground": "#c9a85ccc",
  "editorInlayHint.typeBackground": "#6a9ab822",
  "editorInlayHint.parameterBackground": "#c9a85c22",
  
  // Lightbulb
  "editorLightBulb.foreground": "#c9a85c",
  "editorLightBulbAutoFix.foreground": "#5a9a6a",
  
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
  "statusBarItem.prominentHoverBackground": "#5a8fb033",
  
  // Editor trust
  
  // Restricted mode
  "extensionButton.prominentForeground": "#0a0a0a",
  "extensionButton.prominentBackground": "#5a8fb0cc",
  "extensionButton.prominentHoverBackground": "#7ab0c8dd",
  "extensionButton.separator": "#304f6059",
  "extensionBadge.remoteBackground": "#9a8ab844",
  "extensionBadge.remoteForeground": "#9a8ab8",
  "extensionIcon.starForeground": "#c9a85c",
  "extensionIcon.verifiedForeground": "#5a9a6a",
  "extensionIcon.preReleaseForeground": "#9a8ab8",
  "extensionIcon.sponsorForeground": "#b87888",
  "extensionIcon.privateForeground": "#c97565",
  
  // Settings trust
  "settings.modifiedItemIndicator": "#c9a85c44",
  "settings.headerForeground": "#8ab5c8",
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
  "settings.focusedRowBackground": "#5a8fb012",
  "settings.rowHoverBackground": "#304f6008",
  "settings.focusedRowBorder": "#5a8fb044",
  "settings.sashBorder": "#304f6044",
  "settings.settingsHeaderHoverForeground": "#7ab0c8",
};

// Terminal ANSI colors (full palette)
const TERMINAL_COLORS = {
  // Standard colors
  "terminal.background": "#010102",
  "terminal.foreground": "#d1e0e8",
  "terminal.border": "#304f6044",
  "terminal.selectionBackground": "#5a8fb044",
  "terminal.inactiveSelectionBackground": "#5a8fb022",
  "terminal.findMatchBackground": "#c9a85c55",
  "terminal.findMatchBorder": "#c9a85c55",
  "terminal.findMatchHighlightBackground": "#c9a85c33",
  "terminal.findMatchHighlightBorder": "#c9a85c44",
  "terminal.hoverHighlightBackground": "#7ab0c822",
  "terminalStickyScroll.background": "#010203",
  "terminalStickyScroll.border": "#304f6044",
  
  // ANSI colors (standard)
  "terminal.ansiBlack": "#1e1e1e",
  "terminal.ansiRed": "#c97565",
  "terminal.ansiGreen": "#5a9a6a",
  "terminal.ansiYellow": "#c9a85c",
  "terminal.ansiBlue": "#6a9ab8",
  "terminal.ansiMagenta": "#9a8ab8",
  "terminal.ansiCyan": "#7ab0c8",
  "terminal.ansiWhite": "#e5e5e5",
  
  // ANSI bright colors
  "terminal.ansiBrightBlack": "#6b7280",
  "terminal.ansiBrightRed": "#c09898",
  "terminal.ansiBrightGreen": "#8ab898",
  "terminal.ansiBrightYellow": "#d0b868",
  "terminal.ansiBrightBlue": "#7a98b0",
  "terminal.ansiBrightMagenta": "#a090a8",
  "terminal.ansiBrightCyan": "#8ab5c8",
  "terminal.ansiBrightWhite": "#fafafa",
  
  // Terminal cursor
  "terminalCursor.foreground": "#7ab0c8",
  "terminalCursor.background": "#010102",
  
  // Terminal tabs
  "terminal.tab.activeBorder": "#7ab0c8",
};

// Additional token colors for better syntax highlighting
const ADDITIONAL_TOKENS = [
  // Constants
  {
    "scope": ["constant", "constant.other", "support.constant"],
    "settings": { "foreground": "#9a8ab0" }
  },
  {
    "scope": ["constant.numeric", "constant.numeric.integer", "constant.numeric.float"],
    "settings": { "foreground": "#9a8ab0" }
  },
  {
    "scope": ["constant.numeric.hex", "constant.numeric.octal", "constant.numeric.binary"],
    "settings": { "foreground": "#9a8ab0" }
  },
  {
    "scope": ["constant.language", "constant.language.boolean", "constant.language.null"],
    "settings": { "foreground": "#9a8ab0", "fontStyle": "italic" }
  },
  {
    "scope": ["constant.character", "constant.character.escape"],
    "settings": { "foreground": "#7aa88a" }
  },
  {
    "scope": ["constant.other.key", "constant.other.property"],
    "settings": { "foreground": "#6a9ab8" }
  },
  
  // Storage modifiers
  {
    "scope": ["storage.modifier"],
    "settings": { "foreground": "#a86878", "fontStyle": "italic" }
  },
  {
    "scope": ["storage.modifier.async", "storage.modifier.const", "storage.modifier.static"],
    "settings": { "foreground": "#a86878", "fontStyle": "italic" }
  },
  {
    "scope": ["storage.modifier.readonly", "storage.modifier.final"],
    "settings": { "foreground": "#7a68a0", "fontStyle": "italic" }
  },
  {
    "scope": ["storage.modifier.private", "storage.modifier.protected"],
    "settings": { "foreground": "#a86878", "fontStyle": "italic" }
  },
  
  // Decorators/Attributes
  {
    "scope": ["meta.decorator", "meta.decorator.python", "punctuation.decorator"],
    "settings": { "foreground": "#c08060", "fontStyle": "italic" }
  },
  {
    "scope": ["entity.name.function.decorator", "entity.name.function.preprocessor"],
    "settings": { "foreground": "#c08060" }
  },
  {
    "scope": ["meta.attribute", "support.attribute"],
    "settings": { "foreground": "#c08060", "fontStyle": "italic" }
  },
  
  // Async/Await
  {
    "scope": ["keyword.control.await", "keyword.control.async", "keyword.other.async"],
    "settings": { "foreground": "#a86878", "fontStyle": "italic" }
  },
  {
    "scope": ["entity.name.function.async", "entity.name.method.async"],
    "settings": { "foreground": "#5a8fb0", "fontStyle": "italic" }
  },
  
  // Generics
  {
    "scope": ["punctuation.definition.generic", "punctuation.bracket.angle"],
    "settings": { "foreground": "#7ab0c8" }
  },
  {
    "scope": ["meta.generic", "meta.type.parameters"],
    "settings": { "foreground": "#6a9ab8" }
  },
  
  // Type annotations
  {
    "scope": ["meta.type.annotation", "meta.return.type"],
    "settings": { "foreground": "#6a9ab8" }
  },
  {
    "scope": ["storage.type.function.arrow", "storage.type.function"],
    "settings": { "foreground": "#a86878" }
  },
  
  // Strings
  {
    "scope": ["string.template", "string.quoted.template"],
    "settings": { "foreground": "#7aa88a" }
  },
  {
    "scope": ["punctuation.definition.string.template", "punctuation.definition.template-expression"],
    "settings": { "foreground": "#7aa88a" }
  },
  {
    "scope": ["string.regexp", "string.regexp.js", "string.regexp.ts"],
    "settings": { "foreground": "#a87080" }
  },
  {
    "scope": ["string.escape", "constant.character.escape"],
    "settings": { "foreground": "#b87888" }
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
    "settings": { "foreground": "#c9a85c", "fontStyle": "bold" }
  },
  {
    "scope": ["comment.note", "comment.line.note"],
    "settings": { "foreground": "#6a9ab8", "fontStyle": "italic" }
  },
  {
    "scope": ["comment.warning", "comment.line.warning"],
    "settings": { "foreground": "#c9a85c", "fontStyle": "bold" }
  },
  {
    "scope": ["comment.error", "comment.line.error"],
    "settings": { "foreground": "#c97565", "fontStyle": "bold" }
  },
  
  // Function calls
  {
    "scope": ["meta.function-call", "meta.function-call.method"],
    "settings": { "foreground": "#7ab0c8" }
  },
  {
    "scope": ["entity.name.function.call", "entity.name.function.member"],
    "settings": { "foreground": "#7ab0c8" }
  },
  
  // Variables
  {
    "scope": ["variable.other.constant", "variable.other.constant.property"],
    "settings": { "foreground": "#7a68a0", "fontStyle": "bold" }
  },
  {
    "scope": ["variable.other.member", "variable.other.property"],
    "settings": { "foreground": "#6a9ab8" }
  },
  {
    "scope": ["variable.other.global", "variable.other.global-property"],
    "settings": { "foreground": "#6a9ab8" }
  },
  
  // Operators
  {
    "scope": ["keyword.operator.arithmetic", "keyword.operator.assignment", "keyword.operator.comparison"],
    "settings": { "foreground": "#7ab0c8" }
  },
  {
    "scope": ["keyword.operator.logical", "keyword.operator.bitwise"],
    "settings": { "foreground": "#7ab0c8" }
  },
  {
    "scope": ["keyword.operator.new", "keyword.operator.delete", "keyword.operator.typeof"],
    "settings": { "foreground": "#a86878" }
  },
  {
    "scope": ["keyword.operator.spread", "keyword.operator.rest"],
    "settings": { "foreground": "#7ab0c8" }
  },
  
  // Special keywords
  {
    "scope": ["keyword.other.import", "keyword.other.export", "keyword.other.from"],
    "settings": { "foreground": "#a86878" }
  },
  {
    "scope": ["keyword.control.import", "keyword.control.export", "keyword.control.from"],
    "settings": { "foreground": "#a86878" }
  },
  {
    "scope": ["keyword.other.declaration", "keyword.declaration"],
    "settings": { "foreground": "#a86878" }
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
    "settings": { "foreground": "#b87050", "fontStyle": "italic" }
  },
  {
    "scope": ["entity.name.macro", "entity.name.function.macro"],
    "settings": { "foreground": "#7a68a0" }
  },
  {
    "scope": ["keyword.unsafe", "keyword.other.unsafe"],
    "settings": { "foreground": "#c97565" }
  },
  
  // Python specific
  {
    "scope": ["entity.name.function.decorator.python", "meta.function.decorator.python"],
    "settings": { "foreground": "#c08060", "fontStyle": "italic" }
  },
  {
    "scope": ["storage.type.function.python", "keyword.type.python"],
    "settings": { "foreground": "#a86878" }
  },
  {
    "scope": ["support.type.python", "support.class.python"],
    "settings": { "foreground": "#b89040" }
  },
  
  // TypeScript/JavaScript specific
  {
    "scope": ["entity.name.type.interface", "entity.name.type.enum"],
    "settings": { "foreground": "#c9a050", "fontStyle": "italic" }
  },
  {
    "scope": ["entity.name.type.alias", "entity.name.type.type-parameter"],
    "settings": { "foreground": "#6a9ab8", "fontStyle": "italic" }
  },
  {
    "scope": ["meta.type.declaration", "meta.interface.declaration"],
    "settings": { "foreground": "#6a9ab8" }
  },
  
  // JSX/TSX specific
  {
    "scope": ["meta.tag.name", "entity.name.tag.jsx", "entity.name.tag.tsx"],
    "settings": { "foreground": "#a86878" }
  },
  {
    "scope": ["meta.tag.attributes", "meta.jsx.attributes"],
    "settings": { "foreground": "#6a9ab8" }
  },
  {
    "scope": ["entity.other.attribute-name.jsx", "entity.other.attribute-name.tsx"],
    "settings": { "foreground": "#5a8fb0" }
  },
  
  // CSS specific
  {
    "scope": ["entity.name.tag.css", "entity.name.tag.scss"],
    "settings": { "foreground": "#a86878" }
  },
  {
    "scope": ["entity.other.attribute-name.class.css", "entity.other.attribute-name.id.css"],
    "settings": { "foreground": "#5a8fb0" }
  },
  {
    "scope": ["support.type.property-name.css", "support.type.property-name.scss"],
    "settings": { "foreground": "#6a9ab8" }
  },
  {
    "scope": ["support.constant.property-value.css"],
    "settings": { "foreground": "#7aa88a" }
  },
  {
    "scope": ["punctuation.definition.entity.css"],
    "settings": { "foreground": "#5a8fb0" }
  },
  
  // JSON/YAML specific
  {
    "scope": ["string.quoted.double.json", "string.unquoted.yaml"],
    "settings": { "foreground": "#7aa88a" }
  },
  {
    "scope": ["constant.language.json", "constant.language.yaml"],
    "settings": { "foreground": "#9a8ab0" }
  },
  {
    "scope": ["punctuation.definition.key.json", "entity.name.key.yaml"],
    "settings": { "foreground": "#6a9ab8" }
  },
  
  // Markdown specific
  {
    "scope": ["markup.heading", "markup.heading.setext"],
    "settings": { "foreground": "#b89040", "fontStyle": "bold" }
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
    "settings": { "foreground": "#5a9a6a" }
  },
  {
    "scope": ["markup.deleted", "markup.deleted.git"],
    "settings": { "foreground": "#c97565" }
  },
  {
    "scope": ["markup.underline", "markup.underline.link"],
    "settings": { "foreground": "#7ab0c8", "fontStyle": "underline" }
  },
  {
    "scope": ["markup.raw", "markup.raw.block", "markup.raw.inline"],
    "settings": { "foreground": "#7aa88a" }
  },
  {
    "scope": ["punctuation.definition.heading", "punctuation.definition.bold", "punctuation.definition.italic"],
    "settings": { "foreground": "#a86878" }
  },
  {
    "scope": ["fenced_code.block.language", "markup.fenced_code.block"],
    "settings": { "foreground": "#6a9ab8" }
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
  
  const failures = [];
  for (const file of jsonFiles) {
    const filePath = join(THEMES_DIR, file);
    try {
      await enhanceTheme(filePath);
    } catch (error) {
      console.error(`✗ Error enhancing ${file}:`, error.message);
      failures.push(file);
    }
  }

  if (failures.length > 0) {
    console.error(
      `\nFATAL: ${failures.length} theme(s) failed to enhance: ${failures.join(", ")}. Aborting.`,
    );
    process.exit(1);
  }

  console.log('\n✓ All themes enhanced!');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
