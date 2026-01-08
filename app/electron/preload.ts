import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('loadgic', {
  minimize: () => ipcRenderer.invoke('window:minimize'),
  toggleMaximize: () => ipcRenderer.invoke('window:toggle-maximize'),
  close: () => ipcRenderer.invoke('window:close'),
  getWindowPos: () => ipcRenderer.invoke('window:get-pos'),
  moveAbsolute: (x: number, y: number) => ipcRenderer.invoke('window:move-absolute', { x, y }),
})
