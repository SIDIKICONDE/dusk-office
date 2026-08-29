const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");

const vscode = require("vscode");
const { buildControlCenterItems } = require("../lib/ui/control-center.js");

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

describe("control center grouping", () => {
  beforeEach(() => {
    vscode.__resetMockConfig();
  });

  afterEach(() => {
    vscode.__resetMockConfig();
  });

  it("uses Quick Pick separators and keeps every previous action", () => {
    const items = buildControlCenterItems(createMockContext());
    const separators = items
      .filter((item) => item.kind === vscode.QuickPickItemKind.Separator)
      .map((item) => item.label);
    assert.deepEqual(separators, [
      "Themes",
      "Automation",
      "Workspace",
      "Appearance",
      "ANSI",
      "Contrast",
      "Setup",
    ]);

    const actionLabels = items
      .filter((item) => typeof item.action === "function")
      .map((item) => item.label);
    const expectedSnippets = [
      "Choose Theme",
      "Theme Gallery",
      "Previous Theme",
      "Favorite Theme",
      "Set Favorite",
      "Auto Switch",
      "Adaptive Focus",
      "Apply Adaptive Theme Now",
      "Adaptive Focus Settings",
      "Configure Auto Switch",
      "Clear Workspace Theme Memory",
      "Reset Workspace Fingerprint",
      "Activity Bar Position",
      "Product Icons",
      "Title Bar Align",
      "Status Bar Button",
      "ANSI in Editor",
      "ANSI in Editor Settings",
      "Verify Terminal Contrast",
      "Verify Editor & UI Contrast",
      "Reset All Settings",
      "Settings",
      "Rate Dusk Office on Marketplace",
    ];
    for (const snippet of expectedSnippets) {
      assert.ok(
        actionLabels.some((label) => label.includes(snippet)),
        `missing Control Center action: ${snippet}`,
      );
    }
    assert.equal(actionLabels.length, expectedSnippets.length);
  });
});
