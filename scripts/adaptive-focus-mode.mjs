#!/usr/bin/env node
/**
 * Local adaptive theme recommender (privacy-first, no network).
 * Uses the same logic as the extension: lib/themes/theme-common.js
 *
 * Usage:
 *   node scripts/adaptive-focus-mode.mjs
 *   node scripts/adaptive-focus-mode.mjs --hour 22 --language markdown
 *   node scripts/adaptive-focus-mode.mjs --lock "Dusk Office Sentinel"
 *   node scripts/adaptive-focus-mode.mjs --json
 */
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const {
  THEME_VARIANTS,
  computeAdaptiveFocusTheme,
  isAdaptiveLightPeriod,
} = require("../lib/themes/theme-common.js");

function parseArgs(argv) {
  const out = {
    hour: new Date().getHours(),
    language: "",
    lock: "",
    json: false,
    lateNightEyeComfort: true,
    lateNightStartHour: 22,
    lateNightEndHour: 5,
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
      out.language = String(next);
      i += 1;
      continue;
    }
    if (token === "--lock" && next) {
      out.lock = String(next);
      i += 1;
      continue;
    }
    if (token === "--no-late-night") {
      out.lateNightEyeComfort = false;
      continue;
    }
    if (token === "--json") {
      out.json = true;
    }
  }

  return out;
}

function resolveForCli(args) {
  const now = new Date();
  now.setHours(args.hour, 0, 0, 0);

  const cfg = {
    enabled: true,
    lockTheme: args.lock,
    lateNightEyeComfort: args.lateNightEyeComfort,
    lateNightStartHour: args.lateNightStartHour,
    lateNightEndHour: args.lateNightEndHour,
    dayStartHour: args.dayStartHour ?? 7,
    dayEndHour: args.dayEndHour ?? 18,
    defaultLightTheme: "Dusk Office Ivory",
    defaultDarkTheme: "Dusk Office Midnight",
    languageOverrides: {},
  };

  const result = computeAdaptiveFocusTheme(args.language, now, { force: true }, cfg);
  if (!result) {
    throw new Error("Could not resolve adaptive focus theme");
  }

  if (args.lock && !THEME_VARIANTS.includes(args.lock)) {
    throw new Error(`Invalid lock theme: "${args.lock}"`);
  }

  return result;
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!Number.isInteger(args.hour) || args.hour < 0 || args.hour > 23) {
    throw new Error("Invalid --hour value. Expected an integer between 0 and 23.");
  }

  const result = resolveForCli(args);
  const period = isAdaptiveLightPeriod(args.hour, {
    dayStartHour: args.dayStartHour ?? 7,
    dayEndHour: args.dayEndHour ?? 18,
  })
    ? "light"
    : "dark";

  if (args.json) {
    process.stdout.write(
      `${JSON.stringify(
        {
          input: {
            hour: args.hour,
            language: args.language || null,
            lock: args.lock || null,
            lateNightEyeComfort: args.lateNightEyeComfort,
            themeCount: THEME_VARIANTS.length,
          },
          output: { ...result, period },
        },
        null,
        2,
      )}\n`,
    );
    return;
  }

  process.stdout.write(
    [
      "Adaptive Focus Mode (lib/themes/theme-common.js)",
      `- Hour: ${args.hour} (${period})`,
      `- Language: ${args.language || "none"}`,
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
