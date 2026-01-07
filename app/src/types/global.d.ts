export {}

declare global {
  interface Window {
    loadgic: {
      minimize: () => void
      toggleMaximize: () => void
      close: () => void
    }
  }
}
