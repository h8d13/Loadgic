import { app, BrowserWindow, screen, ipcMain } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const __dirname = path.dirname(fileURLToPath(import.meta.url))

const DEBUG = process.env.DEBUG === 'true'
console.log('DEBUG mode:', DEBUG)

function debug(...args: unknown[]) {
  if (DEBUG) console.log('DEBUG:', ...args)
}

const handle = (channel: string, fn: () => void) => {
  ipcMain.handle(channel, () => (debug('IPC:', channel), fn()))
}
const pendingSends = new Map<string, NodeJS.Timeout>()
const send = (channel: string, debounceMs = 16) => {
  if (pendingSends.has(channel)) return
  debug('IPC:', channel)
  mainWindow?.webContents.send(channel)
  pendingSends.set(channel, setTimeout(() => pendingSends.delete(channel), debounceMs))
}

// ENV
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    mainWindow = null
  }
})

if (process.platform === 'linux') {
  const ds_type = process.env.XDG_SESSION_TYPE
  debug('Session type:', ds_type)

  // Handle Wayland vs X11 display server
  if (ds_type === 'wayland') {
    app.commandLine.appendSwitch('disable-features', 'WaylandWpColorManagerV1')
    app.commandLine.appendSwitch('ozone-platform', 'wayland')
    app.commandLine.appendSwitch('enable-features', 'UseOzonePlatform')
  } else if (ds_type === 'x11' || !ds_type) {
    app.commandLine.appendSwitch('ozone-platform', 'x11')
    app.commandLine.appendSwitch('disable-gpu-compositing')
  }
} // catch if undefined fallback to xorg

// More platforms

// END ENV

let mainWindow: BrowserWindow | null = null

handle('window:minimize', () => mainWindow?.minimize())
handle('window:maximize', () => {
  if (!mainWindow) return
  mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize()
})
handle('window:close', () => mainWindow?.close())
handle('window:toggle-fullscreen', () => {
  if (!mainWindow) return
  mainWindow.setFullScreen(!mainWindow.isFullScreen())
})

function createWindow() {
  mainWindow = new BrowserWindow({
    title: 'Loadgic',
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    fullscreenable: true,
    backgroundColor: '#0f1115',
    show: false,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  const devServerUrl = process.env.VITE_DEV_SERVER_URL

  if (devServerUrl) {
    // DEVELOPPEMENT MODE
    mainWindow.loadURL(devServerUrl)
  } else {
    // PRODUCTION MODE
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
    const [w, h] = mainWindow?.getSize() ?? [0, 0]
    debug(`Init size: ${w}x${h}`)
  })

  mainWindow.on('resize', () => {
    const [w, h] = mainWindow?.getSize() ?? [0, 0]
    debug(`Window resized: ${w}x${h}`)
  })

  mainWindow.on('restore', () => send('window:did-restore'))
  mainWindow.on('minimize', () => send('window:did-minimize'))
  mainWindow.on('maximize', () => send('window:did-maximize'))
  mainWindow.on('unmaximize', () => send('window:did-unmaximize'))
  mainWindow.on('focus', () => send('window:did-focus'))
  mainWindow.on('blur', () => send('window:did-blur'))

}

app.whenReady().then(() => {
  const primaryDisplay = screen.getPrimaryDisplay()
  const { width, height } = primaryDisplay.size
  debug(`Screen size: ${width}x${height}`)
  createWindow()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
