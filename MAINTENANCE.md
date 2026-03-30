# Maintenance — Nyx pack

Internal guide to regenerate themes without breaking the release pipeline.

## Script order (dark variants)

1. **`npm run variants:ui`** — merges extended workbench colors (`merge-extended-ui-colors.mjs`) into `nyx-*.json` (except `nyx.json`, `nyx-hc.json`, `nyx-light.json`).
2. **`npm run variants:syntax`** — updates `tokenColors` / `semanticTokenColors` for variants listed in the script.
3. **`npm run boost:borders`** *(optional)* — raises alpha on “border” keys. **Do not** chain `soften:borders` on the same files without restoring a known-good theme copy.
4. **`npm run dim:borders`** *(optional)* — lowers perceived border brightness (alpha −22, RGB ×0.88). Applies to dark variants + **Nyx Light**; not `nyx-hc.json`.

**Avoid:** `soften:borders` then `boost:borders` twice in a row without reset — alpha stacks.

## Themes outside the dark pipeline

| File | Role |
|------|------|
| `themes/nyx.json` | Empty base (schema, dark type); `include` anchor. |
| `themes/nyx-hc.json` | `include` Abyss + high-contrast overrides — tweak by hand if needed. |
| `themes/nyx-light.json` | Built by **`npm run build:light`** from Abyss. |
| `themes/nyx-ivoire.json` | Built by **`npm run build:ivoire`** from **Nyx Light** (paper base **#F6EEDE**). |
| `themes/nyx-ivoire-sombre.json` | Built by **`npm run build:ivoire-sombre`** from **Nyx Ash** (warm dark palette, pairs with Ivory). |

## Pre-release checks

```bash
npm run validate
```

Validates JSON, `include` paths, and `contributes.themes` in `package.json`.

## Marketplace publishing

- **VSIX / `vsce`**: `npm run package` uses `--allow-missing-repository` and **`--no-rewrite-relative-links`** so README images stay as `images/…` (not rewritten to `raw.githubusercontent.com/…`, which breaks if that tree is missing or private). PNGs ship inside the VSIX and display in the Extensions view and on the Marketplace. To force remote URLs instead, drop `--no-rewrite-relative-links` and pass `--baseImagesUrl` / `--baseContentUrl`.
- **CI**: on tag `v0.6.1` (example), the **Release** workflow produces a VSIX artifact.
- **Manual publish** (publisher account):

  ```bash
  npx @vscode/vsce login deki
  npm run package
  npx @vscode/vsce publish --no-dependencies
  ```

- For **automated publish** from internal CI, set secret `VSCE_PAT` (Microsoft Marketplace token); the release workflow uses it when defined.

## Default settings (`configurationDefaults`)

Declared in `package.json` → `contributes.configurationDefaults`: **Nyx Midnight**, minimap, semantic highlighting, bracket guides, sticky scroll, highlights, explorer, etc. See the file for the current list. **User / workspace** settings override these.

For another Nyx variant as team default, set e.g. `"workbench.colorTheme": "Nyx Abyss"` in the workspace `settings.json`.

## Version history

See [CHANGELOG.md](./CHANGELOG.md).
