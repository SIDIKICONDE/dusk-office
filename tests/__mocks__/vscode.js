/** Minimal vscode mock for unit-testing lib/ modules outside VS Code. */
module.exports = {
  workspace: {
    getConfiguration: () => ({
      get: () => undefined,
      inspect: () => undefined,
      update: async () => {},
    }),
    onDidChangeConfiguration: () => ({ dispose() {} }),
    onDidChangeTextDocument: () => ({ dispose() {} }),
    onDidOpenTextDocument: () => ({ dispose() {} }),
    workspaceFolders: [],
  },
  window: {
    createTextEditorDecorationType: (opts) => ({
      key: JSON.stringify(opts),
      dispose() {},
    }),
    showInformationMessage: async () => {},
    showWarningMessage: async () => {},
    showErrorMessage: async () => {},
    showQuickPick: async () => undefined,
    showInputBox: async () => undefined,
    createQuickPick: () => ({
      items: [],
      activeItems: [],
      show() {},
      hide() {},
      dispose() {},
      onDidChangeActive: () => ({ dispose() {} }),
      onDidAccept: () => ({ dispose() {} }),
      onDidHide: () => ({ dispose() {} }),
    }),
    activeTextEditor: undefined,
    visibleTextEditors: [],
    onDidChangeActiveTextEditor: () => ({ dispose() {} }),
    onDidChangeActiveColorTheme: () => ({ dispose() {} }),
    activeColorTheme: { kind: 2 },
  },
  ColorThemeKind: { Light: 1, Dark: 2, HighContrast: 3, HighContrastLight: 4 },
  commands: {
    executeCommand: async () => {},
    registerCommand: () => ({ dispose() {} }),
  },
  ConfigurationTarget: { Global: 1, Workspace: 2, WorkspaceFolder: 3 },
  StatusBarAlignment: { Left: 1, Right: 2 },
  ThemeColor: class ThemeColor {
    constructor(id) { this.id = id; }
  },
  Uri: {
    parse: (s) => ({ toString: () => s }),
    file: (s) => ({ fsPath: s, scheme: "file", toString: () => s }),
  },
  Disposable: class Disposable {
    constructor(fn) { this._fn = fn; }
    dispose() { if (this._fn) this._fn(); }
  },
  Range: class Range {
    constructor(sl, sc, el, ec) {
      this.start = { line: sl, character: sc };
      this.end = { line: el, character: ec };
    }
  },
  env: {
    openExternal: async () => {},
  },
};
