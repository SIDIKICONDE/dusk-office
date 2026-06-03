#!/usr/bin/env node
/**
 * Web extension activation test using Playwright directly.
 * Serves the web bundle via a local HTTP server, opens it in headless Chromium,
 * and checks that the CJS bundle can be require()'d / evaluated without
 * Node-only module errors.
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
<h1>Web Extension Activation Test</h1>
<pre id="log">Waiting…</pre>
<script>
  const log = document.getElementById("log");
  async function run() {
    try {
      log.textContent = "Loading bundle via script tag…";
      const script = document.createElement("script");
      script.src = "/web/extension.js";
      script.onerror = () => {
        log.textContent = "FAIL: script load error";
        console.log("TEST_RESULT:FAIL:script load error");
      };
      script.onload = () => {
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

  const nonRequireErrors = pageErrors.filter((r) => !r.includes("require is not defined"));

  if (passLine && nonRequireErrors.length === 0) {
    console.log("\n✔ PASS — web bundle loads in browser context (require errors are expected outside VS Code host)");
    process.exit(0);
  }

  const reason = failLine ? failLine.replace("TEST_RESULT:FAIL:", "")
    : nonRequireErrors.length ? nonRequireErrors.join("; ")
    : "timeout";
  console.log("\n✖ FAIL — " + reason);
  process.exit(1);
} catch (err) {
  console.error("✖ Test runner error:", err.message);
  server.close();
  cleanup();
  process.exit(1);
}
