#!/usr/bin/env node
/**
 * Local adaptive theme recommender (privacy-first, no network).
 *
 * This script suggests a Dusk Office theme from:
 * - current hour
 * - active language/file type
 * - focus mode (zen)
 * - optional lock (forces a fixed theme)
 *
 * Usage:
 *   node scripts/adaptive-focus-mode.mjs
 *   node scripts/adaptive-focus-mode.mjs --hour 22 --language markdown --zen true
 *   node scripts/adaptive-focus-mode.mjs --lock "Dusk Office Midnight"
 *   node scripts/adaptive-focus-mode.mjs --json
 */

const ALL_THEMES = [
  "Dusk Office",
  "Dusk Office Abyss",
  "Dusk Office Dawn",
  "Dusk Office Bay",
  "Dusk Office Mist",
  "Dusk Office Ash",
  "Dusk Office Midnight",
  "Dusk Office Nebula",
  "Dusk Office Reef",
  "Dusk Office High Contrast",
  "Dusk Office Light",
  "Dusk Office Ivory",
  "Dusk Office Dark Ivory",
  "Dusk Office Nocturne",
  "Dusk Office Finance",
  "Dusk Office Corporate",
];

const RULES = {
  default: {
    light: "Dusk Office Ivory",
    dark: "Dusk Office Midnight",
  },
  zen: {
    light: "Dusk Office Light",
    dark: "Dusk Office Mist",
  },
  language: {
    markdown: { light: "Dusk Office Ivory", dark: "Dusk Office Nocturne" },
    mdx: { light: "Dusk Office Ivory", dark: "Dusk Office Nocturne" },
    dart: { light: "Dusk Office Light", dark: "Dusk Office Bay" },
    flutter: { light: "Dusk Office Light", dark: "Dusk Office Bay" },
    typescript: { light: "Dusk Office Ivory", dark: "Dusk Office Nebula" },
    javascript: { light: "Dusk Office Ivory", dark: "Dusk Office Nebula" },
    json: { light: "Dusk Office Ivory", dark: "Dusk Office Ash" },
    yaml: { light: "Dusk Office Ivory", dark: "Dusk Office Ash" },
    yml: { light: "Dusk Office Ivory", dark: "Dusk Office Ash" },
    shellscript: { light: "Dusk Office Ivory", dark: "Dusk Office Finance" },
    shell: { light: "Dusk Office Ivory", dark: "Dusk Office Finance" },
    bash: { light: "Dusk Office Ivory", dark: "Dusk Office Finance" },
    zsh: { light: "Dusk Office Ivory", dark: "Dusk Office Finance" },
    python: { light: "Dusk Office Ivory", dark: "Dusk Office Abyss" },
    go: { light: "Dusk Office Ivory", dark: "Dusk Office Reef" },
    rust: { light: "Dusk Office Ivory", dark: "Dusk Office Corporate" },
    html: { light: "Dusk Office Ivory", dark: "Dusk Office Dawn" },
    css: { light: "Dusk Office Ivory", dark: "Dusk Office Nebula" },
    sql: { light: "Dusk Office Ivory", dark: "Dusk Office Finance" },
    ruby: { light: "Dusk Office Ivory", dark: "Dusk Office Nocturne" },
    java: { light: "Dusk Office Light", dark: "Dusk Office Corporate" },
    cpp: { light: "Dusk Office Light", dark: "Dusk Office Reef" },
    swift: { light: "Dusk Office Ivory", dark: "Dusk Office Midnight" },
    kotlin: { light: "Dusk Office Light", dark: "Dusk Office Bay" },
  },
};

function parseArgs(argv) {
  const out = {
    hour: new Date().getHours(),
    language: "",
    zen: false,
    lock: "",
    json: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    const next = argv[i + 1];

    if (token === "--hour" && next) {
      out.hour = Number(next);
      i += 1;
      continue;
    }
    if ((token === "--language" || token === "--lang") && next) {
      out.language = String(next).toLowerCase();
      i += 1;
      continue;
    }
    if (token === "--zen" && next) {
      out.zen = String(next).toLowerCase() === "true";
      i += 1;
      continue;
    }
    if (token === "--lock" && next) {
      out.lock = String(next);
      i += 1;
      continue;
    }
    if (token === "--json") {
      out.json = true;
    }
  }

  return out;
}

function isLightHour(hour) {
  return hour >= 7 && hour < 18;
}

function normalizeLanguage(language) {
  if (!language) return "";
  const value = language.toLowerCase().trim();
  if (value === "tsx" || value === "ts") return "typescript";
  if (value === "jsx" || value === "js") return "javascript";
  if (value === "sh") return "shellscript";
  return value;
}

function resolveTheme({ hour, language, zen, lock }) {
  const period = isLightHour(hour) ? "light" : "dark";

  if (lock) {
    if (!ALL_THEMES.includes(lock)) {
      throw new Error(`Invalid lock theme: "${lock}"`);
    }
    return {
      theme: lock,
      reason: `Theme lock active (${lock})`,
      period,
    };
  }

  const lang = normalizeLanguage(language);
  const langRule = lang ? RULES.language[lang] : null;
  if (langRule && ALL_THEMES.includes(langRule[period])) {
    return {
      theme: langRule[period],
      reason: `Language rule matched (${lang})`,
      period,
    };
  }

  if (hour >= 22 || hour < 5) {
    return {
      theme: "Dusk Office Midnight",
      reason: "Late night eye comfort",
      period,
    };
  }

  if (zen && ALL_THEMES.includes(RULES.zen[period])) {
    return {
      theme: RULES.zen[period],
      reason: "Zen mode rule matched",
      period,
    };
  }

  return {
    theme: RULES.default[period],
    reason: "Default day/night rule matched",
    period,
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!Number.isInteger(args.hour) || args.hour < 0 || args.hour > 23) {
    throw new Error("Invalid --hour value. Expected an integer between 0 and 23.");
  }

  const result = resolveTheme(args);

  if (args.json) {
    process.stdout.write(
      `${JSON.stringify(
        {
          input: {
            hour: args.hour,
            language: args.language || null,
            zen: args.zen,
            lock: args.lock || null,
          },
          output: result,
        },
        null,
        2,
      )}\n`,
    );
    return;
  }

  process.stdout.write(
    [
      "Adaptive Focus Mode",
      `- Hour: ${args.hour} (${result.period})`,
      `- Language: ${args.language || "none"}`,
      `- Zen: ${args.zen ? "on" : "off"}`,
      `- Lock: ${args.lock || "none"}`,
      `- Suggested theme: ${result.theme}`,
      `- Reason: ${result.reason}`,
    ].join("\n") + "\n",
  );
}

try {
  main();
} catch (error) {
  console.error(`adaptive-focus-mode: ${error.message || String(error)}`);
  process.exit(1);
}
