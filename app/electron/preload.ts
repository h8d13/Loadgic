import { contextBridge, ipcRenderer } from 'electron'
import type { IpcRendererEvent } from 'electron'

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
  on,
})
