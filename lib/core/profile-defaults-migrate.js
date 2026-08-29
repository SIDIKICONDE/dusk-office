/**
 * One-shot upgrade: keep old title-bar / ANSI defaults for existing profiles
 * after those settings became opt-in. New installs keep the package defaults.
 */
const vscode = require("vscode");
const keys = require("./extension-keys.js");
const cfg = require("./configuration.js");
const log = require("./log.js");

const PROFILE_DEFAULTS_MIGRATION_VALUE = "lessInvasiveDefaults";

const PRIOR_GLOBAL_STATE_KEYS = [
  keys.WALKTHROUGH_SHOWN_KEY,
  keys.FAVORITE_THEME_KEY,
  keys.PREVIOUS_THEME_KEY,
  keys.PREVIOUS_TITLE_BAR_GLOBAL_KEY,
  keys.PREVIOUS_PRODUCT_ICON_KEY,
  keys.MARKETPLACE_REVIEW_COMPLETED_KEY,
  keys.MARKETPLACE_REVIEW_DISMISSED_KEY,
  keys.MARKETPLACE_REVIEW_SESSION_COUNT_KEY,
  keys.MARKETPLACE_REVIEW_FIRST_ACTIVATION_KEY,
  keys.MARKETPLACE_REVIEW_COMPLETED_VERSION_KEY,
];

const PRIOR_WORKSPACE_STATE_KEYS = [
  keys.WORKSPACE_THEME_KEY,
  keys.WORKSPACE_FINGERPRINT_KEY,
  keys.WORKSPACE_ACTIVATION_PROMPT_KEY,
];

const OLD_DEFAULTS = [
  ["titleBar.alignWithTheme", true],
  ["editorAnsi.allLanguages", true],
];

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

function isSettingExplicitlySet(config, key) {
  const inspected = config.inspect(key);
  if (!inspected) return false;
  return (
    inspected.globalValue !== undefined ||
    inspected.workspaceValue !== undefined ||
    inspected.workspaceFolderValue !== undefined
  );
}

function hasStoredState(store, stateKeys) {
  if (!store) return false;
  return stateKeys.some((key) => store.get(key) !== undefined);
}

function hasExplicitDuskOfficeSettings(context) {
  const properties = getConfigurationProperties(context);
  if (!properties) return false;
  const extCfg = cfg.getExtensionConfig();
  return Object.keys(properties)
    .filter((key) => key.startsWith("duskOffice."))
    .some((fullKey) => isSettingExplicitlySet(extCfg, fullKey.slice("duskOffice.".length)));
}

function hasPriorDuskProfile(context) {
  if (!context) return false;
  if (hasStoredState(context.globalState, PRIOR_GLOBAL_STATE_KEYS)) return true;
  if (hasStoredState(context.workspaceState, PRIOR_WORKSPACE_STATE_KEYS)) return true;
  return hasExplicitDuskOfficeSettings(context);
}

async function writeOldDefaultIfUnset(config, key, value) {
  if (isSettingExplicitlySet(config, key)) return false;
  await config.update(key, value, vscode.ConfigurationTarget.Global);
  return true;
}

async function migrateExistingProfileDefaults(context) {
  try {
    if (!context?.globalState) return;
    if (context.globalState.get(keys.PROFILE_DEFAULTS_MIGRATION_KEY)) return;

    if (hasPriorDuskProfile(context)) {
      const extCfg = cfg.getExtensionConfig();
      for (const [key, value] of OLD_DEFAULTS) {
        await writeOldDefaultIfUnset(extCfg, key, value);
      }
    }

    await context.globalState.update(
      keys.PROFILE_DEFAULTS_MIGRATION_KEY,
      PROFILE_DEFAULTS_MIGRATION_VALUE,
    );
  } catch (err) {
    log.error("migrateExistingProfileDefaults", err);
  }
}

module.exports = {
  PROFILE_DEFAULTS_MIGRATION_VALUE,
  migrateExistingProfileDefaults,
  hasPriorDuskProfile,
  isSettingExplicitlySet,
};
