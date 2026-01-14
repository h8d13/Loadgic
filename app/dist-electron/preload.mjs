"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("loadgic", {
  minimize: () => electron.ipcRenderer.invoke("window:minimize"),
  close: () => electron.ipcRenderer.invoke("window:close"),
  toggleFullscreen: () => electron.ipcRenderer.invoke("window:toggle-fullscreen"),
  openProject: () => electron.ipcRenderer.invoke("dialog:open-project"),
  onMainMessage: (handler) => {
    const listener = (_event, message) => {
      handler(message);
    };
    electron.ipcRenderer.on("main-process-message", listener);
    return () => electron.ipcRenderer.removeListener("main-process-message", listener);
  }
});
