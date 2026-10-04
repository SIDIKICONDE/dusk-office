#!/usr/bin/env node
/**
 * Cross-platform launcher for the repo's Python tooling.
 *
 * Why this exists: the npm scripts used to be `python -m dusk_office.…`, which broke
 * in two ways. `python` does not exist on many Linux systems (only `python3`), and the
 * inline `PYTHONPATH=python …` form that fixed the import path is POSIX-only — it
 * fails on Windows `cmd.exe`, which `npm` uses by default.
 *
 * Resolution order:
 *   1. `.venv/bin/python` (or `Scripts/python.exe`) — the repo's own virtualenv
 *   2. `python3` — the usual Linux/macOS interpreter
 *   3. `python` — Windows, and Linux systems that alias it
 *
 * The chosen interpreter gets `python/` on `PYTHONPATH` so `dusk_office` imports
 * without an editable install, and `pytest` is invoked through `-m pytest` so it does
 * not depend on a console script being on PATH.
 *
 * A bare dotted module name is expanded to `-m <module>` so callers can write
 * `node scripts/run-python.mjs dusk_office.validate_schemas`; anything starting with
 * `-` (a flag) or a path is passed through untouched.
 *
 * Usage:
 *   node scripts/run-python.mjs dusk_office.validate_schemas
 *   node scripts/run-python.mjs -m pytest python/tests -q
 */
import { execFileSync, spawnSync } from "child_process";
import { existsSync } from "fs";
import { delimiter, dirname, join, resolve } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pythonDir = join(root, "python");

const CANDIDATES = [
  join(root, ".venv", "Scripts", "python.exe"),
  join(root, ".venv", "bin", "python"),
  "python3",
  "python",
];

/** True when `cmd` runs and reports a Python version. */
function works(cmd) {
  const probe = spawnSync(cmd, ["--version"], { encoding: "utf8" });
  return !probe.error && probe.status === 0;
}

function pickPython() {
  for (const candidate of CANDIDATES) {
    if (candidate.includes("/") && !existsSync(candidate)) continue;
    if (works(candidate)) return candidate;
  }
  return null;
}

const python = pickPython();
if (!python) {
  console.error(
    "run-python: no Python interpreter found. Tried:\n  " +
      CANDIDATES.map((c) => `- ${c}`).join("\n  "),
  );
  console.error("\nInstall Python 3.11+, or create the repo virtualenv with `npm run py:install`.");
  process.exit(1);
}

const rawArgs = process.argv.slice(2);
if (rawArgs.length === 0) {
  console.error("run-python: nothing to run. Usage: node scripts/run-python.mjs <module-or-flag> [...]");
  process.exit(1);
}

// `foo.bar` -> `-m foo.bar`; `-m …`, `-c …` and file paths pass through as-is.
const isDottedModule = (arg) => /^[A-Za-z_][\w]*(\.[A-Za-z_][\w]*)+$/.test(arg);
const args = isDottedModule(rawArgs[0]) ? ["-m", ...rawArgs] : rawArgs;

const env = {
  ...process.env,
  PYTHONPATH: process.env.PYTHONPATH
    ? `${pythonDir}${delimiter}${process.env.PYTHONPATH}`
    : pythonDir,
  PYTHONDONTWRITEBYTECODE: "1",
};

try {
  execFileSync(python, args, { cwd: root, stdio: "inherit", env });
} catch (err) {
  process.exit(err.status ?? 1);
}