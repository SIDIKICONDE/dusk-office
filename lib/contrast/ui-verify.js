const vscode = require("vscode");
const themesBundle = require("../generated/themes-bundle.js");
const {
  MIN_TEXT_RATIO,
  MIN_UI_RATIO,
  MIN_SYNTAX_RATIO,
  checkUiContrast,
} = require("./ui-contrast.js");

/**
 * `Dusk Office: Verify Editor & UI Contrast` command. Mirrors the terminal
 * contrast verifier but covers editor text, syntax tokens, and workbench chrome
 * (status bar, tabs, buttons, lists, badges, diagnostics). Produces a Markdown
 * report listing every pair below the WCAG threshold. Reads pre-merged data from
 * lib/generated/themes-bundle.js so it works in the web extension host.
 */
async function verifyEditorContrast() {
  try {
    if (!Array.isArray(themesBundle) || themesBundle.length === 0) {
      void vscode.window.showWarningMessage("No theme data available.");
      return;
    }

    let checkedCount = 0;
    let pairCount = 0;
    const failures = [];

    for (const theme of themesBundle) {
      const results = checkUiContrast(theme.colors, theme.tokenColors, theme.uiTheme || "vs-dark");
      checkedCount += 1;
      pairCount += results.length;
      const failed = results.filter((r) => !r.pass);
      if (failed.length > 0) {
        failures.push({
          label: theme.label || theme.path,
          path: theme.path,
          details: failed.map(
            (r) =>
              `${r.label} — ${r.fg} on ${r.bg}: ${r.ratio.toFixed(2)}:1 (min ${r.min}:1) [${r.fgKey} / ${r.bgKey}]`,
          ),
        });
      }
    }

    const hasFailures = failures.length > 0;
    const statusLine = hasFailures
      ? `Editor/UI contrast failed for ${failures.length}/${checkedCount} theme(s).`
      : `Editor/UI contrast verified for ${checkedCount} theme(s): all checks passed.`;

    const reportLines = [
      "# Dusk Office Editor & UI Contrast Report",
      "",
      `- Checked themes: ${checkedCount}`,
      `- Scored pairs: ${pairCount}`,
      `- Minimum text ratio (editor body, chrome): ${MIN_TEXT_RATIO}:1 (WCAG AA)`,
      `- Minimum UI-component ratio (badges, buttons, diagnostics): ${MIN_UI_RATIO}:1`,
      `- Minimum syntax-token ratio (readability floor): ${MIN_SYNTAX_RATIO}:1`,
      "",
    ];

    if (hasFailures) {
      reportLines.push("## Failing Themes", "");
      for (const fail of failures) {
        reportLines.push(`### ${fail.label}`, `Path: \`${fail.path}\``, "");
        for (const line of fail.details) {
          reportLines.push(`- ${line}`);
        }
        reportLines.push("");
      }
    } else {
      reportLines.push("All themes meet the configured editor & UI contrast thresholds.", "");
    }

    const action = "View Details";
    const selection = hasFailures
      ? await vscode.window.showWarningMessage(statusLine, action)
      : await vscode.window.showInformationMessage(statusLine, action);
    if (selection !== action) return;

    const doc = await vscode.workspace.openTextDocument({
      content: reportLines.join("\n"),
      language: "markdown",
    });
    await vscode.window.showTextDocument(doc, { preview: false });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    void vscode.window.showErrorMessage(
      `Failed to verify editor/UI contrast: ${message}`,
    );
  }
}

module.exports = { verifyEditorContrast };
