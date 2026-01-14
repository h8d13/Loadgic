export {}

declare global {
  interface Window {
    loadgic: {
      minimize: () => void
      close: () => void
      toggleFullscreen: () => void
      openProject: () => Promise<
        { rootPath: string; tree: ProjectNode } | null
      >
      onMainMessage?: (handler: (message: string) => void) => () => void
    }
  }
}
