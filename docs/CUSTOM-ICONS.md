# Custom Icons Guide for Dusk Office

This guide explains how to create custom icons for both **Product Icon Theme** (UI icons) and **File Icon Theme** (Explorer icons).

## Table of Contents
- [Product Icon Theme (UI Icons)](#product-icon-theme-ui-icons)
- [File Icon Theme (Explorer Icons)](#file-icon-theme-explorer-icons)

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

## File Icon Theme (Explorer Icons)

File Icon Themes change the icons for files and folders in the Explorer.

### Current Status
- **Theme file**: `fileicons/dusk-office-file-icon-theme.json`
- **Icons directory**: `fileicons/icons/`
- **Icon count**: 92 SVG icons generated

### How It Works

The theme maps:
- **File extensions** → icons (e.g., `.js` → `javascript.svg`)
- **File names** → icons (e.g., `package.json` → `npm.svg`)
- **Language IDs** → icons (e.g., `typescript` → `typescript.svg`)

### Regenerating Icons

Run the generation script:
```bash
node scripts/generate-file-icons.mjs
```

This script:
1. Reads the icon definitions from `dusk-office-file-icon-theme.json`
2. Generates SVG files with the Dusk Office color palette
3. Saves them to `fileicons/icons/`

### Customizing File Icons

1. **Edit the script**: `scripts/generate-file-icons.mjs`
   - Modify the `colors` object to change the palette
   - Modify individual icon generators for custom shapes

2. **Add new icons**:
   - Add a new generator function in the `icons` object
   - Add the mapping in `dusk-office-file-icon-theme.json`

3. **Regenerate**: `node scripts/generate-file-icons.mjs`

### Color Palette

```javascript
const colors = {
  primary: '#c586c0',      // Mauve/rosé (main accent)
  secondary: '#569cd6',    // Blue
  tertiary: '#dcdcaa',     // Yellow
  quaternary: '#4ec9b0',   // Cyan
  quinary: '#ce9178',      // Orange
  senary: '#d16969',       // Red
  septenary: '#6a9955',    // Green
  octonary: '#808080',     // Gray
  folder: '#dcb67a',       // Gold (folders)
  file: '#cccccc',         // Light gray (files)
};
```

---

## Quick Reference

| Task | Command |
|------|---------|
| Generate product icons JSON | `node scripts/generate-icons.mjs` |
| Generate file icons SVGs | `node scripts/generate-file-icons.mjs` |
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
