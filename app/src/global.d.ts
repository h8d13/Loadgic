export {}

declare global {
  interface Window {
    loadgic: {
      minimize: () => Promise<void>
      maximize: () => Promise<void>
      close: () => Promise<void>
      toggleFullscreen: () => Promise<void>
      on: (channel: string, handler: () => void) => () => void
    }
  }
}
