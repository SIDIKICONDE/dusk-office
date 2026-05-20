# Dusk Office — exports pour autres IDE

Ces fichiers sont **générés** depuis les thèmes VS Code du dépôt (workbench complet : ~500+ clés `colors`, `tokenColors`, `semanticTokenColors`). Régénération :

```bash
npm run export:ide
# ou
make export-ide
```

## Formats disponibles

| Dossier | IDE / outil | Couverture UI |
| --- | --- | --- |
| `vscode/` | **Tout outil lisant les thèmes VS Code** | **100 %** — thème aplati sans `include` |
| `palettes/` | Scripts / ponts personnalisés | Workbench brut + groupes UI |
| `neovim/colors/` | **Neovim** | Éditeur + barre d’état, onglets, sidebar, git, diagnostics |
| `emacs/` | **Emacs** | Éditeur + mode-line, region, diff |
| `zed/` | **Zed** | Workbench mappé (tabs, panel, toolbar, git, terminal) |
| `helix/` | **Helix** | ~60 clés `ui.*` + syntaxe + palette terminal |
| `jetbrains/` | **IntelliJ** (fichiers `.icls` bruts) | Éditeur — le plugin embarque aussi `.theme.json` UI complète |
| `base16/` | **Base16** (Alacritty, etc.) | 16 couleurs dérivées du workbench |

> **UI complète** : `exports/vscode/*.json`. Les autres formats poussent le maximum supporté par chaque IDE (pas d’équivalent pixel-perfect pour tout le chrome VS Code).

---

## VS Code (JSON résolu — toute l’UI)

```bash
cp exports/vscode/dusk-office-minuit.json /chemin/vers/themes/
```

Contient **toutes** les clés `colors` fusionnées + `tokenColors` + `semanticTokenColors` (sans `include`).

Pour **Cursor / Windsurf / VSCodium** avec l’extension : préférer le Marketplace (Control Center, fingerprint, etc.). Ce JSON sert aux outils qui importent un thème VS Code brut.

---

## Neovim

```bash
cp exports/neovim/colors/dusk-office-minuit.lua ~/.config/nvim/colors/
```

Dans `init.lua` :

```lua
vim.cmd("colorscheme dusk_office_minuit")
```

---

## Emacs

```bash
cp exports/emacs/dusk-office-minuit-theme.el ~/.emacs.d/themes/
```

```elisp
(load-theme 'dusk_office_minuit t)
```

---

## Zed

```bash
mkdir -p ~/.config/zed/themes
cp exports/zed/dusk-office-minuit.json ~/.config/zed/themes/
```

Puis **Settings → Theme** et choisir la variante « Dusk Office … ».

---

## Helix

```bash
mkdir -p ~/.config/helix/themes
cp exports/helix/dusk-office-minuit.toml ~/.config/helix/themes/
```

Dans `config.toml` :

```toml
theme = "dusk-office-minuit"
```

(Adapter le nom au champ `name` du fichier TOML.)

---

## JetBrains (IntelliJ IDEA, etc.)

**Recommandé — plugin Marketplace** (dans ce dépôt) :

```bash
npm run jetbrains:build
# Installer : build/distributions/dusk-office-jetbrains-*.zip
# Settings → Plugins → Install from Disk
```

Voir [jetbrains-plugin/README.md](../jetbrains-plugin/README.md) pour publier sur [JetBrains Marketplace](https://plugins.jetbrains.com).

**Manuel** (un seul schéma) :

1. **Settings → Editor → Color Scheme**
2. ⚙️ → **Import Scheme…**
3. Choisir `exports/jetbrains/dusk-office-minuit.icls`

---

## Base16

Utiliser avec [base16-manager](https://github.com/base16-manager/base16-manager), [tinted-theming](https://github.com/tinted-theming/home), ou tout outil compatible Base16.

---

## Extension VS Code (recommandé)

**Cursor / Windsurf / VSCodium / VS Code** : installer l’extension **Dusk Office** (Marketplace / Open VSX) pour les 27 variantes et les fonctions (fingerprint, adaptive focus, etc.).
