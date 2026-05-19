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

/** @param {Record<string, string>} colors */
export function applyLightTerminalAnsi(colors) {
  Object.assign(colors, LIGHT_TERMINAL_ANSI);
}
