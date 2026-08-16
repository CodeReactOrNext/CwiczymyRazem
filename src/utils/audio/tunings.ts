import { correctOctaveForLowStrings, getCentsDistance, midiToFrequency, NOTES, STANDARD_OPEN_STRING_MIDI } from "./noteUtils";

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

/**
 * A single semitone shift representing the whole tuning, valid only when every
 * string is detuned by the same amount (Standard, Half/Whole Step Down — not
 * Drop D or the other per-string alternate tunings, which have no one true shift).
 * Used by exercises that target a bare note/chord name with no string attached
 * (note hunt, chord hunt): the goal is authored as if standard-tuned, so the pitch
 * actually expected out of the strings needs shifting by the same amount a tab
 * note would be (see getFrequencyFromTab) — otherwise a half-step-down player has
 * to fret a half-step sharp of where they'd naturally play it to register a hit.
 */
export function getUniformTuningShift(offsets?: readonly number[]): number {
  if (!offsets || offsets.length === 0) return 0;
  return offsets.every(o => o === offsets[0]) ? offsets[0] : 0;
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

export interface NearestTuningString {
  /** Index into the `strings` array that was passed in. */
  index: number;
  /** Deviation from that string's reference pitch — positive = sharp, negative = flat. */
  cents: number;
}

/**
 * Snaps a detected frequency to the open string of the current tuning it is
 * closest to (in cents, so the choice is register-independent), and returns how
 * far off that reference it sits. This is what makes the tuner tuning-aware: in
 * Drop D the 6th string resolves to D2 at 0¢ rather than E2 two semitones flat.
 *
 * Octave correction is anchored per candidate string, so a 2nd-harmonic reading
 * on a low string still lands on that string instead of the one an octave up
 * (see correctOctaveForLowStrings).
 */
export function findNearestTuningString(
  frequency: number,
  strings: readonly TuningStringRef[],
): NearestTuningString {
  let index = 0;
  let cents = Infinity;
  strings.forEach((str, i) => {
    const distance = getCentsDistance(correctOctaveForLowStrings(frequency, str.hz), str.hz);
    if (Math.abs(distance) < Math.abs(cents)) {
      cents = distance;
      index = i;
    }
  });
  return { index, cents };
}
