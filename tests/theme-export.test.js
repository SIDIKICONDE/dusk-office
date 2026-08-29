const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { join } = require("node:path");

const { resolveTheme } = require("../lib/export/theme-resolve.mjs");
const {
  buildExportPalette,
  colorForScopes,
  composeHexOnBackground,
} = require("../lib/export/theme-export-palette.mjs");
const { toJetBrainsIcls } = require("../lib/export/export-formats.mjs");
const { extractLatestChangeNotes } = require("../scripts/sync-jetbrains-plugin.mjs");

const ROOT = join(__dirname, "..");

/** @param {string} fg @param {string} bg */
function contrastRatio(fg, bg) {
  const parse = (hex) => {
    const h = hex.replace(/^#/, "").slice(0, 6);
    const r = parseInt(h.slice(0, 2), 16) / 255;
    const g = parseInt(h.slice(2, 4), 16) / 255;
    const b = parseInt(h.slice(4, 6), 16) / 255;
    const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  };
  const l1 = parse(fg);
  const l2 = parse(bg);
  const light = Math.max(l1, l2);
  const dark = Math.min(l1, l2);
  return (light + 0.05) / (dark + 0.05);
}

/** @param {string} file */
function paletteFor(file) {
  return buildExportPalette(resolveTheme(join(ROOT, "themes", file)));
}

describe("colorForScopes role matching", () => {
  const rules = [
    { scope: "keyword", settings: { foreground: "#c89068" } },
    { scope: "keyword.control", settings: { foreground: "#c89068" } },
    { scope: "keyword.operator", settings: { foreground: "#5a8ab8" } },
    { scope: "keyword.operator.logical", settings: { foreground: "#5a8ab8" } },
    { scope: "string", settings: { foreground: "#3ce8f5" } },
    { scope: "string.quoted", settings: { foreground: "#3ce8f5" } },
    { scope: "string.regexp", settings: { foreground: "#b88898" } },
  ];

  it("does not let keyword.operator steal the keyword role", () => {
    assert.equal(colorForScopes(rules, ["keyword", "storage.type"]), "#c89068");
  });

  it("keeps keyword.operator on the operator role", () => {
    assert.equal(colorForScopes(rules, ["keyword.operator"]), "#5a8ab8");
  });

  it("does not let string.regexp steal the string role", () => {
    assert.equal(colorForScopes(rules, ["string", "string.quoted"]), "#3ce8f5");
  });
});

describe("composeHexOnBackground", () => {
  it("composites 8-digit selection onto the editor background", () => {
    const composed = composeHexOnBackground("#c9a22744", "#0d1520");
    assert.notEqual(composed.toLowerCase(), "#c9a227");
    assert.match(composed, /^#[0-9a-f]{6}$/i);
  });

  it("leaves opaque hex unchanged", () => {
    assert.equal(composeHexOnBackground("#c9a227", "#0d1520").toLowerCase(), "#c9a227");
  });
});

describe("export palettes — Sentinel / Ivory / Neon / Midnight / Finance", () => {
  const sentinel = paletteFor("dusk-sentinel.json");
  const ivory = paletteFor("dusk-ivoire.json");
  const neon = paletteFor("dusk-neon.json");
  const midnight = paletteFor("dusk-minuit.json");
  const finance = paletteFor("dusk-finance.json");

  it("Sentinel keyword is rust, not operator steel", () => {
    assert.equal(sentinel.syntax.keyword.toLowerCase(), "#c89068");
    assert.notEqual(sentinel.syntax.keyword.toLowerCase(), "#5a8ab8");
    assert.notEqual(sentinel.syntax.operator.toLowerCase(), "#c89068");
  });

  it("Ivory keyword is terracotta, not operator amber", () => {
    const kw = ivory.syntax.keyword.toLowerCase();
    assert.ok(kw === "#8b1748" || kw === "#9a3f28", `Ivory keyword ${kw}`);
    assert.notEqual(kw, "#d97706");
    assert.notEqual(ivory.syntax.operator.toLowerCase(), kw);
  });

  it("Neon string is electric cyan, not regexp", () => {
    assert.equal(neon.syntax.string.toLowerCase(), "#3ce8f5");
    assert.notEqual(neon.syntax.string.toLowerCase(), "#b88898");
    assert.equal(neon.syntax.keyword.toLowerCase(), "#f04aa0");
  });

  it("Midnight keyword stays indigo", () => {
    assert.equal(midnight.syntax.keyword.toLowerCase(), "#8a78c0");
  });

  it("Finance selection is composed, not flattened gold", () => {
    const rawGold = "#c9a227";
    const expected = composeHexOnBackground("#c9a22744", finance.editor.background);
    assert.equal(finance.editor.selection.toLowerCase(), expected.toLowerCase());
    assert.notEqual(finance.editor.selection.toLowerCase(), rawGold);
    const ratio = contrastRatio(finance.editor.foreground, finance.editor.selection);
    assert.ok(
      ratio >= 4.5,
      `Finance text on selection ${ratio.toFixed(2)}:1 (need ≥ 4.5)`,
    );
  });
});

describe("JetBrains .icls color keys", () => {
  it("puts CARET_ROW_COLOR and SELECTION_FOREGROUND in <colors>", () => {
    const palette = paletteFor("dusk-finance.json");
    const icls = toJetBrainsIcls(palette);
    const colors = (icls.match(/<colors>([\s\S]*?)<\/colors>/) || [])[1] || "";
    const attrs = (icls.match(/<attributes>([\s\S]*?)<\/attributes>/) || [])[1] || "";
    assert.match(colors, /<option name="CARET_ROW_COLOR" value="[0-9A-Fa-f]+"\/>/);
    assert.match(colors, /<option name="SELECTION_FOREGROUND" value="[0-9A-Fa-f]+"\/>/);
    assert.match(colors, /<option name="SELECTION_BACKGROUND" value="[0-9A-Fa-f]+"\/>/);
    assert.doesNotMatch(attrs, /<option name="CARET_ROW_COLOR">/);
    assert.doesNotMatch(attrs, /<option name="SELECTION_FOREGROUND">/);
    const sel = (colors.match(/<option name="SELECTION_BACKGROUND" value="([0-9A-Fa-f]+)"\/>/) ||
      [])[1];
    assert.ok(sel);
    assert.notEqual(sel.toLowerCase(), "c9a227");
  });
});

describe("extractLatestChangeNotes", () => {
  it("skips empty Unreleased and uses the latest versioned section", () => {
    const html = extractLatestChangeNotes(`# Changelog

## Unreleased

## 1.5.7 — 29 August 2026

- **Fixed**: versioned item
- **Changed**: another item

## 1.5.6 — 29 August 2026

- **Fixed**: older item
`);
    assert.ok(html);
    assert.match(html, /versioned item/);
    assert.match(html, /another item/);
    assert.doesNotMatch(html, /older item/);
  });

  it("uses Unreleased when that section has list items", () => {
    const html = extractLatestChangeNotes(`# Changelog

## Unreleased

- **Fixed**: pending export fix

## 1.5.7 — 29 August 2026

- **Fixed**: already shipped
`);
    assert.ok(html);
    assert.match(html, /pending export fix/);
    assert.doesNotMatch(html, /already shipped/);
  });
});
