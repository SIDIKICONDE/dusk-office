# Maintenance — pack Nyx

Guide interne pour régénérer les thèmes sans casser la chaîne de publication.

## Ordre des scripts (variantes sombres)

1. **`npm run variants:ui`** — fusionne les couleurs workbench étendues (`merge-extended-ui-colors.mjs`) dans `nyx-*.json` (sauf `nyx.json`, `nyx-hc.json`, `nyx-light.json`).
2. **`npm run variants:syntax`** — met à jour `tokenColors` / `semanticTokenColors` des variantes listées dans le script.
3. **`npm run boost:borders`** *(optionnel)* — augmente l’alpha des clés « bordure ». **Ne pas** enchaîner avec `soften:borders` sur les mêmes fichiers sans repartir d’une base git propre.
4. **`npm run dim:borders`** *(optionnel)* — baisse la luminosité perçue des bordures (alpha −22, RGB ×0,88). S’applique aux variantes sombres + **Nyx Clair** ; pas à `nyx-hc.json`.

**À ne pas faire :** `soften:borders` puis `boost:borders` deux fois de suite sans reset — l’alpha s’accumule.

## Thèmes hors pipeline sombre

| Fichier | Rôle |
|--------|------|
| `themes/nyx.json` | Base vide (schéma, type dark) ; référence des `include`. |
| `themes/nyx-hc.json` | `include` Abîme + surcharges contraste élevé — ajuster à la main si besoin. |
| `themes/nyx-light.json` | Généré par **`npm run build:light`** depuis Abîme. |
| `themes/nyx-ivoire.json` | Généré par **`npm run build:ivoire`** depuis **Nyx Clair** (base papier **#F6EEDE**). |
| `themes/nyx-ivoire-sombre.json` | Généré par **`npm run build:ivoire-sombre`** depuis **Nyx Cendre** (palette sombre chaude, complément **Ivoire**). |

## Qualité avant commit / release

```bash
npm run validate
```

Valide le JSON, les chaînes `include` et la liste `contributes.themes` dans `package.json`.

## Publication Marketplace

- **CI** : sur un tag `v0.5.5` (exemple), le workflow **Release** produit un artefact VSIX.
- **Publication manuelle** (compte éditeur) :

  ```bash
  npx @vscode/vsce login deki
  npm run package
  npx @vscode/vsce publish --no-dependencies
  ```

- Pour publier **automatiquement** depuis GitHub Actions, ajouter un secret dépôt `VSCE_PAT` (Personal Access Token Azure / VS Marketplace) : le job « Publish » du workflow release l’utilise s’il est défini.

## Réglages par défaut (`configurationDefaults`)

Déclarés dans `package.json` → `contributes.configurationDefaults` : thème **Nyx Minuit**, minimap, sémantique, guides de brackets, sticky scroll, surlignages, explorateur, etc. Voir le fichier pour la liste à jour. Les **paramètres utilisateur / workspace** écrasent ces valeurs.

Pour une autre variante Nyx par défaut dans un preset équipe, définir par exemple `"workbench.colorTheme": "Nyx Abîme"` dans le `settings.json` du workspace.

## Journal des versions

Voir [CHANGELOG.md](./CHANGELOG.md).
