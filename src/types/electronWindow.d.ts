// Injected by the Electron preload (electron/preload.js). Present only in the
// desktop build; the web build leaves `window.electronWindow` undefined.
// Backs the custom title bar (components/ElectronTitleBar) that replaces the
// OS window chrome on the frameless BrowserWindow.
export interface ElectronWindowApi {
  isAvailable: true;
  /** `process.platform` from the main process, e.g. "win32" / "darwin" / "linux". */
  platform: string;
  minimize: () => Promise<void>;
  toggleMaximize: () => Promise<void>;
  close: () => Promise<void>;
  isMaximized: () => Promise<boolean>;
  /** Subscribe to OS-level maximize/restore changes. Returns an unsubscribe fn. */
  onMaximizedChange: (cb: (isMaximized: boolean) => void) => () => void;
  // Page zoom (factor, 1 = 100%). Optional: desktop builds older than the zoom
  // controls don't expose it, and the title bar hides them there.
  zoomIn?: () => Promise<number>;
  zoomOut?: () => Promise<number>;
  resetZoom?: () => Promise<number>;
  getZoom?: () => Promise<number>;
  /** Subscribe to zoom changes from any source. Returns an unsubscribe fn. */
  onZoomChange?: (cb: (factor: number) => void) => () => void;
}

declare global {
  interface Window {
    electronWindow?: ElectronWindowApi;
  }
}

export {};
