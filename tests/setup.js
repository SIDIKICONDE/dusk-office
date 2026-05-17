/** Register the vscode mock before any lib/ module tries to require('vscode'). */
const Module = require("node:module");
const path = require("node:path");

const vscode = require(path.join(__dirname, "__mocks__", "vscode.js"));

const originalResolveFilename = Module._resolveFilename;
Module._resolveFilename = function (request, parent, ...rest) {
  if (request === "vscode") {
    return path.join(__dirname, "__mocks__", "vscode.js");
  }
  return originalResolveFilename.call(this, request, parent, ...rest);
};
