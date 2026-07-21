// Electron main process: thin shell around the existing Next.js app + native
// audio IPC. In dev it loads the local Next dev server; in production it loads
// the URL from ELECTRON_START_URL (your hosted deployment) or localhost.
const { app, BrowserWindow, ipcMain, session, Menu, shell, dialog } = require("electron");
const path = require("path");
const audioBridge = require("./audioBridge");
const ampSim = require("./ampSim");
const buildMenu = require("./menu");

const isDev = !app.isPackaged;
const START_URL =
  process.env.ELECTRON_START_URL || (isDev ? "http://localhost:3000" : "http://localhost:3000");
const APP_ICON = path.join(__dirname, "..", "public", "favicon", "android-chrome-512x512.png");
const RELOAD_RETRY_MS = 800; // dev server / remote host may still be starting up

app.setName("riff.quest");

let mainWindow = null;
let splashWindow = null;
let retryTimer = null;

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 360,
    height: 220,
    frame: false,
    resizable: false,
    movable: true,
    show: true,
    backgroundColor: "#0a0a0a",
    icon: APP_ICON,
    webPreferences: {
      preload: path.join(__dirname, "splashPreload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  splashWindow.loadFile(path.join(__dirname, "splash.html"));
  splashWindow.on("closed", () => { splashWindow = null; });
}

function setSplashStatus(text) {
  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.webContents.send("splash:status", text);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    show: false, // revealed on ready-to-show, once the splash hands off
    backgroundColor: "#0a0a0a",
    icon: APP_ICON,
    title: "riff.quest",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // preload needs Node `require` for the bridge
    },
  });

  mainWindow.loadURL(START_URL);
  if (isDev) mainWindow.webContents.openDevTools({ mode: "detach" });

  mainWindow.once("ready-to-show", () => {
    if (retryTimer) { clearTimeout(retryTimer); retryTimer = null; }
    mainWindow.show();
    if (splashWindow && !splashWindow.isDestroyed()) splashWindow.close();
  });

  // The dev server (or a remote deployment) may not be reachable yet — retry
  // instead of leaving the user on Electron's default "can't reach this page".
  mainWindow.webContents.on("did-fail-load", (_event, errorCode) => {
    if (errorCode === -3) return; // ERR_ABORTED — usually just a redirect/navigation
    setSplashStatus("Nie można połączyć się z aplikacją — ponawiam próbę…");
    if (retryTimer) clearTimeout(retryTimer);
    retryTimer = setTimeout(() => {
      if (mainWindow && !mainWindow.isDestroyed()) mainWindow.loadURL(START_URL);
    }, RELOAD_RETRY_MS);
  });

  mainWindow.on("closed", () => {
    if (retryTimer) { clearTimeout(retryTimer); retryTimer = null; }
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
  Menu.setApplicationMenu(buildMenu({ isDev, shell, dialog, getMainWindow: () => mainWindow }));
  createSplashWindow();
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
