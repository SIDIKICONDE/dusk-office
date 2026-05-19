const vscode = require("vscode");
const keys = require("./extension-keys.js");
const cfg = require("./configuration.js");
const titleBar = require("./title-bar.js");

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

const DUSK_OFFICE_RESET_KEYS = [
  "applyFavoriteOnStartup",
  "rememberWorkspaceTheme",
  "statusBar.enabled",
  "titleBar.alignWithTheme",
  "autoSwitch.enabled",
  "autoSwitch.lightTheme",
  "autoSwitch.darkTheme",
  "autoSwitch.lightHour",
  "autoSwitch.darkHour",
  "adaptiveFocus.enabled",
  "adaptiveFocus.onlyWhenDuskThemeActive",
  "adaptiveFocus.lateNightEyeComfort",
  "adaptiveFocus.lateNightStartHour",
  "adaptiveFocus.lateNightEndHour",
  "adaptiveFocus.lockTheme",
  "workspaceFingerprint.enabled",
  "editorAnsi.enabled",
  "editorAnsi.allLanguages",
  "editorAnsi.dimEscapeSequences",
  "editorAnsi.maxLineCount",
  "editorAnsi.maxLineLength",
];

function resetAllSettings(context) {
  const workbenchConfig = cfg.getWorkbenchConfig();
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
      const safeUpdate = async (config, key, target) => {
        try {
          await config.update(key, undefined, target);
        } catch {
          /* setting may be read-only, restricted, or absent in this scope */
        }
      };

      try {
        await titleBar.restoreTitleBarGlobalIfStored(context);

        const workbenchKeys = ["colorTheme", "productIconTheme", "activityBar.location"];
        for (const key of workbenchKeys) {
          await safeUpdate(workbenchConfig, key, vscode.ConfigurationTarget.Global);
          if (hasWorkspace) {
            await safeUpdate(workbenchConfig, key, vscode.ConfigurationTarget.Workspace);
          }
        }

        for (const key of DUSK_OFFICE_RESET_KEYS) {
          await safeUpdate(duskConfig, key, vscode.ConfigurationTarget.Global);
          if (hasWorkspace) {
            await safeUpdate(duskConfig, key, vscode.ConfigurationTarget.Workspace);
          }
        }

        await context.globalState.update(keys.PREVIOUS_THEME_KEY, undefined);
        await context.globalState.update(keys.FAVORITE_THEME_KEY, undefined);
        await context.globalState.update(keys.PREVIOUS_TITLE_BAR_GLOBAL_KEY, undefined);
        await context.globalState.update(keys.PREVIOUS_PRODUCT_ICON_KEY, undefined);
        await context.workspaceState.update(keys.WORKSPACE_THEME_KEY, undefined);
        await context.workspaceState.update(keys.WORKSPACE_FINGERPRINT_KEY, undefined);

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

        vscode.window.showInformationMessage("Dusk Office settings were reset to defaults successfully.", "OK");

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
