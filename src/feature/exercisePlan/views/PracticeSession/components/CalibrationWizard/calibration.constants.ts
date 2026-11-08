import { midiToFrequency, midiToNoteName } from "utils/audio/noteUtils";
import type { GuitarTuningPreset } from "utils/audio/tunings";
import { getTuningStrings } from "utils/audio/tunings";

export type GuitarString = { id: number; name: string; hz: number };

/** Reference pitches for the tuning step, low string first — follows the selected guitar tuning. */
export function buildStringRefs(tuning: GuitarTuningPreset): GuitarString[] {
  return getTuningStrings(tuning).map(s => ({ id: s.string, name: s.name, hz: s.hz }));
}

/** Fret the sustain test is played on — fretted, so it decays like a real note. */
export const SUSTAIN_TEST_FRET = 5;

/**
 * The note the sustain test asks for: the 5th string at the 5th fret (D3 in
 * standard tuning) — or, with no 5th string (a 4-string bass), the second
 * lowest one.
 */
export function sustainTestTarget(strings: GuitarString[]) {
  const string = strings.find(s => s.id === 5) ?? strings[1] ?? strings[0];
  const midi = Math.round(69 + 12 * Math.log2(string.hz / 440)) + SUSTAIN_TEST_FRET;
  return { name: midiToNoteName(midi), hz: midiToFrequency(midi), string: string.id, fret: SUSTAIN_TEST_FRET };
}
