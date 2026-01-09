"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("loadgic", {
  minimize: () => electron.ipcRenderer.invoke("window:minimize"),
  close: () => electron.ipcRenderer.invoke("window:close"),
  toggleFullscreen: () => electron.ipcRenderer.invoke("window:toggle-fullscreen")
});
