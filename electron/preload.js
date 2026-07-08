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
