const fs = require("fs");
const path = require("path");
const vscode = require("vscode");

const THEME_VARIANTS = [
  "Dusk Office",
  "Dusk Office Abyss",
  "Dusk Office Dawn",
  "Dusk Office Bay",
  "Dusk Office Mist",
  "Dusk Office Ash",
  "Dusk Office Midnight",
  "Dusk Office Nebula",
  "Dusk Office Reef",
  "Dusk Office High Contrast",
  "Dusk Office Light",
  "Dusk Office Ivory",
  "Dusk Office Dark Ivory",
  "Dusk Office Nocturne",
  "Dusk Office Finance",
  "Dusk Office Corporate",
  "Dusk Office Voltage",
  "Dusk Office Neon",
  "Dusk Office Luxe",
  "Dusk Office Terminal",
  "Dusk Office Steward",
  "Dusk Office Ledger",
  "Dusk Office Secure",
  "Dusk Office Vault",
  "Dusk Office Audit",
  "Dusk Office Sentinel",
];

const PREVIOUS_THEME_KEY = "duskOffice.previousTheme";
const FAVORITE_THEME_KEY = "duskOffice.favoriteTheme";
const WORKSPACE_THEME_KEY = "duskOffice.workspaceTheme";
/** Set once a fingerprint suggestion has been shown for the workspace (any decision: accept/dismiss/explore). */
const WORKSPACE_FINGERPRINT_KEY = "duskOffice.workspaceFingerprintShown";
/** Stored global `window.titleBarStyle` before forcing `custom`; `__unset__` = no user global (restore with undefined). */
const PREVIOUS_TITLE_BAR_GLOBAL_KEY = "duskOffice.previousTitleBarStyleGlobal";
const PREVIOUS_TITLE_BAR_GLOBAL_UNSET = "__duskOfficeUnset__";
/** Global `workbench.productIconTheme` before applying Dusk product icons; UNSET = was default / empty. */
const PREVIOUS_PRODUCT_ICON_KEY = "duskOffice.previousProductIconTheme";
const PREVIOUS_PRODUCT_ICON_UNSET = "__duskOfficeUnset__";
/** Set in activate from `contributes.productIconThemes[].id` (the setting value used by VS Code). */
let duskProductIconThemeId = "";
const STATUS_BAR_PRIORITY = 100;
let ignoreTitleBarStyleConfigChange = false;
const MIN_TERMINAL_FG_RATIO = 4.5;
const MIN_TERMINAL_ANSI_RATIO = 2.9;
const SKIP_ANSI_KEYS = new Set(["terminal.ansiBlack", "terminal.ansiBrightBlack"]);
const TERMINAL_ANSI_KEYS = [
  "terminal.foreground",
  "terminal.ansiBlack",
  "terminal.ansiRed",
  "terminal.ansiGreen",
  "terminal.ansiYellow",
  "terminal.ansiBlue",
  "terminal.ansiMagenta",
  "terminal.ansiCyan",
  "terminal.ansiWhite",
  "terminal.ansiBrightBlack",
  "terminal.ansiBrightRed",
  "terminal.ansiBrightGreen",
  "terminal.ansiBrightYellow",
  "terminal.ansiBrightBlue",
  "terminal.ansiBrightMagenta",
  "terminal.ansiBrightCyan",
  "terminal.ansiBrightWhite",
];
const ADAPTIVE_LANGUAGE_RULES = {
  markdown: { light: "Dusk Office Ivory", dark: "Dusk Office Nocturne" },
  mdx: { light: "Dusk Office Ivory", dark: "Dusk Office Nocturne" },
  dart: { light: "Dusk Office Light", dark: "Dusk Office Bay" },
  flutter: { light: "Dusk Office Light", dark: "Dusk Office Bay" },
  typescript: { light: "Dusk Office Ivory", dark: "Dusk Office Nebula" },
  javascript: { light: "Dusk Office Ivory", dark: "Dusk Office Nebula" },
  json: { light: "Dusk Office Ivory", dark: "Dusk Office Ash" },
  yaml: { light: "Dusk Office Ivory", dark: "Dusk Office Ash" },
  yml: { light: "Dusk Office Ivory", dark: "Dusk Office Ash" },
  shellscript: { light: "Dusk Office Ivory", dark: "Dusk Office Finance" },
  shell: { light: "Dusk Office Ivory", dark: "Dusk Office Finance" },
  bash: { light: "Dusk Office Ivory", dark: "Dusk Office Finance" },
  zsh: { light: "Dusk Office Ivory", dark: "Dusk Office Finance" },
  python: { light: "Dusk Office Ivory", dark: "Dusk Office Abyss" },
  go: { light: "Dusk Office Ivory", dark: "Dusk Office Reef" },
  rust: { light: "Dusk Office Ivory", dark: "Dusk Office Corporate" },
  html: { light: "Dusk Office Ivory", dark: "Dusk Office Dawn" },
  css: { light: "Dusk Office Ivory", dark: "Dusk Office Nebula" },
  sql: { light: "Dusk Office Ivory", dark: "Dusk Office Finance" },
  ruby: { light: "Dusk Office Ivory", dark: "Dusk Office Nocturne" },
  java: { light: "Dusk Office Light", dark: "Dusk Office Corporate" },
  cpp: { light: "Dusk Office Light", dark: "Dusk Office Reef" },
  c: { light: "Dusk Office Light", dark: "Dusk Office Reef" },
  swift: { light: "Dusk Office Ivory", dark: "Dusk Office Midnight" },
  kotlin: { light: "Dusk Office Light", dark: "Dusk Office Bay" },
};

function getExtensionConfig() {
  return vscode.workspace.getConfiguration("duskOffice");
}

function getWorkbenchConfig() {
  return vscode.workspace.getConfiguration("workbench");
}

function getCurrentTheme() {
  return getWorkbenchConfig().get("colorTheme");
}

function getActivityBarLocation() {
  return getWorkbenchConfig().get("activityBar.location");
}

function getProductIconTheme() {
  return getWorkbenchConfig().get("productIconTheme");
}

function areDuskIconsEnabled() {
  if (!duskProductIconThemeId) return false;
  return getProductIconTheme() === duskProductIconThemeId;
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

function isDuskTheme(theme) {
  return typeof theme === "string" && THEME_VARIANTS.includes(theme);
}

function isThemeName(theme) {
  return typeof theme === "string" && theme.trim().length > 0;
}

function cleanPickedLabel(label) {
  return label.replace(/^\$\(check\)\s+/, "").trim();
}

function luminance(rgb) {
  const linear = (value) => {
    const normalized = value / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  };
  const red = linear(rgb.r);
  const green = linear(rgb.g);
  const blue = linear(rgb.b);
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrastRatio(l1, l2) {
  const light = Math.max(l1, l2);
  const dark = Math.min(l1, l2);
  return (light + 0.05) / (dark + 0.05);
}

function parseColor(colorValue) {
  if (typeof colorValue !== "string" || !colorValue.startsWith("#")) return null;
  let hex = colorValue.slice(1);
  if (/^[0-9a-fA-F]{3}$/.test(hex)) {
    hex = [...hex].map((ch) => ch + ch).join("");
  }
  if (/^[0-9a-fA-F]{6}$/.test(hex)) {
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
    };
  }
  if (/^[0-9a-fA-F]{8}$/.test(hex)) {
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
      alpha: hex.slice(6, 8),
    };
  }
  return null;
}

function compositeColor(fg, alpha, bg) {
  const a = Math.max(0, Math.min(1, alpha));
  return {
    r: Math.round(fg.r * a + bg.r * (1 - a)),
    g: Math.round(fg.g * a + bg.g * (1 - a)),
    b: Math.round(fg.b * a + bg.b * (1 - a)),
  };
}

function terminalBackgroundRgb(colorValue) {
  const parsed = parseColor(colorValue);
  if (!parsed) return null;
  if (parsed.alpha != null) {
    const alpha = parseInt(parsed.alpha, 16) / 255;
    const colorLum = luminance({ r: parsed.r, g: parsed.g, b: parsed.b });
    const under = colorLum < 0.2 ? { r: 0, g: 0, b: 0 } : { r: 255, g: 255, b: 255 };
    return compositeColor({ r: parsed.r, g: parsed.g, b: parsed.b }, alpha, under);
  }
  return { r: parsed.r, g: parsed.g, b: parsed.b };
}

function effectiveForegroundRgb(colorValue, bgRgb) {
  const parsed = parseColor(colorValue);
  if (!parsed) return null;
  if (parsed.alpha != null) {
    const alpha = parseInt(parsed.alpha, 16) / 255;
    return compositeColor({ r: parsed.r, g: parsed.g, b: parsed.b }, alpha, bgRgb);
  }
  return { r: parsed.r, g: parsed.g, b: parsed.b };
}

function readThemeJson(themeFilePath) {
  return JSON.parse(fs.readFileSync(themeFilePath, "utf8"));
}

function mergeThemeColors(themeFilePath, seen = new Set()) {
  const normalized = path.normalize(themeFilePath);
  if (seen.has(normalized)) {
    throw new Error(`Circular include chain detected: ${[...seen, normalized].join(" -> ")}`);
  }
  seen.add(normalized);

  const themeJson = readThemeJson(themeFilePath);
  let baseColors = {};
  if (typeof themeJson.include === "string" && themeJson.include.length > 0) {
    const parentFilePath = path.resolve(path.dirname(themeFilePath), themeJson.include);
    if (!fs.existsSync(parentFilePath)) {
      throw new Error(`Missing include file: ${themeJson.include}`);
    }
    baseColors = mergeThemeColors(parentFilePath, seen);
  }
  return {
    ...baseColors,
    ...(themeJson.colors && typeof themeJson.colors === "object" ? themeJson.colors : {}),
  };
}

function checkTerminalContrast(colors, uiTheme) {
  const failures = [];
  const bgValue = colors["terminal.background"];
  if (typeof bgValue !== "string") {
    failures.push("terminal.background is missing");
    return failures;
  }

  const bgRgb = terminalBackgroundRgb(bgValue);
  if (!bgRgb) {
    failures.push(`terminal.background is invalid (${bgValue})`);
    return failures;
  }
  const bgLum = luminance(bgRgb);

  const fgValue = colors["terminal.foreground"];
  if (typeof fgValue === "string") {
    const fgRgb = effectiveForegroundRgb(fgValue, bgRgb);
    if (fgRgb) {
      const ratio = contrastRatio(luminance(fgRgb), bgLum);
      if (ratio < MIN_TERMINAL_FG_RATIO) {
        failures.push(
          `terminal.foreground ${fgValue} vs terminal.background ${bgValue}: ${ratio.toFixed(2)}:1 (min ${MIN_TERMINAL_FG_RATIO}:1)`,
        );
      }
    }
  }

  if (uiTheme !== "vs") {
    for (const key of TERMINAL_ANSI_KEYS) {
      if (key === "terminal.foreground" || SKIP_ANSI_KEYS.has(key)) continue;
      const colorValue = colors[key];
      if (typeof colorValue !== "string") continue;
      const fgRgb = effectiveForegroundRgb(colorValue, bgRgb);
      if (!fgRgb) continue;
      const ratio = contrastRatio(luminance(fgRgb), bgLum);
      if (ratio < MIN_TERMINAL_ANSI_RATIO) {
        failures.push(`${key} ${colorValue}: ${ratio.toFixed(2)}:1 (min ${MIN_TERMINAL_ANSI_RATIO}:1)`);
      }
    }
  }

  return failures;
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
  const autoSwitch = getAutoSwitchConfig();
  if (!autoSwitch.enabled) return null;
  if (!isDuskTheme(autoSwitch.darkTheme) || !isDuskTheme(autoSwitch.lightTheme)) {
    return null;
  }
  if (autoSwitch.lightHour === autoSwitch.darkHour) {
    return autoSwitch.darkTheme;
  }
  const hour = now.getHours();
  const useDark =
    autoSwitch.lightHour < autoSwitch.darkHour
      ? hour >= autoSwitch.darkHour || hour < autoSwitch.lightHour
      : hour >= autoSwitch.darkHour && hour < autoSwitch.lightHour;
  return useDark ? autoSwitch.darkTheme : autoSwitch.lightTheme;
}

function normalizeLanguageId(languageId) {
  if (typeof languageId !== "string") return "";
  const value = languageId.toLowerCase().trim();
  if (value === "ts" || value === "tsx") return "typescript";
  if (value === "js" || value === "jsx") return "javascript";
  if (value === "sh") return "shellscript";
  return value;
}

function isHourInRange(hour, start, end) {
  if (start === end) return true;
  if (start < end) return hour >= start && hour < end;
  return hour >= start || hour < end;
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
  };
}

function resolveAdaptiveFocusTheme(languageId, now = new Date(), options = {}) {
  const cfg = getAdaptiveFocusConfig();
  if (!cfg.enabled && !options.force) return null;

  if (cfg.lockTheme && isDuskTheme(cfg.lockTheme)) {
    return { theme: cfg.lockTheme, reason: `Lock theme (${cfg.lockTheme})` };
  }

  const hour = now.getHours();
  if (
    cfg.lateNightEyeComfort &&
    isHourInRange(hour, cfg.lateNightStartHour, cfg.lateNightEndHour)
  ) {
    return { theme: "Dusk Office Midnight", reason: "Late-night eye comfort" };
  }

  const period = hour >= 7 && hour < 18 ? "light" : "dark";
  const lang = normalizeLanguageId(languageId);
  const byLanguage = lang ? ADAPTIVE_LANGUAGE_RULES[lang] : null;
  if (byLanguage && isDuskTheme(byLanguage[period])) {
    return { theme: byLanguage[period], reason: `Language rule (${lang})` };
  }

  return {
    theme: period === "light" ? "Dusk Office Ivory" : "Dusk Office Midnight",
    reason: `Default ${period} period`,
  };
}

async function applyAdaptiveFocusTheme(context, options = {}) {
  const cfg = getAdaptiveFocusConfig();
  if (!cfg.enabled && !options.force) return false;

  const currentTheme = getCurrentTheme();
  if (cfg.onlyWhenDuskThemeActive && !isDuskTheme(currentTheme) && !options.force) {
    return false;
  }

  const activeLanguage = vscode.window.activeTextEditor?.document?.languageId || "";
  const choice = resolveAdaptiveFocusTheme(activeLanguage, new Date(), options);
  if (!choice || !isDuskTheme(choice.theme)) return false;

  // Already on the recommended theme: still considered "handled" so the startup chain
  // does not fall through to applyFavoriteOnStartup and overwrite this decision.
  if (choice.theme === currentTheme) {
    if (options.showMessage) {
      void vscode.window.showInformationMessage(
        `Adaptive focus: ${choice.theme} (${choice.reason}; already active).`,
      );
    }
    return true;
  }

  await applyTheme(choice.theme, context, "adaptive");
  if (options.showMessage) {
    void vscode.window.showInformationMessage(`Adaptive focus: ${choice.theme} (${choice.reason}).`);
  }
  return true;
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

async function updateGlobalTitleBarStyle(value) {
  const windowCfg = vscode.workspace.getConfiguration("window");
  ignoreTitleBarStyleConfigChange = true;
  try {
    await windowCfg.update("titleBarStyle", value, vscode.ConfigurationTarget.Global);
  } finally {
    // VS Code fires onDidChangeConfiguration asynchronously after the update resolves.
    // A short delay (>= one event-loop tick + buffer) ensures the listener still sees
    // ignoreTitleBarStyleConfigChange === true when our own write echoes back.
    setTimeout(() => {
      ignoreTitleBarStyleConfigChange = false;
    }, 200);
  }
}

/**
 * Native macOS title bar ignores workbench theme colors; custom draws from the color theme.
 * configurationDefaults alone is sometimes ignored (host / user overrides) — apply at runtime.
 * When leaving a Dusk theme (or disabling alignWithTheme), restores the previous global
 * `window.titleBarStyle` instead of leaving `custom` forced in user settings.
 */
async function restoreTitleBarGlobalIfStored(context) {
  const stored = context.globalState.get(PREVIOUS_TITLE_BAR_GLOBAL_KEY);
  if (stored === undefined) return;
  const toRestore = stored === PREVIOUS_TITLE_BAR_GLOBAL_UNSET ? undefined : stored;
  await updateGlobalTitleBarStyle(toRestore);
  await context.globalState.update(PREVIOUS_TITLE_BAR_GLOBAL_KEY, undefined);
}

async function releaseTitleBarStyleSyncIfOverridden(context) {
  try {
    if (!context) return false;
    if (context.globalState.get(PREVIOUS_TITLE_BAR_GLOBAL_KEY) === undefined) return false;
    if (!getTitleBarAlignWithThemeEnabled() || !isDuskTheme(getCurrentTheme())) return false;

    const windowCfg = vscode.workspace.getConfiguration("window");
    const inspected = windowCfg.inspect("titleBarStyle");

    if (inspected?.workspaceValue !== undefined) {
      await restoreTitleBarGlobalIfStored(context);
      return true;
    }

    if (inspected?.globalValue === "native") {
      await context.globalState.update(PREVIOUS_TITLE_BAR_GLOBAL_KEY, undefined);
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

async function syncTitleBarStyleForDuskTheme(context) {
  try {
    if (!context) return;

    if (!getTitleBarAlignWithThemeEnabled()) {
      await restoreTitleBarGlobalIfStored(context);
      return;
    }

    if (!isDuskTheme(getCurrentTheme())) {
      await restoreTitleBarGlobalIfStored(context);
      return;
    }

    const windowCfg = vscode.workspace.getConfiguration("window");
    const inspected = windowCfg.inspect("titleBarStyle");
    if (inspected?.workspaceValue !== undefined) {
      await restoreTitleBarGlobalIfStored(context);
      return;
    }
    if (inspected?.globalValue === "native") {
      return;
    }
    if (windowCfg.get("titleBarStyle") !== "custom") {
      const existing = context.globalState.get(PREVIOUS_TITLE_BAR_GLOBAL_KEY);
      if (existing === undefined) {
        const prevGlobal =
          inspected?.globalValue === undefined
            ? PREVIOUS_TITLE_BAR_GLOBAL_UNSET
            : inspected.globalValue;
        await context.globalState.update(PREVIOUS_TITLE_BAR_GLOBAL_KEY, prevGlobal);
      }
      await updateGlobalTitleBarStyle("custom");
    }
  } catch {
    /* read-only or restricted settings in some environments */
  }
}

function getThemeShortLabel(theme) {
  return typeof theme === "string" ? theme.replace(/^Dusk Office\s*/, "") || "Dusk" : "Dusk";
}

async function saveWorkspaceTheme(theme, context) {
  if (!context || !getWorkspaceThemeMemoryEnabled()) return;
  if (!vscode.workspace.workspaceFolders?.length) return;
  await context.workspaceState.update(WORKSPACE_THEME_KEY, theme);
}

async function applyTheme(theme, context, source = "manual") {
  if (!isDuskTheme(theme)) return false;
  const config = getWorkbenchConfig();
  const current = getCurrentTheme();
  if (context && isThemeName(current) && current !== theme) {
    await context.globalState.update(PREVIOUS_THEME_KEY, current);
  }
  await updateConfigValue(config, "colorTheme", theme);
  await syncTitleBarStyleForDuskTheme(context);
  // Only manual user actions persist into workspace memory. Startup restores, automatic
  // schedule (auto-switch) and adaptive-focus must NOT overwrite the user's saved choice.
  if (source === "manual") {
    await saveWorkspaceTheme(theme, context);
  }
  return true;
}

/**
 * Opens a live-preview Quick Pick of the 26 Dusk Office variants. As the user
 * moves the selection (arrow keys, mouse hover with filter, type-to-filter),
 * the highlighted variant is applied immediately so they see the editor and
 * workbench in that variant without committing. Enter confirms; Escape — or
 * dismissing the picker — reverts to the variant active before the picker
 * was opened.
 *
 * Side effects (workspace memory, previous-theme tracking, title-bar sync)
 * only run on accept, never during preview.
 */
async function setThemeVariant(context) {
  const config = getWorkbenchConfig();
  const originalTheme = getCurrentTheme();

  return new Promise((resolve) => {
    const quickPick = vscode.window.createQuickPick();
    quickPick.title = "Dusk Office — Pick a variant";
    quickPick.placeholder = "↑↓ to preview live · Enter to confirm · Esc to revert";
    quickPick.matchOnDescription = true;

    const items = THEME_VARIANTS.map((label) => ({
      label: label === originalTheme ? `$(check) ${label}` : label,
      description: label === originalTheme ? "Current theme" : "",
      _theme: label,
    }));
    quickPick.items = items;

    const currentItem = items.find((it) => it._theme === originalTheme);
    if (currentItem) quickPick.activeItems = [currentItem];

    let accepted = false;
    let lastPreviewed = originalTheme;

    quickPick.onDidChangeActive((active) => {
      const item = active[0];
      if (!item || !item._theme || item._theme === lastPreviewed) return;
      lastPreviewed = item._theme;
      // Preview only — no workspace memory, no previous-theme tracking, no title-bar sync.
      void updateConfigValue(config, "colorTheme", item._theme);
    });

    quickPick.onDidAccept(async () => {
      accepted = true;
      const item = quickPick.activeItems[0];
      quickPick.hide();
      if (!item || !item._theme) {
        resolve();
        return;
      }
      const picked = item._theme;
      // Persist originalTheme as "previous" so Switch-to-Previous returns to the variant
      // the user had before opening the picker, not the last previewed item.
      if (context && isThemeName(originalTheme) && originalTheme !== picked) {
        await context.globalState.update(PREVIOUS_THEME_KEY, originalTheme);
      }
      // colorTheme is already set to picked from the last preview, so applyTheme's
      // own previous-tracking branch is a no-op; it still runs workspace memory + title-bar sync.
      await applyTheme(picked, context, "manual");
      void vscode.window.showInformationMessage(`Theme: ${picked}.`);
      resolve();
    });

    quickPick.onDidHide(async () => {
      if (!accepted && lastPreviewed !== originalTheme) {
        await updateConfigValue(config, "colorTheme", originalTheme);
      }
      quickPick.dispose();
      resolve();
    });

    quickPick.show();
  });
}

async function switchToPreviousTheme(context) {
  const previous = context.globalState.get(PREVIOUS_THEME_KEY);
  if (!isThemeName(previous)) {
    void vscode.window.showInformationMessage("No previous theme.");
    return;
  }
  if (isDuskTheme(previous)) {
    await applyTheme(previous, context);
    void vscode.window.showInformationMessage(`Previous: ${previous}.`);
    return;
  }
  const current = getCurrentTheme();
  const config = getWorkbenchConfig();
  await updateConfigValue(config, "colorTheme", previous);
  if (isThemeName(current) && current !== previous) {
    await context.globalState.update(PREVIOUS_THEME_KEY, current);
  }
  void vscode.window.showInformationMessage(`Previous: ${previous}.`);
}

async function setFavoriteTheme(context) {
  const current = getCurrentTheme();
  const picked = await vscode.window.showQuickPick(
    THEME_VARIANTS.map((label) => ({
      label: label === current ? `$(check) ${label}` : label,
      description: label === current ? "Current theme" : "",
    })),
    {
      placeHolder: "Choose favorite theme",
      matchOnDescription: true,
    },
  );
  if (!picked) return;
  const theme = cleanPickedLabel(picked.label);
  await context.globalState.update(FAVORITE_THEME_KEY, theme);
  void vscode.window.showInformationMessage(`Favorite: ${theme}.`);
}

async function switchToFavoriteTheme(context) {
  const favorite = context.globalState.get(FAVORITE_THEME_KEY);
  if (!isDuskTheme(favorite)) {
    void vscode.window.showInformationMessage("No favorite theme.");
    return;
  }
  await applyTheme(favorite, context);
  void vscode.window.showInformationMessage(`Theme: ${favorite}.`);
}

async function toggleActivityBarLocation() {
  const config = getWorkbenchConfig();
  const current = getActivityBarLocation();
  const next = current === "top" ? "default" : "top";
  await updateConfigValue(config, "activityBar.location", next);
  void vscode.window.showInformationMessage(
    next === "top" ? "Activity Bar: top." : "Activity Bar: default.",
  );
}

async function openDuskOfficeSettings() {
  await vscode.commands.executeCommand(
    "workbench.action.openSettings",
    "@ext:dekidev.dusk-office",
  );
}

async function applyFavoriteOnStartup(context) {
  if (!getApplyFavoriteOnStartupEnabled()) return false;
  const favorite = context.globalState.get(FAVORITE_THEME_KEY);
  if (!isDuskTheme(favorite)) return false;
  if (favorite === getCurrentTheme()) return true;
  return applyTheme(favorite, context, "startup");
}

async function restoreWorkspaceTheme(context) {
  if (!getWorkspaceThemeMemoryEnabled()) return false;
  const theme = context.workspaceState.get(WORKSPACE_THEME_KEY);
  if (!isDuskTheme(theme)) return false;
  // If already on the saved workspace theme, signal "handled" so the startup chain
  // does not fall through to applyFavoriteOnStartup and override the saved choice.
  if (theme === getCurrentTheme()) return true;
  return applyTheme(theme, context, "startup");
}

async function runAutoSwitch(context, showMessage = false) {
  if (getAdaptiveFocusConfig().enabled) return false;
  const theme = getAutoSwitchTheme();
  if (!isDuskTheme(theme)) return false;
  // Already on the scheduled theme: still considered "handled" so the startup chain
  // does not fall through to applyFavoriteOnStartup and override this decision.
  if (theme === getCurrentTheme()) return true;
  await applyTheme(theme, context, "auto");
  if (showMessage) {
    void vscode.window.showInformationMessage(`Auto switch: ${theme}.`);
  }
  return true;
}

async function reconcileAutomaticModes() {
  if (!getAutoSwitchConfig().enabled || !getAdaptiveFocusConfig().enabled) return false;
  const config = getExtensionConfig();
  await updateConfigValue(config, "autoSwitch.enabled", false);
  return true;
}

async function toggleAutoSwitch(context) {
  const config = getExtensionConfig();
  const enabled = !getAutoSwitchConfig().enabled;
  if (enabled) {
    const adaptiveWasEnabled = getAdaptiveFocusConfig().enabled;
    if (adaptiveWasEnabled) {
      await updateConfigValue(config, "adaptiveFocus.enabled", false);
    }
    await updateConfigValue(config, "autoSwitch.enabled", true);
    const applied = await runAutoSwitch(context, false);
    const message = adaptiveWasEnabled
      ? applied
        ? `Auto switch: ${getCurrentTheme()}. Adaptive focus: off.`
        : "Auto switch: on. Adaptive focus: off."
      : applied
        ? `Auto switch: ${getCurrentTheme()}.`
        : "Auto switch: on.";
    void vscode.window.showInformationMessage(message);
    return;
  }
  await updateConfigValue(config, "autoSwitch.enabled", false);
  void vscode.window.showInformationMessage("Auto switch: off.");
}

async function toggleAdaptiveFocus(context) {
  const config = getExtensionConfig();
  const next = !getAdaptiveFocusConfig().enabled;
  if (next) {
    const autoSwitchWasEnabled = getAutoSwitchConfig().enabled;
    if (autoSwitchWasEnabled) {
      await updateConfigValue(config, "autoSwitch.enabled", false);
    }
    await updateConfigValue(config, "adaptiveFocus.enabled", true);
    const applied = await applyAdaptiveFocusTheme(context, { force: true, showMessage: false });
    const message = autoSwitchWasEnabled
      ? applied
        ? `Adaptive focus: ${getCurrentTheme()}. Auto switch: off.`
        : "Adaptive focus: on. Auto switch: off."
      : applied
        ? `Adaptive focus: ${getCurrentTheme()}.`
        : "Adaptive focus: on.";
    void vscode.window.showInformationMessage(message);
    return;
  }
  await updateConfigValue(config, "adaptiveFocus.enabled", false);
  void vscode.window.showInformationMessage("Adaptive focus: off.");
}

async function restorePreviousProductIconIfStored(context) {
  const stored = context.globalState.get(PREVIOUS_PRODUCT_ICON_KEY);
  const wb = getWorkbenchConfig();
  const snapshot = readStoredSettingSnapshot(stored, PREVIOUS_PRODUCT_ICON_UNSET);
  try {
    await wb.update("productIconTheme", snapshot.value, snapshot.target);
  } catch {
    /* read-only settings */
  }
  await context.globalState.update(PREVIOUS_PRODUCT_ICON_KEY, undefined);
}

/**
 * Toggle Dusk Office product icon theme: first activation saves prior global theme and applies Dusk;
 * second activation restores the saved theme (or Default).
 */
async function toggleProductIconTheme(context) {
  if (!duskProductIconThemeId) {
    void vscode.window.showWarningMessage("Dusk Office: no product icon theme in this build.");
    return;
  }
  try {
    const wb = getWorkbenchConfig();
    if (areDuskIconsEnabled()) {
      await restorePreviousProductIconIfStored(context);
      void vscode.window.showInformationMessage("Product icon theme: restored.");
      return;
    }
    const inspected = wb.inspect("productIconTheme");
    if (context.globalState.get(PREVIOUS_PRODUCT_ICON_KEY) === undefined) {
      const target = getConfigTarget(wb, "productIconTheme");
      const previousValue =
        target === vscode.ConfigurationTarget.Workspace ? inspected?.workspaceValue : inspected?.globalValue;
      const snapshot = createStoredSettingSnapshot(
        target,
        previousValue,
        PREVIOUS_PRODUCT_ICON_UNSET,
      );
      await context.globalState.update(PREVIOUS_PRODUCT_ICON_KEY, snapshot);
    }
    await updateConfigValue(wb, "productIconTheme", duskProductIconThemeId);
    void vscode.window.showInformationMessage("Product icon theme: Dusk Office · Product.");
  } catch {
    void vscode.window.showWarningMessage("Could not change product icon theme (settings may be read-only).");
  }
}

async function openControlCenter(context) {
  const currentTheme = getCurrentTheme();
  const activityBarLocation = getActivityBarLocation();
  const previousTheme = context.globalState.get(PREVIOUS_THEME_KEY);
  const favoriteTheme = context.globalState.get(FAVORITE_THEME_KEY);
  const rememberedTheme = context.workspaceState.get(WORKSPACE_THEME_KEY);
  const autoSwitch = getAutoSwitchConfig();
  const adaptiveFocus = getAdaptiveFocusConfig();
  const picked = await vscode.window.showQuickPick(
    [
      {
        label: `$(paintcan) Theme: ${currentTheme || "Unknown"}`,
        description: "Status",
        detail: "Current theme",
        action: null,
      },
      {
        label: "$(symbol-color) Choose Theme",
        description: currentTheme ? `Current: ${currentTheme}` : "Choose a theme",
        detail: "Pick theme",
        action: () => setThemeVariant(context),
      },
      {
        label: "$(history) Previous Theme",
        description: isThemeName(previousTheme) ? `Previous: ${previousTheme}` : "No previous theme",
        detail: "Go back",
        action: () => switchToPreviousTheme(context),
      },
      {
        label: "$(star-full) Favorite Theme",
        description: isDuskTheme(favoriteTheme) ? `Favorite: ${favoriteTheme}` : "No favorite theme",
        detail: "Use favorite",
        action: () => switchToFavoriteTheme(context),
      },
      {
        label: "$(star-empty) Set Favorite",
        description: isDuskTheme(favoriteTheme) ? `Favorite: ${favoriteTheme}` : "Choose favorite",
        detail: "Save favorite",
        action: () => setFavoriteTheme(context),
      },
      {
        label: autoSwitch.enabled ? "$(clock) Auto Switch On" : "$(clock) Auto Switch Off",
        description: autoSwitch.enabled
          ? `${autoSwitch.lightTheme} / ${autoSwitch.darkTheme}`
          : "Use light and dark schedule",
        detail: "Toggle auto switch",
        action: () => toggleAutoSwitch(context),
      },
      {
        label: adaptiveFocus.enabled ? "$(sparkle) Adaptive Focus On" : "$(sparkle) Adaptive Focus Off",
        description: adaptiveFocus.enabled
          ? adaptiveFocus.onlyWhenDuskThemeActive
            ? "Language + time (Dusk-only)"
            : "Language + time (always)"
          : "Auto-adapt by active editor",
        detail: "Toggle adaptive focus",
        action: () => toggleAdaptiveFocus(context),
      },
      {
        label: "$(run) Apply Adaptive Theme Now",
        description: adaptiveFocus.enabled ? "Apply recommended theme immediately" : "Runs once even if disabled",
        detail: "Preview adaptive decision",
        action: () => applyAdaptiveFocusTheme(context, { force: true, showMessage: true }),
      },
      {
        label: "$(settings-gear) Adaptive Focus Settings",
        description: "Open adaptive focus configuration",
        detail: "enabled / lock / late-night / dusk-only",
        action: async () => {
          await vscode.commands.executeCommand(
            "workbench.action.openSettings",
            "duskOffice.adaptiveFocus",
          );
        },
      },
      {
        label: "$(folder-library) Workspace Theme",
        description: isDuskTheme(rememberedTheme) ? `Saved: ${rememberedTheme}` : "No saved theme",
        detail: getWorkspaceThemeMemoryEnabled() ? "Memory on" : "Memory off",
        action: null,
      },
      {
        label: "$(layout) Activity Bar Position",
        description: activityBarLocation === "top" ? "Current: top" : "Current: default",
        detail: "Toggle location",
        action: toggleActivityBarLocation,
      },
      {
        label: areDuskIconsEnabled()
          ? "$(extensions) Product Icons: On (Dusk)"
          : "$(extensions) Product Icons: Off",
        description: areDuskIconsEnabled()
          ? "Click again to restore previous / default"
          : "Apply Dusk Office · Product",
        detail: "Toggle product icon theme",
        action: () => toggleProductIconTheme(context),
      },
      {
        label: "$(tools) Title Bar Align",
        description: getTitleBarAlignWithThemeEnabled() ? "Current: on" : "Current: off",
        detail: "Toggle alignment",
        action: async () => {
          const cfg = getExtensionConfig();
          const next = !getTitleBarAlignWithThemeEnabled();
          await updateConfigValue(cfg, "titleBar.alignWithTheme", next);
          void vscode.window.showInformationMessage(
            next ? "Title bar: align with theme." : "Title bar: native/custom unmanaged.",
          );
          void syncTitleBarStyleForDuskTheme(context);
        },
      },
      {
        label: "$(eye) Status Bar Button",
        description: getStatusBarEnabled() ? "Current: on" : "Current: off",
        detail: "Toggle status bar",
        action: async () => {
          const cfg = getExtensionConfig();
          const next = !getStatusBarEnabled();
          await updateConfigValue(cfg, "statusBar.enabled", next);
          void vscode.window.showInformationMessage(next ? "Status bar: on." : "Status bar: off.");
        },
      },
      {
        label: "$(trash) Clear Workspace Theme Memory",
        description: isDuskTheme(rememberedTheme) ? `Saved: ${rememberedTheme}` : "Nothing saved",
        detail: "Workspace",
        action: async () => {
          await context.workspaceState.update(WORKSPACE_THEME_KEY, undefined);
          void vscode.window.showInformationMessage("Workspace theme memory: cleared.");
        },
      },
      {
        label: "$(gear) Configure Auto Switch",
        description: `${autoSwitch.lightTheme} @${autoSwitch.lightHour}h / ${autoSwitch.darkTheme} @${autoSwitch.darkHour}h`,
        detail: "Pick themes & hours",
        action: async () => {
          const pickTheme = async (title, currentLabel) => {
            const picked = await vscode.window.showQuickPick(
              THEME_VARIANTS.map((label) => ({
                label: label === currentLabel ? `$(check) ${label}` : label,
                description: label === currentLabel ? "Current" : "",
              })),
              { title, matchOnDescription: true },
            );
            if (!picked) return undefined;
            return cleanPickedLabel(picked.label);
          };
          const lightTheme = await pickTheme("Auto Switch: Light Theme", autoSwitch.lightTheme);
          if (!lightTheme) return;
          const darkTheme = await pickTheme("Auto Switch: Dark Theme", autoSwitch.darkTheme);
          if (!darkTheme) return;
          const askHour = async (title, value) => {
            const s = await vscode.window.showInputBox({
              title,
              value: String(value ?? 0),
              validateInput: (text) => {
                const n = Number(text);
                return Number.isInteger(n) && n >= 0 && n <= 23 ? undefined : "Enter an integer between 0 and 23";
              },
            });
            if (s === undefined) return undefined;
            return parseInt(s, 10);
          };
          const lightHour = await askHour("Auto Switch: Light Hour (0–23)", autoSwitch.lightHour);
          if (lightHour === undefined) return;
          const darkHour = await askHour("Auto Switch: Dark Hour (0–23)", autoSwitch.darkHour);
          if (darkHour === undefined) return;
          const cfg = getExtensionConfig();
          await Promise.all([
            updateConfigValue(cfg, "autoSwitch.lightTheme", lightTheme),
            updateConfigValue(cfg, "autoSwitch.darkTheme", darkTheme),
            updateConfigValue(cfg, "autoSwitch.lightHour", lightHour),
            updateConfigValue(cfg, "autoSwitch.darkHour", darkHour),
          ]);
          void vscode.window.showInformationMessage(
            `Auto switch configured: ${lightTheme} @${lightHour}h / ${darkTheme} @${darkHour}h`,
          );
          if (getAutoSwitchConfig().enabled) {
            void runAutoSwitch(context, false);
          }
        },
      },
      {
        label: "$(eye) Verify Terminal Contrast",
        description: "Check WCAG compliance",
        detail: "All themes",
        action: () => verifyTerminalContrast(context),
      },
      {
        label: "$(refresh) Reset All Settings",
        description: "Return to VS Code defaults",
        detail: "Complete reset",
        action: () => resetAllSettings(context),
      },
      {
        label: "$(settings-gear) Settings",
        description: "Open settings",
        detail: "Extension",
        action: openDuskOfficeSettings,
      },
    ],
    {
      title: "Dusk Office",
      placeHolder: "Pick an action",
      matchOnDescription: true,
    },
  );
  if (!picked || !picked.action) return;
  await picked.action();
}

function createStatusBarItem(context) {
  const item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, STATUS_BAR_PRIORITY);
  item.command = "duskOffice.openControlCenter";
  item.name = "Dusk Office";

  const update = () => {
    if (!getStatusBarEnabled()) {
      item.hide();
      return;
    }
    const currentTheme = getCurrentTheme();
    const iconsEnabled = areDuskIconsEnabled();
    const adaptiveEnabled = getAdaptiveFocusConfig().enabled;
    item.text = `$(symbol-color) ${getThemeShortLabel(currentTheme)}${adaptiveEnabled ? " $(sparkle)" : ""}`;
    if (adaptiveEnabled) {
      item.tooltip = "Dusk Office: adaptive focus active";
    } else {
      item.tooltip = iconsEnabled ? "Dusk Office: theme and icons" : "Dusk Office: theme";
    }
    item.show();
  };

  update();

  context.subscriptions.push(
    item,
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (
        event.affectsConfiguration("workbench.colorTheme") ||
        event.affectsConfiguration("workbench.productIconTheme") ||
        event.affectsConfiguration("duskOffice.statusBar.enabled") ||
        event.affectsConfiguration("duskOffice.adaptiveFocus.enabled")
      ) {
        update();
      }
    }),
  );
}

function startAutoSwitchTimer(context) {
  const timer = setInterval(() => {
    void runAutoSwitch(context);
  }, 60 * 1000);
  return new vscode.Disposable(() => clearInterval(timer));
}

function createAutoSwitchManager(context) {
  let timerDisposable = null;

  const ensureTimerState = () => {
    if (getAutoSwitchConfig().enabled) {
      if (!timerDisposable) timerDisposable = startAutoSwitchTimer(context);
    } else {
      timerDisposable?.dispose();
      timerDisposable = null;
    }
  };

  ensureTimerState();

  const configListener = vscode.workspace.onDidChangeConfiguration((event) => {
    if (!event.affectsConfiguration("duskOffice.autoSwitch")) return;

    const wasEnabled = !!timerDisposable;
    ensureTimerState();
    const isEnabled = !!timerDisposable;

    if (isEnabled && !wasEnabled) {
      void runAutoSwitch(context);
      return;
    }

    if (isEnabled) {
      void runAutoSwitch(context);
    }
  });

  return new vscode.Disposable(() => {
    configListener.dispose();
    timerDisposable?.dispose();
    timerDisposable = null;
  });
}

function createAdaptiveFocusManager(context) {
  let timer = null;

  const ensureTimer = () => {
    const enabled = getAdaptiveFocusConfig().enabled;
    if (!enabled) {
      if (timer) clearInterval(timer);
      timer = null;
      return;
    }
    if (!timer) {
      timer = setInterval(() => {
        void applyAdaptiveFocusTheme(context);
      }, 60 * 1000);
    }
  };

  ensureTimer();

  const configListener = vscode.workspace.onDidChangeConfiguration((event) => {
    if (!event.affectsConfiguration("duskOffice.adaptiveFocus")) return;
    ensureTimer();
    if (getAdaptiveFocusConfig().enabled) {
      void applyAdaptiveFocusTheme(context);
    }
  });

  const editorListener = vscode.window.onDidChangeActiveTextEditor(() => {
    if (!getAdaptiveFocusConfig().enabled) return;
    void applyAdaptiveFocusTheme(context);
  });

  return new vscode.Disposable(() => {
    configListener.dispose();
    editorListener.dispose();
    if (timer) clearInterval(timer);
    timer = null;
  });
}

// ---------------------------------------------------------------------------
// Workspace Fingerprint — auto-suggest a Dusk Office variant matching the
// detected workspace context (fintech, cybersecurity, ML, etc.).
// Runs once per workspace, opt-out via setting, all local (no telemetry).
// ---------------------------------------------------------------------------

function getWorkspaceFingerprintEnabled() {
  return getExtensionConfig().get("workspaceFingerprint.enabled", true);
}

/** Shallow JSON read with a 256 KB cap to stay fast and avoid huge configs. */
function readJsonFile(absolutePath) {
  try {
    const stat = fs.statSync(absolutePath);
    if (!stat.isFile() || stat.size > 256 * 1024) return null;
    return JSON.parse(fs.readFileSync(absolutePath, "utf8"));
  } catch {
    return null;
  }
}

/** Plain-text read with the same 256 KB cap. */
function readTextFile(absolutePath) {
  try {
    const stat = fs.statSync(absolutePath);
    if (!stat.isFile() || stat.size > 256 * 1024) return null;
    return fs.readFileSync(absolutePath, "utf8");
  } catch {
    return null;
  }
}

/**
 * Collects lightweight signals from the workspace root. Reads only top-level
 * manifest files; never recurses into the project. Returns lowercased haystacks.
 */
function collectWorkspaceSignals(rootDir) {
  const signals = {
    npmDeps: new Set(),
    npmKeywords: [],
    npmText: "",
    cargoDeps: new Set(),
    pythonText: "",
    goText: "",
    composerText: "",
    files: new Set(),
    extensionCounts: {},
  };

  if (!rootDir) return signals;

  // package.json
  const pkg = readJsonFile(path.join(rootDir, "package.json"));
  if (pkg && typeof pkg === "object") {
    const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
    for (const name of Object.keys(deps)) signals.npmDeps.add(String(name).toLowerCase());
    if (Array.isArray(pkg.keywords)) signals.npmKeywords = pkg.keywords.map((k) => String(k).toLowerCase());
    signals.npmText = [pkg.name, pkg.description, ...(pkg.keywords || [])]
      .filter((v) => typeof v === "string")
      .join(" ")
      .toLowerCase();
  }

  // Cargo.toml
  const cargo = readTextFile(path.join(rootDir, "Cargo.toml"));
  if (cargo) {
    const inDeps = cargo.match(/\[dependencies\][\s\S]*?(?=\n\[|\Z)/);
    const block = inDeps ? inDeps[0] : cargo;
    for (const m of block.matchAll(/^([a-zA-Z0-9_-]+)\s*=/gm)) {
      signals.cargoDeps.add(m[1].toLowerCase());
    }
  }

  // Python: pyproject.toml + requirements.txt
  signals.pythonText =
    [
      readTextFile(path.join(rootDir, "pyproject.toml")) || "",
      readTextFile(path.join(rootDir, "requirements.txt")) || "",
      readTextFile(path.join(rootDir, "Pipfile")) || "",
    ]
      .join("\n")
      .toLowerCase();

  // Go
  signals.goText = (readTextFile(path.join(rootDir, "go.mod")) || "").toLowerCase();

  // PHP / Composer
  const composer = readJsonFile(path.join(rootDir, "composer.json"));
  if (composer) signals.composerText = JSON.stringify(composer).toLowerCase();

  // Top-level file listing (no recursion)
  try {
    const entries = fs.readdirSync(rootDir, { withFileTypes: true });
    for (const e of entries) {
      if (e.isFile()) {
        signals.files.add(e.name.toLowerCase());
        const ext = path.extname(e.name).toLowerCase();
        if (ext) signals.extensionCounts[ext] = (signals.extensionCounts[ext] || 0) + 1;
      } else if (e.isDirectory()) {
        signals.files.add(e.name.toLowerCase() + "/");
      }
    }
  } catch {
    /* permission errors etc. — ignore */
  }

  return signals;
}

/**
 * Pattern set: each entry yields a score for a Dusk Office variant based on
 * collected signals. Higher score = stronger match. Scores are tuned so a
 * meaningful match generally lands ≥ 30, with stacking signals reaching 50–80.
 */
const FINGERPRINT_PATTERNS = [
  {
    variant: "Dusk Office Vault",
    displayLabel: "Vault",
    reason: "fintech or banking project",
    score(s) {
      let n = 0;
      const fintechDeps = ["stripe", "plaid", "dwolla", "square", "paypal-rest-sdk", "braintree"];
      for (const d of fintechDeps) if (s.npmDeps.has(d)) n += 25;
      if (/\b(fintech|banking|payment|wallet|kyc|aml|treasury)\b/.test(s.npmText)) n += 20;
      if (s.npmKeywords.some((k) => /(fintech|banking|payment|wallet)/.test(k))) n += 15;
      return Math.min(n, 80);
    },
  },
  {
    variant: "Dusk Office Audit",
    displayLabel: "Audit",
    reason: "audit, accounting, or financial compliance project",
    score(s) {
      let n = 0;
      const auditDeps = ["accounting", "quickbooks", "xero-node", "sage-intacct"];
      for (const d of auditDeps) if (s.npmDeps.has(d)) n += 30;
      if (/\b(audit|accounting|ledger|gaap|ifrs|sox|compliance)\b/.test(s.npmText)) n += 20;
      if ([...s.files].some((f) => /(audit|accounting|ledger)/.test(f))) n += 15;
      return Math.min(n, 75);
    },
  },
  {
    variant: "Dusk Office Sentinel",
    displayLabel: "Sentinel",
    reason: "cybersecurity, SOC, or DevSecOps project",
    score(s) {
      let n = 0;
      const secDeps = ["helmet", "passport", "jsonwebtoken", "bcrypt", "node-forge", "crypto-js", "owasp", "snyk"];
      for (const d of secDeps) if (s.npmDeps.has(d)) n += 12;
      if (/\b(security|cybersecurity|soc|siem|firewall|vault|falco|osquery|owasp)\b/.test(s.npmText)) n += 18;
      if ([...s.files].some((f) => /^(security|auth|firewall|sentinel)\/?$/.test(f) || f.endsWith(".tf"))) n += 12;
      if (s.files.has("dockerfile") && s.files.has("docker-compose.yml") && /\b(vault|consul|falco)\b/.test(s.npmText)) n += 15;
      return Math.min(n, 75);
    },
  },
  {
    variant: "Dusk Office Steward",
    displayLabel: "Steward",
    reason: "data science, ML, or backend Python project",
    score(s) {
      let n = 0;
      if (/(numpy|pandas|scikit-learn|tensorflow|pytorch|jupyter|fastapi|django|flask)/.test(s.pythonText)) n += 25;
      if (s.files.has("requirements.txt") || s.files.has("pyproject.toml") || s.files.has("pipfile")) n += 15;
      const pyExtCount = (s.extensionCounts[".py"] || 0) + (s.extensionCounts[".ipynb"] || 0);
      if (pyExtCount >= 2) n += 10;
      return Math.min(n, 70);
    },
  },
  {
    variant: "Dusk Office Voltage",
    displayLabel: "Voltage",
    reason: "high-energy modern web stack (Bun / Deno / Vite / Next)",
    score(s) {
      let n = 0;
      const modernDeps = ["next", "astro", "vite", "remix", "solid-js", "qwik", "hono", "elysia"];
      for (const d of modernDeps) if (s.npmDeps.has(d)) n += 18;
      if (s.files.has("bun.lockb") || s.files.has("deno.json") || s.files.has("deno.jsonc")) n += 25;
      return Math.min(n, 70);
    },
  },
  {
    variant: "Dusk Office Nocturne",
    displayLabel: "Nocturne",
    reason: "frontend / design-system project",
    score(s) {
      let n = 0;
      const uiDeps = ["react", "vue", "svelte", "tailwindcss", "@storybook/react", "framer-motion", "@radix-ui/react-dialog"];
      for (const d of uiDeps) if (s.npmDeps.has(d)) n += 10;
      if (s.files.has("tailwind.config.js") || s.files.has("tailwind.config.ts") || s.files.has(".storybook/")) n += 15;
      const cssCount = (s.extensionCounts[".css"] || 0) + (s.extensionCounts[".scss"] || 0);
      if (cssCount >= 2) n += 8;
      return Math.min(n, 65);
    },
  },
  {
    variant: "Dusk Office Terminal",
    displayLabel: "Terminal",
    reason: "CLI, infrastructure, or DevOps tooling project",
    score(s) {
      let n = 0;
      if (s.goText || (s.extensionCounts[".go"] || 0) >= 2) n += 20;
      if (s.cargoDeps.size > 0 && (s.cargoDeps.has("clap") || s.cargoDeps.has("structopt"))) n += 25;
      if ([...s.files].some((f) => f.endsWith(".tf") || f.endsWith(".tfvars"))) n += 15;
      if (s.files.has("makefile") || s.files.has("dockerfile") || s.files.has("docker-compose.yml")) n += 8;
      return Math.min(n, 65);
    },
  },
];

const FINGERPRINT_THRESHOLD = 30;

/**
 * Inspects the active workspace and offers a Dusk Office variant suggestion if
 * a strong match is detected. Returns the chosen variant when the user accepts,
 * or null otherwise. Stores a flag in workspaceState to avoid re-prompting.
 *
 * @param {vscode.ExtensionContext} context
 * @param {{ force?: boolean, showAlways?: boolean }} options
 *   - force: re-run even if already shown (used by the manual command).
 *   - showAlways: surface the suggestion even when the user is already on the
 *     recommended theme (used by the manual command).
 */
async function detectWorkspaceFingerprint(context, options = {}) {
  if (!options.force && !getWorkspaceFingerprintEnabled()) return null;
  if (!options.force && context.workspaceState.get(WORKSPACE_FINGERPRINT_KEY)) return null;

  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) return null;
  const rootDir = folders[0].uri.fsPath;
  if (!rootDir) return null;

  let signals;
  try {
    signals = collectWorkspaceSignals(rootDir);
  } catch {
    return null;
  }

  const ranked = FINGERPRINT_PATTERNS
    .map((p) => ({ pattern: p, score: p.score(signals) }))
    .filter((entry) => entry.score >= FINGERPRINT_THRESHOLD)
    .sort((a, b) => b.score - a.score);

  if (ranked.length === 0) {
    if (options.force) {
      void vscode.window.showInformationMessage(
        "Dusk Office: no strong workspace match detected. Use \"Dusk Office: Set Theme Variant\" to pick one manually.",
      );
    }
    return null;
  }

  const top = ranked[0];
  const currentTheme = getCurrentTheme();
  if (!options.showAlways && currentTheme === top.pattern.variant) {
    await context.workspaceState.update(WORKSPACE_FINGERPRINT_KEY, true);
    return null;
  }

  const message = `🌒 Dusk Office detected this looks like a ${top.pattern.reason}. Try the \"${top.pattern.displayLabel}\" variant?`;
  const choice = await vscode.window.showInformationMessage(
    message,
    "Try it",
    "Show all variants",
    "Don't suggest here",
  );

  await context.workspaceState.update(WORKSPACE_FINGERPRINT_KEY, true);

  if (choice === "Try it") {
    await applyTheme(top.pattern.variant, context, "manual");
    return top.pattern.variant;
  }
  if (choice === "Show all variants") {
    await setThemeVariant(context);
    return null;
  }
  return null;
}

async function initializeStartupBehavior(context) {
  if (await applyAdaptiveFocusTheme(context)) return;
  if (await runAutoSwitch(context)) return;
  if (await restoreWorkspaceTheme(context)) return;
  await applyFavoriteOnStartup(context);
}

async function activate(context) {
  const pic = context.extension.packageJSON?.contributes?.productIconThemes;
  const picId = Array.isArray(pic) && typeof pic[0]?.id === "string" ? pic[0].id : "";
  duskProductIconThemeId = picId;

  await reconcileAutomaticModes();

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(async (e) => {
      if (
        e.affectsConfiguration("duskOffice.autoSwitch.enabled") ||
        e.affectsConfiguration("duskOffice.adaptiveFocus.enabled")
      ) {
        await reconcileAutomaticModes();
      }
      const titleBarStyleChanged = e.affectsConfiguration("window.titleBarStyle");
      if (titleBarStyleChanged && ignoreTitleBarStyleConfigChange) {
        return;
      }
      if (titleBarStyleChanged && (await releaseTitleBarStyleSyncIfOverridden(context))) {
        return;
      }
      if (
        titleBarStyleChanged ||
        e.affectsConfiguration("workbench.colorTheme") ||
        e.affectsConfiguration("duskOffice.titleBar.alignWithTheme")
      ) {
        void syncTitleBarStyleForDuskTheme(context);
      }
    }),
    vscode.commands.registerCommand("duskOffice.openControlCenter", () => openControlCenter(context)),
    vscode.commands.registerCommand("duskOffice.switchThemeVariant", () => setThemeVariant(context)),
    vscode.commands.registerCommand("duskOffice.switchToPreviousTheme", () => switchToPreviousTheme(context)),
    vscode.commands.registerCommand("duskOffice.setFavoriteTheme", () => setFavoriteTheme(context)),
    vscode.commands.registerCommand("duskOffice.switchToFavoriteTheme", () => switchToFavoriteTheme(context)),
    vscode.commands.registerCommand("duskOffice.toggleAutoSwitch", () => toggleAutoSwitch(context)),
    vscode.commands.registerCommand("duskOffice.toggleAdaptiveFocus", () => toggleAdaptiveFocus(context)),
    vscode.commands.registerCommand("duskOffice.toggleActivityBarLocation", toggleActivityBarLocation),
    vscode.commands.registerCommand("duskOffice.toggleProductIconTheme", () =>
      toggleProductIconTheme(context),
    ),
    vscode.commands.registerCommand("duskOffice.openSettings", openDuskOfficeSettings),
    vscode.commands.registerCommand("duskOffice.verifyTerminalContrast", () =>
      verifyTerminalContrast(context),
    ),
    vscode.commands.registerCommand("duskOffice.resetTheme", () => resetAllSettings(context)),
    vscode.commands.registerCommand("duskOffice.applyAdaptiveFocusTheme", () =>
      applyAdaptiveFocusTheme(context, { force: true, showMessage: true }),
    ),
    vscode.commands.registerCommand("duskOffice.suggestVariantForWorkspace", () =>
      detectWorkspaceFingerprint(context, { force: true, showAlways: true }),
    ),
    createAutoSwitchManager(context),
    createAdaptiveFocusManager(context),
  );
  createStatusBarItem(context);
  await initializeStartupBehavior(context);
  await syncTitleBarStyleForDuskTheme(context);

  // Workspace fingerprint runs after startup behavior and is non-blocking. The
  // small delay avoids racing with auto-switch / adaptive focus notifications.
  setTimeout(() => {
    void detectWorkspaceFingerprint(context);
  }, 1500);
}

async function verifyTerminalContrast(context) {
  try {
    const themes = context?.extension?.packageJSON?.contributes?.themes;
    if (!Array.isArray(themes) || themes.length === 0) {
      void vscode.window.showWarningMessage("No themes found in package metadata.");
      return;
    }

    let checkedCount = 0;
    const failures = [];

    for (const theme of themes) {
      if (typeof theme?.path !== "string" || !theme.path.endsWith(".json")) continue;
      const fullPath = path.resolve(context.extensionPath, theme.path);
      if (!fs.existsSync(fullPath)) continue;

      let mergedColors;
      try {
        mergedColors = mergeThemeColors(fullPath);
      } catch (error) {
        failures.push({
          label: theme.label || theme.path,
          path: theme.path,
          details: [`Could not read include chain: ${error.message || String(error)}`],
        });
        checkedCount += 1;
        continue;
      }

      const themeFailures = checkTerminalContrast(mergedColors, theme.uiTheme || "vs-dark");
      checkedCount += 1;
      if (themeFailures.length > 0) {
        failures.push({
          label: theme.label || theme.path,
          path: theme.path,
          details: themeFailures,
        });
      }
    }

    const hasFailures = failures.length > 0;
    const statusLine = hasFailures
      ? `Terminal contrast verification failed for ${failures.length}/${checkedCount} theme(s).`
      : `Terminal contrast verified for ${checkedCount} theme(s): all checks passed.`;

    const reportLines = [
      "# Dusk Office Terminal Contrast Report",
      "",
      `- Checked themes: ${checkedCount}`,
      `- Minimum terminal.foreground ratio: ${MIN_TERMINAL_FG_RATIO}:1`,
      `- Minimum ANSI ratio on dark/hc themes: ${MIN_TERMINAL_ANSI_RATIO}:1`,
      "- ANSI keys skipped: terminal.ansiBlack, terminal.ansiBrightBlack",
      "",
    ];

    if (hasFailures) {
      reportLines.push("## Failing Themes", "");
      for (const fail of failures) {
        reportLines.push(`### ${fail.label}`, `Path: \`${fail.path}\``, "");
        for (const line of fail.details) {
          reportLines.push(`- ${line}`);
        }
        reportLines.push("");
      }
    } else {
      reportLines.push("All themes meet the configured contrast thresholds.", "");
    }

    const action = "View Details";
    if (hasFailures) {
      const selection = await vscode.window.showWarningMessage(statusLine, action);
      if (selection !== action) return;
    } else {
      const selection = await vscode.window.showInformationMessage(statusLine, action);
      if (selection !== action) return;
    }

    const doc = await vscode.workspace.openTextDocument({
      content: reportLines.join("\n"),
      language: "markdown",
    });
    await vscode.window.showTextDocument(doc, { preview: false });
  } catch (error) {
    void vscode.window.showErrorMessage(`Failed to verify terminal contrast: ${error.message || String(error)}`);
  }
}

function resetAllSettings(context) {
  const workbenchConfig = getWorkbenchConfig();
  const duskConfig = getExtensionConfig();

  vscode.window.showWarningMessage(
    "Reset all Dusk Office settings to defaults? This will:\n\n" +
    "Return to VS Code default color theme\n" +
    "Reset product icons and activity bar position\n" +
    "Clear auto-switch, favorite, and workspace memory\n" +
    "Remove stored Dusk Office state values",
    "Reset All Settings",
    "Cancel"
  ).then(async (selection) => {
    if (selection !== "Reset All Settings") return;

    const hasWorkspace = !!vscode.workspace.workspaceFolders?.length;
    /** Per-key error tolerance: a single read-only target should not abort the whole reset. */
    const safeUpdate = async (config, key, target) => {
      try {
        await config.update(key, undefined, target);
      } catch {
        /* setting may be read-only, restricted, or absent in this scope */
      }
    };

    try {
      // Explicitly restore title bar style first so reset does not depend on config-change timing.
      await restoreTitleBarGlobalIfStored(context);

      // Reset workbench-level settings: Global always, Workspace only when one is open.
      const workbenchKeys = ["colorTheme", "productIconTheme", "activityBar.location"];
      for (const key of workbenchKeys) {
        await safeUpdate(workbenchConfig, key, vscode.ConfigurationTarget.Global);
        if (hasWorkspace) {
          await safeUpdate(workbenchConfig, key, vscode.ConfigurationTarget.Workspace);
        }
      }

      // Reset all Dusk Office configuration keys (declared in contributes.configuration).
      const duskConfigKeys = [
        "applyFavoriteOnStartup",
        "rememberWorkspaceTheme",
        "statusBar.enabled",
        "titleBar.alignWithTheme",
        "autoSwitch.enabled",
        "autoSwitch.lightTheme",
        "autoSwitch.darkTheme",
        "autoSwitch.lightHour",
        "autoSwitch.darkHour",
        "adaptiveFocus.enabled",
        "adaptiveFocus.onlyWhenDuskThemeActive",
        "adaptiveFocus.lateNightEyeComfort",
        "adaptiveFocus.lateNightStartHour",
        "adaptiveFocus.lateNightEndHour",
        "adaptiveFocus.lockTheme",
      ];
      for (const key of duskConfigKeys) {
        await safeUpdate(duskConfig, key, vscode.ConfigurationTarget.Global);
        if (hasWorkspace) {
          await safeUpdate(duskConfig, key, vscode.ConfigurationTarget.Workspace);
        }
      }

      // Clear stored values from extension state.
      await context.globalState.update(PREVIOUS_THEME_KEY, undefined);
      await context.globalState.update(FAVORITE_THEME_KEY, undefined);
      await context.globalState.update(WORKSPACE_THEME_KEY, undefined);
      await context.globalState.update(PREVIOUS_TITLE_BAR_GLOBAL_KEY, undefined);
      await context.globalState.update(PREVIOUS_PRODUCT_ICON_KEY, undefined);
      await context.workspaceState.update(WORKSPACE_THEME_KEY, undefined);

      vscode.window.showInformationMessage(
        "Dusk Office settings were reset to defaults successfully.",
        "OK"
      );
    } catch (error) {
      vscode.window.showErrorMessage(
        `Dusk Office reset failed: ${error?.message ?? String(error)}`,
        "OK"
      );
    }
  });
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
