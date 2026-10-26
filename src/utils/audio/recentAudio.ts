// The last few seconds of the raw input, kept for a reader that needs more of
// the past than one analysis window — the note-onset model (noteOnsetModel.ts)
// looks at two seconds around an attack.

/** How much the session's input keeps: the model's two-second look, and slack. */
export const RECENT_AUDIO_SECONDS = 2.5;

export interface RecentAudioSnapshot {
  /** Oldest first. A copy: the reader may keep or transfer it. */
  samples: Float32Array;
  sampleRate: number;
  /** Date.now() when the newest sample was captured. */
  endMs: number;
}

export interface RecentAudio {
  /** Appends captured samples (any block size); `endMs` is when the last one arrived. */
  push(samples: Float32Array, endMs: number): void;
  /** Everything kept, oldest first — null before anything was pushed. */
  read(): RecentAudioSnapshot | null;
}

export function createRecentAudio(sampleRate: number, seconds: number): RecentAudio {
  const ring = new Float32Array(Math.round(sampleRate * seconds));
  let written = 0;
  let endMs = 0;
  return {
    push(samples, at) {
      for (let i = Math.max(0, samples.length - ring.length); i < samples.length; i++) {
        ring[written % ring.length] = samples[i];
        written++;
      }
      endMs = at;
    },
    read() {
      if (written === 0) return null;
      const length = Math.min(written, ring.length);
      const samples = new Float32Array(length);
      const start = written - length;
      for (let i = 0; i < length; i++) samples[i] = ring[(start + i) % ring.length];
      return { samples, sampleRate, endMs };
    },
  };
}
