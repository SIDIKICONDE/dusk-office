const vscode = require("vscode");
const { THEME_VARIANTS, getThemeDisplayLabel, getThemeKindLabel, stripThemeDisplayLabel, isDuskTheme, isThemeName } = require("../themes/theme-common.js");
const keys = require("../core/extension-keys.js");
const cfg = require("../core/configuration.js");
const themes = require("../themes/themes.js");
const autoAdaptive = require("../themes/auto-adaptive.js");
const editorAnsi = require("../ansi/editor-ansi.js");
const productIcons = require("../themes/product-icons.js");
const titleBar = require("../themes/title-bar.js");
const { verifyTerminalContrast } = require("../terminal/terminal-verify.js");
const { resetAllSettings } = require("../core/legacy-reset.js");
const { clearWorkspaceFingerprint } = require("../workspace/workspace-fingerprint.js");
const log = require("../core/log.js");
const { openMarketplaceReviewPage, getMarketplaceReviewEnabled } = require("../prompts/marketplace-review-prompt.js");
const { openThemeGallery } = require("./theme-gallery.js");
const { verifyEditorContrast } = require("../contrast/ui-verify.js");
const { normalizeTimezone } = require("../themes/schedule-time.js");

function formatScheduleTimezone(timezone) {
  const tz = normalizeTimezone(timezone);
  return tz || "local (machine)";
}

async function openControlCenter(context) {
  try {
  const currentTheme = cfg.getCurrentTheme();
  const activityBarLocation = cfg.getActivityBarLocation();
  const previousTheme = context.globalState.get(keys.PREVIOUS_THEME_KEY);
  const favoriteTheme = themes.resolveFavoriteTheme(context);
  const rememberedTheme = context.workspaceState.get(keys.WORKSPACE_THEME_KEY);
  const autoSwitch = cfg.getAutoSwitchConfig();
  const adaptiveFocus = cfg.getAdaptiveFocusConfig();
  const autoSwitchTheme = cfg.getAutoSwitchTheme();
  const activeLanguage = vscode.window.activeTextEditor?.document?.languageId || "";
  const adaptiveChoice = cfg.resolveAdaptiveFocusTheme(activeLanguage, new Date(), { force: true });
  const dynamicTheme = adaptiveFocus.enabled && adaptiveChoice?.theme ? adaptiveChoice.theme : autoSwitchTheme;
  const picked = await vscode.window.showQuickPick(
    [
      {
        label: `$(paintcan) Theme: ${currentTheme || "Unknown"}`,
        description: dynamicTheme ? `Dynamic now: ${dynamicTheme}` : "Status",
        detail: dynamicTheme
          ? `Local active: ${currentTheme || "Unknown"}`
          : "Current local theme",
        action: null,
      },
      {
        label: "$(symbol-color) Choose Theme",
        description: currentTheme ? `Current: ${currentTheme}` : "Choose a theme",
        detail: "Pick theme",
        action: () => themes.setThemeVariant(context),
      },
      {
        label: "$(layout-panel) Theme Gallery",
        description: "Visual preview of all variants",
        detail: "Open gallery webview",
        action: () => openThemeGallery(context),
      },
      {
        label: "$(history) Previous Theme",
        description: isThemeName(previousTheme) ? `Previous: ${previousTheme}` : "No previous theme",
        detail: "Go back",
        action: () => themes.switchToPreviousTheme(context),
      },
      {
        label: "$(star-full) Favorite Theme",
        description: isDuskTheme(favoriteTheme) ? `Favorite: ${favoriteTheme}` : "No favorite theme",
        detail: "Use favorite",
        action: () => themes.switchToFavoriteTheme(context),
      },
      {
        label: "$(star-empty) Set Favorite",
        description: isDuskTheme(favoriteTheme) ? `Favorite: ${favoriteTheme}` : "Choose favorite",
        detail: "Save favorite",
        action: () => themes.setFavoriteTheme(context),
      },
      {
        label: autoSwitch.enabled ? "$(clock) Auto Switch On" : "$(clock) Auto Switch Off",
        description: autoSwitch.enabled
          ? `Now: ${autoSwitchTheme || currentTheme || "Unknown"}`
          : "Use light and dark schedule",
        detail: autoSwitch.enabled
          ? `Light: ${autoSwitch.lightTheme} · Dark: ${autoSwitch.darkTheme} · TZ: ${formatScheduleTimezone(autoSwitch.timezone)}`
          : "Toggle auto switch",
        action: () => autoAdaptive.toggleAutoSwitch(context),
      },
      {
        label: adaptiveFocus.enabled ? "$(sparkle) Adaptive Focus On" : "$(sparkle) Adaptive Focus Off",
        description: adaptiveFocus.enabled
          ? `Now: ${adaptiveChoice?.theme || currentTheme || "Unknown"}`
          : "Auto-adapt by active editor",
        detail: adaptiveFocus.enabled
          ? `${adaptiveChoice?.reason || "Language + time"} · ${
              adaptiveFocus.onlyWhenDuskThemeActive ? "Dusk-only" : "always"
            }`
          : "Toggle adaptive focus",
        action: () => autoAdaptive.toggleAdaptiveFocus(context),
      },
      {
        label: "$(run) Apply Adaptive Theme Now",
        description: adaptiveChoice?.theme
          ? `Recommended: ${adaptiveChoice.theme}`
          : "Runs once even if disabled",
        detail: "Preview adaptive decision",
        action: () => autoAdaptive.applyAdaptiveFocusTheme(context, { force: true, showMessage: true }),
      },
      {
        label: "$(settings-gear) Adaptive Focus Settings",
        description: "Open adaptive focus configuration",
        detail: "enabled / lock / late-night / dusk-only",
        action: async () => {
          await vscode.commands.executeCommand(
            "workbench.action.openSettings",
            "duskOffice.adaptiveFocus",
          );
        },
      },
      {
        label: "$(folder-library) Workspace Theme",
        description: isDuskTheme(rememberedTheme) ? `Saved: ${rememberedTheme}` : "No saved theme",
        detail: cfg.getWorkspaceThemeMemoryEnabled() ? "Memory on" : "Memory off",
        action: null,
      },
      {
        label: "$(layout) Activity Bar Position",
        description: activityBarLocation === "top" ? "Current: top" : "Current: default",
        detail: "Toggle location",
        action: themes.toggleActivityBarLocation,
      },
      {
        label: cfg.areDuskIconsEnabled()
          ? "$(extensions) Product Icons: On (Dusk)"
          : "$(extensions) Product Icons: Off",
        description: cfg.areDuskIconsEnabled()
          ? "Click again to restore previous / default"
          : "Apply Dusk Office · Product",
        detail: "Toggle product icon theme",
        action: () => productIcons.toggleProductIconTheme(context),
      },
      {
        label: "$(tools) Title Bar Align",
        description: cfg.getTitleBarAlignWithThemeEnabled() ? "Current: on" : "Current: off",
        detail: "Toggle alignment",
        action: async () => {
          try {
            const extCfg = cfg.getExtensionConfig();
            const next = !cfg.getTitleBarAlignWithThemeEnabled();
            await cfg.updateConfigValue(extCfg, "titleBar.alignWithTheme", next);
            void vscode.window.showInformationMessage(
              next ? "Title bar: align with theme." : "Title bar: native/custom unmanaged.",
            );
            void titleBar.syncTitleBarStyleForDuskTheme(context);
          } catch (err) {
            log.error("controlCenter:titleBarAlign", err);
          }
        },
      },
      {
        label: "$(eye) Status Bar Button",
        description: cfg.getStatusBarEnabled() ? "Current: on" : "Current: off",
        detail: "Toggle status bar",
        action: async () => {
          try {
            const extCfg = cfg.getExtensionConfig();
            const next = !cfg.getStatusBarEnabled();
            await cfg.updateConfigValue(extCfg, "statusBar.enabled", next);
            void vscode.window.showInformationMessage(next ? "Status bar: on." : "Status bar: off.");
          } catch (err) {
            log.error("controlCenter:statusBar", err);
          }
        },
      },
      {
        label: "$(trash) Clear Workspace Theme Memory",
        description: isDuskTheme(rememberedTheme) ? `Saved: ${rememberedTheme}` : "Nothing saved",
        detail: "Workspace",
        action: async () => {
          try {
            await context.workspaceState.update(keys.WORKSPACE_THEME_KEY, undefined);
            void vscode.window.showInformationMessage("Workspace theme memory: cleared.");
          } catch (err) {
            log.error("controlCenter:clearWorkspaceMemory", err);
          }
        },
      },
      {
        label: "$(history) Reset Workspace Fingerprint",
        description: "Allow variant suggestion again",
        detail: "Clears one-time fingerprint prompt for this workspace",
        action: () => clearWorkspaceFingerprint(context),
      },
      {
        label: "$(gear) Configure Auto Switch",
        description: `${autoSwitch.lightTheme} @${autoSwitch.lightHour}h / ${autoSwitch.darkTheme} @${autoSwitch.darkHour}h · ${formatScheduleTimezone(autoSwitch.timezone)}`,
        detail: "Pick themes, hours & timezone",
        action: async () => {
          try {
            const pickTheme = async (title, currentLabel) => {
              const chosen = await vscode.window.showQuickPick(
                THEME_VARIANTS.map((theme) => ({
                  label:
                    theme === currentLabel
                      ? `$(check) ${getThemeDisplayLabel(theme)}`
                      : getThemeDisplayLabel(theme),
                  description:
                    theme === currentLabel
                      ? "Current"
                      : getThemeKindLabel(theme),
                })),
                { title, matchOnDescription: true },
              );
              if (!chosen) return undefined;
              return stripThemeDisplayLabel(chosen.label);
            };
            const lightTheme = await pickTheme("Auto Switch: Light Theme", autoSwitch.lightTheme);
            if (!lightTheme) return;
            const darkTheme = await pickTheme("Auto Switch: Dark Theme", autoSwitch.darkTheme);
            if (!darkTheme) return;
            const askHour = async (title, value) => {
              const s = await vscode.window.showInputBox({
                title,
                value: String(value ?? 0),
                validateInput: (text) => {
                  const n = Number(text);
                  return Number.isInteger(n) && n >= 0 && n <= 23 ? undefined : "Enter an integer between 0 and 23";
                },
              });
              if (s === undefined) return undefined;
              return parseInt(s, 10);
            };
            const lightHour = await askHour("Auto Switch: Light Hour (0–23)", autoSwitch.lightHour);
            if (lightHour === undefined) return;
            const darkHour = await askHour("Auto Switch: Dark Hour (0–23)", autoSwitch.darkHour);
            if (darkHour === undefined) return;
            const extCfg = cfg.getExtensionConfig();
            await Promise.all([
              cfg.updateConfigValue(extCfg, "autoSwitch.lightTheme", lightTheme),
              cfg.updateConfigValue(extCfg, "autoSwitch.darkTheme", darkTheme),
              cfg.updateConfigValue(extCfg, "autoSwitch.lightHour", lightHour),
              cfg.updateConfigValue(extCfg, "autoSwitch.darkHour", darkHour),
            ]);
            void vscode.window.showInformationMessage(
              `Auto switch configured: ${lightTheme} @${lightHour}h / ${darkTheme} @${darkHour}h`,
            );
            if (cfg.getAutoSwitchConfig().enabled) {
              void autoAdaptive.runAutoSwitch(context, false);
            }
          } catch (err) {
            log.error("controlCenter:configureAutoSwitch", err);
          }
        },
      },
      {
        label: cfg.getEditorAnsiEnabled()
          ? "$(symbol-color) ANSI in Editor: On"
          : "$(symbol-color) ANSI in Editor: Off",
        description: cfg.getEditorAnsiAllLanguages()
          ? "All languages · theme terminal.ansi* palette"
          : "log / ansi languages only",
        detail: "Toggle ANSI coloring in .log and source (\\x1B…)",
        action: () => editorAnsi.toggleEditorAnsi(),
      },
      {
        label: "$(settings-gear) ANSI in Editor Settings",
        description: cfg.getEditorAnsiEnabled() ? "Currently enabled" : "Currently disabled",
        detail: "enabled · allLanguages · dimEscapeSequences",
        action: () => editorAnsi.openEditorAnsiSettings(),
      },
      {
        label: "$(eye) Verify Terminal Contrast",
        description: "Check WCAG compliance",
        detail: "All themes",
        action: () => verifyTerminalContrast(),
      },
      {
        label: "$(eye) Verify Editor & UI Contrast",
        description: "Check WCAG compliance",
        detail: "Editor text, syntax tokens, workbench chrome",
        action: () => verifyEditorContrast(),
      },
      {
        label: "$(refresh) Reset All Settings",
        description: "Return to VS Code defaults",
        detail: "Complete reset",
        action: () => resetAllSettings(context),
      },
      {
        label: "$(settings-gear) Settings",
        description: "Open settings",
        detail: "Extension",
        action: editorAnsi.openDuskOfficeSettings,
      },
      ...(getMarketplaceReviewEnabled()
        ? [
            {
              label: "$(star-full) Rate Dusk Office on Marketplace",
              description: "VS Code, Open VSX, or JetBrains",
              detail: "Pick the marketplace where you installed Dusk Office",
              action: () => openMarketplaceReviewPage(),
            },
          ]
        : []),
    ],
    {
      title: "Dusk Office",
      placeHolder: "Pick an action",
      matchOnDescription: true,
    },
  );
  if (!picked || !picked.action) return;
  await picked.action();
  } catch (err) {
    log.error("openControlCenter", err);
  }
}

module.exports = { openControlCenter };
