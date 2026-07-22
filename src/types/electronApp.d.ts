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

export interface ElectronAppApi {
  isAvailable: true;
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
}

declare global {
  interface Window {
    electronApp?: ElectronAppApi;
  }
}

export {};
