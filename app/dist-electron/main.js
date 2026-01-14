import { app, ipcMain, BrowserWindow, dialog } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readdir } from "node:fs/promises";
const __dirname$1 = path.dirname(fileURLToPath(import.meta.url));
if (process.platform === "linux") {
  app.commandLine.appendSwitch("disable-features", "WaylandWpColorManagerV1");
}
let mainWindow = null;
const IGNORED_DIRS = /* @__PURE__ */ new Set([".git", "node_modules"]);
ipcMain.handle("window:minimize", () => {
  mainWindow?.minimize();
});
ipcMain.handle("window:close", () => {
  mainWindow?.close();
});
ipcMain.handle("window:toggle-fullscreen", () => {
  if (!mainWindow) return;
  mainWindow.setFullScreen(!mainWindow.isFullScreen());
});
async function readProjectTree(dirPath) {
  async function walk(currentPath) {
    let entries;
    try {
      entries = await readdir(currentPath, { withFileTypes: true });
    } catch {
      return [];
    }
    const sortedEntries = entries.filter((entry) => !IGNORED_DIRS.has(entry.name)).sort((a, b) => {
      if (a.isDirectory() !== b.isDirectory()) {
        return a.isDirectory() ? -1 : 1;
      }
      return a.name.localeCompare(b.name, void 0, { sensitivity: "base" });
    });
    const children = await Promise.all(
      sortedEntries.map(async (entry) => {
        const entryPath = path.join(currentPath, entry.name);
        if (entry.isDirectory()) {
          return {
            name: entry.name,
            path: entryPath,
            type: "dir",
            children: await walk(entryPath)
          };
        }
        return { name: entry.name, path: entryPath, type: "file" };
      })
    );
    return children;
  }
  return {
    name: path.basename(dirPath),
    path: dirPath,
    type: "dir",
    children: await walk(dirPath)
  };
}
ipcMain.handle("dialog:open-project", async () => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openDirectory"]
  });
  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }
  const rootPath = result.filePaths[0];
  const tree = await readProjectTree(rootPath);
  return { rootPath, tree };
});
function createWindow() {
  const iconPath = process.env.VITE_DEV_SERVER_URL ? path.join(__dirname$1, "../public/app-icon.png") : path.join(__dirname$1, "../dist/app-icon.png");
  mainWindow = new BrowserWindow({
    title: "Loadgic",
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    maximizable: false,
    fullscreenable: true,
    backgroundColor: "#0f1115",
    show: false,
    frame: false,
    icon: iconPath,
    webPreferences: {
      preload: path.join(__dirname$1, "preload.mjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });
  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  if (devServerUrl) {
    mainWindow.loadURL(devServerUrl);
  } else {
    mainWindow.loadFile(path.join(__dirname$1, "../dist/index.html"));
  }
  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });
  const fallback = setTimeout(() => {
    if (mainWindow && !mainWindow.isVisible()) {
      mainWindow.show();
    }
  }, 1500);
  mainWindow.on("show", () => clearTimeout(fallback));
}
app.whenReady().then(createWindow);
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    mainWindow = null;
  }
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
