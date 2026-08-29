const vscode = require("vscode");
const keys = require("../core/extension-keys.js");
const cfg = require("../core/configuration.js");
const { isDuskTheme } = require("../themes/theme-common.js");
const log = require("../core/log.js");

const WALKTHROUGH_ID = "dekidev.dusk-office#duskOfficeGetStarted";

async function openGetStartedWalkthrough() {
  await vscode.commands.executeCommand("workbench.action.openWalkthrough", WALKTHROUGH_ID, false);
}

async function showActivationPrompt(context, options = {}) {
  try {
    // First install — open the 2-step walkthrough even if Dusk is not active yet.
    if (!context.globalState.get(keys.WALKTHROUGH_SHOWN_KEY)) {
      await context.globalState.update(keys.WALKTHROUGH_SHOWN_KEY, true);
      await context.workspaceState.update(keys.WORKSPACE_ACTIVATION_PROMPT_KEY, true);
      await openGetStartedWalkthrough();
      return true;
    }

    if (!isDuskTheme(cfg.getCurrentTheme())) return false;

    if (!options.force && context.workspaceState.get(keys.WORKSPACE_ACTIVATION_PROMPT_KEY)) {
      return false;
    }

    const chooseTheme = "Choose Theme";
    const suggestTheme = "Suggest for Workspace";
    const getStarted = "Get Started";
    const later = "Later";
    const choice = await vscode.window.showInformationMessage(
      "Dusk Office is active. Choose a variant, let Dusk Office recommend one for this workspace, or open the two-step setup.",
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
      await vscode.commands.executeCommand("workbench.action.openWalkthrough", WALKTHROUGH_ID);
    }
    return true;
  } catch (err) {
    log.error("showActivationPrompt", err);
    return false;
  }
}

module.exports = { showActivationPrompt };
