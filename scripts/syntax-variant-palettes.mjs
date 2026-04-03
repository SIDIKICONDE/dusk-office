/**
 * Palettes syntaxe (sémantique + TextMate de fin de chaîne) par variante Dusk Office.
 * Génère les clés à fusionner dans chaque fichier themes/dusk-*.json
 */
export const palettes = {
  abime: {
    class: "#e0b040",
    interface: "#f0d060",
    type: "#00acc8",
    namespace: "#38b8d0",
    function: "#2ecce0",
    method: "#2ecce0",
    keyword: "#e84878",
    string: "#4aac92",
    number: "#b794f4",
    comment: "#5d9db8",
    parameter: "#f0a050",
    variable: "#c8e4f0",
    property: "#48b8d0",
    operator: "#38c8e0",
    regexp: "#f472a8",
    enumMember: "#c49cfc",
    decorator: "#f59e50",
  },
  /** Fond #334d66 : tokens très lisibles (forte saturation / blanc), pas de gris hérités du parent. */
  aube: {
    class: "#ffd54a",
    interface: "#ffe082",
    type: "#00e5ff",
    namespace: "#80f0ff",
    function: "#7df9ff",
    method: "#9efffa",
    keyword: "#ff2d8a",
    string: "#b9ffb8",
    number: "#e4b5ff",
    comment: "#5a7f96",
    parameter: "#ffb74d",
    variable: "#ffffff",
    property: "#b8ecff",
    operator: "#7aefff",
    regexp: "#ff7eb3",
    enumMember: "#d4a5ff",
    decorator: "#ffab40",
  },
  baie: {
    class: "#eab308",
    interface: "#fde047",
    type: "#14b8a6",
    namespace: "#34d399",
    function: "#0d9488",
    method: "#14b8a6",
    keyword: "#047857",
    string: "#6ee7b7",
    number: "#8b5cf6",
    comment: "#3d9f65",
    parameter: "#d97706",
    variable: "#d1fae5",
    property: "#2dd4bf",
    operator: "#14b8a6",
    regexp: "#f472b6",
    enumMember: "#a78bfa",
    decorator: "#ea580c",
  },
  /** Fond #2a3a4c : plus clair que la base ; tokens resserrés vs gris du parent. */
  brume: {
    class: "#ffd54a",
    interface: "#ffe066",
    type: "#5cefff",
    namespace: "#7dd3fc",
    function: "#7ee8ff",
    method: "#a5f3fc",
    keyword: "#ff4d7a",
    string: "#86efac",
    number: "#d8b4fe",
    comment: "#8aa3b8",
    parameter: "#fdba74",
    variable: "#f8fafc",
    property: "#a5e8ff",
    operator: "#67e8f9",
    regexp: "#fda4af",
    enumMember: "#c4b5fd",
    decorator: "#fbbf24",
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
    class: "#ca8a04",
    interface: "#eab308",
    type: "#0e7490",
    namespace: "#0891b2",
    function: "#06b6d4",
    method: "#22d3ee",
    keyword: "#db2777",
    string: "#059669",
    number: "#a855f7",
    comment: "#6b8a9c",
    parameter: "#ea580c",
    variable: "#b8d4e4",
    property: "#0891b2",
    operator: "#22d3ee",
    regexp: "#ec4899",
    enumMember: "#9333ea",
    decorator: "#f97316",
  },
  nebuleuse: {
    class: "#fbbf24",
    interface: "#fde68a",
    type: "#c4b5fd",
    namespace: "#a78bfa",
    function: "#e9d5ff",
    method: "#ddd6fe",
    keyword: "#f472b6",
    string: "#99f6e4",
    number: "#fcd34d",
    comment: "#7c6a9a",
    parameter: "#fb923c",
    variable: "#e4e4f7",
    property: "#a5b4fc",
    operator: "#c084fc",
    regexp: "#fb7185",
    enumMember: "#d8b4fe",
    decorator: "#fdba74",
  },
  recif: {
    class: "#fde047",
    interface: "#fef08a",
    type: "#06b6d4",
    namespace: "#22d3ee",
    function: "#00f5ff",
    method: "#22d3ee",
    keyword: "#fb7185",
    string: "#a5f3fc",
    number: "#f472b6",
    comment: "#2ea3c4",
    parameter: "#fb923c",
    variable: "#cffafe",
    property: "#67e8f9",
    operator: "#00f5ff",
    regexp: "#fda4af",
    enumMember: "#e879f9",
    decorator: "#fdba74",
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
 * Règles TextMate supplémentaires pour fonds plus clairs que la base :
 * surcharger les scopes encore colorés par le parent (include).
 */
const tokenExtrasBuilders = {
  aube: (p) => [
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
  ],
  brume: (p) => [
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
  ],
};

function buildTokenColors(p) {
  return [
    {
      scope: ["comment", "punctuation.definition.comment"],
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
  const extras = tokenExtrasBuilders[slug]?.(p) ?? [];
  return {
    semanticTokenColors: sem,
    tokenColors: [...buildTokenColors(p), ...extras],
  };
}
