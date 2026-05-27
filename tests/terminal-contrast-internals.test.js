const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const { checkTerminalContrast } = require("../lib/terminal/terminal-contrast.js");

// ---------------------------------------------------------------------------
// parseColor edge cases (tested indirectly via checkTerminalContrast)
// ---------------------------------------------------------------------------
describe("parseColor edge cases via checkTerminalContrast", () => {
  it("handles 3-digit hex background (#fff)", () => {
    const colors = {
      "terminal.background": "#fff",
      "terminal.foreground": "#000000",
    };
    const failures = checkTerminalContrast(colors, "vs");
    assert.equal(failures.length, 0);
  });

  it("handles 8-digit hex (RRGGBBAA) background", () => {
    const colors = {
      "terminal.background": "#000000ff",
      "terminal.foreground": "#ffffff",
    };
    const failures = checkTerminalContrast(colors, "vs-dark");
    assert.equal(failures.length, 0, `unexpected: ${failures.join(", ")}`);
  });

  it("handles semi-transparent background (alpha compositing)", () => {
    const colors = {
      "terminal.background": "#00000080",
      "terminal.foreground": "#ffffff",
    };
    const failures = checkTerminalContrast(colors, "vs-dark");
    assert.equal(failures.length, 0);
  });

  it("handles semi-transparent foreground over dark bg", () => {
    const colors = {
      "terminal.background": "#000000",
      "terminal.foreground": "#ffffff80",
    };
    // Semi-transparent white on black: composited color is ~#808080
    // Luminance of #808080 vs #000000 => ratio ~5.3:1, above 4.5
    const failures = checkTerminalContrast(colors, "vs-dark");
    assert.equal(failures.length, 0);
  });

  it("rejects invalid background format", () => {
    const colors = {
      "terminal.background": "rgb(0,0,0)",
      "terminal.foreground": "#ffffff",
    };
    const failures = checkTerminalContrast(colors, "vs-dark");
    assert.ok(failures.length > 0);
    assert.ok(failures[0].includes("invalid"));
  });

  it("rejects non-hex background", () => {
    const colors = {
      "terminal.background": "#xyz",
      "terminal.foreground": "#ffffff",
    };
    const failures = checkTerminalContrast(colors, "vs-dark");
    assert.ok(failures.length > 0);
  });
});

// ---------------------------------------------------------------------------
// contrast ratio boundary cases
// ---------------------------------------------------------------------------
describe("contrast ratio boundaries via checkTerminalContrast", () => {
  it("detects low-contrast ANSI color on dark theme", () => {
    const colors = {
      "terminal.background": "#1e1e1e",
      "terminal.foreground": "#cccccc",
      "terminal.ansiBlue": "#222244",
    };
    const failures = checkTerminalContrast(colors, "vs-dark");
    const blueFailure = failures.find((f) => f.includes("terminal.ansiBlue"));
    assert.ok(blueFailure, "expected ansiBlue contrast failure");
  });

  it("passes high-contrast ANSI color", () => {
    const colors = {
      "terminal.background": "#000000",
      "terminal.foreground": "#ffffff",
      "terminal.ansiRed": "#ff5555",
      "terminal.ansiGreen": "#50fa7b",
      "terminal.ansiYellow": "#f1fa8c",
      "terminal.ansiBlue": "#6272a4",
      "terminal.ansiMagenta": "#ff79c6",
      "terminal.ansiCyan": "#8be9fd",
      "terminal.ansiWhite": "#f8f8f2",
      "terminal.ansiBrightRed": "#ff6e6e",
      "terminal.ansiBrightGreen": "#69ff94",
      "terminal.ansiBrightYellow": "#ffffa5",
      "terminal.ansiBrightBlue": "#d6acff",
      "terminal.ansiBrightMagenta": "#ff92df",
      "terminal.ansiBrightCyan": "#a4ffff",
      "terminal.ansiBrightWhite": "#ffffff",
    };
    const failures = checkTerminalContrast(colors, "vs-dark");
    assert.equal(failures.length, 0, `unexpected: ${failures.join(", ")}`);
  });

  it("white-on-white foreground fails", () => {
    const colors = {
      "terminal.background": "#ffffff",
      "terminal.foreground": "#fefefe",
    };
    const failures = checkTerminalContrast(colors, "vs");
    assert.ok(failures.length > 0);
  });
});
