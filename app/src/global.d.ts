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
      // CStore: metadata operations
      readMeta: (filePath: string) => Promise<string[]>
      writeMeta: (filePath: string, meta: string[]) => Promise<boolean>
      // File watcher
      onFileChanged: (handler: (filePath: string) => void) => () => void
      onTreeRefresh: (handler: (tree: ProjectNode) => void) => () => void
      // LgRunner: Run file with instrumentation
      lgRun: (filePath: string, args?: string[]) => Promise<{ success: boolean; code?: number | null; error?: string }>
      lgKill: () => Promise<boolean>
      onLgMetric: (handler: (metric: { marker: string; line: number; time: number; source: string }) => void) => () => void
      onLgStdout: (handler: (data: string) => void) => () => void
      onLgStderr: (handler: (data: string) => void) => () => void
      onLgDone: (handler: (result: { code: number | null; summary: unknown }) => void) => () => void
      onMainMessage?: (handler: (message: string) => void) => () => void
    }
  }
}
