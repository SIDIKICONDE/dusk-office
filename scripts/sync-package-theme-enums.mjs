#!/usr/bin/env node
/**
 * Writes ALL_DUSK_THEMES into the six package.json configuration enums.
 * Run from make:full (`npm run sync:enums`). verify-runtime-constants.mjs
 * remains the CI safety net.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { THEME_ENUM_SPECS, buildThemeEnum, enumsEqual } from "./theme-package-enums.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const pkgPath = path.join(root, "package.json");

const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
const properties = pkg?.contributes?.configuration?.properties;
if (!properties || typeof properties !== "object") {
  console.error("package.json: contributes.configuration.properties missing");
  process.exit(1);
}

let changed = 0;
for (const spec of THEME_ENUM_SPECS) {
  const property = properties[spec.key];
  if (!property || typeof property !== "object") {
    console.error(`${spec.key}: property missing`);
    process.exit(1);
  }
  const next = buildThemeEnum(spec.includeEmpty);
  if (enumsEqual(property.enum, next)) continue;
  property.enum = next;
  changed += 1;
}

if (changed === 0) {
  console.log(`OK package theme enums — ${THEME_ENUM_SPECS.length} already in sync`);
  process.exit(0);
}

fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
console.log(`OK package theme enums — updated ${changed}/${THEME_ENUM_SPECS.length}`);
