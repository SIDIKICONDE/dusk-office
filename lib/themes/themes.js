const vscode = require("vscode");
const {
  THEME_VARIANTS,
  isDuskTheme,
  isLightThemeVariant,
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
    // Write both preferred slots so the theme applies no matter the current OS mode
    if (isLightThemeVariant(theme)) {
      await cfg.updateConfigValue(wb, "preferredLightColorTheme", theme);
    } else {
      await cfg.updateConfigValue(wb, "preferredDarkColorTheme", theme);
    }
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
    if (!isDuskTheme(theme)) return false;
    const workbenchCfg = cfg.getWorkbenchConfig();
    const current = cfg.getCurrentTheme();
    if (context && isThemeName(current) && current !== theme) {
      await context.globalState.update(keys.PREVIOUS_THEME_KEY, current);
    }
    await cfg.updateConfigValue(workbenchCfg, "colorTheme", theme);
    await syncPreferredThemeIfAutoDetect(theme, workbenchCfg);
    await titleBar.syncTitleBarStyleForDuskTheme(context);
    if (source === "manual") {
      state.lastManualThemeApplyTime = Date.now();
      await saveWorkspaceTheme(theme, context);
    }
    return true;
  } catch (err) {
    log.error("applyTheme", err);
    return false;
  }
}

/**
 * Opens a live-preview Quick Pick of the 27 Dusk Office variants. As the user
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
  const workbenchCfg = cfg.getWorkbenchConfig();
  const originalTheme = cfg.getCurrentTheme();

  return new Promise((resolve) => {
    const quickPick = vscode.window.createQuickPick();
    quickPick.title = "Dusk Office — Pick a variant (live preview with ↑↓ or type to filter)";
    quickPick.placeholder =
      "Use ↑↓ keys (or type) for live preview · Enter to confirm · Esc to revert · click commits";
    quickPick.matchOnDescription = true;

    const items = THEME_VARIANTS.map((theme) => ({
      label:
        theme === originalTheme
          ? `$(check) ${getThemeDisplayLabel(theme)}`
          : getThemeDisplayLabel(theme),
      description:
        theme === originalTheme
          ? `Current theme · ${getThemeKindLabel(theme) || "Unknown"}`
          : getThemeKindLabel(theme),
      _theme: theme,
    }));
    quickPick.items = items;

    const currentItem = items.find((it) => it._theme === originalTheme);
    if (currentItem) quickPick.activeItems = [currentItem];

    let accepted = false;
    let lastPreviewed = originalTheme;
    state.isQuickPickOpen = true;

    quickPick.onDidChangeActive((active) => {
      try {
        const item = active[0];
        if (!item || !item._theme || item._theme === lastPreviewed) return;
        lastPreviewed = item._theme;
        void cfg.updateConfigValue(workbenchCfg, "colorTheme", item._theme).catch((err) =>
          log.warn("setThemeVariant:preview", err),
        );
      } catch (err) {
        log.warn("setThemeVariant:onDidChangeActive", err);
      }
    });

    quickPick.onDidAccept(async () => {
      try {
        accepted = true;
        const item = quickPick.activeItems[0];
        quickPick.hide();
        if (!item || !item._theme) {
          resolve();
          return;
        }
        const picked = item._theme;
        if (context && isThemeName(originalTheme) && originalTheme !== picked) {
          await context.globalState.update(keys.PREVIOUS_THEME_KEY, originalTheme);
        }
        await applyTheme(picked, context, "manual");
        void vscode.window.showInformationMessage(`Theme: ${picked}.`);
      } catch (err) {
        log.error("setThemeVariant:onDidAccept", err);
      } finally {
        resolve();
      }
    });

    quickPick.onDidHide(async () => {
      try {
        if (!accepted && lastPreviewed !== originalTheme) {
          await cfg.updateConfigValue(workbenchCfg, "colorTheme", originalTheme);
        }
      } catch (err) {
        log.warn("setThemeVariant:onDidHide", err);
      } finally {
        state.isQuickPickOpen = false;
        quickPick.dispose();
        resolve();
      }
    });

    quickPick.show();
  });
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
    if (!isDuskTheme(theme)) return;
    await context.globalState.update(keys.FAVORITE_THEME_KEY, theme);
    await cfg.updateConfigValue(cfg.getExtensionConfig(), "favoriteTheme", theme);
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
    })),
    {
      placeHolder: "Choose favorite theme",
      matchOnDescription: true,
    },
  );
  if (!picked) return;
  const theme = stripThemeDisplayLabel(picked.label);
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
  setThemeVariant,
  switchToPreviousTheme,
  persistFavoriteTheme,
  resolveFavoriteTheme,
  setFavoriteTheme,
  switchToFavoriteTheme,
  toggleActivityBarLocation,
};
