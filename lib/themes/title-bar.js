const vscode = require("vscode");
const { isDuskTheme } = require("./theme-common.js");
const keys = require("../core/extension-keys.js");
const state = require("../core/extension-state.js");
const cfg = require("../core/configuration.js");

async function updateGlobalTitleBarStyle(value) {
  const windowCfg = vscode.workspace.getConfiguration("window");
  state.ignoreTitleBarStyleConfigChange = true;
  try {
    await windowCfg.update("titleBarStyle", value, vscode.ConfigurationTarget.Global);
  } finally {
    // VS Code fires onDidChangeConfiguration asynchronously after the update resolves.
    // A short delay (>= one event-loop tick + buffer) ensures the listener still sees
    // ignoreTitleBarStyleConfigChange === true when our own write echoes back.
    setTimeout(() => {
      state.ignoreTitleBarStyleConfigChange = false;
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
  const stored = context.globalState.get(keys.PREVIOUS_TITLE_BAR_GLOBAL_KEY);
  if (stored === undefined) return;
  const toRestore = stored === keys.PREVIOUS_TITLE_BAR_GLOBAL_UNSET ? undefined : stored;
  await updateGlobalTitleBarStyle(toRestore);
  await context.globalState.update(keys.PREVIOUS_TITLE_BAR_GLOBAL_KEY, undefined);
}

async function releaseTitleBarStyleSyncIfOverridden(context) {
  try {
    if (!context) return false;
    if (context.globalState.get(keys.PREVIOUS_TITLE_BAR_GLOBAL_KEY) === undefined) return false;
    if (!cfg.getTitleBarAlignWithThemeEnabled() || !isDuskTheme(cfg.getCurrentTheme())) return false;

    const windowCfg = vscode.workspace.getConfiguration("window");
    const inspected = windowCfg.inspect("titleBarStyle");

    if (inspected?.workspaceValue !== undefined) {
      await restoreTitleBarGlobalIfStored(context);
      return true;
    }

    if (inspected?.globalValue === "native") {
      await context.globalState.update(keys.PREVIOUS_TITLE_BAR_GLOBAL_KEY, undefined);
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

    if (!cfg.getTitleBarAlignWithThemeEnabled()) {
      await restoreTitleBarGlobalIfStored(context);
      return;
    }

    if (!isDuskTheme(cfg.getCurrentTheme())) {
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
      const existing = context.globalState.get(keys.PREVIOUS_TITLE_BAR_GLOBAL_KEY);
      if (existing === undefined) {
        const prevGlobal =
          inspected?.globalValue === undefined
            ? keys.PREVIOUS_TITLE_BAR_GLOBAL_UNSET
            : inspected.globalValue;
        await context.globalState.update(keys.PREVIOUS_TITLE_BAR_GLOBAL_KEY, prevGlobal);
      }
      await updateGlobalTitleBarStyle("custom");
    }
  } catch {
    /* read-only or restricted settings in some environments */
  }
}

module.exports = {
  updateGlobalTitleBarStyle,
  restoreTitleBarGlobalIfStored,
  releaseTitleBarStyleSyncIfOverridden,
  syncTitleBarStyleForDuskTheme,
};
