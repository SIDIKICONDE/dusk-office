#!/usr/bin/env node
/**
 * Bundles the extension with esbuild into two targets:
 *   - dist/node/extension.js  (Node extension host — desktop VS Code, Cursor, Windsurf)
 *   - dist/web/extension.js   (Web Worker host — vscode.dev / github.dev)
 *
 * `vscode` is always external (provided by the host). The runtime graph is
 * filesystem-free (theme data is embedded via lib/generated/themes-bundle.js and
 * workspace reads go through vscode.workspace.fs), so the browser target needs
 * no Node polyfills.
 *
 * Run: node scripts/build-extension.mjs [--watch]
 */
import esbuild from "esbuild";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const watch = process.argv.includes("--watch");

const shared = {
  entryPoints: [path.join(root, "extension.js")],
  bundle: true,
  external: ["vscode"],
  minify: !watch,
  sourcemap: watch,
  logLevel: "info",
  absWorkingDir: root,
};

const targets = [
  { ...shared, platform: "node", format: "cjs", target: "node18", outfile: "dist/node/extension.js" },
  { ...shared, platform: "browser", format: "cjs", target: "es2020", outfile: "dist/web/extension.js" },
];

if (watch) {
  const contexts = await Promise.all(targets.map((t) => esbuild.context(t)));
  await Promise.all(contexts.map((c) => c.watch()));
  console.log("esbuild: watching node + web targets…");
} else {
  await Promise.all(targets.map((t) => esbuild.build(t)));
  console.log("OK build-extension: dist/node/extension.js + dist/web/extension.js");
}
