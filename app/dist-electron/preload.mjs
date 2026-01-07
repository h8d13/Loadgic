"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("loadgic", {
  minimize: () => electron.ipcRenderer.invoke("window:minimize"),
  toggleMaximize: () => electron.ipcRenderer.invoke("window:toggle-maximize"),
  close: () => electron.ipcRenderer.invoke("window:close")
});
