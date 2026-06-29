const vscode = require("vscode");
const { THEME_VARIANTS, getThemeKindLabel, getThemeDisplayLabel, stripThemeDisplayLabel } = require("../themes/theme-common.js");
const { buildThemePreviewModel } = require("../themes/theme-data.js");
const themesBundle = require("../generated/themes-bundle.js");
const cfg = require("../core/configuration.js");
const themes = require("../themes/themes.js");
const state = require("../core/extension-state.js");
const log = require("../core/log.js");

let openPanel = null;

/** @type {{ original: string; committed: string | null; lastPreviewed: string } | null} */
let gallerySession = null;

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (ch) => {
    switch (ch) {
      case "&": return "&amp;";
      case "<": return "&lt;";
      case ">": return "&gt;";
      case '"': return "&quot;";
      default: return "&#39;";
    }
  });
}

/** Hex string safe to drop into inline CSS, else a transparent fallback. */
function cssColor(value, fallback = "transparent") {
  return typeof value === "string" && /^#[0-9a-fA-F]{3,8}$/.test(value) ? value : fallback;
}

/** @param {string | null | undefined} committed @param {string} original */
function resolveGalleryRevertTheme(committed, original) {
  return committed ?? original;
}

function resetGallerySession() {
  const current = cfg.getCurrentTheme();
  gallerySession = {
    original: current,
    committed: null,
    lastPreviewed: current,
  };
  state.isThemeGalleryOpen = true;
}

/** Build the live mini-editor + chrome preview for one variant. */
function renderCard(name, model, isCurrent) {
  const kind = getThemeKindLabel(name) || (model.type === "light" ? "Light" : "Dark");
  const t = model.tokens;
  const displayLabel = getThemeDisplayLabel(name);
  const ansiSwatches = model.terminalAnsi
    .map((color) => `<span class="ansi" style="background:${cssColor(color)}"></span>`)
    .join("");

  return `
  <article class="card${isCurrent ? " current" : ""}" data-theme="${escapeHtml(displayLabel)}">
    <div class="chrome" style="background:${cssColor(model.titleBarBackground, model.editorBackground)}">
      <span class="dot red"></span><span class="dot amber"></span><span class="dot green"></span>
      <span class="chrome-name">${escapeHtml(name.replace(/^Dusk Office\s*/, "") || name)}</span>
    </div>
    <div class="preview" style="background:${cssColor(model.editorBackground)};color:${cssColor(model.editorForeground)}">
      <div class="gutter" style="background:${cssColor(model.activityBarBackground, model.editorBackground)}"></div>
      <pre class="code"><span style="color:${cssColor(t.comment, model.editorForeground)}">// dusk office</span>
<span style="color:${cssColor(t.keyword, model.editorForeground)}">const</span> <span style="color:${cssColor(t.variable, model.editorForeground)}">total</span> = <span style="color:${cssColor(t.function, model.editorForeground)}">sum</span>(<span style="color:${cssColor(t.number, model.editorForeground)}">42</span>);
<span style="color:${cssColor(t.keyword, model.editorForeground)}">return</span> <span style="color:${cssColor(t.string, model.editorForeground)}">"\${total}"</span> <span style="color:${cssColor(t.type, model.editorForeground)}">String</span>;</pre>
    </div>
    <div class="statusbar" style="background:${cssColor(model.statusBarBackground, model.titleBarBackground)};color:${cssColor(model.statusBarForeground, model.editorForeground)}">
      <span>${escapeHtml(kind)}</span>
      <span class="ansis">${ansiSwatches}</span>
    </div>
    <div class="actions">
      <span class="title">${escapeHtml(name)}${isCurrent ? ' <em>· current</em>' : ""}</span>
      <button class="apply" data-theme="${escapeHtml(displayLabel)}">${isCurrent ? "Re-apply" : "Apply"}</button>
    </div>
  </article>`;
}

function buildHtml(cards, nonce) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Dusk Office — Theme Gallery</title>
<style>
  :root { color-scheme: light dark; }
  body { font-family: var(--vscode-font-family, system-ui); margin: 0; padding: 16px;
    color: var(--vscode-foreground); background: var(--vscode-editor-background); }
  h1 { font-size: 15px; margin: 0 0 4px; }
  p.lead { margin: 0 0 16px; opacity: .75; font-size: 12px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 14px; }
  .card { border: 1px solid var(--vscode-panel-border, rgba(128,128,128,.3)); border-radius: 8px;
    overflow: hidden; background: var(--vscode-editorWidget-background); cursor: default;
    transition: outline-color .12s ease; }
  .card.current { outline: 2px solid var(--vscode-focusBorder); outline-offset: -1px; }
  .card.previewing:not(.current) { outline: 2px dashed var(--vscode-focusBorder); outline-offset: -1px; }
  .card.previewing.current { outline-style: solid; }
  .chrome { display: flex; align-items: center; gap: 6px; padding: 6px 8px; font-size: 11px; }
  .dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
  .dot.red { background: #ed6a5e; } .dot.amber { background: #f4bf4f; } .dot.green { background: #61c554; }
  .chrome-name { margin-left: 6px; opacity: .85; font-weight: 600; }
  .preview { display: flex; min-height: 96px; }
  .gutter { width: 10px; flex: 0 0 10px; }
  .code { margin: 0; padding: 10px 12px; font-family: var(--vscode-editor-font-family, monospace);
    font-size: 12px; line-height: 1.5; white-space: pre; overflow: hidden; flex: 1; }
  .statusbar { display: flex; align-items: center; justify-content: space-between;
    padding: 4px 10px; font-size: 11px; }
  .ansis { display: inline-flex; gap: 3px; }
  .ansi { width: 10px; height: 10px; border-radius: 2px; display: inline-block; }
  .actions { display: flex; align-items: center; justify-content: space-between; gap: 8px;
    padding: 8px 10px; border-top: 1px solid var(--vscode-panel-border, rgba(128,128,128,.3)); }
  .title { font-size: 12px; font-weight: 600; }
  .title em { opacity: .6; font-weight: 400; font-style: normal; }
  button.apply { font: inherit; font-size: 12px; cursor: pointer; border: none; border-radius: 4px;
    padding: 4px 12px; color: var(--vscode-button-foreground); background: var(--vscode-button-background); }
  button.apply:hover { background: var(--vscode-button-hoverBackground); }
</style>
</head>
<body>
  <h1>Dusk Office — Theme Gallery</h1>
  <p class="lead">${cards.length} variants from their real palettes. <strong>Hover</strong> to preview in the editor · <strong>Apply</strong> to keep · close the panel to revert unapplied previews.</p>
  <div class="grid">${cards.join("")}</div>
  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    let previewTimer = null;

    function setPreviewingCard(card) {
      document.querySelectorAll(".card.previewing").forEach((el) => el.classList.remove("previewing"));
      if (card) card.classList.add("previewing");
    }

    document.querySelectorAll(".card").forEach((card) => {
      card.addEventListener("mouseenter", () => {
        const theme = card.getAttribute("data-theme");
        if (!theme) return;
        clearTimeout(previewTimer);
        previewTimer = setTimeout(() => {
          setPreviewingCard(card);
          vscode.postMessage({ type: "preview", theme });
        }, 50);
      });
    });

    document.querySelectorAll("button.apply").forEach((btn) => {
      btn.addEventListener("click", (event) => {
        event.stopPropagation();
        const theme = btn.getAttribute("data-theme");
        if (!theme) return;
        vscode.postMessage({ type: "apply", theme });
      });
    });
  </script>
</body>
</html>`;
}

function makeNonce() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < 24; i += 1) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function renderGalleryHtml(_context) {
  // Reads pre-merged data embedded at build time (lib/generated/themes-bundle.js)
  // so the gallery works in the web host with no filesystem access.
  const byName = new Map(themesBundle.map((entry) => [entry.name, entry]));
  const currentTheme = cfg.getCurrentTheme();
  // Curated order first, then any contributed variant the list does not enumerate.
  const ordered = [
    ...THEME_VARIANTS.filter((name) => byName.has(name)),
    ...themesBundle.map((entry) => entry.name).filter((name) => !THEME_VARIANTS.includes(name)),
  ];
  const cards = [];
  for (const name of ordered) {
    const entry = byName.get(name);
    if (!entry) continue;
    try {
      const model = buildThemePreviewModel(entry);
      cards.push(renderCard(name, model, name === currentTheme));
    } catch (err) {
      log.warn("themeGallery:renderCard", err);
    }
  }
  return buildHtml(cards, makeNonce());
}

async function revertGalleryPreview() {
  if (!gallerySession) return;
  const revertTo = resolveGalleryRevertTheme(gallerySession.committed, gallerySession.original);
  if (cfg.getCurrentTheme() === revertTo) return;
  await themes.previewTheme(revertTo);
}

async function handleGalleryMessage(message, context, panel) {
  if (!gallerySession) return;

  if (message?.type === "preview" && typeof message.theme === "string") {
    const plain = stripThemeDisplayLabel(message.theme);
    if (plain === gallerySession.lastPreviewed) return;
    const applied = await themes.previewTheme(message.theme);
    if (applied) {
      gallerySession.lastPreviewed = plain;
    }
    return;
  }

  if (message?.type !== "apply" || typeof message.theme !== "string") {
    log.warn("themeGallery:unexpectedMessage", JSON.stringify(message));
    return;
  }

  log.info("themeGallery:apply", message.theme);
  const applied = await themes.applyTheme(message.theme, context, "manual");
  log.info("themeGallery:applyResult", applied);
  if (applied) {
    gallerySession.committed = cfg.getCurrentTheme();
    gallerySession.lastPreviewed = gallerySession.committed;
    void vscode.window.showInformationMessage(`Theme: ${message.theme}.`);
    panel.webview.html = renderGalleryHtml(context);
  } else {
    void vscode.window.showWarningMessage(`Dusk Office: could not apply "${message.theme}".`);
  }
}

async function openThemeGallery(context) {
  try {
    if (openPanel) {
      resetGallerySession();
      openPanel.reveal(vscode.ViewColumn.Active);
      openPanel.webview.html = renderGalleryHtml(context);
      return;
    }

    resetGallerySession();

    const panel = vscode.window.createWebviewPanel(
      "duskOffice.themeGallery",
      "Dusk Office — Theme Gallery",
      vscode.ViewColumn.Active,
      { enableScripts: true, retainContextWhenHidden: true },
    );
    openPanel = panel;
    panel.webview.html = renderGalleryHtml(context);

    panel.webview.onDidReceiveMessage(async (message) => {
      await handleGalleryMessage(message, context, panel);
    }, undefined, context.subscriptions);

    panel.onDidDispose(async () => {
      if (openPanel === panel) openPanel = null;
      await revertGalleryPreview();
      gallerySession = null;
      state.isThemeGalleryOpen = false;
    }, undefined, context.subscriptions);
  } catch (err) {
    gallerySession = null;
    state.isThemeGalleryOpen = false;
    log.error("openThemeGallery", err);
    void vscode.window.showErrorMessage("Dusk Office: failed to open theme gallery.");
  }
}

module.exports = {
  openThemeGallery,
  renderGalleryHtml,
  resolveGalleryRevertTheme,
};
