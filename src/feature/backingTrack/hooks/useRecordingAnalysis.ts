import { useEffect, useMemo, useState } from "react";

import { isTrackLoaded, loadTrack, requestFeatures } from "../services/analysisClient";
import type { LoadedTrack, TrackLayer } from "../services/analysisEngine";
import { MISSING_TRACK, PEAKS_PER_SECOND } from "../services/analysisEngine";
import type { RecordingFeatures } from "../utils/audioFeatures";
import { ANALYSIS_SAMPLE_RATE } from "../utils/audioFeatures";

export { PEAKS_PER_SECOND };

const MAX_FEATURE_SETS = 4;

/** The drawn outline per file — a few hundred KB, kept for the page's life. */
const outlines = new Map<string, LoadedTrack>();
const featuresCache = new Map<string, RecordingFeatures>();
const loading = new Map<string, Promise<void>>();
const analysing = new Map<string, Promise<RecordingFeatures>>();

/**
 * Files are decoded one after another, never all at once. Each decode holds
 * the compressed file, the decoder's buffer and the copy handed to the worker
 * — tens of megabytes — and several of those at the same moment is the kind
 * of spike the garbage collector answers by stopping the whole app.
 */
let decodeQueue: Promise<unknown> = Promise.resolve();

async function decodeAndLoad(src: string): Promise<void> {
  const bytes = await (await fetch(src)).arrayBuffer();
  const OfflineCtx =
    window.OfflineAudioContext ??
    (window as unknown as { webkitOfflineAudioContext?: typeof OfflineAudioContext })
      .webkitOfflineAudioContext;
  if (!OfflineCtx) throw new Error("OfflineAudioContext unavailable");
  // Decoding and resampling happen off the main thread, inside the browser.
  const buffer = await new OfflineCtx(1, 1, ANALYSIS_SAMPLE_RATE).decodeAudioData(bytes);
  // A plain copy per channel — memcpy, nothing per sample here — handed to the
  // worker outright, which does the downmix, the outline and the keeping.
  const channels: Float32Array[] = [];
  for (let channel = 0; channel < Math.min(2, buffer.numberOfChannels); channel += 1) {
    const data = new Float32Array(buffer.length);
    buffer.copyFromChannel(data, channel);
    channels.push(data);
  }
  outlines.set(src, await loadTrack(src, channels));
}

/** Makes sure the worker holds this file and its outline is drawn. */
function ensureLoaded(src: string): Promise<void> {
  if (outlines.has(src) && isTrackLoaded(src)) return Promise.resolve();
  const pending = loading.get(src);
  if (pending) return pending;
  const job = decodeQueue.then(() => decodeAndLoad(src));
  decodeQueue = job.catch(() => undefined);
  const forget = () => {
    loading.delete(src);
  };
  job.then(forget, forget);
  loading.set(src, job);
  return job;
}

/**
 * Attacks and pitch of every layer together — muted ones too, since syncing
 * reads the song, not the current mix.
 */
function analyse(layers: TrackLayer[], key: string): Promise<RecordingFeatures> {
  const ready = featuresCache.get(key);
  if (ready) return Promise.resolve(ready);
  const pending = analysing.get(key);
  if (pending) return pending;

  const job = (async () => {
    for (const layer of layers) await ensureLoaded(layer.src);
    let features: RecordingFeatures;
    try {
      features = await requestFeatures(layers);
    } catch (error) {
      // The worker let a file go (or restarted): load it again, once.
      if (!(error instanceof Error) || error.message !== MISSING_TRACK) throw error;
      for (const layer of layers) await ensureLoaded(layer.src);
      features = await requestFeatures(layers);
    }
    featuresCache.delete(key);
    featuresCache.set(key, features);
    while (featuresCache.size > MAX_FEATURE_SETS) {
      featuresCache.delete(featuresCache.keys().next().value as string);
    }
    return features;
  })();
  const forget = () => {
    analysing.delete(key);
  };
  job.then(forget, forget);
  analysing.set(key, job);
  return job;
}

/** One file under the tab, as far as its picture and its analysis go. */
export interface WaveformLayer {
  src: string | null;
  /** This file's own shift against the recording's shared timeline, in ms. */
  offsetMs: number;
  muted: boolean;
}

const trackLayersOf = (layers: WaveformLayer[]): TrackLayer[] =>
  layers.flatMap((layer) => (layer.src ? [{ src: layer.src, offsetMs: layer.offsetMs }] : []));
const keyOf = (layers: TrackLayer[]) => layers.map((layer) => `${layer.src}@${layer.offsetMs}`).join("|");

/**
 * The recording's features, analysing it now if that has not happened yet —
 * for automatic sync, which is asked for and so may start the work whatever
 * the session is doing.
 */
export function recordingFeatures(layers: WaveformLayer[]): Promise<RecordingFeatures> {
  const tracks = trackLayersOf(layers);
  if (tracks.length === 0) return Promise.reject(new Error("No recording"));
  return analyse(tracks, keyOf(tracks));
}

/**
 * Laid on top of each other bucket by bucket: the loudest layer wins, the way
 * the ear hears the drums through a quiet vocal stem.
 */
export function mixPeaks(
  layers: { peaks: Float32Array; offsetMs: number }[],
  peaksPerSecond: number,
): Float32Array | null {
  if (layers.length === 0) return null;
  if (layers.length === 1 && layers[0].offsetMs === 0) return layers[0].peaks;

  // A layer shifted later starts later on the shared axis: axis bucket i
  // plays that layer's bucket i - shift.
  const shifted = layers.map((layer) => ({
    peaks: layer.peaks,
    shift: Math.round((layer.offsetMs / 1000) * peaksPerSecond),
  }));
  const length = Math.max(0, ...shifted.map(({ peaks, shift }) => peaks.length + shift));
  const mixed = new Float32Array(length);
  for (const { peaks, shift } of shifted) {
    for (let i = Math.max(0, shift); i < length; i += 1) {
      const value = peaks[i - shift];
      if (value === undefined) break;
      if (value > mixed[i]) mixed[i] = value;
    }
  }
  return mixed;
}

export interface RecordingAnalysis {
  /** What is heard, as one outline. Muted layers drop out of it, unless
   *  everything is muted — an empty lane would only look broken. */
  peaks: Float32Array | null;
  durationSec: number;
  /** Still decoding the files for the outline. */
  isLoading: boolean;
  /** Attacks and pitch, for snapping and automatic sync. Null until ready. */
  features: RecordingFeatures | null;
  isAnalysing: boolean;
}

/**
 * Everything the editor reads off the recording. The main thread only asks
 * the browser to decode; the per-sample work all happens in the worker.
 */
export function useRecordingAnalysis(
  layers: WaveformLayer[],
  options: {
    /**
     * Whether the background analysis (attacks for snapping) may run now.
     * Held back while the session plays: it is seconds of work for a core,
     * and the music gets the machine first. The outline is drawn regardless.
     */
    analyse: boolean;
  },
): RecordingAnalysis {
  const allowAnalysis = options.analyse;
  // Bumped as work lands, so the memo below re-reads the caches.
  const [revision, setRevision] = useState(0);
  const [failed, setFailed] = useState<ReadonlySet<string>>(new Set());

  const withSource = layers.filter((layer): layer is WaveformLayer & { src: string } => !!layer.src);
  const featureKey = keyOf(trackLayersOf(layers));

  useEffect(() => {
    if (!featureKey || typeof window === "undefined") return;
    const parts = featureKey.split("|").map((part) => {
      const at = part.lastIndexOf("@");
      return { src: part.slice(0, at), offsetMs: Number(part.slice(at + 1)) };
    });
    let cancelled = false;
    const bump = () => {
      if (!cancelled) setRevision((value) => value + 1);
    };
    // Outlines first, so the lane fills in as each file lands…
    for (const { src } of parts) {
      ensureLoaded(src)
        .then(bump)
        .catch(() => {
          if (!cancelled) setFailed((previous) => new Set(previous).add(src));
        });
    }
    // …then the analysis, which waits for all of them.
    if (allowAnalysis && !featuresCache.has(featureKey)) {
      analyse(parts, featureKey)
        .then(bump)
        .catch(() => {
          if (!cancelled) setFailed((previous) => new Set(previous).add(featureKey));
        });
    }
    return () => {
      cancelled = true;
    };
  }, [featureKey, allowAnalysis]);

  const layerKey = layers.map((layer) => `${layer.src}@${layer.offsetMs}@${layer.muted}`).join("|");

  return useMemo(() => {
    const ready = layers.flatMap((layer) => {
      const loaded = layer.src ? outlines.get(layer.src) : undefined;
      return loaded ? [{ ...layer, peaks: loaded.peaks }] : [];
    });
    const audible = ready.filter((layer) => !layer.muted);
    const peaks = mixPeaks(audible.length > 0 ? audible : ready, PEAKS_PER_SECOND);
    const features = featureKey ? (featuresCache.get(featureKey) ?? null) : null;
    return {
      peaks,
      durationSec: peaks ? peaks.length / PEAKS_PER_SECOND : 0,
      isLoading: withSource.some((layer) => !outlines.has(layer.src) && !failed.has(layer.src)),
      features,
      isAnalysing: !!featureKey && !features && !failed.has(featureKey) && allowAnalysis,
    };
    // The caches are module state; `revision` is what says they moved.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layerKey, featureKey, revision, failed, allowAnalysis]);
}
