import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('loadgic', {
  minimize: () => ipcRenderer.invoke('window:minimize'),
  close: () => ipcRenderer.invoke('window:close'),
  toggleFullscreen: () => ipcRenderer.invoke('window:toggle-fullscreen'),
})
