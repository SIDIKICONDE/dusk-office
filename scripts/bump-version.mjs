#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const kind = process.argv[2];
if (!["patch", "minor", "major"].includes(kind)) {
  console.error("Usage: node scripts/bump-version.mjs <patch|minor|major>");
  process.exit(1);
}

const packageJsonPath = path.join(root, "package.json");
const packageLockPath = path.join(root, "package-lock.json");
const changelogPath = path.join(root, "CHANGELOG.md");

const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
const lock = JSON.parse(fs.readFileSync(packageLockPath, "utf8"));
const changelog = fs.readFileSync(changelogPath, "utf8");

function bump(version, type) {
  const [major, minor, patch] = version.split(".").map(Number);
  if (![major, minor, patch].every(Number.isInteger)) {
    throw new Error(`Version invalide: ${version}`);
  }
  if (type === "major") return `${major + 1}.0.0`;
  if (type === "minor") return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}

function formatDate(d) {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

const previousVersion = pkg.version;
const nextVersion = bump(previousVersion, kind);
pkg.version = nextVersion;
lock.version = nextVersion;
if (lock.packages?.[""]) {
  lock.packages[""].version = nextVersion;
}

const today = formatDate(new Date());
const eol = changelog.includes("\r\n") ? "\r\n" : "\n";
const normalized = changelog.replace(/\r\n/g, "\n");
const newSection =
  `## ${nextVersion} — ${today}\n\n- **Changed**: version bump.\n\n`;
const anchorRegex =
  /(# Changelog — Dusk Office\n\n(?:.*\n)?\n)/;
if (!anchorRegex.test(normalized)) {
  throw new Error("Ancre changelog introuvable.");
}
const nextChangelog = normalized.replace(anchorRegex, `$1${newSection}`).replace(/\n/g, eol);

fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + "\n", "utf8");
fs.writeFileSync(packageLockPath, JSON.stringify(lock, null, 2) + "\n", "utf8");
fs.writeFileSync(changelogPath, nextChangelog, "utf8");

console.log(`OK version ${previousVersion} -> ${nextVersion}`);
