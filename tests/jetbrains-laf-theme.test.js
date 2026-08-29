const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { join } = require("node:path");

const { resolveTheme } = require("../lib/export/theme-resolve.mjs");
const {
  buildExportPalette,
  composeHexOnBackground,
} = require("../lib/export/theme-export-palette.mjs");
const { buildJetBrainsLafTheme } = require("../lib/export/jetbrains-laf-theme.mjs");

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

describe("buildJetBrainsLafTheme light chrome parity", () => {
  for (const file of ["dusk-light.json", "dusk-ivoire.json", "dusk-ledger.json"]) {
    it(`${file} maps menu/tab chrome from VS Code tokens (not #d1e0e8)`, () => {
      const resolved = resolveTheme(join(ROOT, "themes", file));
      const palette = buildExportPalette(resolved);
      const laf = buildJetBrainsLafTheme(palette);
      const c = laf.colors;

      assert.notEqual(c.menuFg.toLowerCase(), "#d1e0e8");
      assert.notEqual(c.tabHoverFg.toLowerCase(), "#d1e0e8");
      assert.notEqual(c.settingsFg.toLowerCase(), "#d1e0e8");
      assert.ok(contrastRatio(c.menuFg, c.popup) >= 4.5, "menu text on popup");
      assert.equal(laf.ui.Menu.foreground, "menuFg");
      assert.equal(laf.ui.EditorTabs.inactiveForeground, "tabInactiveFg");
      assert.equal(laf.ui.CompletionPopup.background, "suggestPopup");
      assert.equal(laf.ui.Settings.foreground, "settingsFg");
    });
  }
});

describe("buildJetBrainsLafTheme selection (dark + light)", () => {
  it("Finance LAF selection is composed, not flattened gold", () => {
    const resolved = resolveTheme(join(ROOT, "themes", "dusk-finance.json"));
    const palette = buildExportPalette(resolved);
    const laf = buildJetBrainsLafTheme(palette);
    const expected = composeHexOnBackground("#c9a22744", palette.editor.background);
    assert.equal(laf.colors.selection.toLowerCase(), expected.toLowerCase());
    assert.notEqual(laf.colors.selection.toLowerCase(), "#c9a227");
    assert.equal(laf.ui["*"].selectionBackground, "selection");
    assert.ok(
      contrastRatio(laf.colors.fg, laf.colors.selection) >= 4.5,
      "Finance editor text on LAF selection",
    );
  });
});
