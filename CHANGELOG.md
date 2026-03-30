# Journal des versions — Nyx

Toutes les dates sont en UTC. Comparez avec `package.json` → `version`.

## [0.5.9] — 2026-03-30

### Ajouté

- **Nyx Ivoire sombre** (`themes/nyx-ivoire-sombre.json`, `vs-dark`) : thème sombre chaud (fond **#1f1c18**, texte crème) ; généré par `scripts/build-nyx-ivoire-sombre.mjs` à partir de **Nyx Cendre**.

## [0.5.8] — 2026-03-30

### Ajouté

- **Nyx Ivoire** (`themes/nyx-ivoire.json`, `vs`) : thème clair chaud centré sur **#F6EEDE** ; généré par `scripts/build-nyx-ivoire.mjs` à partir de **Nyx Clair**.

## [0.5.7] — 2026-03-30

### Modifié

- **`configurationDefaults`** enrichi : sémantique, brackets & guides, sticky scroll, surlignage ligne / sélections, édition liée, minimap (slider), explorateur (indentations, badges, couleurs). Toujours **Nyx Minuit** comme thème par défaut.

## [0.5.6] — 2026-03-30

### Ajouté

- `contributes.configurationDefaults` : `editor.minimap.enabled` à `true`, `workbench.colorTheme` à **Nyx Minuit** (surcharge possible dans les réglages utilisateur / workspace).

## [0.5.5] — 2026-03-30

### Ajouté

- **Nyx Contraste élevé** (`themes/nyx-hc.json`, `uiTheme` hc-black) : bordures et focus renforcés pour l’accessibilité.
- **Nyx Clair** (`themes/nyx-light.json`, `uiTheme` vs) : variante claire générée depuis Abîme (`scripts/build-nyx-light.mjs`).
- `CHANGELOG.md`, `MAINTENANCE.md`, `scripts/validate-themes.mjs`, `npm run validate`.
- CI GitHub Actions : validation sur chaque push / PR ; construction du VSIX sur tag `v*`.
- Métadonnées Marketplace : `galleryBanner`, `qna`.

### Notes internes

- Après une grosse évolution d’**Abîme**, régénérer le clair : `npm run build:light`.

## [0.5.4] — 2026-03-30

- Bordures : script `boost:borders`, renforcement du contraste sur les variantes sombres.
- **Nyx Minuit** : bordures plus lisibles sur fond quasi noir (`#2e7d8f`), palette `border` du merge mise à jour.
- Version package / lockfile alignés.

## [0.5.3] et antérieur

- Voir l’historique git du dépôt pour le détail des changements antérieurs à ce fichier.
