const vscode = require("vscode");
const cfg = require("../core/configuration.js");
const state = require("../core/extension-state.js");
const autoAdaptive = require("./auto-adaptive.js");
const {
  msUntilNextHourBoundary,
  getAutoSwitchBoundaryHours,
  getAdaptiveFocusBoundaryHours,
} = require("./hour-schedule.js");

/**
 * @param {object} options
 * @param {() => { hours: number[]; timezone: string }} options.getBoundarySchedule
 * @param {() => boolean} options.isEnabled
 * @param {() => void | Promise<void>} options.onBoundary
 */
function createHourBoundaryScheduler(options) {
  /** @type {ReturnType<typeof setTimeout> | null} */
  let timeoutId = null;

  const clear = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  const schedule = () => {
    clear();
    if (!options.isEnabled()) return;

    const boundary = options.getBoundarySchedule();
    const ms = msUntilNextHourBoundary(new Date(), boundary.hours, boundary.timezone);
    if (ms === null) return;

    timeoutId = setTimeout(() => {
      timeoutId = null;
      if (options.isEnabled() && !state.isThemeAutomationPaused()) {
        void options.onBoundary();
      }
      schedule();
    }, ms);
  };

  return {
    restart: schedule,
    dispose: clear,
  };
}

function createAutoSwitchManager(context) {
  const scheduler = createHourBoundaryScheduler({
    isEnabled: () => cfg.getAutoSwitchConfig().enabled,
    getBoundarySchedule: () => getAutoSwitchBoundaryHours(cfg.getAutoSwitchConfig()),
    onBoundary: () => {
      void autoAdaptive.runAutoSwitch(context);
    },
  });

  scheduler.restart();

  const configListener = vscode.workspace.onDidChangeConfiguration((event) => {
    if (!event.affectsConfiguration("duskOffice.autoSwitch")) return;

    scheduler.restart();

    if (cfg.getAutoSwitchConfig().enabled) {
      void autoAdaptive.runAutoSwitch(context);
    }
  });

  return new vscode.Disposable(() => {
    configListener.dispose();
    scheduler.dispose();
  });
}

function createAdaptiveFocusManager(context) {
  const scheduler = createHourBoundaryScheduler({
    isEnabled: () => cfg.getAdaptiveFocusConfig().enabled,
    getBoundarySchedule: () => getAdaptiveFocusBoundaryHours(cfg.getAdaptiveFocusConfig()),
    onBoundary: () => {
      void autoAdaptive.applyAdaptiveFocusTheme(context);
    },
  });

  scheduler.restart();

  const configListener = vscode.workspace.onDidChangeConfiguration((event) => {
    if (
      !event.affectsConfiguration("duskOffice.adaptiveFocus") &&
      !event.affectsConfiguration("duskOffice.autoSwitch.timezone")
    ) {
      return;
    }
    scheduler.restart();
    if (cfg.getAdaptiveFocusConfig().enabled) {
      void autoAdaptive.applyAdaptiveFocusTheme(context);
    }
  });

  const editorListener = vscode.window.onDidChangeActiveTextEditor(() => {
    if (!cfg.getAdaptiveFocusConfig().enabled) return;
    if (state.isThemeAutomationPaused()) return;
    void autoAdaptive.applyAdaptiveFocusTheme(context);
  });

  return new vscode.Disposable(() => {
    configListener.dispose();
    editorListener.dispose();
    scheduler.dispose();
  });
}

module.exports = {
  createAutoSwitchManager,
  createAdaptiveFocusManager,
  createHourBoundaryScheduler,
};
