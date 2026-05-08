#!/usr/bin/env node
/**
 * Installe le dernier <package.name>-*.vsix du dossier de l’extension.
 */
import { readdirSync, existsSync, statSync, readFileSync } from "fs";
import { spawnSync } from "child_process";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const pkgName = pkg.name;

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

function resolveCli(preferred) {
  const { platform } = process;
  const local = process.env.LOCALAPPDATA || "";

  const fixedCursor =
    platform === "darwin"
      ? "/Applications/Cursor.app/Contents/Resources/app/bin/cursor"
      : platform === "win32"
        ? join(local, "Programs", "cursor", "resources", "app", "bin", "cursor.cmd")
        : null;

  const fixedCode =
    platform === "darwin"
      ? "/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code"
      : platform === "win32"
        ? join(local, "Programs", "Microsoft VS Code", "bin", "code.cmd")
        : null;

  const chainCursor = () =>
    fixedCursor && existsSync(fixedCursor)
      ? fixedCursor
      : firstOnPath("cursor");

  const chainCode = () =>
    fixedCode && existsSync(fixedCode) ? fixedCode : firstOnPath("code");

  if (preferred === "code") return chainCode() ?? null;
  if (preferred === "cursor") return chainCursor() ?? null;

  return chainCursor() ?? chainCode() ?? null;
}

const vsix = findLatestVsix(root);
if (!vsix) {
  console.error(
    `Aucun ${pkgName}-*.vsix trouvé. Lance d’abord : npm run package`
  );
  process.exit(1);
}

const flag = process.argv.find((a) => a.startsWith("--editor="));
const preferred = flag ? flag.split("=")[1] : "auto";
const cli = resolveCli(preferred);
if (!cli) {
  console.error(
    "Aucun binaire « cursor » ou « code » trouvé. Ajoute-le au PATH ou installe Cursor / VS Code."
  );
  process.exit(1);
}

console.log("Installation :", vsix);
console.log("CLI :", cli);

const shell =
  process.platform === "win32" && /\.(cmd|bat)$/i.test(cli);
const r = spawnSync(cli, ["--install-extension", vsix], {
  stdio: "inherit",
  shell,
});
process.exit(r.status ?? 1);
