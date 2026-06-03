#!/usr/bin/env node
/**
 * Web extension bundle smoke test.
 * Verifies the esbuild browser target is valid for the web extension host
 * (vscode.dev / github.dev) without needing a headless browser.
 *
 * Checks:
 *   1. dist/web/extension.js and dist/node/extension.js exist
 *   2. Web bundle contains no Node-only imports (fs, path, child_process, net, http)
 *   3. vscode is external (not inlined)
 *   4. package.json has "browser" field pointing to dist/web/extension.js
 *   5. Theme data is embedded (themes-bundle)
 *   6. Bundle parses as valid JS
 *
 * For full browser-based activation testing, install Chromium and run:
 *   node -e "const{runTests}=require('@vscode/test-web');runTests({extensionDevelopmentPath:process.cwd(),extensionTestsPath:process.cwd()+'/dist/web/extension.js'}).then(()=>process.exit(0)).catch(e=>{console.error(e);process.exit(1)})"
 *
 * Usage: node scripts/test-web.mjs
 */
import { readFileSync, existsSync, statSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const webBundle = resolve(root, "dist/web/extension.js");
const nodeBundle = resolve(root, "dist/node/extension.js");
const pkgPath = resolve(root, "package.json");

let failures = 0;

function assert(condition, label) {
  if (!condition) {
    console.error(`  ✖ ${label}`);
    failures++;
  } else {
    console.log(`  ✔ ${label}`);
  }
}

console.log("▶ test-web: verifying web extension bundle…\n");

// 1. Bundle existence
console.log("1. Bundle existence");
assert(existsSync(webBundle), `web bundle exists (${existsSync(webBundle) ? statSync(webBundle).size + " bytes" : "missing"})`);
assert(existsSync(nodeBundle), `node bundle exists (${existsSync(nodeBundle) ? statSync(nodeBundle).size + " bytes" : "missing"})`);

// 2. No Node-only imports in web bundle
console.log("\n2. Node-only imports in web bundle");
const webSrc = readFileSync(webBundle, "utf8");
const nodeOnlyPattern = /require\(["']fs["']\)|require\(["']path["']\)|require\(["']child_process["']\)|require\(["']net["']\)|require\(["']http["']\)/;
assert(!nodeOnlyPattern.test(webSrc), "no fs/path/child_process/net/http imports");

// 3. vscode is external
console.log("\n3. vscode module");
assert(!/function vscode|var vscode = /.test(webSrc), "vscode is external (not inlined)");

// 4. package.json browser field
console.log("\n4. package.json");
const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
assert(pkg.main === "./dist/node/extension.js", `"main" → ${pkg.main}`);
assert(pkg.browser === "./dist/web/extension.js", `"browser" → ${pkg.browser}`);
assert(Array.isArray(pkg.extensionKind), `extensionKind: ${JSON.stringify(pkg.extensionKind)}`);

// 5. Theme data embedded
console.log("\n5. Theme data embedded in bundle");
assert(webSrc.includes("Dusk Office") && webSrc.includes("editor.background"), "themes-bundle data present");

// 6. Bundle parses as valid JS
console.log("\n6. Bundle syntax");
let syntaxOk = true;
try {
  new Function(webSrc);
} catch (e) {
  syntaxOk = false;
  console.error(`  ✖ Syntax error: ${e.message}`);
  failures++;
}
if (syntaxOk) console.log("  ✔ Bundle parses as valid JS");

// Verdict
console.log("\n" + "=".repeat(40));
if (failures === 0) {
  console.log("PASS — web extension bundle is valid");
  process.exit(0);
} else {
  console.log(`FAIL — ${failures} check(s) failed`);
  process.exit(1);
}
