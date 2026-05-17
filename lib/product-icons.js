const vscode = require("vscode");
const keys = require("./extension-keys.js");
const state = require("./extension-state.js");
const cfg = require("./configuration.js");

async function restorePreviousProductIconIfStored(context) {
  const stored = context.globalState.get(keys.PREVIOUS_PRODUCT_ICON_KEY);
  const wb = cfg.getWorkbenchConfig();
  const snapshot = cfg.readStoredSettingSnapshot(stored, keys.PREVIOUS_PRODUCT_ICON_UNSET);
  try {
    await wb.update("productIconTheme", snapshot.value, snapshot.target);
  } catch {
    /* read-only settings */
  }
  await context.globalState.update(keys.PREVIOUS_PRODUCT_ICON_KEY, undefined);
}

/**
 * Toggle Dusk Office product icon theme: first activation saves prior global theme and applies Dusk;
 * second activation restores the saved theme (or Default).
 */
async function toggleProductIconTheme(context) {
  if (!state.duskProductIconThemeId) {
    void vscode.window.showWarningMessage("Dusk Office: no product icon theme in this build.");
    return;
  }
  try {
    const wb = cfg.getWorkbenchConfig();
    if (cfg.areDuskIconsEnabled()) {
      await restorePreviousProductIconIfStored(context);
      void vscode.window.showInformationMessage("Product icon theme: restored.");
      return;
    }
    const inspected = wb.inspect("productIconTheme");
    if (context.globalState.get(keys.PREVIOUS_PRODUCT_ICON_KEY) === undefined) {
      const target = cfg.getConfigTarget(wb, "productIconTheme");
      const previousValue =
        target === vscode.ConfigurationTarget.Workspace ? inspected?.workspaceValue : inspected?.globalValue;
      const snapshot = cfg.createStoredSettingSnapshot(target, previousValue, keys.PREVIOUS_PRODUCT_ICON_UNSET);
      await context.globalState.update(keys.PREVIOUS_PRODUCT_ICON_KEY, snapshot);
    }
    await cfg.updateConfigValue(wb, "productIconTheme", state.duskProductIconThemeId);
    void vscode.window.showInformationMessage("Product icon theme: Dusk Office · Product.");
  } catch {
    void vscode.window.showWarningMessage(
      "Could not change product icon theme (settings may be read-only).",
    );
  }
}

module.exports = {
  restorePreviousProductIconIfStored,
  toggleProductIconTheme,
};
