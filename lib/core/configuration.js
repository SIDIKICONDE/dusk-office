const vscode = require("vscode");
const {
  computeAutoSwitchTheme,
  computeAdaptiveFocusTheme,
  resolveEffectiveColorTheme,
  sanitizeAutoSwitchConfig,
  sanitizeAdaptiveFocusConfig,
  coerceBoolean,
  coerceOptionalDuskTheme,
} = require("../themes/theme-common.js");
const state = require("./extension-state.js");

function getExtensionConfig() {
  return vscode.workspace.getConfiguration("duskOffice");
}

function getWorkbenchConfig() {
  return vscode.workspace.getConfiguration("workbench");
}

function getWindowConfig() {
  return vscode.workspace.getConfiguration("window");
}

function getCurrentTheme() {
  const workbench = getWorkbenchConfig();
  const windowCfg = getWindowConfig();
  return resolveEffectiveColorTheme({
    autoDetectColorScheme: windowCfg.get("autoDetectColorScheme"),
    activeThemeKind: vscode.window.activeColorTheme?.kind,
    colorTheme: workbench.get("colorTheme"),
    preferredLightColorTheme: workbench.get("preferredLightColorTheme"),
    preferredDarkColorTheme: workbench.get("preferredDarkColorTheme"),
    ColorThemeKind: vscode.ColorThemeKind,
  });
}

function getActivityBarLocation() {
  return getWorkbenchConfig().get("activityBar.location");
}

function getProductIconTheme() {
  return getWorkbenchConfig().get("productIconTheme");
}

function areDuskIconsEnabled() {
  if (!state.duskProductIconThemeId) return false;
  return getProductIconTheme() === state.duskProductIconThemeId;
}

function storedSettingValue(value, unsetSentinel) {
  if (value === undefined || value === null || value === "" || value === "Default") {
    return unsetSentinel;
  }
  return value;
}

function getConfigTarget(config, key) {
  const inspected = config.inspect(key);
  if (vscode.workspace.workspaceFolders?.length && inspected?.workspaceValue !== undefined) {
    return vscode.ConfigurationTarget.Workspace;
  }
  return vscode.ConfigurationTarget.Global;
}

async function updateConfigValue(config, key, value) {
  const target = getConfigTarget(config, key);
  await config.update(key, value, target);
  return target;
}

function createStoredSettingSnapshot(target, value, unsetSentinel) {
  return {
    target: target === vscode.ConfigurationTarget.Workspace ? "workspace" : "global",
    value: storedSettingValue(value, unsetSentinel),
  };
}

function readStoredSettingSnapshot(stored, unsetSentinel) {
  if (stored && typeof stored === "object" && !Array.isArray(stored)) {
    return {
      target:
        stored.target === "workspace"
          ? vscode.ConfigurationTarget.Workspace
          : vscode.ConfigurationTarget.Global,
      value: stored.value === unsetSentinel ? undefined : stored.value,
    };
  }
  return {
    target: vscode.ConfigurationTarget.Global,
    value: stored === unsetSentinel ? undefined : stored,
  };
}

function getAutoSwitchConfig() {
  const config = getExtensionConfig();
  return sanitizeAutoSwitchConfig({
    enabled: config.get("autoSwitch.enabled"),
    darkTheme: config.get("autoSwitch.darkTheme"),
    lightTheme: config.get("autoSwitch.lightTheme"),
    darkHour: config.get("autoSwitch.darkHour"),
    lightHour: config.get("autoSwitch.lightHour"),
    timezone: config.get("autoSwitch.timezone"),
  });
}

function getAutoSwitchTheme(now = new Date()) {
  return computeAutoSwitchTheme(getAutoSwitchConfig(), now);
}

function getAdaptiveFocusConfig() {
  const config = getExtensionConfig();
  const scheduleTimezone = config.get("autoSwitch.timezone");
  return sanitizeAdaptiveFocusConfig({
    enabled: config.get("adaptiveFocus.enabled"),
    onlyWhenDuskThemeActive: config.get("adaptiveFocus.onlyWhenDuskThemeActive"),
    lateNightEyeComfort: config.get("adaptiveFocus.lateNightEyeComfort"),
    lateNightStartHour: config.get("adaptiveFocus.lateNightStartHour"),
    lateNightEndHour: config.get("adaptiveFocus.lateNightEndHour"),
    lockTheme: config.get("adaptiveFocus.lockTheme"),
    dayStartHour: config.get("adaptiveFocus.dayStartHour"),
    dayEndHour: config.get("adaptiveFocus.dayEndHour"),
    defaultLightTheme: config.get("adaptiveFocus.defaultLightTheme"),
    defaultDarkTheme: config.get("adaptiveFocus.defaultDarkTheme"),
    languageOverrides: config.get("adaptiveFocus.languageOverrides"),
  }, scheduleTimezone);
}

function getFavoriteThemeSetting() {
  return coerceOptionalDuskTheme(getExtensionConfig().get("favoriteTheme"));
}

function resolveAdaptiveFocusTheme(languageId, now = new Date(), options = {}) {
  return computeAdaptiveFocusTheme(languageId, now, options, getAdaptiveFocusConfig());
}

function getWorkspaceThemeMemoryEnabled() {
  return coerceBoolean(getExtensionConfig().get("rememberWorkspaceTheme"), true);
}

function getApplyFavoriteOnStartupEnabled() {
  return coerceBoolean(getExtensionConfig().get("applyFavoriteOnStartup"), false);
}

function getStatusBarEnabled() {
  return coerceBoolean(getExtensionConfig().get("statusBar.enabled"), true);
}

function getTitleBarAlignWithThemeEnabled() {
  return coerceBoolean(getExtensionConfig().get("titleBar.alignWithTheme"), true);
}

function getWorkspaceFingerprintEnabled() {
  return coerceBoolean(getExtensionConfig().get("workspaceFingerprint.enabled"), true);
}

function getEditorAnsiEnabled() {
  return coerceBoolean(getExtensionConfig().get("editorAnsi.enabled"), true);
}

function getEditorAnsiAllLanguages() {
  return coerceBoolean(getExtensionConfig().get("editorAnsi.allLanguages"), true);
}

function getSyntaxItalicComments() {
  return coerceBoolean(getExtensionConfig().get("syntax.italicComments"), true);
}

function getSyntaxBoldKeywords() {
  return coerceBoolean(getExtensionConfig().get("syntax.boldKeywords"), false);
}

module.exports = {
  getExtensionConfig,
  getWorkbenchConfig,
  getWindowConfig,
  getCurrentTheme,
  getActivityBarLocation,
  getProductIconTheme,
  areDuskIconsEnabled,
  storedSettingValue,
  getConfigTarget,
  updateConfigValue,
  createStoredSettingSnapshot,
  readStoredSettingSnapshot,
  getAutoSwitchConfig,
  getAutoSwitchTheme,
  getAdaptiveFocusConfig,
  resolveAdaptiveFocusTheme,
  getWorkspaceThemeMemoryEnabled,
  getApplyFavoriteOnStartupEnabled,
  getStatusBarEnabled,
  getTitleBarAlignWithThemeEnabled,
  getWorkspaceFingerprintEnabled,
  getEditorAnsiEnabled,
  getEditorAnsiAllLanguages,
  getSyntaxItalicComments,
  getSyntaxBoldKeywords,
  getFavoriteThemeSetting,
};
