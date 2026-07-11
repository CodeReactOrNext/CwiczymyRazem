import { describe, expect, it } from "vitest";

import type { TablatureMeasure } from "feature/exercisePlan/types/exercise.types";

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
      "\\tempo 120 \\ts 4 4 r.8 (5.3{h} 5.2).16 0.6{x}.4 12.1{b (0 4)}.2 7.1{pm v}.4 |",
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

    expect(tablatureToAlphaTex(measures, 120)).toBe("\\tempo 120 \\ts 4 4 12.1{be (0 0 30 4 60 0)}.4 |");
  });
});
