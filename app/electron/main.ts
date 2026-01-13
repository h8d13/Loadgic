import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Disable Wayland color management protocol (wp_color_manager_v1) to prevent
// errors on compositors that don't fully implement it yet
if (process.platform === 'linux') {
  const args = process.argv

  if (args.includes('--wayland')) {
    // Waylande natif (Ozone)
    app.commandLine.appendSwitch('enable-features', 'UseOzonePlatform')
    app.commandLine.appendSwitch('ozone-platform', 'wayland')
  }

  if (args.includes('--X11')) {
    // X11 natif
    app.commandLine.appendSwitch('enable-features', 'UseOzonePlatform')
    app.commandLine.appendSwitch('ozone-platform', 'x11')
  }
  app.commandLine.appendSwitch('disable-features', 'WaylandWpColorManagerV1')
}

console.log('XDG_SESSION_TYPE:', process.env.XDG_SESSION_TYPE)
console.log('WAYLAND_DISPLAY:', process.env.WAYLAND_DISPLAY)
console.log('DISPLAY:', process.env.DISPLAY)

let mainWindow: BrowserWindow | null = null

ipcMain.handle('window:minimize', () => {
  mainWindow?.minimize()
})

ipcMain.handle('window:close', () => {
  mainWindow?.close()
})

ipcMain.handle('window:toggle-fullscreen', () => {
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
    maximizable: false,
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
  })

  // Fallback (usefull for wayland)
  const fallback = setTimeout(() => {
    if (mainWindow && !mainWindow.isVisible()) {
      mainWindow.show()
    }
  }, 1500)
  mainWindow.on('show', () => clearTimeout(fallback))

  mainWindow.setMaximizable(false)
  mainWindow.on('maximize', () => {
    mainWindow?.unmaximize()
  })
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    mainWindow = null
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
