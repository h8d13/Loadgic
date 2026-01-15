import type { ProjectNode } from './types/project'

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
      // Your zoom controls
      zoomIn: () => Promise<number>
      zoomOut: () => Promise<number>
      zoomReset: () => Promise<number>
      // Your generic event listener
      on: (channel: string, handler: () => void) => () => void
      // Upstream: Project/file operations
      openProject: () => Promise<{ rootPath: string; tree: ProjectNode } | null>
      readFile: (filePath: string) => Promise<string | null>
      onMainMessage?: (handler: (message: string) => void) => () => void
    }
  }
}
