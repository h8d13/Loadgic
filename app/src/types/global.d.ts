export {}

declare global {
  interface Window {
    loadgic: {
      minimize: () => void
      toggleMaximize: () => void
      close: () => void
      getWindowPos: () => Promise<{ x: number; y: number }>
      moveAbsolute: (x: number, y: number) => Promise<void>
    }
  }
}
