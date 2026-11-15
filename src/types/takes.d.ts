// Injected by the Electron preload (electron/preload.js) as window.takes.
// Recordings of the player's own playing, saved as files in a folder on their
// computer — desktop only (see feature/takes and electron/takeRecorder.js).

export type TakeMode = "audio" | "video";

/** What one file of a take holds. */
export type TakeFileRole = "mix" | "guitar" | "backing" | "video";

export interface TakeFile {
  /** File name inside the takes folder. */
  name: string;
  role: TakeFileRole;
  bytes: number;
}

export interface TakeEntry {
  id: string;
  /** The song or exercise it was recorded on; empty when there was none. */
  title: string;
  createdAt: number;
  kind: TakeMode;
  /** Known for audio takes only. */
  durationSec: number | null;
  files: TakeFile[];
}

/** What the audio engine is recording as "the guitar". */
export interface TakeGuitarSource {
  sampleRate: number;
  /** True when it is the amp's output (after the VST rack), false for the raw input. */
  wet: boolean;
  /** How long before a block reaches the engine the string was played. */
  inputLatencyMs: number;
}

export interface TakeStartOptions {
  mode: TakeMode;
  title?: string;
  /** The guitar and the backing as separate files; for a video, the backing as a WAV beside it. */
  split?: boolean;
  /** Video: what the window's encoder produces. */
  container?: "mp4" | "webm";
}

export interface TakeStarted {
  mode: TakeMode;
  baseName: string;
  folder: string;
  /** Null while no audio stream is open — the guitar joins when one does. */
  guitar: TakeGuitarSource | null;
}

export interface TakeFinishOptions {
  discard?: boolean;
  /** Wall-clock moment (Date.now()) the backing's first sample was heard. */
  backingStartMs?: number;
  backingSampleRate?: number;
  /** The player's own correction; positive moves the guitar later. */
  guitarTrimMs?: number;
}

export interface TakesApi {
  isAvailable: true;
  start: (opts: TakeStartOptions) => Promise<TakeStarted>;
  /** Interleaved stereo FLOAT32, as bytes. */
  pushBacking: (bytes: Uint8Array) => void;
  pushVideo: (bytes: Uint8Array) => void;
  /** Video takes: the guitar for the window to mix in. Returns an unsubscribe fn. */
  onGuitar: (cb: (pcm: Uint8Array, sampleRate: number, endWallMs: number) => void) => () => void;
  /** Resolves the saved take, or null when it was discarded or recorded nothing. */
  finish: (opts?: TakeFinishOptions) => Promise<TakeEntry | null>;
  list: () => Promise<TakeEntry[]>;
  getFolder: () => Promise<string>;
  /** Native folder picker; null if cancelled. */
  chooseFolder: () => Promise<string | null>;
  openFolder: () => Promise<boolean>;
  reveal: (fileName: string) => Promise<boolean>;
  open: (fileName: string) => Promise<boolean>;
  /** Moves the take's files to the recycle bin; resolves the new list. */
  remove: (takeId: string) => Promise<TakeEntry[]>;
}

declare global {
  interface Window {
    takes?: TakesApi;
  }
}

export {};
