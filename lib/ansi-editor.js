"use strict";

const vscode = require("vscode");

/** @typedef {{ fg?: string; bg?: string; bold?: boolean; faint?: boolean; italic?: boolean; underline?: boolean; inverse?: boolean }} AnsiStyle */

const ANSI_THEME_KEYS = [
  "Black",
  "Red",
  "Green",
  "Yellow",
  "Blue",
  "Magenta",
  "Cyan",
  "White",
];

/** @param {number} index 0–7 @param {boolean} bright */
function terminalAnsiThemeKey(index, bright) {
  const name = ANSI_THEME_KEYS[index];
  if (!name) return undefined;
  return bright ? `terminal.ansiBright${name}` : `terminal.ansi${name}`;
}

/** @returns {AnsiStyle} */
function defaultStyle() {
  return { fg: undefined, bg: undefined };
}

/** `\x1B[`, `\033[`, `\u001b[`, `\e[` in source text (not a real ESC byte). */
const LITERAL_ESC_PATTERN = /\\(?:x1[bB]|u001[bB]|033|e)\[([0-9;]*)m/g;

/** @param {number[]} args @param {AnsiStyle} style */
function applySgrCodes(args, style) {
  for (let i = 0; i < args.length; i += 1) {
    const code = args[i];
    switch (code) {
      case 0:
        Object.assign(style, defaultStyle());
        break;
      case 1:
        style.bold = true;
        style.faint = false;
        break;
      case 2:
        style.faint = true;
        style.bold = false;
        break;
      case 3:
        style.italic = true;
        break;
      case 4:
        style.underline = true;
        break;
      case 7:
        style.inverse = true;
        break;
      case 22:
        style.bold = false;
        style.faint = false;
        break;
      case 23:
        style.italic = false;
        break;
      case 24:
        style.underline = false;
        break;
      case 27:
        style.inverse = false;
        break;
      case 30:
      case 31:
      case 32:
      case 33:
      case 34:
      case 35:
      case 36:
      case 37:
        style.fg = terminalAnsiThemeKey(code - 30, false);
        break;
      case 39:
        style.fg = undefined;
        break;
      case 40:
      case 41:
      case 42:
      case 43:
      case 44:
      case 45:
      case 46:
      case 47:
        style.bg = terminalAnsiThemeKey(code - 40, false);
        break;
      case 49:
        style.bg = undefined;
        break;
      case 90:
      case 91:
      case 92:
      case 93:
      case 94:
      case 95:
      case 96:
      case 97:
        style.fg = terminalAnsiThemeKey(code - 90, true);
        break;
      case 100:
      case 101:
      case 102:
      case 103:
      case 104:
      case 105:
      case 106:
      case 107:
        style.bg = terminalAnsiThemeKey(code - 100, true);
        break;
      case 38: {
        const mode = args[i + 1];
        if (mode === 2 && i + 4 < args.length) {
          const r = args[i + 2];
          const g = args[i + 3];
          const b = args[i + 4];
          style.fg = `#${[r, g, b].map((n) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, "0")).join("")}`;
          i += 4;
        } else if (mode === 5 && i + 2 < args.length) {
          const palette = args[i + 2];
          if (palette >= 0 && palette <= 7) style.fg = terminalAnsiThemeKey(palette, false);
          else if (palette >= 8 && palette <= 15) style.fg = terminalAnsiThemeKey(palette - 8, true);
          i += 2;
        }
        break;
      }
      case 48: {
        const mode = args[i + 1];
        if (mode === 2 && i + 4 < args.length) {
          const r = args[i + 2];
          const g = args[i + 3];
          const b = args[i + 4];
          style.bg = `#${[r, g, b].map((n) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, "0")).join("")}`;
          i += 4;
        }
        break;
      }
      default:
        break;
    }
  }
}

/** @param {string} text */
function textHasAnsiContent(text) {
  if (text.includes("\x1b")) return true;
  LITERAL_ESC_PATTERN.lastIndex = 0;
  return LITERAL_ESC_PATTERN.test(text);
}

/** @returns {number} `0` = no limit. */
function getEditorAnsiMaxLineCount() {
  const max = vscode.workspace.getConfiguration("duskOffice").get("editorAnsi.maxLineCount", 12000);
  return typeof max === "number" && max > 0 ? max : Infinity;
}

/** @returns {number} `0` = no limit. */
function getEditorAnsiMaxLineLength() {
  const max = vscode.workspace.getConfiguration("duskOffice").get("editorAnsi.maxLineLength", 32768);
  return typeof max === "number" && max > 0 ? max : Infinity;
}

/** @param {vscode.TextDocument} doc */
function getEditorAnsiLineScanLimit(doc) {
  return Math.min(doc.lineCount, getEditorAnsiMaxLineCount());
}

/** @param {vscode.TextDocument} doc */
function documentHasAnsi(doc) {
  const maxLen = getEditorAnsiMaxLineLength();
  const lines = getEditorAnsiLineScanLimit(doc);
  for (let i = 0; i < lines; i += 1) {
    const text = doc.lineAt(i).text;
    if (text.length <= maxLen && textHasAnsiContent(text)) return true;
  }
  return false;
}

/**
 * Colorize `\x1B[31m`-style literals in source (Dart, JS, Python, Rust, etc.).
 * @param {string} text
 * @returns {Array<{ offset: number; length: number; style: AnsiStyle; isEscape: boolean }>}
 */
function parseLineLiterals(text) {
  /** @type {Array<{ offset: number; length: number; style: AnsiStyle; isEscape: boolean }>} */
  const spans = [];
  const style = defaultStyle();
  const re = new RegExp(LITERAL_ESC_PATTERN.source, LITERAL_ESC_PATTERN.flags);
  let match;
  while ((match = re.exec(text)) !== null) {
    const args = match[1].length ? match[1].split(";").map((a) => parseInt(a, 10)) : [0];
    applySgrCodes(args, style);
    spans.push({
      offset: match.index,
      length: match[0].length,
      style: { ...style },
      isEscape: false,
    });
  }
  return spans;
}

class AnsiLineParser {
  constructor() {
    /** @type {AnsiStyle} */
    this.carry = defaultStyle();
  }

  /**
   * @param {string} text
   * @returns {Array<{ offset: number; length: number; style: AnsiStyle; isEscape: boolean }>}
   */
  parseLine(text) {
    /** @type {AnsiStyle} */
    const style = { ...this.carry };
    /** @type {Array<{ offset: number; length: number; style: AnsiStyle; isEscape: boolean }>} */
    const spans = [];
    let textOffset = 0;
    let index = 0;

    while (index < text.length) {
      if (text.charCodeAt(index) !== 0x1b) {
        let esc = text.indexOf("\x1b", index);
        if (esc === -1) esc = text.length;
        if (esc > textOffset) {
          spans.push({ offset: textOffset, length: esc - textOffset, style: { ...style }, isEscape: false });
        }
        textOffset = esc;
        index = esc;
        continue;
      }

      if (index >= text.length - 1 || text[index + 1] !== "[") {
        index += 1;
        continue;
      }

      const rest = text.slice(index + 2);
      const match = /^([0-9;]*)([a-zA-Z])/.exec(rest);
      if (!match) {
        index += 1;
        continue;
      }

      const argString = match[1];
      const command = match[2];
      const seqLen = 2 + argString.length + 1;

      spans.push({
        offset: index,
        length: seqLen,
        style: { ...style },
        isEscape: true,
      });

      if (command === "m") {
        const args = argString.length
          ? argString.split(";").map((a) => parseInt(a, 10))
          : [0];
        this.applyCodes(args, style);
      }

      textOffset = index + seqLen;
      index = textOffset;
    }

    if (textOffset < text.length) {
      spans.push({
        offset: textOffset,
        length: text.length - textOffset,
        style: { ...style },
        isEscape: false,
      });
    }

    this.carry = { ...style };
    return spans;
  }

  /** @param {number[]} args @param {AnsiStyle} style */
  applyCodes(args, style) {
    applySgrCodes(args, style);
  }
}

/** @param {AnsiStyle} style */
function styleCacheKey(style) {
  return JSON.stringify(style);
}

/** @param {AnsiStyle} style */
function createDecorationType(style) {
  const inverse = Boolean(style.inverse);
  const fgKey = inverse ? style.bg : style.fg;
  const bgKey = inverse ? style.fg : style.bg;

  /** @type {vscode.DecorationRenderOptions} */
  const opts = {};
  if (fgKey) {
    opts.color = fgKey.startsWith("#") ? fgKey : new vscode.ThemeColor(fgKey);
  }
  if (bgKey) {
    opts.backgroundColor = bgKey.startsWith("#") ? bgKey : new vscode.ThemeColor(bgKey);
  }
  if (style.bold) opts.fontWeight = "bold";
  if (style.italic) opts.fontStyle = "italic";
  if (style.underline) opts.textDecoration = "underline";
  if (style.faint) opts.opacity = "0.65";

  return vscode.window.createTextEditorDecorationType(opts);
}

/** @param {vscode.TextDocument} doc */
function shouldColorizeDocument(doc) {
  if (doc.isClosed) return false;
  const scheme = doc.uri.scheme;
  if (scheme !== "file" && scheme !== "untitled") return false;

  const cfg = vscode.workspace.getConfiguration("duskOffice");
  if (!cfg.get("editorAnsi.enabled", true)) return false;
  if (!documentHasAnsi(doc)) return false;

  if (cfg.get("editorAnsi.allLanguages", true)) return true;

  const id = doc.languageId;
  const extra = cfg.get("editorAnsi.languageIds", ["log", "ansi"]);
  if (Array.isArray(extra) && extra.includes(id)) return true;
  if (id === "plaintext" && /\.log$/i.test(doc.uri.fsPath)) return true;
  return false;
}

class AnsiEditorSupport {
  constructor() {
    /** @type {Map<string, vscode.TextEditorDecorationType>} */
    this.types = new Map();
    this.escapeType = vscode.window.createTextEditorDecorationType({ opacity: "0.35" });
    /** @type {ReturnType<typeof setTimeout> | undefined} */
    this.timer = undefined;
  }

  dispose() {
    for (const t of this.types.values()) t.dispose();
    this.types.clear();
    this.escapeType.dispose();
    if (this.timer) clearTimeout(this.timer);
  }

  /** @param {vscode.TextEditor} editor */
  scheduleRefresh(editor) {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.timer = undefined;
      void this.refresh(editor);
    }, 50);
  }

  /** @param {vscode.TextEditor} editor */
  async refresh(editor) {
    const doc = editor.document;
    if (!shouldColorizeDocument(doc)) {
      editor.setDecorations(this.escapeType, []);
      for (const type of this.types.values()) editor.setDecorations(type, []);
      return;
    }

    const parser = new AnsiLineParser();
    /** @type {Map<string, vscode.Range[]>} */
    const buckets = new Map();
    const escapeRanges = [];
    const dimEscapes = vscode.workspace
      .getConfiguration("duskOffice")
      .get("editorAnsi.dimEscapeSequences", true);
    const lineLimit = getEditorAnsiLineScanLimit(doc);
    const maxLineLen = getEditorAnsiMaxLineLength();

    for (let line = 0; line < lineLimit; line += 1) {
      const text = doc.lineAt(line).text;
      if (text.length > maxLineLen) continue;
      const spans = text.includes("\x1b")
        ? parser.parseLine(text)
        : parseLineLiterals(text);
      if (!spans.length) continue;

      for (const span of spans) {
        const range = new vscode.Range(line, span.offset, line, span.offset + span.length);
        if (span.isEscape) {
          if (dimEscapes) escapeRanges.push(range);
          continue;
        }
        const key = styleCacheKey(span.style);
        if (!buckets.has(key)) buckets.set(key, []);
        buckets.get(key).push(range);
      }
    }

    const usedKeys = new Set();
    for (const [key, ranges] of buckets) {
      usedKeys.add(key);
      let type = this.types.get(key);
      if (!type) {
        type = createDecorationType(JSON.parse(key));
        this.types.set(key, type);
      }
      editor.setDecorations(type, ranges);
    }

    for (const [key, type] of this.types) {
      if (!usedKeys.has(key)) editor.setDecorations(type, []);
    }

    editor.setDecorations(this.escapeType, dimEscapes ? escapeRanges : []);
  }

  onThemeChange() {
    for (const t of this.types.values()) t.dispose();
    this.types.clear();
    for (const editor of vscode.window.visibleTextEditors) {
      void this.refresh(editor);
    }
  }
}

/** @param {vscode.ExtensionContext} context */
function activateAnsiEditor(context) {
  const support = new AnsiEditorSupport();

  const refreshVisible = () => {
    for (const editor of vscode.window.visibleTextEditors) {
      support.scheduleRefresh(editor);
    }
  };

  context.subscriptions.push(
    support,
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor) support.scheduleRefresh(editor);
    }),
    vscode.workspace.onDidChangeTextDocument((e) => {
      const editor = vscode.window.activeTextEditor;
      if (editor && e.document === editor.document) support.scheduleRefresh(editor);
    }),
    vscode.workspace.onDidOpenTextDocument(() => refreshVisible()),
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("duskOffice.editorAnsi")) refreshVisible();
      if (e.affectsConfiguration("workbench.colorTheme")) support.onThemeChange();
    }),
  );

  refreshVisible();
  return support;
}

module.exports = {
  activateAnsiEditor,
  shouldColorizeDocument,
  documentHasAnsi,
  AnsiLineParser,
  parseLineLiterals,
  textHasAnsiContent,
  getEditorAnsiMaxLineCount,
  getEditorAnsiMaxLineLength,
  getEditorAnsiLineScanLimit,
};
