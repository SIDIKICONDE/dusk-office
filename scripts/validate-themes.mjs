#!/usr/bin/env node
/**
 * Valide le JSON des thèmes et la cohérence include / package.json.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const themesDir = path.join(root, "themes");
const pkgPath = path.join(root, "package.json");

/** @param {string} file */
function readThemeJson(file) {
  const raw = fs.readFileSync(file, "utf8");
  try {
    return JSON.parse(raw);
  } catch (e) {
    throw new Error(`${path.relative(root, file)} : JSON invalide — ${e.message}`);
  }
}

/** @param {string} fromFile */
function resolveInclude(fromFile, includePath) {
  const dir = path.dirname(fromFile);
  return path.normalize(path.join(dir, includePath));
}

/** @param {string} file */
function validateThemeFile(file, chain = new Set()) {
  const rel = path.relative(root, file);
  if (chain.has(rel)) {
    throw new Error(`Chaîne include circulaire : ${[...chain, rel].join(" → ")}`);
  }
  chain.add(rel);

  const theme = readThemeJson(file);
  if (!theme || typeof theme !== "object") throw new Error(`${rel} : racine invalide`);
  if (typeof theme.name !== "string" || !theme.name.trim()) {
    throw new Error(`${rel} : propriété "name" manquante ou vide`);
  }

  if (theme.include) {
    if (typeof theme.include !== "string") throw new Error(`${rel} : "include" doit être une chaîne`);
    const inc = resolveInclude(file, theme.include);
    if (!fs.existsSync(inc)) {
      throw new Error(`${rel} : include introuvable — ${path.relative(root, inc)}`);
    }
    validateThemeFile(inc, chain);
  }

  if (theme.colors != null && typeof theme.colors !== "object") {
    throw new Error(`${rel} : "colors" doit être un objet`);
  }
}

function main() {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  const themes = pkg?.contributes?.themes;
  if (!Array.isArray(themes) || themes.length === 0) {
    throw new Error("package.json : contributes.themes manquant ou vide");
  }

  const seen = new Set();
  for (const t of themes) {
    if (!t.path) throw new Error(`Thème sans path : ${JSON.stringify(t.label)}`);
    const full = path.resolve(root, t.path);
    if (!fs.existsSync(full)) throw new Error(`Fichier thème introuvable : ${t.path}`);
    const key = path.relative(root, full).replace(/\\/g, "/");
    if (seen.has(key)) throw new Error(`Path dupliqué : ${key}`);
    seen.add(key);
    validateThemeFile(full);
  }

  for (const f of fs.readdirSync(themesDir)) {
    if (!f.endsWith(".json")) continue;
    if (!/^nyx.*\.json$/i.test(f)) continue;
    const key = path.join("themes", f).replace(/\\/g, "/");
    if (!seen.has(key) && f !== "nyx.json") {
      console.warn("WARN thème non référencé dans package.json :", key);
    }
  }

  console.log("OK", themes.length, "thèmes Marketplace validés");
}

try {
  main();
} catch (e) {
  console.error(e.message || e);
  process.exit(1);
}
