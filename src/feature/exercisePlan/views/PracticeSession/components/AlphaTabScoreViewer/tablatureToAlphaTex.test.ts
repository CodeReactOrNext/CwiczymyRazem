import type { TablatureMeasure } from "feature/exercisePlan/types/exercise.types";
import { describe, expect, it } from "vitest";

import { tablatureToAlphaTex } from "./tablatureToAlphaTex";

describe("tablatureToAlphaTex", () => {
  it("renders plain quarter notes with tempo + time signature header", () => {
    const measures: TablatureMeasure[] = [
      {
        timeSignature: [4, 4],
        beats: [
          { duration: 1, notes: [{ string: 3, fret: 3 }] },
          { duration: 1, notes: [{ string: 2, fret: 5 }] },
        ],
      },
    ];

    // Our string numbering (1 = high E) matches alphaTex's text-syntax convention directly.
    expect(tablatureToAlphaTex(measures, 120)).toBe("\\tempo 120 \\ts 4 4 3.3.4 5.2.4 |");
  });

  it("only re-emits \\ts when the time signature actually changes", () => {
    const measures: TablatureMeasure[] = [
      { timeSignature: [4, 4], beats: [{ duration: 1, notes: [{ string: 1, fret: 0 }] }] },
      { timeSignature: [4, 4], beats: [{ duration: 1, notes: [{ string: 1, fret: 1 }] }] },
      { timeSignature: [3, 4], beats: [{ duration: 1, notes: [{ string: 1, fret: 2 }] }] },
    ];

    expect(tablatureToAlphaTex(measures, 100)).toBe(
      "\\tempo 100 \\ts 4 4 0.1.4 |\n1.1.4 |\n\\ts 3 4 2.1.4 |",
    );
  });

  it("emits a \\tempo change on measures that carry a tempoChange ratio", () => {
    const measures: TablatureMeasure[] = [
      { timeSignature: [4, 4], beats: [{ duration: 1, notes: [{ string: 1, fret: 0 }] }] },
      {
        timeSignature: [4, 4],
        tempoChange: 0.5,
        beats: [{ duration: 1, notes: [{ string: 1, fret: 0 }] }],
      },
    ];

    expect(tablatureToAlphaTex(measures, 120)).toBe("\\tempo 120 \\ts 4 4 0.1.4 |\n\\tempo 60 0.1.4 |");
  });

  it("maps rests, chords, durations and playing techniques", () => {
    const measures: TablatureMeasure[] = [
      {
        timeSignature: [4, 4],
        beats: [
          { duration: 0.5, notes: [] },
          {
            duration: 0.25,
            notes: [
              { string: 3, fret: 5, isHammerOn: true },
              { string: 2, fret: 5 },
            ],
          },
          { duration: 1, notes: [{ string: 6, fret: 0, isDead: true }] },
          { duration: 2, notes: [{ string: 1, fret: 12, isBend: true, bendSemitones: 1 }] },
          { duration: 1, notes: [{ string: 1, fret: 7, isVibrato: true, isPalmMute: true }] },
        ],
      },
    ];

    expect(tablatureToAlphaTex(measures, 120)).toBe(
      "\\tempo 120 \\ts 4 4 r.8 (5.3{h} 5.2).16 0.6{x}.4 12.1{b (0 2)}.2 7.1{pm v}.4 |",
    );
  });

  it("maps a whole-tone bend to a 2-semitone pitch shift, not 4", () => {
    // AlphaTab's bend `value` unit is half a semitone (playback shift = value / 2 semitones,
    // see MidiFileGenerator.getPitchWheel) — a whole-tone (2 semitones) bend must emit value 4,
    // NOT 8 (which would sound like a 2-tone/4-semitone bend).
    const measures: TablatureMeasure[] = [
      {
        timeSignature: [4, 4],
        beats: [{ duration: 1, notes: [{ string: 1, fret: 12, isBend: true, bendSemitones: 2 }] }],
      },
    ];

    expect(tablatureToAlphaTex(measures, 120)).toBe("\\tempo 120 \\ts 4 4 12.1{b (0 4)}.4 |");
  });

  it("maps a dotted-half-note duration (3 quarter notes) to a dotted half, not a whole note", () => {
    // 3 quarter notes = half note (base 2) * 1.5 — a dotted half. The previous
    // nearest-power-of-2 rounding picked a whole note (4 quarters), overshooting the
    // bar by 1 beat and desyncing every following measure.
    const measures: TablatureMeasure[] = [
      {
        timeSignature: [4, 4],
        beats: [
          { duration: 3, notes: [{ string: 2, fret: 7, isVibrato: true }] },
          { duration: 1, notes: [{ string: 1, fret: 0 }] },
        ],
      },
    ];

    expect(tablatureToAlphaTex(measures, 120)).toBe("\\tempo 120 \\ts 4 4 7.2{v}.2 {d} 0.1.4 |");
  });

  it("un-compresses a triplet's real sounding duration back to its notated base + {tu 3}", () => {
    // Real sounding duration of a triplet eighth is 1/3 of a quarter (3 fit in the time
    // of 2 eighths = 1 quarter). The previous conversion fed that real fraction straight
    // into the nearest-power-of-2 lookup (ignoring `tuplet` entirely), picking a
    // sixteenth note — 3 sixteenths only fill 3/4 of a quarter, not a full one, so a bar
    // of triplet-eighths silently came up short and desynced from its declared meter.
    const third = 1 / 3;
    const measures: TablatureMeasure[] = [
      {
        timeSignature: [4, 4],
        beats: [
          { duration: third, tuplet: 3, notes: [{ string: 6, fret: 5 }] },
          { duration: third, tuplet: 3, notes: [{ string: 6, fret: 7 }] },
          { duration: third, tuplet: 3, notes: [{ string: 6, fret: 5 }] },
        ],
      },
    ];

    expect(tablatureToAlphaTex(measures, 120)).toBe(
      "\\tempo 120 \\ts 4 4 5.6.8 {tu 3} 7.6.8 {tu 3} 5.6.8 {tu 3} |",
    );
  });

  it("renders a full bend curve as exact bend points", () => {
    const measures: TablatureMeasure[] = [
      {
        timeSignature: [4, 4],
        beats: [
          {
            duration: 1,
            notes: [
              {
                string: 1,
                fret: 12,
                bendCurve: [
                  { position: 0, cents: 0 },
                  { position: 0.5, cents: 100 },
                  { position: 1, cents: 0 },
                ],
              },
            ],
          },
        ],
      },
    ];

    expect(tablatureToAlphaTex(measures, 120)).toBe("\\tempo 120 \\ts 4 4 12.1{be (0 0 30 2 60 0)}.4 |");
  });
});
