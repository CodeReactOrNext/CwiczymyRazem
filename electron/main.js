// Electron main process: thin shell around the existing Next.js app + native
// audio IPC. In dev it loads the local Next dev server; in production it loads
// the URL from ELECTRON_START_URL (your hosted deployment) or localhost.
const {
  app,
  BrowserWindow,
  ipcMain,
  session,
  Menu,
  Tray,
  clipboard,
  nativeImage,
  powerSaveBlocker,
  shell,
  dialog,
} = require("electron");
const path = require("path");
const audioBridge = require("./audioBridge");
const ampSim = require("./ampSim");
const buildMenu = require("./menu");
const windowState = require("./windowState");

const isDev = !app.isPackaged;
const isMac = process.platform === "darwin";
const START_URL =
  process.env.ELECTRON_START_URL ||
  (isDev ? "http://localhost:3000" : "https://riff.quest");
const APP_ICON = path.join(
  __dirname,
  "..",
  "public",
  "favicon",
  "android-chrome-512x512.png",
);
const RELOAD_RETRY_MS = 2500; // auto-reconnect interval while offline / server starting

// Frameless on Windows/Linux (renderer draws its own title bar + controls);
// on macOS keep the native traffic lights but hide the default title bar,
// so the renderer's title bar just leaves room for them on the left.
const platformWindowChrome = isMac
  ? { titleBarStyle: "hidden", trafficLightPosition: { x: 16, y: 12 } }
  : { frame: false };

app.setName("riff.quest");

let mainWindow = null;
let splashWindow = null;
let retryTimer = null;
let tray = null;
let offlineShown = false; // main window is currently showing electron/offline.html
let keepAwakeId = null; // powerSaveBlocker id while a practice session runs

// Route requested via CLI/jump list before the renderer was ready to receive it.
let pendingRoute = routeFromArgv(process.argv);

/** Extracts "/some/route" from a `--route=/some/route` argument (jump list). */
function routeFromArgv(argv) {
  for (const arg of argv) {
    if (typeof arg === "string" && arg.startsWith("--route=")) {
      const route = arg.slice("--route=".length);
      if (route.startsWith("/")) return route;
    }
  }
  return null;
}

// Quick actions shared by the tray (Windows/Linux) and dock (macOS) menus.
// Routes are pushed through the renderer's Next router (see app:navigate).
const QUICK_NAV = [
  { label: "Panel główny", route: "/dashboard" },
  { label: "Moje ćwiczenia", route: "/my-exercises" },
  { label: "Dziennik ćwiczeń", route: "/practice-log" },
];

function showMainWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) {
    createWindow();
    return;
  }
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  mainWindow.focus();
}

function navigateTo(route) {
  showMainWindow();
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("app:navigate", route);
  }
}

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 420,
    height: 320,
    frame: false,
    transparent: true, // frameless rounded card — corners drawn in CSS
    resizable: false,
    movable: true,
    show: false, // revealed on ready-to-show so the card never flashes unstyled
    backgroundColor: "#00000000",
    icon: APP_ICON,
    webPreferences: {
      preload: path.join(__dirname, "splashPreload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  splashWindow.loadFile(path.join(__dirname, "splash.html"));
  splashWindow.once("ready-to-show", () => {
    if (splashWindow && !splashWindow.isDestroyed()) splashWindow.show();
  });
  splashWindow.on("closed", () => {
    splashWindow = null;
  });
}

function closeSplash() {
  const win = splashWindow;
  splashWindow = null;
  if (!win || win.isDestroyed()) return;
  // ~200ms opacity fade before closing, so the handoff to the main window
  // doesn't pop.
  let opacity = 1;
  const fade = setInterval(() => {
    opacity -= 0.08;
    if (win.isDestroyed()) {
      clearInterval(fade);
      return;
    }
    if (opacity <= 0) {
      clearInterval(fade);
      win.close();
      return;
    }
    win.setOpacity(opacity);
  }, 16);
}

function setSplashStatus(text) {
  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.webContents.send("splash:status", text);
  }
}

function createWindow() {
  const savedState = windowState.loadState({ width: 1440, height: 900 });
  mainWindow = new BrowserWindow({
    width: savedState.width,
    height: savedState.height,
    x: savedState.x,
    y: savedState.y,
    minWidth: 900,
    minHeight: 600,
    show: false, // revealed on ready-to-show, once the splash hands off
    backgroundColor: "#09090b", // zinc-950 — matches the app background, no flash

    icon: APP_ICON,
    title: "riff.quest",
    ...platformWindowChrome,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // preload needs Node `require` for the bridge
    },
  });

  windowState.trackWindow(mainWindow);
  mainWindow.loadURL(START_URL);
  if (isDev) mainWindow.webContents.openDevTools({ mode: "detach" });

  mainWindow.webContents.on("did-finish-load", () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    const url = mainWindow.webContents.getURL();
    if (!url.startsWith("http")) return;
    // The real app is up again — offline page (if any) has been replaced.
    offlineShown = false;
    if (retryTimer) {
      clearTimeout(retryTimer);
      retryTimer = null;
    }
    // Deliver a route requested via jump list / CLI before the app was ready.
    if (pendingRoute) {
      mainWindow.webContents.send("app:navigate", pendingRoute);
      pendingRoute = null;
    }
  });

  // window.open / target=_blank → the OS browser, never a second Electron
  // window. Exception: OAuth popups (Google / Firebase auth) must stay in-app,
  // the flow completes through window.opener.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    try {
      const { hostname } = new URL(url);
      if (
        hostname === "accounts.google.com" ||
        hostname.endsWith(".firebaseapp.com")
      ) {
        return { action: "allow" };
      }
    } catch {
      return { action: "deny" };
    }
    shell.openExternal(url);
    return { action: "deny" };
  });

  // No native context menu: forward right-click params to the renderer, which
  // draws its own design-matched menu (components/ElectronIntegrations) and
  // executes actions back through the edit:* IPC below.
  mainWindow.webContents.on("context-menu", (_event, params) => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    mainWindow.webContents.send("app:context-menu", {
      x: params.x,
      y: params.y,
      isEditable: params.isEditable,
      selectionText: params.selectionText || "",
      linkURL: params.linkURL || "",
      editFlags: {
        canCut: params.editFlags.canCut,
        canCopy: params.editFlags.canCopy,
        canPaste: params.editFlags.canPaste,
        canSelectAll: params.editFlags.canSelectAll,
      },
    });
  });

  mainWindow.once("ready-to-show", () => {
    if (savedState.isMaximized) mainWindow.maximize();
    mainWindow.show();
    closeSplash();
  });

  // Mirror maximize state to the renderer so its custom title bar can swap
  // the maximize/restore icon and stay in sync with OS-level snap/resize.
  mainWindow.on("maximize", () => {
    if (mainWindow && !mainWindow.isDestroyed())
      mainWindow.webContents.send("window:maximized-changed", true);
  });
  mainWindow.on("unmaximize", () => {
    if (mainWindow && !mainWindow.isDestroyed())
      mainWindow.webContents.send("window:maximized-changed", false);
  });

  // Server unreachable (offline, dev server still starting, deploy hiccup):
  // show the styled offline page and keep retrying in the background instead
  // of leaving the user on Electron's default "can't reach this page".
  mainWindow.webContents.on(
    "did-fail-load",
    (_event, errorCode, _errorDescription, _validatedURL, isMainFrame) => {
      if (!isMainFrame) return;
      if (errorCode === -3) return; // ERR_ABORTED — usually just a redirect/navigation
      if (!mainWindow || mainWindow.isDestroyed()) return;
      setSplashStatus("Nie można połączyć się z aplikacją — ponawiam próbę…");
      if (!offlineShown) {
        offlineShown = true;
        mainWindow.loadFile(path.join(__dirname, "offline.html"));
      }
      if (retryTimer) clearTimeout(retryTimer);
      retryTimer = setTimeout(() => {
        if (mainWindow && !mainWindow.isDestroyed())
          mainWindow.loadURL(START_URL);
      }, RELOAD_RETRY_MS);
    },
  );

  mainWindow.on("closed", () => {
    if (retryTimer) {
      clearTimeout(retryTimer);
      retryTimer = null;
    }
    offlineShown = false;
    stopKeepAwake();
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

ipcMain.handle("native-audio:stop", () => {
  audioBridge.stop();
  return true;
});
ipcMain.handle("native-audio:status", () => audioBridge.getStatus());

// ── Custom title bar IPC (frameless window controls) ─────────────────────────
ipcMain.handle("window:minimize", () => {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.minimize();
});

ipcMain.handle("window:toggle-maximize", () => {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  if (mainWindow.isMaximized()) mainWindow.unmaximize();
  else mainWindow.maximize();
});

ipcMain.handle("window:close", () => {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.close();
});

ipcMain.handle("window:is-maximized", () =>
  mainWindow && !mainWindow.isDestroyed() ? mainWindow.isMaximized() : false,
);

// ── Desktop integration IPC (offline retry, keep-awake, taskbar progress) ────
ipcMain.handle("app:retry-connect", () => {
  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.loadURL(START_URL);
});

function stopKeepAwake() {
  if (keepAwakeId !== null && powerSaveBlocker.isStarted(keepAwakeId)) {
    powerSaveBlocker.stop(keepAwakeId);
  }
  keepAwakeId = null;
}

// Practice session runs → keep the display awake (reading tabs while playing
// guitar means long stretches without any keyboard/mouse input).
ipcMain.handle("power:set-keep-awake", (_e, enabled) => {
  if (enabled) {
    if (keepAwakeId === null || !powerSaveBlocker.isStarted(keepAwakeId)) {
      keepAwakeId = powerSaveBlocker.start("prevent-display-sleep");
    }
  } else {
    stopKeepAwake();
  }
  return keepAwakeId !== null;
});

// Session progress mirrored onto the taskbar icon; null/invalid clears it.
ipcMain.handle("app:set-progress", (_e, value) => {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  const fraction =
    typeof value === "number" && Number.isFinite(value) && value >= 0
      ? Math.min(value, 1)
      : -1;
  mainWindow.setProgressBar(fraction);
});

// ── Context menu edit IPC (renderer-drawn menu → native edit semantics) ──────
const EDIT_COMMANDS = new Set(["cut", "copy", "paste", "selectAll"]);

ipcMain.handle("edit:command", (_e, command) => {
  if (!EDIT_COMMANDS.has(command)) return;
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.webContents[command]();
});

ipcMain.handle("edit:copy-text", (_e, text) => {
  if (typeof text === "string" && text) clipboard.writeText(text);
});

// ── Amp simulator IPC (duplex monitoring with effect chain) ──────────────────
ipcMain.handle("amp:list-devices", () => audioBridge.listDevices());
ipcMain.handle("amp:start", (_e, opts) => ampSim.start(opts || {}));
ipcMain.handle("amp:set-params", (_e, params) =>
  ampSim.setParams(params || {}),
);
ipcMain.handle("amp:stop", () => {
  ampSim.stop();
  return true;
});
ipcMain.handle("amp:status", () => ampSim.getStatus());

// ── Tray / dock integration ──────────────────────────────────────────────────
function createTray() {
  const faviconDir = path.join(__dirname, "..", "public", "favicon");
  // Windows tray wants an .ico; elsewhere a small PNG scales cleanly.
  const trayIcon =
    process.platform === "win32"
      ? path.join(faviconDir, "favicon.ico")
      : nativeImage
          .createFromPath(path.join(faviconDir, "favicon-32x32.png"))
          .resize({ width: 16, height: 16 });

  tray = new Tray(trayIcon);
  tray.setToolTip("riff.quest");
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: "Otwórz riff.quest", click: () => showMainWindow() },
      { type: "separator" },
      ...QUICK_NAV.map(({ label, route }) => ({
        label,
        click: () => navigateTo(route),
      })),
      { type: "separator" },
      { label: "Zamknij", click: () => app.quit() },
    ]),
  );
  tray.on("click", showMainWindow);
  tray.on("double-click", showMainWindow);
}

// ── Auto-update (GitHub Releases via electron-updater) ───────────────────────
function setupAutoUpdater() {
  if (isDev) return; // dev runs from source — nothing to update
  let autoUpdater;
  try {
    ({ autoUpdater } = require("electron-updater"));
  } catch (err) {
    console.error("electron-updater unavailable:", err);
    return;
  }
  autoUpdater.on("error", (err) => console.error("autoUpdater:", err));
  // Downloads in the background, shows a system notification when ready,
  // installs on quit. Re-check every 4h for long-running sessions.
  const check = () => autoUpdater.checkForUpdatesAndNotify().catch(() => {});
  check();
  setInterval(check, 4 * 60 * 60 * 1000);
}

// ── Windows jump list (taskbar right-click → quick actions) ──────────────────
function setupUserTasks() {
  if (process.platform !== "win32") return;
  app.setUserTasks(
    QUICK_NAV.map(({ label, route }) => ({
      program: process.execPath,
      arguments: `--route=${route}`,
      iconPath: process.execPath,
      iconIndex: 0,
      title: label,
      description: label,
    })),
  );
}

// ── App lifecycle ────────────────────────────────────────────────────────────
// Single instance: launching the app again just focuses the existing window.
const isPrimaryInstance = app.requestSingleInstanceLock();

if (!isPrimaryInstance) {
  app.quit();
} else {
  app.on("second-instance", (_event, argv) => {
    showMainWindow();
    // Jump-list entries launch a second instance with --route=… — turn that
    // into an in-app navigation of the existing window instead.
    const route = routeFromArgv(argv);
    if (route) navigateTo(route);
  });

  app.whenReady().then(() => {
    // Windows: ties notifications/taskbar grouping to the installed shortcut.
    if (process.platform === "win32") app.setAppUserModelId("quest.riff.desktop");
    // Auto-grant mic permission so the web fallback path also works if ever used.
    session.defaultSession.setPermissionRequestHandler((_wc, _perm, cb) =>
      cb(true),
    );
    Menu.setApplicationMenu(
      buildMenu({ isDev, shell, dialog, getMainWindow: () => mainWindow }),
    );
    createSplashWindow();
    createWindow();
    createTray();
    setupUserTasks();
    setupAutoUpdater();

    // macOS: mirror the quick actions in the dock icon's right-click menu.
    if (isMac && app.dock) {
      app.dock.setMenu(
        Menu.buildFromTemplate(
          QUICK_NAV.map(({ label, route }) => ({
            label,
            click: () => navigateTo(route),
          })),
        ),
      );
    }

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });
}

app.on("window-all-closed", () => {
  audioBridge.stop();
  ampSim.stop();
  if (process.platform !== "darwin") app.quit();
});
