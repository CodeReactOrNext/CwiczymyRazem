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
          { duration: 0.25, notes: [{ string: 1, fret: 7, isVibrato: true, isPalmMute: true }] },
        ],
      },
    ];

    // The isHammerOn note has no preceding same-string note to slur *from*, so no `h` is
    // emitted (AlphaTab would drop a dangling origin anyway). The origin-placement case is
    // covered on its own below.
    expect(tablatureToAlphaTex(measures, 120)).toBe(
      "\\tempo 120 \\ts 4 4 r.8 (5.3 5.2).16 0.6{x}.4 12.1{b (0 2)}.2 7.1{pm v}.16 |",
    );
  });

  it("puts the hammer/pull slur on the origin note, not the flagged destination", () => {
    // Our model flags the *destination* of a hammer/pull (the note reached by the
    // technique); alphaTex's `h` marks the *origin* and AlphaTab slurs it forward to the
    // next same-string note. So each flagged arrival note must move its `h` back onto the
    // previous note on the same string. Emitting `h` on the destination instead made
    // AlphaTab slur it to the next picked note, drawing a stray arc across the whole bar
    // (the "Dark Pull-off Pentatonic Run" legato bug).
    const measures: TablatureMeasure[] = [
      {
        timeSignature: [4, 4],
        beats: [
          { duration: 0.5, notes: [{ string: 3, fret: 7 }] },
          { duration: 0.5, notes: [{ string: 3, fret: 5, isPullOff: true }] },
          { duration: 0.5, notes: [{ string: 4, fret: 7 }] },
          { duration: 0.5, notes: [{ string: 4, fret: 5, isPullOff: true }] },
        ],
      },
    ];

    // `h` lands on each fret-7 origin; the fret-5 destinations stay bare, so no slur
    // leaks across the string change or into the next bar.
    expect(tablatureToAlphaTex(measures, 120)).toBe(
      "\\tempo 120 \\ts 4 4 7.3{h}.8 5.3.8 7.4{h}.8 5.4.8 |",
    );
  });

  it("chains `h` across a same-string legato run (pick, hammer, hammer)", () => {
    // 5→7→8 all on one string: the slur origins are the 5 and the 7 (each is the note the
    // next arrival hammers off), while the final 8 carries nothing.
    const measures: TablatureMeasure[] = [
      {
        timeSignature: [4, 4],
        beats: [
          { duration: 0.25, notes: [{ string: 6, fret: 5 }] },
          { duration: 0.25, notes: [{ string: 6, fret: 7, isHammerOn: true }] },
          { duration: 0.25, notes: [{ string: 6, fret: 8, isHammerOn: true }] },
        ],
      },
    ];

    expect(tablatureToAlphaTex(measures, 120)).toBe(
      "\\tempo 120 \\ts 4 4 5.6{h}.16 7.6{h}.16 8.6.16 |",
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

  it("widens a measure's emitted time signature when its beats exceed the declared capacity (#741)", () => {
    // Some shipped exercise data crammed a whole phrase (e.g. 16 eighth notes = 8 quarter
    // notes) into a single TablatureMeasure still declared as 4/4 (capacity 4). Emitting
    // that as one \ts 4 4 bar would silently print more notated length than the bar can
    // hold — instead of splitting it into extra bars or padding it, widen the *emitted*
    // \ts to match the real total (mirrors how the broken exercise data itself was fixed:
    // by correcting timeSignature, not by restructuring beats).
    const measures: TablatureMeasure[] = [
      {
        timeSignature: [4, 4],
        beats: [1, 2, 3, 4, 5, 6].map((fret) => ({ duration: 1, notes: [{ string: 6, fret }] })),
      },
    ];

    expect(tablatureToAlphaTex(measures, 120)).toBe(
      "\\tempo 120 \\ts 6 4 1.6.4 2.6.4 3.6.4 4.6.4 5.6.4 6.6.4 |",
    );
  });

  it("re-emits \\ts once a widened bar is followed by a measure back at its declared meter", () => {
    const measures: TablatureMeasure[] = [
      {
        timeSignature: [4, 4],
        beats: [1, 2, 3, 4, 5, 6].map((fret) => ({ duration: 1, notes: [{ string: 6, fret }] })),
      },
      { timeSignature: [4, 4], beats: [{ duration: 4, notes: [{ string: 6, fret: 0 }] }] },
    ];

    expect(tablatureToAlphaTex(measures, 120)).toBe(
      "\\tempo 120 \\ts 6 4 1.6.4 2.6.4 3.6.4 4.6.4 5.6.4 6.6.4 |\n\\ts 4 4 0.6.1 |",
    );
  });

  it("leaves an under-filled measure alone — a short bar isn't padded or widened", () => {
    const measures: TablatureMeasure[] = [
      { timeSignature: [4, 4], beats: [{ duration: 1, notes: [{ string: 1, fret: 0 }] }] },
    ];

    expect(tablatureToAlphaTex(measures, 120)).toBe("\\tempo 120 \\ts 4 4 0.1.4 |");
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
