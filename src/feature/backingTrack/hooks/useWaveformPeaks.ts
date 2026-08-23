import { useEffect, useState } from "react";

/** Buckets per second of audio — the horizontal resolution of the drawn wave. */
export const PEAKS_PER_SECOND = 120;

/**
 * Lowest rate the Web Audio spec guarantees a context will accept. Decoding at
 * it is the whole trick: a full-rate stereo decode of a five-minute song is
 * ~100 MB of Float32, and none of that detail survives being drawn a hundred
 * pixels tall.
 */
const DECODE_SAMPLE_RATE = 8_000;

/**
 * Decoded peaks live past the hook that asked for them, keyed by object URL.
 * With one lane per stem the same file is often wanted in two places at once
 * (a lane and the overview map), and re-opening the screen would otherwise
 * decode everything again.
 */
const peaksCache = new Map<string, { peaks: Float32Array; durationSec: number }>();

interface WaveformPeaks {
  /** Normalised 0..1 magnitude per bucket, or null while there is nothing to show. */
  peaks: Float32Array | null;
  durationSec: number;
  isLoading: boolean;
}

/**
 * Reads a local backing track's waveform so it can be lined up against the tab
 * by eye. File source only — a YouTube video's audio lives in a cross-origin
 * iframe and cannot be read at all, which is why that source aligns by ear.
 */
export function useWaveformPeaks(src: string | null): WaveformPeaks {
  // Tagged with the source it was decoded from, so a stale waveform is never
  // shown against a newly picked track.
  const [decoded, setDecoded] = useState<{
    src: string;
    peaks: Float32Array;
    durationSec: number;
  } | null>(null);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!src || typeof window === "undefined") return;
    if (peaksCache.has(src)) return;

    let cancelled = false;

    fetch(src)
      .then((response) => response.arrayBuffer())
      .then((bytes) => {
        const OfflineCtx =
          window.OfflineAudioContext ??
          (window as unknown as { webkitOfflineAudioContext?: typeof OfflineAudioContext })
            .webkitOfflineAudioContext;
        // Rejecting here rather than bailing early keeps every outcome on the
        // promise chain, where state may be set.
        if (!OfflineCtx) throw new Error("OfflineAudioContext unavailable");
        // decodeAudioData resamples to the context's rate, so the cheap decode
        // is a property of the context, not a separate downsampling pass.
        return new OfflineCtx(1, 1, DECODE_SAMPLE_RATE).decodeAudioData(bytes);
      })
      .then((buffer) => {
        if (cancelled) return;

        const samples = buffer.getChannelData(0);
        const perBucket = Math.max(1, Math.round(buffer.sampleRate / PEAKS_PER_SECOND));
        const bucketCount = Math.ceil(samples.length / perBucket);
        const peaks = new Float32Array(bucketCount);

        let loudest = 0;
        for (let bucket = 0; bucket < bucketCount; bucket += 1) {
          const start = bucket * perBucket;
          const end = Math.min(start + perBucket, samples.length);
          let peak = 0;
          for (let i = start; i < end; i += 1) {
            const magnitude = Math.abs(samples[i]);
            if (magnitude > peak) peak = magnitude;
          }
          peaks[bucket] = peak;
          if (peak > loudest) loudest = peak;
        }

        // Normalise, so a quietly mastered track still fills the strip.
        if (loudest > 0) {
          for (let i = 0; i < peaks.length; i += 1) peaks[i] /= loudest;
        }

        peaksCache.set(src, { peaks, durationSec: buffer.duration });
        setDecoded({ src, peaks, durationSec: buffer.duration });
      })
      .catch(() => {
        if (!cancelled) setFailedSrc(src);
      });

    return () => {
      cancelled = true;
    };
  }, [src]);

  // The cache is read during render so an already-decoded stem draws on the
  // first frame instead of flashing empty for a tick.
  const cached = src ? peaksCache.get(src) : undefined;
  const ready = cached ?? (src && decoded?.src === src ? decoded : undefined);
  return {
    peaks: ready?.peaks ?? null,
    durationSec: ready?.durationSec ?? 0,
    // Waiting is simply "a source is set, but its peaks aren't here yet".
    isLoading: !!src && !ready && failedSrc !== src,
  };
}
