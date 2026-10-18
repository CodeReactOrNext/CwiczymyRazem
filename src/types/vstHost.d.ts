// Injected by the Electron preload (electron/preload.js) as window.vstHost —
// the VST3 plugin rack for Tone Studio's VST mode. Windows desktop only; absent
// on the web build and on desktop shells older than the feature.

export type VstPluginSource = "system" | "folder" | "file";

export interface VstPluginInfo {
  /** VST3 class id (32 hex chars). */
  id: string;
  name: string;
  vendor: string;
  /** "Fx|Distortion|Dynamics" style category path from the plugin. */
  subCategories: string;
  version: string;
  /** Standard VST3 folder, a folder the player added, or a file they added. */
  source: VstPluginSource;
  /** For source "file": the file the player picked (to remove it again). */
  sourcePath?: string;
}

export interface VstFailedPlugin {
  name: string;
  /** Already phrased for the player (licence, crash, hang). */
  error: string;
}

export interface VstLibrary {
  /** Last "scan this computer"; null until the player ran one. */
  scannedAt: number | null;
  plugins: VstPluginInfo[];
  failed: VstFailedPlugin[];
  /** Files and folders the player added by hand. */
  sources: { folders: string[]; files: string[] };
  /** Only on the result of adding a folder: how many .vst3 files it held. */
  foundInFolder?: number;
}

export interface VstScanProgress {
  done: number;
  total: number;
  /** File being read right now; null once the scan finished. */
  current: string | null;
}

export type VstSlotState = "idle" | "loading" | "ready" | "error";

export interface VstRackSlot {
  /** Rack slot id — a plugin can sit in the rack more than once. */
  id: string;
  pluginId: string;
  name: string;
  vendor: string;
  bypass: boolean;
  status: VstSlotState;
  error: string | null;
  /** Latency this plugin adds. */
  latencyMs: number;
  editorOpen: boolean;
}

export interface VstRackStatus {
  /** False when this machine can't host plugins (non-Windows, missing addon). */
  supported: boolean;
  error: string | null;
  toneMode: "builtin" | "vst";
  slots: VstRackSlot[];
  /** Latency of every playing (loaded, not bypassed) plugin together. */
  latencyMs: number;
}

export type VstHostEvent =
  | { type: "status"; status: VstRackStatus }
  | { type: "warning" | "error"; slotId: string | null; message: string }
  | { type: "engine-exit"; code?: number };

export interface VstHostApi {
  isAvailable: boolean;
  listPlugins: () => Promise<VstLibrary>;
  scan: () => Promise<VstLibrary>;
  addFile: () => Promise<VstLibrary | null>;
  addFolder: () => Promise<VstLibrary | null>;
  removeSource: (sourcePath: string) => Promise<VstLibrary>;
  getRack: () => Promise<VstRackStatus>;
  addToRack: (pluginId: string, index?: number) => Promise<VstRackStatus>;
  removeFromRack: (slotId: string) => Promise<VstRackStatus>;
  moveInRack: (slotId: string, toIndex: number) => Promise<VstRackStatus>;
  setBypass: (slotId: string, bypass: boolean) => Promise<VstRackStatus>;
  openEditor: (slotId: string) => Promise<VstRackStatus>;
  closeEditor: (slotId: string) => Promise<VstRackStatus>;
  onEvent: (cb: (event: VstHostEvent) => void) => () => void;
  onScanProgress: (cb: (progress: VstScanProgress) => void) => () => void;
}

declare global {
  interface Window {
    vstHost?: VstHostApi;
  }
}

export {};
