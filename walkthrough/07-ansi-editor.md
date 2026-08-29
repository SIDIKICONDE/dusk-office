# ANSI colors in your editor — logs come alive 🎨

Ever opened a `.log` file full of `\x1B[31m` escape sequences and wished they were rendered? Dusk Office does it **natively** — no external tool, no copy-paste into a terminal.

## What it does

- Detects ANSI escape codes (`\x1B[...m`) in any open file
- Renders them using your theme's `terminal.ansi*` palette — so colors always match
- Works in `.log`, `.ansi`, and optionally **all languages**

## Before / After

```text
[ERROR] \x1B[31mConnection refused\x1B[0m to database
[WARN]  \x1B[33mRetrying in 5s...\x1B[0m
[OK]    \x1B[32mConnected\x1B[0m
```

With ANSI in Editor **on**: red, yellow, and green text — just like in your terminal.

## Settings

| Setting | Default | What it does |
| --- | --- | --- |
| `duskOffice.editorAnsi.enabled` | `true` | Master toggle |
| `duskOffice.editorAnsi.allLanguages` | `false` | Opt-in: apply to all files (default is `.log` / `.ansi` only) |

## Why this is a differentiator

Most theme extensions only color *syntax*. Dusk Office colors **runtime output too** — making log review, debugging, and CI output readable without leaving the editor.

---

Click **"Toggle ANSI in Editor"** below to try it. Open any `.log` file to see the difference.
