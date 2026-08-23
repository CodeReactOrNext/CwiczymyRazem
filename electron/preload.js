// Preload runs in an isolated context with Node access and bridges a minimal,
// safe API to the renderer (the existing Next.js app). The renderer detects
// `window.nativeAudio` to switch from the browser mic path to native capture.
const { contextBridge, ipcRenderer, webUtils } = require("electron");

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
   *  The callback receives a Uint8Array view of the raw buffer, and the main
   *  process's Date.now() at the moment it sent this block (for measuring the
   *  actual main→renderer hand-off delay — see native-audio:start in main.js). */
  onFrame: (cb) => {
    const listener = (_event, buf, sentAt) => cb(buf, sentAt);
    ipcRenderer.on("native-audio:frame", listener);
    return () => ipcRenderer.removeListener("native-audio:frame", listener);
  },

  /** Fires when the shared stream is lost (device disconnected, driver reset from
   *  its own control panel, system resume) and again as the engine retries/recovers
   *  in the background. Payload: { status: "lost"|"retrying"|"recovered"|"failed",
   *  message?, attempt? }. Returns an unsubscribe fn. */
  onConnectionIssue: (cb) => {
    const listener = (_event, info) => cb(info);
    ipcRenderer.on("native-audio:connection-issue", listener);
    return () => ipcRenderer.removeListener("native-audio:connection-issue", listener);
  },

  /** Fires when the native device list changes (hot-plug) so a picker can refresh
   *  itself instead of only updating on a manual click. Returns an unsubscribe fn. */
  onDevicesChanged: (cb) => {
    const listener = () => cb();
    ipcRenderer.on("native-audio:devices-changed", listener);
    return () => ipcRenderer.removeListener("native-audio:devices-changed", listener);
  },
});

// Amp simulator: real-time monitoring with a tube-style effect chain.
contextBridge.exposeInMainWorld("nativeAmp", {
  isAvailable: true,
  listDevices: () => ipcRenderer.invoke("amp:list-devices"),
  /** Start monitoring. opts: { deviceId?, channel?, sampleRate?, frameSize?, params? } */
  start: (opts) => ipcRenderer.invoke("amp:start", opts),
  /** Live-update tone params: { drive?, bass?, mid?, treble?, level?, cab?, gate?,
   *  delayEnabled?, delayMs?, delayFeedback?, delayMix?, irId? } (0..1 / bool,
   *  irId: string | null). */
  setParams: (params) => ipcRenderer.invoke("amp:set-params", params),
  stop: () => ipcRenderer.invoke("amp:stop"),
  getStatus: () => ipcRenderer.invoke("amp:status"),
  /** Fires when the DSP chain (usually a NAM model) fell far enough behind
   *  real time that the engine had to clear the output queue to recover —
   *  a real, audible click just happened, not a hypothetical one. Payload:
   *  { driftMs, namEnabled }. Returns an unsubscribe fn. */
  onOverload: (cb) => {
    const listener = (_event, info) => cb(info);
    ipcRenderer.on("amp:overload", listener);
    return () => ipcRenderer.removeListener("amp:overload", listener);
  },
  /** Same connection-loss/recovery event as nativeAudio.onConnectionIssue above —
   *  the amp shares the one underlying stream, so it can be affected too. Returns
   *  an unsubscribe fn. */
  onConnectionIssue: (cb) => {
    const listener = (_event, info) => cb(info);
    ipcRenderer.on("native-audio:connection-issue", listener);
    return () => ipcRenderer.removeListener("native-audio:connection-issue", listener);
  },
  /** Same hot-plug event as nativeAudio.onDevicesChanged above. Returns an
   *  unsubscribe fn. */
  onDevicesChanged: (cb) => {
    const listener = () => cb();
    ipcRenderer.on("native-audio:devices-changed", listener);
    return () => ipcRenderer.removeListener("native-audio:devices-changed", listener);
  },
});

// Tone Studio: local preset + cabinet-IR CRUD (config, not the live audio stream —
// that stays on nativeAmp above).
contextBridge.exposeInMainWorld("toneStudio", {
  isAvailable: true,
  listPresets: () => ipcRenderer.invoke("tone:list-presets"),
  savePreset: (preset) => ipcRenderer.invoke("tone:save-preset", preset),
  deletePreset: (id) => ipcRenderer.invoke("tone:delete-preset", id),
  listIRs: () => ipcRenderer.invoke("tone:list-irs"),
  deleteIR: (id) => ipcRenderer.invoke("tone:delete-ir", id),
  /** Opens a native file picker for a .wav IR; resolves null if the user cancels. */
  importIR: () => ipcRenderer.invoke("tone:import-ir"),
  listNamModels: () => ipcRenderer.invoke("tone:list-nam-models"),
  deleteNamModel: (id) => ipcRenderer.invoke("tone:delete-nam-model", id),
  /** Opens a native file picker for a .nam model; resolves null if the user cancels. */
  importNamModel: () => ipcRenderer.invoke("tone:import-nam-model"),
});

// Backing tracks: a local audio library plus the per-song sync settings that line
// a recording up with the Guitar Pro tab (see feature/backingTrack on the
// renderer side). YouTube backing tracks don't come through here — they work on
// the web build too, so their config lives in Firestore instead.
contextBridge.exposeInMainWorld("backingTracks", {
  isAvailable: true,

  listTracks: () => ipcRenderer.invoke("backing:list-tracks"),
  /** Opens a native audio-file picker (multi-select, for stems) and copies every
   *  pick into the app's data folder. Resolves one result per chosen file —
   *  { ok: true, track } or { ok: false, fileName, message } — so one bad file
   *  doesn't lose the rest. Empty array if the user cancels. */
  importTracks: () => ipcRenderer.invoke("backing:import-track"),
  deleteTrack: (id) => ipcRenderer.invoke("backing:delete-track", id),
  /** Imports files the user dropped, by path. Same result shape as the picker. */
  importPaths: (filePaths) => ipcRenderer.invoke("backing:import-paths", filePaths),
  /**
   * Real path of a dropped File.
   *
   * Electron removed the `path` property it used to graft onto File objects;
   * webUtils.getPathForFile is the supported replacement, and it only works from
   * a preload, which is why this crosses the bridge rather than the renderer
   * reading it directly.
   */
  pathForFile: (file) => {
    try {
      return webUtils.getPathForFile(file) || null;
    } catch {
      return null;
    }
  },
  /** Raw bytes of one track — the renderer wraps them in a Blob object URL,
   *  since a page served from https:// cannot load a file:// source. */
  readTrack: (id) => ipcRenderer.invoke("backing:read-track", id),

  /** Which track a song plays, and how it is aligned: { trackId, offsetMs,
   *  sourceBpm, volume, muted }. Null when the song has none. */
  getAssignment: (songId) => ipcRenderer.invoke("backing:get-assignment", songId),
  /** Merge-writes a partial assignment and resolves the stored (clamped) result. */
  saveAssignment: (songId, patch) => ipcRenderer.invoke("backing:save-assignment", songId, patch),
  clearAssignment: (songId) => ipcRenderer.invoke("backing:clear-assignment", songId),
});

// App-shell integration: design-matched context menu + tray/dock quick actions
// (see components/ElectronIntegrations on the renderer side).
contextBridge.exposeInMainWorld("electronApp", {
  isAvailable: true,

  /** Installed desktop app version (root package.json — same version electron-builder
   *  packages), shown in the sidebar so a stale build is obvious at a glance. */
  appVersion: require("../package.json").version,

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

  /** Fires once a downloaded update is ready — install requires a restart.
   *  Returns an unsubscribe fn. */
  onUpdateReady: (cb) => {
    const listener = (_event, info) => cb(info);
    ipcRenderer.on("app:update-ready", listener);
    return () => ipcRenderer.removeListener("app:update-ready", listener);
  },

  /** Quits and installs the already-downloaded update. */
  installUpdate: () => ipcRenderer.invoke("app:install-update"),

  /** Current pending-update snapshot, or null if none is downloaded yet.
   *  Unlike onUpdateReady this can be polled any time (e.g. right before
   *  starting a new practice session) — it doesn't rely on having been
   *  mounted when the update-downloaded event originally fired. */
  getUpdateStatus: () => ipcRenderer.invoke("app:get-update-status"),
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
