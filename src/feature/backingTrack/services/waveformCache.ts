/**
 * Keeps learned YouTube waveforms between sessions.
 *
 * Learning one costs a play-through of the song, so throwing it away when the
 * screen closes would make the feature not worth using. IndexedDB rather than
 * the Electron store because this has to work on the web build too, and rather
 * than localStorage because these are binary blobs measured in tens of KB.
 *
 * Every call degrades to "no cache" rather than throwing: private-browsing
 * modes, blocked storage and server-side rendering all have to be survivable.
 */

const DB_NAME = "riff-waveforms";
const DB_VERSION = 2;
const STORE = "youtube";

/**
 * Bumped when the listening pipeline changes shape enough that an older
 * waveform is no longer comparable to a new one.
 *
 * Version 2 is the move from animation-frame sampling to the audio thread, and
 * the first that subtracts capture latency. Everything written before it was
 * shifted late by an unmeasured amount and flattened wherever the tab lost
 * focus, so a stale entry is not a head start — it is a wrong picture that a
 * new pass would be blended into. Old entries are dropped on read.
 */
export const WAVEFORM_SCHEMA = 2;

export interface StoredWaveform {
  videoId: string;
  /** One byte per bucket — see packPeaks. */
  peaks: Uint8Array;
  /** Attack strength on the same grid, packed the same way. */
  onsets: Uint8Array;
  /**
   * What each channel was normalised by before packing — see PeakBuilder.scales.
   *
   * Without these a resumed pass is measured in different units than the pass it
   * is resuming, and the two halves of the waveform no longer belong to the same
   * picture.
   */
  peakScale: number;
  onsetScale: number;
  durationSec: number;
  bucketsPerSecond: number;
  /** 0..1 of the recording heard so far, so a partial learn can be resumed. */
  coverage: number;
  /**
   * Capture latency this pass was recorded with, in ms, or null if it was never
   * measured.
   *
   * Kept so a later pass can refuse to blend itself into a waveform recorded
   * through a materially different path — a different output device, a different
   * machine. Two halves recorded at two latencies is the failure that reads as
   * "it was fine and then it drifted".
   */
  latencyMs: number | null;
  /** See WAVEFORM_SCHEMA. */
  schema: number;
  updatedAt: number;
}

function openDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === "undefined") return Promise.resolve(null);

  return new Promise((resolve) => {
    let request: IDBOpenDBRequest;
    try {
      request = indexedDB.open(DB_NAME, DB_VERSION);
    } catch {
      resolve(null);
      return;
    }
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: "videoId" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
    // A blocked upgrade would otherwise leave this promise pending forever.
    request.onblocked = () => resolve(null);
  });
}

export async function deleteWaveform(videoId: string): Promise<void> {
  const db = await openDb();
  if (!db) return;

  await new Promise<void>((resolve) => {
    try {
      const request = db.transaction(STORE, "readwrite").objectStore(STORE).delete(videoId);
      request.onsuccess = () => resolve();
      request.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
  db.close();
}

export async function readWaveform(videoId: string): Promise<StoredWaveform | null> {
  const db = await openDb();
  if (!db) return null;

  const stored = (await new Promise((resolve) => {
    try {
      const request = db.transaction(STORE, "readonly").objectStore(STORE).get(videoId);
      request.onsuccess = () => resolve((request.result as StoredWaveform) ?? null);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  }).finally(() => db.close())) as StoredWaveform | null;

  if (!stored) return null;
  // Written by a pipeline whose output cannot be trusted against this one.
  // Dropped rather than ignored so the space is not held forever.
  if (stored.schema !== WAVEFORM_SCHEMA) {
    void deleteWaveform(videoId);
    return null;
  }
  return stored;
}

export async function writeWaveform(waveform: StoredWaveform): Promise<void> {
  const db = await openDb();
  if (!db) return;

  await new Promise<void>((resolve) => {
    try {
      const request = db.transaction(STORE, "readwrite").objectStore(STORE).put(waveform);
      request.onsuccess = () => resolve();
      request.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
  db.close();
}
