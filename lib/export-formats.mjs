/**
 * Génère des artefacts de thème pour Neovim, Emacs, Base16, Zed, Helix, JetBrains, VS Code résolu.
 */
import {
  mapWorkbenchToZedStyle,
  softenHexTowardBg,
  uiGet,
} from "./theme-export-ui.mjs";

/**
 * @param {import('./theme-export-palette.mjs').ExportPalette} p
 * @param {{ tokenColors?: unknown[]; semanticTokenColors?: Record<string, unknown> }} [resolved]
 */
export function toVscodeResolvedJson(p, resolved = {}) {
  return (
    JSON.stringify(
      {
        $schema: "vscode://schemas/color-theme",
        name: p.name,
        type: p.type,
        semanticHighlighting: true,
        colors: p.workbench,
        tokenColors: resolved.tokenColors ?? [],
        ...(Object.keys(resolved.semanticTokenColors ?? {}).length > 0
          ? { semanticTokenColors: resolved.semanticTokenColors }
          : {}),
      },
      null,
      2,
    ) + "\n"
  );
}

/**
 * @param {import('./theme-export-palette.mjs').ExportPalette} p
 */
export function toPaletteJson(p) {
  return JSON.stringify(p, null, 2) + "\n";
}

/**
 * @param {import('./theme-export-palette.mjs').ExportPalette} p
 */
export function toBase16Yaml(p) {
  const { editor, terminal, syntax, type } = p;
  const base00 = editor.background;
  const base05 = editor.foreground;
  const base03 = syntax.comment ?? base05;
  const base08 = syntax.error ?? terminal.ansi.red ?? "#c97565";
  const base09 = syntax.number ?? terminal.ansi.yellow ?? base05;
  const base0A = syntax.type ?? terminal.ansi.yellow ?? base05;
  const base0B = syntax.string ?? terminal.ansi.green ?? base05;
  const base0C = syntax.operator ?? terminal.ansi.cyan ?? base05;
  const base0D = syntax.function ?? terminal.ansi.blue ?? base05;
  const base0E = syntax.keyword ?? terminal.ansi.magenta ?? base05;
  const base0F = syntax.constant ?? terminal.ansi.magenta ?? base05;

  return `# ${p.name} — exported from Dusk Office (VS Code theme pack)
# Install: base16-manager, tinted-theming, or compatible tooling
${p.slug}:
  scheme: "${p.name}"
  author: "dekidev (Dusk Office)"
  base00: "${stripHash(base00)}"
  base01: "${stripHash(p.ui.sidebar ?? p.ui.panel ?? base00)}"
  base02: "${stripHash(p.ui.activityBar ?? p.ui.border ?? base00)}"
  base03: "${stripHash(base03)}"
  base04: "${stripHash(base05)}"
  base05: "${stripHash(base05)}"
  base06: "${stripHash(base05)}"
  base07: "${stripHash(terminal.ansi.brightWhite ?? base05)}"
  base08: "${stripHash(base08)}"
  base09: "${stripHash(base09)}"
  base0A: "${stripHash(base0A)}"
  base0B: "${stripHash(base0B)}"
  base0C: "${stripHash(base0C)}"
  base0D: "${stripHash(base0D)}"
  base0E: "${stripHash(base0E)}"
  base0F: "${stripHash(base0F)}"
  type: ${type}
`;
}

/**
 * @param {import('./theme-export-palette.mjs').ExportPalette} p
 */
export function toNeovimLua(p) {
  const nvimName = p.slug.replace(/-/g, "_");
  const { editor, syntax, terminal, type, workbenchUi } = p;
  const u = workbenchUi;
  const bg = type === "light" ? "light" : "dark";
  const q = (v) => (v.startsWith("c.") ? v : `"${v}"`);
  const hi = (group, fg, bgc, opts = "") =>
    `  hi ${group} guifg=${q(fg)} guibg=${q(bgc)}${opts ? ` gui=${opts}` : ""}`;
  const sidebar = uiGet(u, "sideBar.background", p.ui.sidebar ?? editor.background);
  const activity = uiGet(u, "activityBar.background", p.ui.activityBar ?? editor.background);
  const panel = uiGet(u, "panel.background", p.ui.panel ?? editor.background);
  const status = uiGet(u, "statusBar.background", p.ui.statusBar ?? editor.background);
  const tabActive = uiGet(u, "tab.activeBackground", p.ui.tabActive ?? editor.background);
  const tabInactive = uiGet(u, "tab.inactiveBackground", p.ui.tabInactive ?? activity);
  const tabFg = uiGet(u, "tab.activeForeground", editor.foreground);
  const tabFgDim = uiGet(u, "tab.inactiveForeground", syntax.comment);
  const border = uiGet(u, "sideBar.border", p.ui.border ?? syntax.comment);
  const added = uiGet(u, "editorGutter.addedBackground", syntax.string);
  const modified = uiGet(u, "editorGutter.modifiedBackground", syntax.type);
  const deleted = uiGet(u, "editorGutter.deletedBackground", syntax.error);
  const pmenu = uiGet(u, "editorSuggestWidget.background", panel);
  const pmenuSel = uiGet(u, "editorSuggestWidget.selectedBackground", tabActive);

  const lines = [
    `-- ${p.name} — generated from Dusk Office (workbench UI + editor + terminal)`,
    `-- Copy to: ~/.config/nvim/colors/${nvimName}.lua`,
    `-- Then: colorscheme ${nvimName}`,
    "",
    `vim.cmd("highlight clear")`,
    `if vim.fn.exists("syntax_on") then vim.cmd("syntax reset") end`,
    `vim.o.background = "${bg}"`,
    `vim.o.termguicolors = true`,
    "",
    `local c = {`,
    `  bg = "${editor.background}",`,
    `  fg = "${editor.foreground}",`,
    `  sidebar = "${sidebar}",`,
    `  activity = "${activity}",`,
    `  panel = "${panel}",`,
    `  status = "${status}",`,
    `  tab_active = "${tabActive}",`,
    `  tab_inactive = "${tabInactive}",`,
    `  border = "${border}",`,
    `  comment = "${syntax.comment}",`,
    `  string = "${syntax.string}",`,
    `  keyword = "${syntax.keyword}",`,
    `  func = "${syntax.function}",`,
    `  type = "${syntax.type}",`,
    `  var = "${syntax.variable}",`,
    `  const = "${syntax.constant}",`,
    `  op = "${syntax.operator}",`,
    `  err = "${syntax.error}",`,
    `  git_add = "${added}",`,
    `  git_mod = "${modified}",`,
    `  git_del = "${deleted}",`,
    `}`,
    "",
    hi("Normal", "c.fg", "c.bg"),
    hi("Comment", "c.comment", "c.bg", "italic"),
    hi("Constant", "c.const", "c.bg"),
    hi("String", "c.string", "c.bg"),
    hi("Character", "c.string", "c.bg"),
    hi("Number", "c.const", "c.bg"),
    hi("Boolean", "c.const", "c.bg"),
    hi("Float", "c.const", "c.bg"),
    hi("Identifier", "c.var", "c.bg"),
    hi("Function", "c.func", "c.bg"),
    hi("Statement", "c.keyword", "c.bg"),
    hi("Keyword", "c.keyword", "c.bg"),
    hi("Conditional", "c.keyword", "c.bg"),
    hi("Repeat", "c.keyword", "c.bg"),
    hi("Label", "c.keyword", "c.bg"),
    hi("Operator", "c.op", "c.bg"),
    hi("Type", "c.type", "c.bg"),
    hi("Structure", "c.type", "c.bg"),
    hi("Typedef", "c.type", "c.bg"),
    hi("Special", "c.func", "c.bg"),
    hi("SpecialComment", "c.comment", "c.bg", "italic"),
    hi("Underlined", "c.func", "c.bg", "underline"),
    hi("Error", "c.err", "c.bg"),
    hi("Cursor", "c.fg", "c.bg"),
    hi("CursorLine", "c.fg", editor.lineHighlight ?? "c.bg"),
    hi("CursorLineNr", "c.func", "c.bg", "bold"),
    hi("LineNr", "c.comment", "c.bg"),
    hi("Visual", editor.foreground, editor.selection ?? "c.bg"),
    hi("Search", "c.fg", syntax.string),
    hi("IncSearch", "c.bg", "c.func"),
    hi("StatusLine", "c.fg", "c.status"),
    hi("StatusLineNC", "c.comment", "c.status"),
    hi("TabLine", tabFgDim, "c.tab_inactive"),
    hi("TabLineFill", "c.fg", "c.activity"),
    hi("TabLineSel", tabFg, "c.tab_active"),
    hi("WinSeparator", "c.border", "c.bg"),
    hi("VertSplit", "c.border", "c.bg"),
    hi("NormalFloat", "c.fg", "c.panel"),
    hi("FloatBorder", "c.border", "c.panel"),
    hi("Pmenu", "c.fg", pmenu),
    hi("PmenuSel", "c.bg", pmenuSel),
    hi("PmenuSbar", "c.border", pmenu),
    hi("PmenuThumb", "c.func", pmenu),
    hi("Directory", "c.func", "c.bg"),
    hi("Title", "c.type", "c.bg", "bold"),
    hi("MsgArea", "c.fg", "c.status"),
    hi("SignColumn", "c.comment", "c.bg"),
    hi("CursorColumn", "c.fg", editor.lineHighlight ?? "c.bg"),
    hi("ColorColumn", "c.fg", editor.lineHighlight ?? "c.bg"),
    hi("Folded", "c.comment", "c.panel"),
    hi("FoldColumn", "c.comment", "c.bg"),
    hi("MatchParen", "c.bg", "c.func"),
    hi("DiffAdd", "c.git_add", "c.bg"),
    hi("DiffChange", "c.git_mod", "c.bg"),
    hi("DiffDelete", "c.git_del", "c.bg"),
    hi("DiffText", "c.fg", "c.git_mod"),
    hi("DiagnosticError", "c.err", "c.bg"),
    hi("DiagnosticWarn", "c.type", "c.bg"),
    hi("DiagnosticInfo", "c.func", "c.bg"),
    hi("DiagnosticHint", "c.comment", "c.bg"),
    "",
    "-- Plugins (sidebar / tree — même palette que VS Code sideBar)",
    `hi NeoTreeNormal guifg=${q("c.fg")} guibg=${q("c.sidebar")}`,
    `hi NeoTreeEndBatch guibg=${q("c.sidebar")}`,
    `hi NvimTreeNormal guifg=${q("c.fg")} guibg=${q("c.sidebar")}`,
    `hi NvimTreeWinSeparator guifg=${q("c.border")} guibg=${q("c.sidebar")}`,
    "",
    "-- Terminal (16 couleurs)",
  ];

  const ansiOrder = [
    "black",
    "red",
    "green",
    "yellow",
    "blue",
    "magenta",
    "cyan",
    "white",
    "brightBlack",
    "brightRed",
    "brightGreen",
    "brightYellow",
    "brightBlue",
    "brightMagenta",
    "brightCyan",
    "brightWhite",
  ];
  for (let i = 0; i < ansiOrder.length; i++) {
    const col = terminal.ansi[ansiOrder[i]];
    if (col) lines.push(`vim.g.terminal_color_${i} = "${col}"`);
  }

  lines.push("", `vim.g.colors_name = "${nvimName}"`);
  return lines.join("\n") + "\n";
}

/**
 * @param {import('./theme-export-palette.mjs').ExportPalette} p
 */
export function toEmacsEl(p) {
  const sym = p.slug.replace(/-/g, "_");
  const { editor, syntax, workbenchUi } = p;
  const u = workbenchUi;
  const sidebar = uiGet(u, "sideBar.background", p.ui.sidebar ?? editor.background);
  const panel = uiGet(u, "panel.background", p.ui.panel ?? editor.background);
  const status = uiGet(u, "statusBar.background", p.ui.statusBar ?? editor.background);
  const tabLine = uiGet(u, "tab.inactiveBackground", p.ui.tabInactive ?? panel);
  const header = uiGet(u, "titleBar.activeBackground", p.ui.titleBar ?? status);
  const border = uiGet(u, "sideBar.border", p.ui.border ?? syntax.comment);
  const sel = uiGet(u, "list.activeSelectionBackground", editor.selection ?? editor.background);
  const diffAdd = uiGet(u, "diffEditor.insertedLineBackground", syntax.string);
  const diffRem = uiGet(u, "diffEditor.removedLineBackground", syntax.error);
  return `;;; ${p.name}.el — generated from Dusk Office (workbench UI)
;;; Install: copy to ~/.emacs.d/themes/ and (load-theme '${sym} t)

(deftheme ${sym}
  "${p.name} (exported from Dusk Office)"
  :type '${p.type === "light" ? "light" : "dark"}
  :background-mode '${p.type === "light" ? "light" : "dark"})

(theme-set-faces
 '${sym}
 '(default ((t :foreground "${editor.foreground}" :background "${editor.background}")))
 '(font-lock-comment-face ((t :foreground "${syntax.comment}" :slant italic)))
 '(font-lock-string-face ((t :foreground "${syntax.string}")))
 '(font-lock-keyword-face ((t :foreground "${syntax.keyword}")))
 '(font-lock-function-name-face ((t :foreground "${syntax.function}")))
 '(font-lock-type-face ((t :foreground "${syntax.type}")))
 '(font-lock-variable-name-face ((t :foreground "${syntax.variable}")))
 '(font-lock-constant-face ((t :foreground "${syntax.constant}")))
 '(font-lock-builtin-face ((t :foreground "${syntax.function}")))
 '(font-lock-preprocessor-face ((t :foreground "${syntax.keyword}")))
 '(error ((t :foreground "${syntax.error}")))
 '(line-number ((t :foreground "${syntax.comment}")))
 '(line-number-current-line ((t :foreground "${syntax.function}" :weight bold)))
 '(hl-line ((t :background "${editor.lineHighlight ?? editor.background}")))
 '(fringe ((t :background "${editor.background}")))
 '(header-line ((t :foreground "${editor.foreground}" :background "${header}")))
 '(mode-line ((t :foreground "${editor.foreground}" :background "${status}")))
 '(mode-line-inactive ((t :foreground "${syntax.comment}" :background "${status}")))
 '(vertical-border ((t :foreground "${border}")))
 '(minibuffer-prompt ((t :foreground "${syntax.function}")))
 '(completions-common-part ((t :foreground "${syntax.comment}")))
 '(completions-annotations ((t :foreground "${syntax.type}")))
 '(region ((t :background "${sel}")))
 '(secondary-selection ((t :background "${sel}")))
 '(match ((t :background "${tabLine}")))
 '(show-paren-match ((t :background "${syntax.function}")))
 '(shadow ((t :background "${panel}")))
 '(tooltip ((t :foreground "${editor.foreground}" :background "${panel}")))
 '(cursor ((t :background "${editor.cursor ?? editor.foreground}")))
 '(diff-added ((t :background "${diffAdd}")))
 '(diff-removed ((t :background "${diffRem}"))))

(provide-theme '${sym})
`;
}

/**
 * @param {import('./theme-export-palette.mjs').ExportPalette} p
 */
export function toZedJson(p) {
  const { editor, syntax, terminal, type, workbench } = p;
  const appearance = type === "light" ? "light" : "dark";
  const zedStyle = mapWorkbenchToZedStyle(workbench);

  const syntaxBlock = {
    comment: { color: syntax.comment, font_style: "italic" },
    string: { color: syntax.string },
    keyword: { color: syntax.keyword },
    function: { color: syntax.function },
    type: { color: syntax.type },
    variable: { color: syntax.variable },
    constant: { color: syntax.constant },
    number: { color: syntax.number ?? syntax.constant },
    operator: { color: syntax.operator },
    tag: { color: syntax.tag },
    attribute: { color: syntax.attribute },
    property: { color: syntax.property },
    punctuation: { color: syntax.punctuation },
    boolean: { color: syntax.boolean ?? syntax.constant },
    enum: { color: syntax.type },
    interface: { color: syntax.type },
    struct: { color: syntax.type },
    class: { color: syntax.type },
    enumMember: { color: syntax.constant },
    decorator: { color: syntax.attribute },
  };

  const style = {
    ...zedStyle,
    background: zedStyle.background ?? editor.background,
    text: zedStyle.text ?? editor.foreground,
    accent: zedStyle.accent ?? p.ui.accent ?? syntax.function,
    "editor.background": zedStyle["editor.background"] ?? editor.background,
    "editor.foreground": zedStyle["editor.foreground"] ?? editor.foreground,
    "editor.gutter.background":
      zedStyle["editor.gutter.background"] ??
      workbench["editorGutter.background"] ??
      editor.background,
    "editor.active_line.background":
      zedStyle["editor.active_line.background"] ?? editor.lineHighlight,
    "editor.line_number":
      zedStyle["editor.line_number"] ??
      workbench["editorLineNumber.foreground"] ??
      syntax.comment,
    "editor.active_line_number":
      zedStyle["editor.active_line_number"] ??
      workbench["editorLineNumber.activeForeground"] ??
      syntax.function,
    "terminal.background":
      zedStyle["terminal.background"] ?? terminal.background,
    "terminal.foreground":
      zedStyle["terminal.foreground"] ?? terminal.foreground,
    syntax: syntaxBlock,
  };

  return (
    JSON.stringify(
      {
        $schema: "https://zed.dev/schema/themes/v0.2.0.json",
        name: "Dusk Office",
        author: "dekidev",
        themes: [
          {
            name: p.name,
            appearance,
            style,
          },
        ],
      },
      null,
      2,
    ) + "\n"
  );
}

/**
 * @param {import('./theme-export-palette.mjs').ExportPalette} p
 */
export function toHelixToml(p) {
  const { editor, syntax, terminal, workbenchUi } = p;
  const u = workbenchUi;
  const ansi = terminal.ansi;
  const sidebar = uiGet(u, "sideBar.background", p.ui.sidebar ?? editor.background);
  const activity = uiGet(u, "activityBar.background", p.ui.activityBar ?? editor.background);
  const panel = uiGet(u, "panel.background", p.ui.panel ?? editor.background);
  const status = uiGet(u, "statusBar.background", p.ui.statusBar ?? editor.background);
  const tabActive = uiGet(u, "tab.activeBackground", p.ui.tabActive ?? editor.background);
  const tabInactive = uiGet(u, "tab.inactiveBackground", p.ui.tabInactive ?? activity);
  const title = uiGet(u, "titleBar.activeBackground", p.ui.titleBar ?? status);
  const border = uiGet(u, "sideBar.border", p.ui.border ?? syntax.comment);
  const sel = uiGet(u, "list.activeSelectionBackground", editor.selection ?? editor.background);
  const hover = uiGet(u, "list.hoverBackground", tabActive);
  const menu = uiGet(u, "menu.background", panel);
  const menuSel = uiGet(u, "menu.selectionBackground", sel);
  const inputBg = uiGet(u, "input.background", panel);
  const buttonBg = uiGet(u, "button.background", syntax.function);
  const added = uiGet(u, "gitDecoration.addedResourceForeground", syntax.string);
  const modified = uiGet(u, "gitDecoration.modifiedResourceForeground", syntax.type);
  const deleted = uiGet(u, "gitDecoration.deletedResourceForeground", syntax.error);
  return `# ${p.name} — generated from Dusk Office (workbench UI)
# Install: copy to themes/ in Helix config, add "theme = \\"${p.name}\\""

[theme]
name = "${p.name}"
inherit = "dark_plus"
"ui.background" = "${editor.background}"
"ui.text" = "${editor.foreground}"
"ui.selection.background" = "${sel}"
"ui.selection.inactive_background" = "${hover}"
"ui.cursor" = "${editor.cursor ?? editor.foreground}"
"ui.cursor.match" = "${syntax.function}"
"ui.line-number" = "${syntax.comment}"
"ui.line-number-active" = "${syntax.function}"
"ui.statusline" = "${status}"
"ui.statusline.inactive" = "${status}"
"ui.statusline.normal" = "${status}"
"ui.statusline.insert" = "${status}"
"ui.statusline.select" = "${status}"
"ui.statusline.separator" = "${border}"
"ui.bufferline" = "${tabInactive}"
"ui.bufferline.active" = "${tabActive}"
"ui.bufferline.background" = "${activity}"
"ui.popup" = "${menu}"
"ui.popup.info" = "${syntax.function}"
"ui.popup.warning" = "${syntax.type}"
"ui.popup.critical" = "${syntax.error}"
"ui.window" = "${border}"
"ui.help" = "${panel}"
"ui.highlight" = "${sel}"
"ui.highlight.frameline" = "${border}"
"ui.menu" = "${menu}"
"ui.menu.selected" = "${menuSel}"
"ui.virtual.ruler" = "${border}"
"ui.virtual.inlay-hint" = "${syntax.comment}"
"ui.virtual.jump-label" = "${syntax.function}"
"ui.virtual.indent-guide" = "${border}"
"ui.virtual.indent-guide.inactive" = "${border}"
"ui.debug.active_line" = "${editor.lineHighlight ?? editor.background}"
"ui.gutter" = "${uiGet(u, "editorGutter.background", editor.background)}"
"ui.gutter.selected" = "${sel}"
"ui.text.focus" = "${editor.foreground}"
"ui.text.inactive" = "${syntax.comment}"
"ui.text.info" = "${syntax.function}"
"ui.text.warning" = "${syntax.type}"
"ui.text.error" = "${syntax.error}"
"ui.text.success" = "${added}"
"ui.text.accent" = "${p.ui.accent ?? syntax.function}"
"ui.text.title" = "${title}"
"ui.text.special" = "${syntax.keyword}"
"ui.text.link" = "${syntax.function}"
"ui.text.completion" = "${syntax.function}"
"ui.text.header" = "${syntax.type}"
"ui.text.label" = "${syntax.variable}"
"ui.text.muted" = "${syntax.comment}"
"ui.text.placeholder" = "${syntax.comment}"
"ui.text.disabled" = "${syntax.comment}"
"ui.picker.header" = "${panel}"
"ui.picker.header.column" = "${syntax.function}"
"ui.picker.header.column.active" = "${syntax.keyword}"
"ui.picker.list" = "${sidebar}"
"ui.picker.list.focus" = "${sel}"
"ui.picker.preview" = "${editor.background}"
"ui.picker.label" = "${syntax.variable}"
"ui.picker.label.key" = "${syntax.keyword}"
"ui.picker.label.keybind" = "${syntax.comment}"
"ui.picker.description" = "${syntax.comment}"
"ui.picker.footer" = "${status}"
"ui.picker.separator" = "${border}"
"ui.picker.spinner" = "${syntax.function}"
"ui.picker.match" = "${syntax.string}"
"ui.picker.cursor" = "${editor.cursor ?? editor.foreground}"
"ui.picker.background" = "${panel}"
"ui.picker.option" = "${syntax.variable}"
"ui.picker.option.active" = "${sel}"
"ui.picker.option.selected" = "${syntax.function}"
"ui.picker.option.selected.active" = "${syntax.keyword}"

[theme.highlight]
"attribute" = { fg = "${syntax.attribute}" }
"comment" = { fg = "${syntax.comment}", modifiers = ["italic"] }
"constant" = { fg = "${syntax.constant}" }
"function" = { fg = "${syntax.function}" }
"keyword" = { fg = "${syntax.keyword}" }
"label" = { fg = "${syntax.tag}" }
"namespace" = { fg = "${syntax.type}" }
"operator" = { fg = "${syntax.operator}" }
"punctuation" = { fg = "${syntax.punctuation}" }
"string" = { fg = "${syntax.string}" }
"type" = { fg = "${syntax.type}" }
"variable" = { fg = "${syntax.variable}" }
"tag" = { fg = "${syntax.tag}" }
"markup.heading" = { fg = "${syntax.type}", modifiers = ["bold"] }
"markup.bold" = { modifiers = ["bold"] }
"markup.italic" = { modifiers = ["italic"] }
"markup.link" = { fg = "${syntax.function}", modifiers = ["underline"] }
"markup.raw" = { fg = "${syntax.string}" }
"diff.plus" = { fg = "${added}" }
"diff.minus" = { fg = "${deleted}" }
"diff.delta" = { fg = "${modified}" }

[theme.palette]
background = "${editor.background}"
foreground = "${editor.foreground}"
black = "${ansi.black ?? "#1e1e1e"}"
red = "${ansi.red ?? syntax.error}"
green = "${ansi.green ?? syntax.string}"
yellow = "${ansi.yellow ?? syntax.type}"
blue = "${ansi.blue ?? syntax.function}"
magenta = "${ansi.magenta ?? syntax.keyword}"
cyan = "${ansi.cyan ?? syntax.operator}"
white = "${ansi.white ?? editor.foreground}"
bright_black = "${ansi.brightBlack ?? syntax.comment}"
bright_red = "${ansi.brightRed ?? ansi.red}"
bright_green = "${ansi.brightGreen ?? ansi.green}"
bright_yellow = "${ansi.brightYellow ?? ansi.yellow}"
bright_blue = "${ansi.brightBlue ?? ansi.blue}"
bright_magenta = "${ansi.brightMagenta ?? ansi.magenta}"
bright_cyan = "${ansi.brightCyan ?? ansi.cyan}"
bright_white = "${ansi.brightWhite ?? editor.foreground}"
`;
}

/**
 * Terminal « reworked » (IDE 2025.2+) — clés BLOCK_TERMINAL_* (pas CONSOLE_* seul).
 * @param {import('./theme-export-palette.mjs').ExportPalette} p
 * @param {(hex: string) => string} jetFg
 */
function jetbrainsReworkedTerminalIcls(p, jetFg) {
  const { editor, syntax, terminal } = p;
  const ansi = terminal.ansi;
  const termBg = jetFg(terminal.background);
  const termFg = jetFg(terminal.foreground ?? editor.foreground);
  const selBg = jetFg(editor.selection ?? syntax.function);
  const accent = jetFg(p.ui?.accent ?? syntax.function);
  const stroke = jetFg(syntax.comment);
  const attr = (name, hex) =>
    `    <option name="${name}"><value><option name="FOREGROUND" value="${jetFg(hex)}"/></value></option>`;

  const colors = `
    <option name="BLOCK_TERMINAL_DEFAULT_BACKGROUND" value="${termBg}"/>
    <option name="BLOCK_TERMINAL_DEFAULT_FOREGROUND" value="${termFg}"/>
    <option name="BLOCK_TERMINAL_BLOCK_BACKGROUND_START" value="${termBg}"/>
    <option name="BLOCK_TERMINAL_BLOCK_BACKGROUND_END" value="${termBg}"/>
    <option name="BLOCK_TERMINAL_SELECTED_BLOCK_BACKGROUND" value="${selBg}"/>
    <option name="BLOCK_TERMINAL_SELECTED_BLOCK_STROKE_COLOR" value="${accent}"/>
    <option name="BLOCK_TERMINAL_INACTIVE_SELECTED_BLOCK_BACKGROUND" value="${termBg}"/>
    <option name="BLOCK_TERMINAL_INACTIVE_SELECTED_BLOCK_STROKE_COLOR" value="${stroke}"/>
    <option name="BLOCK_TERMINAL_HOVERED_BLOCK_BACKGROUND_START" value="${termBg}"/>
    <option name="BLOCK_TERMINAL_HOVERED_BLOCK_BACKGROUND_END" value="${termBg}"/>
    <option name="BLOCK_TERMINAL_ERROR_BLOCK_STROKE_COLOR" value="${jetFg(ansi.red ?? syntax.error)}"/>
    <option name="BLOCK_TERMINAL_PROMPT_SEPARATOR_COLOR" value="${stroke}"/>`;

  const attributes = [
    attr("BLOCK_TERMINAL_BLACK", ansi.black ?? editor.foreground),
    attr("BLOCK_TERMINAL_RED", ansi.red ?? syntax.error),
    attr("BLOCK_TERMINAL_GREEN", ansi.green ?? syntax.string),
    attr("BLOCK_TERMINAL_YELLOW", ansi.yellow ?? syntax.type),
    attr("BLOCK_TERMINAL_BLUE", ansi.blue ?? syntax.function),
    attr("BLOCK_TERMINAL_MAGENTA", ansi.magenta ?? syntax.keyword),
    attr("BLOCK_TERMINAL_CYAN", ansi.cyan ?? syntax.operator),
    attr("BLOCK_TERMINAL_WHITE", ansi.white ?? editor.foreground),
    attr("BLOCK_TERMINAL_BLACK_BRIGHT", ansi.brightBlack ?? ansi.black),
    attr("BLOCK_TERMINAL_RED_BRIGHT", ansi.brightRed ?? ansi.red ?? syntax.error),
    attr(
      "BLOCK_TERMINAL_GREEN_BRIGHT",
      ansi.brightGreen ?? ansi.green ?? syntax.string,
    ),
    attr(
      "BLOCK_TERMINAL_YELLOW_BRIGHT",
      ansi.brightYellow ?? ansi.yellow ?? syntax.type,
    ),
    attr(
      "BLOCK_TERMINAL_BLUE_BRIGHT",
      ansi.brightBlue ?? ansi.blue ?? syntax.function,
    ),
    attr(
      "BLOCK_TERMINAL_MAGENTA_BRIGHT",
      ansi.brightMagenta ?? ansi.magenta ?? syntax.keyword,
    ),
    attr(
      "BLOCK_TERMINAL_CYAN_BRIGHT",
      ansi.brightCyan ?? ansi.cyan ?? syntax.operator,
    ),
    attr(
      "BLOCK_TERMINAL_WHITE_BRIGHT",
      ansi.brightWhite ?? ansi.white ?? editor.foreground,
    ),
    attr("BLOCK_TERMINAL_COMMAND", termFg),
    attr("BLOCK_TERMINAL_SEARCH_ENTRY", accent),
    attr("BLOCK_TERMINAL_CURRENT_SEARCH_ENTRY", accent),
    attr("BLOCK_TERMINAL_GENERATE_COMMAND_PROMPT_TEXT", termFg),
    attr("BLOCK_TERMINAL_GENERATE_COMMAND_PLACEHOLDER_FOREGROUND", stroke),
    attr("BLOCK_TERMINAL_GENERATE_COMMAND_CARET_COLOR", accent),
  ].join("\n");

  return { colors, attributes };
}

/**
 * Schéma JetBrains .icls (sous-ensemble éditeur + console ANSI).
 * @param {import('./theme-export-palette.mjs').ExportPalette} p
 */
export function toJetBrainsIcls(p) {
  const { editor, syntax, terminal, workbenchUi } = p;
  const u = workbenchUi;
  const ansi = terminal.ansi;
  const jetFg = (hex) => stripHash(hex);
  const sidebar = uiGet(u, "sideBar.background", p.ui.sidebar ?? editor.background);
  const panel = uiGet(u, "panel.background", p.ui.panel ?? editor.background);
  const status = uiGet(u, "statusBar.background", p.ui.statusBar ?? editor.background);
  const tabActive = uiGet(u, "tab.activeBackground", p.ui.tabActive ?? editor.background);
  const borderRaw = uiGet(u, "sideBar.border", p.ui.border ?? syntax.comment);
  const border = softenHexTowardBg(borderRaw, editor.background, {
    slug: p.slug,
    dark: p.type !== "light",
    strength: "chrome",
  });
  const indentGuide = softenHexTowardBg(
    uiGet(u, "editorIndentGuide.background1", borderRaw),
    editor.background,
    { slug: p.slug, dark: p.type !== "light", strength: "guide" },
  );
  const whitespace = softenHexTowardBg(syntax.comment, editor.background, {
    slug: p.slug,
    dark: p.type !== "light",
    strength: "whitespace",
  });
  const gutterMod = uiGet(u, "editorGutter.modifiedBackground", syntax.type);
  const gutterAdd = uiGet(u, "editorGutter.addedBackground", syntax.string);
  const gutterDel = uiGet(u, "editorGutter.deletedBackground", syntax.error);
  const reworked = jetbrainsReworkedTerminalIcls(p, jetFg);
  return `<?xml version="1.0" encoding="UTF-8"?>
<scheme name="${escapeXml(p.name)}" version="142" parent_scheme="${p.type === "light" ? "Default" : "Darcula"}">
  <metaInfo>
    <property name="created">${new Date().toISOString()}</property>
    <property name="description">Exported from Dusk Office VS Code theme pack (workbench UI)</property>
  </metaInfo>
  <colors>
    <option name="BACKGROUND" value="${jetFg(editor.background)}"/>
    <option name="CARET_COLOR" value="${jetFg(editor.cursor ?? editor.foreground)}"/>
    <option name="GUTTER_BACKGROUND" value="${jetFg(uiGet(u, "editorGutter.background", editor.background))}"/>
    <option name="INDENT_GUIDE" value="${jetFg(indentGuide)}"/>
    <option name="LINE_NUMBERS_COLOR" value="${jetFg(syntax.comment)}"/>
    <option name="SELECTION_BACKGROUND" value="${jetFg(editor.selection ?? editor.background)}"/>
    <option name="WHITESPACES" value="${jetFg(whitespace)}"/>
    <option name="TEARLINE_COLOR" value="${jetFg(indentGuide)}"/>
    <option name="CONSOLE_BACKGROUND_KEY" value="${jetFg(terminal.background)}"/>
    <option name="VCS_ANNOTATIONS_COLOR" value="${jetFg(syntax.comment)}"/>
    <option name="VCS_ANNOTATIONS_MODIFIED_COLOR" value="${jetFg(gutterMod)}"/>
    <option name="VCS_ANNOTATIONS_ADDED_COLOR" value="${jetFg(gutterAdd)}"/>
    <option name="VCS_ANNOTATIONS_DELETED_COLOR" value="${jetFg(gutterDel)}"/>
    <option name="NOTIFICATION_BACKGROUND" value="${jetFg(uiGet(u, "notifications.background", panel))}"/>
    <option name="TOOLTIP_BACKGROUND" value="${jetFg(uiGet(u, "editorHoverWidget.background", panel))}"/>
    <option name="ScrollBar$trackColor" value="${jetFg(sidebar)}"/>
    <option name="ScrollBar$thumbColor" value="${jetFg(uiGet(u, "scrollbarSlider.background", border))}"/>
    <option name="ScrollBar$thumb" value="${jetFg(uiGet(u, "scrollbarSlider.hoverBackground", border))}"/>${reworked.colors}
  </colors>
  <attributes>
    <option name="TEXT">
      <value>
        <option name="FOREGROUND" value="${jetFg(editor.foreground)}"/>
        <option name="BACKGROUND" value="${jetFg(editor.background)}"/>
      </value>
    </option>
    <option name="DEFAULT_KEYWORD">
      <value><option name="FOREGROUND" value="${jetFg(syntax.keyword)}"/></value>
    </option>
    <option name="DEFAULT_STRING">
      <value><option name="FOREGROUND" value="${jetFg(syntax.string)}"/></value>
    </option>
    <option name="DEFAULT_NUMBER">
      <value><option name="FOREGROUND" value="${jetFg(syntax.number ?? syntax.constant)}"/></value>
    </option>
    <option name="DEFAULT_CONSTANT">
      <value><option name="FOREGROUND" value="${jetFg(syntax.constant)}"/></value>
    </option>
    <option name="DEFAULT_FUNCTION_DECLARATION">
      <value><option name="FOREGROUND" value="${jetFg(syntax.function)}"/></value>
    </option>
    <option name="DEFAULT_CLASS_NAME">
      <value><option name="FOREGROUND" value="${jetFg(syntax.type)}"/></value>
    </option>
    <option name="DEFAULT_INTERFACE_NAME">
      <value><option name="FOREGROUND" value="${jetFg(syntax.type)}"/></value>
    </option>
    <option name="DEFAULT_LINE_COMMENT">
      <value><option name="FOREGROUND" value="${jetFg(syntax.comment)}"/><option name="FONT_TYPE" value="2"/></value>
    </option>
    <option name="DEFAULT_BLOCK_COMMENT">
      <value><option name="FOREGROUND" value="${jetFg(syntax.comment)}"/><option name="FONT_TYPE" value="2"/></value>
    </option>
    <option name="DEFAULT_DOC_COMMENT">
      <value><option name="FOREGROUND" value="${jetFg(syntax.comment)}"/><option name="FONT_TYPE" value="2"/></value>
    </option>
    <option name="DEFAULT_DOC_MARKUP">
      <value><option name="FOREGROUND" value="${jetFg(syntax.keyword)}"/><option name="FONT_TYPE" value="3"/></value>
    </option>
    <option name="DEFAULT_IDENTIFIER">
      <value><option name="FOREGROUND" value="${jetFg(syntax.variable)}"/></value>
    </option>
    <option name="DEFAULT_FUNCTION_CALL">
      <value><option name="FOREGROUND" value="${jetFg(syntax.function)}"/></value>
    </option>
    <option name="DEFAULT_LOCAL_VARIABLE">
      <value><option name="FOREGROUND" value="${jetFg(syntax.variable)}"/></value>
    </option>
    <option name="DEFAULT_GLOBAL_VARIABLE">
      <value><option name="FOREGROUND" value="${jetFg(syntax.variable)}"/><option name="FONT_TYPE" value="1"/></value>
    </option>
    <option name="DEFAULT_PARAMETER">
      <value><option name="FOREGROUND" value="${jetFg(syntax.variable)}"/><option name="FONT_TYPE" value="2"/></value>
    </option>
    <option name="DEFAULT_INSTANCE_FIELD">
      <value><option name="FOREGROUND" value="${jetFg(syntax.property)}"/></value>
    </option>
    <option name="DEFAULT_INSTANCE_METHOD">
      <value><option name="FOREGROUND" value="${jetFg(syntax.function)}"/></value>
    </option>
    <option name="DEFAULT_STATIC_FIELD">
      <value><option name="FOREGROUND" value="${jetFg(syntax.constant)}"/><option name="FONT_TYPE" value="2"/></value>
    </option>
    <option name="DEFAULT_STATIC_METHOD">
      <value><option name="FOREGROUND" value="${jetFg(syntax.function)}"/><option name="FONT_TYPE" value="2"/></value>
    </option>
    <option name="DEFAULT_CLASS_REFERENCE">
      <value><option name="FOREGROUND" value="${jetFg(syntax.type)}"/></value>
    </option>
    <option name="DEFAULT_OPERATION_SIGN">
      <value><option name="FOREGROUND" value="${jetFg(syntax.operator)}"/></value>
    </option>
    <option name="DEFAULT_PARENTHESES">
      <value><option name="FOREGROUND" value="${jetFg(syntax.punctuation)}"/></value>
    </option>
    <option name="DEFAULT_SEMICOLON">
      <value><option name="FOREGROUND" value="${jetFg(syntax.punctuation)}"/></value>
    </option>
    <option name="DEFAULT_TAG">
      <value><option name="FOREGROUND" value="${jetFg(syntax.tag)}"/></value>
    </option>
    <option name="DEFAULT_ATTRIBUTE">
      <value><option name="FOREGROUND" value="${jetFg(syntax.attribute)}"/></value>
    </option>
    <option name="DEFAULT_ENTITY">
      <value><option name="FOREGROUND" value="${jetFg(syntax.constant)}"/></value>
    </option>
    <option name="DEFAULT_METADATA">
      <value><option name="FOREGROUND" value="${jetFg(syntax.attribute)}"/></value>
    </option>
    <option name="DEFAULT_LABEL">
      <value><option name="FOREGROUND" value="${jetFg(syntax.tag)}"/></value>
    </option>
    <option name="DEFAULT_PREDEFINED_SYMBOL">
      <value><option name="FOREGROUND" value="${jetFg(syntax.constant)}"/><option name="FONT_TYPE" value="2"/></value>
    </option>
    <option name="DEFAULT_VALID_STRING_ESCAPE">
      <value><option name="FOREGROUND" value="${jetFg(syntax.keyword)}"/><option name="FONT_TYPE" value="1"/></value>
    </option>
    <option name="DEFAULT_INVALID_STRING_ESCAPE">
      <value><option name="FOREGROUND" value="${jetFg(syntax.error)}"/><option name="EFFECT_TYPE" value="1"/></value>
    </option>
    <option name="DEFAULT_TEMPLATE_LANGUAGE_COLOR">
      <value><option name="FOREGROUND" value="${jetFg(syntax.keyword)}"/></value>
    </option>
    <option name="CONSOLE_NORMAL_OUTPUT"><value><option name="FOREGROUND" value="${jetFg(terminal.foreground ?? editor.foreground)}"/></value></option>
    <option name="CONSOLE_USER_INPUT"><value><option name="FOREGROUND" value="${jetFg(terminal.foreground ?? editor.foreground)}"/></value></option>
    <option name="CONSOLE_SYSTEM_OUTPUT"><value><option name="FOREGROUND" value="${jetFg(syntax.comment)}"/></value></option>
    <option name="CONSOLE_ERROR_OUTPUT"><value><option name="FOREGROUND" value="${jetFg(ansi.red ?? syntax.error)}"/></value></option>
    <option name="CONSOLE_BLACK_OUTPUT"><value><option name="FOREGROUND" value="${jetFg(ansi.black ?? editor.foreground)}"/></value></option>
    <option name="CONSOLE_RED_OUTPUT"><value><option name="FOREGROUND" value="${jetFg(ansi.red ?? syntax.error)}"/></value></option>
    <option name="CONSOLE_GREEN_OUTPUT"><value><option name="FOREGROUND" value="${jetFg(ansi.green ?? syntax.string)}"/></value></option>
    <option name="CONSOLE_YELLOW_OUTPUT"><value><option name="FOREGROUND" value="${jetFg(ansi.yellow ?? syntax.type)}"/></value></option>
    <option name="CONSOLE_BLUE_OUTPUT"><value><option name="FOREGROUND" value="${jetFg(ansi.blue ?? syntax.function)}"/></value></option>
    <option name="CONSOLE_MAGENTA_OUTPUT"><value><option name="FOREGROUND" value="${jetFg(ansi.magenta ?? syntax.keyword)}"/></value></option>
    <option name="CONSOLE_CYAN_OUTPUT"><value><option name="FOREGROUND" value="${jetFg(ansi.cyan ?? syntax.operator)}"/></value></option>
    <option name="CONSOLE_GRAY_OUTPUT"><value><option name="FOREGROUND" value="${jetFg(ansi.white ?? editor.foreground)}"/></value></option>
    <option name="CONSOLE_RED_BRIGHT_OUTPUT"><value><option name="FOREGROUND" value="${jetFg(ansi.brightRed ?? ansi.red ?? syntax.error)}"/></value></option>
    <option name="CONSOLE_GREEN_BRIGHT_OUTPUT"><value><option name="FOREGROUND" value="${jetFg(ansi.brightGreen ?? ansi.green ?? syntax.string)}"/></value></option>
    <option name="CONSOLE_YELLOW_BRIGHT_OUTPUT"><value><option name="FOREGROUND" value="${jetFg(ansi.brightYellow ?? ansi.yellow ?? syntax.type)}"/></value></option>
    <option name="CONSOLE_BLUE_BRIGHT_OUTPUT"><value><option name="FOREGROUND" value="${jetFg(ansi.brightBlue ?? ansi.blue ?? syntax.function)}"/></value></option>
    <option name="CONSOLE_MAGENTA_BRIGHT_OUTPUT"><value><option name="FOREGROUND" value="${jetFg(ansi.brightMagenta ?? ansi.magenta ?? syntax.keyword)}"/></value></option>
    <option name="CONSOLE_CYAN_BRIGHT_OUTPUT"><value><option name="FOREGROUND" value="${jetFg(ansi.brightCyan ?? ansi.cyan ?? syntax.operator)}"/></value></option>
${reworked.attributes}
    <option name="DELETED_TEXT_ATTRIBUTES">
      <value><option name="FOREGROUND" value="${jetFg(gutterDel)}"/><option name="BACKGROUND" value="${jetFg(uiGet(u, "diffEditor.removedLineBackground", editor.background))}"/></value>
    </option>
    <option name="INSERTED_TEXT_ATTRIBUTES">
      <value><option name="FOREGROUND" value="${jetFg(gutterAdd)}"/><option name="BACKGROUND" value="${jetFg(uiGet(u, "diffEditor.insertedLineBackground", editor.background))}"/></value>
    </option>
    <option name="MODIFIED_LINES_COLOR">
      <value><option name="BACKGROUND" value="${jetFg(gutterMod)}"/></value>
    </option>
    <option name="ADDED_LINES_COLOR">
      <value><option name="BACKGROUND" value="${jetFg(gutterAdd)}"/></value>
    </option>
    <option name="DELETED_LINES_COLOR">
      <value><option name="BACKGROUND" value="${jetFg(gutterDel)}"/></value>
    </option>
    <option name="MATCHED_BRACE_ATTRIBUTES">
      <value><option name="FOREGROUND" value="${jetFg(syntax.function)}"/><option name="BACKGROUND" value="${jetFg(tabActive)}"/></value>
    </option>
    <option name="UNMATCHED_BRACE_ATTRIBUTES">
      <value><option name="FOREGROUND" value="${jetFg(syntax.error)}"/><option name="EFFECT_TYPE" value="1"/></value>
    </option>
    <option name="IDENTIFIER_UNDER_CARET_ATTRIBUTES">
      <value><option name="BACKGROUND" value="${jetFg(uiGet(u, "editor.wordHighlightBackground", editor.background))}"/><option name="FOREGROUND" value="${jetFg(editor.foreground)}"/></value>
    </option>
    <option name="WRITE_IDENTIFIER_UNDER_CARET_ATTRIBUTES">
      <value><option name="BACKGROUND" value="${jetFg(uiGet(u, "editor.wordHighlightStrongBackground", editor.background))}"/></value>
    </option>
    <option name="FOLDED_TEXT_ATTRIBUTES">
      <value><option name="FOREGROUND" value="${jetFg(syntax.comment)}"/><option name="BACKGROUND" value="${jetFg(panel)}"/></value>
    </option>
    <option name="WHITESPACES">
      <value><option name="FOREGROUND" value="${jetFg(whitespace)}"/></value>
    </option>
    <option name="SELECTION_FOREGROUND">
      <value><option name="FOREGROUND" value="${jetFg(editor.foreground)}"/></value>
    </option>
    <option name="CARET_ROW_COLOR">
      <value><option name="BACKGROUND" value="${jetFg(editor.lineHighlight ?? editor.background)}"/></value>
    </option>
    <option name="ERRORS_ATTRIBUTES">
      <value><option name="EFFECT_COLOR" value="${jetFg(syntax.error)}"/><option name="EFFECT_TYPE" value="1"/></value>
    </option>
    <option name="WARNING_ATTRIBUTES">
      <value><option name="EFFECT_COLOR" value="${jetFg(syntax.type)}"/><option name="EFFECT_TYPE" value="1"/></value>
    </option>
    <option name="GENERIC_SERVER_ERROR_OR_WARNING">
      <value><option name="EFFECT_COLOR" value="${jetFg(syntax.type)}"/><option name="EFFECT_TYPE" value="1"/></value>
    </option>
    <option name="DUPLICATE_FROM_SERVER">
      <value><option name="EFFECT_COLOR" value="${jetFg(syntax.comment)}"/><option name="EFFECT_TYPE" value="1"/></value>
    </option>
    <option name="INFORMATION_ATTRIBUTES">
      <value><option name="EFFECT_COLOR" value="${jetFg(syntax.comment)}"/><option name="EFFECT_TYPE" value="1"/></value>
    </option>
    <option name="NOT_USED_ELEMENT_ATTRIBUTES">
      <value><option name="FOREGROUND" value="${jetFg(syntax.comment)}"/><option name="EFFECT_TYPE" value="1"/></value>
    </option>
    <option name="DEPRECATED_ATTRIBUTES">
      <value><option name="EFFECT_COLOR" value="${jetFg(syntax.comment)}"/><option name="EFFECT_TYPE" value="3"/></value>
    </option>
    <option name="MARKED_FOR_REMOVAL_ATTRIBUTES">
      <value><option name="EFFECT_COLOR" value="${jetFg(syntax.error)}"/><option name="EFFECT_TYPE" value="3"/></value>
    </option>
    <option name="TYPO">
      <value><option name="EFFECT_COLOR" value="${jetFg(syntax.string)}"/><option name="EFFECT_TYPE" value="1"/></value>
    </option>
    <option name="TODO_DEFAULT_ATTRIBUTES">
      <value><option name="FOREGROUND" value="${jetFg(syntax.type)}"/><option name="FONT_TYPE" value="3"/></value>
    </option>
    <option name="BOOKMARKS_ATTRIBUTES">
      <value><option name="BACKGROUND" value="${jetFg(uiGet(u, "editorGutter.addedBackground", syntax.string))}"/><option name="EFFECT_TYPE" value="1"/></value>
    </option>
    <option name="BREAKPOINT_ATTRIBUTES">
      <value><option name="BACKGROUND" value="${jetFg(uiGet(u, "editorGutter.deletedBackground", syntax.error))}"/></value>
    </option>
    <option name="HYPERLINK_ATTRIBUTES">
      <value><option name="FOREGROUND" value="${jetFg(syntax.function)}"/><option name="EFFECT_COLOR" value="${jetFg(syntax.function)}"/><option name="EFFECT_TYPE" value="0"/></value>
    </option>
    <option name="FOLLOWED_HYPERLINK_ATTRIBUTES">
      <value><option name="FOREGROUND" value="${jetFg(syntax.keyword)}"/><option name="EFFECT_COLOR" value="${jetFg(syntax.keyword)}"/><option name="EFFECT_TYPE" value="0"/></value>
    </option>
    <option name="CTRL_CLICKABLE">
      <value><option name="FOREGROUND" value="${jetFg(syntax.function)}"/><option name="EFFECT_COLOR" value="${jetFg(syntax.function)}"/><option name="EFFECT_TYPE" value="0"/></value>
    </option>
    <option name="SEARCH_RESULT_ATTRIBUTES">
      <value><option name="BACKGROUND" value="${jetFg(uiGet(u, "editor.findMatchHighlightBackground", tabActive))}"/></value>
    </option>
    <option name="TEXT_SEARCH_RESULT_ATTRIBUTES">
      <value><option name="BACKGROUND" value="${jetFg(uiGet(u, "editor.findMatchHighlightBackground", tabActive))}"/></value>
    </option>
    <option name="WRITE_SEARCH_RESULT_ATTRIBUTES">
      <value><option name="BACKGROUND" value="${jetFg(uiGet(u, "editor.findMatchBackground", tabActive))}"/></value>
    </option>
    <option name="HIGHLIGHTED_REFERENCE_ATTRIBUTES">
      <value><option name="BACKGROUND" value="${jetFg(uiGet(u, "editor.wordHighlightBackground", editor.background))}"/></value>
    </option>
    <option name="LIVE_TEMPLATE_ATTRIBUTES">
      <value><option name="EFFECT_COLOR" value="${jetFg(syntax.string)}"/><option name="EFFECT_TYPE" value="5"/></value>
    </option>
    <option name="INJECTED_LANGUAGE_FRAGMENT">
      <value><option name="BACKGROUND" value="${jetFg(panel)}"/></value>
    </option>
    <option name="BAD_CHARACTER">
      <value><option name="FOREGROUND" value="${jetFg(syntax.error)}"/><option name="EFFECT_COLOR" value="${jetFg(syntax.error)}"/><option name="EFFECT_TYPE" value="1"/></value>
    </option>
    <option name="ANNOTATION_NAME_ATTRIBUTES">
      <value><option name="FOREGROUND" value="${jetFg(syntax.attribute)}"/></value>
    </option>
    <option name="TYPE_PARAMETER_NAME_ATTRIBUTES">
      <value><option name="FOREGROUND" value="${jetFg(syntax.type)}"/><option name="FONT_TYPE" value="2"/></value>
    </option>
    <option name="INLINE_PARAMETER_HINT">
      <value><option name="FOREGROUND" value="${jetFg(syntax.comment)}"/><option name="BACKGROUND" value="${jetFg(panel)}"/></value>
    </option>
    <option name="INLINE_PARAMETER_HINT_CURRENT">
      <value><option name="FOREGROUND" value="${jetFg(editor.foreground)}"/><option name="BACKGROUND" value="${jetFg(tabActive)}"/></value>
    </option>
    <option name="INLINE_PARAMETER_HINT_HIGHLIGHTED">
      <value><option name="FOREGROUND" value="${jetFg(editor.foreground)}"/><option name="BACKGROUND" value="${jetFg(tabActive)}"/></value>
    </option>
    <option name="INLINE_REFACTORING_SETTINGS_DEFAULT">
      <value><option name="EFFECT_COLOR" value="${jetFg(border)}"/><option name="EFFECT_TYPE" value="5"/></value>
    </option>
    <option name="INLINE_REFACTORING_SETTINGS_FOCUSED">
      <value><option name="EFFECT_COLOR" value="${jetFg(syntax.function)}"/><option name="EFFECT_TYPE" value="5"/></value>
    </option>
    <option name="INLINE_REFACTORING_SETTINGS_HOVERED">
      <value><option name="EFFECT_COLOR" value="${jetFg(syntax.function)}"/><option name="EFFECT_TYPE" value="5"/></value>
    </option>
    <option name="LINE_FULL_COVERAGE">
      <value><option name="FOREGROUND" value="${jetFg(gutterAdd)}"/><option name="FONT_TYPE" value="1"/></value>
    </option>
    <option name="LINE_PARTIAL_COVERAGE">
      <value><option name="FOREGROUND" value="${jetFg(gutterMod)}"/><option name="FONT_TYPE" value="1"/></value>
    </option>
    <option name="LINE_NONE_COVERAGE">
      <value><option name="FOREGROUND" value="${jetFg(gutterDel)}"/><option name="FONT_TYPE" value="1"/></value>
    </option>
    <option name="BREADCRUMBS_DEFAULT">
      <value><option name="FOREGROUND" value="${jetFg(syntax.comment)}"/></value>
    </option>
    <option name="BREADCRUMBS_HOVERED">
      <value><option name="FOREGROUND" value="${jetFg(editor.foreground)}"/><option name="BACKGROUND" value="${jetFg(tabActive)}"/></value>
    </option>
    <option name="BREADCRUMBS_CURRENT">
      <value><option name="FOREGROUND" value="${jetFg(editor.foreground)}"/><option name="BACKGROUND" value="${jetFg(tabActive)}"/></value>
    </option>
    <option name="CODE_LENS_BORDER_COLOR">
      <value><option name="EFFECT_COLOR" value="${jetFg(border)}"/></value>
    </option>
    <option name="IMPLICIT_ANONYMOUS_CLASS_PARAMETER_ATTRIBUTES">
      <value><option name="FOREGROUND" value="${jetFg(syntax.variable)}"/><option name="FONT_TYPE" value="2"/></value>
    </option>
    <option name="LOG_ERROR_OUTPUT">
      <value><option name="FOREGROUND" value="${jetFg(ansi.red ?? syntax.error)}"/></value>
    </option>
    <option name="LOG_WARNING_OUTPUT">
      <value><option name="FOREGROUND" value="${jetFg(ansi.yellow ?? syntax.type)}"/></value>
    </option>
    <option name="GUTTER_HOVER_ICON" baseAttributes=""/>
  </attributes>
</scheme>
`;
}

function stripHash(hex) {
  return String(hex).replace(/^#/, "").toUpperCase();
}

function escapeXml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
