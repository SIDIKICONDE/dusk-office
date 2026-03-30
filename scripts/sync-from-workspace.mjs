#!/usr/bin/env node
/**
 * Régénère themes/nyx.json à partir de `.vscode/settings.json` à la racine du dépôt.
 *
 * Cherche la racine dans cet ordre :
 *   1) Monorepo Nythy : …/Nythy/.vscode/settings.json (3 niveaux au-dessus de scripts/)
 *   2) Repo autonome Nyx : …/Nyx/.vscode/settings.json (1 niveau au-dessus de scripts/)
 *
 * Usage :
 *   node scripts/sync-from-workspace.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const standaloneRoot = path.resolve(__dirname, "..");
const monorepoRoot = path.resolve(__dirname, "..", "..", "..");
const nythyLayout = fs.existsSync(
  path.join(monorepoRoot, "extensions", "nyx-theme", "package.json")
);

let repoRoot;
if (
  nythyLayout &&
  fs.existsSync(path.join(monorepoRoot, ".vscode", "settings.json"))
) {
  repoRoot = monorepoRoot;
} else if (
  fs.existsSync(path.join(standaloneRoot, ".vscode", "settings.json"))
) {
  repoRoot = standaloneRoot;
} else {
  console.error(
    "Aucun .vscode/settings.json trouvé à la racine du dépôt Nyx ou du monorepo Nythy."
  );
  process.exit(1);
}

const settingsPath = path.join(repoRoot, ".vscode", "settings.json");
const themePath = path.join(__dirname, "..", "themes", "nyx.json");

const raw = fs.readFileSync(settingsPath, "utf8");
let s = raw.replace(/\/\/[^\n]*/g, "");
s = s.replace(/,\s*([\]}])/g, "$1");
const j = JSON.parse(s);

const colors = { ...j["workbench.colorCustomizations"] };
delete colors["outline.icons"];

const tokenColors =
  j["editor.tokenColorCustomizations"]?.textMateRules ?? [];
const semRules =
  j["editor.semanticTokenColorCustomizations"]?.rules ?? {};
const semanticTokenColors = {};

for (const [k, v] of Object.entries(semRules)) {
  if (typeof v === "string") {
    semanticTokenColors[k] = v;
    continue;
  }
  const o = {};
  if (v.foreground) o.foreground = v.foreground;
  if (v.bold === true) o.bold = true;
  if (v.italic === true) o.italic = true;
  if (v.strikethrough === true) o.strikethrough = true;
  if (v.underline === true) o.underline = true;
  semanticTokenColors[k] =
    Object.keys(o).length === 1 && o.foreground ? o.foreground : o;
}

const theme = {
  $schema: "vscode://schemas/color-theme",
  name: "Nyx",
  type: "dark",
  semanticHighlighting: true,
  colors,
  tokenColors,
  semanticTokenColors,
};

fs.writeFileSync(themePath, JSON.stringify(theme, null, 2) + "\n", "utf8");
console.log("OK →", path.relative(repoRoot, themePath), "(racine:", repoRoot + ")");
