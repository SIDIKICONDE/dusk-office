const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");

const {
  MIN_TERMINAL_FG_RATIO,
  MIN_TERMINAL_ANSI_RATIO,
  mergeThemeColors,
  checkTerminalContrast,
} = require("../lib/terminal-contrast.js");

// ---------------------------------------------------------------------------
// checkTerminalContrast — synthetic colors
// ---------------------------------------------------------------------------
describe("checkTerminalContrast", () => {
  it("passes with high-contrast colors", () => {
    const colors = {
      "terminal.background": "#000000",
      "terminal.foreground": "#ffffff",
      "terminal.ansiRed": "#ff5555",
      "terminal.ansiGreen": "#55ff55",
    };
    const failures = checkTerminalContrast(colors, "vs-dark");
    assert.equal(failures.length, 0, `unexpected failures: ${failures.join(", ")}`);
  });

  it("fails when terminal.background is missing", () => {
    const failures = checkTerminalContrast({}, "vs-dark");
    assert.equal(failures.length, 1);
    assert.ok(failures[0].includes("missing"));
  });

  it("detects low-contrast foreground", () => {
    const colors = {
      "terminal.background": "#1a1a1a",
      "terminal.foreground": "#2a2a2a",
    };
    const failures = checkTerminalContrast(colors, "vs-dark");
    assert.ok(failures.length > 0, "expected contrast failure");
    assert.ok(failures[0].includes("terminal.foreground"));
  });

  it("skips ansiBlack and ansiBrightBlack", () => {
    const colors = {
      "terminal.background": "#000000",
      "terminal.foreground": "#ffffff",
      "terminal.ansiBlack": "#000000",
      "terminal.ansiBrightBlack": "#111111",
    };
    const failures = checkTerminalContrast(colors, "vs-dark");
    assert.equal(failures.length, 0);
  });

  it("checks ANSI contrast on light (vs) uiTheme", () => {
    const colors = {
      "terminal.background": "#ffffff",
      "terminal.foreground": "#000000",
      "terminal.ansiYellow": "#ffff00",
    };
    const failures = checkTerminalContrast(colors, "vs");
    assert.ok(failures.some((f) => f.includes("terminal.ansiYellow")));
  });
});

// ---------------------------------------------------------------------------
// mergeThemeColors — real theme files
// ---------------------------------------------------------------------------
describe("mergeThemeColors", () => {
  const themesDir = path.resolve(__dirname, "..", "themes");

  it("reads and merges a base theme file", () => {
    const file = path.join(themesDir, "dusk.json");
    if (!fs.existsSync(file)) return;
    const colors = mergeThemeColors(file);
    assert.equal(typeof colors, "object");
    assert.ok("terminal.background" in colors, "expected terminal.background key");
  });

  it("reads and merges an include-based theme file", () => {
    const file = path.join(themesDir, "dusk-minuit.json");
    if (!fs.existsSync(file)) return;
    const colors = mergeThemeColors(file);
    assert.equal(typeof colors, "object");
    assert.ok("terminal.background" in colors, "expected terminal.background from include chain");
  });
});

// ---------------------------------------------------------------------------
// Full contrast check on all shipped themes
// ---------------------------------------------------------------------------
describe("shipped themes contrast", () => {
  const themesDir = path.resolve(__dirname, "..", "themes");
  if (!fs.existsSync(themesDir)) return;

  const themeFiles = fs.readdirSync(themesDir).filter((f) => f.endsWith(".json"));

  for (const file of themeFiles) {
    it(`${file} passes terminal contrast checks`, () => {
      const fullPath = path.join(themesDir, file);
      const colors = mergeThemeColors(fullPath);
      const themeJson = JSON.parse(fs.readFileSync(fullPath, "utf8"));
      const uiTheme = themeJson.type === "light" ? "vs" : themeJson.type === "hc" ? "hc-black" : "vs-dark";
      const failures = checkTerminalContrast(colors, uiTheme);
      assert.equal(failures.length, 0, `contrast failures in ${file}:\n${failures.join("\n")}`);
    });
  }
});
