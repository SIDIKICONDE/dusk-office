/**
 * Charge `.env.local` (gitignored) dans process.env sans écraser les variables déjà définies.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const envLocal = path.join(root, ".env.local");

export function loadEnvLocal() {
  if (!fs.existsSync(envLocal)) return false;
  for (const line of fs.readFileSync(envLocal, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
  return true;
}

export function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    console.error(`${name} manquant — définissez la variable ou créez .env.local (gitignored).`);
    process.exit(1);
  }
  return value;
}
