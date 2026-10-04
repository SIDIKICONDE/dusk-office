/**
 * Proves the mock can express what the runtime actually depends on. Every other
 * test file assumes these hold, so a regression here would silently weaken the
 * whole suite rather than fail it.
 */
const { describe, it, beforeEach } = require("node:test");
const assert = require("node:assert/strict");

const vscode = require("vscode");
const cfg = require("../lib/core/configuration.js");
const keys = require("../lib/core/extension-keys.js");

const folderA = { uri: vscode.Uri.file("/repo-a"), name: "repo-a", index: 0 };
const folderB = { uri: vscode.Uri.file("/repo-b"), name: "repo-b", index: 1 };

describe("vscode mock fidelity", () => {
  beforeEach(() => {
    vscode.__resetMockConfig();
  });

  it("distinguishes the three configuration scopes", () => {
    const c = vscode.workspace.getConfiguration("workbench");
    c.update("colorTheme", "global-value", vscode.ConfigurationTarget.Global);
    c.update("colorTheme", "workspace-value", vscode.ConfigurationTarget.Workspace);

    assert.equal(c.get("colorTheme"), "workspace-value");
    assert.equal(c.inspect("colorTheme").globalValue, "global-value");
    assert.equal(c.inspect("colorTheme").workspaceValue, "workspace-value");
  });

  it("resolves workspace over global, like VS Code", () => {
    const c = vscode.workspace.getConfiguration("workbench");
    c.update("colorTheme", "global-value", vscode.ConfigurationTarget.Global);
    assert.equal(c.get("colorTheme"), "global-value");
    c.update("colorTheme", "workspace-value", vscode.ConfigurationTarget.Workspace);
    assert.equal(c.get("colorTheme"), "workspace-value");
  });

  it("keeps workspaceFolder scope separate per folder", () => {
    const a = vscode.workspace.getConfiguration("duskOffice", folderA);
    const b = vscode.workspace.getConfiguration("duskOffice", folderB);
    a.update("statusBar.enabled", false, vscode.ConfigurationTarget.WorkspaceFolder);

    assert.equal(a.get("statusBar.enabled"), false);
    assert.equal(
      b.inspect("statusBar.enabled")?.workspaceFolderValue,
      undefined,
      "folder scope must not bleed into a sibling folder",
    );
  });

  it("reports workspaceFolderValue through inspect for the scoped folder only", () => {
    const a = vscode.workspace.getConfiguration("duskOffice", folderA);
    const b = vscode.workspace.getConfiguration("duskOffice", folderB);
    a.update("statusBar.enabled", false, vscode.ConfigurationTarget.WorkspaceFolder);

    assert.equal(a.inspect("statusBar.enabled").workspaceFolderValue, false);
    assert.equal(b.inspect("statusBar.enabled")?.workspaceFolderValue, undefined);
  });

  it("returns undefined from inspect for a fully unset key", () => {
    const c = vscode.workspace.getConfiguration("duskOffice");
    assert.equal(c.inspect("never.set"), undefined);
  });

  it("honours the defaultValue argument of get()", () => {
    const c = vscode.workspace.getConfiguration("duskOffice");
    assert.equal(c.get("never.set", "fallback"), "fallback");
  });

  it("clearing with undefined removes only the targeted scope", () => {
    const c = vscode.workspace.getConfiguration("workbench");
    c.update("colorTheme", "global-value", vscode.ConfigurationTarget.Global);
    c.update("colorTheme", "workspace-value", vscode.ConfigurationTarget.Workspace);
    c.update("colorTheme", undefined, vscode.ConfigurationTarget.Workspace);

    assert.equal(c.get("colorTheme"), "global-value");
    assert.equal(c.inspect("colorTheme").workspaceValue, undefined);
  });

  // -------------------------------------------------------------------------
  // Events. Before this, zero events fired across the suite, which made every
  // event-driven behaviour in extension.js unauditable.
  // -------------------------------------------------------------------------
  it("delivers onDidChangeConfiguration to registered listeners", () => {
    const seen = [];
    const sub = vscode.workspace.onDidChangeConfiguration((e) => seen.push(e));
    try {
      vscode.workspace
        .getConfiguration("duskOffice")
        .update("statusBar.enabled", false, vscode.ConfigurationTarget.Global);
      assert.equal(seen.length, 1);
      assert.equal(seen[0].affectsConfiguration("duskOffice.statusBar.enabled"), true);
      assert.equal(seen[0].affectsConfiguration("duskOffice.favoriteTheme"), false);
    } finally {
      sub.dispose();
    }
  });

  it("stops delivering after dispose", () => {
    let count = 0;
    const sub = vscode.workspace.onDidChangeConfiguration(() => { count += 1; });
    sub.dispose();
    vscode.workspace
      .getConfiguration("duskOffice")
      .update("statusBar.enabled", false, vscode.ConfigurationTarget.Global);
    assert.equal(count, 0);
  });

  it("affectsConfiguration matches a parent section", () => {
    const events = [];
    const sub = vscode.workspace.onDidChangeConfiguration((e) => events.push(e));
    try {
      vscode.__fireMockConfigChange("workbench.colorTheme");
      assert.equal(events[0].affectsConfiguration("workbench"), true);
      assert.equal(events[0].affectsConfiguration("workbench.colorTheme"), true);
      assert.equal(events[0].affectsConfiguration("window.titleBarStyle"), false);
    } finally {
      sub.dispose();
    }
  });

  it("delivers onDidChangeActiveColorTheme to registered listeners", () => {
    const seen = [];
    const sub = vscode.window.onDidChangeActiveColorTheme((t) => seen.push(t));
    try {
      vscode.__fireMockThemeChange({ kind: vscode.ColorThemeKind.Light });
      assert.equal(seen.length, 1);
      assert.equal(seen[0].kind, vscode.ColorThemeKind.Light);
    } finally {
      sub.dispose();
    }
  });

  it("delivers onDidChangeActiveTextEditor", () => {
    const seen = [];
    const sub = vscode.window.onDidChangeActiveTextEditor((e) => seen.push(e));
    try {
      vscode.__fireMockEditorChange({ document: { languageId: "python" } });
      assert.equal(seen.length, 1);
      assert.equal(seen[0].document.languageId, "python");
      assert.equal(vscode.window.activeTextEditor.document.languageId, "python");
    } finally {
      sub.dispose();
    }
  });

  it("registers commands retrievable through _execute, and forgets them on dispose", async () => {
    const sub = vscode.commands.registerCommand("duskOffice.testOnly", () => "ok");
    assert.equal(await vscode.commands._execute("duskOffice.testOnly"), "ok");
    sub.dispose();
    await assert.rejects(() => vscode.commands._execute("duskOffice.testOnly"), /command not found/);
  });

  // -------------------------------------------------------------------------
  // The regression this whole upgrade exists for: getConfigTarget must be able
  // to see a workspace-scoped value, otherwise every "user overrode us, back off"
  // branch is dead code under test.
  // -------------------------------------------------------------------------
  it("getConfigTarget returns Workspace once a workspace value exists", () => {
    vscode.workspace.workspaceFolders = [folderA];
    try {
      const c = vscode.workspace.getConfiguration("workbench");
      assert.equal(
        cfg.getConfigTarget(c, "colorTheme"),
        vscode.ConfigurationTarget.Global,
        "no workspace open yet, or no workspace value -> Global",
      );
      c.update("colorTheme", "mine", vscode.ConfigurationTarget.Workspace);
      assert.equal(cfg.getConfigTarget(c, "colorTheme"), vscode.ConfigurationTarget.Workspace);
    } finally {
      vscode.workspace.workspaceFolders = [];
    }
  });

  it("getConfigTarget returns WorkspaceFolder when a folder-scoped value exists", () => {
    // The branch added when getConfigTarget learned about workspaceFolderValue. It
    // needs a folder-scoped write to be observable at all, which is why the mock
    // buckets scope-less folder writes under a sentinel instead of "".
    vscode.workspace.workspaceFolders = [folderA];
    try {
      vscode.workspace
        .getConfiguration("duskOffice", folderA)
        .update("statusBar.enabled", false, vscode.ConfigurationTarget.WorkspaceFolder);
      assert.equal(
        cfg.getConfigTarget(vscode.workspace.getConfiguration("duskOffice", folderA), "statusBar.enabled"),
        vscode.ConfigurationTarget.WorkspaceFolder,
        "a value the user set for one folder must not be promoted to global",
      );
    } finally {
      vscode.workspace.workspaceFolders = [];
    }
  });

it("getConfigTarget stays Global with no workspace open, whatever the scope holds", () => {
    vscode.workspace.workspaceFolders = [];
    try {
      vscode.workspace
        .getConfiguration("duskOffice", folderA)
        .update("statusBar.enabled", false, vscode.ConfigurationTarget.WorkspaceFolder);
      assert.equal(
        cfg.getConfigTarget(vscode.workspace.getConfiguration("duskOffice", folderA), "statusBar.enabled"),
        vscode.ConfigurationTarget.Global,
      );
    } finally {
      vscode.workspace.workspaceFolders = [];
    }
  });

it("getConfigTarget returns Global when only a folder value exists", () => {
    vscode.workspace.workspaceFolders = [folderA];
    try {
      vscode.workspace
        .getConfiguration("duskOffice", folderA)
        .update("statusBar.enabled", false, vscode.ConfigurationTarget.WorkspaceFolder);
      const c = vscode.workspace.getConfiguration("duskOffice");
      assert.equal(
        cfg.getConfigTarget(c, "statusBar.enabled"),
        vscode.ConfigurationTarget.Global,
        "a folder-scoped value must not be mistaken for a workspace one",
      );
    } finally {
      vscode.workspace.workspaceFolders = [];
    }
  });

  it("the workspace-theme pin survives a scope-aware round trip", async () => {
    vscode.workspace.workspaceFolders = [folderA];
    const workspace = new Map();
    const context = {
      globalState: { get: () => undefined, update: async () => {} },
      workspaceState: {
        get: (k) => workspace.get(k),
        update: async (k, v) => (v === undefined ? workspace.delete(k) : workspace.set(k, v)),
      },
    };
    try {
      const themes = require("../lib/themes/themes.js");
      vscode.__setMockConfig("duskOffice.rememberWorkspaceTheme", true);
      await themes.applyTheme("Dusk Office Voltage", context, "manual");
      assert.equal(context.workspaceState.get(keys.WORKSPACE_THEME_KEY), "Dusk Office Voltage");
    } finally {
      vscode.workspace.workspaceFolders = [];
    }
  });
});