/**
 * Palettes syntaxe (sémantique + TextMate de fin de chaîne) par variante Dusk Office.
 * Génère les clés à fusionner dans chaque fichier themes/dusk-*.json
 */
export const palettes = {
  abime: {
    class: "#c9a050",
    interface: "#d8b870",
    type: "#5a8fb0",
    namespace: "#6a9ab0",
    function: "#6a9ab0",
    method: "#7aadbc",
    keyword: "#a86878",
    string: "#7aa88a",
    number: "#9a8ab0",
    comment: "#6a8098",
    parameter: "#c09060",
    variable: "#c8d0d8",
    property: "#6a9ab0",
    operator: "#7a98a8",
    regexp: "#a87888",
    enumMember: "#8a80a8",
    decorator: "#c09060",
  },
  /** Fond ~#3d3648 (mauve) : tokens chauds + mauve-cyan ; chrome workbench aligné mauve dans palettes-extended-ui. */
  aube: {
    class: "#d0b070",
    interface: "#d8c090",
    type: "#7a9ab0",
    namespace: "#8aaab8",
    function: "#8aadbc",
    method: "#9ab8c0",
    keyword: "#a87080",
    string: "#8ab898",
    number: "#a898b8",
    comment: "#7a8a98",
    parameter: "#c0a070",
    variable: "#e0d8d4",
    property: "#8aaab8",
    operator: "#8aadbc",
    regexp: "#b08090",
    enumMember: "#a090b0",
    decorator: "#c0a070",
  },
  baie: {
    class: "#c9a050",
    interface: "#d8b870",
    type: "#5a8a78",
    namespace: "#6a9a80",
    function: "#5a8a78",
    method: "#6a9a88",
    keyword: "#4a7060",
    string: "#7aa88a",
    number: "#8a80a8",
    comment: "#5a7a68",
    parameter: "#b89050",
    variable: "#d8e4dc",
    property: "#6a9a88",
    operator: "#5a8a78",
    regexp: "#a87888",
    enumMember: "#8a80a8",
    decorator: "#b88050",
  },
  /** Fond #1f1b17 : terminal vintage chaud - accents ambre/cuivre. */
  nocturne: {
    class: "#d4a853",
    interface: "#e8c87a",
    type: "#8fb8a8",
    namespace: "#a8c0b0",
    function: "#c9b080",
    method: "#d4b890",
    keyword: "#c97565",
    string: "#a8b898",
    number: "#d4a853",
    comment: "#7a6b5a",
    parameter: "#c9a87a",
    variable: "#e8dcc8",
    property: "#b8a890",
    operator: "#a09078",
    regexp: "#c98b7a",
    enumMember: "#a890b8",
    decorator: "#b8a050",
  },
  /** Fond #222f3d : plus clair que la base ; tokens resserrés gris-bleu. */
  brume: {
    class: "#c9a858",
    interface: "#d8b870",
    type: "#7a9ab0",
    namespace: "#7a98b0",
    function: "#7a9ab0",
    method: "#8aadbc",
    keyword: "#a87080",
    string: "#7aa88a",
    number: "#9a8ab0",
    comment: "#7a8a98",
    parameter: "#c0a070",
    variable: "#e0e4e8",
    property: "#8aadb8",
    operator: "#7a98a8",
    regexp: "#b08090",
    enumMember: "#8a80a8",
    decorator: "#c9a85c",
  },
  cendre: {
    class: "#d1d5db",
    interface: "#e5e7eb",
    type: "#d1d5db",
    namespace: "#c9d1d9",
    function: "#f0f3f6",
    method: "#f0f3f6",
    keyword: "#9ca3af",
    string: "#86a88a",
    number: "#b1bac4",
    comment: "#6e7681",
    parameter: "#d4a574",
    variable: "#e6edf3",
    property: "#c9d1d9",
    operator: "#adb5bd",
    regexp: "#b4a8c8",
    enumMember: "#b1bac4",
    decorator: "#c9a86c",
  },
  minuit: {
    class: "#c9a050",
    interface: "#d0b060",
    type: "#5a7a90",
    namespace: "#5a8098",
    function: "#5a8fa8",
    method: "#7ab0c0",
    keyword: "#a86878",
    string: "#5a8a70",
    number: "#9a8ab0",
    comment: "#7a8a98",
    parameter: "#c08060",
    variable: "#b8c8d0",
    property: "#5a8098",
    operator: "#7ab0c0",
    regexp: "#a87080",
    enumMember: "#7a68a0",
    decorator: "#c08060",
  },
  nebuleuse: {
    class: "#c9a85c",
    interface: "#d8c090",
    type: "#9a90b0",
    namespace: "#8a80a8",
    function: "#b0a0c0",
    method: "#a898b0",
    keyword: "#a87888",
    string: "#7a9a90",
    number: "#c9a85c",
    comment: "#7a6898",
    parameter: "#c09060",
    variable: "#d8d4e0",
    property: "#8a8ab0",
    operator: "#9a80b0",
    regexp: "#a87080",
    enumMember: "#9a8ab0",
    decorator: "#c0a070",
  },
  recif: {
    class: "#d0b060",
    interface: "#d8c080",
    type: "#5a9aaa",
    namespace: "#6aa0b0",
    function: "#7ab0c0",
    method: "#6aa0b0",
    keyword: "#a87878",
    string: "#7a9aa8",
    number: "#a87888",
    comment: "#5a8898",
    parameter: "#c09060",
    variable: "#d0dce8",
    property: "#7aabb8",
    operator: "#7ab0c0",
    regexp: "#b09098",
    enumMember: "#a088b0",
    decorator: "#c0a070",
  },
  /** Finance premium — or profond, vert banque, bleu confiance. */
  finance: {
    class: "#d4a853",
    interface: "#e8d8a0",
    type: "#5a8fc0",
    namespace: "#6a9ed0",
    function: "#6ab080",
    method: "#5a9a70",
    keyword: "#c94f4f",
    string: "#7aa88a",
    number: "#e8d570",
    comment: "#5a6a7a",
    parameter: "#c9a87a",
    variable: "#d4d0c8",
    property: "#5a8fc0",
    operator: "#8a8070",
    regexp: "#8a7db8",
    enumMember: "#8a7db8",
    decorator: "#d4a853",
  },
  /** Corporate burgundy — accents bordeaux/wine avec touches or. */
  corporate: {
    class: "#c9a050",
    interface: "#d8b880",
    type: "#6a8aa0",
    namespace: "#7a9ab0",
    function: "#8a7aa8",
    method: "#9a8ab8",
    keyword: "#b87080",
    string: "#7aa090",
    number: "#c9a050",
    comment: "#5a5060",
    parameter: "#a08060",
    variable: "#c8c4c0",
    property: "#8a7aa8",
    operator: "#7a7080",
    regexp: "#a07080",
    enumMember: "#8a7aa8",
    decorator: "#c9a050",
  },
};

function buildSemantic(p) {
  return {
    class: { foreground: p.class, bold: true },
    "class.declaration": { foreground: p.class, bold: true },
    classDefaultLibrary: p.interface,
    interface: { foreground: p.interface, italic: true },
    enum: p.class,
    enumMember: p.enumMember,
    struct: p.class,
    type: p.type,
    typeAlias: { foreground: p.type, italic: true },
    typeParameter: { foreground: p.type, italic: true },
    namespace: p.namespace,
    module: p.namespace,
    function: p.function,
    "function.declaration": p.method,
    method: p.method,
    "method.declaration": p.method,
    macro: p.enumMember,
    decorator: { foreground: p.decorator, italic: true },
    variable: p.variable,
    "variable.readonly": p.enumMember,
    "variable.defaultLibrary": p.namespace,
    property: p.property,
    "property.readonly": p.property,
    parameter: p.parameter,
    selfParameter: { foreground: p.keyword, italic: true },
    keyword: p.keyword,
    operator: p.operator,
    number: p.number,
    string: p.string,
    regexp: p.regexp,
    lifetime: { foreground: p.parameter, italic: true },
    label: { foreground: p.parameter, italic: true },
    comment: { foreground: p.comment, italic: true },
    async: { italic: true },
    static: p.enumMember,
    abstract: { italic: true },
    deprecated: { strikethrough: true },
  };
}

/**
 * Règles TextMate étendues (même liste pour chaque variante : nombre d’entrées aligné).
 * Les couleurs viennent de la palette `p` de la variante.
 */
function extendedTokenColorRules(p) {
  return [
    {
      scope: ["variable.other.readwrite", "variable.other"],
      settings: { foreground: p.variable },
    },
    { scope: "variable.language", settings: { foreground: p.keyword } },
    { scope: "variable.parameter", settings: { foreground: p.parameter } },
    {
      scope: "entity.name.function.member",
      settings: { foreground: p.method },
    },
    { scope: "support.function", settings: { foreground: p.function } },
    { scope: "support.function.builtin", settings: { foreground: p.namespace } },
    { scope: "support.type", settings: { foreground: p.type } },
    { scope: "support.class", settings: { foreground: p.class } },
    { scope: "entity.name.namespace", settings: { foreground: p.namespace } },
    {
      scope: "punctuation.definition.string",
      settings: { foreground: p.string },
    },
    {
      scope: ["punctuation.separator", "punctuation.terminator"],
      settings: { foreground: p.operator },
    },
    {
      scope: "keyword.control",
      settings: { foreground: p.keyword },
    },
    {
      scope: "keyword.operator.new",
      settings: { foreground: p.keyword, fontStyle: "italic" },
    },
    {
      scope: "keyword.operator.logical",
      settings: { foreground: p.keyword },
    },
    { scope: "storage.modifier", settings: { foreground: p.keyword } },
    {
      scope: "constant.language",
      settings: { foreground: p.number },
    },
    {
      scope: "constant.character.escape",
      settings: { foreground: p.string },
    },
    { scope: "string.template", settings: { foreground: p.string } },
    { scope: "string.regexp", settings: { foreground: p.regexp } },
    {
      scope: "entity.other.attribute-name",
      settings: { foreground: p.decorator },
    },
    {
      scope: "meta.embedded",
      settings: { foreground: p.variable },
    },
  ];
}

function buildTokenColors(p) {
  return [
    {
      scope: ["comment", "punctuation.definition.comment"],
      settings: { foreground: p.comment, fontStyle: "italic" },
    },
    {
      scope: [
        "comment.block",
        "comment.block.css",
        "comment.block.scss",
        "comment.block.less",
        "comment.block.postcss",
      ],
      settings: { foreground: p.comment, fontStyle: "italic" },
    },
    {
      scope: "comment.line.double-slash",
      settings: { foreground: p.comment, fontStyle: "italic" },
    },
    {
      scope: "string",
      settings: { foreground: p.string },
    },
    {
      scope: "string.quoted.single",
      settings: { foreground: p.string },
    },
    {
      scope: "string.quoted.double",
      settings: { foreground: p.string },
    },
    {
      scope: "constant.numeric",
      settings: { foreground: p.number },
    },
    {
      scope: "keyword",
      settings: { foreground: p.keyword },
    },
    {
      scope: "keyword.control.flow",
      settings: { foreground: p.keyword, fontStyle: "italic" },
    },
    {
      scope: "keyword.operator",
      settings: { foreground: p.operator },
    },
    {
      scope: "entity.name.function",
      settings: { foreground: p.function },
    },
    {
      scope: "entity.name.type",
      settings: { foreground: p.type },
    },
    {
      scope: "entity.name.class",
      settings: { foreground: p.class },
    },
    {
      scope: "storage.type",
      settings: { foreground: p.keyword },
    },
    {
      scope: "support.type",
      settings: { foreground: p.type },
    },
  ];
}

/** Corrige les clés *.async etc. pour le JSON VS Code */
function fixSemanticKeys(obj) {
  const out = { ...obj };
  delete out.async;
  delete out.static;
  delete out.abstract;
  delete out.deprecated;
  out["*.async"] = { italic: true };
  out["*.static"] = obj.static;
  out["*.abstract"] = { italic: true };
  out["*.deprecated"] = { strikethrough: true };
  out["class.defaultLibrary"] = obj.classDefaultLibrary;
  delete out.classDefaultLibrary;
  return out;
}

export function syntaxBlocksFor(slug) {
  const p = palettes[slug];
  if (!p) throw new Error(`Unknown palette ${slug}`);
  const sem = fixSemanticKeys(buildSemantic(p));
  return {
    semanticTokenColors: sem,
    tokenColors: [...buildTokenColors(p), ...extendedTokenColorRules(p)],
  };
}
