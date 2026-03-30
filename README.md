# Nyx

**Pack de thèmes sombres** pour **Visual Studio Code** et **Cursor** : cyan électrique, rose néon, hiérarchie d’interface et **coloration sémantique** (LSP) + TextMate.

| | |
|---|---|
| **Publisher** | [Nyx](https://marketplace.visualstudio.com/publishers/nyx) |
| **Identifiant** | `nyx.theme` |
| **Catégorie** | Themes |
| **Licence** | [MIT](./LICENSE) |
| **Dépôt** | [github.com/SIDIKICONDE/Nyx](https://github.com/SIDIKICONDE/Nyx) |

---

## Installation (Marketplace)

**Extensions** (`Ctrl+Shift+X` / `Cmd+Shift+X`) → rechercher **Nyx** → **Install**.

**[Installer depuis le Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=nyx.theme)**

*(Si le lien est inactif, l’extension n’est pas encore publiée : voir [VSIX](#installation-manuelle-vsix).)*

### Choisir un thème

**Préférences** → **Thème de couleur** → **Nyx**, **Nyx Abîme**, **Nyx Aube**, etc.

**Recommandé** :

```json
{
  "editor.semanticHighlighting.enabled": true,
  "editor.bracketPairColorization.enabled": true,
  "editor.guides.bracketPairs": "active"
}
```

---

## Contenu

- **9 thèmes** : **Nyx** (base) + **8 variantes** (UI + syntaxe adaptée par variante).
- Variantes basées sur `"include"` du JSON de base pour faciliter la maintenance.

---

## Captures d’écran

![Éditeur — coloration sémantique](images/screenshot-editor-dart.jpg)

![Fenêtre complète](images/screenshot-full-window.jpg)

---

## Variantes

| Thème | Description |
|--------|-------------|
| **Nyx** | Référence — bioluminescent cyan / rose. |
| **Nyx Abîme** | Bleu nuit profond, accents cyan. |
| **Nyx Aube** | Fonds plus clairs ; syntaxe renforcée. |
| **Nyx Baie** | Vert lagune, chrome menthe. |
| **Nyx Brume** | Gris-bleu slate ; syntaxe renforcée. |
| **Nyx Cendre** | Gris neutre, style console. |
| **Nyx Minuit** | Très sombre, type OLED. |
| **Nyx Nébuleuse** | Violet / mauve. |
| **Nyx Récif** | Cyan vif, bordures néon. |

---

## Prérequis

- **VS Code** ≥ **1.85** (`engines.vscode`).

---

## Installation manuelle (VSIX)

```bash
git clone https://github.com/SIDIKICONDE/Nyx.git
cd Nyx
npm install
npm run package
```

**Extensions** → **Install from VSIX…** → fichier **`theme-*.vsix`**.

Dans le clone : `make reinstall` (Makefile local).

Si tu développes encore **dans le monorepo Nythy** (`extensions/nyx-theme`), depuis la racine Nythy :

```bash
make nyx-theme-reinstall
# alias : make volt-noir-reinstall
```

---

## Développement

- Ouvrir ce dossier dans l’éditeur, lancer **Extension : Nyx** (F5).
- `npm run sync` — régénère `themes/nyx.json` depuis `.vscode/settings.json` (racine du dépôt Nyx **ou** racine du monorepo Nythy si le dossier y est encore présent).
- `npm run variants:syntax` — régénère la syntaxe des variantes (`scripts/syntax-variant-palettes.mjs`).

**Publication** :

```bash
npx @vscode/vsce login nyx
npx @vscode/vsce publish --no-dependencies
```

Icône : `images/icon.png` (min. **128×128** px).

---

## Licence

MIT — [LICENSE](./LICENSE).  
Copyright (c) Nyx
