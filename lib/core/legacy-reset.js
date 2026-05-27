const vscode = require("vscode");
const keys = require("./extension-keys.js");
const cfg = require("./configuration.js");
const titleBar = require("../themes/title-bar.js");

const LEGACY_CONFIGURATION_DEFAULTS_KEYS = [
  "editor.guides.bracketPairsHorizontal",
  "editor.guides.highlightActiveIndentation",
  "editor.renderLineHighlight",
  "editor.selectionHighlight",
  "editor.linkedEditing",
  "editor.roundedSelection",
  "editor.colorDecorators",
  "editor.overviewRulerBorder",
  "editor.padding.top",
  "editor.padding.bottom",
  "editor.cursorBlinking",
  "editor.cursorSmoothCaretAnimation",
  "editor.cursorWidth",
  "editor.smoothScrolling",
  "editor.stickyScroll.enabled",
  "editor.minimap.enabled",
  "editor.minimap.showSlider",
  "editor.minimap.renderCharacters",
  "editor.minimap.maxColumn",
  "terminal.integrated.cursorStyle",
  "terminal.integrated.cursorWidth",
  "terminal.integrated.smoothScrolling",
  "terminal.integrated.gpuAcceleration",
  "workbench.list.smoothScrolling",
  "workbench.tree.renderIndentGuides",
  "workbench.tree.indent",
  "window.dialogStyle",
  "explorer.decorations.badges",
  "explorer.decorations.colors",
];

const WORKBENCH_THEME_RESET_KEYS = [
  "colorTheme",
  "preferredLightColorTheme",
  "preferredDarkColorTheme",
  "preferredHighContrastColorTheme",
  "preferredHighContrastLightColorTheme",
  "productIconTheme",
  "activityBar.location",
];

const WINDOW_THEME_RESET_KEYS = ["autoDetectColorScheme"];

function getConfigurationProperties(context) {
  const fromContext = context?.extension?.packageJSON?.contributes?.configuration?.properties;
  if (fromContext && typeof fromContext === "object") return fromContext;

  try {
    const packageJson = require("../../package.json");
    const fromPackage = packageJson?.contributes?.configuration?.properties;
    return fromPackage && typeof fromPackage === "object" ? fromPackage : undefined;
  } catch {
    return undefined;
  }
}

function getDuskOfficeResetKeys(context) {
  const properties = getConfigurationProperties(context);
  if (!properties) return [];

  return Object.keys(properties)
    .filter((key) => key.startsWith("duskOffice."))
    .map((key) => key.slice("duskOffice.".length));
}

function resetAllSettings(context) {
  const workbenchConfig = cfg.getWorkbenchConfig();
  const windowConfig = cfg.getWindowConfig();
  const duskConfig = cfg.getExtensionConfig();

  vscode.window
    .showWarningMessage(
      "Reset all Dusk Office settings to defaults? This will:\n\n" +
        "Return to VS Code default color theme\n" +
        "Reset product icons and activity bar position\n" +
        "Clear auto-switch, favorite, and workspace memory\n" +
        "Remove stored Dusk Office state values",
      "Reset All Settings",
      "Cancel",
    )
    .then(async (selection) => {
      if (selection !== "Reset All Settings") return;

      const hasWorkspace = !!vscode.workspace.workspaceFolders?.length;
      const cleared = [];
      const failures = [];

      const tryClear = async (config, key, target) => {
        const inspected = config.inspect(key);
        const value =
          target === vscode.ConfigurationTarget.Workspace
            ? inspected?.workspaceValue
            : inspected?.globalValue;
        if (value === undefined) return false;
        try {
          await config.update(key, undefined, target);
          const after = config.inspect(key);
          const stillSet =
            target === vscode.ConfigurationTarget.Workspace
              ? after?.workspaceValue
              : after?.globalValue;
          if (stillSet !== undefined) {
            failures.push({ key, target, reason: "value persisted after reset" });
            return false;
          }
          cleared.push({ key, target });
          return true;
        } catch (error) {
          failures.push({ key, target, reason: error?.message ?? String(error) });
          return false;
        }
      };

      const clearKeys = async (config, keysList) => {
        for (const key of keysList) {
          await tryClear(config, key, vscode.ConfigurationTarget.Global);
          if (hasWorkspace) {
            await tryClear(config, key, vscode.ConfigurationTarget.Workspace);
          }
        }
      };

      const safeUpdate = async (config, key, target) => {
        try {
          await config.update(key, undefined, target);
        } catch {
          /* setting may be read-only, restricted, or absent in this scope */
        }
      };

      try {
        await titleBar.restoreTitleBarGlobalIfStored(context);

        await clearKeys(workbenchConfig, WORKBENCH_THEME_RESET_KEYS);
        await clearKeys(windowConfig, WINDOW_THEME_RESET_KEYS);
        await clearKeys(duskConfig, getDuskOfficeResetKeys(context));

        const stateClears = [
          [context.globalState, keys.PREVIOUS_THEME_KEY],
          [context.globalState, keys.FAVORITE_THEME_KEY],
          [context.globalState, keys.PREVIOUS_TITLE_BAR_GLOBAL_KEY],
          [context.globalState, keys.PREVIOUS_PRODUCT_ICON_KEY],
          [context.workspaceState, keys.WORKSPACE_ACTIVATION_PROMPT_KEY],
          [context.workspaceState, keys.WORKSPACE_THEME_KEY],
          [context.workspaceState, keys.WORKSPACE_FINGERPRINT_KEY],
        ];
        let stateCleared = 0;
        for (const [store, stateKey] of stateClears) {
          if (store.get(stateKey) !== undefined) {
            await store.update(stateKey, undefined);
            stateCleared += 1;
          }
        }

        const rootConfig = vscode.workspace.getConfiguration();
        const legacyResiduesGlobal = [];
        const legacyResiduesWorkspace = [];
        for (const key of LEGACY_CONFIGURATION_DEFAULTS_KEYS) {
          const inspected = rootConfig.inspect(key);
          if (!inspected) continue;
          if (inspected.globalValue !== undefined) legacyResiduesGlobal.push(key);
          if (hasWorkspace && inspected.workspaceValue !== undefined) {
            legacyResiduesWorkspace.push(key);
          }
        }
        const legacyResidueCount = legacyResiduesGlobal.length + legacyResiduesWorkspace.length;

        const totalChanges = cleared.length + stateCleared;
        const reloadLabel = "Reload Window";
        const offerReload = (message) =>
          vscode.window.showInformationMessage(message, reloadLabel, "OK").then((choice) => {
            if (choice === reloadLabel) {
              void vscode.commands.executeCommand("workbench.action.reloadWindow");
            }
          });

        if (failures.length === 0 && totalChanges === 0) {
          void offerReload("Dusk Office: settings were already at defaults. Reload to restore the IDE default theme?");
        } else if (failures.length === 0) {
          void offerReload(
            `Dusk Office reset: cleared ${cleared.length} setting${cleared.length === 1 ? "" : "s"}` +
              (stateCleared > 0
                ? ` and ${stateCleared} stored value${stateCleared === 1 ? "" : "s"}`
                : "") +
              `. Reload the window to apply the default theme cleanly?`,
          );
        } else {
          const detail = failures
            .slice(0, 5)
            .map(
              (f) =>
                `${f.key} (${
                  f.target === vscode.ConfigurationTarget.Workspace ? "workspace" : "global"
                }): ${f.reason}`,
            )
            .join("\n");
          void vscode.window.showWarningMessage(
            `Dusk Office reset: cleared ${cleared.length} setting${cleared.length === 1 ? "" : "s"}, ` +
              `but ${failures.length} could not be reset.\n\n${detail}` +
              (failures.length > 5 ? `\n\u2026and ${failures.length - 5} more.` : ""),
            "OK",
          );
        }

        if (legacyResidueCount > 0) {
          const cleanupChoice = await vscode.window.showWarningMessage(
            `Older Dusk Office versions applied ${LEGACY_CONFIGURATION_DEFAULTS_KEYS.length} editor / terminal / window tweaks as defaults (cursor blink, minimap, dialog style, etc.). ` +
              `${legacyResidueCount} of them are still present in your User or Workspace settings.\n\n` +
              "Clear those too? Choose 'Keep them' if you set them intentionally and unrelated to Dusk Office.",
            "Clear legacy tweaks",
            "Keep them",
          );
          if (cleanupChoice === "Clear legacy tweaks") {
            for (const key of legacyResiduesGlobal) {
              await safeUpdate(rootConfig, key, vscode.ConfigurationTarget.Global);
            }
            for (const key of legacyResiduesWorkspace) {
              await safeUpdate(rootConfig, key, vscode.ConfigurationTarget.Workspace);
            }
            void vscode.window.showInformationMessage(
              `Cleared ${legacyResidueCount} legacy Dusk Office tweak${legacyResidueCount === 1 ? "" : "s"}.`,
              "OK",
            );
          }
        }
      } catch (error) {
        vscode.window.showErrorMessage(`Dusk Office reset failed: ${error?.message ?? String(error)}`, "OK");
      }
    });
}

module.exports = { resetAllSettings };
