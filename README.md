# Dusk Office

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](./LICENSE)
[![CI](https://github.com/SIDIKICONDE/dusk-office/actions/workflows/ci.yml/badge.svg)](https://github.com/SIDIKICONDE/dusk-office/actions/workflows/ci.yml)
[![Marketplace](https://img.shields.io/visual-studio-marketplace/v/dekidev.dusk-office?label=Marketplace)](https://marketplace.visualstudio.com/items?itemName=dekidev.dusk-office)
[![Open VSX](https://img.shields.io/open-vsx/v/dekidev/dusk-office?label=Open%20VSX)](https://open-vsx.org/extension/dekidev/dusk-office)

**Dusk Office** is a polished theme suite for **VS Code**, **Cursor**, and **Windsurf** with **27 dark, light, and high-contrast themes**, **semantic highlighting**, **full UI coverage**, **verified terminal contrast**, and an optional **product icon theme**.

Built for developers who want readable code, coherent chrome across the editor and workbench, OLED-friendly night variants, clean daytime options, and theme automation that stays local to the extension.

**Why Dusk Office:**

- **One family, 27 variants** — dark, light, warm, and high-contrast options that still feel related instead of random skins
- **Readable by design** — semantic highlighting, workbench polish, and terminal contrast checks tuned for long sessions
- **Workspace Fingerprint** — on first open, Dusk Office detects your project type (fintech, audit, cybersecurity, ML/data, modern web, frontend, CLI) from `package.json`/`Cargo.toml`/`pyproject.toml`/etc. and suggests the variant tuned for that context (Vault, Audit, Sentinel, Steward, Voltage, Nocturne, Terminal). Local-only, opt-out via `duskOffice.workspaceFingerprint.enabled`.
- **Useful automation** — favorite theme restore, workspace memory, auto switch, adaptive focus, and a Control Center for quick actions
- **Trust-first behavior** — no surprise companion installs, local-only runtime logic, and clean reset options

This **README** is the primary documentation (GitHub and Marketplace). **Public documentation mirror:** [github.com/SIDIKICONDE/dusk-office-docs](https://github.com/SIDIKICONDE/dusk-office-docs). Extended guide — full theme list, terminal palettes, contrast notes — [QUICKSTART-LONG.md](./QUICKSTART-LONG.md) · [same file on the docs repo](https://github.com/SIDIKICONDE/dusk-office-docs/blob/main/QUICKSTART-LONG.md).

**Marketplace:** [dekidev.dusk-office](https://marketplace.visualstudio.com/items?itemName=dekidev.dusk-office)

---

## Screenshots

| Dusk Office Midnight | Dusk Office Abyss | Dusk Office Nocturne |
| :---: | :---: | :---: |
| ![Midnight](https://raw.githubusercontent.com/SIDIKICONDE/dusk-office-docs/main/images/screenshot-01.jpg) | ![Abyss](https://raw.githubusercontent.com/SIDIKICONDE/dusk-office-docs/main/images/screenshot-02.jpg) | ![Nocturne](https://raw.githubusercontent.com/SIDIKICONDE/dusk-office-docs/main/images/screenshot-03.jpg) |

| Dusk Office Finance | Dusk Office Ivory |
| :---: | :---: |
| ![Finance](https://raw.githubusercontent.com/SIDIKICONDE/dusk-office-docs/main/images/screenshot-04.jpg) | ![Ivory](https://raw.githubusercontent.com/SIDIKICONDE/dusk-office-docs/main/images/screenshot-05.jpg) |

---

## Install

**From Marketplace:**

1. Extensions panel → Search `Dusk Office` → **Install**
2. Optional companions only: add Material Icon Theme for file/folder icons or Markdown All in One for Markdown editing if you want them
3. Pick any `Dusk Office` variant from `Preferences: Color Theme`

**From VSIX:**

```bash
# Download from GitHub releases, then:
code --install-extension dusk-office-*.vsix
```

---

## Switch Theme

**Command Palette:**

1. `Cmd/Ctrl + Shift + P` → `Preferences: Color Theme`
2. Pick any `Dusk Office` variant

**Control Center (recommended):**

- `Cmd/Ctrl + Shift + P` → `Dusk Office: Control Center`
- Or click the status bar entry (enable with `duskOffice.statusBar.enabled`)
- Quick actions: switch theme, previous, favorite, auto switch, adaptive focus toggle, apply adaptive theme now, adaptive focus settings, product icons, activity bar position, title bar align, status bar button, workspace theme memory, settings

---

## Pick a Variant

| If you want... | Use |
| --- | --- |
| Very dark, OLED-friendly | **Dusk Office Midnight** |
| Vivid blue-cyan contrast | **Dusk Office Abyss** |
| Warm vintage terminal | **Dusk Office Nocturne** |
| Premium banking aesthetic | **Dusk Office Finance** |
| Electric graphite + neon lime focus | **Dusk Office Voltage** |
| Cyberpunk magenta + electric blue | **Dusk Office Neon** |
| Luxury obsidian + champagne gold | **Dusk Office Luxe** |
| Hacker phosphor green on black | **Dusk Office Terminal** |
| Professional dark for long sessions | **Dusk Office Steward** |
| Soft finance light with reduced glare | **Dusk Office Ledger** |
| Calm security / SOC dark theme | **Dusk Office Secure** |
| Banking / treasury / executive operations | **Dusk Office Vault** |
| Audit / controls / long spreadsheet review | **Dusk Office Audit** |
| Cybersecurity / SOC / monitoring | **Dusk Office Sentinel** |
| Light / daytime | **Dusk Office Ivory** |
| High contrast / accessibility | **Dusk Office High Contrast** |

Full list of 27 variants: [Included Themes](./QUICKSTART-LONG.md#included-themes) · [on GitHub](https://github.com/SIDIKICONDE/dusk-office-docs/blob/main/QUICKSTART-LONG.md#included-themes).

---

## Quick Settings

Open settings (`Cmd/Ctrl + ,`) and search `Dusk Office`:

- `duskOffice.applyFavoriteOnStartup` — auto-load favorite theme
- `duskOffice.rememberWorkspaceTheme` — per-workspace memory
- `duskOffice.autoSwitch.enabled` — auto day/night switch
- `duskOffice.adaptiveFocus.enabled` — auto-adapt by active editor language + time

## Reset Everything

To completely reset all Dusk Office settings and return to VS Code defaults:

**Command Palette:**

- `Cmd/Ctrl + Shift + P` -> `Dusk Office: Reset All Settings`

This will:

- Return to VS Code default theme
- Reset product icons to default
- Reset activity bar position to default
- Clear all Dusk Office preferences and stored values (auto switch + adaptive focus included)
- Remove workspace-specific settings

**Use this when:**

- You want to start fresh with Dusk Office
- Settings are corrupted or not working
- You're uninstalling and want clean removal

---

## Next Steps

- Deep customization: [Settings](./QUICKSTART-LONG.md#settings) · [mirror](https://github.com/SIDIKICONDE/dusk-office-docs/blob/main/QUICKSTART-LONG.md#settings)
- Changelog: [CHANGELOG.md](./CHANGELOG.md) · [mirror](https://github.com/SIDIKICONDE/dusk-office-docs/blob/main/CHANGELOG.md)
- **Color harmony & eye comfort** - how variants stay coherent and easy on the eyes (chrome vs editor, terminal blend, contrast checks): [MAINTENANCE.md](./MAINTENANCE.md) (section *Color harmony & eye comfort*)
- **Terminal contrast verification**: run `Dusk Office: Verify Terminal Contrast` (public command). It now performs real contrast calculations on packaged themes (includes merged), checks `terminal.foreground` and ANSI thresholds, and can open a detailed report. See [Terminal Contrast](./QUICKSTART-LONG.md#check-contrast) for details
- **Adaptive focus (local)**: use `Dusk Office: Toggle Adaptive Focus` and `Dusk Office: Apply Adaptive Theme Now` to adapt themes from active editor language + time, with optional late-night eye comfort and theme lock (`duskOffice.adaptiveFocus.*`)

---

## Also by the same developer

**🛠️ [NythyCleaner](https://nythycleaner.cloud)** — Native macOS utility for developers. Xcode cleanup, disk scanner, AI duplicate detection, real-time monitoring.

[![NythyCleaner logo](https://raw.githubusercontent.com/SIDIKICONDE/dusk-office/main/images/nythycleaner-logo.png)](https://nythycleaner.cloud)

*Sponsored by our own Mac utility — [NythyCleaner](https://nythycleaner.cloud)*
