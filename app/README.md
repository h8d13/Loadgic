# Loadgic App (Electron + Vite)

This folder contains the Electron main/preload code and the React renderer.

Main files:

- `electron/main.ts`: Electron main process (window + IPC)
- `electron/preload.ts`: Secure bridge APIs exposed to the renderer
- `src/`: React UI (renderer)

Dev/build commands are documented in the root `README.md`.
