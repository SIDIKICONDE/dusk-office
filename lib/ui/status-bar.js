const vscode = require("vscode");
const keys = require("../core/extension-keys.js");
const { getThemeShortLabel } = require("../themes/theme-common.js");
const cfg = require("../core/configuration.js");

function createStatusBarItem(context) {
  const item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, keys.STATUS_BAR_PRIORITY);
  item.command = "duskOffice.openControlCenter";
  item.name = "Dusk Office";

  const update = () => {
    if (!cfg.getStatusBarEnabled()) {
      item.hide();
      return;
    }
    const currentTheme = cfg.getCurrentTheme();
    const iconsEnabled = cfg.areDuskIconsEnabled();
    const autoSwitch = cfg.getAutoSwitchConfig();
    const autoSwitchTheme = cfg.getAutoSwitchTheme();
    const adaptiveFocus = cfg.getAdaptiveFocusConfig();
    const activeLanguage = vscode.window.activeTextEditor?.document?.languageId || "";
    const adaptiveChoice = cfg.resolveAdaptiveFocusTheme(activeLanguage, new Date(), { force: true });
    const dynamicTheme =
      adaptiveFocus.enabled && adaptiveChoice?.theme ? adaptiveChoice.theme : autoSwitchTheme;
    const dynamicEnabled = adaptiveFocus.enabled || autoSwitch.enabled;
    item.text = `$(symbol-color) ${getThemeShortLabel(currentTheme)}${dynamicEnabled ? " $(sparkle)" : ""}`;
    if (adaptiveFocus.enabled) {
      item.tooltip = `Dusk Office: ${currentTheme || "unknown"} · adaptive now: ${
        adaptiveChoice?.theme || "unknown"
      }`;
    } else if (autoSwitch.enabled) {
      item.tooltip = `Dusk Office: ${currentTheme || "unknown"} · auto now: ${
        dynamicTheme || "unknown"
      }`;
    } else {
      item.tooltip = iconsEnabled
        ? `Dusk Office: ${currentTheme || "unknown"} · theme and icons`
        : `Dusk Office: ${currentTheme || "unknown"}`;
    }
    item.show();
  };

  update();

  context.subscriptions.push(
    item,
    vscode.window.onDidChangeActiveColorTheme(() => update()),
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (
        event.affectsConfiguration("workbench.colorTheme") ||
        event.affectsConfiguration("workbench.preferredLightColorTheme") ||
        event.affectsConfiguration("workbench.preferredDarkColorTheme") ||
        event.affectsConfiguration("window.autoDetectColorScheme") ||
        event.affectsConfiguration("workbench.productIconTheme") ||
        event.affectsConfiguration("duskOffice.statusBar.enabled") ||
        event.affectsConfiguration("duskOffice.autoSwitch") ||
        event.affectsConfiguration("duskOffice.adaptiveFocus")
      ) {
        update();
      }
    }),
  );
}

module.exports = { createStatusBarItem };
