import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'

const on = (channel: string, handler: () => void) => {
  const listener = () => handler()
  ipcRenderer.on(channel, listener)
  return () => ipcRenderer.removeListener(channel, listener)
}

contextBridge.exposeInMainWorld('loadgic', {
  // Window controls
  minimize: () => ipcRenderer.invoke('window:minimize'),
  maximize: () => ipcRenderer.invoke('window:maximize'),
  close: () => ipcRenderer.invoke('window:close'),
  toggleFullscreen: () => ipcRenderer.invoke('window:toggle-fullscreen'),
  // Settings window
  openSettingsWindow: () => ipcRenderer.invoke('window:open-settings'),
  minimizeSettings: () => ipcRenderer.invoke('settings:minimize'),
  closeSettings: () => ipcRenderer.invoke('settings:close'),
  // Zoom controls
  zoomIn: () => ipcRenderer.invoke('view:zoom-in') as Promise<number>,
  zoomOut: () => ipcRenderer.invoke('view:zoom-out') as Promise<number>,
  zoomReset: () => ipcRenderer.invoke('view:zoom-reset') as Promise<number>,
  // Debug controls
  reload: () => ipcRenderer.invoke('debug:reload'),
  hardReload: () => ipcRenderer.invoke('debug:hard-reload'),
  openDevTools: () => ipcRenderer.invoke('debug:open-devtools'),
  // Your generic event listener
  on,
  // Upstream: Project/file operations
  openProject: () => ipcRenderer.invoke('dialog:open-project'),
  readFile: (filePath: string) => ipcRenderer.invoke('file:read', filePath),
  onMainMessage: (handler: (message: string) => void) => {
    const listener = (_event: IpcRendererEvent, message: string) => {
      handler(message)
    }
    ipcRenderer.on('main-process-message', listener)
    return () => ipcRenderer.removeListener('main-process-message', listener)
  },
})
