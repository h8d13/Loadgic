import { app, BrowserWindow, ipcMain, screen } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

let mainWindow: BrowserWindow | null = null
let isPseudoMaximized = false
let previousBounds: Electron.Rectangle | null = null

ipcMain.handle('window:minimize', () => {
  mainWindow?.minimize()
})

ipcMain.handle('window:toggle-maximize', () => {
  if (!mainWindow) return

  const display = screen.getDisplayMatching(mainWindow.getBounds())
  const workArea = display.workArea

  if (!isPseudoMaximized) {
    previousBounds = mainWindow.getBounds()
    mainWindow.setBounds(workArea, true)
    isPseudoMaximized = true
  } else {
    if (previousBounds) {
      mainWindow.setBounds(previousBounds, true)
    }
    isPseudoMaximized = false
  }
})

ipcMain.handle('window:close', () => {
    mainWindow?.close()
})

ipcMain.handle('window:get-pos', () => {
  if (!mainWindow) return { x: 0, y: 0 }
  const [x, y] = mainWindow.getPosition()
  return { x, y }
})

ipcMain.handle('window:move-absolute', (_event, { x, y }) => {
  if (!mainWindow) return
  mainWindow.setPosition(Math.round(x), Math.round(y))
})

function createWindow() {
  mainWindow = new BrowserWindow({
    title: 'Loadgic',
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: '#0f1115',
    show: false,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
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
