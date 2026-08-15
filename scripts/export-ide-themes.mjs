#!/usr/bin/env node
/**
 * Exporte les thèmes Dusk Office vers d'autres IDE (Neovim, Emacs, Zed, Helix, JetBrains, Base16).
 *
 *   npm run export:ide
 *   node scripts/export-ide-themes.mjs [--only neovim,emacs]
 */
import { mkdirSync, writeFileSync, rmSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { listThemeFiles, resolveTheme } from "../lib/export/theme-resolve.mjs";
import { buildExportPalette } from "../lib/export/theme-export-palette.mjs";
import {
  toBase16Yaml,
  toEmacsEl,
  toGhosttyConf,
  toHelixToml,
  toJetBrainsIcls,
  toKittyConf,
  toNeovimLua,
  toPaletteJson,
  toVscodeResolvedJson,
  toWarpYaml,
  toWezTermToml,
  toWindowsTerminalJson,
  toZedJson,
} from "../lib/export/export-formats.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT = join(ROOT, "exports");

const FORMATS = {
  vscode: {
    dir: "vscode",
    ext: ".json",
    render: (palette, resolved) => toVscodeResolvedJson(palette, resolved),
  },
  palettes: { dir: "palettes", ext: ".json", render: toPaletteJson },
  base16: { dir: "base16", ext: ".yaml", render: toBase16Yaml },
  neovim: { dir: "neovim/colors", ext: ".lua", render: toNeovimLua },
  emacs: { dir: "emacs", ext: "-theme.el", render: toEmacsEl },
  zed: { dir: "zed", ext: ".json", render: toZedJson },
  helix: { dir: "helix", ext: ".toml", render: toHelixToml },
  jetbrains: { dir: "jetbrains", ext: ".icls", render: toJetBrainsIcls },
  ghostty: { dir: "ghostty", ext: ".conf", render: toGhosttyConf },
  wezterm: { dir: "wezterm", ext: ".toml", render: toWezTermToml },
  warp: { dir: "warp", ext: ".yaml", render: toWarpYaml },
  "windows-terminal": { dir: "windows-terminal", ext: ".json", render: toWindowsTerminalJson },
  kitty: { dir: "kitty", ext: ".conf", render: toKittyConf },
};

function parseOnlyArg() {
  const flag = process.argv.find((a) => a.startsWith("--only="));
  if (!flag) return Object.keys(FORMATS);
  return flag
    .split("=")[1]
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function writeExports() {
  const only = parseOnlyArg();
  for (const key of only) {
    if (!FORMATS[key]) {
      console.error(`Format inconnu: ${key}. Valides: ${Object.keys(FORMATS).join(", ")}`);
      process.exit(1);
    }
  }

  if (existsSync(OUT)) {
    for (const key of only) {
      const sub = join(OUT, FORMATS[key].dir);
      if (existsSync(sub)) rmSync(sub, { recursive: true, force: true });
    }
  }

  const files = listThemeFiles();
  let count = 0;

  for (const themeFile of files) {
    const resolved = resolveTheme(themeFile);
    const palette = buildExportPalette(resolved);
    const slug = palette.slug;

    for (const key of only) {
      const fmt = FORMATS[key];
      const dir = join(OUT, fmt.dir);
      mkdirSync(dir, { recursive: true });
      const name = `${slug}${fmt.ext}`;
      const outPath = join(dir, name);
      const body =
        key === "vscode"
          ? fmt.render(palette, {
              tokenColors: resolved.tokenColors,
              semanticTokenColors: resolved.semanticTokenColors,
            })
          : fmt.render(palette);
      writeFileSync(outPath, body, "utf8");
      count++;
    }
  }

  mkdirSync(OUT, { recursive: true });
  console.log(
    `[OK] ${files.length} thèmes × ${only.length} format(s) → ${count} fichiers dans exports/`,
  );
}

writeExports();
