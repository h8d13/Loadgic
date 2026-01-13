"use strict";
const electron = require("electron");
const on = (channel, handler) => {
  const listener = () => handler();
  electron.ipcRenderer.on(channel, listener);
  return () => electron.ipcRenderer.removeListener(channel, listener);
};
electron.contextBridge.exposeInMainWorld("loadgic", {
  minimize: () => electron.ipcRenderer.invoke("window:minimize"),
  maximize: () => electron.ipcRenderer.invoke("window:maximize"),
  close: () => electron.ipcRenderer.invoke("window:close"),
  toggleFullscreen: () => electron.ipcRenderer.invoke("window:toggle-fullscreen"),
  on
});
