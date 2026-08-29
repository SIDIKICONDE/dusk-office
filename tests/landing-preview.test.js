const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { toRgbHex, buildLandingThemeEntry } = require("../lib/themes/landing-preview.js");

describe("landing preview swatches", () => {
  it("normalizes 6- and 8-digit hex", () => {
    assert.equal(toRgbHex("#0D1520"), "#0d1520");
    assert.equal(toRgbHex("#22d3eeaa"), "#22d3ee");
    assert.equal(toRgbHex("not-a-color", "#808080"), "#808080");
  });

  it("reads editor colors from the gallery preview model", () => {
    const entry = buildLandingThemeEntry({
      name: "Dusk Office Finance",
      type: "dark",
      colors: {
        "editor.background": "#0d1520",
        "editor.foreground": "#e8e6e3",
        focusBorder: "#22d3ee",
      },
      tokenColors: [],
    });
    assert.deepEqual(entry, {
      name: "Dusk Office Finance",
      bg: "#0d1520",
      fg: "#e8e6e3",
      accent: "#22d3ee",
    });
  });
});
