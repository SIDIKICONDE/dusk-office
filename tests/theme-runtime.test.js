const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");

const vscode = require("vscode");
const cfg = require("../lib/core/configuration.js");
const { isDuskTheme } = require("../lib/themes/theme-common.js");
const themes = require("../lib/themes/themes.js");
const titleBar = require("../lib/themes/title-bar.js");
const keys = require("../lib/core/extension-keys.js");
const state = require("../lib/core/extension-state.js");
const { handleGalleryMessage } = require("../lib/ui/theme-gallery.js");

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

describe("theme runtime (badged vs plain)", () => {
  let originalQuickPick;

  beforeEach(() => {
    vscode.__resetMockConfig();
    state.reset();
    originalQuickPick = vscode.window.showQuickPick;
  });

  afterEach(() => {
    vscode.window.showQuickPick = originalQuickPick;
    vscode.__resetMockConfig();
    state.reset();
  });

  it("getCurrentTheme strips ◑/◒ labels", () => {
    vscode.__setMockConfig("workbench.colorTheme", "◑ Dusk Office Midnight");
    assert.equal(cfg.getCurrentTheme(), "Dusk Office Midnight");
  });

  it("isDuskTheme accepts a badged Marketplace label", () => {
    assert.equal(isDuskTheme("◑ Dusk Office Midnight"), true);
    assert.equal(isDuskTheme("◒ Dusk Office Light"), true);
    assert.equal(isDuskTheme("◑ Dusk Office · Base"), true);
  });

  it("duskOffice.isActive is true when colorTheme is a badged Dusk label", () => {
    vscode.__setMockConfig("workbench.colorTheme", "◑ Dusk Office Midnight");
    const isActive = isDuskTheme(cfg.getCurrentTheme());
    assert.equal(isActive, true);
  });

  it("applyTheme writes the display label and getCurrentTheme returns the plain name", async () => {
    vscode.__setMockConfig("workbench.colorTheme", "Default Dark+");
    const context = createMockContext();
    const applied = await themes.applyTheme("Dusk Office Vault", context, "manual");
    assert.equal(applied, true);
    assert.equal(vscode.workspace.getConfiguration("workbench").get("colorTheme"), "◑ Dusk Office Vault");
    assert.equal(cfg.getCurrentTheme(), "Dusk Office Vault");
    assert.equal(context.globalState.get(keys.PREVIOUS_THEME_KEY), "Default Dark+");
  });

  it("setThemeVariant applies the picker's theme field", async () => {
    vscode.__setMockConfig("workbench.colorTheme", "Dusk Office Finance");
    vscode.window.showQuickPick = async (items) => items.find((item) => item.theme === "Dusk Office Vault");
    const chosen = await themes.setThemeVariant(createMockContext());
    assert.equal(chosen, "Dusk Office Vault");
    assert.equal(cfg.getCurrentTheme(), "Dusk Office Vault");
  });

  it("setThemeVariant returns undefined when the picker is cancelled", async () => {
    vscode.__setMockConfig("workbench.colorTheme", "Dusk Office Finance");
    vscode.window.showQuickPick = async () => undefined;
    const chosen = await themes.setThemeVariant(createMockContext());
    assert.equal(chosen, undefined);
    assert.equal(cfg.getCurrentTheme(), "Dusk Office Finance");
  });

  it("handleGalleryMessage apply path writes the theme", async () => {
    vscode.__setMockConfig("workbench.colorTheme", "Dusk Office Finance");
    const panel = { webview: { html: "" } };
    await handleGalleryMessage(
      { type: "apply", theme: "◑ Dusk Office Midnight" },
      createMockContext(),
      panel,
    );
    assert.equal(cfg.getCurrentTheme(), "Dusk Office Midnight");
  });

  it("title-bar does not restore previous style when a badged Dusk theme is active", async () => {
    vscode.__setMockConfig("workbench.colorTheme", "◑ Dusk Office Midnight");
    vscode.__setMockConfig("duskOffice.titleBar.alignWithTheme", true);
    vscode.__setMockConfig("window.titleBarStyle", "custom");
    const context = createMockContext();
    await context.globalState.update(keys.PREVIOUS_TITLE_BAR_GLOBAL_KEY, "native");
    await titleBar.syncTitleBarStyleForDuskTheme(context);
    assert.equal(context.globalState.get(keys.PREVIOUS_TITLE_BAR_GLOBAL_KEY), "native");
    assert.equal(vscode.workspace.getConfiguration("window").get("titleBarStyle"), "custom");
  });
});
