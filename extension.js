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
];

const PREVIOUS_THEME_KEY = "duskOffice.previousTheme";
const FAVORITE_THEME_KEY = "duskOffice.favoriteTheme";
const WORKSPACE_THEME_KEY = "duskOffice.workspaceTheme";
const STATUS_BAR_PRIORITY = 100;

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

function isDuskTheme(theme) {
  return typeof theme === "string" && THEME_VARIANTS.includes(theme);
}

function isThemeName(theme) {
  return typeof theme === "string" && theme.trim().length > 0;
}

function cleanPickedLabel(label) {
  return label.replace(/^\$\(check\)\s+/, "");
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
  const hour = now.getHours();
  const useDark =
    autoSwitch.lightHour <= autoSwitch.darkHour
      ? hour >= autoSwitch.darkHour || hour < autoSwitch.lightHour
      : hour >= autoSwitch.darkHour && hour < autoSwitch.lightHour;
  return useDark ? autoSwitch.darkTheme : autoSwitch.lightTheme;
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

function getThemeShortLabel(theme) {
  return typeof theme === "string" ? theme.replace(/^Dusk Office\s*/, "") || "Dusk" : "Theme";
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
  await config.update("colorTheme", theme, vscode.ConfigurationTarget.Global);
  if (source !== "startup") {
    await saveWorkspaceTheme(theme, context);
  }
  return true;
}

async function setThemeVariant(context) {
  const current = getCurrentTheme();
  const picked = await vscode.window.showQuickPick(
    THEME_VARIANTS.map((label) => ({
      label: label === current ? `$(check) ${label}` : label,
      description: label === current ? "Current theme" : "",
    })),
    {
      placeHolder: "Choose a theme",
      matchOnDescription: true,
    },
  );
  if (!picked) return;
  const theme = cleanPickedLabel(picked.label);
  await applyTheme(theme, context);
  void vscode.window.showInformationMessage(`Theme: ${theme}.`);
}

async function switchToPreviousTheme(context) {
  const previous = context.globalState.get(PREVIOUS_THEME_KEY);
  if (!isThemeName(previous)) {
    void vscode.window.showInformationMessage("No previous theme.");
    return;
  }
  const current = getCurrentTheme();
  const config = getWorkbenchConfig();
  await config.update("colorTheme", previous, vscode.ConfigurationTarget.Global);
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
  await config.update("activityBar.location", next, vscode.ConfigurationTarget.Global);
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
  if (!isDuskTheme(favorite) || favorite === getCurrentTheme()) return false;
  return applyTheme(favorite, context, "startup");
}

async function restoreWorkspaceTheme(context) {
  if (!getWorkspaceThemeMemoryEnabled()) return false;
  const theme = context.workspaceState.get(WORKSPACE_THEME_KEY);
  if (!isDuskTheme(theme) || theme === getCurrentTheme()) return false;
  return applyTheme(theme, context, "startup");
}

async function runAutoSwitch(context, showMessage = false) {
  const theme = getAutoSwitchTheme();
  if (!isDuskTheme(theme)) return false;
  if (theme === getCurrentTheme()) return false;
  await applyTheme(theme, context, "auto");
  if (showMessage) {
    void vscode.window.showInformationMessage(`Auto switch: ${theme}.`);
  }
  return true;
}

async function toggleAutoSwitch(context) {
  const config = getExtensionConfig();
  const enabled = !getAutoSwitchConfig().enabled;
  await config.update("autoSwitch.enabled", enabled, vscode.ConfigurationTarget.Global);
  if (enabled) {
    await runAutoSwitch(context, true);
  } else {
    void vscode.window.showInformationMessage("Auto switch: off.");
  }
}

async function openControlCenter(context) {
  const currentTheme = getCurrentTheme();
  const activityBarLocation = getActivityBarLocation();
  const previousTheme = context.globalState.get(PREVIOUS_THEME_KEY);
  const favoriteTheme = context.globalState.get(FAVORITE_THEME_KEY);
  const rememberedTheme = context.workspaceState.get(WORKSPACE_THEME_KEY);
  const autoSwitch = getAutoSwitchConfig();
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
        description: isDuskTheme(previousTheme) ? `Previous: ${previousTheme}` : "No previous theme",
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
    item.text = `$(symbol-color) ${getThemeShortLabel(currentTheme)}`;
    item.tooltip = iconsEnabled ? "Dusk Office: theme and icons" : "Dusk Office: theme";
    item.show();
  };

  update();

  context.subscriptions.push(
    item,
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (
        event.affectsConfiguration("workbench.colorTheme") ||
        event.affectsConfiguration("duskOffice.statusBar.enabled")
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

async function initializeStartupBehavior(context) {
  if (await runAutoSwitch(context)) return;
  if (await restoreWorkspaceTheme(context)) return;
  await applyFavoriteOnStartup(context);
}

async function activate(context) {
  context.subscriptions.push(
    vscode.commands.registerCommand("duskOffice.openControlCenter", () => openControlCenter(context)),
    vscode.commands.registerCommand("duskOffice.switchThemeVariant", () => setThemeVariant(context)),
    vscode.commands.registerCommand("duskOffice.switchToPreviousTheme", () => switchToPreviousTheme(context)),
    vscode.commands.registerCommand("duskOffice.setFavoriteTheme", () => setFavoriteTheme(context)),
    vscode.commands.registerCommand("duskOffice.switchToFavoriteTheme", () => switchToFavoriteTheme(context)),
    vscode.commands.registerCommand("duskOffice.toggleAutoSwitch", () => toggleAutoSwitch(context)),
    vscode.commands.registerCommand("duskOffice.toggleActivityBarLocation", toggleActivityBarLocation),
    vscode.commands.registerCommand("duskOffice.openSettings", openDuskOfficeSettings),
    createAutoSwitchManager(context),
  );
  createStatusBarItem(context);
  await initializeStartupBehavior(context);
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
