import js from "@eslint/js";
import globals from "globals";

/**
 * Flat ESLint config. Lints the hand-written runtime (CommonJS `lib/` +
 * `extension.js`), the ESM build scripts, and the tests. Generated and
 * third-party output is ignored. Paired with `tsconfig.json` (`tsc --checkJs`)
 * for type-level guardrails — see `npm run lint` / `npm run typecheck`.
 */
export default [
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "lib/generated/**",
      ".vscode-test-web/**",
      "exports/**",
      "jetbrains-plugin/**",
      "python/**",
      "themes/**",
      "theme-sources/**",
      "docs/**",
      "samples/**",
      "images/**",
    ],
  },
  js.configs.recommended,
  {
    // CommonJS runtime + tests + mocks
    files: ["extension.js", "lib/**/*.js", "tests/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs",
      globals: { ...globals.node },
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "no-empty": ["error", { allowEmptyCatch: true }],
      // ANSI parsing legitimately matches ESC / control characters.
      "no-control-regex": "off",
    },
  },
  {
    // ESM build scripts, esbuild/eslint configs, and any lib/*.mjs
    files: ["scripts/**/*.mjs", "lib/**/*.mjs", "*.mjs"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: { ...globals.node },
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "no-empty": ["error", { allowEmptyCatch: true }],
      "no-control-regex": "off",
    },
  },
  {
    // ESM tests (e.g. Playwright web-activation driver): Node + browser globals,
    // since `page.evaluate(...)` callbacks reference DOM globals like `document`.
    files: ["tests/**/*.mjs"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: { ...globals.node, ...globals.browser },
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "no-empty": ["error", { allowEmptyCatch: true }],
      "no-control-regex": "off",
    },
  },
];
