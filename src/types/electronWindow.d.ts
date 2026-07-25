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
}

declare global {
  interface Window {
    electronWindow?: ElectronWindowApi;
  }
}

export {};
