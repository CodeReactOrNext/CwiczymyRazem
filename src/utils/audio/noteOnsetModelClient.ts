import type { OnsetModelRequest, OnsetModelResponse, OnsetQuery } from "./noteOnsetModel";
import { MODEL_RATE } from "./noteOnsetModel";
import type { RecentAudioSnapshot } from "./recentAudio";

/** Where the model and the WASM engine are served from (public/models, see NOTICE.md). */
const MODEL_URL = "/models/basic-pitch/model.json";
const WASM_PATH = "/models/tfjs-wasm/";

export interface NoteOnsetModel {
  /**
   * How likely each queried note started when asked, read off `audio`. Null
   * when the model can't say: it failed to load, or a newer question came in
   * while this one waited its turn.
   */
  probe(audio: RecentAudioSnapshot, queries: OnsetQuery[]): Promise<number[] | null>;
  /** Loads the model now, with one look at silence, so the first real question
   *  isn't kept waiting for the worker, the engine and the weights. */
  warmUp(): void;
  dispose(): void;
}

/**
 * The note-onset model behind a worker, created on the first question. One
 * question runs at a time; one more waits, and a newer one takes its place —
 * only the latest attack is worth the model's ~180 ms.
 */
export function createNoteOnsetModel(): NoteOnsetModel {
  let worker: Worker | null = null;
  let failed = false;
  let nextId = 1;
  let running: number | null = null;
  let waiting: { request: OnsetModelRequest; resolve: (result: number[] | null) => void } | null = null;
  const resolvers = new Map<number, (result: number[] | null) => void>();

  const send = (request: OnsetModelRequest, resolve: (result: number[] | null) => void) => {
    running = request.id;
    resolvers.set(request.id, resolve);
    worker?.postMessage(request, [request.samples.buffer]);
  };

  const finish = (id: number, result: number[] | null) => {
    resolvers.get(id)?.(result);
    resolvers.delete(id);
    running = null;
    if (waiting && !failed) {
      const next = waiting;
      waiting = null;
      send(next.request, next.resolve);
    }
  };

  const giveUp = () => {
    failed = true;
    for (const resolve of resolvers.values()) resolve(null);
    resolvers.clear();
    waiting?.resolve(null);
    waiting = null;
    running = null;
  };

  const start = (): Worker | null => {
    if (worker || failed) return worker;
    if (typeof Worker === "undefined" || typeof WebAssembly === "undefined") {
      failed = true;
      return null;
    }
    worker = new Worker(new URL("./noteOnsetModel.worker.ts", import.meta.url));
    worker.onmessage = (event: MessageEvent<OnsetModelResponse>) => {
      const response = event.data;
      if ("error" in response) giveUp();
      else finish(response.id, response.probabilities);
    };
    worker.onerror = giveUp;
    return worker;
  };

  const model: NoteOnsetModel = {
    probe(audio, queries) {
      if (failed || queries.length === 0 || !start()) return Promise.resolve(null);
      return new Promise((resolve) => {
        const request: OnsetModelRequest = {
          id: nextId++, modelUrl: MODEL_URL, wasmPath: WASM_PATH,
          samples: audio.samples, sampleRate: audio.sampleRate, queries,
        };
        if (running === null) {
          send(request, resolve);
          return;
        }
        waiting?.resolve(null);
        waiting = { request, resolve };
      });
    },
    warmUp() {
      if (worker || failed) return;
      void model.probe({ samples: new Float32Array(MODEL_RATE), sampleRate: MODEL_RATE, endMs: 0 }, [{ midi: 60, secondsBeforeEnd: 0.5 }]);
    },
    dispose() {
      giveUp();
      worker?.terminate();
      worker = null;
    },
  };
  return model;
}
