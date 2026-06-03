const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const { luminance, contrastRatio, parseColor } = require("../lib/terminal/terminal-contrast.js");
const { adjustColorForContrast, fixComponentBackground, toRgb } = require("../lib/contrast/contrast-fix.js");

function ratioOf(fgHex, bgHex) {
  const fg = toRgb(fgHex);
  const bg = toRgb(bgHex);
  return contrastRatio(luminance(fg), luminance(bg));
}

describe("adjustColorForContrast", () => {
  it("brightens a dim foreground on a dark background to clear the target", () => {
    const bg = toRgb("#101010");
    const fixed = adjustColorForContrast("#2a2a2a", bg, 3.0);
    assert.notEqual(fixed, "#2a2a2a");
    assert.ok(contrastRatio(luminance(toRgb(fixed)), luminance(bg)) >= 3.0);
  });

  it("darkens a foreground on a light background", () => {
    const bg = toRgb("#f1f5f9");
    const fixed = adjustColorForContrast("#c9a85c", bg, 3.0);
    assert.notEqual(fixed, "#c9a85c");
    const fixedL = luminance(toRgb(fixed));
    assert.ok(contrastRatio(fixedL, luminance(bg)) >= 3.0);
    assert.ok(fixedL < luminance(toRgb("#c9a85c")), "should move darker on a light bg");
  });

  it("leaves an already-passing color unchanged", () => {
    const bg = toRgb("#000000");
    assert.equal(adjustColorForContrast("#ffffff", bg, 4.5), "#ffffff");
  });

  it("is idempotent (a fixed value is not changed again)", () => {
    const bg = toRgb("#101010");
    const once = adjustColorForContrast("#2a2a2a", bg, 3.0);
    const twice = adjustColorForContrast(once, bg, 3.0);
    assert.equal(twice, once);
  });

  it("preserves hue exactly when darkening (channel ratios constant)", () => {
    const bg = toRgb("#ffffff");
    const fixed = toRgb(adjustColorForContrast("#88aacc", bg, 4.5));
    // darkening scales all channels by the same factor → ratios preserved
    assert.ok(Math.abs(fixed.r / fixed.g - 0x88 / 0xaa) < 0.05);
    assert.ok(Math.abs(fixed.g / fixed.b - 0xaa / 0xcc) < 0.05);
  });
});

describe("fixComponentBackground", () => {
  it("bakes a translucent chip opaque to make dark ink readable", () => {
    const fixed = fixComponentBackground("#5a8fb0aa", "#0a0a0a", 3.0);
    assert.equal(parseColor(fixed).alpha, undefined, "result should be opaque");
    assert.ok(ratioOf("#0a0a0a", fixed) >= 3.0);
  });

  it("lifts a low-contrast badge (dark ink) above target", () => {
    const fixed = fixComponentBackground("#8b4a5aaa", "#0a0a0a", 3.0);
    assert.ok(ratioOf("#0a0a0a", fixed) >= 3.0);
  });

  it("handles white ink chips", () => {
    const fixed = fixComponentBackground("#658297aa", "#ffffff", 3.0);
    assert.ok(ratioOf("#ffffff", fixed) >= 3.0);
  });
});
