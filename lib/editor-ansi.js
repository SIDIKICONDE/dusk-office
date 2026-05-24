const vscode = require("vscode");
const cfg = require("./configuration.js");
const log = require("./log.js");

async function openDuskOfficeSettings() {
  await vscode.commands.executeCommand(
    "workbench.action.openSettings",
    "@ext:dekidev.dusk-office",
  );
}

async function openEditorAnsiSettings() {
  await vscode.commands.executeCommand(
    "workbench.action.openSettings",
    "@ext:dekidev.dusk-office duskOffice.editorAnsi",
  );
}

async function toggleEditorAnsi() {
  try {
    const extCfg = cfg.getExtensionConfig();
    const next = !cfg.getEditorAnsiEnabled();
    await cfg.updateConfigValue(extCfg, "editorAnsi.enabled", next);
    void vscode.window.showInformationMessage(
      next
        ? "Dusk Office: ANSI colors in editor enabled."
        : "Dusk Office: ANSI colors in editor disabled.",
    );
  } catch (err) {
    log.error("toggleEditorAnsi", err);
  }
}

async function setEditorAnsiEnabled(enabled) {
  try {
    const extCfg = cfg.getExtensionConfig();
    if (cfg.getEditorAnsiEnabled() === enabled) return;
    await cfg.updateConfigValue(extCfg, "editorAnsi.enabled", enabled);
    void vscode.window.showInformationMessage(
      enabled
        ? "Dusk Office: ANSI colors in editor enabled."
        : "Dusk Office: ANSI colors in editor disabled.",
    );
  } catch (err) {
    log.error("setEditorAnsiEnabled", err);
  }
}

module.exports = {
  openDuskOfficeSettings,
  openEditorAnsiSettings,
  toggleEditorAnsi,
  setEditorAnsiEnabled,
};
