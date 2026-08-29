const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");

const vscode = require("vscode");
const keys = require("../lib/core/extension-keys.js");
const { showActivationPrompt } = require("../lib/prompts/activation-prompt.js");

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

describe("showActivationPrompt", () => {
  let originalExecute;
  /** @type {string[]} */
  let commands;

  beforeEach(() => {
    vscode.__resetMockConfig();
    commands = [];
    originalExecute = vscode.commands.executeCommand;
    vscode.commands.executeCommand = async (cmd) => {
      commands.push(cmd);
    };
  });

  afterEach(() => {
    vscode.commands.executeCommand = originalExecute;
    vscode.__resetMockConfig();
  });

  it("opens Get Started on first install even when the theme is not Dusk", async () => {
    vscode.__setMockConfig("workbench.colorTheme", "Default Dark+");
    const context = createMockContext();
    const shown = await showActivationPrompt(context);
    assert.equal(shown, true);
    assert.equal(context.globalState.get(keys.WALKTHROUGH_SHOWN_KEY), true);
    assert.equal(commands.includes("workbench.action.openWalkthrough"), true);
  });

  it("does not nag a later workspace when Dusk is not active", async () => {
    vscode.__setMockConfig("workbench.colorTheme", "Default Dark+");
    const context = createMockContext();
    await context.globalState.update(keys.WALKTHROUGH_SHOWN_KEY, true);
    const shown = await showActivationPrompt(context);
    assert.equal(shown, false);
    assert.equal(commands.length, 0);
  });

  it("skips the workspace notification once it has already been shown", async () => {
    vscode.__setMockConfig("workbench.colorTheme", "Dusk Office Finance");
    const context = createMockContext();
    await context.globalState.update(keys.WALKTHROUGH_SHOWN_KEY, true);
    await context.workspaceState.update(keys.WORKSPACE_ACTIVATION_PROMPT_KEY, true);
    const shown = await showActivationPrompt(context);
    assert.equal(shown, false);
  });
});
