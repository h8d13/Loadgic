export {}

declare global {
  interface Window {
    loadgic: {
      minimize: () => void
      close: () => void
      toggleFullscreen: () => void
      onMainMessage?: (handler: (message: string) => void) => () => void
    }
  }
}
