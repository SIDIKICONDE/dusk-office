const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");

const vscode = require("vscode");
const cfg = require("../lib/core/configuration.js");
const keys = require("../lib/core/extension-keys.js");
const state = require("../lib/core/extension-state.js");
const themes = require("../lib/themes/themes.js");
const autoAdaptive = require("../lib/themes/auto-adaptive.js");
const { detectWorkspaceFingerprint } = require("../lib/workspace/workspace-fingerprint.js");

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
    subscriptions: [],
  };
}

/** Re-open the same fake workspace, keeping the same mementos — mimics a restart. */
async function reopen(context) {
  return autoAdaptive.restoreWorkspaceTheme(context);
}

describe("workspace theme memory", () => {
  let context;
  let originalFolders;
  let originalInfoMessage;
  let originalApplyTheme;

  beforeEach(() => {
    vscode.__resetMockConfig();
    vscode.__resetMockWorkspaceFs();
    state.reset();
    context = createMockContext();
    originalFolders = vscode.workspace.workspaceFolders;
    vscode.workspace.workspaceFolders = [
      { uri: vscode.Uri.file("/repo"), name: "repo", index: 0 },
    ];
    originalInfoMessage = vscode.window.showInformationMessage;
    originalApplyTheme = themes.applyTheme;
  });

  afterEach(() => {
    vscode.__resetMockConfig();
    vscode.__resetMockWorkspaceFs();
    state.reset();
    vscode.workspace.workspaceFolders = originalFolders;
    vscode.window.showInformationMessage = originalInfoMessage;
    themes.applyTheme = originalApplyTheme;
  });

  // -------------------------------------------------------------------------
  // Consent: the behaviour is off unless the user asked for it.
  // -------------------------------------------------------------------------
  it("is disabled by default", () => {
    assert.equal(cfg.getWorkspaceThemeMemoryEnabled(), false);
  });

  it("restoreWorkspaceTheme does nothing by default, even with a stored pin", async () => {
    await context.workspaceState.update(keys.WORKSPACE_THEME_KEY, "Dusk Office Voltage");
    vscode.__setMockConfig("workbench.colorTheme", "◑ Dusk Office Midnight");

    assert.equal(await reopen(context), false);
    assert.equal(
      cfg.getCurrentTheme(),
      "Dusk Office Midnight",
      "startup must not overwrite the active theme when memory is off",
    );
  });

  it("restoreWorkspaceTheme re-applies the pin when explicitly enabled", async () => {
    vscode.__setMockConfig("duskOffice.rememberWorkspaceTheme", true);
    await context.workspaceState.update(keys.WORKSPACE_THEME_KEY, "Dusk Office Voltage");
    vscode.__setMockConfig("workbench.colorTheme", "◑ Dusk Office Midnight");

    assert.equal(await reopen(context), true);
    assert.equal(cfg.getCurrentTheme(), "Dusk Office Voltage");
  });

  // -------------------------------------------------------------------------
  // Writing: applyTheme must not pin unless memory is on.
  // -------------------------------------------------------------------------
  it("applyTheme does not pin the workspace by default", async () => {
    assert.equal(await themes.applyTheme("Dusk Office Finance", context, "manual"), true);
    assert.equal(context.workspaceState.get(keys.WORKSPACE_THEME_KEY), undefined);
  });

  it("applyTheme pins the workspace when memory is enabled", async () => {
    vscode.__setMockConfig("duskOffice.rememberWorkspaceTheme", true);
    await themes.applyTheme("Dusk Office Finance", context, "manual");
    assert.equal(context.workspaceState.get(keys.WORKSPACE_THEME_KEY), "Dusk Office Finance");
  });

  it("applyTheme honours persistWorkspaceMemory:false even when memory is enabled", async () => {
    vscode.__setMockConfig("duskOffice.rememberWorkspaceTheme", true);
    await themes.applyTheme("Dusk Office Finance", context, "manual", {
      persistWorkspaceMemory: false,
    });
    assert.equal(context.workspaceState.get(keys.WORKSPACE_THEME_KEY), undefined);
  });

  // -------------------------------------------------------------------------
  // Escape hatch: a manual pick must stick and must clear the pin.
  // -------------------------------------------------------------------------
  it("noteManualThemeOverride clears the pin so it cannot come back", async () => {
    vscode.__setMockConfig("duskOffice.rememberWorkspaceTheme", true);
    await context.workspaceState.update(keys.WORKSPACE_THEME_KEY, "Dusk Office Voltage");

    assert.equal(await autoAdaptive.noteManualThemeOverride(context), true);
    assert.equal(context.workspaceState.get(keys.WORKSPACE_THEME_KEY), undefined);
  });

  it("noteManualThemeOverride records the manual timestamp for the grace window", async () => {
    assert.equal(await autoAdaptive.noteManualThemeOverride(context), false);
    assert.ok(
      Date.now() - state.lastManualThemeApplyTime < 1000,
      "a native theme pick must register as a manual override",
    );
  });

  it("noteManualThemeOverride is a no-op when nothing is pinned", async () => {
    assert.equal(await autoAdaptive.noteManualThemeOverride(context), false);
  });

  it("a manual pick survives the next launch even with memory enabled", async () => {
    vscode.__setMockConfig("duskOffice.rememberWorkspaceTheme", true);
    await themes.applyTheme("Dusk Office Voltage", context, "manual");
    assert.equal(context.workspaceState.get(keys.WORKSPACE_THEME_KEY), "Dusk Office Voltage");

    // User switches to a non-Dusk theme through VS Code's own picker.
    await autoAdaptive.noteManualThemeOverride(context);
    vscode.__setMockConfig("workbench.colorTheme", "Default Dark Modern");
    state.reset();

    assert.equal(await reopen(context), false);
    assert.equal(cfg.getCurrentTheme(), "Default Dark Modern");
  });

  // -------------------------------------------------------------------------
  // Echo suppression: our own writes must not be read back as manual picks.
  // -------------------------------------------------------------------------
  it("isThemeAutomationEcho is true right after our own write", async () => {
    assert.equal(state.isThemeAutomationEcho(), false);
    await themes.applyTheme("Dusk Office Finance", context, "manual");
    assert.equal(state.isThemeAutomationEcho(), true);
  });

  it("isThemeAutomationEcho is false for a pick we did not make", async () => {
    await themes.applyTheme("Dusk Office Finance", context, "manual");
    state.lastAutomationThemeWriteTime = Date.now() - state.AUTOMATION_THEME_ECHO_MS - 1;
    assert.equal(state.isThemeAutomationEcho(), false);
  });

  // -------------------------------------------------------------------------
  // Regression for issue #7: accepting a fingerprint suggestion must not opt the
  // user into permanent workspace memory.
  // -------------------------------------------------------------------------
  it("accepting a fingerprint suggestion does not pin the workspace", async () => {
    vscode.__setMockWorkspaceFs({
      "/repo/package.json": JSON.stringify({ dependencies: { next: "14.0.0" } }),
      "/repo/turbo.json": JSON.stringify({}),
    });
    vscode.__setMockConfig("workbench.colorTheme", "Default Dark Modern");
    vscode.window.showInformationMessage = async () => "Try it";

    const calls = [];
    themes.applyTheme = async (...args) => {
      calls.push(args);
      return true;
    };

    const variant = await detectWorkspaceFingerprint(context);

    assert.equal(variant, "Dusk Office Voltage");
    assert.equal(calls.length, 1);
    assert.equal(
      calls[0][3]?.persistWorkspaceMemory,
      false,
      "the fingerprint prompt must not persist workspace memory",
    );
    assert.equal(context.workspaceState.get(keys.WORKSPACE_THEME_KEY), undefined);
  });
});