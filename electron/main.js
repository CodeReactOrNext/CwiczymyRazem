// Electron main process: thin shell around the existing Next.js app + native
// audio IPC. In dev it loads the local Next dev server; in production it loads
// the URL from ELECTRON_START_URL (your hosted deployment) or localhost.
const { app, BrowserWindow, ipcMain, session } = require("electron");
const path = require("path");
const audioBridge = require("./audioBridge");
const ampSim = require("./ampSim");

const isDev = !app.isPackaged;
const START_URL =
  process.env.ELECTRON_START_URL || (isDev ? "http://localhost:3000" : "http://localhost:3000");

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    backgroundColor: "#0a0a0a",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // preload needs Node `require` for the bridge
    },
  });

  mainWindow.loadURL(START_URL);
  if (isDev) mainWindow.webContents.openDevTools({ mode: "detach" });

  mainWindow.on("closed", () => {
    audioBridge.stop();
    ampSim.stop();
    mainWindow = null;
  });
}

// ── Native audio IPC ─────────────────────────────────────────────────────────
ipcMain.handle("native-audio:list-devices", () => audioBridge.listDevices());

ipcMain.handle("native-audio:start", (_e, opts) => {
  return audioBridge.start(opts || {}, (buf) => {
    // Forward each captured block to the renderer. Buffer is structured-cloned
    // into a Uint8Array on the other side.
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("native-audio:frame", buf);
    }
  });
});

ipcMain.handle("native-audio:stop", () => { audioBridge.stop(); return true; });
ipcMain.handle("native-audio:status", () => audioBridge.getStatus());

// ── Amp simulator IPC (duplex monitoring with effect chain) ──────────────────
ipcMain.handle("amp:list-devices", () => audioBridge.listDevices());
ipcMain.handle("amp:start", (_e, opts) => ampSim.start(opts || {}));
ipcMain.handle("amp:set-params", (_e, params) => ampSim.setParams(params || {}));
ipcMain.handle("amp:stop", () => { ampSim.stop(); return true; });
ipcMain.handle("amp:status", () => ampSim.getStatus());

// ── App lifecycle ────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  // Auto-grant mic permission so the web fallback path also works if ever used.
  session.defaultSession.setPermissionRequestHandler((_wc, _perm, cb) => cb(true));
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  audioBridge.stop();
  ampSim.stop();
  if (process.platform !== "darwin") app.quit();
});
