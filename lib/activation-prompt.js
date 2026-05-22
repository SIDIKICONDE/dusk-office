const vscode = require("vscode");
const keys = require("./extension-keys.js");
const cfg = require("./configuration.js");
const { isDuskTheme } = require("./theme-common.js");

async function showActivationPrompt(context, options = {}) {
  if (!options.force && context.workspaceState.get(keys.WORKSPACE_ACTIVATION_PROMPT_KEY)) {
    return false;
  }
  if (!isDuskTheme(cfg.getCurrentTheme())) return false;

  const chooseTheme = "Choose Theme";
  const suggestTheme = "Suggest for Workspace";
  const getStarted = "Get Started";
  const later = "Later";
  const choice = await vscode.window.showInformationMessage(
    "Dusk Office is active. Choose a variant, let Dusk Office recommend one for this workspace, or open the quick start.",
    chooseTheme,
    suggestTheme,
    getStarted,
    later,
  );

  await context.workspaceState.update(keys.WORKSPACE_ACTIVATION_PROMPT_KEY, true);

  if (choice === chooseTheme) {
    await vscode.commands.executeCommand("duskOffice.switchThemeVariant");
    return true;
  }
  if (choice === suggestTheme) {
    await vscode.commands.executeCommand("duskOffice.suggestVariantForWorkspace");
    return true;
  }
  if (choice === getStarted) {
    await vscode.commands.executeCommand(
      "workbench.action.openWalkthrough",
      "dekidev.dusk-office#duskOfficeGetStarted",
    );
  }
  return true;
}

module.exports = { showActivationPrompt };
