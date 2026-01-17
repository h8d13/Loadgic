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
  // CStore: metadata operations
  readMeta: (filePath: string) => ipcRenderer.invoke('cstore:read-meta', filePath) as Promise<string[]>,
  writeMeta: (filePath: string, meta: string[]) => ipcRenderer.invoke('cstore:write-meta', filePath, meta) as Promise<boolean>,
  // File watcher
  onFileChanged: (handler: (filePath: string) => void) => {
    const listener = (_event: IpcRendererEvent, filePath: string) => handler(filePath)
    ipcRenderer.on('file:changed', listener)
    return () => ipcRenderer.removeListener('file:changed', listener)
  },
  onTreeRefresh: (handler: (tree: unknown) => void) => {
    const listener = (_event: IpcRendererEvent, tree: unknown) => handler(tree)
    ipcRenderer.on('tree:refresh', listener)
    return () => ipcRenderer.removeListener('tree:refresh', listener)
  },
  // LgRunner: Run file with instrumentation
  lgRun: (filePath: string, args?: string[]) =>
    ipcRenderer.invoke('lg:run', filePath, args) as Promise<{ success: boolean; code?: number | null; error?: string }>,
  lgKill: () => ipcRenderer.invoke('lg:kill') as Promise<boolean>,
  onLgMetric: (handler: (metric: { marker: string; line: number; time: number; source: string }) => void) => {
    const listener = (_event: IpcRendererEvent, metric: { marker: string; line: number; time: number; source: string }) => handler(metric)
    ipcRenderer.on('lg:metric', listener)
    return () => ipcRenderer.removeListener('lg:metric', listener)
  },
  onLgStdout: (handler: (data: string) => void) => {
    const listener = (_event: IpcRendererEvent, data: string) => handler(data)
    ipcRenderer.on('lg:stdout', listener)
    return () => ipcRenderer.removeListener('lg:stdout', listener)
  },
  onLgStderr: (handler: (data: string) => void) => {
    const listener = (_event: IpcRendererEvent, data: string) => handler(data)
    ipcRenderer.on('lg:stderr', listener)
    return () => ipcRenderer.removeListener('lg:stderr', listener)
  },
  onLgDone: (handler: (result: { code: number | null; summary: unknown }) => void) => {
    const listener = (_event: IpcRendererEvent, result: { code: number | null; summary: unknown }) => handler(result)
    ipcRenderer.on('lg:done', listener)
    return () => ipcRenderer.removeListener('lg:done', listener)
  },
  onMainMessage: (handler: (message: string) => void) => {
    const listener = (_event: IpcRendererEvent, message: string) => {
      handler(message)
    }
    ipcRenderer.on('main-process-message', listener)
    return () => ipcRenderer.removeListener('main-process-message', listener)
  },
})
