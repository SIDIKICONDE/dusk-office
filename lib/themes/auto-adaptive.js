const vscode = require("vscode");
const { isDuskTheme } = require("./theme-common.js");
const keys = require("../core/extension-keys.js");
const cfg = require("../core/configuration.js");
const themes = require("./themes.js");
const state = require("../core/extension-state.js");
const log = require("../core/log.js");
const { recordMarketplaceReviewEngagement } = require("../prompts/marketplace-review-prompt.js");

function isWithinManualGrace() {
  return Date.now() - state.lastManualThemeApplyTime < state.MANUAL_OVERRIDE_GRACE_MS;
}

async function applyAdaptiveFocusTheme(context, options = {}) {
  try {
    if (!options.force && isWithinManualGrace()) return false;
    const acfg = cfg.getAdaptiveFocusConfig();
    if (!acfg.enabled && !options.force) return false;

    const currentTheme = cfg.getCurrentTheme();
    if (acfg.onlyWhenDuskThemeActive && !isDuskTheme(currentTheme) && !options.force) {
      return false;
    }

    const activeLanguage = vscode.window.activeTextEditor?.document?.languageId || "";
    const choice = cfg.resolveAdaptiveFocusTheme(activeLanguage, new Date(), options);
    if (!choice || !isDuskTheme(choice.theme)) return false;

    if (choice.theme === currentTheme) {
      if (options.showMessage) {
        void vscode.window.showInformationMessage(
          `Adaptive focus: ${choice.theme} (${choice.reason}; already active).`,
        );
      }
      return true;
    }

    await themes.applyTheme(choice.theme, context, "adaptive");
    if (options.showMessage) {
      void vscode.window.showInformationMessage(`Adaptive focus: ${choice.theme} (${choice.reason}).`);
    }
    return true;
  } catch (err) {
    log.error("applyAdaptiveFocusTheme", err);
    return false;
  }
}

async function applyFavoriteOnStartup(context) {
  try {
    if (!cfg.getApplyFavoriteOnStartupEnabled()) return false;
    const favorite = themes.resolveFavoriteTheme(context);
    if (!isDuskTheme(favorite)) return false;
    if (favorite === cfg.getCurrentTheme()) return true;
    return themes.applyTheme(favorite, context, "startup");
  } catch (err) {
    log.error("applyFavoriteOnStartup", err);
    return false;
  }
}

async function restoreWorkspaceTheme(context) {
  try {
    if (!cfg.getWorkspaceThemeMemoryEnabled()) return false;
    const theme = context.workspaceState.get(keys.WORKSPACE_THEME_KEY);
    if (!isDuskTheme(theme)) return false;
    if (theme === cfg.getCurrentTheme()) return true;
    return themes.applyTheme(theme, context, "startup");
  } catch (err) {
    log.error("restoreWorkspaceTheme", err);
    return false;
  }
}

async function runAutoSwitch(context, showMessage = false) {
  try {
    if (isWithinManualGrace()) return false;
    if (cfg.getAdaptiveFocusConfig().enabled) return false;
    const theme = cfg.getAutoSwitchTheme();
    if (!isDuskTheme(theme)) return false;
    if (theme === cfg.getCurrentTheme()) return true;
    await themes.applyTheme(theme, context, "auto");
    if (showMessage) {
      void vscode.window.showInformationMessage(`Auto switch: ${theme}.`);
    }
    return true;
  } catch (err) {
    log.error("runAutoSwitch", err);
    return false;
  }
}

async function reconcileAutomaticModes() {
  try {
    if (!cfg.getAutoSwitchConfig().enabled || !cfg.getAdaptiveFocusConfig().enabled) return false;
    const extensionCfg = cfg.getExtensionConfig();
    await cfg.updateConfigValue(extensionCfg, "autoSwitch.enabled", false);
    log.info("reconcileAutomaticModes: disabled autoSwitch (adaptiveFocus takes precedence)");
    return true;
  } catch (err) {
    log.error("reconcileAutomaticModes", err);
    return false;
  }
}

async function toggleAutoSwitch(context) {
  try {
    const extensionCfg = cfg.getExtensionConfig();
    const enabled = !cfg.getAutoSwitchConfig().enabled;
    if (enabled) {
      const adaptiveWasEnabled = cfg.getAdaptiveFocusConfig().enabled;
      if (adaptiveWasEnabled) {
        await cfg.updateConfigValue(extensionCfg, "adaptiveFocus.enabled", false);
      }
      await cfg.updateConfigValue(extensionCfg, "autoSwitch.enabled", true);
      const applied = await runAutoSwitch(context, false);
      const message = adaptiveWasEnabled
        ? applied
          ? `Auto switch: ${cfg.getCurrentTheme()}. Adaptive focus: off.`
          : "Auto switch: on. Adaptive focus: off."
        : applied
          ? `Auto switch: ${cfg.getCurrentTheme()}.`
          : "Auto switch: on.";
      void vscode.window.showInformationMessage(message);
      void recordMarketplaceReviewEngagement(context, "autoSwitchEnabled");
      return;
    }
    await cfg.updateConfigValue(extensionCfg, "autoSwitch.enabled", false);
    void vscode.window.showInformationMessage("Auto switch: off.");
  } catch (err) {
    log.error("toggleAutoSwitch", err);
    void vscode.window.showErrorMessage("Dusk Office: failed to toggle auto switch.");
  }
}

async function toggleAdaptiveFocus(context) {
  try {
    const extensionCfg = cfg.getExtensionConfig();
    const next = !cfg.getAdaptiveFocusConfig().enabled;
    if (next) {
      const autoSwitchWasEnabled = cfg.getAutoSwitchConfig().enabled;
      if (autoSwitchWasEnabled) {
        await cfg.updateConfigValue(extensionCfg, "autoSwitch.enabled", false);
      }
      await cfg.updateConfigValue(extensionCfg, "adaptiveFocus.enabled", true);
      const applied = await applyAdaptiveFocusTheme(context, { force: true, showMessage: false });
      const message = autoSwitchWasEnabled
        ? applied
          ? `Adaptive focus: ${cfg.getCurrentTheme()}. Auto switch: off.`
          : "Adaptive focus: on. Auto switch: off."
        : applied
          ? `Adaptive focus: ${cfg.getCurrentTheme()}.`
          : "Adaptive focus: on.";
      void vscode.window.showInformationMessage(message);
      void recordMarketplaceReviewEngagement(context, "adaptiveFocusEnabled");
      return;
    }
    await cfg.updateConfigValue(extensionCfg, "adaptiveFocus.enabled", false);
    void vscode.window.showInformationMessage("Adaptive focus: off.");
  } catch (err) {
    log.error("toggleAdaptiveFocus", err);
    void vscode.window.showErrorMessage("Dusk Office: failed to toggle adaptive focus.");
  }
}

module.exports = {
  applyAdaptiveFocusTheme,
  applyFavoriteOnStartup,
  restoreWorkspaceTheme,
  runAutoSwitch,
  reconcileAutomaticModes,
  toggleAutoSwitch,
  toggleAdaptiveFocus,
};
