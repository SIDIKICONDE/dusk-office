/** Minimal vscode mock for unit-testing lib/ modules outside VS Code. */

const configValues = new Map();

/** Virtual workspace files, keyed by absolute path. Tests populate via __setMockWorkspaceFs. */
const workspaceFiles = new Map();

function configKey(section, key) {
  return section ? `${section}.${key}` : key;
}

function makeUri(fsPath) {
  return { fsPath, scheme: "file", path: fsPath, toString: () => `file://${fsPath}` };
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

/** Populate the virtual workspace FS. Keys are absolute file paths, values are byte arrays. */
function setMockWorkspaceFs(files) {
  workspaceFiles.clear();
  for (const [path, content] of Object.entries(files)) {
    workspaceFiles.set(path, typeof content === "string" ? new TextEncoder().encode(content) : content);
  }
}

function resetMockWorkspaceFs() {
  workspaceFiles.clear();
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
    fs: {
      async stat(uri) {
        const entry = workspaceFiles.get(uri.fsPath ?? String(uri));
        if (!entry) throw new Error(`ENOENT: ${uri.fsPath ?? uri}`);
        return { type: vscode.FileType.File, size: entry.byteLength, ctime: 0, mtime: 0 };
      },
      async readFile(uri) {
        const entry = workspaceFiles.get(uri.fsPath ?? String(uri));
        if (!entry) throw new Error(`ENOENT: ${uri.fsPath ?? uri}`);
        return entry;
      },
      /** Top-level listing derived from the virtual files, as [name, FileType] pairs. */
      async readDirectory(uri) {
        const root = (uri.fsPath ?? String(uri)).replace(/\/+$/, "");
        const prefix = `${root}/`;
        const names = new Set();
        for (const path of workspaceFiles.keys()) {
          if (!path.startsWith(prefix)) continue;
          const rest = path.slice(prefix.length);
          const slash = rest.indexOf("/");
          if (slash === -1) names.add(rest);
          else names.add(`${rest.slice(0, slash)}/`);
        }
        return [...names].map((name) => [
          name,
          name.endsWith("/") ? vscode.FileType.Directory : vscode.FileType.File,
        ]);
      },
    },
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
  FileType: { Unknown: 0, File: 1, Directory: 2, SymbolicLink: 64 },
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
    parse: (s) => makeUri(s),
    file: (s) => makeUri(s),
    joinPath: (base, ...segments) => makeUri(`${base.fsPath ?? base}/${segments.join("/")}`),
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
  __setMockWorkspaceFs: setMockWorkspaceFs,
  __resetMockWorkspaceFs: resetMockWorkspaceFs,
};

module.exports = vscode;
