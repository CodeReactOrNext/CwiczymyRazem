import { midiToFrequency, NOTES, STANDARD_OPEN_STRING_MIDI } from "./noteUtils";

/** Semitone offset from standard tuning, per string. Index 0 = string 1 (high E) … index 5 = string 6 (low E). */
export type TuningOffsets = readonly [number, number, number, number, number, number];

export interface GuitarTuningPreset {
  id: string;
  name: string;
  /** Note names low → high, shown as a compact hint next to the name. */
  notation: string;
  offsets: TuningOffsets;
}

export const STANDARD_TUNING_ID = "standard";

export const GUITAR_TUNINGS: GuitarTuningPreset[] = [
  { id: STANDARD_TUNING_ID, name: "Standard",           notation: "E A D G B E",       offsets: [0, 0, 0, 0, 0, 0] },
  { id: "drop-d",           name: "Drop D",              notation: "D A D G B E",       offsets: [0, 0, 0, 0, 0, -2] },
  { id: "half-step-down",   name: "Half Step Down",      notation: "Eb Ab Db Gb Bb Eb", offsets: [-1, -1, -1, -1, -1, -1] },
  { id: "whole-step-down",  name: "Whole Step Down",     notation: "D G C F A D",       offsets: [-2, -2, -2, -2, -2, -2] },
  { id: "drop-c-sharp",     name: "Drop C#/Db",          notation: "Db Ab Db Gb Bb Eb", offsets: [-1, -1, -1, -1, -1, -3] },
  { id: "drop-c",           name: "Drop C",              notation: "C G C F A D",       offsets: [-2, -2, -2, -2, -2, -4] },
  { id: "open-d",           name: "Open D",              notation: "D A D F# A D",      offsets: [-2, -2, -1, 0, 0, -2] },
  { id: "open-g",           name: "Open G",              notation: "D G D G B D",       offsets: [-2, 0, 0, 0, -2, -2] },
  { id: "dadgad",           name: "DADGAD",              notation: "D A D G A D",       offsets: [-2, -2, 0, 0, 0, -2] },
];

export function getTuningPreset(id: string | null | undefined): GuitarTuningPreset {
  return GUITAR_TUNINGS.find(t => t.id === id) ?? GUITAR_TUNINGS[0];
}

export function isStandardTuning(id: string | null | undefined): boolean {
  return !id || id === STANDARD_TUNING_ID;
}

export interface TuningStringRef {
  string: number; // 1-6
  name: string;   // e.g. "D2"
  hz: number;
}

function midiToNoteName(midi: number): string {
  const name = NOTES[((midi % 12) + 12) % 12];
  const octave = Math.floor(midi / 12) - 1;
  return `${name}${octave}`;
}

/** Reference pitch for each open string under the given tuning, low string (6) first — the order the tuner/calibration wizard walks through. */
export function getTuningStrings(tuning: GuitarTuningPreset): TuningStringRef[] {
  return [6, 5, 4, 3, 2, 1].map(string => {
    const midi = STANDARD_OPEN_STRING_MIDI[string] + tuning.offsets[string - 1];
    return { string, name: midiToNoteName(midi), hz: midiToFrequency(midi) };
  });
}
