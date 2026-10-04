/**
 * First test that actually calls `activate()`. Before this, extension.js was never
 * required by any test: 26 command registrations, both event subscriptions, the
 * status-bar item and the startup sequence were entirely unaudited, and a typo in a
 * command id or a throw inside activate() would have shipped green.
 */
const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");

const vscode = require("vscode");
const cfg = require("../lib/core/configuration.js");
const keys = require("../lib/core/extension-keys.js");
const state = require("../lib/core/extension-state.js");
const extension = require("../extension.js");

function createMockContext() {
  const global = new Map();
  const workspace = new Map();
  return {
    extension: { packageJSON: require("../package.json") },
    subscriptions: [],
    globalState: {
      get: (k) => global.get(k),
      update: async (k, v) => (v === undefined ? global.delete(k) : global.set(k, v)),
    },
    workspaceState: {
      get: (k) => workspace.get(k),
      update: async (k, v) => (v === undefined ? workspace.delete(k) : workspace.set(k, v)),
    },
    _maps: { global, workspace },
  };
}

function disposeAll(context) {
  for (const sub of context.subscriptions) {
    try {
      sub.dispose();
    } catch {
      /* a disposable may already be torn down */
    }
  }
}

describe("extension activation", () => {
  let context;

  beforeEach(() => {
    vscode.__resetMockConfig();
    vscode.__resetMockWorkspaceFs();
    state.reset();
    vscode.workspace.workspaceFolders = [];
    vscode.commands._registry.clear();
    context = createMockContext();
  });

  afterEach(() => {
    disposeAll(context);
    vscode.__resetMockConfig();
    vscode.__resetMockWorkspaceFs();
    state.reset();
    vscode.workspace.workspaceFolders = [];
    vscode.commands._registry.clear();
  });

  it("registers every command declared in package.json", async () => {
    await extension.activate(context);
    const declared = require("../package.json").contributes.commands.map((c) => c.command);
    for (const id of declared) {
      assert.ok(
        vscode.commands._registry.has(id),
        `contributed command ${id} must be registered by activate()`,
      );
    }
  });

  it("registers rateOnMarketplace even though package.json omits it", async () => {
    await extension.activate(context);
    assert.ok(
      vscode.commands._registry.has("duskOffice.rateOnMarketplace"),
      "the Control Center calls this id; it must exist even without a palette entry",
    );
  });

  it("registers no command that package.json does not declare (except the known one)", async () => {
    await extension.activate(context);
    const declared = new Set(
      require("../package.json").contributes.commands.map((c) => c.command),
    );
    const knownUndeclared = new Set(["duskOffice.rateOnMarketplace"]);
    for (const id of vscode.commands._registry.keys()) {
      if (knownUndeclared.has(id)) continue;
      assert.ok(declared.has(id), `${id} is registered but not declared in package.json`);
    }
  });

  it("subscribes to both configuration and theme events", async () => {
    await extension.activate(context);
    assert.ok(context.subscriptions.length > 25, "expected the command + listener batch");
    // Firing the theme event must not throw even with no stored state.
    vscode.__fireMockThemeChange({ kind: vscode.ColorThemeKind.Dark });
    vscode.__fireMockConfigChange("duskOffice.syntax.italicComments");
  });

  it("stamps the profile-defaults latch without writing settings on a fresh profile", async () => {
    await extension.activate(context);
    assert.equal(
      context.globalState.get(keys.PROFILE_DEFAULTS_MIGRATION_KEY),
      "lessInvasiveDefaults",
    );
    assert.equal(state.legacyProfileDefaults, false);
    assert.equal(
      vscode.workspace.getConfiguration("duskOffice").inspect("titleBar.alignWithTheme"),
      undefined,
      "activation must never write a legacy default into settings.json",
    );
  });

  it("activation is idempotent enough to run twice without corrupting state", async () => {
    await extension.activate(context);
    const first = context.globalState.get(keys.PROFILE_DEFAULTS_MIGRATION_KEY);
    await extension.activate(context);
    assert.equal(context.globalState.get(keys.PROFILE_DEFAULTS_MIGRATION_KEY), first);
  });

  // -------------------------------------------------------------------------
  // The wiring the workspace-memory fix depends on. Previously only the helper
  // was tested; the event -> handler connection was not.
  // -------------------------------------------------------------------------
  it("a native theme pick clears the workspace pin through the real event path", async () => {
    vscode.workspace.workspaceFolders = [{ uri: vscode.Uri.file("/repo"), name: "repo", index: 0 }];
    vscode.__setMockConfig("duskOffice.rememberWorkspaceTheme", true);
    await extension.activate(context);

    const themes = require("../lib/themes/themes.js");
    await themes.applyTheme("Dusk Office Voltage", context, "manual");
    assert.equal(context.workspaceState.get(keys.WORKSPACE_THEME_KEY), "Dusk Office Voltage");

    // The user picks a different theme in VS Code's own picker, some time later.
    // Rewind our own write timestamp past the echo window rather than sleeping.
    state.lastAutomationThemeWriteTime =
      Date.now() - state.AUTOMATION_THEME_ECHO_MS - 1;
    vscode.__setMockConfig("workbench.colorTheme", "Default Dark Modern");
    vscode.__fireMockThemeChange({ kind: vscode.ColorThemeKind.Dark });
    await new Promise((r) => setImmediate(r));

    assert.equal(
      context.workspaceState.get(keys.WORKSPACE_THEME_KEY),
      undefined,
      "onDidChangeActiveColorTheme must reach noteManualThemeOverride and clear the pin",
    );
  });

  it("our own theme write does not clear the pin it just set", async () => {
    vscode.workspace.workspaceFolders = [{ uri: vscode.Uri.file("/repo"), name: "repo", index: 0 }];
    vscode.__setMockConfig("duskOffice.rememberWorkspaceTheme", true);
    await extension.activate(context);

    const themes = require("../lib/themes/themes.js");
    await themes.applyTheme("Dusk Office Vault", context, "manual");
    // Echo the write back the way VS Code does; the echo window must swallow it.
    vscode.__fireMockThemeChange({ kind: vscode.ColorThemeKind.Dark });
    await new Promise((r) => setImmediate(r));

    assert.equal(
      context.workspaceState.get(keys.WORKSPACE_THEME_KEY),
      "Dusk Office Vault",
      "the automation echo window must prevent self-inflicted pin clearing",
    );
  });

  it("deactivate() with no arguments still restores — VS Code calls it that way", async () => {
    // Regression: `deactivate(context)` relied on a parameter VS Code never passes,
    // so the uninstall restore the changelog promised never ran. Driving it through
    // `extension.deactivate()` is the point — calling the helper directly cannot see
    // the wiring.
    vscode.__setMockConfig("workbench.colorTheme", "◑ Dusk Office Finance");
    vscode.__setMockConfig("duskOffice.titleBar.alignWithTheme", true);
    await extension.activate(context);

    assert.equal(
      vscode.workspace.getConfiguration("window").get("titleBarStyle"),
      "custom",
      "precondition: the extension forced the custom title bar",
    );

    // Exactly how extHostExtensionService invokes it: no arguments, and the returned
    // promise collected and raced against a 5s shutdown timeout.
    const teardown = extension.deactivate();
    assert.equal(typeof teardown?.then, "function", "deactivate() must be awaitable");
    await teardown;

    assert.equal(
      vscode.workspace.getConfiguration("window").get("titleBarStyle"),
      undefined,
      "deactivate() must restore the user's own title-bar style without arguments",
    );
    assert.equal(
      context.globalState.get(keys.PREVIOUS_TITLE_BAR_GLOBAL_KEY),
      undefined,
      "the snapshot must be consumed, otherwise a later activation restores it again",
    );
    disposeAll(context);
  });

  it("deactivate() restores the product icon snapshot", async () => {
    vscode.__setMockConfig("workbench.colorTheme", "◑ Dusk Office Finance");
    await extension.activate(context);
    const productIcons = require("../lib/themes/product-icons.js");
    await productIcons.toggleProductIconTheme(context);
    assert.equal(
      vscode.workspace.getConfiguration("workbench").get("productIconTheme"),
      state.duskProductIconThemeId,
      "precondition: the Dusk product icon theme is applied",
    );

    await extension.deactivate();

    assert.equal(
      vscode.workspace.getConfiguration("workbench").get("productIconTheme"),
      undefined,
    );
    disposeAll(context);
  });

  it("deactivate() leaves workbench.colorTheme alone", async () => {
    vscode.__setMockConfig("workbench.colorTheme", "◑ Dusk Office Finance");
    await extension.activate(context);
    await extension.deactivate();
    assert.equal(cfg.getCurrentTheme(), "Dusk Office Finance");
    disposeAll(context);
  });
});