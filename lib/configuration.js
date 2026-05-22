const vscode = require("vscode");
const {
  computeAutoSwitchTheme,
  computeAdaptiveFocusTheme,
  resolveEffectiveColorTheme,
} = require("./theme-common.js");
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
  return {
    enabled: config.get("autoSwitch.enabled", false),
    darkTheme: config.get("autoSwitch.darkTheme", "Dusk Office Midnight"),
    lightTheme: config.get("autoSwitch.lightTheme", "Dusk Office Light"),
    darkHour: config.get("autoSwitch.darkHour", 18),
    lightHour: config.get("autoSwitch.lightHour", 7),
  };
}

function getAutoSwitchTheme(now = new Date()) {
  return computeAutoSwitchTheme(getAutoSwitchConfig(), now);
}

function getAdaptiveFocusConfig() {
  const config = getExtensionConfig();
  return {
    enabled: config.get("adaptiveFocus.enabled", false),
    onlyWhenDuskThemeActive: config.get("adaptiveFocus.onlyWhenDuskThemeActive", true),
    lateNightEyeComfort: config.get("adaptiveFocus.lateNightEyeComfort", true),
    lateNightStartHour: config.get("adaptiveFocus.lateNightStartHour", 22),
    lateNightEndHour: config.get("adaptiveFocus.lateNightEndHour", 5),
    lockTheme: config.get("adaptiveFocus.lockTheme", ""),
    dayStartHour: config.get("adaptiveFocus.dayStartHour", 7),
    dayEndHour: config.get("adaptiveFocus.dayEndHour", 18),
    defaultLightTheme: config.get("adaptiveFocus.defaultLightTheme", "Dusk Office Ivory"),
    defaultDarkTheme: config.get("adaptiveFocus.defaultDarkTheme", "Dusk Office Midnight"),
    languageOverrides: config.get("adaptiveFocus.languageOverrides", {}),
  };
}

function getFavoriteThemeSetting() {
  const value = getExtensionConfig().get("favoriteTheme", "");
  return typeof value === "string" ? value : "";
}

function resolveAdaptiveFocusTheme(languageId, now = new Date(), options = {}) {
  return computeAdaptiveFocusTheme(languageId, now, options, getAdaptiveFocusConfig());
}

function getWorkspaceThemeMemoryEnabled() {
  return getExtensionConfig().get("rememberWorkspaceTheme", true);
}

function getApplyFavoriteOnStartupEnabled() {
  return getExtensionConfig().get("applyFavoriteOnStartup", false);
}

function getStatusBarEnabled() {
  return getExtensionConfig().get("statusBar.enabled", true);
}

function getTitleBarAlignWithThemeEnabled() {
  return getExtensionConfig().get("titleBar.alignWithTheme", true);
}

function getWorkspaceFingerprintEnabled() {
  return getExtensionConfig().get("workspaceFingerprint.enabled", true);
}

function getEditorAnsiEnabled() {
  return getExtensionConfig().get("editorAnsi.enabled", true);
}

function getEditorAnsiAllLanguages() {
  return getExtensionConfig().get("editorAnsi.allLanguages", true);
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
  getFavoriteThemeSetting,
};
