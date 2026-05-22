/**
 * Génère un thème UI JetBrains complet (.theme.json) depuis une palette Dusk Office exportée.
 */
import { createHash } from "crypto";
import { mixHexRgb, uiGet, uiGetFirst, softenHexTowardBg } from "./theme-export-ui.mjs";

/**
 * VS Code workbench tokens → JetBrains LAF palette (menus, tabs, settings, popups).
 * @param {Record<string, Record<string, string>>} u
 * @param {{
 *   fg: string;
 *   bg: string;
 *   bg2: string;
 *   input: string;
 *   menu: string;
 *   hover: string;
 *   sel: string;
 *   syntax: Record<string, string>;
 * }} base
 */
function resolveChromeColors(u, base) {
  const { fg, bg, bg2, input, menu, hover, sel, syntax } = base;
  const menuFg = uiGetFirst(u, ["menu.foreground", "editor.foreground"], fg);
  const tabFg = uiGetFirst(u, ["tab.activeForeground", "tab.selectedForeground"], fg);
  const tabInactiveFg = uiGetFirst(
    u,
    ["tab.inactiveForeground", "tab.unfocusedInactiveForeground", "tab.activeForeground"],
    menuFg,
  );
  const tabHoverFg = uiGetFirst(u, ["tab.hoverForeground", "tab.activeForeground"], tabFg);
  const tabSelectedFg = uiGetFirst(u, ["tab.selectedForeground", "tab.activeForeground"], tabFg);
  const listHoverFg = uiGetFirst(u, ["list.hoverForeground", "menu.foreground"], fg);
  const listSelFg = uiGetFirst(u, ["list.activeSelectionForeground", "menu.foreground"], fg);
  const popup = uiGetFirst(
    u,
    ["dropdown.listBackground", "editorWidget.background", "editorSuggestWidget.background"],
    menu,
  );
  const popupFg = uiGetFirst(
    u,
    ["editorWidget.foreground", "menu.foreground", "dropdown.foreground"],
    menuFg,
  );
  const dropdownBg = uiGetFirst(u, ["dropdown.background", "settings.dropdownBackground"], input);
  const dropdownFg = uiGetFirst(
    u,
    ["dropdown.foreground", "settings.dropdownForeground", "input.foreground"],
    menuFg,
  );
  const settingsSurface = uiGetFirst(
    u,
    ["settings.dropdownBackground", "settings.textInputBackground", "dropdown.background"],
    input,
  );
  const settingsFg = uiGetFirst(
    u,
    ["settings.dropdownForeground", "settings.textInputForeground", "menu.foreground"],
    menuFg,
  );
  const settingsInput = uiGetFirst(
    u,
    ["settings.textInputBackground", "settings.numberInputBackground", "settings.dropdownBackground"],
    settingsSurface,
  );
  const settingsRowHover = uiGet(u, "settings.rowHoverBackground", hover);
  const settingsRowFocus = uiGet(u, "settings.focusedRowBackground", settingsRowHover);
  const checkboxBg = uiGetFirst(
    u,
    ["settings.checkboxBackground", "checkbox.background"],
    settingsSurface,
  );
  const checkboxFg = uiGetFirst(
    u,
    ["settings.checkboxForeground", "checkbox.foreground"],
    settingsFg,
  );
  const menuSel = uiGetFirst(u, ["menu.selectionBackground", "list.activeSelectionBackground"], sel);
  const menuSelFg = uiGetFirst(u, ["menu.selectionForeground", "menu.foreground"], menuFg);
  const menubarSelBg = uiGet(u, "menubar.selectionBackground", hover);
  const menubarSelFg = uiGetFirst(u, ["menubar.selectionForeground", "menu.foreground"], menuFg);
  const tooltipFg = uiGetFirst(u, ["editorHoverWidget.foreground", "menu.foreground"], fg);
  const suggestPopup = uiGetFirst(u, ["editorSuggestWidget.background", "dropdown.listBackground"], popup);
  const quickInputBg = uiGetFirst(u, ["quickInput.background", "editorActionList.background"], popup);
  const quickInputFg = uiGetFirst(
    u,
    ["quickInput.foreground", "quickInputList.focusForeground", "editorActionList.foreground"],
    popupFg,
  );
  const actionListBg = uiGet(u, "editorActionList.background", popup);
  const actionListFg = uiGet(u, "editorActionList.foreground", popupFg);
  const actionListFocusBg = uiGet(u, "editorActionList.focusBackground", menuSel);
  const actionListFocusFg = uiGet(u, "editorActionList.focusForeground", actionListFg);
  const inputFg = uiGet(u, "input.foreground", fg);
  const inputOptionHover = uiGet(u, "inputOption.hoverBackground", hover);
  const inputOptionActive = uiGet(u, "inputOption.activeBackground", menuSel);
  const mutedFg = uiGet(u, "descriptionForeground", syntax.comment ?? fg);
  const settingsHeaderFg = uiGet(u, "settings.headerForeground", settingsFg);

  return {
    menuFg,
    tabFg,
    tabInactiveFg,
    tabHoverFg,
    tabSelectedFg,
    listHoverFg,
    listSelFg,
    popup,
    popupFg,
    dropdownBg,
    dropdownFg,
    settingsSurface,
    settingsFg,
    settingsInput,
    settingsRowHover,
    settingsRowFocus,
    checkboxBg,
    checkboxFg,
    menuSel,
    menuSelFg,
    menubarSelBg,
    menubarSelFg,
    tooltipFg,
    suggestPopup,
    quickInputBg,
    quickInputFg,
    actionListBg,
    actionListFg,
    actionListFocusBg,
    actionListFocusFg,
    inputFg,
    inputOptionHover,
    inputOptionActive,
    mutedFg,
    settingsHeaderFg,
  };
}

/**
 * @param {import('./theme-export-palette.mjs').ExportPalette} p
 */
export function buildJetBrainsLafTheme(p) {
  const u = p.workbenchUi;
  const { editor, terminal, syntax, type } = p;
  const dark = type !== "light";

  const bg = editor.background;
  const fg = editor.foreground;
  const bg0 = p.ui.activityBar ?? uiGet(u, "activityBar.background", bg);
  const bg1 = p.ui.sidebar ?? uiGet(u, "sideBar.background", bg);
  const bg2 = p.ui.panel ?? uiGet(u, "panel.background", bg1);
  const bg3 = p.ui.tabInactive ?? uiGet(u, "tab.inactiveBackground", bg0);
  const tabActive = p.ui.tabActive ?? uiGet(u, "tab.activeBackground", bg2);
  const borderRaw = p.ui.border ?? uiGet(u, "sideBar.border", syntax.comment);
  const border = softenHexTowardBg(borderRaw, bg, {
    slug: p.slug,
    dark,
    strength: "chrome",
  });
  const separator = softenHexTowardBg(borderRaw, bg, {
    slug: p.slug,
    dark,
    strength: "guide",
  });
  const accent = p.ui.accent ?? uiGet(u, "focusBorder", syntax.function);
  const status = p.ui.statusBar ?? uiGet(u, "statusBar.background", bg0);
  const title = p.ui.titleBar ?? uiGet(u, "titleBar.activeBackground", bg0);
  const menu = uiGet(u, "menu.background", bg2);
  const input = uiGet(u, "input.background", bg2);
  const hover = uiGet(u, "list.hoverBackground", tabActive);
  const sel = editor.selection ?? uiGet(u, "list.activeSelectionBackground", accent);
  const ansi = terminal.ansi;
  const chrome = resolveChromeColors(u, { fg, bg, bg2, input, menu, hover, sel, syntax });

  const colors = {
    bg,
    bg0,
    bg1,
    bg2,
    bg3,
    fg,
    border,
    accent,
    selection: sel,
    lineHighlight: editor.lineHighlight ?? bg,
    status,
    title,
    menu,
    input,
    hover,
    ...chrome,
    black: ansi.black ?? "#1e1e1e",
    red: ansi.red ?? syntax.error,
    green: ansi.green ?? syntax.string,
    yellow: ansi.yellow ?? syntax.type,
    blue: ansi.blue ?? syntax.function,
    magenta: ansi.magenta ?? syntax.keyword,
    cyan: ansi.cyan ?? syntax.operator,
    white: ansi.white ?? fg,
    bright_red: ansi.brightRed ?? ansi.red,
    bright_green: ansi.brightGreen ?? ansi.green,
    bright_yellow: ansi.brightYellow ?? ansi.yellow,
    bright_blue: ansi.brightBlue ?? ansi.blue,
    bright_magenta: ansi.brightMagenta ?? ansi.magenta,
    bright_cyan: ansi.brightCyan ?? ansi.cyan,
    bright_white: ansi.brightWhite ?? fg,
    comment: syntax.comment,
    muted: syntax.comment,
    added: uiGet(u, "editorGutter.addedBackground", syntax.string),
    modified: uiGet(u, "editorGutter.modifiedBackground", syntax.type),
    deleted: uiGet(u, "editorGutter.deletedBackground", syntax.error),
    tabActive,
    scrollbar: softenHexTowardBg(
      uiGet(u, "scrollbarSlider.background", borderRaw),
      bg,
      { slug: p.slug, dark, strength: "guide" },
    ),
    scrollbarHover: softenHexTowardBg(
      uiGet(u, "scrollbarSlider.hoverBackground", borderRaw),
      bg,
      { slug: p.slug, dark, strength: "chrome" },
    ),
    notification: uiGet(u, "notifications.background", bg2),
    tooltip: uiGet(u, "editorHoverWidget.background", bg2),
    separator,
    terminalBg: terminal.background,
    terminalFg: terminal.foreground ?? fg,
  };

  const ui = {
    ...buildUiSection(colors, dark),
    ...buildIslandsUiOverlay(colors, dark),
  };

  return {
    name: p.name,
    dark,
    author: "dekidev (Dusk Office)",
    // Pas de parentTheme Islands : sinon l’IDE garde le schéma « Islands Dark »
    // (éditeur + terminal Reworked) au lieu de Dusk Office Finance / Terminal / …
    editorScheme: p.name,
    colors,
    ui,
    icons: {
      ColorPalette: {
        "Actions.Red": "red",
        "Actions.Yellow": "yellow",
        "Actions.Green": "green",
        "Actions.Blue": "blue",
        "Actions.Grey": "muted",
        "Objects.Red": "red",
        "Objects.Green": "green",
        "Objects.Blue": "blue",
        "Objects.Yellow": "yellow",
        "Objects.Purple": "magenta",
        "Objects.Pink": "bright_magenta",
        "Objects.Grey": "muted",
      },
    },
  };
}

/**
 * Coins arrondis « îlots » (IDE 2025.3+). Sans parentTheme Islands, l’UI reste rectangulaire.
 * @param {Record<string, string>} c
 * @param {boolean} dark
 */
function buildIslandsUiOverlay(c, dark) {
  const transparent = "#00000000";
  const mainWindowBg = dark
    ? mixHexRgb(c.bg, "#ffffff", 0.1)
    : mixHexRgb(c.bg, "#000000", 0.06);
  return {
    Islands: 1,
    "Island.arc": 20,
    "Island.arc.compact": 16,
    "Island.borderWidth": 5,
    "Island.borderWidth.compact": 4,
    "Island.borderColor": c.bg,
    "Island.inactiveAlpha": 0.44,
    "MainWindow.background": mainWindowBg,
    "StatusBar.borderColor": transparent,
    "ToolWindow.Stripe.borderColor": transparent,
    "MainToolbar.borderColor": transparent,
    "ToolWindow.background": c.bg,
    "ToolWindow.Header.background": c.bg,
    "ToolWindow.Header.inactiveBackground": c.bg,
    "EditorTabs.background": c.bg,
    "EditorTabs.underlinedTabBackground": c.tabActive,
    "EditorTabs.inactiveUnderlinedTabBackground": c.bg3,
    "EditorTabs.underlinedBorderColor": c.accent,
    "EditorTabs.inactiveUnderlinedTabBorderColor": c.border,
  };
}

/**
 * @param {Record<string, string>} c
 * @param {boolean} dark
 */
function buildUiSection(c, dark) {
  const selInactive = dark ? "bg3" : "bg1";
  return {
    "*": {
      background: "bg",
      borderColor: "border",
      foreground: "fg",
      disabledText: "muted",
      hoverBackground: "hover",
      infoForeground: "fg",
      lightSelectionBackground: "hover",
      selectedBackground: "selection",
      selectedForeground: "fg",
      selectedInactiveBackground: selInactive,
      selectionBackground: "selection",
      selectionForeground: "fg",
      selectionInactiveBackground: selInactive,
      separatorColor: "separator",
      "Borders.color": "border",
    },
    "ActionButton": {
      hoverBackground: "hover",
      pressedBackground: "bg3",
    },
    "Button": {
      startBackground: "input",
      endBackground: "input",
      startBorderColor: "border",
      endBorderColor: "border",
      default: {
        startBackground: "accent",
        endBackground: "accent",
        startBorderColor: "accent",
        endBorderColor: "accent",
        foreground: dark ? "bg" : "fg",
      },
    },
    "ComboBox": {
      nonEditableBackground: "dropdownBg",
      background: "dropdownBg",
      foreground: "dropdownFg",
      ArrowButton: {
        iconColor: "dropdownFg",
        disabledIconColor: "mutedFg",
      },
    },
    "Editor": {
      background: "bg",
      foreground: "fg",
    },
    "Console": {
      background: "terminalBg",
      foreground: "terminalFg",
      error: "red",
      userInput: "terminalFg",
      system: "muted",
    },
    "EditorTabs": {
      background: "bg0",
      foreground: "tabFg",
      selectedBackground: "tabActive",
      selectedForeground: "tabSelectedFg",
      inactiveBackground: "bg3",
      inactiveColoredFileBackground: "bg3",
      inactiveForeground: "tabInactiveFg",
      underlineColor: "accent",
      underlineInactiveColor: "border",
      borderColor: "border",
      hoverBackground: "hover",
      hoverColor: "tabHoverFg",
    },
    "EditorGroupsTabs": {
      background: "bg0",
      activeUnderlineColor: "accent",
      inactiveUnderlineColor: "border",
    },
    "EditorGutter": {
      background: "bg",
    },
    "ToolWindow": {
      background: "bg1",
      Header: {
        background: "bg0",
        inactiveBackground: "bg1",
      },
      HeaderTab: {
        selectedBackground: "bg2",
        selectedInactiveBackground: "bg3",
        hoverBackground: "hover",
        hoverInactiveBackground: "bg3",
      },
    },
    "StatusBar": {
      background: "status",
      foreground: "fg",
      borderColor: "border",
    },
    "TitleBar": {
      background: "title",
      inactiveBackground: "bg3",
      inactiveForeground: "muted",
      activeForeground: "fg",
    },
    "NavBar": {
      background: "bg1",
      borderColor: "border",
    },
    "Menu": {
      background: "menu",
      foreground: "menuFg",
      selectionBackground: "menuSel",
      selectionForeground: "menuSelFg",
      separatorColor: "separator",
    },
    "Popup": {
      background: "popup",
      foreground: "popupFg",
      borderColor: "border",
      separatorColor: "separator",
      paintBorder: true,
      Header: {
        activeBackground: "bg2",
        inactiveBackground: "popup",
      },
    },
    "PopupMenu": {
      background: "popup",
      foreground: "popupFg",
      borderColor: "border",
    },
    "List": {
      background: "bg1",
      foreground: "menuFg",
      selectionBackground: "menuSel",
      selectionForeground: "menuSelFg",
      selectionInactiveBackground: selInactive,
      hoverBackground: "hover",
      hoverForeground: "listHoverFg",
    },
    "Tree": {
      background: "bg1",
      foreground: "menuFg",
      selectionBackground: "menuSel",
      selectionForeground: "menuSelFg",
      selectionInactiveBackground: selInactive,
      hoverBackground: "hover",
    },
    "Table": {
      background: "bg",
      foreground: "menuFg",
      stripeColor: "bg2",
      lightSelectionBackground: "settingsRowHover",
      lightSelectionForeground: "listSelFg",
      lightSelectionInactiveBackground: "bg1",
      gridColor: "border",
    },
    "ScrollBar": {
      background: "scrollbar",
      hoverBackground: "scrollbarHover",
      thumb: "scrollbarHover",
      trackColor: "bg0",
    },
    "ProgressBar": {
      progressColor: "accent",
      indeterminateStartColor: "accent",
      indeterminateEndColor: "accent",
      trackColor: "bg2",
    },
    "Panel": {
      background: "bg2",
    },
    "Notification": {
      background: "notification",
      borderColor: "border",
      foreground: "fg",
    },
    "ToolTip": {
      background: "tooltip",
      foreground: "tooltipFg",
      borderColor: "border",
    },
    "CompletionPopup": {
      background: "suggestPopup",
      foreground: "popupFg",
      selectionBackground: "menuSel",
      selectionForeground: "menuSelFg",
    },
    "ParameterInfo": {
      background: "tooltip",
      foreground: "tooltipFg",
    },
    "SearchField": {
      background: "settingsInput",
      foreground: "settingsFg",
      borderColor: "border",
    },
    "TextField": {
      background: "settingsInput",
      foreground: "settingsFg",
      borderColor: "border",
    },
    "Link": {
      activeForeground: "accent",
      hoverForeground: "accent",
      pressedForeground: "accent",
      visitedForeground: "blue",
    },
    "FileColor": {
      Blue: `${c.blue}44`,
      Green: `${c.added}33`,
      Orange: `${c.modified}44`,
      Rose: `${c.deleted}44`,
      Yellow: `${c.yellow}33`,
      Violet: `${c.magenta}33`,
    },
    "VersionControl": {
      Log: {
        Commit: {
          currentBranchBackground: "bg2",
        },
      },
    },
    "Window": {
      border: "border",
    },
    "WelcomeScreen": {
      background: "bg",
      separatorColor: "border",
      Projects: {
        background: "bg0",
        selectionBackground: "selection",
        selectionInactiveBackground: "bg2",
      },
    },
    "RunWidget": {
      background: "bg2",
      foreground: "fg",
    },
    "DebuggerTabs": {
      selectedBackground: "bg2",
      underlineColor: "accent",
    },
    "Breadcrumb": {
      background: "bg",
      foreground: "fg",
      selectionBackground: "selection",
      selectionForeground: "fg",
      activeForeground: "accent",
    },
    "MemoryIndicator": {
      allocatedBackground: "bg0",
      usedBackground: "bg2",
    },
    "ValidationTooltip": {
      background: "notification",
      borderColor: "red",
    },
    "SpeedSearch": {
      background: "popup",
      foreground: "popupFg",
      borderColor: "accent",
    },
    "NewUi": {
      "MainToolbar.background": "bg0",
      "MainToolbar.borderColor": "border",
    },
    "MainToolBar": {
      background: "bg0",
      borderColor: "border",
    },
    "MainWindow": {
      background: "bg",
    },
    "TabbedPane": {
      background: "bg0",
      contentAreaColor: "bg0",
      selectedBackground: "bg2",
      selectedForeground: "tabSelectedFg",
      foreground: "tabInactiveFg",
      underlineColor: "accent",
    },
    "Separator": {
      separatorColor: "separator",
    },
    "Plugins": {
      background: "bg1",
      SectionHeader: {
        background: "bg0",
        foreground: "fg",
      },
    },
    "Settings": {
      background: "bg",
      foreground: "settingsFg",
      Category: {
        foreground: "settingsHeaderFg",
      },
    },
    "Counter": {
      background: "accent",
      foreground: dark ? "bg" : "fg",
    },
    "Badge": {
      background: "accent",
      foreground: dark ? "bg" : "fg",
    },
    "Component": {
      focusColor: "accent",
      focusedBorderColor: "accent",
      borderColor: "border",
    },
    "Group": {
      separatorColor: "separator",
    },
    "DragAndDrop": {
      areaBackground: "hover",
      areaForeground: "fg",
      areaBorderColor: "accent",
    },
    "InactiveText": {
      foreground: "muted",
    },
    "Label": {
      foreground: "fg",
      disabledForeground: "muted",
    },
    "CheckBox": {
      background: "checkboxBg",
      foreground: "checkboxFg",
      borderColor: "border",
    },
    "RadioButton": {
      background: "checkboxBg",
      foreground: "checkboxFg",
    },
    "CodeWithMe": {
      Avatar: {
        background: "bg2",
        foreground: "fg",
      },
    },
    "JetBrainsAI": {
      background: "bg2",
      foreground: "fg",
      "Button.background": "input",
      "Button.foreground": "fg",
      "Editor.background": "bg",
      "Editor.foreground": "fg",
      "Notification.background": "notification",
      "Notification.borderColor": "border",
      "ToolWindow.background": "bg1",
    },
    "MenuItem": {
      background: "menu",
      foreground: "menuFg",
      selectionBackground: "menuSel",
      selectionForeground: "menuSelFg",
      acceleratorForeground: "mutedFg",
      disabledForeground: "mutedFg",
    },
    "SearchEverywhere": {
      background: "quickInputBg",
      foreground: "quickInputFg",
      Header: {
        background: "bg0",
      },
      SearchField: {
        background: "settingsInput",
        borderColor: "border",
      },
      Tab: {
        selectedBackground: "menuSel",
        selectedForeground: "menuSelFg",
      },
      Advertiser: {
        foreground: "mutedFg",
      },
    },
    "ToolBar": {
      background: "bg0",
      foreground: "menuFg",
      borderColor: "border",
      hoverBackground: "menubarSelBg",
    },
    "GotItTooltip": {
      background: "tooltip",
      foreground: "fg",
      borderColor: "accent",
      Button: {
        foreground: dark ? "bg" : "fg",
        background: "accent",
      },
      linkForeground: "accent",
    },
    "Banner": {
      background: "notification",
      foreground: "fg",
      borderColor: "border",
      Info: {
        background: "notification",
        foreground: "fg",
        borderColor: "accent",
      },
      Warning: {
        background: "notification",
        foreground: "fg",
        borderColor: "yellow",
      },
      Error: {
        background: "notification",
        foreground: "fg",
        borderColor: "red",
      },
    },
    "Tag": {
      background: "bg2",
      foreground: "fg",
      borderColor: "border",
    },
    "Lesson": {
      background: "bg",
      foreground: "fg",
      Tooltip: {
        background: "tooltip",
        foreground: "fg",
        borderColor: "accent",
      },
    },
  };
}

/** UUID stable pour themeProvider @param {string} slug */
export function jetbrainsThemeProviderId(slug) {
  const h = createHash("sha1").update(`dusk-office-laf:${slug}`).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(12, 15)}-a${h.slice(15, 18)}-${h.slice(18, 30)}`;
}
