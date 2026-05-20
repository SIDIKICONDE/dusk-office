#!/usr/bin/env node
/**
 * Installe le dernier dusk-office-jetbrains-*.zip dans le dossier plugins IntelliJ.
 *
 *   make jetbrains-install IDE=auto
 *   node scripts/install-jetbrains-plugin.mjs --editor=flatpak-idea-ce
 *   node scripts/install-jetbrains-plugin.mjs --list
 */
import {
  readdirSync,
  existsSync,
  statSync,
  rmSync,
  mkdirSync,
} from "fs";
import { spawnSync } from "child_process";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const distDir = join(root, "jetbrains-plugin", "build", "distributions");
const PLUGIN_FOLDER = "dusk-office-jetbrains";
const ZIP_RE = /^dusk-office-jetbrains-\d+\.\d+\.\d+\.zip$/;

/** @type {{ id: string, label: string, flatpakApp?: string, nativePrefix: string, autoOrder: number }[]} */
const JETBRAINS_EDITORS = [
  {
    id: "flatpak-idea-ce",
    label: "IntelliJ IDEA Community (Flatpak)",
    flatpakApp: "com.jetbrains.IntelliJ-IDEA-Community",
    nativePrefix: "IdeaIC",
    autoOrder: 1,
  },
  {
    id: "idea-ce",
    label: "IntelliJ IDEA Community",
    nativePrefix: "IdeaIC",
    autoOrder: 2,
  },
  {
    id: "flatpak-idea",
    label: "IntelliJ IDEA Ultimate (Flatpak)",
    flatpakApp: "com.jetbrains.IntelliJ-IDEA-Ultimate",
    nativePrefix: "IntelliJIdea",
    autoOrder: 3,
  },
  {
    id: "idea",
    label: "IntelliJ IDEA Ultimate",
    nativePrefix: "IntelliJIdea",
    autoOrder: 4,
  },
  {
    id: "flatpak-webstorm",
    label: "WebStorm (Flatpak)",
    flatpakApp: "com.jetbrains.WebStorm",
    nativePrefix: "WebStorm",
    autoOrder: 5,
  },
  {
    id: "webstorm",
    label: "WebStorm",
    nativePrefix: "WebStorm",
    autoOrder: 6,
  },
  {
    id: "flatpak-pycharm",
    label: "PyCharm (Flatpak)",
    flatpakApp: "com.jetbrains.PyCharm-Professional",
    nativePrefix: "PyCharm",
    autoOrder: 7,
  },
  {
    id: "pycharm",
    label: "PyCharm",
    nativePrefix: "PyCharm",
    autoOrder: 8,
  },
];

const EDITOR_ALIASES = {
  intellij: "flatpak-idea-ce",
  "idea-community": "flatpak-idea-ce",
  "intellij-idea-community": "flatpak-idea-ce",
};

function findLatestZip(dir) {
  if (!existsSync(dir)) return null;
  const files = readdirSync(dir).filter((f) => ZIP_RE.test(f));
  if (files.length === 0) return null;
  return files
    .map((f) => ({ f, m: join(dir, f) }))
    .sort((a, b) => statSync(b.m).mtimeMs - statSync(a.m).mtimeMs)[0].m;
}

function listProductDirs(jetBrainsRoot) {
  if (!existsSync(jetBrainsRoot)) return [];
  return readdirSync(jetBrainsRoot, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
}

function productMatchesPrefix(name, prefix) {
  return name === prefix || name.startsWith(`${prefix}20`);
}

/** JetBrains 2023+ (Flatpak) : idea.plugins.path = data/JetBrains/<Product>/ (sans sous-dossier plugins). */
function looksLikePluginsRoot(dir) {
  if (!existsSync(dir)) return false;
  try {
    const names = readdirSync(dir);
    if (names.includes(PLUGIN_FOLDER)) return true;
    return names.some(
      (n) =>
        n === "fullLine" ||
        n === "marketplace" ||
        n === "ml-llm" ||
        n.endsWith(".jar"),
    );
  } catch {
    return false;
  }
}

function resolvePluginsDirForProduct(product, roots) {
  const candidates = [];
  if (roots.dataRoot) {
    candidates.push(join(roots.dataRoot, product));
    candidates.push(join(roots.dataRoot, product, "plugins"));
  }
  if (roots.configRoot) {
    candidates.push(join(roots.configRoot, product, "plugins"));
  }
  if (roots.shareRoot) {
    candidates.push(join(roots.shareRoot, product, "plugins"));
    candidates.push(join(roots.shareRoot, product));
  }

  for (const dir of candidates) {
    if (looksLikePluginsRoot(dir)) return dir;
  }

  if (roots.dataRoot) return join(roots.dataRoot, product);
  if (roots.shareRoot) return join(roots.shareRoot, product, "plugins");
  if (roots.configRoot) return join(roots.configRoot, product, "plugins");
  return null;
}

function jetBrainsRoots(home, flatpakApp) {
  if (flatpakApp) {
    const appRoot = join(home, ".var", "app", flatpakApp);
    return {
      configRoot: join(appRoot, "config", "JetBrains"),
      dataRoot: join(appRoot, "data", "JetBrains"),
      shareRoot: null,
    };
  }
  return {
    configRoot: join(home, ".config", "JetBrains"),
    dataRoot: null,
    shareRoot: join(home, ".local", "share", "JetBrains"),
  };
}

function discoverPluginDirs(def) {
  const home = process.env.HOME;
  if (!home) return [];

  const roots = jetBrainsRoots(home, def.flatpakApp);
  const configProducts = listProductDirs(roots.configRoot);
  const dataProducts = listProductDirs(roots.dataRoot);
  const shareProducts = listProductDirs(roots.shareRoot);
  const products = [
    ...new Set([...configProducts, ...dataProducts, ...shareProducts]),
  ].filter((p) => productMatchesPrefix(p, def.nativePrefix));

  const found = [];
  for (const product of products) {
    const pluginsDir = resolvePluginsDirForProduct(product, roots);
    if (!pluginsDir) continue;
    found.push({
      pluginsDir,
      source: `${def.id} (${product})`,
      legacyConfigPlugins: roots.configRoot
        ? join(roots.configRoot, product, "plugins", PLUGIN_FOLDER)
        : null,
    });
  }

  if (found.length === 0 && def.flatpakApp && flatpakInstalled(def.flatpakApp)) {
    const inferred = inferFlatpakProduct(def);
    if (inferred) {
      const pluginsDir = join(roots.dataRoot, inferred.product);
      found.push({
        pluginsDir,
        source: `${def.id} (${inferred.product}, nouveau)`,
        legacyConfigPlugins: join(
          roots.configRoot,
          inferred.product,
          "plugins",
          PLUGIN_FOLDER,
        ),
      });
    }
  }

  const seen = new Set();
  return found.filter((e) => {
    if (seen.has(e.pluginsDir)) return false;
    seen.add(e.pluginsDir);
    return true;
  });
}

function flatpakInstalled(appId) {
  const r = spawnSync("flatpak", ["info", appId], { encoding: "utf8" });
  return r.status === 0;
}

function inferFlatpakProduct(def) {
  if (!def.flatpakApp) return null;
  const r = spawnSync(
    "flatpak",
    ["run", def.flatpakApp, "--version"],
    { encoding: "utf8", timeout: 120_000 },
  );
  const out = `${r.stdout ?? ""}${r.stderr ?? ""}`;
  const m = out.match(/(\d{4})\.(\d+)/);
  if (!m) return null;
  return { product: `${def.nativePrefix}${m[1]}.${m[2]}` };
}

function normalizeEditorId(preferred) {
  const key = preferred.trim().toLowerCase();
  return EDITOR_ALIASES[key] ?? key;
}

function editorDef(preferred) {
  const id = normalizeEditorId(preferred);
  return JETBRAINS_EDITORS.find((d) => d.id === id) ?? null;
}

function resolveTarget(preferred) {
  const id = normalizeEditorId(preferred);

  if (id === "auto") {
    const sorted = [...JETBRAINS_EDITORS].sort(
      (a, b) => a.autoOrder - b.autoOrder,
    );
    for (const def of sorted) {
      const dirs = discoverPluginDirs(def);
      if (dirs.length > 0) return { def, dir: dirs[0] };
    }
    return null;
  }

  const def = editorDef(id);
  if (!def) return null;
  const dirs = discoverPluginDirs(def);
  if (dirs.length === 0) return null;
  return { def, dir: dirs[0] };
}

function listDetectedEditors() {
  console.log("IDE JetBrains détectés :\n");
  let any = false;
  for (const def of JETBRAINS_EDITORS) {
    const dirs = discoverPluginDirs(def);
    const flatpak =
      def.flatpakApp && flatpakInstalled(def.flatpakApp) ? " [flatpak]" : "";
    if (dirs.length > 0) {
      any = true;
      for (const d of dirs) {
        console.log(`  ✓ ${def.id.padEnd(18)} ${d.pluginsDir}${flatpak}`);
      }
    } else if (def.flatpakApp && flatpakInstalled(def.flatpakApp)) {
      any = true;
      const inferred = inferFlatpakProduct(def);
      const home = process.env.HOME;
      const path = inferred
        ? join(
            home,
            ".var",
            "app",
            def.flatpakApp,
            "data",
            "JetBrains",
            inferred.product,
          )
        : "(lance l’IDE une fois pour initialiser data/)";
      console.log(`  ~ ${def.id.padEnd(18)} ${path}${flatpak}`);
    } else {
      console.log(`  · ${def.id.padEnd(18)} (non trouvé)`);
    }
  }
  if (!any) {
    console.log(
      "\nAucun IDE JetBrains détecté. Installe IntelliJ (Flatpak ou natif) puis relance --list.",
    );
  } else {
    console.log(
      "\nInstallation : npm run jetbrains:build && make jetbrains-install IDE=<id>",
    );
    console.log(
      "IDs : auto, " + JETBRAINS_EDITORS.map((d) => d.id).join(", "),
    );
  }
}

function removeLegacyInstall(legacyPath) {
  if (legacyPath && existsSync(legacyPath)) {
    rmSync(legacyPath, { recursive: true, force: true });
    console.log("Nettoyage (ancien chemin) :", legacyPath);
  }
}

function installZip(zipPath, pluginsDir, legacyPath) {
  const target = join(pluginsDir, PLUGIN_FOLDER);
  mkdirSync(pluginsDir, { recursive: true });
  if (existsSync(target)) {
    rmSync(target, { recursive: true, force: true });
  }
  removeLegacyInstall(legacyPath);

  const r = spawnSync("unzip", ["-q", zipPath, "-d", pluginsDir], {
    stdio: "inherit",
  });
  if (r.status !== 0) {
    console.error("[ERR] unzip a échoué. Installe le paquet unzip.");
    process.exit(1);
  }
  if (!existsSync(target)) {
    console.error(
      `[ERR] Dossier ${PLUGIN_FOLDER} introuvable après extraction.`,
    );
    process.exit(1);
  }
}

const listOnly = process.argv.includes("--list");
if (listOnly) {
  listDetectedEditors();
  process.exit(0);
}

const zip = findLatestZip(distDir);
if (!zip) {
  console.error(
    "Aucun dusk-office-jetbrains-*.zip trouvé. Lance d’abord : npm run jetbrains:build",
  );
  process.exit(1);
}

const flag = process.argv.find((a) => a.startsWith("--editor="));
const preferred = flag?.split("=")[1] ?? process.env.IDE ?? "auto";
const resolved = resolveTarget(preferred);
if (!resolved) {
  const ids = JETBRAINS_EDITORS.map((d) => d.id).join(", ");
  console.error(
    `Aucun dossier plugins trouvé pour « ${preferred} ».\n` +
      `Essayez : node scripts/install-jetbrains-plugin.mjs --list\n` +
      `IDs supportés : auto, ${ids}`,
  );
  process.exit(1);
}

const { def, dir } = resolved;
console.log("Installation :", zip);
console.log("IDE :", def.label, `(${def.id})`);
console.log("Plugins :", dir.pluginsDir);

installZip(zip, dir.pluginsDir, dir.legacyConfigPlugins);

console.log("\n[OK] Plugin installé. Redémarre IntelliJ si l’IDE est ouvert.");
console.log(
  "     Thème : Settings → Appearance → Theme → Dusk Office …",
);
