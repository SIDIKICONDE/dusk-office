const vscode = require("vscode");
const { activateAnsiEditor } = require("./lib/ansi-editor.js");

const state = require("./lib/extension-state.js");
const { isDuskTheme } = require("./lib/theme-common.js");
const cfg = require("./lib/configuration.js");
const titleBar = require("./lib/title-bar.js");
const themes = require("./lib/themes.js");
const keys = require("./lib/extension-keys.js");
const autoAdaptive = require("./lib/auto-adaptive.js");
const editorAnsi = require("./lib/editor-ansi.js");
const productIcons = require("./lib/product-icons.js");
const { openControlCenter } = require("./lib/control-center.js");
const { createStatusBarItem } = require("./lib/status-bar.js");
const { createAutoSwitchManager, createAdaptiveFocusManager } = require("./lib/feature-managers.js");
const { initializeStartupBehavior } = require("./lib/startup.js");
const { showActivationPrompt } = require("./lib/activation-prompt.js");
const {
  detectWorkspaceFingerprint,
  clearWorkspaceFingerprint,
} = require("./lib/workspace-fingerprint.js");
const { verifyTerminalContrast } = require("./lib/terminal-verify.js");
const { resetAllSettings } = require("./lib/legacy-reset.js");
const { runQuickSetup } = require("./lib/quick-setup.js");
const { openMarketplaceReviewPage, initializeMarketplaceReviewTracking } = require("./lib/marketplace-review-prompt.js");
const log = require("./lib/log.js");

async function activate(context) {
  const pic = context.extension.packageJSON?.contributes?.productIconThemes;
  const picId = Array.isArray(pic) && typeof pic[0]?.id === "string" ? pic[0].id : "";
  state.duskProductIconThemeId = picId;

  await initializeMarketplaceReviewTracking(context);
  await autoAdaptive.reconcileAutomaticModes();
  void vscode.commands.executeCommand("setContext", "duskOffice.isActive", isDuskTheme(cfg.getCurrentTheme()));

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(async (e) => {
      if (
        e.affectsConfiguration("duskOffice.autoSwitch.enabled") ||
        e.affectsConfiguration("duskOffice.adaptiveFocus.enabled")
      ) {
        await autoAdaptive.reconcileAutomaticModes();
      }
      const titleBarStyleChanged = e.affectsConfiguration("window.titleBarStyle");
      if (titleBarStyleChanged && state.ignoreTitleBarStyleConfigChange) {
        return;
      }
      if (titleBarStyleChanged && (await titleBar.releaseTitleBarStyleSyncIfOverridden(context))) {
        return;
      }
      if (
        e.affectsConfiguration("workbench.colorTheme") ||
        e.affectsConfiguration("workbench.preferredLightColorTheme") ||
        e.affectsConfiguration("workbench.preferredDarkColorTheme") ||
        e.affectsConfiguration("window.autoDetectColorScheme")
      ) {
        void vscode.commands.executeCommand("setContext", "duskOffice.isActive", isDuskTheme(cfg.getCurrentTheme()));
      }
      if (e.affectsConfiguration("duskOffice.favoriteTheme")) {
        const favorite = cfg.getFavoriteThemeSetting();
        await context.globalState.update(
          keys.FAVORITE_THEME_KEY,
          isDuskTheme(favorite) ? favorite : undefined,
        );
      }
      if (
        titleBarStyleChanged ||
        e.affectsConfiguration("workbench.colorTheme") ||
        e.affectsConfiguration("workbench.preferredLightColorTheme") ||
        e.affectsConfiguration("workbench.preferredDarkColorTheme") ||
        e.affectsConfiguration("window.autoDetectColorScheme") ||
        e.affectsConfiguration("duskOffice.titleBar.alignWithTheme")
      ) {
        void titleBar.syncTitleBarStyleForDuskTheme(context);
      }
    }),
    vscode.window.onDidChangeActiveColorTheme(() => {
      void vscode.commands.executeCommand("setContext", "duskOffice.isActive", isDuskTheme(cfg.getCurrentTheme()));
      void titleBar.syncTitleBarStyleForDuskTheme(context);
    }),
    vscode.commands.registerCommand("duskOffice.openControlCenter", () => openControlCenter(context)),
    vscode.commands.registerCommand("duskOffice.switchThemeVariant", () => themes.setThemeVariant(context)),
    vscode.commands.registerCommand("duskOffice.switchToPreviousTheme", () => themes.switchToPreviousTheme(context)),
    vscode.commands.registerCommand("duskOffice.setFavoriteTheme", () => themes.setFavoriteTheme(context)),
    vscode.commands.registerCommand("duskOffice.switchToFavoriteTheme", () => themes.switchToFavoriteTheme(context)),
    vscode.commands.registerCommand("duskOffice.toggleAutoSwitch", () => autoAdaptive.toggleAutoSwitch(context)),
    vscode.commands.registerCommand("duskOffice.toggleAdaptiveFocus", () => autoAdaptive.toggleAdaptiveFocus(context)),
    vscode.commands.registerCommand("duskOffice.toggleActivityBarLocation", themes.toggleActivityBarLocation),
    vscode.commands.registerCommand("duskOffice.toggleProductIconTheme", () =>
      productIcons.toggleProductIconTheme(context),
    ),
    vscode.commands.registerCommand("duskOffice.openSettings", editorAnsi.openDuskOfficeSettings),
    vscode.commands.registerCommand("duskOffice.toggleEditorAnsi", editorAnsi.toggleEditorAnsi),
    vscode.commands.registerCommand("duskOffice.enableEditorAnsi", () => editorAnsi.setEditorAnsiEnabled(true)),
    vscode.commands.registerCommand("duskOffice.disableEditorAnsi", () => editorAnsi.setEditorAnsiEnabled(false)),
    vscode.commands.registerCommand("duskOffice.openEditorAnsiSettings", editorAnsi.openEditorAnsiSettings),
    vscode.commands.registerCommand("duskOffice.verifyTerminalContrast", () => verifyTerminalContrast(context)),
    vscode.commands.registerCommand("duskOffice.resetTheme", () => resetAllSettings(context)),
    vscode.commands.registerCommand("duskOffice.applyAdaptiveFocusTheme", () =>
      autoAdaptive.applyAdaptiveFocusTheme(context, { force: true, showMessage: true }),
    ),
    vscode.commands.registerCommand("duskOffice.suggestVariantForWorkspace", () =>
      detectWorkspaceFingerprint(context, { force: true, showAlways: true }),
    ),
    vscode.commands.registerCommand("duskOffice.clearWorkspaceFingerprint", () =>
      clearWorkspaceFingerprint(context),
    ),
    vscode.commands.registerCommand("duskOffice.quickSetup", () => runQuickSetup(context)),
    vscode.commands.registerCommand("duskOffice.rateOnMarketplace", () => openMarketplaceReviewPage()),
    createAutoSwitchManager(context),
    createAdaptiveFocusManager(context),
  );

  activateAnsiEditor(context);
  createStatusBarItem(context);
  await initializeStartupBehavior(context);
  await titleBar.syncTitleBarStyleForDuskTheme(context);

  setTimeout(() => {
    void showActivationPrompt(context).then((shown) => {
      if (!shown) {
        void detectWorkspaceFingerprint(context);
      }
    });
  }, 1200);
}

function deactivate() {
  log.dispose();
}

module.exports = {
  activate,
  deactivate,
};
