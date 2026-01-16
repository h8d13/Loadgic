import type { ProjectNode } from './types/project'
import type { FileContent } from './types/file'

export {}

declare global {
  interface Window {
    loadgic: {
      // Window controls
      minimize: () => Promise<void>
      maximize: () => Promise<void>
      close: () => Promise<void>
      toggleFullscreen: () => Promise<void>
      // Settings window
      openSettingsWindow: () => Promise<void>
      minimizeSettings: () => Promise<void>
      closeSettings: () => Promise<void>
      // Zoom controls
      zoomIn: () => Promise<number>
      zoomOut: () => Promise<number>
      zoomReset: () => Promise<number>
      // Debug controls
      reload: () => Promise<void>
      hardReload: () => Promise<void>
      openDevTools: () => Promise<void>
      // Generic event listener
      on: (channel: string, handler: () => void) => () => void
      // Upstream: Project/file operations
      openProject: () => Promise<{ rootPath: string; tree: ProjectNode } | null>
      readFile: (filePath: string) => Promise<FileContent | null>
      onMainMessage?: (handler: (message: string) => void) => () => void
    }
  }
}
