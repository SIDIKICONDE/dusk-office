const vscode = require("vscode");
const keys = require("../core/extension-keys.js");
const cfg = require("../core/configuration.js");
const themes = require("../themes/themes.js");
const {
  collectWorkspaceSignals,
  FINGERPRINT_PATTERNS,
  FINGERPRINT_THRESHOLD,
} = require("./workspace-fingerprint-data.js");
const log = require("../core/log.js");
const { recordMarketplaceReviewEngagement } = require("../prompts/marketplace-review-prompt.js");

function mergeFingerprintSignals(signals, extra) {
  for (const dep of extra.npmDeps) signals.npmDeps.add(dep);
  for (const kw of extra.npmKeywords) signals.npmKeywords.push(kw);
  if (extra.npmText) signals.npmText += " " + extra.npmText;
  for (const dep of extra.cargoDeps) signals.cargoDeps.add(dep);
  if (extra.pythonText) signals.pythonText += "\n" + extra.pythonText;
  if (extra.goText) signals.goText += "\n" + extra.goText;
  if (extra.composerText) signals.composerText += "\n" + extra.composerText;
  for (const f of extra.files) signals.files.add(f);
  for (const [ext, count] of Object.entries(extra.extensionCounts)) {
    signals.extensionCounts[ext] = (signals.extensionCounts[ext] || 0) + count;
  }
  signals.k8sManifestCount += extra.k8sManifestCount || 0;
}

async function detectWorkspaceFingerprint(context, options = {}) {
  try {
    if (!options.force && !cfg.getWorkspaceFingerprintEnabled()) return null;
    if (!options.force && context.workspaceState.get(keys.WORKSPACE_FINGERPRINT_KEY)) return null;

    const folders = vscode.workspace.workspaceFolders;
    if (!folders || folders.length === 0) return null;

    let signals;
    try {
      signals = collectWorkspaceSignals(folders[0].uri.fsPath);
      for (let i = 1; i < folders.length; i++) {
        mergeFingerprintSignals(signals, collectWorkspaceSignals(folders[i].uri.fsPath));
      }
    } catch {
      return null;
    }

    const ranked = FINGERPRINT_PATTERNS.map((p) => ({ pattern: p, score: p.score(signals) }))
      .filter((entry) => entry.score >= FINGERPRINT_THRESHOLD)
      .sort((a, b) => b.score - a.score);

    if (ranked.length === 0) {
      if (options.force) {
        void vscode.window.showInformationMessage(
          'Dusk Office: no strong workspace match detected. Use "Dusk Office: Set Theme Variant" to pick one manually.',
        );
      }
      return null;
    }

    const top = ranked[0];
    const currentTheme = cfg.getCurrentTheme();
    if (!options.showAlways && currentTheme === top.pattern.variant) {
      await context.workspaceState.update(keys.WORKSPACE_FINGERPRINT_KEY, true);
      return null;
    }

    const message = `🌒 Dusk Office detected this looks like a ${top.pattern.reason}. Try the "${top.pattern.displayLabel}" variant?`;
    const choice = await vscode.window.showInformationMessage(
      message,
      "Try it",
      "Show all variants",
      "Don't suggest here",
    );

    await context.workspaceState.update(keys.WORKSPACE_FINGERPRINT_KEY, true);

    if (choice === "Try it") {
      await themes.applyTheme(top.pattern.variant, context, "manual");
      void recordMarketplaceReviewEngagement(context, "fingerprintAccept");
      return top.pattern.variant;
    }
    if (choice === "Show all variants") {
      await themes.setThemeVariant(context);
      return null;
    }
    return null;
  } catch (err) {
    log.error("detectWorkspaceFingerprint", err);
    return null;
  }
}

async function clearWorkspaceFingerprint(context) {
  try {
    await context.workspaceState.update(keys.WORKSPACE_FINGERPRINT_KEY, undefined);
    void vscode.window.showInformationMessage(
      "Workspace fingerprint cleared — a variant suggestion can appear again on next open.",
    );
  } catch (err) {
    log.error("clearWorkspaceFingerprint", err);
  }
}

module.exports = { detectWorkspaceFingerprint, clearWorkspaceFingerprint };
