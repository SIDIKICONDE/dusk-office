# Dusk Office

Dark themes for **Visual Studio Code** and **Cursor**.

**Publisher:** [DEKI](https://marketplace.visualstudio.com/publishers/dekidev)  
**Marketplace:** [dekidev.dusk-office](https://marketplace.visualstudio.com/items?itemName=dekidev.dusk-office)  
**Open VSX:** [dekidev.dusk-office](https://open-vsx.org/extension/dekidev/dusk-office)

## Overview

`Dusk Office` is a theme pack with clean contrast and readable syntax.

It includes dark, light, warm, and high-contrast variants for daily use.

**Note:** This extension installs **Material Icon Theme** for file/folder icons in the Explorer.

## Highlights

- Dark themes for daily work
- Cohesive editor and workbench styling
- **Material Icon Theme** included for file icons
- Control Center for quick theme actions
- Auto switch by hour
- Favorite theme on startup
- Per-workspace theme memory
- Status bar switcher
- Semantic highlighting and TextMate token styling
- Variants for dark, light, warm, and high-contrast setups
- Good editor defaults

## Included Themes

| Theme | Style |
|------|------|
| **Dusk Office** | Core dark theme with cyan and pink accents. |
| **Dusk Office Abyss** | Deep blue night palette with vivid cyan highlights. |
| **Dusk Office Dawn** | Brighter dark surfaces with bold syntax contrast. |
| **Dusk Office Bay** | Lagoon-inspired green tones and fresh chrome. |
| **Dusk Office Mist** | Slate blue-gray palette with balanced contrast. |
| **Dusk Office Ash** | Neutral gray theme with a clean console feel. |
| **Dusk Office Midnight** | Very dark variant, ideal for OLED-style setups. |
| **Dusk Office Nebula** | Purple and mauve accents with a richer atmosphere. |
| **Dusk Office Reef** | Bright cyan neon energy and stronger borders. |
| **Dusk Office Nocturne** | Smooth dark variant for a calmer night workflow. |
| **Dusk Office Finance** | Professional dark styling with restrained accents. |
| **Dusk Office Corporate** | Clean business-oriented dark palette. |
| **Dusk Office Light** | Cool, neutral light theme for daytime work. |
| **Dusk Office Ivory** | Warm paper-like light theme with copper accents. |
| **Dusk Office Dark Ivory** | Warm dark companion to Ivory with cream text. |
| **Dusk Office High Contrast** | Stronger separation and clearer focus states. |

## Installation

### From the Marketplace

1. Open the Extensions panel.
2. Search for `Dusk Office`, `dekidev.dusk-office`, or `dusk office`.
3. Click **Install**.

### From a VSIX

1. Open **Extensions**.
2. Open the `...` menu.
3. Choose **Install from VSIX...**
4. Select your generated `dusk-office-*.vsix` file.

## Usage

To enable a theme:

1. Open **Preferences: Color Theme**
2. Select any `Dusk Office` variant

The extension also ships with editor-friendly defaults such as semantic highlighting, minimap, guides, and sticky scroll. User and workspace settings can override them.

### Control Center

Open the Command Palette and run `Dusk Office: Control Center` to:

- switch theme variants
- go back to the previous theme
- save and restore a favorite theme
- toggle auto switch
- check the saved workspace theme
- enable or disable `Dusk Office Icons`
- open settings

### Extra Theme Tools

`Dusk Office` also includes:

- auto switch between light and dark variants by hour
- optional favorite theme restore on startup
- workspace theme memory for different projects
- a status bar button that opens the Control Center

### Settings

Available extension settings:

- `duskOffice.applyFavoriteOnStartup`
- `duskOffice.rememberWorkspaceTheme`
- `duskOffice.statusBar.enabled`
- `duskOffice.autoSwitch.enabled`
- `duskOffice.autoSwitch.lightTheme`
- `duskOffice.autoSwitch.darkTheme`
- `duskOffice.autoSwitch.lightHour`
- `duskOffice.autoSwitch.darkHour`

For Explorer file/folder icons, this extension installs **Material Icon Theme** (as an extension pack).

### Optional: secondary Git gutter (staged)

The theme JSON schema does not allow `editorGutter.*SecondaryBackground` keys. To still color **staged** stripes differently from **unstaged**, add `workbench.colorCustomizations` for your active theme label, for example **Dusk Office**:

```json
"workbench.colorCustomizations": {
  "[Dusk Office]": {
    "editorGutter.modifiedSecondaryBackground": "#fbbf2499",
    "editorGutter.addedSecondaryBackground": "#22c55e99",
    "editorGutter.deletedSecondaryBackground": "#ef444499"
  }
}
```

Use matching accent hexes if you use another variant.

## Recommended Variants

- **Dusk Office Midnight** for a very dark, focused setup
- **Dusk Office Abyss** for vivid blue-cyan contrast
- **Dusk Office Finance** for a professional dark workspace with restrained accents
- **Dusk Office Ivory** for a warm light reading experience
- **Dusk Office High Contrast** for stronger visual separation

## Local Development

### Requirements

- Node.js LTS
- VS Code or Cursor `1.85+`

### Build

```bash
npm install
npm run make:release:no-bump
```

This creates a file like `dusk-office-0.7.11.vsix` and keeps only the current VSIX in the project root.

### Install Locally

```bash
npm run install-vsix
```

Common local workflows:

```bash
npm run make:full
npm run release:patch:install
```

If `make` is available, you can also use:

```bash
make reinstall
```

For VS Code instead of Cursor:

```bash
make reinstall EDITOR=code
```

## Screenshots

These images use public `https` URLs so they can render in the VS Code and Cursor Marketplace.

If GitHub does not show them immediately, open the local files from the repository:
[`full window`](images/screenshot-full-window.png) ·
[`focused editor`](images/screenshot-editor-focused.png) ·
[`workbench overview`](images/screenshot-workbench-overview.png)

<!-- VS Code / Cursor Extension tab: images must use https (relative paths do not load). URLs below expect these files on `main`. -->
![Full window](https://raw.githubusercontent.com/SIDIKICONDE/dusk-office/main/images/screenshot-full-window.png)

![Focused editor layout](https://raw.githubusercontent.com/SIDIKICONDE/dusk-office/main/images/screenshot-editor-focused.png)

![Workbench overview](https://raw.githubusercontent.com/SIDIKICONDE/dusk-office/main/images/screenshot-workbench-overview.png)

## Repository

- GitHub: [SIDIKICONDE/dusk-office](https://github.com/SIDIKICONDE/dusk-office)
- Marketplace: [dekidev.dusk-office](https://marketplace.visualstudio.com/items?itemName=dekidev.dusk-office)
- Open VSX: [dekidev.dusk-office](https://open-vsx.org/extension/dekidev/dusk-office)

## Author

**DEKI** — [GitHub](https://github.com/SIDIKICONDE) · [Marketplace](https://marketplace.visualstudio.com/publishers/dekidev)
