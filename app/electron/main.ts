import { app, BrowserWindow, dialog, ipcMain } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { readFile, readdir, stat } from 'node:fs/promises'
import type { Dirent } from 'node:fs'
import type { DirNode, TreeNode } from '@/types/project'
const __dirname = path.dirname(fileURLToPath(import.meta.url))

const DEBUG = process.env.DEBUG === 'true'
console.log('DEBUG mode:', DEBUG)

function debug(...args: unknown[]) {
  if (DEBUG) console.log('DEBUG:', ...args)
}

const handle = <T>(channel: string, fn: () => T) => {
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
let settingsWindow: BrowserWindow | null = null
let currentZoom = 1.0

// Upstream: File tree configuration
const IGNORED_DIRS = new Set(['.git', 'node_modules'])
let currentProjectRoot: string | null = null

const IMAGE_MIME_BY_EXT: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.bmp': 'image/bmp',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
}

const BINARY_EXTENSIONS = new Set([
  '.pdf',
  '.zip',
  '.rar',
  '.7z',
  '.mp4',
  '.mov',
  '.mp3',
  '.wav',
  '.tiff',
])

const MAX_VIEW_FILE_BYTES = 10 * 1024 * 1024 // 10MB

// Window controls
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

function centerSettingsWindow() {
  if (!settingsWindow || settingsWindow.isDestroyed() || !mainWindow) return
  const mainBounds = mainWindow.getBounds()
  const [width, height] = settingsWindow.getSize()
  const x = Math.round(mainBounds.x + (mainBounds.width - width) / 2)
  const y = Math.round(mainBounds.y + (mainBounds.height - height) / 2)
  settingsWindow.setPosition(x, y)
}

ipcMain.handle('window:open-settings', () => {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    centerSettingsWindow()
    settingsWindow.show()
    settingsWindow.focus()
    return
  }
  const mainBounds = mainWindow?.getBounds()
  const width = Math.min(720, mainBounds ? Math.floor(mainBounds.width * 0.8) : 720)
  const height = Math.min(520, mainBounds ? Math.floor(mainBounds.height * 0.8) : 520)
  const x = mainBounds ? Math.round(mainBounds.x + (mainBounds.width - width) / 2) : undefined
  const y = mainBounds ? Math.round(mainBounds.y + (mainBounds.height - height) / 2) : undefined
  settingsWindow = new BrowserWindow({
    title: 'Loadgic Settings',
    width,
    height,
    minWidth: 520,
    minHeight: 420,
    resizable: true,
    backgroundColor: '#0f1115',
    show: false,
    frame: false,
    x,
    y,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  const devServerUrl = process.env.VITE_DEV_SERVER_URL
  if (devServerUrl) {
    settingsWindow.loadURL(`${devServerUrl}#/settings`)
  } else {
    settingsWindow.loadFile(path.join(__dirname, '../dist/index.html'), {
      hash: '/settings',
    })
  }

  settingsWindow.once('ready-to-show', () => {
    settingsWindow?.show()
  })

  settingsWindow.on('closed', () => {
    settingsWindow = null
  })
})

handle('settings:minimize', () => settingsWindow?.minimize())
handle('settings:close', () => settingsWindow?.close())

// Zoom operations
handle('view:zoom-in', () => {
  if (!mainWindow) return currentZoom
  currentZoom = Math.min(currentZoom + 0.1, 3.0)
  mainWindow.webContents.setZoomFactor(currentZoom)
  return currentZoom
})

handle('view:zoom-out', () => {
  if (!mainWindow) return currentZoom
  currentZoom = Math.max(currentZoom - 0.1, 0.3)
  mainWindow.webContents.setZoomFactor(currentZoom)
  return currentZoom
})

handle('view:zoom-reset', () => {
  if (!mainWindow) return currentZoom
  currentZoom = 1.0
  mainWindow.webContents.setZoomFactor(currentZoom)
  return currentZoom
})

// Debug operations
handle('debug:reload', () => mainWindow?.webContents.reload())
handle('debug:hard-reload', () => mainWindow?.webContents.reloadIgnoringCache())
handle('debug:open-devtools', () => mainWindow?.webContents.openDevTools())

// Upstream: Recursively read a directory and build a project tree
async function readProjectTree(dirPath: string): Promise<DirNode> {
  async function walk(currentPath: string): Promise<TreeNode[]> {
    let entries: Dirent[]
    try {
      entries = await readdir(currentPath, { withFileTypes: true })
    } catch {
      return []
    }

    const sortedEntries = entries
      .filter((entry) => !IGNORED_DIRS.has(entry.name))
      .sort((a, b) => {
        if (a.isDirectory() !== b.isDirectory()) {
          return a.isDirectory() ? -1 : 1
        }
        return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
      })

    const children: TreeNode[] = await Promise.all(
      sortedEntries.map(async (entry): Promise<TreeNode> => {
        const entryPath = path.join(currentPath, entry.name)

        if (entry.isDirectory()) {
          return {
            name: entry.name,
            path: entryPath,
            type: 'dir',
            children: await walk(entryPath),
          }
        }
        return { name: entry.name, path: entryPath, type: 'file' }
      })
    )
    return children
  }

  return {
    name: path.basename(dirPath),
    path: dirPath,
    type: 'dir',
    children: await walk(dirPath),
  }
}

// Upstream: Handle open directory selector
ipcMain.handle('dialog:open-project', async () => {
  if (!mainWindow) return null
  debug('Opening folder dialog...')
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
    })
    if (result.canceled || result.filePaths.length === 0) {
      debug('Folder selection cancelled by user')
      return null
    }
    debug('Folder selected:', result.filePaths[0])
    const rootPath = result.filePaths[0]
    currentProjectRoot = rootPath
    const tree = await readProjectTree(rootPath)
    return { rootPath, tree }
  } catch (err) {
    debug('Folder selection error:', err)
    return null
  }
})

// Upstream: Safe file reading
ipcMain.handle('file:read', async (_event, filePath: string) => {
  if (!currentProjectRoot) return null
  const resolvedRoot = path.resolve(currentProjectRoot)
  const resolvedFile = path.resolve(filePath)
  if (!resolvedFile.startsWith(resolvedRoot + path.sep)) {
    return null
  }

  const ext = path.extname(resolvedFile).toLowerCase()

  // Check for unsupported binary files
  if (BINARY_EXTENSIONS.has(ext)) {
    return { kind: 'unsupported', reason: 'Binary file not supported' }
  }

  try {
    // Check file size
    const fileStat = await stat(resolvedFile)
    if (fileStat.size > MAX_VIEW_FILE_BYTES) {
      return { kind: 'unsupported', reason: 'File too large (>10MB)' }
    }

    // Handle image files
    const mime = IMAGE_MIME_BY_EXT[ext]
    if (mime) {
      const buffer = await readFile(resolvedFile)
      return { kind: 'image', mime, data: buffer.toString('base64') }
    }

    // Handle text files
    const buffer = await readFile(resolvedFile)
    if (buffer.includes(0)) {
      return { kind: 'unsupported', reason: 'Binary file not supported' }
    }
    return { kind: 'text', content: buffer.toString('utf-8') }
  } catch {
    return null
  }
})

function createWindow() {
  const iconPath = process.env.VITE_DEV_SERVER_URL
    ? path.join(__dirname, '../public/app-icon.png')
    : path.join(__dirname, '../dist/app-icon.png')
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
    icon: iconPath,
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
    currentZoom = mainWindow?.webContents.getZoomFactor() ?? 1.0
  })

  mainWindow.on('resize', () => {
    const [w, h] = mainWindow?.getSize() ?? [0, 0]
    debug(`Window resized: ${w}x${h}`)
  })

  // HOOKS (your window lifecycle events)
  mainWindow.on('restore', () => send('window:did-restore'))
  mainWindow.on('minimize', () => send('window:did-minimize'))
  mainWindow.on('maximize', () => send('window:did-maximize'))
  mainWindow.on('unmaximize', () => send('window:did-unmaximize'))
  mainWindow.on('focus', () => send('window:did-focus'))
  mainWindow.on('blur', () => send('window:did-blur'))
  mainWindow.on('enter-full-screen', () => send('window:did-enter-fullscreen'))
  mainWindow.on('leave-full-screen', () => send('window:did-leave-fullscreen'))
  // MORE EVENTS HERE
}

app.whenReady().then(createWindow)

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
