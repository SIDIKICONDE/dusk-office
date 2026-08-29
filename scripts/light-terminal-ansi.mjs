/**
 * ANSI palette for light terminal backgrounds (Light, Ivory, Ledger, Audit).
 * Injected by build-dusk-light.mjs / build-dusk-ivoire.mjs; apply to other `vs` themes via
 * `node scripts/apply-light-terminal-ansi.mjs`.
 * Tuned for ≥2.9:1 on warm panels (#e8e2d9 … #f8fafc).
 */
export const LIGHT_TERMINAL_ANSI = {
  "terminal.ansiBlack": "#585651",
  "terminal.ansiRed": "#ba7068",
  "terminal.ansiGreen": "#6c8a77",
  "terminal.ansiYellow": "#a07e48",
  "terminal.ansiBlue": "#617e93",
  "terminal.ansiMagenta": "#867e9c",
  "terminal.ansiCyan": "#638b8b",
  "terminal.ansiWhite": "#3c474f",
  "terminal.ansiBrightBlack": "#8a9499",
  "terminal.ansiBrightRed": "#b0726b",
  "terminal.ansiBrightGreen": "#718a77",
  "terminal.ansiBrightYellow": "#a07e4a",
  "terminal.ansiBrightBlue": "#688497",
  "terminal.ansiBrightMagenta": "#877e9c",
  "terminal.ansiBrightCyan": "#638b8b",
  "terminal.ansiBrightWhite": "#24313a",
};

/** Panel + terminal header borders — low-alpha dark borders vanish on #f1f5f9. */
export const LIGHT_PANEL_TERMINAL_CHROME = {
  "panel.border": "#94a3b8b8",
  "panelSectionHeader.border": "#94a3b8b8",
  "panelInput.border": "#94a3b8b8",
  "panelTitle.border": "#64748baa",
  "panelTitle.activeBorder": "#0ea5e9cc",
  "terminal.border": "#94a3b8aa",
  "terminalStickyScroll.border": "#94a3b8aa",
  "terminal.tab.activeBorder": "#0369a1",
};

/** Ivory — terracotta chrome; must win over LIGHT_PANEL_TERMINAL_CHROME. */
export const IVOIRE_PANEL_TERMINAL_CHROME = {
  "panel.border": "#8a7a6ab8",
  "panelSectionHeader.border": "#8a7a6ab8",
  "panelInput.border": "#8a7a6ab8",
  "panelTitle.border": "#8a7a6a99",
  "panelTitle.activeBorder": "#92400ecc",
  "terminal.border": "#8a7a6aaa",
  "terminalStickyScroll.border": "#8a7a6aaa",
  "terminal.tab.activeBorder": "#92400e",
};

/**
 * @param {Record<string, string>} colors
 * @param {Record<string, string>} [panelChrome]
 */
export function applyLightTerminalAnsi(colors, panelChrome = LIGHT_PANEL_TERMINAL_CHROME) {
  Object.assign(colors, LIGHT_TERMINAL_ANSI, panelChrome);
}
