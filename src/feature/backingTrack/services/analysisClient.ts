import type { RecordingFeatures } from "../utils/audioFeatures";
import type { AutoSyncInput, AutoSyncResult } from "../utils/autoSync";
import type { EngineRequest, EngineResult, LoadedTrack, TrackLayer } from "./analysisEngine";
import { handleRequest, MISSING_TRACK } from "./analysisEngine";

type Response = { id: number; ok: true; result: EngineResult } | { id: number; ok: false; error: string };

let worker: Worker | null = null;
/** Set when a worker could not be started, so nothing keeps retrying. */
let workerUnavailable = false;
let nextId = 1;
const pending = new Map<number, { resolve: (value: EngineResult) => void; reject: (error: Error) => void }>();
/** Files the current worker holds. A new worker starts empty. */
const loadedInWorker = new Set<string>();

function getWorker(): Worker | null {
  if (worker || workerUnavailable) return worker;
  try {
    worker = new Worker(new URL("./recordingAnalysis.worker.ts", import.meta.url));
  } catch {
    workerUnavailable = true;
    return null;
  }
  worker.onmessage = (event: MessageEvent<Response>) => {
    const response = event.data;
    const entry = pending.get(response.id);
    if (!entry) return;
    pending.delete(response.id);
    if (response.ok) entry.resolve(response.result);
    else entry.reject(new Error(response.error));
  };
  worker.onerror = (event) => {
    // A worker that dies takes everything in flight, and every file it held.
    for (const entry of pending.values()) entry.reject(new Error(event.message || "Analysis failed"));
    pending.clear();
    loadedInWorker.clear();
    worker?.terminate();
    worker = null;
  };
  return worker;
}

/**
 * Runs a request in the worker. With no worker at all (the test runner has
 * none) it runs here instead; in a browser that cannot start one it fails
 * rather than doing seconds of number crunching on the thread that draws the
 * app and keeps the metronome.
 */
function run(request: EngineRequest, transfer: Transferable[] = []): Promise<EngineResult> {
  if (typeof Worker === "undefined") {
    return new Promise((resolve, reject) =>
      setTimeout(() => {
        try {
          resolve(handleRequest(request).result);
        } catch (error) {
          reject(error);
        }
      }, 0),
    );
  }
  const target = getWorker();
  if (!target) return Promise.reject(new Error("Analysis worker unavailable"));
  const id = nextId++;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    target.postMessage({ ...request, id }, transfer);
  });
}

/** Hands a decoded file to the worker (its buffers go with it) and returns
 *  the outline to draw. */
export async function loadTrack(src: string, channels: Float32Array[]): Promise<LoadedTrack> {
  const result = (await run(
    { kind: "load", src, channels },
    channels.map((channel) => channel.buffer),
  )) as LoadedTrack;
  loadedInWorker.add(src);
  return result;
}

export const isTrackLoaded = (src: string) => loadedInWorker.has(src) || typeof Worker === "undefined";

/** Attacks and pitch of the layers together, from files already loaded. */
export function requestFeatures(layers: TrackLayer[]): Promise<RecordingFeatures> {
  return run({ kind: "features", layers }).catch((error: Error) => {
    if (error.message === MISSING_TRACK) layers.forEach((layer) => loadedInWorker.delete(layer.src));
    throw error;
  }) as Promise<RecordingFeatures>;
}

/** Where the tab sits in the recording, worked out from its features. */
export function requestAutoSync(input: AutoSyncInput): Promise<AutoSyncResult> {
  return run({ kind: "sync", input }) as Promise<AutoSyncResult>;
}
