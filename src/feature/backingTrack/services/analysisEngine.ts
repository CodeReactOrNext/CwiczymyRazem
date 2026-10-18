import type { RecordingFeatures } from "../utils/audioFeatures";
import { analyseRecording,ANALYSIS_SAMPLE_RATE } from "../utils/audioFeatures";
import type { AutoSyncInput, AutoSyncResult } from "../utils/autoSync";
import { autoSync } from "../utils/autoSync";

/** Buckets per second of the drawn outline. */
export const PEAKS_PER_SECOND = 120;

/**
 * Decoded files kept in the worker for the next analysis. A five-minute song
 * is ~26 MB mono at the analysis rate, so only a few — and none of it on the
 * main thread, where a few hundred megabytes of short-lived arrays is exactly
 * what makes the garbage collector stop the whole app.
 */
const MAX_TRACKS = 6;

export interface TrackLayer {
  src: string;
  /** The file's own shift against the recording's shared timeline, in ms. */
  offsetMs: number;
}

export type EngineRequest =
  | { kind: "load"; src: string; channels: Float32Array[] }
  | { kind: "features"; layers: TrackLayer[] }
  | { kind: "sync"; input: AutoSyncInput };

export interface LoadedTrack {
  peaks: Float32Array;
  durationSec: number;
}

export type EngineResult = LoadedTrack | RecordingFeatures | AutoSyncResult;

/** Raised when a file the analysis needs is not in this worker any more. */
export const MISSING_TRACK = "missing-track";

const tracks = new Map<string, Float32Array>();

function remember(src: string, mono: Float32Array) {
  tracks.delete(src);
  tracks.set(src, mono);
  while (tracks.size > MAX_TRACKS) tracks.delete(tracks.keys().next().value as string);
}

/** Loudest sample per bucket, normalised so a quiet master still fills the lane. */
function outline(samples: Float32Array): Float32Array {
  const perBucket = Math.max(1, Math.round(ANALYSIS_SAMPLE_RATE / PEAKS_PER_SECOND));
  const peaks = new Float32Array(Math.ceil(samples.length / perBucket));
  let loudest = 0;
  for (let bucket = 0; bucket < peaks.length; bucket += 1) {
    let peak = 0;
    const end = Math.min(samples.length, (bucket + 1) * perBucket);
    for (let i = bucket * perBucket; i < end; i += 1) {
      const magnitude = Math.abs(samples[i]);
      if (magnitude > peak) peak = magnitude;
    }
    peaks[bucket] = peak;
    if (peak > loudest) loudest = peak;
  }
  if (loudest > 0) for (let i = 0; i < peaks.length; i += 1) peaks[i] /= loudest;
  return peaks;
}

/**
 * The work itself, wherever it runs — the worker in the app, the test runner
 * in tests. Returns the result and the buffers that can be handed over.
 */
export function handleRequest(request: EngineRequest): { result: EngineResult; transfer: Transferable[] } {
  if (request.kind === "load") {
    const { channels } = request;
    const mono = channels.length === 1 ? channels[0] : new Float32Array(channels[0]?.length ?? 0);
    if (channels.length > 1) {
      for (const data of channels) {
        for (let i = 0; i < mono.length; i += 1) mono[i] += data[i] / channels.length;
      }
    }
    remember(request.src, mono);
    const peaks = outline(mono);
    return {
      result: { peaks, durationSec: mono.length / ANALYSIS_SAMPLE_RATE },
      transfer: [peaks.buffer],
    };
  }

  if (request.kind === "features") {
    const loaded = request.layers.map((layer) => {
      const mono = tracks.get(layer.src);
      if (!mono) throw new Error(MISSING_TRACK);
      return { mono, shift: Math.round((layer.offsetMs / 1000) * ANALYSIS_SAMPLE_RATE) };
    });
    // One unshifted file is analysed as it is; anything else is mixed first.
    const signal =
      loaded.length === 1 && loaded[0].shift === 0
        ? loaded[0].mono
        : (() => {
            const length = Math.max(0, ...loaded.map(({ mono, shift }) => mono.length + shift));
            const mix = new Float32Array(length);
            for (const { mono, shift } of loaded) {
              for (let i = Math.max(0, shift); i < length && i - shift < mono.length; i += 1) {
                mix[i] += mono[i - shift];
              }
            }
            return mix;
          })();
    const features = analyseRecording(signal);
    const transfer = [features.onset, features.onsetLow, features.onsetMid, features.onsetHigh, features.chroma]
      .filter((array): array is Float32Array => !!array)
      .map((array) => array.buffer);
    return { result: features, transfer };
  }

  return { result: autoSync(request.input), transfer: [] };
}
