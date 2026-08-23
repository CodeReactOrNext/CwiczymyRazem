// Injected by the Electron preload (electron/preload.js) as window.backingTracks.
// Local audio library + per-song sync settings for playing a recording along with
// a Guitar Pro tab. Desktop only — the files live on the user's machine, so the
// web build gets the YouTube source instead (config in Firestore).
import type { BackingTrackAssignment, BackingTrackMeta } from "feature/backingTrack/types/backingTrack.types";

/** Raw bytes of one imported track, straight off disk. */
export interface BackingTrackData {
  id: string;
  name: string;
  mimeType: string;
  /** Node Buffer on the main-process side; arrives as a Uint8Array in the renderer. */
  data: Uint8Array;
}

/** Outcome of importing one chosen file. */
export type BackingTrackImportResult =
  | { ok: true; track: BackingTrackMeta }
  | { ok: false; fileName: string; message: string };

export interface BackingTracksApi {
  isAvailable: true;
  listTracks: () => Promise<BackingTrackMeta[]>;
  /** Opens a native multi-select audio-file picker and copies every pick into the
   *  app's data folder — one result per file, so a single bad one doesn't lose
   *  the rest. Empty array if cancelled. */
  importTracks: () => Promise<BackingTrackImportResult[]>;
  deleteTrack: (id: string) => Promise<void>;
  /** Imports dropped files by path — one result per file, like the picker. */
  importPaths: (filePaths: string[]) => Promise<BackingTrackImportResult[]>;
  /** Real path of a dropped File, or null when it has none. */
  pathForFile: (file: File) => string | null;
  readTrack: (id: string) => Promise<BackingTrackData | null>;
  getAssignment: (songId: string) => Promise<BackingTrackAssignment | null>;
  /** Merge-writes a partial assignment; resolves the stored (clamped) result. */
  saveAssignment: (
    songId: string,
    patch: Partial<BackingTrackAssignment>,
  ) => Promise<BackingTrackAssignment | null>;
  clearAssignment: (songId: string) => Promise<void>;
}

declare global {
  interface Window {
    backingTracks?: BackingTracksApi;
  }
}

export {};
