const vscode = require("vscode");
const {
  computeAutoSwitchTheme,
  computeAdaptiveFocusTheme,
  resolveEffectiveColorTheme,
  sanitizeAutoSwitchConfig,
  sanitizeAdaptiveFocusConfig,
  coerceBoolean,
  coerceOptionalDuskTheme,
  stripThemeDisplayLabel,
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
  const raw = resolveEffectiveColorTheme({
    autoDetectColorScheme: windowCfg.get("autoDetectColorScheme"),
    activeThemeKind: vscode.window.activeColorTheme?.kind,
    colorTheme: workbench.get("colorTheme"),
    preferredLightColorTheme: workbench.get("preferredLightColorTheme"),
    preferredDarkColorTheme: workbench.get("preferredDarkColorTheme"),
    ColorThemeKind: vscode.ColorThemeKind,
  });
  return stripThemeDisplayLabel(raw);
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

/**
 * Decide which scope a write belongs to.
 *
 * A value the user set at any level is respected: if it exists at workspace or
 * folder scope, write there rather than promoting it to their global settings. The
 * folder case used to be missed because only `workspaceValue` was consulted, so in a
 * multi-root workspace a folder-scoped preference was overwritten globally and then
 * applied to every other window.
 */
function getConfigTarget(config, key) {
  const inspected = config.inspect(key);
  if (vscode.workspace.workspaceFolders?.length) {
    if (inspected?.workspaceValue !== undefined) {
      return vscode.ConfigurationTarget.Workspace;
    }
    if (inspected?.workspaceFolderValue !== undefined) {
      return vscode.ConfigurationTarget.WorkspaceFolder;
    }
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

/**
 * Workspace memory is opt-in. It is the only automatic theme writer, so a `true`
 * default would pin a Dusk variant on every launch with no consent — and because
 * "Reset all Dusk Office settings" writes `undefined` for this key, a `true`
 * default would also re-arm the behaviour the reset dialog claims to clear.
 */
function getWorkspaceThemeMemoryEnabled() {
  return coerceBoolean(getExtensionConfig().get("rememberWorkspaceTheme"), false);
}

function getApplyFavoriteOnStartupEnabled() {
  return coerceBoolean(getExtensionConfig().get("applyFavoriteOnStartup"), false);
}

function getStatusBarEnabled() {
  return coerceBoolean(getExtensionConfig().get("statusBar.enabled"), true);
}

/**
 * Read-time fallback for the pre-1.5.6 defaults of `titleBar.alignWithTheme` and
 * `editorAnsi.allLanguages`. Profiles created before those settings became opt-in
 * keep the old behaviour, but nothing is written to the user's settings.json —
 * a real value always wins, and turning the setting off sticks.
 */
function coerceLegacyDefault(key, fallback, legacyFallback) {
  const config = getExtensionConfig();
  const inspected = config.inspect(key);
  const explicitlySet =
    inspected?.globalValue !== undefined ||
    inspected?.workspaceValue !== undefined ||
    inspected?.workspaceFolderValue !== undefined;
  if (explicitlySet || !state.legacyProfileDefaults) {
    return coerceBoolean(config.get(key), fallback);
  }
  return legacyFallback;
}

function getTitleBarAlignWithThemeEnabled() {
  return coerceLegacyDefault("titleBar.alignWithTheme", false, true);
}

function getWorkspaceFingerprintEnabled() {
  return coerceBoolean(getExtensionConfig().get("workspaceFingerprint.enabled"), true);
}

function getEditorAnsiEnabled() {
  return coerceBoolean(getExtensionConfig().get("editorAnsi.enabled"), true);
}

function getEditorAnsiAllLanguages() {
  return coerceLegacyDefault("editorAnsi.allLanguages", false, true);
}

/**
 * Line/length scan limits. `0` is the documented "no limit" sentinel, so the value is
 * passed through as-is when it is a non-negative number; the caller maps `0` to
 * Infinity. A negative or non-numeric value falls back to the default.
 */
function getEditorAnsiMaxLineCount() {
  const raw = getExtensionConfig().get("editorAnsi.maxLineCount");
  return typeof raw === "number" && raw >= 0 ? raw : 12000;
}

function getEditorAnsiMaxLineLength() {
  const raw = getExtensionConfig().get("editorAnsi.maxLineLength");
  return typeof raw === "number" && raw >= 0 ? raw : 32768;
}

function getEditorAnsiLanguageIds() {
  const raw = getExtensionConfig().get("editorAnsi.languageIds");
  return Array.isArray(raw) ? raw : ["log", "ansi"];
}

function getEditorAnsiDimEscapeSequences() {
  return coerceBoolean(getExtensionConfig().get("editorAnsi.dimEscapeSequences"), true);
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
  getEditorAnsiMaxLineCount,
  getEditorAnsiMaxLineLength,
  getEditorAnsiLanguageIds,
  getEditorAnsiDimEscapeSequences,
  getSyntaxItalicComments,
  getSyntaxBoldKeywords,
  getFavoriteThemeSetting,
};
