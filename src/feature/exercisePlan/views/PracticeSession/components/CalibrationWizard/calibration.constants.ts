import type { GuitarTuningPreset } from "utils/audio/tunings";
import { getTuningStrings } from "utils/audio/tunings";

export type GuitarString = { id: number; name: string; hz: number };

export const STRINGS: GuitarString[] = [
  { id: 6, name: "E2", hz: 82.41  },
  { id: 5, name: "A2", hz: 110.0  },
  { id: 4, name: "D3", hz: 146.83 },
  { id: 3, name: "G3", hz: 196.0  },
  { id: 2, name: "B3", hz: 246.94 },
  { id: 1, name: "E4", hz: 329.63 },
];

/** Reference pitches for the tuning step, low string first — follows the selected guitar tuning. */
export function buildStringRefs(tuning: GuitarTuningPreset): GuitarString[] {
  return getTuningStrings(tuning).map(s => ({ id: s.string, name: s.name, hz: s.hz }));
}

export const MIN_SAMPLES   = 8;
export const ACCEPT_CENTS  = 250;
export const STALE_MS      = 2000;

export function median(arr: number[]): number {
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

