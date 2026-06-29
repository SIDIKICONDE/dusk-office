const vscode = require("vscode");
const cfg = require("../core/configuration.js");
const { isDuskTheme } = require("./theme-common.js");
const log = require("../core/log.js");

// Rules we own inside `editor.tokenColorCustomizations`, tagged by `name` so we
// can update/remove them later WITHOUT ever touching the user's own rules.
const COMMENTS_RULE_NAME = "Dusk Office: comments";
const KEYWORDS_RULE_NAME = "Dusk Office: keywords";
const MANAGED_NAMES = [COMMENTS_RULE_NAME, KEYWORDS_RULE_NAME];

const COMMENT_SCOPES = [
  "comment",
  "comment.line",
  "comment.block",
  "comment.block.documentation",
  "punctuation.definition.comment",
];

const KEYWORD_SCOPES = [
  "keyword",
  "keyword.control",
  "storage.type",
  "storage.modifier",
];

// Build the override rules for the current settings. Dusk Office themes already
// ship italic comments and non-bold keywords, so we only emit a rule when the
// user deviates from that baseline (italic OFF, or bold ON).
function buildManagedRules() {
  const rules = [];
  if (!cfg.getSyntaxItalicComments()) {
    rules.push({
      name: COMMENTS_RULE_NAME,
      scope: COMMENT_SCOPES,
      settings: { fontStyle: "" },
    });
  }
  if (cfg.getSyntaxBoldKeywords()) {
    rules.push({
      name: KEYWORDS_RULE_NAME,
      scope: KEYWORD_SCOPES,
      settings: { fontStyle: "bold" },
    });
  }
  return rules;
}

function rulesEqual(a, b) {
  return JSON.stringify(a || []) === JSON.stringify(b || []);
}

// Reconcile `editor.tokenColorCustomizations` with the current syntax settings.
// Only active while a Dusk Office theme is selected; leaving Dusk themes removes
// our managed rules so other themes are never affected.
async function applySyntaxStyle() {
  try {
    const editorConfig = vscode.workspace.getConfiguration("editor");
    const current = editorConfig.get("tokenColorCustomizations");
    const base =
      current && typeof current === "object" && !Array.isArray(current)
        ? current
        : {};
    const existingRules = Array.isArray(base.textMateRules)
      ? base.textMateRules
      : [];
    // Keep every rule the user defined; drop only our previously-managed ones.
    const userRules = existingRules.filter(
      (r) => !(r && MANAGED_NAMES.includes(r.name)),
    );

    const managed = isDuskTheme(cfg.getCurrentTheme())
      ? buildManagedRules()
      : [];
    const nextRules = [...userRules, ...managed];

    if (rulesEqual(existingRules, nextRules)) return;

    const next = { ...base };
    if (nextRules.length > 0) {
      next.textMateRules = nextRules;
    } else {
      delete next.textMateRules;
    }

    const valueToWrite = Object.keys(next).length > 0 ? next : undefined;
    await cfg.updateConfigValue(
      editorConfig,
      "tokenColorCustomizations",
      valueToWrite,
    );
  } catch (err) {
    log.error("applySyntaxStyle", err);
  }
}

async function toggleItalicComments() {
  try {
    const extCfg = cfg.getExtensionConfig();
    const next = !cfg.getSyntaxItalicComments();
    await cfg.updateConfigValue(extCfg, "syntax.italicComments", next);
    void vscode.window.showInformationMessage(
      next
        ? "Dusk Office: italic comments enabled."
        : "Dusk Office: italic comments disabled.",
    );
  } catch (err) {
    log.error("toggleItalicComments", err);
  }
}

async function toggleBoldKeywords() {
  try {
    const extCfg = cfg.getExtensionConfig();
    const next = !cfg.getSyntaxBoldKeywords();
    await cfg.updateConfigValue(extCfg, "syntax.boldKeywords", next);
    void vscode.window.showInformationMessage(
      next
        ? "Dusk Office: bold keywords enabled."
        : "Dusk Office: bold keywords disabled.",
    );
  } catch (err) {
    log.error("toggleBoldKeywords", err);
  }
}

module.exports = {
  applySyntaxStyle,
  toggleItalicComments,
  toggleBoldKeywords,
};
