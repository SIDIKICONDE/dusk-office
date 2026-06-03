const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");

const {
  scopeMatches,
  tokenColorForScope,
  buildThemePreviewModel,
} = require("../lib/themes/theme-data.js");
const { mergeThemeData, getThemeFileMap } = require("../lib/themes/theme-merge-data.js");

const THEMES_DIR = path.join(__dirname, "..", "themes");
const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "package.json"), "utf8"));

function stripLabel(label) {
  return label.replace(/^[◑◒◐]\s+/, "").replace(/\s*·\s*Base$/, "");
}

describe("scopeMatches", () => {
  it("matches exact and dotted-descendant scopes", () => {
    assert.equal(scopeMatches("comment", "comment"), true);
    assert.equal(scopeMatches("comment", "comment.line.double-slash"), true);
    assert.equal(scopeMatches("string", "string"), true);
  });

  it("does not match a more-specific selector against a generic target", () => {
    assert.equal(scopeMatches("string.quoted.double", "string"), false);
    assert.equal(scopeMatches("commentary", "comment"), false);
  });

  it("supports array and comma-separated selectors", () => {
    assert.equal(scopeMatches(["keyword", "storage"], "storage.type"), true);
    assert.equal(scopeMatches("keyword, storage", "keyword.control"), true);
  });
});

describe("tokenColorForScope", () => {
  const rules = [
    { scope: "comment", settings: { foreground: "#777777" } },
    { scope: "string", settings: { foreground: "#88cc88" } },
    { scope: ["keyword", "storage"], settings: { foreground: "#cc88cc" } },
    { scope: "string.quoted.double", settings: { foreground: "#99dd99" } },
  ];

  it("resolves the foreground for a scope", () => {
    assert.equal(tokenColorForScope(rules, "comment"), "#777777");
    assert.equal(tokenColorForScope(rules, "keyword"), "#cc88cc");
  });

  it("returns the last matching rule (most specific variant wins)", () => {
    assert.equal(tokenColorForScope(rules, "string.quoted.double"), "#99dd99");
    assert.equal(tokenColorForScope(rules, "string"), "#88cc88");
  });

  it("returns null when nothing matches", () => {
    assert.equal(tokenColorForScope(rules, "entity.name.function"), null);
    assert.equal(tokenColorForScope([], "comment"), null);
  });
});

describe("mergeThemeData", () => {
  it("flattens colors and tokenColors through the include chain", () => {
    const data = mergeThemeData(path.join(THEMES_DIR, "dusk-finance.json"));
    assert.equal(typeof data.colors["editor.background"], "string");
    assert.ok(data.tokenColors.length > 0, "tokenColors should be merged from base + variant");
    assert.equal(data.type, "dark", "type should resolve from the included base theme");
  });

  it("flattens a light variant that includes a light base", () => {
    const data = mergeThemeData(path.join(THEMES_DIR, "dusk-audit.json"));
    assert.equal(data.type, "light");
    assert.equal(typeof data.colors["editor.background"], "string");
  });

  it("throws on a missing include file", () => {
    const tmp = path.join(THEMES_DIR, "__tmp-bad-include.json");
    fs.writeFileSync(tmp, JSON.stringify({ include: "./does-not-exist.json", colors: {} }));
    try {
      assert.throws(() => mergeThemeData(tmp), /Missing include file/);
    } finally {
      fs.unlinkSync(tmp);
    }
  });
});

describe("buildThemePreviewModel", () => {
  it("produces a render-ready model with token colors", () => {
    const data = mergeThemeData(path.join(THEMES_DIR, "dusk-finance.json"));
    const model = buildThemePreviewModel(data);
    assert.match(model.editorBackground, /^#[0-9a-fA-F]{3,8}$/);
    assert.match(model.editorForeground, /^#[0-9a-fA-F]{3,8}$/);
    assert.equal(typeof model.tokens.keyword, "string");
    assert.equal(typeof model.tokens.string, "string");
    assert.ok(Array.isArray(model.terminalAnsi));
  });

  it("falls back to editor foreground for missing token scopes", () => {
    const model = buildThemePreviewModel({ type: "dark", colors: { "editor.background": "#101010", "editor.foreground": "#eeeeee" }, tokenColors: [] });
    assert.equal(model.tokens.comment, "#eeeeee");
    assert.equal(model.tokens.keyword, "#eeeeee");
  });
});

describe("getThemeFileMap", () => {
  it("maps every contributed variant name to an existing file", () => {
    const map = getThemeFileMap(pkg, path.join(__dirname, ".."), stripLabel);
    assert.ok(map.size >= 20, `expected many variants, got ${map.size}`);
    for (const entry of map.values()) {
      assert.ok(fs.existsSync(entry.path), `missing theme file: ${entry.path}`);
      assert.equal(typeof entry.uiTheme, "string");
    }
    assert.ok(map.has("Dusk Office Finance"), "Finance variant should be mapped without insignia");
  });
});
