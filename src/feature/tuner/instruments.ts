import { midiToFrequency, midiToNoteName } from "utils/audio/noteUtils";
import type { TuningStringRef } from "utils/audio/tunings";

/**
 * Instrument catalogue for the standalone tuner at /tools/tuner.
 *
 * The practice session tunes against `utils/audio/tunings`, which models a
 * tuning as six semitone offsets from standard because everything downstream
 * (tab → frequency, note matching) is anchored to a six-string guitar. A public
 * tuner has no such anchor — it also has to cover bass, ukulele, mandolin and
 * banjo — so tunings here are declared as an explicit list of MIDI notes,
 * physical string order, and the note names and frequencies are derived.
 */

export interface TunerTuning {
  id: string;
  name: string;
  /** Compact note hint shown next to the name, e.g. "D A D G B E". */
  notation: string;
  /** MIDI note of each open string, in physical order: highest-numbered string
   *  (the thick 6th on a guitar, the short 5th on a banjo) first. That is
   *  usually also lowest-pitched first, but not on re-entrant instruments. */
  midi: readonly number[];
}

export interface TunerInstrument {
  id: string;
  name: string;
  /** Compact label for the picker, where "Bass (4-string)" would not fit. */
  shortName: string;
  /** Plural, used in copy: "Pick the string you are tuning". */
  stringCount: number;
  tunings: TunerTuning[];
}

const GUITAR_TUNINGS: TunerTuning[] = [
  {
    id: "standard",
    name: "Standard",
    notation: "E A D G B E",
    midi: [40, 45, 50, 55, 59, 64],
  },
  {
    id: "drop-d",
    name: "Drop D",
    notation: "D A D G B E",
    midi: [38, 45, 50, 55, 59, 64],
  },
  {
    id: "half-step-down",
    name: "Half Step Down",
    notation: "Eb Ab Db Gb Bb Eb",
    midi: [39, 44, 49, 54, 58, 63],
  },
  {
    id: "whole-step-down",
    name: "Whole Step Down",
    notation: "D G C F A D",
    midi: [38, 43, 48, 53, 57, 62],
  },
  {
    id: "drop-c-sharp",
    name: "Drop C#",
    notation: "Db Ab Db Gb Bb Eb",
    midi: [37, 44, 49, 54, 58, 63],
  },
  {
    id: "drop-c",
    name: "Drop C",
    notation: "C G C F A D",
    midi: [36, 43, 48, 53, 57, 62],
  },
  {
    id: "drop-b",
    name: "Drop B",
    notation: "B F# B E G# C#",
    midi: [35, 42, 47, 52, 56, 61],
  },
  {
    id: "open-g",
    name: "Open G",
    notation: "D G D G B D",
    midi: [38, 43, 50, 55, 59, 62],
  },
  {
    id: "open-d",
    name: "Open D",
    notation: "D A D F# A D",
    midi: [38, 45, 50, 54, 57, 62],
  },
  {
    id: "open-e",
    name: "Open E",
    notation: "E B E G# B E",
    midi: [40, 47, 52, 56, 59, 64],
  },
  {
    id: "open-c",
    name: "Open C",
    notation: "C G C G C E",
    midi: [36, 43, 48, 55, 60, 64],
  },
  {
    id: "dadgad",
    name: "DADGAD",
    notation: "D A D G A D",
    midi: [38, 45, 50, 55, 57, 62],
  },
];

export const TUNER_INSTRUMENTS: TunerInstrument[] = [
  {
    id: "electric-guitar",
    name: "Electric guitar",
    shortName: "Electric guitar",
    stringCount: 6,
    tunings: GUITAR_TUNINGS,
  },
  {
    id: "acoustic-guitar",
    name: "Acoustic guitar",
    shortName: "Acoustic guitar",
    stringCount: 6,
    tunings: GUITAR_TUNINGS,
  },
  {
    id: "guitar-7",
    name: "7-string guitar",
    shortName: "7-string",
    stringCount: 7,
    tunings: [
      {
        id: "standard-7",
        name: "Standard 7-string",
        notation: "B E A D G B E",
        midi: [35, 40, 45, 50, 55, 59, 64],
      },
      {
        id: "drop-a",
        name: "Drop A",
        notation: "A E A D G B E",
        midi: [33, 40, 45, 50, 55, 59, 64],
      },
      {
        id: "half-step-down-7",
        name: "Half Step Down",
        notation: "Bb Eb Ab Db Gb Bb Eb",
        midi: [34, 39, 44, 49, 54, 58, 63],
      },
    ],
  },
  {
    id: "bass",
    name: "Bass (4-string)",
    shortName: "Bass",
    stringCount: 4,
    tunings: [
      {
        id: "standard",
        name: "Standard",
        notation: "E A D G",
        midi: [28, 33, 38, 43],
      },
      {
        id: "drop-d",
        name: "Drop D",
        notation: "D A D G",
        midi: [26, 33, 38, 43],
      },
      {
        id: "half-step-down",
        name: "Half Step Down",
        notation: "Eb Ab Db Gb",
        midi: [27, 32, 37, 42],
      },
      {
        id: "whole-step-down",
        name: "Whole Step Down",
        notation: "D G C F",
        midi: [26, 31, 36, 41],
      },
    ],
  },
  {
    id: "bass-5",
    name: "Bass (5-string)",
    shortName: "5-string bass",
    stringCount: 5,
    tunings: [
      {
        id: "standard-5",
        name: "Standard 5-string",
        notation: "B E A D G",
        midi: [23, 28, 33, 38, 43],
      },
      {
        id: "drop-a-5",
        name: "Drop A",
        notation: "A E A D G",
        midi: [21, 28, 33, 38, 43],
      },
    ],
  },
  {
    id: "ukulele",
    name: "Ukulele",
    shortName: "Ukulele",
    stringCount: 4,
    tunings: [
      {
        id: "standard",
        name: "Standard (re-entrant)",
        notation: "G C E A",
        midi: [67, 60, 64, 69],
      },
      {
        id: "low-g",
        name: "Low G",
        notation: "G C E A",
        midi: [55, 60, 64, 69],
      },
      {
        id: "baritone",
        name: "Baritone",
        notation: "D G B E",
        midi: [50, 55, 59, 64],
      },
      {
        id: "d-tuning",
        name: "D tuning",
        notation: "A D F# B",
        midi: [69, 62, 66, 71],
      },
    ],
  },
  {
    id: "mandolin",
    name: "Mandolin",
    shortName: "Mandolin",
    stringCount: 4,
    tunings: [
      {
        id: "standard",
        name: "Standard",
        notation: "G D A E",
        midi: [55, 62, 69, 76],
      },
    ],
  },
  {
    id: "banjo",
    name: "Banjo (5-string)",
    shortName: "Banjo",
    stringCount: 5,
    tunings: [
      {
        id: "open-g",
        name: "Open G",
        notation: "g D G B D",
        midi: [67, 50, 55, 59, 62],
      },
      {
        id: "double-c",
        name: "Double C",
        notation: "g C G C D",
        midi: [67, 48, 55, 60, 62],
      },
    ],
  },
];

export const DEFAULT_INSTRUMENT_ID = "electric-guitar";
export const DEFAULT_TUNING_ID = "standard";

export function getInstrument(id: string | null | undefined): TunerInstrument {
  return (
    TUNER_INSTRUMENTS.find((instrument) => instrument.id === id) ?? TUNER_INSTRUMENTS[0]
  );
}

export function getTuning(
  instrument: TunerInstrument,
  id: string | null | undefined,
): TunerTuning {
  return instrument.tunings.find((tuning) => tuning.id === id) ?? instrument.tunings[0];
}

/**
 * Open-string reference pitches for a tuning, in the order they are declared.
 * String numbers count down from there, matching how players number them: on a
 * guitar the thick E is string 6 and the thin E is string 1, and on a ukulele
 * the re-entrant high G is still string 4.
 */
export function getTunerStrings(tuning: TunerTuning): TuningStringRef[] {
  const count = tuning.midi.length;
  return tuning.midi.map((midi, index) => ({
    string: count - index,
    name: midiToNoteName(midi),
    hz: midiToFrequency(midi),
  }));
}
