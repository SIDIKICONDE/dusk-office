/** Minimal vscode mock for unit-testing lib/ modules outside VS Code. */

const configValues = new Map();

function configKey(section, key) {
  return section ? `${section}.${key}` : key;
}

function getConfiguration(section) {
  return {
    get(key, defaultValue) {
      const full = configKey(section, key);
      return configValues.has(full) ? configValues.get(full) : defaultValue;
    },
    inspect(key) {
      const full = configKey(section, key);
      if (!configValues.has(full)) return undefined;
      return { globalValue: configValues.get(full) };
    },
    update(key, value) {
      const full = configKey(section, key);
      if (value === undefined) configValues.delete(full);
      else configValues.set(full, value);
      return Promise.resolve();
    },
  };
}

function resetMockConfig() {
  configValues.clear();
}

function setMockConfig(fullKey, value) {
  if (value === undefined) configValues.delete(fullKey);
  else configValues.set(fullKey, value);
}

const vscode = {
  workspace: {
    getConfiguration,
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
    createOutputChannel: () => ({
      appendLine() {},
      dispose() {},
    }),
  },
  ColorThemeKind: { Light: 1, Dark: 2, HighContrast: 3, HighContrastLight: 4 },
  commands: {
    executeCommand: async () => {},
    registerCommand: () => ({ dispose() {} }),
  },
  ConfigurationTarget: { Global: 1, Workspace: 2, WorkspaceFolder: 3 },
  QuickPickItemKind: { Separator: -1, Default: 0 },
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
  __resetMockConfig: resetMockConfig,
  __setMockConfig: setMockConfig,
};

module.exports = vscode;
