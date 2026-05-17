const vscode = require("vscode");
const keys = require("./extension-keys.js");
const { getThemeShortLabel } = require("./theme-common.js");
const cfg = require("./configuration.js");

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
    const adaptiveEnabled = cfg.getAdaptiveFocusConfig().enabled;
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

module.exports = { createStatusBarItem };
