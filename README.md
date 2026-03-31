# Nyx by DEKI

Thirteen color themes for **Visual Studio Code** and **Cursor**: bioluminescent dark variants, light themes (**Light**, **Ivory**), warm **Dark Ivory**, and a **high-contrast** mode. Semantic highlighting plus a cohesive workbench (side bars, panels, terminal, minimap).

**Publisher:** [DEKI](https://marketplace.visualstudio.com/publishers/deki) · **Marketplace:** [Nyx by DEKI](https://marketplace.visualstudio.com/items?itemName=deki.nyx-color-themes)

---

## Installation

**Windows and macOS** use the same steps in the editor.

1. Open **Extensions** — **Windows:** `Ctrl+Shift+X` · **macOS:** `Cmd+Shift+X`.
2. Search for **Nyx by DEKI**, **deki.nyx-color-themes**, or **deki nyx**, then click **Install**.

To install from a **.vsix** file: **Extensions → … → Install from VSIX…**.

**Requirements:** VS Code or Cursor **1.85** or newer.

### Build the VSIX locally (Windows & macOS)

1. Install [Node.js](https://nodejs.org/) (LTS).
2. In the repo folder: `npm install` then `npm run package` — this creates `nyx-color-themes-*.vsix`.
3. Install it: use **Install from VSIX…** above, or run `npm run install-vsix` (needs `cursor` / `code` on your **PATH**, or a default install path — macOS and Windows are both supported by the script).

If you have **make** (macOS/Linux, or Windows with make installed): `make reinstall` packages and installs the latest VSIX into Cursor by default (`make reinstall EDITOR=code` for VS Code).

---

## Usage

**Switch theme:** **Preferences** → **Color Theme**, then pick any **Nyx** variant.

The extension ships sensible defaults (**Nyx Midnight**, minimap on, semantic highlighting, bracket guides, and more). Change anything in your editor **Settings**; your choices override these defaults.

### Accessibility

- **Nyx High Contrast** — stronger contrast, clear borders and focus.
- **Nyx Light** — clean light UI for daytime use.
- **Nyx Ivory** — warm light theme, base **#F6EEDE**, copper and amber accents.
- **Nyx Dark Ivory** — warm dark theme, cream text on a deep background.

---

## Included themes

| Name | Mood |
|------|------|
| **Nyx** | Base dark — cyan and pink, bioluminescent look. |
| **Nyx Abyss** | Deep blue night, cyan accents. |
| **Nyx Dawn** | Slightly lifted darks, bold syntax. |
| **Nyx Bay** | Lagoon green, mint chrome. |
| **Nyx Mist** | Slate blue-gray, bold syntax. |
| **Nyx Ash** | Neutral gray, console feel. |
| **Nyx Midnight** | Very dark, OLED-friendly. |
| **Nyx Nebula** | Purple and mauve. |
| **Nyx Reef** | Bright cyan, neon borders. |
| **Nyx Light** | Cool / neutral light UI. |
| **Nyx Ivory** | Warm light — **#F6EEDE** base. |
| **Nyx Dark Ivory** | Warm dark companion to **Ivory**. |
| **Nyx High Contrast** | System high-contrast mode. |

---

## Screenshots

<!-- VS Code / Cursor Extension tab: images must use https (relative paths do not load). URLs below expect these files on `main` (push after changing screenshots). -->
![Editor — semantic highlighting](https://raw.githubusercontent.com/SIDIKICONDE/Nyx/main/images/screenshot-editor-dart.png)

![Full window](https://raw.githubusercontent.com/SIDIKICONDE/Nyx/main/images/screenshot-full-window.png)

![Editor — focused layout](https://raw.githubusercontent.com/SIDIKICONDE/Nyx/main/images/screenshot-editor-focused.png)

![Workbench overview](https://raw.githubusercontent.com/SIDIKICONDE/Nyx/main/images/screenshot-workbench-overview.png)
