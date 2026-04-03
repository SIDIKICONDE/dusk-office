#!/usr/bin/env node

/**
 * Enhance all Dusk themes with:
 * 1. Advanced semantic tokens
 * 2. Git colors
 * 3. Terminal colors
 */

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const THEMES_DIR = 'themes';

// Advanced semantic tokens
const SEMANTIC_TOKENS = {
  // Variable kinds
  "variable": "#b8d4e4",
  "variable.readonly": "#9333ea",
  "variable.readonly.local": "#9333ea",
  "variable.readonly.global": "#7c3aed",
  "variable.readonly.member": "#8b5cf6",
  "variable.mutable": {
    "foreground": "#b8d4e4",
    "underline": true
  },
  "variable.constant": {
    "foreground": "#9333ea",
    "bold": true
  },
  
  // const vs let vs var
  "variable.declaration.const": {
    "foreground": "#9333ea",
    "bold": true
  },
  "variable.declaration.let": "#b8d4e4",
  "variable.declaration.var": {
    "foreground": "#b8d4e4",
    "italic": true
  },
  
  // Function types
  "function": "#06b6d4",
  "function.declaration": "#06b6d4",
  "function.definition": "#22d3ee",
  "function.call": "#22d3ee",
  "function.member": "#22d3ee",
  "function.static": {
    "foreground": "#0891b2",
    "italic": true
  },
  "function.private": {
    "foreground": "#06b6d4",
    "italic": true
  },
  
  // Async functions
  "function.async": {
    "foreground": "#06b6d4",
    "italic": true
  },
  "method.async": {
    "foreground": "#22d3ee",
    "italic": true
  },
  
  // Types
  "class": {
    "foreground": "#ca8a04",
    "bold": true
  },
  "class.declaration": {
    "foreground": "#ca8a04",
    "bold": true
  },
  "class.definition": "#ca8a04",
  "class.abstract": {
    "foreground": "#eab308",
    "italic": true
  },
  "interface": {
    "foreground": "#eab308",
    "italic": true
  },
  "interface.declaration": {
    "foreground": "#eab308",
    "italic": true
  },
  "struct": "#ca8a04",
  "struct.declaration": "#ca8a04",
  "enum": "#ca8a04",
  "enum.declaration": "#ca8a04",
  "enumMember": "#9333ea",
  
  // Type aliases and parameters
  "type": "#0891b2",
  "typeAlias": {
    "foreground": "#0891b2",
    "italic": true
  },
  "typeParameter": {
    "foreground": "#0891b2",
    "italic": true
  },
  
  // Namespaces and modules
  "namespace": "#0891b2",
  "namespace.declaration": {
    "foreground": "#0891b2",
    "bold": true
  },
  "module": "#0891b2",
  "module.declaration": {
    "foreground": "#0891b2",
    "bold": true
  },
  
  // Methods
  "method": "#22d3ee",
  "method.declaration": "#22d3ee",
  "method.definition": "#22d3ee",
  "method.static": {
    "foreground": "#0891b2",
    "italic": true
  },
  "method.private": {
    "foreground": "#22d3ee",
    "italic": true
  },
  "method.deprecated": {
    "foreground": "#22d3ee",
    "strikethrough": true
  },
  
  // Properties
  "property": "#0891b2",
  "property.readonly": "#0891b2",
  "property.static": {
    "foreground": "#0891b2",
    "italic": true
  },
  "property.private": {
    "foreground": "#0891b2",
    "italic": true
  },
  "property.deprecated": {
    "foreground": "#0891b2",
    "strikethrough": true
  },
  
  // Parameters
  "parameter": "#ea580c",
  "parameter.readonly": {
    "foreground": "#ea580c",
    "italic": true
  },
  "selfParameter": {
    "foreground": "#db2777",
    "italic": true
  },
  "selfKeyword": {
    "foreground": "#db2777",
    "italic": true
  },
  
  // Decorators and macros
  "decorator": {
    "foreground": "#f97316",
    "italic": true
  },
  "macro": "#9333ea",
  "macro.declaration": {
    "foreground": "#9333ea",
    "bold": true
  },
  "attribute": {
    "foreground": "#f97316",
    "italic": true
  },
  
  // Keywords
  "keyword": "#db2777",
  "keyword.control": "#db2777",
  "keyword.control.flow": {
    "foreground": "#db2777",
    "italic": true
  },
  "keyword.control.async": {
    "foreground": "#db2777",
    "italic": true
  },
  "keyword.control.import": "#db2777",
  "keyword.control.export": "#db2777",
  "keyword.modifier": {
    "foreground": "#db2777",
    "italic": true
  },
  "keyword.declaration": "#db2777",
  
  // Operators
  "operator": "#22d3ee",
  "operator.overloaded": {
    "foreground": "#22d3ee",
    "bold": true
  },
  
  // Literals
  "number": "#a855f7",
  "number.float": "#a855f7",
  "number.hex": "#a855f7",
  "number.binary": "#a855f7",
  "number.octal": "#a855f7",
  "string": "#34d399",
  "string.regex": "#ec4899",
  "string.escape": "#f472b6",
  "string.key": "#34d399",
  "boolean": "#a855f7",
  "null": {
    "foreground": "#a855f7",
    "italic": true
  },
  
  // Comments
  "comment": {
    "foreground": "#9ccae0",
    "italic": true
  },
  "comment.documentation": {
    "foreground": "#9ccae0",
    "italic": true
  },
  "comment.todo": {
    "foreground": "#fbbf24",
    "bold": true
  },
  "comment.note": {
    "foreground": "#38bdf8",
    "italic": true
  },
  "comment.warning": {
    "foreground": "#fbbf24",
    "bold": true
  },
  "comment.error": {
    "foreground": "#f87171",
    "bold": true
  },
  
  // Special
  "lifetime": {
    "foreground": "#ea580c",
    "italic": true
  },
  "label": {
    "foreground": "#ea580c",
    "italic": true
  },
  "punctuation": "#d1e0e8",
  "punctuation.bracket": "#d1e0e8",
  "punctuation.bracket.angle": "#22d3ee",
  "punctuation.delimiter": "#d1e0e8",
  "punctuation.separator": "#d1e0e8",
  
  // Modifiers (applied with *)
  "*.async": {
    "italic": true
  },
  "*.static": {
    "foreground": "#9333ea",
    "italic": true
  },
  "*.abstract": {
    "italic": true
  },
  "*.deprecated": {
    "strikethrough": true
  },
  "*.readonly": {
    "underline": true
  },
  "*.constant": {
    "bold": true
  },
  "*.private": {
    "italic": true
  },
  "*.protected": {
    "italic": true
  },
  "*.public": {},
  "*.unsafe": {
    "foreground": "#f87171"
  },
  
  // Library defaults
  "class.defaultLibrary": "#eab308",
  "function.defaultLibrary": "#0891b2",
  "variable.defaultLibrary": "#0891b2",
  "property.defaultLibrary": "#0891b2",
  "method.defaultLibrary": "#0891b2",
};

// Git decoration colors
const GIT_COLORS = {
  // Editor gutter (already in most themes, but ensure consistency)
  "editorGutter.modifiedBackground": "#fbbf24cc",
  "editorGutter.addedBackground": "#22c55ecc",
  "editorGutter.deletedBackground": "#ef4444cc",
  "editorGutter.commentRangeForeground": "#9ccae066",
  "editorGutter.commentGlyphForeground": "#22d3ee",
  "editorGutter.foldingControlForeground": "#4b6c7a",
  
  // Editor overview ruler
  "editorOverviewRuler.modifiedForeground": "#fbbf24dd",
  "editorOverviewRuler.addedForeground": "#22c55edd",
  "editorOverviewRuler.deletedForeground": "#ef4444dd",
  
  // Git decorations in explorer
  "gitDecoration.addedResourceForeground": "#22c55e",
  "gitDecoration.modifiedResourceForeground": "#fbbf24",
  "gitDecoration.deletedResourceForeground": "#ef4444",
  "gitDecoration.renamedResourceForeground": "#38bdf8",
  "gitDecoration.stageModifiedResourceForeground": "#fbbf24",
  "gitDecoration.stageDeletedResourceForeground": "#ef4444",
  "gitDecoration.untrackedResourceForeground": "#6b7280",
  "gitDecoration.ignoredResourceForeground": "#4b6c7a",
  "gitDecoration.conflictingResourceForeground": "#f97316",
  
  // SCM (Source Control Management)
  "scmGraph.foreground1": "#22d3ee",
  "scmGraph.foreground2": "#38bdf8",
  "scmGraph.foreground3": "#c084fc",
  "scmGraph.foreground4": "#f472b6",
  "scmGraph.foreground5": "#34d399",
  "scm.historyItemAdditionsForeground": "#22c55e",
  "scm.historyItemDeletionsForeground": "#ef4444",
  "scm.historyItemStatisticsAdditionsForeground": "#22c55e",
  "scm.historyItemStatisticsDeletionsForeground": "#ef4444",
  "scm.inputPlaceHolderForeground": "#d1e0e855",
  
  // Merge editor
  "merge.currentHeaderBackground": "#38bdf833",
  "merge.currentContentBackground": "#38bdf818",
  "merge.incomingHeaderBackground": "#34d39933",
  "merge.incomingContentBackground": "#34d39918",
  "merge.commonHeaderBackground": "#d1e0e822",
  "merge.commonContentBackground": "#d1e0e812",
  "merge.border": "#304f6055",
  
  // Diff editor
  "diffEditor.border": "#304f6044",
  "diffEditor.insertedTextBackground": "#22c55e2a",
  "diffEditor.insertedTextBorder": "#22c55e33",
  "diffEditor.removedTextBackground": "#ef44442a",
  "diffEditor.removedTextBorder": "#ef444433",
  "diffEditor.insertedLineBackground": "#22c55e22",
  "diffEditor.removedLineBackground": "#ef444422",
  "diffEditor.diagonalFill": "#1a2838",
  "diffEditor.unchangedCodeBackground": "#0101022a",
  "diffEditor.unchangedRegionShadow": "#00000088",
  "diffEditor.move.border": "#c084fc44",
  "diffEditor.moveActive.border": "#22d3ee55",
};

// Terminal ANSI colors (full palette)
const TERMINAL_COLORS = {
  // Standard colors
  "terminal.background": "#010102",
  "terminal.foreground": "#d1e0e8",
  "terminal.border": "#304f6044",
  "terminal.selectionBackground": "#06b6d444",
  "terminal.inactiveSelectionBackground": "#06b6d422",
  "terminal.findMatchBackground": "#fbbf2455",
  "terminal.findMatchBorder": "#fbbf2455",
  "terminal.findMatchHighlightBackground": "#fbbf2433",
  "terminal.findMatchHighlightBorder": "#fbbf2444",
  "terminal.hoverHighlightBackground": "#22d3ee22",
  "terminalStickyScroll.background": "#010203",
  "terminalStickyScroll.border": "#304f6044",
  
  // ANSI colors (standard)
  "terminal.ansiBlack": "#1e1e1e",
  "terminal.ansiRed": "#f87171",
  "terminal.ansiGreen": "#22c55e",
  "terminal.ansiYellow": "#fbbf24",
  "terminal.ansiBlue": "#38bdf8",
  "terminal.ansiMagenta": "#c084fc",
  "terminal.ansiCyan": "#22d3ee",
  "terminal.ansiWhite": "#e5e5e5",
  
  // ANSI bright colors
  "terminal.ansiBrightBlack": "#6b7280",
  "terminal.ansiBrightRed": "#fca5a5",
  "terminal.ansiBrightGreen": "#86efac",
  "terminal.ansiBrightYellow": "#fde047",
  "terminal.ansiBrightBlue": "#93c5fd",
  "terminal.ansiBrightMagenta": "#f0abfc",
  "terminal.ansiBrightCyan": "#67e8f9",
  "terminal.ansiBrightWhite": "#fafafa",
  
  // Terminal cursor
  "terminalCursor.foreground": "#010102",
  "terminalCursor.background": "#22d3ee",
  "terminalCursor.accentForeground": "#d1e0e8",
  
  // Terminal tabs
  "terminal.tab.activeBorder": "#22d3ee",
  "terminal.tab.inactiveForeground": "#d1e0e888",
  "terminal.tab.activeForeground": "#d1e0e8",
};

// Additional token colors for better syntax highlighting
const ADDITIONAL_TOKENS = [
  // Constants
  {
    "scope": ["constant", "constant.other", "support.constant"],
    "settings": { "foreground": "#a855f7" }
  },
  {
    "scope": ["constant.numeric", "constant.numeric.integer", "constant.numeric.float"],
    "settings": { "foreground": "#a855f7" }
  },
  {
    "scope": ["constant.numeric.hex", "constant.numeric.octal", "constant.numeric.binary"],
    "settings": { "foreground": "#a855f7" }
  },
  {
    "scope": ["constant.language", "constant.language.boolean", "constant.language.null"],
    "settings": { "foreground": "#a855f7", "fontStyle": "italic" }
  },
  {
    "scope": ["constant.character", "constant.character.escape"],
    "settings": { "foreground": "#34d399" }
  },
  {
    "scope": ["constant.other.key", "constant.other.property"],
    "settings": { "foreground": "#0891b2" }
  },
  
  // Storage modifiers
  {
    "scope": ["storage.modifier"],
    "settings": { "foreground": "#db2777", "fontStyle": "italic" }
  },
  {
    "scope": ["storage.modifier.async", "storage.modifier.const", "storage.modifier.static"],
    "settings": { "foreground": "#db2777", "fontStyle": "italic" }
  },
  {
    "scope": ["storage.modifier.readonly", "storage.modifier.final"],
    "settings": { "foreground": "#9333ea", "fontStyle": "italic" }
  },
  {
    "scope": ["storage.modifier.private", "storage.modifier.protected"],
    "settings": { "foreground": "#db2777", "fontStyle": "italic" }
  },
  
  // Decorators/Attributes
  {
    "scope": ["meta.decorator", "meta.decorator.python", "punctuation.decorator"],
    "settings": { "foreground": "#f97316", "fontStyle": "italic" }
  },
  {
    "scope": ["entity.name.function.decorator", "entity.name.function.preprocessor"],
    "settings": { "foreground": "#f97316" }
  },
  {
    "scope": ["meta.attribute", "support.attribute"],
    "settings": { "foreground": "#f97316", "fontStyle": "italic" }
  },
  
  // Async/Await
  {
    "scope": ["keyword.control.await", "keyword.control.async", "keyword.other.async"],
    "settings": { "foreground": "#db2777", "fontStyle": "italic" }
  },
  {
    "scope": ["entity.name.function.async", "entity.name.method.async"],
    "settings": { "foreground": "#06b6d4", "fontStyle": "italic" }
  },
  
  // Generics
  {
    "scope": ["punctuation.definition.generic", "punctuation.bracket.angle"],
    "settings": { "foreground": "#22d3ee" }
  },
  {
    "scope": ["meta.generic", "meta.type.parameters"],
    "settings": { "foreground": "#0891b2" }
  },
  
  // Type annotations
  {
    "scope": ["meta.type.annotation", "meta.return.type"],
    "settings": { "foreground": "#0891b2" }
  },
  {
    "scope": ["storage.type.function.arrow", "storage.type.function"],
    "settings": { "foreground": "#db2777" }
  },
  
  // Strings
  {
    "scope": ["string.template", "string.quoted.template"],
    "settings": { "foreground": "#34d399" }
  },
  {
    "scope": ["punctuation.definition.string.template", "punctuation.definition.template-expression"],
    "settings": { "foreground": "#34d399" }
  },
  {
    "scope": ["string.regexp", "string.regexp.js", "string.regexp.ts"],
    "settings": { "foreground": "#ec4899" }
  },
  {
    "scope": ["string.escape", "constant.character.escape"],
    "settings": { "foreground": "#f472b6" }
  },
  
  // Comments
  {
    "scope": ["comment.line.double-dash", "comment.line.double-slash", "comment.line.number-sign"],
    "settings": { "foreground": "#9ccae0", "fontStyle": "italic" }
  },
  {
    "scope": ["comment.block.documentation", "comment.documentation"],
    "settings": { "foreground": "#9ccae0", "fontStyle": "italic" }
  },
  {
    "scope": ["comment.todo", "comment.line.todo"],
    "settings": { "foreground": "#fbbf24", "fontStyle": "bold" }
  },
  {
    "scope": ["comment.note", "comment.line.note"],
    "settings": { "foreground": "#38bdf8", "fontStyle": "italic" }
  },
  {
    "scope": ["comment.warning", "comment.line.warning"],
    "settings": { "foreground": "#fbbf24", "fontStyle": "bold" }
  },
  {
    "scope": ["comment.error", "comment.line.error"],
    "settings": { "foreground": "#f87171", "fontStyle": "bold" }
  },
  
  // Function calls
  {
    "scope": ["meta.function-call", "meta.function-call.method"],
    "settings": { "foreground": "#22d3ee" }
  },
  {
    "scope": ["entity.name.function.call", "entity.name.function.member"],
    "settings": { "foreground": "#22d3ee" }
  },
  
  // Variables
  {
    "scope": ["variable.other.constant", "variable.other.constant.property"],
    "settings": { "foreground": "#9333ea", "fontStyle": "bold" }
  },
  {
    "scope": ["variable.other.member", "variable.other.property"],
    "settings": { "foreground": "#0891b2" }
  },
  {
    "scope": ["variable.other.global", "variable.other.global-property"],
    "settings": { "foreground": "#0891b2" }
  },
  
  // Operators
  {
    "scope": ["keyword.operator.arithmetic", "keyword.operator.assignment", "keyword.operator.comparison"],
    "settings": { "foreground": "#22d3ee" }
  },
  {
    "scope": ["keyword.operator.logical", "keyword.operator.bitwise"],
    "settings": { "foreground": "#22d3ee" }
  },
  {
    "scope": ["keyword.operator.new", "keyword.operator.delete", "keyword.operator.typeof"],
    "settings": { "foreground": "#db2777" }
  },
  {
    "scope": ["keyword.operator.spread", "keyword.operator.rest"],
    "settings": { "foreground": "#22d3ee" }
  },
  
  // Special keywords
  {
    "scope": ["keyword.other.import", "keyword.other.export", "keyword.other.from"],
    "settings": { "foreground": "#db2777" }
  },
  {
    "scope": ["keyword.control.import", "keyword.control.export", "keyword.control.from"],
    "settings": { "foreground": "#db2777" }
  },
  {
    "scope": ["keyword.other.declaration", "keyword.declaration"],
    "settings": { "foreground": "#db2777" }
  },
  
  // Punctuation
  {
    "scope": ["punctuation.separator", "punctuation.delimiter"],
    "settings": { "foreground": "#d1e0e8" }
  },
  {
    "scope": ["punctuation.bracket", "punctuation.parenthesis", "punctuation.curlybrace", "punctuation.squarebracket"],
    "settings": { "foreground": "#d1e0e8" }
  },
  {
    "scope": ["punctuation.section.block", "punctuation.section.function"],
    "settings": { "foreground": "#d1e0e8" }
  },
  
  // Rust specific
  {
    "scope": ["entity.name.lifetime", "storage.modifier.lifetime"],
    "settings": { "foreground": "#ea580c", "fontStyle": "italic" }
  },
  {
    "scope": ["entity.name.macro", "entity.name.function.macro"],
    "settings": { "foreground": "#9333ea" }
  },
  {
    "scope": ["keyword.unsafe", "keyword.other.unsafe"],
    "settings": { "foreground": "#f87171" }
  },
  
  // Python specific
  {
    "scope": ["entity.name.function.decorator.python", "meta.function.decorator.python"],
    "settings": { "foreground": "#f97316", "fontStyle": "italic" }
  },
  {
    "scope": ["storage.type.function.python", "keyword.type.python"],
    "settings": { "foreground": "#db2777" }
  },
  {
    "scope": ["support.type.python", "support.class.python"],
    "settings": { "foreground": "#ca8a04" }
  },
  
  // TypeScript/JavaScript specific
  {
    "scope": ["entity.name.type.interface", "entity.name.type.enum"],
    "settings": { "foreground": "#eab308", "fontStyle": "italic" }
  },
  {
    "scope": ["entity.name.type.alias", "entity.name.type.type-parameter"],
    "settings": { "foreground": "#0891b2", "fontStyle": "italic" }
  },
  {
    "scope": ["meta.type.declaration", "meta.interface.declaration"],
    "settings": { "foreground": "#0891b2" }
  },
  
  // JSX/TSX specific
  {
    "scope": ["meta.tag.name", "entity.name.tag.jsx", "entity.name.tag.tsx"],
    "settings": { "foreground": "#db2777" }
  },
  {
    "scope": ["meta.tag.attributes", "meta.jsx.attributes"],
    "settings": { "foreground": "#0891b2" }
  },
  {
    "scope": ["entity.other.attribute-name.jsx", "entity.other.attribute-name.tsx"],
    "settings": { "foreground": "#06b6d4" }
  },
  
  // CSS specific
  {
    "scope": ["entity.name.tag.css", "entity.name.tag.scss"],
    "settings": { "foreground": "#db2777" }
  },
  {
    "scope": ["entity.other.attribute-name.class.css", "entity.other.attribute-name.id.css"],
    "settings": { "foreground": "#06b6d4" }
  },
  {
    "scope": ["support.type.property-name.css", "support.type.property-name.scss"],
    "settings": { "foreground": "#0891b2" }
  },
  {
    "scope": ["support.constant.property-value.css"],
    "settings": { "foreground": "#34d399" }
  },
  {
    "scope": ["punctuation.definition.entity.css"],
    "settings": { "foreground": "#06b6d4" }
  },
  
  // JSON/YAML specific
  {
    "scope": ["string.quoted.double.json", "string.unquoted.yaml"],
    "settings": { "foreground": "#34d399" }
  },
  {
    "scope": ["constant.language.json", "constant.language.yaml"],
    "settings": { "foreground": "#a855f7" }
  },
  {
    "scope": ["punctuation.definition.key.json", "entity.name.key.yaml"],
    "settings": { "foreground": "#0891b2" }
  },
  
  // Markdown specific
  {
    "scope": ["markup.heading", "markup.heading.setext"],
    "settings": { "foreground": "#ca8a04", "fontStyle": "bold" }
  },
  {
    "scope": ["markup.bold", "markup.bold.string"],
    "settings": { "foreground": "#d1e0e8", "fontStyle": "bold" }
  },
  {
    "scope": ["markup.italic", "markup.italic.string"],
    "settings": { "foreground": "#d1e0e8", "fontStyle": "italic" }
  },
  {
    "scope": ["markup.strikethrough"],
    "settings": { "foreground": "#d1e0e8", "fontStyle": "strikethrough" }
  },
  {
    "scope": ["markup.inserted", "markup.inserted.git"],
    "settings": { "foreground": "#22c55e" }
  },
  {
    "scope": ["markup.deleted", "markup.deleted.git"],
    "settings": { "foreground": "#ef4444" }
  },
  {
    "scope": ["markup.underline", "markup.underline.link"],
    "settings": { "foreground": "#22d3ee", "fontStyle": "underline" }
  },
  {
    "scope": ["markup.raw", "markup.raw.block", "markup.raw.inline"],
    "settings": { "foreground": "#34d399" }
  },
  {
    "scope": ["punctuation.definition.heading", "punctuation.definition.bold", "punctuation.definition.italic"],
    "settings": { "foreground": "#db2777" }
  },
  {
    "scope": ["fenced_code.block.language", "markup.fenced_code.block"],
    "settings": { "foreground": "#0891b2" }
  },
];

async function enhanceTheme(filePath) {
  const content = await readFile(filePath, 'utf-8');
  const theme = JSON.parse(content);
  
  // Skip themes that use "include" - they inherit from parent themes
  if (theme.include) {
    // Only add colors for included themes
    theme.colors = {
      ...theme.colors,
      ...GIT_COLORS,
      ...TERMINAL_COLORS,
    };
    
    await writeFile(filePath, JSON.stringify(theme, null, 2) + '\n');
    console.log(`✓ Enhanced (include theme): ${filePath}`);
    return;
  }
  
  // 1. Add/merge semantic tokens
  theme.semanticTokenColors = {
    ...theme.semanticTokenColors,
    ...SEMANTIC_TOKENS,
  };
  
  // 2. Add/merge Git colors
  theme.colors = {
    ...theme.colors,
    ...GIT_COLORS,
    ...TERMINAL_COLORS,
  };
  
  // 3. Add additional token colors (avoid duplicates)
  theme.tokenColors = theme.tokenColors || [];
  
  const existingScopes = new Set(
    theme.tokenColors.flatMap(t => 
      Array.isArray(t.scope) ? t.scope : [t.scope]
    )
  );
  
  for (const token of ADDITIONAL_TOKENS) {
    const scopes = Array.isArray(token.scope) ? token.scope : [token.scope];
    const hasAny = scopes.some(s => existingScopes.has(s));
    
    if (!hasAny) {
      theme.tokenColors.push(token);
      scopes.forEach(s => existingScopes.add(s));
    }
  }
  
  // Ensure semantic highlighting is enabled
  theme.semanticHighlighting = true;
  
  // Sort token colors by specificity (more specific first)
  theme.tokenColors.sort((a, b) => {
    const aLen = Array.isArray(a.scope) ? a.scope.length : 1;
    const bLen = Array.isArray(b.scope) ? b.scope.length : 1;
    return bLen - aLen;
  });
  
  await writeFile(filePath, JSON.stringify(theme, null, 2) + '\n');
  console.log(`✓ Enhanced: ${filePath}`);
}

async function main() {
  const files = await readdir(THEMES_DIR);
  const jsonFiles = files.filter(f => f.endsWith('.json'));
  
  console.log(`Found ${jsonFiles.length} themes to enhance\n`);
  
  for (const file of jsonFiles) {
    const filePath = join(THEMES_DIR, file);
    try {
      await enhanceTheme(filePath);
    } catch (error) {
      console.error(`✗ Error enhancing ${file}:`, error.message);
    }
  }
  
  console.log('\n✓ All themes enhanced!');
}

main().catch(console.error);
