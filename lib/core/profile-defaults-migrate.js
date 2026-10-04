/**
 * One-shot upgrade: keep old title-bar / ANSI defaults for existing profiles
 * after those settings became opt-in. New installs keep the package defaults.
 *
 * The legacy values are **not** written to the user's settings.json. Doing so
 * materialised settings they never chose, and `titleBar.alignWithTheme: true`
 * then cascaded into a silent global `window.titleBarStyle: "custom"` write that
 * no `dusk`-prefixed key hinted at. They are recorded in
 * `state.legacyProfileDefaults` and applied by `configuration.js` as a read-time
 * fallback, so an explicit user value — including `false` — always wins.
 */
const keys = require("./extension-keys.js");
const cfg = require("./configuration.js");
const state = require("./extension-state.js");
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

/** Settings whose pre-1.5.6 default was `true` and is now opt-in. */
const LEGACY_DEFAULT_KEYS = [
  "titleBar.alignWithTheme",
  "editorAnsi.allLanguages",
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

async function migrateExistingProfileDefaults(context) {
  try {
    if (!context?.globalState) return;

    // The verdict is persisted, not recomputed each session.
    //
    // It cannot be derived on every activation: `hasPriorDuskProfile` treats the
    // Marketplace-review session counter as a legacy signal, and that counter is
    // written on *every* activation — so a brand-new profile would be flagged as
    // legacy on its second launch.
    //
    // Nor can it stay purely in memory, the way it did when this function only wrote
    // settings.json: the legacy defaults are no longer persisted anywhere, so a flag
    // that died with the process made the old behaviour vanish after one session.
    const stored = context.globalState.get(keys.LEGACY_PROFILE_DEFAULTS_KEY);
    if (typeof stored === "boolean") {
      state.legacyProfileDefaults = stored;
      return;
    }

    state.legacyProfileDefaults = hasPriorDuskProfile(context);
    await context.globalState.update(
      keys.LEGACY_PROFILE_DEFAULTS_KEY,
      state.legacyProfileDefaults,
    );

    if (context.globalState.get(keys.PROFILE_DEFAULTS_MIGRATION_KEY)) return;
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
  LEGACY_DEFAULT_KEYS,
  migrateExistingProfileDefaults,
  hasPriorDuskProfile,
  isSettingExplicitlySet,
};
