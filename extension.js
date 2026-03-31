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

const PRODUCT_ICON_THEME_ID = "dusk-office-icons";
const PREVIOUS_THEME_KEY = "duskOffice.previousTheme";
const FAVORITE_THEME_KEY = "duskOffice.favoriteTheme";

function getWorkbenchConfig() {
  return vscode.workspace.getConfiguration("workbench");
}

function getCurrentTheme() {
  return getWorkbenchConfig().get("colorTheme");
}

function areDuskIconsEnabled() {
  return getWorkbenchConfig().get("productIconTheme") === PRODUCT_ICON_THEME_ID;
}

function isDuskTheme(theme) {
  return typeof theme === "string" && THEME_VARIANTS.includes(theme);
}

async function applyTheme(theme, context) {
  if (!isDuskTheme(theme)) return false;
  const config = getWorkbenchConfig();
  const current = getCurrentTheme();
  if (context && isDuskTheme(current) && current !== theme) {
    await context.globalState.update(PREVIOUS_THEME_KEY, current);
  }
  await config.update("colorTheme", theme, vscode.ConfigurationTarget.Global);
  return true;
}

async function setThemeVariant(context) {
  const config = getWorkbenchConfig();
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
  await applyTheme(picked.label.replace(/^\$\(check\)\s+/, ""), context);
  void vscode.window.showInformationMessage(`Theme: ${picked.label}.`);
}

async function switchToPreviousTheme(context) {
  const previous = context.globalState.get(PREVIOUS_THEME_KEY);
  if (!isDuskTheme(previous)) {
    void vscode.window.showInformationMessage("No previous theme.");
    return;
  }
  const current = getCurrentTheme();
  await applyTheme(previous, context);
  if (isDuskTheme(current) && current !== previous) {
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
  const theme = picked.label.replace(/^\$\(check\)\s+/, "");
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

async function toggleProductIcons() {
  const config = getWorkbenchConfig();
  const current = config.get("productIconTheme");
  const enable = current !== PRODUCT_ICON_THEME_ID;
  await config.update(
    "productIconTheme",
    enable ? PRODUCT_ICON_THEME_ID : null,
    vscode.ConfigurationTarget.Global,
  );
  void vscode.window.showInformationMessage(
    enable ? "Icons: enabled." : "Icons: default.",
  );
}

async function openDuskOfficeSettings() {
  await vscode.commands.executeCommand(
    "workbench.action.openSettings",
    "@ext:dekidev.dusk-office",
  );
}

async function openControlCenter(context) {
  const currentTheme = getCurrentTheme();
  const iconsEnabled = areDuskIconsEnabled();
  const previousTheme = context.globalState.get(PREVIOUS_THEME_KEY);
  const favoriteTheme = context.globalState.get(FAVORITE_THEME_KEY);
  const picked = await vscode.window.showQuickPick(
    [
      {
        label: `$(paintcan) Theme: ${currentTheme || "Unknown"}`,
        description: iconsEnabled ? "Icons on" : "Default icons",
        detail: "Status",
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
        label: iconsEnabled ? "$(eye-closed) Disable Icons" : "$(eye) Enable Icons",
        description: iconsEnabled ? "Current: Dusk icons" : "Current: default icons",
        detail: "Toggle icons",
        action: toggleProductIcons,
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

function activate(context) {
  context.subscriptions.push(
    vscode.commands.registerCommand("duskOffice.openControlCenter", () => openControlCenter(context)),
    vscode.commands.registerCommand("duskOffice.switchThemeVariant", () => setThemeVariant(context)),
    vscode.commands.registerCommand("duskOffice.switchToPreviousTheme", () => switchToPreviousTheme(context)),
    vscode.commands.registerCommand("duskOffice.setFavoriteTheme", () => setFavoriteTheme(context)),
    vscode.commands.registerCommand("duskOffice.switchToFavoriteTheme", () => switchToFavoriteTheme(context)),
    vscode.commands.registerCommand("duskOffice.toggleProductIcons", toggleProductIcons),
    vscode.commands.registerCommand("duskOffice.openSettings", openDuskOfficeSettings),
  );
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
