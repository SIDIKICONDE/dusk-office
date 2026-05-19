const vscode = require("vscode");
const {
  THEME_VARIANTS,
  isDuskTheme,
  isThemeName,
  cleanPickedLabel,
} = require("./theme-common.js");
const keys = require("./extension-keys.js");
const cfg = require("./configuration.js");
const titleBar = require("./title-bar.js");

async function saveWorkspaceTheme(theme, context) {
  if (!context || !cfg.getWorkspaceThemeMemoryEnabled()) return;
  if (!vscode.workspace.workspaceFolders?.length) return;
  await context.workspaceState.update(keys.WORKSPACE_THEME_KEY, theme);
}

async function applyTheme(theme, context, source = "manual") {
  if (!isDuskTheme(theme)) return false;
  const workbenchCfg = cfg.getWorkbenchConfig();
  const current = cfg.getCurrentTheme();
  if (context && isThemeName(current) && current !== theme) {
    await context.globalState.update(keys.PREVIOUS_THEME_KEY, current);
  }
  await cfg.updateConfigValue(workbenchCfg, "colorTheme", theme);
  await titleBar.syncTitleBarStyleForDuskTheme(context);
  if (source === "manual") {
    await saveWorkspaceTheme(theme, context);
  }
  return true;
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
      void cfg.updateConfigValue(workbenchCfg, "colorTheme", item._theme);
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
      if (context && isThemeName(originalTheme) && originalTheme !== picked) {
        await context.globalState.update(keys.PREVIOUS_THEME_KEY, originalTheme);
      }
      await applyTheme(picked, context, "manual");
      void vscode.window.showInformationMessage(`Theme: ${picked}.`);
      resolve();
    });

    quickPick.onDidHide(async () => {
      if (!accepted && lastPreviewed !== originalTheme) {
        await cfg.updateConfigValue(workbenchCfg, "colorTheme", originalTheme);
      }
      quickPick.dispose();
      resolve();
    });

    quickPick.show();
  });
}

async function switchToPreviousTheme(context) {
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
}

async function persistFavoriteTheme(context, theme) {
  if (!isDuskTheme(theme)) return;
  await context.globalState.update(keys.FAVORITE_THEME_KEY, theme);
  await cfg.updateConfigValue(cfg.getExtensionConfig(), "favoriteTheme", theme);
}

function resolveFavoriteTheme(context) {
  const fromSetting = cfg.getFavoriteThemeSetting();
  if (isDuskTheme(fromSetting)) return fromSetting;
  const fromState = context.globalState.get(keys.FAVORITE_THEME_KEY);
  return isDuskTheme(fromState) ? fromState : "";
}

async function setFavoriteTheme(context) {
  const current = cfg.getCurrentTheme();
  const favorite = resolveFavoriteTheme(context);
  const picked = await vscode.window.showQuickPick(
    THEME_VARIANTS.map((label) => ({
      label: label === current ? `$(check) ${label}` : label,
      description:
        label === favorite ? "Favorite" : label === current ? "Current theme" : "",
    })),
    {
      placeHolder: "Choose favorite theme",
      matchOnDescription: true,
    },
  );
  if (!picked) return;
  const theme = cleanPickedLabel(picked.label);
  await persistFavoriteTheme(context, theme);
  void vscode.window.showInformationMessage(`Favorite: ${theme}.`);
}

async function switchToFavoriteTheme(context) {
  const favorite = resolveFavoriteTheme(context);
  if (!isDuskTheme(favorite)) {
    void vscode.window.showInformationMessage("No favorite theme.");
    return;
  }
  await applyTheme(favorite, context);
  void vscode.window.showInformationMessage(`Theme: ${favorite}.`);
}

async function toggleActivityBarLocation() {
  const workbenchCfg = cfg.getWorkbenchConfig();
  const current = cfg.getActivityBarLocation();
  const next = current === "top" ? "default" : "top";
  await cfg.updateConfigValue(workbenchCfg, "activityBar.location", next);
  void vscode.window.showInformationMessage(
    next === "top" ? "Activity Bar: top." : "Activity Bar: default.",
  );
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
