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

function resolveCli(preferred) {
  const darwin = process.platform === "darwin";
  const cursorApp =
    darwin &&
    "/Applications/Cursor.app/Contents/Resources/app/bin/cursor";
  const codeApp =
    darwin &&
    "/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code";

  const order =
    preferred === "code"
      ? [codeApp, "code"].filter(Boolean)
      : preferred === "cursor"
        ? [cursorApp, "cursor"].filter(Boolean)
        : [cursorApp, "cursor", codeApp, "code"].filter(Boolean);

  for (const c of order) {
    if (typeof c === "string" && c.startsWith("/")) {
      if (existsSync(c)) return c;
      continue;
    }
    const r = spawnSync("which", [c], { encoding: "utf8" });
    if (r.status === 0 && r.stdout.trim()) return c;
  }
  return null;
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

const r = spawnSync(cli, ["--install-extension", vsix], {
  stdio: "inherit",
  shell: false,
});
process.exit(r.status ?? 1);
