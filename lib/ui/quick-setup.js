const vscode = require("vscode");
const cfg = require("../core/configuration.js");
const themes = require("../themes/themes.js");
const autoAdaptive = require("../themes/auto-adaptive.js");
const log = require("../core/log.js");

/**
 * One-click quick setup: configures the most popular Dusk Office features
 * in a single flow. Designed for the walkthrough onboarding step.
 *
 *  1. Pick a favorite variant (Apply only)
 *  2. Enable adaptive focus OR auto day/night
 *  3. Persist the chosen variant as favorite (automation may change the active theme)
 */
async function runQuickSetup(context) {
  try {
    // Step 1 — pick a variant. Esc / cancel stops the whole flow.
    const chosenTheme = await themes.setThemeVariant(context);
    if (!chosenTheme) return;

    // Step 2 — ask which automation to enable
    const adaptive = "Adaptive Focus";
    const dayNight = "Auto Day/Night";
    const none = "No automation";
    const mode = await vscode.window.showQuickPick(
      [
        {
          label: `$(sparkle) ${adaptive}`,
          description: "Picks a variant by language + time of day — the smartest option",
          detail: "Recommended",
          _mode: adaptive,
        },
        {
          label: `$(clock) ${dayNight}`,
          description: "Switch light ↔ dark by the hour — simple and effective",
          _mode: dayNight,
        },
        {
          label: `$(circle-slash) ${none}`,
          description: "I'll switch themes manually",
          _mode: none,
        },
      ],
      {
        title: "Quick Setup — Choose automation",
        placeHolder: "How should Dusk Office manage themes?",
      },
    );
    if (!mode) return;

    const extCfg = cfg.getExtensionConfig();

    if (mode._mode === adaptive) {
      if (cfg.getAutoSwitchConfig().enabled) {
        await cfg.updateConfigValue(extCfg, "autoSwitch.enabled", false);
      }
      await cfg.updateConfigValue(extCfg, "adaptiveFocus.enabled", true);
      await autoAdaptive.applyAdaptiveFocusTheme(context, { force: true });
      void vscode.window.showInformationMessage(
        `Quick Setup complete — Adaptive Focus is on. Favorite: ${chosenTheme}. Current: ${cfg.getCurrentTheme()}.`,
      );
    } else if (mode._mode === dayNight) {
      if (cfg.getAdaptiveFocusConfig().enabled) {
        await cfg.updateConfigValue(extCfg, "adaptiveFocus.enabled", false);
      }
      await cfg.updateConfigValue(extCfg, "autoSwitch.enabled", true);
      await autoAdaptive.runAutoSwitch(context);
      void vscode.window.showInformationMessage(
        `Quick Setup complete — Auto Day/Night is on. Favorite: ${chosenTheme}. Current: ${cfg.getCurrentTheme()}.`,
      );
    } else {
      void vscode.window.showInformationMessage(
        `Quick Setup complete — manual mode. Current: ${chosenTheme}.`,
      );
    }

    // Persist the variant chosen in step 1, not whatever automation applied after.
    await themes.persistFavoriteTheme(context, chosenTheme);
  } catch (err) {
    log.error("runQuickSetup", err);
  }
}

module.exports = { runQuickSetup };
