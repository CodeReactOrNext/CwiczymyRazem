// Preload runs in an isolated context with Node access and bridges a minimal,
// safe API to the renderer (the existing Next.js app). The renderer detects
// `window.nativeAudio` to switch from the browser mic path to native capture.
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("nativeAudio", {
  isAvailable: true,

  /** List input devices and the active audio API (ASIO / WASAPI / ...). */
  listDevices: () => ipcRenderer.invoke("native-audio:list-devices"),

  /** Open a low-latency input stream. opts: { deviceId, channel?, sampleRate?, frameSize? }
   *  Resolves with the negotiated stream info (incl. measured latencyMs). */
  start: (opts) => ipcRenderer.invoke("native-audio:start", opts),

  /** Stop and close the active stream. */
  stop: () => ipcRenderer.invoke("native-audio:stop"),

  /** Current { isOpen, info } status. */
  getStatus: () => ipcRenderer.invoke("native-audio:status"),

  /** Subscribe to captured PCM blocks (FLOAT32 mono). Returns an unsubscribe fn.
   *  The callback receives a Uint8Array view of the raw buffer. */
  onFrame: (cb) => {
    const listener = (_event, buf) => cb(buf);
    ipcRenderer.on("native-audio:frame", listener);
    return () => ipcRenderer.removeListener("native-audio:frame", listener);
  },
});

// Amp simulator: real-time monitoring with a tube-style effect chain.
contextBridge.exposeInMainWorld("nativeAmp", {
  isAvailable: true,
  listDevices: () => ipcRenderer.invoke("amp:list-devices"),
  /** Start monitoring. opts: { deviceId?, channel?, sampleRate?, frameSize?, params? } */
  start: (opts) => ipcRenderer.invoke("amp:start", opts),
  /** Live-update tone params: { drive?, tone?, level?, cab? } (0..1 / bool). */
  setParams: (params) => ipcRenderer.invoke("amp:set-params", params),
  stop: () => ipcRenderer.invoke("amp:stop"),
  getStatus: () => ipcRenderer.invoke("amp:status"),
});

// App-shell integration: design-matched context menu + tray/dock quick actions
// (see components/ElectronIntegrations on the renderer side).
contextBridge.exposeInMainWorld("electronApp", {
  isAvailable: true,

  /** Right-click params forwarded from the main process (webContents "context-menu"). */
  onContextMenu: (cb) => {
    const listener = (_event, params) => cb(params);
    ipcRenderer.on("app:context-menu", listener);
    return () => ipcRenderer.removeListener("app:context-menu", listener);
  },

  /** Navigation requests from the tray / dock menu, e.g. "/dashboard". */
  onNavigate: (cb) => {
    const listener = (_event, route) => cb(route);
    ipcRenderer.on("app:navigate", listener);
    return () => ipcRenderer.removeListener("app:navigate", listener);
  },

  /** Run a clipboard/edit command ("cut" | "copy" | "paste" | "selectAll")
   *  on the focused element via webContents — keeps native paste semantics. */
  editCommand: (command) => ipcRenderer.invoke("edit:command", command),

  /** Write arbitrary text (e.g. a right-clicked link URL) to the OS clipboard. */
  copyText: (text) => ipcRenderer.invoke("edit:copy-text", text),

  /** Keep the display awake while a practice session runs (powerSaveBlocker). */
  setKeepAwake: (enabled) => ipcRenderer.invoke("power:set-keep-awake", enabled),

  /** Mirror session progress (0..1) on the taskbar icon; null clears it. */
  setProgress: (value) => ipcRenderer.invoke("app:set-progress", value),

  /** Offline page's "try now" button — reload the app URL immediately. */
  retryConnect: () => ipcRenderer.invoke("app:retry-connect"),
});

// Frameless window controls: the renderer draws its own title bar (see
// components/ElectronTitleBar) and drives minimize/maximize/close through
// this bridge instead of relying on the (hidden) OS chrome.
contextBridge.exposeInMainWorld("electronWindow", {
  isAvailable: true,
  platform: process.platform,
  minimize: () => ipcRenderer.invoke("window:minimize"),
  toggleMaximize: () => ipcRenderer.invoke("window:toggle-maximize"),
  close: () => ipcRenderer.invoke("window:close"),
  isMaximized: () => ipcRenderer.invoke("window:is-maximized"),
  /** Fires whenever the OS-level maximize state changes (button, snap, double-click, drag). */
  onMaximizedChange: (cb) => {
    const listener = (_event, isMaximized) => cb(isMaximized);
    ipcRenderer.on("window:maximized-changed", listener);
    return () =>
      ipcRenderer.removeListener("window:maximized-changed", listener);
  },
});
