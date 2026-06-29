#!/usr/bin/env node
/**
 * Create GitHub Release for the current tag, or upload assets if it already exists.
 *
 *   GITHUB_REF=refs/tags/v1.5.0 node scripts/create-github-release.mjs --vsix a.vsix --jetbrains b.zip
 */
import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function run(args, options = {}) {
  const result = spawnSync("gh", args, {
    cwd: root,
    encoding: "utf8",
    shell: false,
    stdio: options.inherit ? "inherit" : "pipe",
    env: process.env,
  });
  if (options.inherit) {
    process.exit(result.status ?? 1);
  }
  return result;
}

function parseArgs(argv) {
  const assets = [];
  let vsix = "";
  let jetbrains = "";
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--vsix" && argv[i + 1]) vsix = argv[++i];
    else if (argv[i] === "--jetbrains" && argv[i + 1]) jetbrains = argv[++i];
  }
  if (vsix) assets.push(path.resolve(root, vsix));
  if (jetbrains) assets.push(path.resolve(root, jetbrains));
  return assets;
}

function readChangelogBody(version) {
  const changelog = fs.readFileSync(path.join(root, "CHANGELOG.md"), "utf8");
  const lines = changelog.split(/\r?\n/);
  const heading = `## ${version} `;
  let start = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith(heading)) {
      start = i + 1;
      break;
    }
  }
  if (start < 0) {
    console.error(`::error::CHANGELOG.md is missing a section for version ${version}.`);
    process.exit(1);
  }
  const body = [];
  for (let i = start; i < lines.length; i++) {
    if (/^## /.test(lines[i])) break;
    body.push(lines[i]);
  }
  return body.join("\n").trim();
}

const ref = process.env.GITHUB_REF || "";
const tag = ref.startsWith("refs/tags/") ? ref.slice("refs/tags/".length) : "";
if (!tag) {
  console.error("create-github-release: GITHUB_REF must be refs/tags/vX.Y.Z");
  process.exit(1);
}

const version = tag.startsWith("v") ? tag.slice(1) : tag;
const assets = parseArgs(process.argv.slice(2));
for (const asset of assets) {
  if (!fs.existsSync(asset)) {
    console.error(`::error::Release asset not found: ${asset}`);
    process.exit(1);
  }
}

const body = readChangelogBody(version);
const notesFile = path.join(root, ".release-notes.md");
fs.writeFileSync(notesFile, `${body}\n`, "utf8");

const view = run(["release", "view", tag]);
if ((view.status ?? 1) === 0) {
  console.log(`::warning::GitHub release ${tag} already exists — uploading assets only.`);
  if (assets.length === 0) {
    console.log("[OK] Nothing to upload.");
    process.exit(0);
  }
  const upload = run(["release", "upload", tag, ...assets, "--clobber"], { inherit: true });
  process.exit(upload.status ?? 1);
}

const createArgs = [
  "release",
  "create",
  tag,
  "--title",
  `Dusk Office ${tag}`,
  "--notes-file",
  notesFile,
  ...assets,
];
const create = run(createArgs, { inherit: true });
process.exit(create.status ?? 1);
