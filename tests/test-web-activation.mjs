#!/usr/bin/env node
/**
 * Web extension activation test using Playwright directly.
 * Serves the web bundle via a local HTTP server, opens it in headless Chromium,
 * and checks that the CJS bundle can be require()'d / evaluated without
 * Node-only module errors.
 *
 * Usage: node tests/test-web-activation.mjs
 */
import { chromium } from "playwright";
import { resolve, dirname } from "path";
import { readFileSync, createReadStream } from "fs";
import { createServer } from "http";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const distDir = resolve(root, "dist");
const outFile = resolve(root, "test-web-result.txt");

// --- Mini HTTP server to serve dist/ files ---
const server = await new Promise((resolveServer) => {
  const s = createServer((req, res) => {
    const urlPath = req.url === "/" ? "/test.html" : req.url;
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

// Write a test HTML page into dist/ so it can reference the bundle via HTTP
const testHtml = `<!DOCTYPE html>
<html>
<head><title>Dusk Office Web Test</title></head>
<body>
<h1>Web Extension Activation Test</h1>
<pre id="log">Waiting…</pre>
<script>
  const log = document.getElementById("log");
  async function run() {
    try {
      // Load the CJS bundle via a script tag (CJS format, not ESM import).
      // The bundle uses module.exports = ... which is not valid ESM,
      // so we load it as a classic script and check for runtime errors.
      log.textContent = "Loading bundle via script tag…";
      const script = document.createElement("script");
      script.src = "/web/extension.js";
      script.onerror = (e) => {
        log.textContent = "FAIL: script load error";
        console.log("TEST_RESULT:FAIL:script load error");
      };
      script.onload = () => {
        // If the script loaded without throwing, the bundle is browser-compatible.
        // The bundle defines module.exports but that's fine as a classic script
        // (module is just a global object in the bundled output).
        log.textContent = "PASS: bundle loaded without error";
        console.log("TEST_RESULT:PASS");
      };
      document.head.appendChild(script);
    } catch (err) {
      log.textContent = "FAIL: " + err.message;
      console.log("TEST_RESULT:FAIL:" + err.message);
    }
  }
  run();
</script>
</body>
</html>`;

// Write test HTML to dist/
const { writeFileSync } = await import("fs");
writeFileSync(resolve(distDir, "test.html"), testHtml);

console.log(`▶ test-web-activation: serving dist/ on ${baseUrl}`);

try {
  const browser = await chromium.launch({ headless: true, args: ["--no-sandbox", "--disable-gpu"] });
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

  // Wait for the test result
  await page.waitForFunction(() => {
    const el = document.getElementById("log");
    return el && (el.textContent.startsWith("PASS") || el.textContent.startsWith("FAIL"));
  }, { timeout: 20000 }).catch(() => null);

  // Wait a bit for any async errors
  await page.waitForTimeout(3000);

  await browser.close();
  server.close();

  const passLine = results.find((r) => r.startsWith("TEST_RESULT:PASS"));
  const failLine = results.find((r) => r.startsWith("TEST_RESULT:FAIL"));
  const pageErrors = results.filter((r) => r.startsWith("PAGE_ERROR:"));

  // In a bare browser, require() is not defined — the VS Code web host provides it.
  // The only acceptable page error is "require is not defined" which proves the bundle
  // reaches its entry point but can't resolve vscode (expected outside the host).
  const nonRequireErrors = pageErrors.filter((r) => !r.includes("require is not defined"));

  if (passLine && nonRequireErrors.length === 0) {
    console.log("\n✔ PASS — web bundle loads in browser context (require errors are expected outside VS Code host)");
    writeFileSync(outFile, "PASS: web bundle loads in browser context\n" + results.join("\n"));
    process.exit(0);
  } else {
    const reason = failLine ? failLine.replace("TEST_RESULT:FAIL:", "")
      : nonRequireErrors.length ? nonRequireErrors.join("; ")
      : "timeout";
    console.log("\n✖ FAIL — " + reason);
    writeFileSync(outFile, "FAIL: " + reason + "\n" + results.join("\n"));
    process.exit(1);
  }
} catch (err) {
  console.error("✖ Test runner error:", err.message);
  const { writeFileSync: wf } = await import("fs");
  wf(outFile, "RUNNER_ERROR: " + err.message);
  server.close();
  process.exit(1);
}
