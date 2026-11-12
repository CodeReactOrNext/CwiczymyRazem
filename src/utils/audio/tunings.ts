import { correctOctaveForLowStrings, getCentsDistance, midiToFrequency, midiToNoteName, STANDARD_OPEN_STRING_MIDI } from "./noteUtils";

/** Semitone offset from standard GUITAR tuning, per string. Index 0 = string 1 (high E) … index 5 = string 6 (low E).
 *  A bass is expressed the same way — its G string as string 1 sitting 21 semitones under the guitar's high E —
 *  so every consumer that turns a string + fret into a pitch (getFrequencyFromTab) needs no idea of the instrument. */
export type TuningOffsets = readonly [number, number, number, number, number, number];

export type Instrument = "guitar" | "bass";

export const INSTRUMENTS: readonly Instrument[] = ["guitar", "bass"];

export const isInstrument = (value: unknown): value is Instrument =>
  value === "guitar" || value === "bass";

export interface GuitarTuningPreset {
  id: string;
  name: string;
  /** Note names low → high, shown as a compact hint next to the name. */
  notation: string;
  offsets: TuningOffsets;
  instrument: Instrument;
  /** How many strings the instrument has — 1 … stringCount carry the offsets above, the rest are unused. */
  stringCount: number;
}

export const STANDARD_TUNING_ID = "standard";
export const BASS_STANDARD_TUNING_ID = "bass-standard";

const guitar = (id: string, name: string, notation: string, offsets: TuningOffsets): GuitarTuningPreset =>
  ({ id, name, notation, offsets, instrument: "guitar", stringCount: 6 });

export const GUITAR_TUNINGS: GuitarTuningPreset[] = [
  guitar(STANDARD_TUNING_ID, "Standard",        "E A D G B E",       [0, 0, 0, 0, 0, 0]),
  guitar("drop-d",           "Drop D",          "D A D G B E",       [0, 0, 0, 0, 0, -2]),
  guitar("half-step-down",   "Half Step Down",  "Eb Ab Db Gb Bb Eb", [-1, -1, -1, -1, -1, -1]),
  guitar("whole-step-down",  "Whole Step Down", "D G C F A D",       [-2, -2, -2, -2, -2, -2]),
  guitar("drop-c-sharp",     "Drop C#/Db",      "Db Ab Db Gb Bb Eb", [-1, -1, -1, -1, -1, -3]),
  guitar("drop-c",           "Drop C",          "C G C F A D",       [-2, -2, -2, -2, -2, -4]),
  guitar("open-d",           "Open D",          "D A D F# A D",      [-2, -2, -1, 0, 0, -2]),
  guitar("open-g",           "Open G",          "D G D G B D",       [-2, 0, 0, 0, -2, -2]),
  guitar("dadgad",           "DADGAD",          "D A D G A D",       [-2, -2, 0, 0, 0, -2]),
];

/** A bass preset from its open strings' MIDI notes, string 1 (highest) first. */
const bass = (id: string, name: string, notation: string, openMidi: readonly number[]): GuitarTuningPreset => {
  const offsets = [1, 2, 3, 4, 5, 6].map(string =>
    string <= openMidi.length ? openMidi[string - 1] - STANDARD_OPEN_STRING_MIDI[string] : 0);
  return { id, name, notation, offsets: offsets as unknown as TuningOffsets, instrument: "bass", stringCount: openMidi.length };
};

export const BASS_TUNINGS: GuitarTuningPreset[] = [
  bass(BASS_STANDARD_TUNING_ID, "Standard",        "E A D G",     [43, 38, 33, 28]),
  bass("bass-drop-d",          "Drop D",          "D A D G",     [43, 38, 33, 26]),
  bass("bass-half-step-down",  "Half Step Down",  "Eb Ab Db Gb", [42, 37, 32, 27]),
  bass("bass-whole-step-down", "Whole Step Down", "D G C F",     [41, 36, 31, 26]),
  bass("bass-drop-c",          "Drop C",          "C G C F",     [41, 36, 31, 24]),
  bass("bass-5-standard",      "5-String",        "B E A D G",   [43, 38, 33, 28, 23]),
];

const ALL_TUNINGS = [...GUITAR_TUNINGS, ...BASS_TUNINGS];

export const getTuningsFor = (instrument: Instrument): GuitarTuningPreset[] =>
  instrument === "bass" ? BASS_TUNINGS : GUITAR_TUNINGS;

export const getStandardTuningId = (instrument: Instrument): string =>
  instrument === "bass" ? BASS_STANDARD_TUNING_ID : STANDARD_TUNING_ID;

/** The preset with this id — guitar or bass — falling back to standard guitar tuning. */
export function getTuningPreset(id: string | null | undefined): GuitarTuningPreset {
  return ALL_TUNINGS.find(t => t.id === id) ?? GUITAR_TUNINGS[0];
}

export function isStandardTuning(id: string | null | undefined): boolean {
  return !id || id === STANDARD_TUNING_ID || id === BASS_STANDARD_TUNING_ID;
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
  string: number; // 1 … stringCount
  name: string;   // e.g. "D2"
  hz: number;
}

/** Reference pitch for each open string under the given tuning, lowest string first — the order the tuner/calibration wizard walks through. */
export function getTuningStrings(tuning: GuitarTuningPreset): TuningStringRef[] {
  return Array.from({ length: tuning.stringCount }, (_, i) => tuning.stringCount - i).map(string => {
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

/** Id of a tuning read from a Guitar Pro file that matches none of the presets. */
export const FILE_TUNING_ID = "file";

/** Most strings a tuning can describe — the offsets carry one slot per standard guitar string. */
const MAX_TUNED_STRINGS = 6;

const FLAT_NOTE_NAMES = ["C", "Db", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];

/**
 * The tuning a Guitar Pro track is written in, from its open strings' MIDI notes
 * (string 1 — the highest — first). The matching preset when there is one, else a
 * one-off preset under FILE_TUNING_ID. Null when the track doesn't say, or has more
 * strings than the offsets can hold (a seven-string).
 */
export function getFileTuning(
  openStringMidi: readonly number[] | undefined,
  instrument: Instrument,
): GuitarTuningPreset | null {
  const stringCount = openStringMidi?.length ?? 0;
  if (!openStringMidi || stringCount === 0 || stringCount > MAX_TUNED_STRINGS) return null;
  if (openStringMidi.some(midi => !Number.isFinite(midi))) return null;

  const offsets = [1, 2, 3, 4, 5, 6].map(string =>
    string <= stringCount ? openStringMidi[string - 1] - STANDARD_OPEN_STRING_MIDI[string] : 0);
  const preset = getTuningsFor(instrument).find(candidate =>
    candidate.stringCount === stringCount
    && candidate.offsets.every((offset, i) => i >= stringCount || offset === offsets[i]));
  if (preset) return preset;

  const notation = [...openStringMidi].reverse()
    .map(midi => FLAT_NOTE_NAMES[((midi % 12) + 12) % 12])
    .join(" ");
  return {
    id: FILE_TUNING_ID,
    name: "Custom",
    notation,
    offsets: offsets as unknown as TuningOffsets,
    instrument,
    stringCount,
  };
}

/**
 * How many semitones every string of `tuning` sits from the same string of
 * `reference` — null when the strings don't all move together, or the two aren't
 * the same instrument and string count. A whole-instrument shift is the only
 * retune that leaves a tab's frets where they are: the same shapes, the same
 * melody, just higher or lower.
 */
export function getTuningShiftFrom(reference: GuitarTuningPreset, tuning: GuitarTuningPreset): number | null {
  if (reference.instrument !== tuning.instrument || reference.stringCount !== tuning.stringCount) return null;
  const shift = tuning.offsets[0] - reference.offsets[0];
  for (let i = 1; i < reference.stringCount; i++) {
    if (tuning.offsets[i] - reference.offsets[i] !== shift) return null;
  }
  return shift;
}
