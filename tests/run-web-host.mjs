#!/usr/bin/env node
/**
 * Real web extension host test via @vscode/test-web.
 *
 * This is the only test that actually runs `activate()` inside a browser-based
 * extension host (a Web Worker with no Node builtins). `tests/test-web-activation.mjs`
 * only proves the bundle parses; the node suite runs against a mock.
 *
 * Uses `tests/web-suite/index.js` as the in-host test entry point.
 *
 * Usage: node tests/run-web-host.mjs
 */
import { runTests } from "@vscode/test-web";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

console.log("▶ test-web:host — activating the extension in a real web extension host…");

const timeoutMs = Number(process.env.DUSK_WEB_HOST_TIMEOUT_MS ?? 240000);

// test-web signals completion through the browser page, and its promise never settles
// if the host never loads the test module. Bound it so a broken harness fails loudly
// instead of hanging CI.
let timer;
const guard = new Promise((_, reject) => {
  timer = setTimeout(
    () =>
      reject(
        new Error(
          `web extension host did not report a result within ${timeoutMs}ms. ` +
            "The in-host suite may have failed to load — check that " +
            "tests/web-suite/index.js is reachable and exports run().",
        ),
      ),
    timeoutMs,
  );
});

try {
  await Promise.race([
    runTests({
      extensionDevelopmentPath: root,
      extensionTestsPath: resolve(__dirname, "web-suite", "index.js"),
      // test-web drives a real browser; without this it looks for
      // options.browserType (undefined) and aborts before starting.
      browserType: "chromium",
      headless: true,
      launchArgs: ["--disable-extensions", "--disable-gpu"],
    }),
    guard,
  ]);
  console.log(
    "\n✔ PASS — extension activated in the web extension host (no Node builtins available)",
  );
  process.exit(0);
} catch (err) {
  console.error("\n✖ FAIL — web extension host test failed:");
  console.error(err && err.message ? err.message : err);
  process.exit(1);
} finally {
  clearTimeout(timer);
}