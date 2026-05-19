# Dusk Office — Extended guide

**Dusk Office** is a theme suite for **Visual Studio Code**, **Cursor**, and **Windsurf** with **27 dark, light, and high-contrast themes**, **semantic highlighting**, **full UI theming**, and an optional **product icon theme**.

**Public copy of this guide:** [dusk-office-docs/QUICKSTART-LONG.md](https://github.com/SIDIKICONDE/dusk-office-docs/blob/main/QUICKSTART-LONG.md).

**Main readme** (install, switch theme, quick settings, Marketplace): **[README.md](./README.md)** · [mirror](https://github.com/SIDIKICONDE/dusk-office-docs/blob/main/README.md).

**Extension source:** [SIDIKICONDE/dusk-office](https://github.com/SIDIKICONDE/dusk-office).

**Open VSX:** [dekidev.dusk-office](https://open-vsx.org/extension/dekidev/dusk-office)

◆ Dream in color ◆

## Overview

`Dusk Office` is a polished theme suite with clean contrast, readable syntax, OLED-friendly dark variants, daytime-friendly light options, and coherent workbench colors.

It includes dark, light, warm, and high-contrast variants for daily use, plus workspace memory, auto switch, adaptive focus, and a matching optional product icon theme.

**Note:** Dusk Office does **not** auto-install other extensions. If you want companion tools, you can add **Material Icon Theme** for Explorer icons and [**Markdown All in One**](https://marketplace.visualstudio.com/items?itemName=yzhang.markdown-all-in-one) for Markdown shortcuts, snippets, TOC, and list helpers. Theme **colors** for the Markdown preview (`textLink`, `markdownAlert`, etc.) still come from Dusk Office's color themes.

**macOS — title bar:** the **system menu bar** (Apple menu) always follows macOS appearance. The **window** title bar is switched to **custom** when a Dusk Office theme is active so it matches `titleBar.*` in the theme (native title bars often stay dark with a light editor theme). Turn off with setting **`duskOffice.titleBar.alignWithTheme`**: `false`, or set **`window.titleBarStyle`**: `native` yourself if you prefer the native bar.

## Highlights

- **Dark themes** for daily work
- **Complete UI theming** — title bar, sidebar, panel, tabs, notifications, status bar, activity bar
- **Markdown preview** — `textLink`, block quotes, fenced code (`textCodeBlock` / `textPreformat`), and GFM **markdownAlert** (note / tip / important / warning / caution) aligned with each variant's palette; if you install **Markdown All in One**, it adds shortcuts, snippets, and list/table helpers for `.md` files
- **Advanced semantic tokens** — const/let/var differentiation, async functions, decorators, type parameters
- **Full Git integration** — gutter decorations, file status colors, diff editor, merge conflicts
- **Complete terminal palette** — ANSI 16 colors with cursor styling
- **Editor enhancements** — line highlight, selection, search matches, word highlight, indent guides
- **Workspace trust indicators** — untrusted content warnings, extension icons
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
| ------ | ------ |
| **Dusk Office** | Core dark theme with cyan and pink accents. |
| **Dusk Office Abyss** | Deep blue night palette with vivid cyan highlights. |
| **Dusk Office Dawn** | Brighter dark surfaces with bold syntax contrast. |
| **Dusk Office Bay** | Lagoon-inspired green tones and fresh chrome. |
| **Dusk Office Mist** | Slate blue-gray palette with balanced contrast. |
| **Dusk Office Ash** | Neutral gray theme with a clean console feel. |
| **Dusk Office Midnight** | Very dark variant, ideal for OLED-style setups. |
| **Dusk Office Nebula** | Purple and mauve accents with a richer atmosphere. |
| **Dusk Office Reef** | Bright cyan neon energy and stronger borders. |
| **Dusk Office Nocturne** | Warm vintage terminal aesthetic with amber and copper accents. |
| **Dusk Office Finance** | Premium banking aesthetic with gold, deep green and navy accents. |
| **Dusk Office Corporate** | Sophisticated burgundy-wine theme with refined gold touches. |
| **Dusk Office Voltage** | Graphite-dark theme with electric lime focus, glacial aqua signals, and coral alert accents. |
| **Dusk Office Neon** | Cyberpunk neon — hot magenta keywords, electric blue strings, dark purple-black base. |
| **Dusk Office Luxe** | Luxury futuriste — champagne gold accents, rose gold highlights, obsidian surfaces, platinum info. |
| **Dusk Office Or** | Deep bronze-gold — antique gold accents on obsidian, warm parchment text, treasury-grade calm. |
| **Dusk Office Terminal** | Hacker terminal — phosphor green on black, amber warnings, CRT-style monochrome energy. |
| **Dusk Office Steward** | Professional dark theme for long sessions — muted gold focus, steel-blue signals, and calm corporate contrast. |
| **Dusk Office Ledger** | Soft finance light theme — paper-like surfaces, blue-gray structure, and reduced glare for prolonged reading. |
| **Dusk Office Secure** | Calm security / SOC dark theme — desaturated teal guidance, restrained amber warnings, and low-fatigue monitoring contrast. |
| **Dusk Office Vault** | Banking / treasury dark theme — executive-grade gold focus, slate-blue structure, and premium boardroom calm. |
| **Dusk Office Audit** | Audit-focused light theme — reduced glare, analytical blue-gray structure, and clean spreadsheet-friendly scanning. |
| **Dusk Office Sentinel** | Cybersecurity dark theme — watchful teal guidance, disciplined alerts, and stable SOC-style monitoring contrast. |
| **Dusk Office Light** | Cool, neutral light theme for daytime work. **Built** from Dusk Office Abyss (`npm run build:light`) — mechanical light remap + UI overrides. |
| **Dusk Office Ivory** | Warm paper-like light theme with copper accents. |
| **Dusk Office Dark Ivory** | Warm dark companion to Ivory with cream text. |
| **Dusk Office High Contrast** | Stronger separation and clearer focus states. |

### High Contrast — contrast targets

**Dusk Office High Contrast** is tuned for **WCAG 2.1**-style contrast on critical UI pairs (normal text **≥ 4.5:1** AA; where possible **≥ 7:1** AAA for primary reading and selection):

| Pair | Target |
| ------ | -------- |
| Default editor text / background | `#ffffff` on `#000000` (ratio **≥ 21:1**) |
| Selection text / selection fill | `#ffffff` on `#264f78` (aim **≥ 7:1** — AAA for body-sized text) |
| Focus rings (`focusBorder`, list focus) | **Yellow** (`#ffff00`) or **cyan** on black for keyboard / focus visibility |
| Inline chat & inline edit panels | **Yellow** widget border on black; **white** input border; **yellow** focus border on the input |

The theme still **`include`s** Dusk Office Abyss for syntax; non-overridden chrome may show Abyss tints. Adjust with `workbench.colorCustomizations` if your environment needs stricter uniformity.

## Installation

See **[README — Install](./README.md#install)** · [GitHub](https://github.com/SIDIKICONDE/dusk-office-docs/blob/main/README.md#install) (Marketplace and VSIX).

## Usage

Enable a theme and daily workflow: **[README — Switch Theme](./README.md#switch-theme)** · [GitHub](https://github.com/SIDIKICONDE/dusk-office-docs/blob/main/README.md#switch-theme).

The extension also ships editor-friendly defaults (semantic highlighting, minimap, guides, sticky scroll); user and workspace settings can override them.

### Control Center

Open the Command Palette and run `Dusk Office: Control Center`, or use the status bar entry when enabled, to:

- switch theme variants
- go back to the previous theme
- save and restore a favorite theme
- toggle auto switch
- toggle adaptive focus
- apply adaptive theme immediately
- open adaptive focus settings
- check the saved workspace theme
- toggle activity bar position
- toggle **Dusk Office · Product** icons (same as command below)
- toggle title bar align with theme
- toggle the status bar button
- clear the workspace theme memory
- configure auto switch (themes and hours)
- open settings

### Command IDs

Registered in `package.json` → `contributes.commands`. Use these IDs in `keybindings.json`, tasks, or automation.

| Command ID | Palette title |
| ------------ | ---------------- |
| `duskOffice.openControlCenter` | Dusk Office: Control Center |
| `duskOffice.switchThemeVariant` | Dusk Office: Choose Theme |
| `duskOffice.switchToPreviousTheme` | Dusk Office: Previous Theme |
| `duskOffice.setFavoriteTheme` | Dusk Office: Set Favorite |
| `duskOffice.switchToFavoriteTheme` | Dusk Office: Favorite Theme |
| `duskOffice.toggleActivityBarLocation` | Dusk Office: Toggle Activity Bar Position |
| `duskOffice.toggleProductIconTheme` | Dusk Office: Toggle Product Icon Theme |
| `duskOffice.toggleAutoSwitch` | Dusk Office: Toggle Auto Switch |
| `duskOffice.toggleAdaptiveFocus` | Dusk Office: Toggle Adaptive Focus |
| `duskOffice.applyAdaptiveFocusTheme` | Dusk Office: Apply Adaptive Theme Now |
| `duskOffice.openSettings` | Dusk Office: Settings |
| `duskOffice.verifyTerminalContrast` | Dusk Office: Verify Terminal Contrast |
| `duskOffice.resetTheme` | Dusk Office: Reset All Settings |

### Settings

Defined in `package.json` → `contributes.configuration` (`duskOffice.*`).

| Key | Default | Description |
| ----- | --------- | ------------- |
| `duskOffice.applyFavoriteOnStartup` | `false` | Apply the favorite theme on startup. |
| `duskOffice.rememberWorkspaceTheme` | `true` | Remember the last Dusk Office theme for each workspace. |
| `duskOffice.statusBar.enabled` | `true` | Show the Dusk Office status bar button. |
| `duskOffice.titleBar.alignWithTheme` | `true` | When a Dusk Office color theme is active, set `window.titleBarStyle` to `custom` so the title bar follows the theme (helps a light editor avoid a stuck-dark native bar on macOS). When you leave Dusk themes or disable this, the previous global title bar style is restored. Does not override if you set `window.titleBarStyle` to `native` yourself in User or Workspace settings. |
| `duskOffice.autoSwitch.enabled` | `false` | Switch between light and dark Dusk Office themes by hour. |
| `duskOffice.autoSwitch.lightTheme` | `Dusk Office Light` | Theme during light hours (enum matches Dusk variants in settings UI). |
| `duskOffice.autoSwitch.darkTheme` | `Dusk Office Midnight` | Theme during dark hours (same enum). |
| `duskOffice.autoSwitch.lightHour` | `7` | Hour (0–23) to start the light theme. |
| `duskOffice.autoSwitch.darkHour` | `18` | Hour (0–23) to start the dark theme. |
| `duskOffice.adaptiveFocus.enabled` | `false` | Auto-adapt theme from active editor language + time. |
| `duskOffice.adaptiveFocus.onlyWhenDuskThemeActive` | `true` | Only auto-apply adaptive focus when a Dusk Office theme is already active. |
| `duskOffice.adaptiveFocus.lateNightEyeComfort` | `true` | Force ultra-dark late-night behavior for eye comfort. |
| `duskOffice.adaptiveFocus.lateNightStartHour` | `22` | Start hour (0–23) for late-night eye comfort mode. |
| `duskOffice.adaptiveFocus.lateNightEndHour` | `5` | End hour (0–23) for late-night eye comfort mode. |
| `duskOffice.adaptiveFocus.lockTheme` | `""` | Force one theme when adaptive focus runs (empty = no lock). |

**Adaptive Focus** and **Auto Day/Night** are mutually exclusive — turning one on disables the other.

#### Adaptive Focus — language rules (runtime)

Source of truth: [`lib/theme-common.js`](./lib/theme-common.js) → `ADAPTIVE_LANGUAGE_RULES`. Day = hours **7–17**; night = all other hours (unless late-night comfort forces **Midnight**, default **22h–5h**).

| Language ID | Day | Night |
|---|---|---|
| `markdown`, `mdx` | Ivory | Nocturne |
| `dart`, `flutter` | Light | Bay |
| `typescript`, `javascript` | Ivory | Nebula |
| `json`, `yaml`, `yml` | Ivory | Ash |
| `shellscript`, `shell`, `bash`, `zsh` | Ivory | Finance |
| `python` | Ivory | Abyss |
| `go` | Ivory | Reef |
| `rust` | Ivory | Corporate |
| `html` | Ivory | Dawn |
| `css` | Ivory | Nebula |
| `sql` | Ivory | Finance |
| `ruby` | Ivory | Nocturne |
| `java` | Light | Corporate |
| `cpp`, `c` | Light | Reef |
| `swift` | Ivory | Midnight |
| `kotlin` | Light | Bay |
| *(other)* | Ivory | Midnight |

CLI preview (same rules): `node scripts/adaptive-focus-mode.mjs --language python --hour 14`

### Editor defaults bundled with the extension

`package.json` → `contributes.configurationDefaults` applies these when the extension is enabled (user/workspace settings still win):

- `editor.semanticHighlighting.enabled` → `true`
- `editor.bracketPairColorization.enabled` → `true`; `editor.bracketPairColorization.independentColorPoolPerBracketType` → `true`
- `editor.guides.bracketPairs` → `active`

### Source of truth (repo)

| What | Where |
| ------ | -------- |
| Color theme list & JSON paths | [`package.json`](./package.json) → `contributes.themes` (**27** themes) |
| Product icon theme | [`package.json`](./package.json) → `contributes.productIconThemes` (`dusk-office-product` → **Dusk Office · Product**) |
| Theme names & Adaptive Focus rules | [`lib/theme-common.js`](./lib/theme-common.js) → `THEME_VARIANTS`, `ADAPTIVE_LANGUAGE_RULES` (CLI: `scripts/adaptive-focus-mode.mjs`) |
| Runtime state keys | [`lib/extension-keys.js`](./lib/extension-keys.js) + orchestration in [`extension.js`](./extension.js) |
| Build & theme pipeline | Internal maintainer documentation only (not published). |

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

## Terminal Colors

Integrated terminal uses **`terminal.background`** = **`panel`** and **`terminal.foreground`** = **`fg`** from each entry in `scripts/palettes-extended-ui.json` (applied by `merge-extended-ui-colors.mjs`). ANSI slots map to the same palette (errors, accents, success, etc.), so each **dark variant** keeps a coherent "profile" (fond + texte + couleurs d'échappement).

### Dark variants — `panel` and default text (`fg`)

| Variant | `panel` (terminal bg) | `fg` (default terminal text) |
| --------- | ------------------------ | ------------------------------ |
| Midnight | `#010102` | `#d1e0e8` |
| Abyss | `#030810` | `#cfe8f0` |
| Reef | `#011018` | `#cffafe` |
| Bay | `#051c14` | `#ecfdf5` |
| Dawn | `#243a4e` | `#fafcff` |
| Mist | `#202c3a` | `#f4f9fc` |
| Ash | `#1e2228` | `#e5e7eb` |
| Nebula | `#0c0618` | `#f3e8ff` |
| Nocturne | `#1e1f29` | `#f8f8f2` |
| Finance | `#0a1219` | `#e8e6e3` |
| Corporate | `#181a1c` | `#c5c8c6` |

**Light** and **Ivory** themes use a light `terminal.background`; ANSI values still follow the merge pipeline but are tuned for dark shells — contrast on light panels is not the same as on dark `panel` values above.

### Default ANSI mapping (Dusk Office / Abyss family)

All themes include a complete ANSI color palette (exact hex depends on variant):

| Color | Standard | Bright |
| ------- | ---------- | -------- |
| Black | `#1e1e1e` | `#6b7280` |
| Red | `#f87171` | `#fca5a5` |
| Green | `#22c55e` | `#86efac` |
| Yellow | `#fbbf24` | `#fde047` |
| Blue | `#38bdf8` | `#93c5fd` |
| Magenta | `#c084fc` | `#f0abfc` |
| Cyan | `#22d3ee` | `#67e8f9` |
| White | `#e5e5e5` | `#fafafa` |

Terminal cursor and selection colors match the active theme accent.

### Check contrast

**For users (public):**
Run the built-in VS Code command:

- `Cmd/Ctrl + Shift + P` -> `Dusk Office: Verify Terminal Contrast`

This displays contrast ratios for all Dusk Office themes and confirms WCAG AA compliance (4.5:1 minimum).
It runs real checks on packaged themes, merges `include` chains, and can open a detailed markdown report from the command result.

**For developers (local source):**
After regenerating themes, run:

```bash
npm run verify:terminal
```

This verifies **`terminal.foreground`** vs **`terminal.background`** (WCAG **4.5:1** for default text) and, for **`vs-dark`** / **`hc-black`** themes, ANSI colors (except black slots) at **≥ 2.9:1** vs the terminal background. **Light** themes (`uiTheme: vs`) only check the default terminal text contrast — ANSI checks are skipped because the same hexes target dark terminal backgrounds.

### Reset everything

**For users (public):**
Run the built-in VS Code command:

- `Cmd/Ctrl + Shift + P` -> `Dusk Office: Reset All Settings`

This completely resets all Dusk Office settings and returns to VS Code defaults, including themes, product icons, activity bar position, auto switch, adaptive focus settings, and all stored preferences.

**For developers (local source):**
If you need to reset development settings or clear corrupted state, you can also run the same command - it works identically for both users and developers.

Quick “if you want…” picks and the full theme table: **[README — Pick a Variant](./README.md#pick-a-variant)** · [GitHub](https://github.com/SIDIKICONDE/dusk-office-docs/blob/main/README.md#pick-a-variant) and [Included Themes](#included-themes) above.

---

## Also by the same developer

See **[README — Also by the same developer](./README.md#also-by-the-same-developer)** · [GitHub](https://github.com/SIDIKICONDE/dusk-office-docs/blob/main/README.md#also-by-the-same-developer) (NythyCleaner and links).
