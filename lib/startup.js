const vscode = require("vscode");
const autoAdaptive = require("./auto-adaptive.js");

async function initializeStartupBehavior(context) {
  if (await autoAdaptive.applyAdaptiveFocusTheme(context)) return;
  if (await autoAdaptive.runAutoSwitch(context)) return;
  if (await autoAdaptive.restoreWorkspaceTheme(context)) return;
  await autoAdaptive.applyFavoriteOnStartup(context);
}

module.exports = { initializeStartupBehavior };
