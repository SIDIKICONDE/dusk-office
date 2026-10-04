#!/usr/bin/env node
/**
 * Web bundle load test using Playwright directly.
 *
 * Scope, stated plainly so this is not over-read: outside the VS Code web extension
 * host there is no `require` shim and no `module`, so the bundle cannot fully
 * evaluate here. What this proves is that the browser-target bundle is delivered,
 * parses, and reaches its first `require("vscode")` without any Node-only module
 * error. It does NOT prove `activate()` runs — that needs the real host, which is
 * what `tests/web-suite/index.js` is for (see `npm run test:web:host`).
 *
 * The load check asserts the script actually evaluated rather than merely being
 * fetched, because `script.onload` fires even for a script that threw at runtime.
 *
 * Usage: node tests/test-web-activation.mjs
 */
import { execFileSync } from "child_process";
import { chromium } from "playwright";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "fs";
import { createServer } from "http";
import { tmpdir } from "os";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const distDir = resolve(root, "dist");
const scratchDir = mkdtempSync(join(tmpdir(), "dusk-office-web-test-"));
const testHtmlPath = join(scratchDir, "test.html");

async function launchChromium() {
  try {
    return await chromium.launch({ headless: true, args: ["--no-sandbox", "--disable-gpu"] });
  } catch (err) {
    if (!/Executable doesn't exist/i.test(String(err.message))) throw err;
    console.log("Chromium missing — installing via: npx playwright install chromium");
    execFileSync("npx", ["playwright", "install", "chromium"], { stdio: "inherit" });
    return chromium.launch({ headless: true, args: ["--no-sandbox", "--disable-gpu"] });
  }
}

function cleanup() {
  try {
    rmSync(scratchDir, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
}

// --- Mini HTTP server to serve dist/ + scratch test page ---
const server = await new Promise((resolveServer) => {
  const s = createServer((req, res) => {
    const urlPath = req.url === "/" ? "/test.html" : req.url;
    if (urlPath === "/test.html") {
      try {
        const data = readFileSync(testHtmlPath);
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(data);
        return;
      } catch {
        res.writeHead(404);
        res.end("Not found");
        return;
      }
    }

    const filePath = resolve(distDir, urlPath.slice(1));
    if (filePath.startsWith(distDir)) {
      try {
        const data = readFileSync(filePath);
        const ext = filePath.endsWith(".js") ? "application/javascript" : "text/html";
        res.writeHead(200, { "Content-Type": ext });
        res.end(data);
      } catch {
        res.writeHead(404);
        res.end("Not found");
      }
    } else {
      res.writeHead(403);
      res.end("Forbidden");
    }
  });
  s.listen(0, "127.0.0.1", () => resolveServer(s));
});

const port = server.address().port;
const baseUrl = `http://127.0.0.1:${port}`;

const testHtml = `<!DOCTYPE html>
<html>
<head><title>Dusk Office Web Test</title></head>
<body>
<h1>Web Bundle Load Test</h1>
<pre id="log">Waiting…</pre>
<script>
  const log = document.getElementById("log");
  // Record every error the bundle produces so the runner can assert the set is
  // exactly the expected "no CJS shim outside the extension host" one.
  window.__errors = [];
  window.addEventListener("error", (e) => window.__errors.push(String(e.message)));
  function run() {
    log.textContent = "Loading bundle via script tag…";
    const script = document.createElement("script");
    script.src = "/web/extension.js";
    // A syntax error or 404 fires onerror and never reaches onload, so reaching
    // onload is itself the "it parses and was served" assertion.
    script.onerror = () => {
      log.textContent = "FAIL: script load error";
      console.log("TEST_RESULT:FAIL:script load error");
    };
    script.onload = () => {
      log.textContent = "PASS: bundle parsed and loaded";
      console.log("TEST_RESULT:PASS");
    };
    document.head.appendChild(script);
  }
  run();
</script>
</body>
</html>`;

writeFileSync(testHtmlPath, testHtml);

console.log(`▶ test-web-activation: serving dist/ on ${baseUrl}`);

try {
  const browser = await launchChromium();
  const page = await browser.newPage();

  const results = [];
  page.on("console", (msg) => {
    const text = msg.text();
    results.push(text);
    console.log("  browser:", text);
  });
  page.on("pageerror", (err) => {
    results.push("PAGE_ERROR:" + err.message);
    console.log("  pageerror:", err.message);
  });

  await page.goto(`${baseUrl}/test.html`, { waitUntil: "load" });

  await page.waitForFunction(() => {
    const el = document.getElementById("log");
    return el && (el.textContent.startsWith("PASS") || el.textContent.startsWith("FAIL"));
  }, { timeout: 20000 }).catch(() => null);

  await page.waitForTimeout(3000);

  await browser.close();
  server.close();
  cleanup();

  const passLine = results.find((r) => r.startsWith("TEST_RESULT:PASS"));
  const failLine = results.find((r) => r.startsWith("TEST_RESULT:FAIL"));
  const pageErrors = results.filter((r) => r.startsWith("PAGE_ERROR:"));

  // Outside the extension host the bundle stops at its first `require("vscode")`.
  // That single error is the expected outcome; anything else is a real defect
  // (a Node builtin slipped into the browser bundle, a syntax error, a bad path).
  const EXPECTED = "require is not defined";
  const unexpected = pageErrors.filter((r) => !r.includes(EXPECTED));

  if (failLine || !passLine) {
    const reason = failLine
      ? failLine.replace("TEST_RESULT:FAIL:", "")
      : "timeout waiting for the bundle to load";
    console.log("\n✖ FAIL — " + reason);
    process.exit(1);
  }

  if (unexpected.length > 0) {
    console.log("\n✖ FAIL — unexpected error(s) in web bundle: " + unexpected.join("; "));
    process.exit(1);
  }

  console.log(
    "\n✔ PASS — web bundle parses and loads; only the expected \"" + EXPECTED +
    "\" host error occurred.\n  Note: this does not run activate(). Use `npm run test:web:host` for that.",
  );
  process.exit(0);
} catch (err) {
  console.error("✖ Test runner error:", err.message);
  server.close();
  cleanup();
  process.exit(1);
}
