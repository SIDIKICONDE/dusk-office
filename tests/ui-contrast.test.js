const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");

const { mergeThemeData } = require("../lib/themes/theme-merge-data.js");
const {
  MIN_TEXT_RATIO,
  MIN_UI_RATIO,
  resolveBackgroundRgb,
  checkUiContrast,
  failingUiContrast,
} = require("../lib/contrast/ui-contrast.js");

const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "package.json"), "utf8"));
const root = path.join(__dirname, "..");

describe("resolveBackgroundRgb", () => {
  it("returns opaque RGB unchanged", () => {
    assert.deepEqual(resolveBackgroundRgb("#102030", "vs-dark"), { r: 16, g: 32, b: 48 });
  });

  it("composites alpha over the uiTheme surface", () => {
    const overBlack = resolveBackgroundRgb("#ffffff80", "vs-dark");
    const overWhite = resolveBackgroundRgb("#00000080", "vs");
    assert.ok(overBlack.r > 100 && overBlack.r < 200, "white@50% over black -> mid gray");
    assert.ok(overWhite.r > 100 && overWhite.r < 200, "black@50% over white -> mid gray");
  });

  it("returns null for invalid input", () => {
    assert.equal(resolveBackgroundRgb("not-a-color", "vs-dark"), null);
  });
});

describe("checkUiContrast — synthetic", () => {
  it("passes high-contrast pairs", () => {
    const colors = {
      "editor.background": "#000000",
      "editor.foreground": "#ffffff",
      "statusBar.background": "#000000",
      "statusBar.foreground": "#ffffff",
    };
    const fails = failingUiContrast(colors, [], "vs-dark");
    assert.equal(fails.length, 0, `unexpected failures: ${fails.map((f) => f.label).join(", ")}`);
  });

  it("flags low-contrast editor text", () => {
    const colors = { "editor.background": "#1a1a1a", "editor.foreground": "#222222" };
    const results = checkUiContrast(colors, [], "vs-dark");
    const editor = results.find((r) => r.label === "Editor text");
    assert.ok(editor && !editor.pass, "near-identical fg/bg should fail");
    assert.ok(editor.ratio < MIN_TEXT_RATIO);
  });

  it("scores syntax tokens against the editor background", () => {
    const colors = { "editor.background": "#101010", "editor.foreground": "#e0e0e0" };
    const tokenColors = [
      { scope: "comment", settings: { foreground: "#1c1c1c" } },
      { scope: "string", settings: { foreground: "#d0ffd0" } },
    ];
    const results = checkUiContrast(colors, tokenColors, "vs-dark");
    const comment = results.find((r) => r.label === "Syntax: comment");
    const string = results.find((r) => r.label === "Syntax: string");
    assert.ok(comment && !comment.pass, "dark comment on dark bg should fail");
    assert.ok(string && string.pass, "bright string on dark bg should pass");
  });

  it("uses the relaxed UI threshold for diagnostic glyphs", () => {
    const colors = { "editor.background": "#101010", "editorError.foreground": "#c04040" };
    const results = checkUiContrast(colors, [], "vs-dark");
    const err = results.find((r) => r.label === "Error glyph");
    assert.ok(err);
    assert.equal(err.min, MIN_UI_RATIO);
  });

  it("skips pairs whose colors are absent", () => {
    const results = checkUiContrast({ "editor.background": "#000000" }, [], "vs-dark");
    assert.ok(!results.some((r) => r.label === "Button text"));
  });
});

describe("checkUiContrast — packaged themes", () => {
  // The pack-wide invariant that every shipped variant already meets: all
  // normal-text chrome (editor body, sidebar, status bar, tabs, lists, inputs,
  // notifications, title bar) stays at or above WCAG AA 4.5:1. This guards
  // against regressions without enforcing design opinions on badges, dimmed
  // comments, or signal glyphs (those are surfaced by the audit report instead).
  const NORMAL_TEXT_KEYS = new Set([
    "editor.foreground",
    "sideBar.foreground",
    "statusBar.foreground",
    "titleBar.activeForeground",
    "tab.activeForeground",
    "input.foreground",
    "list.activeSelectionForeground",
    "notifications.foreground",
  ]);

  it("keeps all normal-text chrome readable (>= 4.5:1) on every variant", () => {
    const themes = pkg.contributes.themes.filter((t) => typeof t.path === "string");
    assert.ok(themes.length >= 20);
    const offenders = [];
    for (const t of themes) {
      const full = path.resolve(root, t.path);
      if (!fs.existsSync(full)) continue;
      const data = mergeThemeData(full);
      const fails = failingUiContrast(data.colors, data.tokenColors, t.uiTheme || "vs-dark").filter((f) =>
        NORMAL_TEXT_KEYS.has(f.fgKey),
      );
      if (fails.length) {
        offenders.push(`${t.label}: ${fails.map((f) => `${f.label} ${f.ratio.toFixed(2)}:1`).join("; ")}`);
      }
    }
    assert.equal(offenders.length, 0, `normal-text chrome below 4.5:1:\n${offenders.join("\n")}`);
  });
});
