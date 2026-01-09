export {}

declare global {
  interface Window {
    loadgic: {
      minimize: () => void
      close: () => void
      toggleFullscreen: () => void
    }
  }
}
