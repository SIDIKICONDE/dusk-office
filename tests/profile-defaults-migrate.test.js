const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");

const vscode = require("vscode");
const keys = require("../lib/core/extension-keys.js");
const cfg = require("../lib/core/configuration.js");
const state = require("../lib/core/extension-state.js");
const {
  PROFILE_DEFAULTS_MIGRATION_VALUE,
  LEGACY_DEFAULT_KEYS,
  migrateExistingProfileDefaults,
  hasPriorDuskProfile,
} = require("../lib/core/profile-defaults-migrate.js");

function createMockContext() {
  const global = new Map();
  const workspace = new Map();
  return {
    globalState: {
      get: (key) => global.get(key),
      update: async (key, value) => {
        if (value === undefined) global.delete(key);
        else global.set(key, value);
      },
    },
    workspaceState: {
      get: (key) => workspace.get(key),
      update: async (key, value) => {
        if (value === undefined) workspace.delete(key);
        else workspace.set(key, value);
      },
    },
  };
}

describe("existing-profile defaults migration", () => {
  beforeEach(() => {
    vscode.__resetMockConfig();
    state.reset();
  });

  afterEach(() => {
    vscode.__resetMockConfig();
    state.reset();
  });

  it("does not write old defaults on a first install", async () => {
    const context = createMockContext();
    assert.equal(hasPriorDuskProfile(context), false);
    await migrateExistingProfileDefaults(context);
    assert.equal(context.globalState.get(keys.PROFILE_DEFAULTS_MIGRATION_KEY), PROFILE_DEFAULTS_MIGRATION_VALUE);
    assert.equal(state.legacyProfileDefaults, false);
    for (const key of LEGACY_DEFAULT_KEYS) {
      assert.equal(vscode.workspace.getConfiguration("duskOffice").inspect(key), undefined);
    }
  });

  it("never writes any legacy default into settings.json", async () => {
    const context = createMockContext();
    await context.globalState.update(keys.WALKTHROUGH_SHOWN_KEY, true);
    assert.equal(hasPriorDuskProfile(context), true);
    await migrateExistingProfileDefaults(context);

    // The whole point of the fix: an upgrade must not materialise settings the
    // user never chose. `titleBar.alignWithTheme: true` used to cascade into a
    // silent global `window.titleBarStyle: "custom"` write.
    for (const key of LEGACY_DEFAULT_KEYS) {
      assert.equal(
        vscode.workspace.getConfiguration("duskOffice").inspect(key),
        undefined,
        `${key} must stay absent from settings.json`,
      );
    }
  });

  it("applies the legacy value as a read-time fallback for an upgrade", async () => {
    const context = createMockContext();
    await context.globalState.update(keys.WALKTHROUGH_SHOWN_KEY, true);
    await migrateExistingProfileDefaults(context);

    assert.equal(state.legacyProfileDefaults, true);
    assert.equal(cfg.getTitleBarAlignWithThemeEnabled(), true);
    assert.equal(cfg.getEditorAnsiAllLanguages(), true);
    assert.equal(context.globalState.get(keys.PROFILE_DEFAULTS_MIGRATION_KEY), PROFILE_DEFAULTS_MIGRATION_VALUE);
  });

  it("keeps the package default on a fresh install", async () => {
    const context = createMockContext();
    await migrateExistingProfileDefaults(context);
    assert.equal(cfg.getTitleBarAlignWithThemeEnabled(), false);
    assert.equal(cfg.getEditorAnsiAllLanguages(), false);
  });

  it("lets an explicit user value win, including false", async () => {
    const context = createMockContext();
    await context.globalState.update(keys.FAVORITE_THEME_KEY, "Dusk Office Vault");
    vscode.__setMockConfig("duskOffice.titleBar.alignWithTheme", false);
    vscode.__setMockConfig("duskOffice.editorAnsi.allLanguages", false);
    await migrateExistingProfileDefaults(context);

    assert.equal(cfg.getTitleBarAlignWithThemeEnabled(), false);
    assert.equal(cfg.getEditorAnsiAllLanguages(), false);
  });

  it("the Control Center toggle flips the setting and clears the pin when turning off", async () => {
      vscode.workspace.workspaceFolders = [vscode.Uri.file("/repo")];
      const workspace = new Map();
      const context = {
        globalState: { get: () => undefined, update: async () => {} },
        workspaceState: {
          get: (k) => workspace.get(k),
          update: async (k, v) => (v === undefined ? workspace.delete(k) : workspace.set(k, v)),
        },
      };
      try {
        const { buildControlCenterItems } = require("../lib/ui/control-center.js");
        const { activateAnsiEditor } = { activateAnsiEditor: () => {} };

        const findToggle = () =>
          buildControlCenterItems(context, activateAnsiEditor).find((i) =>
            typeof i.label === "string" && i.label.includes("Workspace Theme Memory"),
          );

        // Off by default; the row must be actionable.
        const off = findToggle();
        assert.ok(off, "Control Center must expose a workspace-memory toggle");
        assert.equal(typeof off.action, "function");

        await off.action();
        assert.equal(cfg.getWorkspaceThemeMemoryEnabled(), true);

        // With memory on, a manual apply pins the theme.
        const themes = require("../lib/themes/themes.js");
        await themes.applyTheme("Dusk Office Vault", context, "manual");
        assert.equal(context.workspaceState.get(keys.WORKSPACE_THEME_KEY), "Dusk Office Vault");

        await findToggle().action();
        assert.equal(cfg.getWorkspaceThemeMemoryEnabled(), false);
        assert.equal(
          context.workspaceState.get(keys.WORKSPACE_THEME_KEY),
          undefined,
          "turning memory off must clear the saved pin, otherwise it comes back on next launch",
        );
      } finally {
        vscode.workspace.workspaceFolders = [];
      }
    });

    it("an explicit true also wins over the legacy fallback", async () => {
    const context = createMockContext();
    await context.globalState.update(keys.WALKTHROUGH_SHOWN_KEY, true);
    vscode.__setMockConfig("duskOffice.editorAnsi.allLanguages", true);
    await migrateExistingProfileDefaults(context);
    assert.equal(cfg.getEditorAnsiAllLanguages(), true);
  });

  it("persists the verdict so the legacy defaults survive the next session", async () => {
    // Regression: the flag used to be set only on the first activation (a one-shot
    // latch returned early afterwards) while living purely in memory — so the legacy
    // behaviour vanished on the very next launch.
    const context = createMockContext();
    await context.globalState.update(keys.WALKTHROUGH_SHOWN_KEY, true);
    await migrateExistingProfileDefaults(context);
    assert.equal(state.legacyProfileDefaults, true);
    assert.equal(
      context.globalState.get(keys.LEGACY_PROFILE_DEFAULTS_KEY),
      true,
      "the verdict must be persisted, not recomputed each session",
    );

    // Session 2: fresh process, only persisted state survives.
    state.reset();
    assert.equal(state.legacyProfileDefaults, false);
    await migrateExistingProfileDefaults(context);
    assert.equal(
      state.legacyProfileDefaults,
      true,
      "a legacy profile must keep its defaults after a restart",
    );
    assert.equal(cfg.getTitleBarAlignWithThemeEnabled(), true);
    assert.equal(cfg.getEditorAnsiAllLanguages(), true);
  });

  it("a fresh profile is not flagged legacy on its second session", async () => {
    // The Marketplace-review counter is written on every activation. Re-deriving the
    // verdict each session would read that as proof of a prior install and flip a
    // brand-new profile to the legacy defaults on its second launch.
    const context = createMockContext();
    assert.equal(hasPriorDuskProfile(context), false);
    await migrateExistingProfileDefaults(context);
    assert.equal(state.legacyProfileDefaults, false);

    await context.globalState.update(keys.MARKETPLACE_REVIEW_SESSION_COUNT_KEY, 1);
    await context.globalState.update(keys.MARKETPLACE_REVIEW_FIRST_ACTIVATION_KEY, 1);

    state.reset();
    await migrateExistingProfileDefaults(context);
    assert.equal(
      state.legacyProfileDefaults,
      false,
      "the persisted verdict must win over any later session state",
    );
  });
});
