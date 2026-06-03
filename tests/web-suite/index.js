// Web extension smoke test — runs INSIDE the browser-based extension host
// (Web Worker) via @vscode/test-web. Confirms the bundled dist/web/extension.js
// activates and its commands run with no Node runtime available.
//
// IMPORTANT: the web worker has NO Node builtins — only `require("vscode")`.
// Do not require "assert"/"fs"/"path" here.
const vscode = require("vscode");

function ok(condition, message) {
  if (!condition) throw new Error(message);
}

exports.run = function run() {
  return (async () => {
    const ext = vscode.extensions.getExtension("dekidev.dusk-office");
    ok(ext, "extension not found in web host");

    await ext.activate();
    ok(ext.isActive, "extension did not activate");

    const commands = await vscode.commands.getCommands(true);
    for (const id of [
      "duskOffice.openControlCenter",
      "duskOffice.openThemeGallery",
      "duskOffice.verifyTerminalContrast",
      "duskOffice.verifyEditorContrast",
    ]) {
      ok(commands.includes(id), `command not registered: ${id}`);
    }

    // Exercise the fs-free runtime features end to end (these read the embedded
    // theme bundle, never the filesystem).
    await vscode.commands.executeCommand("duskOffice.openThemeGallery");
    await vscode.commands.executeCommand("duskOffice.verifyEditorContrast");
    await vscode.commands.executeCommand("duskOffice.verifyTerminalContrast");

    console.log("WEB-SMOKE-OK: activated + commands executed with no fs");
  })();
};
