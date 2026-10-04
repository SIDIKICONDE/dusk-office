const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");

const { checkTerminalContrast } = require("../lib/terminal/terminal-contrast.js");
const { mergeThemeColors } = require("../lib/terminal/theme-merge.js");

// ---------------------------------------------------------------------------
// checkTerminalContrast — synthetic colors
// ---------------------------------------------------------------------------
describe("checkTerminalContrast", () => {
  /** A complete, passing terminal palette — 12 non-black ANSI slots + foreground. */
function fullTerminalPalette(overrides = {}) {
  const ansi = {
    Red: "#ff5555", Green: "#55ff55", Yellow: "#ffff55", Blue: "#5555ff",
    Magenta: "#ff55ff", Cyan: "#55ffff", White: "#ffffff",
    BrightRed: "#ff7777", BrightGreen: "#77ff77", BrightYellow: "#ffff77",
    BrightBlue: "#7777ff", BrightMagenta: "#ff77ff", BrightCyan: "#77ffff",
    BrightWhite: "#ffffff",
  };
  const colors = { "terminal.background": "#000000", "terminal.foreground": "#ffffff" };
  for (const [name, hex] of Object.entries(ansi)) colors[`terminal.ansi${name}`] = hex;
  return { ...colors, ...overrides };
}

  it("passes with high-contrast colors", () => {
    const failures = checkTerminalContrast(fullTerminalPalette(), "vs-dark");
    assert.equal(failures.length, 0, `unexpected failures: ${failures.join(", ")}`);
  });

  it("reports an unreadable ANSI color instead of skipping it", () => {
    const colors = fullTerminalPalette({ "terminal.ansiRed": "#ff" });
    const failures = checkTerminalContrast(colors, "vs-dark");
    assert.ok(
      failures.some((f) => f.includes("terminal.ansiRed") && f.includes("not a readable color")),
      `expected an unreadable-color failure, got: ${failures.join("; ") || "none"}`,
    );
  });

  it("reports a missing ANSI color instead of skipping it", () => {
    const colors = fullTerminalPalette();
    delete colors["terminal.ansiCyan"];
    const failures = checkTerminalContrast(colors, "vs-dark");
    assert.ok(
      failures.some((f) => f.includes("terminal.ansiCyan") && f.includes("missing")),
      `expected a missing-color failure, got: ${failures.join("; ") || "none"}`,
    );
  });

  it("reports a missing terminal.foreground", () => {
    const colors = fullTerminalPalette();
    delete colors["terminal.foreground"];
    const failures = checkTerminalContrast(colors, "vs-dark");
    assert.ok(failures.some((f) => f.includes("terminal.foreground") && f.includes("missing")));
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
    // The two black slots are excluded from contrast scoring, but every other ANSI
    // key is required — a partial fixture must now report the absent ones.
    const failures = checkTerminalContrast(colors, "vs-dark");
    assert.equal(
      failures.filter((f) => f.startsWith("terminal.ansiBlack")).length,
      0,
      "ansiBlack must never be scored",
    );
    assert.equal(
      failures.filter((f) => f.startsWith("terminal.ansiBrightBlack")).length,
      0,
      "ansiBrightBlack must never be scored",
    );
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
    assert.ok(fs.existsSync(file), `missing fixture: ${file}`);
    const colors = mergeThemeColors(file);
    assert.equal(typeof colors, "object");
    assert.ok("terminal.background" in colors, "expected terminal.background key");
  });

  it("reads and merges an include-based theme file", () => {
    const file = path.join(themesDir, "dusk-minuit.json");
    assert.ok(fs.existsSync(file), `missing fixture: ${file}`);
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
  // Previously `if (!fs.existsSync(themesDir)) return;` sat in the describe body, so a
  // missing or renamed directory silently registered zero tests and still exited 0.
  // Fail loudly instead.
  assert.ok(fs.existsSync(themesDir), `themes directory is missing: ${themesDir}`);

  const themeFiles = fs.readdirSync(themesDir).filter((f) => f.endsWith(".json"));
  assert.ok(themeFiles.length >= 27, `expected at least 27 theme files, found ${themeFiles.length}`);

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
