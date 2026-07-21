// Minimal preload for the splash window — same contextIsolation/no-nodeIntegration
// posture as the main window's preload, just exposing a status text updater.
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("splash", {
  onStatus: (cb) => ipcRenderer.on("splash:status", (_event, text) => cb(text)),
});
