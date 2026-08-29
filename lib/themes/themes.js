const vscode = require("vscode");
const {
  THEME_VARIANTS,
  DEFAULT_ONBOARDING_THEME,
  isDuskTheme,
  getThemeKindLabel,
  isThemeName,
  getThemeDisplayLabel,
  stripThemeDisplayLabel,
} = require("./theme-common.js");
const keys = require("../core/extension-keys.js");
const cfg = require("../core/configuration.js");
const titleBar = require("./title-bar.js");
const state = require("../core/extension-state.js");
const log = require("../core/log.js");

/**
 * When `window.autoDetectColorScheme` is enabled, VS Code picks the active
 * theme from `workbench.preferredLightColorTheme` / `preferredDarkColorTheme`
 * instead of `workbench.colorTheme`. If we only set `colorTheme`, the user
 * will not see the switch until the OS colour scheme flips. This helper
 * writes BOTH preferred keys so the change is immediate regardless of the
 * current OS colour scheme mode.
 */
async function syncPreferredThemeIfAutoDetect(theme, workbenchCfg) {
  try {
    const windowCfg = cfg.getWindowConfig();
    if (!windowCfg.get("autoDetectColorScheme")) return;
    const wb = workbenchCfg || cfg.getWorkbenchConfig();
    const displayLabel = getThemeDisplayLabel(theme);
    // Write BOTH preferred slots so the theme applies immediately regardless
    // of the current OS colour scheme mode. If we only write the matching
    // slot (e.g. light theme → preferredLightColorTheme), the visual switch
    // won't happen when the OS is in the opposite mode.
    await cfg.updateConfigValue(wb, "preferredLightColorTheme", displayLabel);
    await cfg.updateConfigValue(wb, "preferredDarkColorTheme", displayLabel);
  } catch (err) {
    log.warn("syncPreferredThemeIfAutoDetect", err);
  }
}

async function saveWorkspaceTheme(theme, context) {
  if (!context || !cfg.getWorkspaceThemeMemoryEnabled()) return;
  if (!vscode.workspace.workspaceFolders?.length) return;
  await context.workspaceState.update(keys.WORKSPACE_THEME_KEY, theme);
}

async function applyTheme(theme, context, source = "manual") {
  try {
    const plainName = stripThemeDisplayLabel(theme);
    if (!isDuskTheme(plainName)) return false;
    const displayLabel = getThemeDisplayLabel(plainName);
    const workbenchCfg = cfg.getWorkbenchConfig();
    const current = cfg.getCurrentTheme();
    if (context && isThemeName(current) && current !== plainName) {
      await context.globalState.update(keys.PREVIOUS_THEME_KEY, current);
    }
    await cfg.updateConfigValue(workbenchCfg, "colorTheme", displayLabel);
    await syncPreferredThemeIfAutoDetect(plainName, workbenchCfg);
    await titleBar.syncTitleBarStyleForDuskTheme(context);
    if (source === "manual") {
      state.lastManualThemeApplyTime = Date.now();
      await saveWorkspaceTheme(plainName, context);
    }
    return true;
  } catch (err) {
    log.error("applyTheme", err);
    return false;
  }
}

/**
 * Opens a Quick Pick of the 27 Dusk Office variants. Navigating the list does
 * not change the workbench. Enter or click applies; Escape cancels.
 */
/**
 * Walkthrough step 1. If a Dusk theme is already active, keep it.
 * Otherwise apply the onboarding default (Finance).
 */
async function applyDefaultTheme(context) {
  try {
    const current = cfg.getCurrentTheme();
    if (isDuskTheme(current)) {
      void vscode.window.showInformationMessage(`Theme: ${current}.`);
      return current;
    }
    const applied = await applyTheme(DEFAULT_ONBOARDING_THEME, context, "manual");
    if (applied) {
      void vscode.window.showInformationMessage(`Theme: ${DEFAULT_ONBOARDING_THEME}.`);
      return DEFAULT_ONBOARDING_THEME;
    }
    return undefined;
  } catch (err) {
    log.error("applyDefaultTheme", err);
    void vscode.window.showErrorMessage("Dusk Office: failed to apply the default theme.");
    return undefined;
  }
}

async function setThemeVariant(context) {
  const originalTheme = cfg.getCurrentTheme();
  state.isQuickPickOpen = true;
  try {
    const picked = await vscode.window.showQuickPick(
      THEME_VARIANTS.map((theme) => ({
        label:
          theme === originalTheme
            ? `$(check) ${getThemeDisplayLabel(theme)}`
            : getThemeDisplayLabel(theme),
        description:
          theme === originalTheme
            ? `Current theme · ${getThemeKindLabel(theme) || "Unknown"}`
            : getThemeKindLabel(theme),
        theme,
      })),
      {
        title: "Dusk Office — Pick a variant",
        placeHolder: "Choose a variant · Enter or click to apply · Esc to cancel",
        matchOnDescription: true,
      },
    );
    if (!picked) return undefined;
    const applied = await applyTheme(picked.theme, context, "manual");
    if (applied) {
      void vscode.window.showInformationMessage(`Theme: ${picked.theme}.`);
      return picked.theme;
    }
    return undefined;
  } catch (err) {
    log.error("setThemeVariant", err);
    void vscode.window.showErrorMessage("Dusk Office: failed to switch theme.");
  } finally {
    state.isQuickPickOpen = false;
  }
}

async function switchToPreviousTheme(context) {
  try {
    const previous = context.globalState.get(keys.PREVIOUS_THEME_KEY);
    if (!isThemeName(previous)) {
      void vscode.window.showInformationMessage("No previous theme.");
      return;
    }
    if (isDuskTheme(previous)) {
      await applyTheme(previous, context);
      void vscode.window.showInformationMessage(`Previous: ${previous}.`);
      return;
    }
    const current = cfg.getCurrentTheme();
    const workbenchCfg = cfg.getWorkbenchConfig();
    await cfg.updateConfigValue(workbenchCfg, "colorTheme", previous);
    if (isThemeName(current) && current !== previous) {
      await context.globalState.update(keys.PREVIOUS_THEME_KEY, current);
    }
    void vscode.window.showInformationMessage(`Previous: ${previous}.`);
  } catch (err) {
    log.error("switchToPreviousTheme", err);
    void vscode.window.showErrorMessage("Dusk Office: failed to switch to previous theme.");
  }
}

async function persistFavoriteTheme(context, theme) {
  try {
    const plainName = stripThemeDisplayLabel(theme);
    if (!isDuskTheme(plainName)) return;
    await context.globalState.update(keys.FAVORITE_THEME_KEY, plainName);
    await cfg.updateConfigValue(cfg.getExtensionConfig(), "favoriteTheme", plainName);
  } catch (err) {
    log.error("persistFavoriteTheme", err);
  }
}

function resolveFavoriteTheme(context) {
  const fromSetting = cfg.getFavoriteThemeSetting();
  if (isDuskTheme(fromSetting)) return fromSetting;
  const fromState = context.globalState.get(keys.FAVORITE_THEME_KEY);
  return isDuskTheme(fromState) ? fromState : "";
}

async function setFavoriteTheme(context) {
  try {
  const current = cfg.getCurrentTheme();
  const favorite = resolveFavoriteTheme(context);
  const picked = await vscode.window.showQuickPick(
    THEME_VARIANTS.map((theme) => ({
      label:
        theme === current
          ? `$(check) ${getThemeDisplayLabel(theme)}`
          : getThemeDisplayLabel(theme),
      description:
        theme === favorite
          ? "Favorite"
          : theme === current
            ? `Current theme · ${getThemeKindLabel(theme) || "Unknown"}`
            : getThemeKindLabel(theme),
      theme,
    })),
    {
      placeHolder: "Choose favorite theme",
      matchOnDescription: true,
    },
  );
  if (!picked) return;
  const theme = picked.theme;
  await persistFavoriteTheme(context, theme);
  void vscode.window.showInformationMessage(`Favorite: ${theme}.`);
  } catch (err) {
    log.error("setFavoriteTheme", err);
  }
}

async function switchToFavoriteTheme(context) {
  try {
    const favorite = resolveFavoriteTheme(context);
    if (!isDuskTheme(favorite)) {
      void vscode.window.showInformationMessage("No favorite theme.");
      return;
    }
    await applyTheme(favorite, context);
    void vscode.window.showInformationMessage(`Theme: ${favorite}.`);
  } catch (err) {
    log.error("switchToFavoriteTheme", err);
    void vscode.window.showErrorMessage("Dusk Office: failed to switch to favorite theme.");
  }
}

async function toggleActivityBarLocation() {
  try {
    const workbenchCfg = cfg.getWorkbenchConfig();
    const current = cfg.getActivityBarLocation();
    const next = current === "top" ? "default" : "top";
    await cfg.updateConfigValue(workbenchCfg, "activityBar.location", next);
    void vscode.window.showInformationMessage(
      next === "top" ? "Activity Bar: top." : "Activity Bar: default.",
    );
  } catch (err) {
    log.error("toggleActivityBarLocation", err);
    void vscode.window.showErrorMessage("Dusk Office: failed to toggle activity bar.");
  }
}

module.exports = {
  saveWorkspaceTheme,
  applyTheme,
  applyDefaultTheme,
  setThemeVariant,
  switchToPreviousTheme,
  persistFavoriteTheme,
  resolveFavoriteTheme,
  setFavoriteTheme,
  switchToFavoriteTheme,
  toggleActivityBarLocation,
};
