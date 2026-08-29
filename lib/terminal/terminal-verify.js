const vscode = require("vscode");
const themesBundle = require("../generated/themes-bundle.js");
const {
  MIN_TERMINAL_FG_RATIO,
  MIN_TERMINAL_ANSI_RATIO,
  checkTerminalContrast,
} = require("./terminal-contrast.js");

async function verifyTerminalContrast() {
  try {
    if (!Array.isArray(themesBundle) || themesBundle.length === 0) {
      void vscode.window.showWarningMessage("No theme data available.");
      return;
    }

    let checkedCount = 0;
    const failures = [];

    for (const theme of themesBundle) {
      const themeFailures = checkTerminalContrast(theme.colors, theme.uiTheme || "vs-dark");
      checkedCount += 1;
      if (themeFailures.length > 0) {
        failures.push({
          label: theme.label || theme.path,
          path: theme.path,
          details: themeFailures,
        });
      }
    }

    const hasFailures = failures.length > 0;
    const statusLine = hasFailures
      ? `Terminal contrast verification failed for ${failures.length}/${checkedCount} theme(s).`
      : `Terminal contrast verified for ${checkedCount} theme(s): all checks passed.`;

    const reportLines = [
      "# Dusk Office Terminal Contrast Report",
      "",
      `- Checked themes: ${checkedCount}`,
      `- Minimum terminal.foreground ratio: ${MIN_TERMINAL_FG_RATIO}:1`,
      `- Minimum ANSI ratio on dark/hc themes: ${MIN_TERMINAL_ANSI_RATIO}:1`,
      "- ANSI keys skipped: terminal.ansiBlack, terminal.ansiBrightBlack",
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
      reportLines.push("All themes meet the configured contrast thresholds.", "");
    }

    const action = "View Details";
    if (hasFailures) {
      const selection = await vscode.window.showWarningMessage(statusLine, action);
      if (selection !== action) return;
    } else {
      const selection = await vscode.window.showInformationMessage(statusLine, action);
      if (selection !== action) return;
    }

    const doc = await vscode.workspace.openTextDocument({
      content: reportLines.join("\n"),
      language: "markdown",
    });
    await vscode.window.showTextDocument(doc, { preview: false });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    void vscode.window.showErrorMessage(
      `Failed to verify terminal contrast: ${message}`,
    );
  }
}

module.exports = { verifyTerminalContrast };
