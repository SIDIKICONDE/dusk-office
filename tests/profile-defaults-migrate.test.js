const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");

const vscode = require("vscode");
const keys = require("../lib/core/extension-keys.js");
const {
  PROFILE_DEFAULTS_MIGRATION_VALUE,
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
  });

  afterEach(() => {
    vscode.__resetMockConfig();
  });

  it("does not write old defaults on a first install", async () => {
    const context = createMockContext();
    assert.equal(hasPriorDuskProfile(context), false);
    await migrateExistingProfileDefaults(context);
    assert.equal(context.globalState.get(keys.PROFILE_DEFAULTS_MIGRATION_KEY), PROFILE_DEFAULTS_MIGRATION_VALUE);
    assert.equal(
      vscode.workspace.getConfiguration("duskOffice").inspect("titleBar.alignWithTheme"),
      undefined,
    );
    assert.equal(
      vscode.workspace.getConfiguration("duskOffice").inspect("editorAnsi.allLanguages"),
      undefined,
    );
  });

  it("writes old defaults once for an upgrade that never set the keys", async () => {
    const context = createMockContext();
    await context.globalState.update(keys.WALKTHROUGH_SHOWN_KEY, true);
    assert.equal(hasPriorDuskProfile(context), true);
    await migrateExistingProfileDefaults(context);
    assert.equal(
      vscode.workspace.getConfiguration("duskOffice").get("titleBar.alignWithTheme"),
      true,
    );
    assert.equal(
      vscode.workspace.getConfiguration("duskOffice").get("editorAnsi.allLanguages"),
      true,
    );
    assert.equal(context.globalState.get(keys.PROFILE_DEFAULTS_MIGRATION_KEY), PROFILE_DEFAULTS_MIGRATION_VALUE);

    vscode.__setMockConfig("duskOffice.titleBar.alignWithTheme", false);
    vscode.__setMockConfig("duskOffice.editorAnsi.allLanguages", false);
    await migrateExistingProfileDefaults(context);
    assert.equal(
      vscode.workspace.getConfiguration("duskOffice").get("titleBar.alignWithTheme"),
      false,
    );
    assert.equal(
      vscode.workspace.getConfiguration("duskOffice").get("editorAnsi.allLanguages"),
      false,
    );
  });

  it("does not overwrite keys the user already set", async () => {
    const context = createMockContext();
    await context.globalState.update(keys.FAVORITE_THEME_KEY, "Dusk Office Vault");
    vscode.__setMockConfig("duskOffice.titleBar.alignWithTheme", false);
    await migrateExistingProfileDefaults(context);
    assert.equal(
      vscode.workspace.getConfiguration("duskOffice").get("titleBar.alignWithTheme"),
      false,
    );
    assert.equal(
      vscode.workspace.getConfiguration("duskOffice").get("editorAnsi.allLanguages"),
      true,
    );
  });
});
