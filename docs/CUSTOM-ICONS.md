# Custom Icons Guide for Dusk Office

This guide explains how to create custom icons for the **Product Icon Theme** (UI icons).

## Table of Contents
- [Product Icon Theme (UI Icons)](#product-icon-theme-ui-icons)
- [File Icons (Explorer Icons)](#file-icons-explorer-icons)

---

## Product Icon Theme (UI Icons)

Product Icon Themes change the icons used throughout VS Code's interface (activity bar, buttons, menus, etc.).

### Current Status
- **Theme file**: `producticons/dusk-office-product-icon-theme.json`
- **Font file**: `producticons/dusk-office-codicon.ttf`
- **Icon count**: 535 icons (all Codicons mapped)

### Why icons don't visually change
Currently, `dusk-office-codicon.ttf` is **identical** to VS Code's default Codicons font. To see visual changes, you need to create a custom font with different glyphs.

### Creating a Custom UI Icon Font

#### Option 1: Modify Existing Codicons (Recommended)

1. **Extract Codicons SVGs**
   ```bash
   # Codicons SVGs are in node_modules/@vscode/codicons/dist/codicon.svg
   # Or use the individual SVGs from the codicons package
   ```

2. **Modify the SVGs**
   - Change colors (though VS Code applies its own colors)
   - Adjust shapes slightly
   - Add unique design elements

3. **Generate the font**
   Use one of these tools:
   - **[IcoMoon](https://icomoon.io/)** (web-based, easy)
   - **[Fontello](https://fontello.com/)** (web-based)
   - **[fantasticon](https://github.com/nickmillerdev/fantasticon)** (CLI, used by VS Code)

   ```bash
   # Using fantasticon
   npx fantasticon
   ```

4. **Replace the font**
   - Save the generated `.ttf` as `producticons/dusk-office-codicon.ttf`
   - Keep the same font ID: `dusk-office-codicon`
   - Keep the same codepoints (Unicode mappings)

#### Option 2: Use a Different Icon Set

1. Choose an icon set (e.g., Feather Icons, Heroicons, Phosphor)
2. Map each VS Code icon name to an icon from your set
3. Generate a font with the correct Unicode codepoints
4. Update `dusk-office-product-icon-theme.json` with new mappings

### Important: Codepoint Mapping

VS Code expects specific Unicode codepoints for each icon. The mapping is:

| Icon Name | Unicode |
|-----------|---------|
| `files` | `\EBDF` |
| `search` | `\EC0D` |
| `source-control` | `\EC6F` |
| `debug` | `\EAAF` |
| `extensions` | `\EB29` |
| ... | ... |

**You must preserve these codepoints** or VS Code won't display the correct icons.

### Testing Your Custom Font

1. Build the extension: `make package`
2. Install: `make install-vsix`
3. Enable the icon theme: `Dusk Office: Toggle Icons`
4. Check various UI elements (activity bar, explorer, etc.)

---

## File Icons (Explorer Icons)

Explorer file/folder icons are provided by **Material Icon Theme**.

### Current Status

- **Recommended extension**: `PKief.material-icon-theme`

This extension is listed in `extensionPack`, so it will be installed together with Dusk Office.

---

## Quick Reference

| Task | Command |
|------|---------|
| Generate product icons JSON | `node scripts/generate-icons.mjs` |
| Build extension | `make package` |
| Install extension | `make install-vsix` |
| Full rebuild + install | `make reinstall` |

---

## Resources

- [VS Code Icon Theme Guide](https://code.visualstudio.com/api/extension-guides/icon-theme)
- [Codicons Repository](https://github.com/microsoft/vscode-codicons)
- [IcoMoon App](https://icomoon.io/app)
- [Fontello](https://fontello.com/)
- [fantasticon](https://github.com/nickmillerdev/fantasticon)
