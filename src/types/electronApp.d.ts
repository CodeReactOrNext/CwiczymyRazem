// Injected by the Electron preload (electron/preload.js). Present only in the
// desktop build; the web build leaves `window.electronApp` undefined.
// Backs the design-matched context menu and tray/dock quick actions
// (components/ElectronIntegrations).

export interface ElectronContextMenuParams {
  /** Cursor position in viewport (CSS) pixels, relative to the window content. */
  x: number;
  y: number;
  /** True when the click landed on a text input / editable element. */
  isEditable: boolean;
  /** Currently selected text at the click target ("" when none). */
  selectionText: string;
  /** Href when the click landed on a link ("" when none). */
  linkURL: string;
  editFlags: {
    canCut: boolean;
    canCopy: boolean;
    canPaste: boolean;
    canSelectAll: boolean;
  };
}

export type ElectronEditCommand = "cut" | "copy" | "paste" | "selectAll";

export interface ElectronUpdateReadyInfo {
  version: string;
}

export interface ElectronUpdateStatus {
  version: string;
  /** ms epoch (Date.now()) when this update finished downloading. */
  readyAt: number;
}

export interface ElectronUpdaterState {
  status: "idle" | "checking" | "downloading" | "ready" | "up-to-date" | "error";
  currentVersion: string;
  /** Version being downloaded / ready / that failed; null before a check finds one. */
  version: string | null;
  /** Download progress 0..100, null when not downloading. */
  percent: number | null;
  error: string | null;
  /** False when this copy can't replace itself (macOS: run from the DMG, from
   *  Downloads, or from a folder the user can't write) — only a manual install works. */
  canAutoInstall: boolean;
  /** This platform's installer for the latest version (or the releases page). */
  manualDownloadUrl: string;
}

export interface ElectronInstallUpdateResult {
  ok: boolean;
  reason?: string;
}

export interface ElectronAppApi {
  isAvailable: true;
  /** Installed desktop app version (electron-builder packages the root package.json version). */
  appVersion: string;
  /** Subscribe to right-click events forwarded from the main process. Returns an unsubscribe fn. */
  onContextMenu: (cb: (params: ElectronContextMenuParams) => void) => () => void;
  /** Subscribe to tray/dock navigation requests (SPA routes). Returns an unsubscribe fn. */
  onNavigate: (cb: (route: string) => void) => () => void;
  /** Execute an edit command on the focused element with native semantics. */
  editCommand: (command: ElectronEditCommand) => Promise<void>;
  /** Write text (e.g. a link URL) to the OS clipboard. */
  copyText: (text: string) => Promise<void>;
  /** Keep the display awake while a practice session runs. Returns whether the blocker is active. */
  setKeepAwake: (enabled: boolean) => Promise<boolean>;
  /** Mirror session progress (0..1) on the taskbar icon; null clears it. */
  setProgress: (value: number | null) => Promise<void>;
  /** Reload the app URL immediately (offline screen's "try now"). */
  retryConnect: () => Promise<void>;
  /** Subscribe to a downloaded-and-ready-to-install update. Returns an unsubscribe fn. */
  onUpdateReady: (cb: (info: ElectronUpdateReadyInfo) => void) => () => void;
  /** Quits and installs the already-downloaded update. Shells before 0.2.0
   *  resolve undefined; newer ones report whether the install could start
   *  (when it can't, the shell itself offers the manual download). */
  installUpdate: () => Promise<ElectronInstallUpdateResult | void>;
  /** Poll the current pending-update snapshot; null if none is downloaded yet. */
  getUpdateStatus: () => Promise<ElectronUpdateStatus | null>;
  /** Full updater state (0.2.0+; absent on older shells). Null in dev. */
  getUpdaterState?: () => Promise<ElectronUpdaterState | null>;
  /** Subscribe to updater state changes (0.2.0+). Returns an unsubscribe fn. */
  onUpdaterState?: (cb: (state: ElectronUpdaterState) => void) => () => void;
  /** Run an update check now (0.2.0+). */
  checkForUpdates?: () => Promise<ElectronUpdaterState | null>;
  /** Open this platform's installer download in the browser (0.2.0+). */
  openUpdateDownload?: () => Promise<void>;
}

declare global {
  interface Window {
    electronApp?: ElectronAppApi;
  }
}

export {};
