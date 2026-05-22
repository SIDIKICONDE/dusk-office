/**
 * VS Code Settings UI tokens for light themes.
 *
 * dusk.json defines dark `settings.*` values. Light themes include dusk.json and
 * must override these or dropdowns / focused rows become unreadable (light text on
 * light popup, dark controls on a pale page).
 */

/**
 * @param {{
 *   surface?: string;
 *   surfaceElevated?: string;
 *   foreground?: string;
 *   border?: string;
 *   listBorder?: string;
 *   accentSoft?: string;
 *   headerForeground?: string;
 *   modifiedIndicator?: string;
 *   headerHoverForeground?: string;
 * }} [palette]
 * @returns {Record<string, string>}
 */
export function lightSettingsUiOverrides(palette = {}) {
  const {
    surface = "#f1f5f9",
    surfaceElevated = "#e2e8f0",
    foreground = "#0f172a",
    border = "#3d5a6a59",
    listBorder = "#94a3b8aa",
    accentSoft = "#06b6d4",
    headerForeground = "#334155",
    modifiedIndicator = "#c9a85c44",
    headerHoverForeground = "#0369a1",
  } = palette;

  return {
    "settings.headerForeground": headerForeground,
    "settings.modifiedItemIndicator": modifiedIndicator,
    "settings.settingsHeaderHoverForeground": headerHoverForeground,
    "settings.dropdownBackground": surface,
    "settings.dropdownForeground": foreground,
    "settings.dropdownBorder": border,
    "settings.dropdownListBorder": listBorder,
    "settings.checkboxBackground": surface,
    "settings.checkboxForeground": foreground,
    "settings.checkboxBorder": border,
    "settings.textInputBackground": "#ffffff",
    "settings.textInputForeground": foreground,
    "settings.textInputBorder": border,
    "settings.numberInputBackground": "#ffffff",
    "settings.numberInputForeground": foreground,
    "settings.numberInputBorder": border,
    "settings.focusedRowBackground": `${accentSoft}18`,
    "settings.rowHoverBackground": `${accentSoft}0d`,
    "settings.focusedRowBorder": `${accentSoft}44`,
    "settings.sashBorder": listBorder,
    /** Popup elevation — same hue as dropdown, slightly darker than the row control. */
    "dropdown.listBackground": surfaceElevated,
    "quickInputList.focusForeground": foreground,
  };
}

/**
 * Command Center, toolbar action lists (chat panel header menus), and menu chrome.
 * dusk.json sets #d1e0e8 foregrounds — invisible on light surfaces when hovered.
 *
 * @param {{
 *   foreground?: string;
 *   mutedForeground?: string;
 *   headerForeground?: string;
 *   menuSurface?: string;
 *   accentSoft?: string;
 *   listBorder?: string;
 *   accentBorder?: string;
 *   focusIcon?: string;
 * }} [palette]
 * @returns {Record<string, string>}
 */
export function lightChromeUiOverrides(palette = {}) {
  const {
    foreground = "#0f172a",
    mutedForeground = "#64748bdd",
    headerForeground = "#334155",
    menuSurface = "#ffffff",
    accentSoft = "#06b6d4",
    listBorder = "#94a3b8aa",
    accentBorder = "#0ea5e9cc",
    focusIcon = "#0369a1",
  } = palette;

  return {
    "commandCenter.foreground": headerForeground,
    "commandCenter.activeForeground": foreground,
    "commandCenter.inactiveForeground": mutedForeground,
    "commandCenter.activeBackground": `${accentSoft}22`,
    "commandCenter.activeBorder": accentBorder,
    "commandCenter.inactiveBorder": listBorder,
    "editorActionList.background": menuSurface,
    "editorActionList.foreground": foreground,
    "editorActionList.focusBackground": `${accentSoft}33`,
    "editorActionList.focusForeground": foreground,
    /** dusk.json → #d1e0e8 : invisible on light menu / submenu popups. */
    "menu.foreground": foreground,
    "menu.selectionForeground": foreground,
    "menubar.selectionForeground": foreground,
    "quickInput.foreground": foreground,
    "editorWidget.background": menuSurface,
    "editorWidget.foreground": foreground,
    "editorWidget.border": listBorder,
    "editorWidget.resizeBorder": `${accentSoft}44`,
    "inputOption.activeForeground": foreground,
    "inputOption.hoverBackground": `${accentSoft}22`,
    "menu.separatorBackground": listBorder,
    "menu.selectionBorder": `${accentSoft}44`,
    "menubar.selectionBorder": `${accentSoft}44`,
    "quickInputList.focusIconForeground": focusIcon,
    "keybindingLabel.foreground": foreground,
    "keybindingLabel.background": `${accentSoft}18`,
    "keybindingLabel.border": listBorder,
    "keybindingLabel.bottomBorder": listBorder,
  };
}

/**
 * Tab hover/selected states — dusk.json sets tab.hoverForeground / tab.selectedForeground
 * to #d1e0e8 (invisible on light tab hover backgrounds).
 *
 * @param {{
 *   foreground?: string;
 *   inactiveForeground?: string;
 *   unfocusedInactiveForeground?: string;
 *   surface?: string;
 *   border?: string;
 *   accentBorder?: string;
 *   accentSoft?: string;
 * }} [palette]
 * @returns {Record<string, string>}
 */
export function lightTabUiOverrides(palette = {}) {
  const {
    foreground = "#0f172a",
    inactiveForeground = "#475569dd",
    unfocusedInactiveForeground = "#64748b55",
    surface = "#f1f5f9",
    border = "#94a3b8b8",
    accentBorder = "#0ea5e9cc",
    accentSoft = "#06b6d4",
  } = palette;

  return {
    "tab.hoverForeground": foreground,
    "tab.selectedForeground": foreground,
    "tab.unfocusedInactiveForeground": unfocusedInactiveForeground,
    "tab.unfocusedActiveBackground": surface,
    "tab.selectedBackground": surface,
    "tab.border": border,
    "tab.activeBorderTop": accentBorder,
    "tab.unfocusedActiveBorderTop": `${accentSoft}44`,
    "tab.selectedBorderTop": accentBorder,
    "tab.dragAndDropBorder": accentBorder,
  };
}

/** Default Dusk Office Light palette. */
export const LIGHT_SETTINGS_UI = lightSettingsUiOverrides();

/** Default Dusk Office Light chrome (chat header menus, command center). */
export const LIGHT_CHROME_UI = lightChromeUiOverrides();

/** Tab hover/selected foregrounds for Light. */
export const LIGHT_TAB_UI = lightTabUiOverrides();

/** Warm Ivory palette (cream surfaces, amber accent). */
export const IVOIRE_CHROME_UI = lightChromeUiOverrides({
  foreground: "#2a2420",
  mutedForeground: "#6b5f50dd",
  headerForeground: "#3d352c",
  menuSurface: "#f6eede",
  accentSoft: "#c98962",
  listBorder: "#8a7a6aaa",
  accentBorder: "#92400ecc",
  focusIcon: "#92400e",
});

export const IVOIRE_TAB_UI = lightTabUiOverrides({
  foreground: "#2a2420",
  inactiveForeground: "#4a4036ee",
  unfocusedInactiveForeground: "#6b5f5055",
  surface: "#efe6d8",
  border: "#8a7a6ab8",
  accentBorder: "#92400ecc",
  accentSoft: "#c98962",
});

export const IVOIRE_SETTINGS_UI = lightSettingsUiOverrides({
  surface: "#efe6d8",
  surfaceElevated: "#ddd3c4",
  foreground: "#2a2420",
  border: "#8a7a6a59",
  listBorder: "#8a7a6aaa",
  accentSoft: "#c98962",
  headerForeground: "#3d352c",
  modifiedIndicator: "#b4530944",
  headerHoverForeground: "#92400e",
});

/** Audit — slate / compliance blue. */
export const AUDIT_CHROME_UI = lightChromeUiOverrides({
  foreground: "#25313a",
  mutedForeground: "#475868dd",
  headerForeground: "#4c5f7b",
  menuSurface: "#ffffff",
  accentSoft: "#556f83",
  listBorder: "#8d8b84aa",
  accentBorder: "#556f83cc",
  focusIcon: "#3e5565",
});

export const AUDIT_SETTINGS_UI = lightSettingsUiOverrides({
  surface: "#e4eaef",
  surfaceElevated: "#dde4e9",
  foreground: "#25313a",
  border: "#8d8b8459",
  listBorder: "#8d8b84aa",
  accentSoft: "#556f83",
  headerForeground: "#25313a",
  modifiedIndicator: "#556f83",
  headerHoverForeground: "#3e5565",
});

export const AUDIT_TAB_UI = lightTabUiOverrides({
  foreground: "#25313a",
  inactiveForeground: "#25313add",
  unfocusedInactiveForeground: "#47586855",
  surface: "#eef2f8",
  border: "#8d8b84b8",
  accentBorder: "#556f83cc",
  accentSoft: "#556f83",
});

/** Ledger — warm ledger paper. */
export const LEDGER_CHROME_UI = lightChromeUiOverrides({
  foreground: "#24313a",
  mutedForeground: "#475868dd",
  headerForeground: "#24313a",
  menuSurface: "#ffffff",
  accentSoft: "#658297",
  listBorder: "#8c8a82aa",
  accentBorder: "#3e5d73cc",
  focusIcon: "#3e5d73",
});

export const LEDGER_SETTINGS_UI = lightSettingsUiOverrides({
  surface: "#efeae2",
  surfaceElevated: "#e8e2d9",
  foreground: "#24313a",
  border: "#8c8a8259",
  listBorder: "#8c8a82aa",
  accentSoft: "#658297",
  headerForeground: "#24313a",
  modifiedIndicator: "#658297",
  headerHoverForeground: "#3e5d73",
});

export const LEDGER_TAB_UI = lightTabUiOverrides({
  foreground: "#24313a",
  inactiveForeground: "#24313add",
  unfocusedInactiveForeground: "#47586855",
  surface: "#efeae2",
  border: "#8c8a82b8",
  accentBorder: "#3e5d73cc",
  accentSoft: "#658297",
});
