export {}

declare global {
  interface Window {
    loadgic: {
      minimize: () => Promise<void>
      maximize: () => Promise<void>
      close: () => Promise<void>
      toggleFullscreen: () => Promise<void>
      zoomIn: () => Promise<number>
      zoomOut: () => Promise<number>
      zoomReset: () => Promise<number>
      on: (channel: string, handler: () => void) => () => void
    }
  }
}
