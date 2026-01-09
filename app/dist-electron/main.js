import { ipcMain, app, BrowserWindow } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
const __dirname$1 = path.dirname(fileURLToPath(import.meta.url));
let mainWindow = null;
ipcMain.handle("window:minimize", () => {
  mainWindow == null ? void 0 : mainWindow.minimize();
});
ipcMain.handle("window:close", () => {
  mainWindow == null ? void 0 : mainWindow.close();
});
ipcMain.handle("window:toggle-fullscreen", () => {
  if (!mainWindow) return;
  mainWindow.setFullScreen(!mainWindow.isFullScreen());
});
function createWindow() {
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
    mainWindow == null ? void 0 : mainWindow.show();
  });
  mainWindow.setMaximizable(false);
  mainWindow.on("maximize", () => {
    mainWindow == null ? void 0 : mainWindow.unmaximize();
  });
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
