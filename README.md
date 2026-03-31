# Dusk Office

Dark themes for **Visual Studio Code** and **Cursor**, designed to make coding more comfortable and visually elegant.

**Publisher:** [DEKI](https://marketplace.visualstudio.com/publishers/dekidev)  
**Marketplace:** [dekidev.dusk-office](https://marketplace.visualstudio.com/items?itemName=dekidev.dusk-office)

## Overview

`Dusk Office` is a theme pack built around clean contrast, readable syntax, and a polished workbench.

It includes deep dark variants, softer dark alternatives, bright accent palettes, and warm light themes for daytime use. The goal is simple: make long coding sessions easier on the eyes without losing visual clarity.

## Highlights

- Carefully balanced dark themes for daily development
- Cohesive editor and workbench styling
- Semantic highlighting and TextMate token styling
- Variants for dark, light, warm, and high-contrast preferences
- Good defaults for minimap, guides, sticky scroll, and editor clarity

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

The extension also ships with editor-friendly defaults such as semantic highlighting, minimap visibility, bracket guides, and sticky scroll. Your user or workspace settings can always override them.

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
npm run package
```

This creates a file like `dusk-office-0.6.9.vsix`.

### Install Locally

```bash
npm run install-vsix
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
[`editor dart`](images/screenshot-editor-dart.png) ·
[`full window`](images/screenshot-full-window.png) ·
[`focused editor`](images/screenshot-editor-focused.png) ·
[`workbench overview`](images/screenshot-workbench-overview.png)

<!-- VS Code / Cursor Extension tab: images must use https (relative paths do not load). URLs below expect these files on `main`. -->
![Editor semantic highlighting](https://raw.githubusercontent.com/SIDIKICONDE/dusk-office/main/images/screenshot-editor-dart.png)

![Full window](https://raw.githubusercontent.com/SIDIKICONDE/dusk-office/main/images/screenshot-full-window.png)

![Focused editor layout](https://raw.githubusercontent.com/SIDIKICONDE/dusk-office/main/images/screenshot-editor-focused.png)

![Workbench overview](https://raw.githubusercontent.com/SIDIKICONDE/dusk-office/main/images/screenshot-workbench-overview.png)

## Repository

- GitHub: [SIDIKICONDE/dusk-office](https://github.com/SIDIKICONDE/dusk-office)
- Marketplace: [dekidev.dusk-office](https://marketplace.visualstudio.com/items?itemName=dekidev.dusk-office)
