import { ANALYSIS_SAMPLE_RATE } from "../utils/audioFeatures";

/** A note to render: when it starts, and the MIDI pitches struck together. */
export interface SynthNote {
  sec: number;
  midi: number[];
}

/** Deterministic noise, so a failing test fails the same way every run. */
function noise(seed: number) {
  let state = seed >>> 0 || 1;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return ((state >>> 0) / 0xffffffff) * 2 - 1;
  };
}

/**
 * A plucked-ish recording: each note a short noise click (the pick) and a
 * decaying tone with two overtones, over a quiet hiss. Crude, but it has the
 * two things the analysis reads — attacks, and pitch.
 */
export function synthesize(notes: SynthNote[], durationSec: number, seed = 7): Float32Array {
  const rate = ANALYSIS_SAMPLE_RATE;
  const out = new Float32Array(Math.ceil(durationSec * rate));
  const random = noise(seed);
  for (let i = 0; i < out.length; i += 1) out[i] = random() * 0.003;

  const toneLength = Math.round(0.45 * rate);
  const clickLength = Math.round(0.006 * rate);
  for (const note of notes) {
    const start = Math.round(note.sec * rate);
    for (let i = 0; i < clickLength && start + i < out.length; i += 1) {
      if (start + i < 0) continue;
      out[start + i] += random() * 0.4 * (1 - i / clickLength);
    }
    for (const midi of note.midi) {
      const hz = 440 * 2 ** ((midi - 69) / 12);
      const gain = 0.25 / Math.max(1, note.midi.length);
      for (let i = 0; i < toneLength && start + i < out.length; i += 1) {
        if (start + i < 0) continue;
        const t = i / rate;
        const envelope = Math.exp(-t / 0.18) * Math.min(1, i / 40);
        const phase = 2 * Math.PI * hz * t;
        out[start + i] +=
          gain * envelope * (Math.sin(phase) + 0.5 * Math.sin(2 * phase) + 0.25 * Math.sin(3 * phase));
      }
    }
  }
  return out;
}
