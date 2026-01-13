import { contextBridge, ipcRenderer } from 'electron'

const on = (channel: string, handler: () => void) => {
  const listener = () => handler()
  ipcRenderer.on(channel, listener)
  return () => ipcRenderer.removeListener(channel, listener)
}

contextBridge.exposeInMainWorld('loadgic', {
  minimize: () => ipcRenderer.invoke('window:minimize'),
  maximize: () => ipcRenderer.invoke('window:maximize'),
  close: () => ipcRenderer.invoke('window:close'),
  toggleFullscreen: () => ipcRenderer.invoke('window:toggle-fullscreen'),
  zoomIn: () => ipcRenderer.invoke('view:zoom-in') as Promise<number>,
  zoomOut: () => ipcRenderer.invoke('view:zoom-out') as Promise<number>,
  zoomReset: () => ipcRenderer.invoke('view:zoom-reset') as Promise<number>,
  on,
})
