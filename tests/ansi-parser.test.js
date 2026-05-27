const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const {
  AnsiLineParser,
  parseLineLiterals,
  textHasAnsiContent,
} = require("../lib/ansi/ansi-editor.js");

// ---------------------------------------------------------------------------
// textHasAnsiContent
// ---------------------------------------------------------------------------
describe("textHasAnsiContent", () => {
  it("detects real ESC byte", () => {
    assert.equal(textHasAnsiContent("\x1b[31mhello\x1b[0m"), true);
  });

  it("detects literal \\x1B[ in source", () => {
    assert.equal(textHasAnsiContent('print("\\x1B[31mred\\x1B[0m")'), true);
  });

  it("detects literal \\033[ in source", () => {
    assert.equal(textHasAnsiContent('echo "\\033[32mgreen\\033[0m"'), true);
  });

  it("detects literal \\e[ in source", () => {
    assert.equal(textHasAnsiContent('echo "\\e[33myellow\\e[0m"'), true);
  });

  it("returns false for plain text", () => {
    assert.equal(textHasAnsiContent("hello world"), false);
  });
});

// ---------------------------------------------------------------------------
// parseLineLiterals — source-level escape sequences
// ---------------------------------------------------------------------------
describe("parseLineLiterals", () => {
  it("parses \\x1B[31m as a red foreground span", () => {
    const spans = parseLineLiterals('print("\\x1B[31mred\\x1B[0m")');
    assert.ok(spans.length >= 1);
    const redSpan = spans.find((s) => s.style.fg === "terminal.ansiRed");
    assert.ok(redSpan, "expected a span with terminal.ansiRed fg");
  });

  it("parses bold \\x1B[1m", () => {
    const spans = parseLineLiterals('log("\\x1B[1mbold\\x1B[0m")');
    const boldSpan = spans.find((s) => s.style.bold === true);
    assert.ok(boldSpan, "expected a bold span");
  });

  it("returns empty for text without ANSI literals", () => {
    const spans = parseLineLiterals("just plain text");
    assert.equal(spans.length, 0);
  });
});

// ---------------------------------------------------------------------------
// AnsiLineParser — real ESC byte sequences
// ---------------------------------------------------------------------------
describe("AnsiLineParser", () => {
  it("parses a line with real ESC codes", () => {
    const parser = new AnsiLineParser();
    const spans = parser.parseLine("\x1b[31mred text\x1b[0m normal");
    assert.ok(spans.length >= 2);

    const textSpans = spans.filter((s) => !s.isEscape);
    const redText = textSpans.find((s) => s.style.fg === "terminal.ansiRed");
    assert.ok(redText, "expected red text span");
  });

  it("carries style across lines", () => {
    const parser = new AnsiLineParser();
    parser.parseLine("\x1b[32m");
    const spans = parser.parseLine("still green");
    const textSpans = spans.filter((s) => !s.isEscape);
    assert.ok(textSpans.length > 0);
    assert.equal(textSpans[0].style.fg, "terminal.ansiGreen");
  });

  it("handles reset", () => {
    const parser = new AnsiLineParser();
    parser.parseLine("\x1b[31m");
    parser.parseLine("\x1b[0m");
    const spans = parser.parseLine("normal");
    const textSpans = spans.filter((s) => !s.isEscape);
    assert.ok(textSpans.length > 0);
    assert.equal(textSpans[0].style.fg, undefined);
  });

  it("marks escape sequences with isEscape=true", () => {
    const parser = new AnsiLineParser();
    const spans = parser.parseLine("\x1b[1;31mhello\x1b[0m");
    const escapes = spans.filter((s) => s.isEscape);
    assert.ok(escapes.length >= 1);
  });

  it("handles bright foreground codes (90–97)", () => {
    const parser = new AnsiLineParser();
    const spans = parser.parseLine("\x1b[91mbright red\x1b[0m");
    const textSpans = spans.filter((s) => !s.isEscape);
    const bright = textSpans.find((s) => s.style.fg === "terminal.ansiBrightRed");
    assert.ok(bright, "expected bright red fg");
  });

  it("handles background codes (40–47)", () => {
    const parser = new AnsiLineParser();
    const spans = parser.parseLine("\x1b[44mblue bg\x1b[0m");
    const textSpans = spans.filter((s) => !s.isEscape);
    const bg = textSpans.find((s) => s.style.bg === "terminal.ansiBlue");
    assert.ok(bg, "expected blue background");
  });

  it("handles inverse (SGR 7)", () => {
    const parser = new AnsiLineParser();
    const spans = parser.parseLine("\x1b[7minverse\x1b[0m");
    const textSpans = spans.filter((s) => !s.isEscape);
    const inv = textSpans.find((s) => s.style.inverse === true);
    assert.ok(inv, "expected inverse style");
  });
});
