# Changelog — Nyx

User-facing changes (themes, default settings, Marketplace listing).

## 0.6.4 — 31 March 2026

- **Changed**: extension **`displayName`** to **Nyx by DEKI** — the short name **Nyx** was already taken on the Marketplace for another extension’s display title.

## 0.6.3 — 31 March 2026

- **Changed**: package `name` to **`nyx-color-themes`** (Marketplace id **`deki.nyx-color-themes`**) because **`deki.nyx`** was also already registered.

## 0.6.2 — 31 March 2026

- **Changed**: extension package `name` from `theme` to **`nyx`** so the Marketplace identifier is **`deki.nyx`** (`deki.theme` was already registered by another listing).

## 0.6.1 — 31 March 2026

- **Fixed**: README screenshots in the packaged extension — images use **relative** `images/…` paths in the VSIX (no rewrite to remote URLs), so all four screenshots display in the Extensions view after install.
- **Changed**: README includes four Marketplace screenshots with stable English filenames.

## 0.6.0 — 30 March 2026

- **Breaking change**: theme **display names** and the `name` field in theme JSON are now **English** (e.g. **Nyx Midnight** instead of *Nyx Minuit*). If your `settings.json` still uses the old French `workbench.colorTheme` value, VS Code will fall back until you pick the theme again or set the new name (default preset uses **Nyx Midnight**).
- **Changed**: README and Marketplace copy aligned with English names.

## 0.5.11 — 30 March 2026

- **Fixed**: screenshot images on the Marketplace listing.
- **Changed**: README tightened for install and daily use (no developer-only section).

## 0.5.10 — 30 March 2026

- **Changed**: product docs state **proprietary** distribution only (no public repository field in the manifest).

## 0.5.9 — 30 March 2026

- **Added**: **Nyx Dark Ivory** theme — warm dark UI, cream text, deep background.

## 0.5.8 — 30 March 2026

- **Added**: **Nyx Ivory** theme — warm light UI, **#F6EEDE** paper base, copper and amber accents.

## 0.5.7 — 30 March 2026

- **Changed**: richer suggested defaults (semantic highlighting, brackets, guides, sticky scroll, highlights, minimap, explorer). Default color theme: **Nyx Midnight**.

## 0.5.6 — 30 March 2026

- **Added**: minimap enabled and **Nyx Midnight** as default suggestion (overridable in settings).

## 0.5.5 — 30 March 2026

- **Added**: **Nyx High Contrast** for clearer borders and focus.
- **Added**: **Nyx Light** (light UI).
- **Added**: Marketplace banner and Q&A.

## 0.5.4 — 30 March 2026

- **Changed**: slightly stronger borders on dark variants.
- **Changed**: **Nyx Midnight** — borders easier to see on very dark backgrounds.

## Earlier than 0.5.4

- Prior history maintained by **DEKI**; install the latest release for the full theme list.
