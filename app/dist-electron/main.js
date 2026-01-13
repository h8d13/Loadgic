import { app, ipcMain, BrowserWindow } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
const __dirname$1 = path.dirname(fileURLToPath(import.meta.url));
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    mainWindow = null;
  }
});
if (process.platform === "linux") {
  const ds_type = process.env.XDG_SESSION_TYPE;
  console.log(ds_type);
  if (ds_type === "wayland") {
    app.commandLine.appendSwitch("disable-features", "WaylandWpColorManagerV1");
    app.commandLine.appendSwitch("ozone-platform", "wayland");
    app.commandLine.appendSwitch("enable-features", "UseOzonePlatform");
  } else if (ds_type === "x11") {
    app.commandLine.appendSwitch("ozone-platform", "x11");
  }
}
let mainWindow = null;
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
function createWindow() {
  mainWindow = new BrowserWindow({
    title: "Loadgic",
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
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
    mainWindow?.show();
  });
}
app.whenReady().then(createWindow);
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
