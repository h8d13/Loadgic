import { contextBridge, ipcRenderer } from 'electron'
import type { IpcRendererEvent } from 'electron'

contextBridge.exposeInMainWorld('loadgic', {
  minimize: () => ipcRenderer.invoke('window:minimize'),
  close: () => ipcRenderer.invoke('window:close'),
  toggleFullscreen: () => ipcRenderer.invoke('window:toggle-fullscreen'),
  onMainMessage: (handler: (message: string) => void) => {
    const listener = (_event: IpcRendererEvent, message: string) => {
      handler(message)
    }
    ipcRenderer.on('main-process-message', listener)
    return () => ipcRenderer.removeListener('main-process-message', listener)
  },
})
