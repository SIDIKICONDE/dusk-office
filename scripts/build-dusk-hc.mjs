#!/usr/bin/env node
/**
 * Écrit themes/dusk-hc.json depuis theme-sources/dusk-hc.json après variants:syntax
 * (Abyss à jour pour include). Même principe que build-dusk-light : sortie de build,
 * pas une copie du sync initial — évite un HC périmé avant la régénération d’Abyss.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const src = path.join(root, "theme-sources", "dusk-hc.json");
const dest = path.join(root, "themes", "dusk-hc.json");

function main() {
  if (!fs.existsSync(src)) {
    console.error("FATAL: theme-sources/dusk-hc.json not found. Cannot build HC theme.");
    process.exit(1);
  }
  const j = JSON.parse(fs.readFileSync(src, "utf8"));
  if (!j.include || typeof j.include !== "string") {
    console.error('dusk-hc: "include" requis (ex. "./dusk-abime.json")');
    process.exit(1);
  }
  const out = {
    $schema: j.$schema || "vscode://schemas/color-theme",
    name: j.name,
    include: j.include,
    colors: j.colors && typeof j.colors === "object" ? j.colors : {},
  };
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, JSON.stringify(out, null, 2) + "\n", "utf8");
  console.log("OK", dest, Object.keys(out.colors).length, "colors");
}

main();
