const vscode = require("vscode");
const cfg = require("./configuration.js");
const autoAdaptive = require("./auto-adaptive.js");

function startAutoSwitchTimer(context) {
  const timer = setInterval(() => {
    void autoAdaptive.runAutoSwitch(context);
  }, 60 * 1000);
  return new vscode.Disposable(() => clearInterval(timer));
}

function createAutoSwitchManager(context) {
  let timerDisposable = null;

  const ensureTimerState = () => {
    if (cfg.getAutoSwitchConfig().enabled) {
      if (!timerDisposable) timerDisposable = startAutoSwitchTimer(context);
    } else {
      timerDisposable?.dispose();
      timerDisposable = null;
    }
  };

  ensureTimerState();

  const configListener = vscode.workspace.onDidChangeConfiguration((event) => {
    if (!event.affectsConfiguration("duskOffice.autoSwitch")) return;

    ensureTimerState();

    if (timerDisposable) {
      void autoAdaptive.runAutoSwitch(context);
    }
  });

  return new vscode.Disposable(() => {
    configListener.dispose();
    timerDisposable?.dispose();
    timerDisposable = null;
  });
}

function createAdaptiveFocusManager(context) {
  let timer = null;

  const ensureTimer = () => {
    const enabled = cfg.getAdaptiveFocusConfig().enabled;
    if (!enabled) {
      if (timer) clearInterval(timer);
      timer = null;
      return;
    }
    if (!timer) {
      timer = setInterval(() => {
        void autoAdaptive.applyAdaptiveFocusTheme(context);
      }, 60 * 1000);
    }
  };

  ensureTimer();

  const configListener = vscode.workspace.onDidChangeConfiguration((event) => {
    if (!event.affectsConfiguration("duskOffice.adaptiveFocus")) return;
    ensureTimer();
    if (cfg.getAdaptiveFocusConfig().enabled) {
      void autoAdaptive.applyAdaptiveFocusTheme(context);
    }
  });

  const editorListener = vscode.window.onDidChangeActiveTextEditor(() => {
    if (!cfg.getAdaptiveFocusConfig().enabled) return;
    void autoAdaptive.applyAdaptiveFocusTheme(context);
  });

  return new vscode.Disposable(() => {
    configListener.dispose();
    editorListener.dispose();
    if (timer) clearInterval(timer);
    timer = null;
  });
}

module.exports = {
  createAutoSwitchManager,
  createAdaptiveFocusManager,
};
