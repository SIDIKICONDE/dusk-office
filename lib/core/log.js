const vscode = require("vscode");

let _channel;

function getChannel() {
  if (!_channel) {
    _channel = vscode.window.createOutputChannel("Dusk Office");
  }
  return _channel;
}

function warn(label, error) {
  const text = error ? `${label}: ${error.message || error}` : label;
  getChannel().appendLine(`[warn]  ${new Date().toISOString()} ${text}`);
}

function error(label, err) {
  const text = err ? `${label}: ${err.message || err}` : label;
  getChannel().appendLine(`[error] ${new Date().toISOString()} ${text}`);
}

function info(label, detail) {
  const text =
    detail === undefined
      ? label
      : `${label}: ${typeof detail === "string" ? detail : JSON.stringify(detail)}`;
  getChannel().appendLine(`[info]  ${new Date().toISOString()} ${text}`);
}

function dispose() {
  _channel?.dispose();
  _channel = null;
}

module.exports = { warn, error, info, dispose, getChannel };
