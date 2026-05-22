#!/usr/bin/env node
/**
 * Installe le dernier <package.name>-*.vsix du dossier de l’extension.
 *
 * Éditeurs compatibles VS Code (CLI --install-extension) :
 *   cursor | windsurf | code | code-insiders | codium | vscodium | auto
 *
 *   make install-vsix EDITOR=windsurf
 *   node scripts/install-vsix.mjs --editor=code
 *   node scripts/install-vsix.mjs --list
 */
import { readdirSync, existsSync, statSync, readFileSync } from "fs";
import { spawnSync } from "child_process";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const pkgName = pkg.name;

/** @type {{ id: string, bins: string[], fixed?: Partial<Record<NodeJS.Platform, string | ((local: string) => string)>>, autoOrder: number }[]} */
const VSCODE_COMPATIBLE_EDITORS = [
  {
    id: "cursor",
    bins: ["cursor"],
    autoOrder: 1,
    fixed: {
      darwin:
        "/Applications/Cursor.app/Contents/Resources/app/bin/cursor",
      win32: (local) =>
        join(local, "Programs", "cursor", "resources", "app", "bin", "cursor.cmd"),
    },
  },
  {
    id: "windsurf",
    bins: ["windsurf"],
    autoOrder: 2,
    fixed: {
      darwin:
        "/Applications/Windsurf.app/Contents/Resources/app/bin/windsurf",
      win32: (local) =>
        join(
          local,
          "Programs",
          "Windsurf",
          "resources",
          "app",
          "bin",
          "windsurf.cmd",
        ),
    },
  },
  {
    id: "code",
    bins: ["code"],
    autoOrder: 3,
    fixed: {
      darwin:
        "/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code",
      win32: (local) =>
        join(local, "Programs", "Microsoft VS Code", "bin", "code.cmd"),
    },
  },
  {
    id: "code-insiders",
    bins: ["code-insiders"],
    autoOrder: 4,
    fixed: {
      darwin:
        "/Applications/Visual Studio Code - Insiders.app/Contents/Resources/app/bin/code-insiders",
      win32: (local) =>
        join(
          local,
          "Programs",
          "Microsoft VS Code Insiders",
          "bin",
          "code-insiders.cmd",
        ),
    },
  },
  {
    id: "codium",
    bins: ["codium", "vscodium"],
    autoOrder: 5,
    fixed: {
      darwin:
        "/Applications/VSCodium.app/Contents/Resources/app/bin/codium",
      win32: (local) =>
        join(
          local,
          "Programs",
          "VSCodium",
          "bin",
          "codium.cmd",
        ),
    },
  },
];

const EDITOR_ALIASES = {
  vscodium: "codium",
  vscode: "code",
  "vs-code": "code",
  "code-insider": "code-insiders",
};

function findLatestVsix(dir) {
  const re = new RegExp(`^${pkgName}-.*\\.vsix$`, "i");
  const files = readdirSync(dir).filter((f) => re.test(f));
  if (files.length === 0) return null;
  return files
    .map((f) => ({ f, m: join(dir, f) }))
    .sort((a, b) => {
      const mtime = (p) => {
        try {
          return statSync(p).mtimeMs;
        } catch {
          return 0;
        }
      };
      return mtime(b.m) - mtime(a.m);
    })[0].m;
}

/** PATH lookup: `which` (Unix) / `where.exe` (Windows). */
function firstOnPath(cmd) {
  const win = process.platform === "win32";
  const bin = win ? "where.exe" : "which";
  const r = spawnSync(bin, [cmd], { encoding: "utf8", shell: false });
  if (r.status !== 0 || !r.stdout?.trim()) return null;
  const line = r.stdout.split(/\r?\n/).find((l) => l.trim().length > 0);
  return line?.trim() ?? null;
}

function fixedPath(def) {
  const { platform } = process;
  const entry = def.fixed?.[platform];
  if (!entry) return null;
  const local = process.env.LOCALAPPDATA || "";
  const path = typeof entry === "function" ? entry(local) : entry;
  return path && existsSync(path) ? path : null;
}

/** @param {{ id: string, bins: string[] }} def */
function resolveEditorCli(def) {
  const fixed = fixedPath(def);
  if (fixed) return fixed;
  for (const bin of def.bins) {
    const onPath = firstOnPath(bin);
    if (onPath) return onPath;
  }
  return null;
}

function normalizeEditorId(preferred) {
  const key = preferred.trim().toLowerCase();
  return EDITOR_ALIASES[key] ?? key;
}

function editorDef(preferred) {
  const id = normalizeEditorId(preferred);
  return VSCODE_COMPATIBLE_EDITORS.find((d) => d.id === id) ?? null;
}

function resolveCli(preferred) {
  const id = normalizeEditorId(preferred);

  if (id === "auto") {
    const sorted = [...VSCODE_COMPATIBLE_EDITORS].sort(
      (a, b) => a.autoOrder - b.autoOrder,
    );
    for (const def of sorted) {
      const cli = resolveEditorCli(def);
      if (cli) return { cli, id: def.id };
    }
    return null;
  }

  const def = editorDef(id);
  if (!def) return null;
  const cli = resolveEditorCli(def);
  return cli ? { cli, id: def.id } : null;
}

function listDetectedEditors() {
  console.log("Éditeurs compatibles VS Code détectés :\n");
  let any = false;
  for (const def of VSCODE_COMPATIBLE_EDITORS) {
    const cli = resolveEditorCli(def);
    const bins = def.bins.join(", ");
    if (cli) {
      any = true;
      console.log(`  ✓ ${def.id.padEnd(14)} ${cli}`);
    } else {
      console.log(`  · ${def.id.padEnd(14)} (non trouvé — binaires : ${bins})`);
    }
  }
  if (!any) {
    console.log(
      "\nAucun CLI trouvé. Installe un éditeur ci-dessus ou ajoute son binaire au PATH.",
    );
  } else {
    console.log(
      "\nInstallation : npm run package && make install-vsix EDITOR=<id>",
    );
    console.log(
      "IDs : " + VSCODE_COMPATIBLE_EDITORS.map((d) => d.id).join(", "),
    );
  }
}

const listOnly = process.argv.includes("--list");
if (listOnly) {
  listDetectedEditors();
  process.exit(0);
}

const vsix = findLatestVsix(root);
if (!vsix) {
  console.error(
    `Aucun ${pkgName}-*.vsix trouvé. Lance d’abord : npm run package`,
  );
  process.exit(1);
}

const flag = process.argv.find((a) => a.startsWith("--editor="));
const preferred =
  flag?.split("=")[1] ??
  process.env.DUSK_OFFICE_EDITOR ??
  process.env.VSCODE_EDITOR ??
  "auto";
const resolved = resolveCli(preferred);
if (!resolved) {
  const ids = VSCODE_COMPATIBLE_EDITORS.map((d) => d.id).join(", ");
  console.error(
    `Aucun CLI d’éditeur trouvé pour « ${preferred} ».\n` +
      `Essayez : node scripts/install-vsix.mjs --list\n` +
      `IDs supportés : auto, ${ids}`,
  );
  process.exit(1);
}

const { cli, id } = resolved;
console.log("Installation :", vsix);
console.log("Éditeur :", id);
console.log("CLI :", cli);

const shell =
  process.platform === "win32" && /\.(cmd|bat)$/i.test(cli);
const r = spawnSync(cli, ["--install-extension", vsix], {
  stdio: "inherit",
  shell,
});
process.exit(r.status ?? 1);
