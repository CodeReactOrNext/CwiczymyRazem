import { beatsSinceStart, syncRateFor } from "feature/backingTrack/utils/backingSync";
import { createRecordingTempoMap } from "feature/backingTrack/utils/tempoMap";
import { describe, expect, it } from "vitest";

import type { TablatureMeasure } from "../../../types/exercise.types";
import { createTempoRulerFromMeasures } from "../hooks/tempoBeatClock";
import { withBackingTempo } from "./backingTempoOverlay";

/** A 4/4 bar of quarter notes, optionally carrying its own tempo already. */
const bar = (tempoChange?: number): TablatureMeasure => ({
  timeSignature: [4, 4],
  beats: [1, 1, 1, 1].map((duration) => ({ duration, notes: [] })),
  ...(tempoChange !== undefined ? { tempoChange } : {}),
});

describe("withBackingTempo", () => {
  it("leaves the measures exactly as they were when nothing is aligned", () => {
    const measures = [bar(), bar()];
    // Same identity, not just equal — a new array would re-render the cursor.
    expect(withBackingTempo(measures, null)).toBe(measures);
  });

  it("has nothing to do without measures", () => {
    expect(withBackingTempo(undefined, () => 2)).toBeUndefined();
    expect(withBackingTempo([], () => 2)).toEqual([]);
  });

  it("keeps the identity when the curve is flat at the base tempo", () => {
    const measures = [bar(), bar()];
    expect(withBackingTempo(measures, () => 1)).toBe(measures);
  });

  it("marks the bar where the band changed gear", () => {
    // Bars 1–2 as recorded, bar 3 onwards 10% slower.
    const measures = [bar(), bar(), bar(), bar()];
    const result = withBackingTempo(measures, (beat) => (beat >= 8 ? 0.9 : 1))!;

    expect(result.map((m) => m.tempoChange)).toEqual([undefined, undefined, 0.9, undefined]);
  });

  it("marks the first bar when the whole recording runs off the nominal tempo", () => {
    const result = withBackingTempo([bar(), bar()], () => 1.05)!;

    expect(result[0].tempoChange).toBeCloseTo(1.05);
    expect(result[1].tempoChange).toBeUndefined();
  });

  it("reads the curve at each bar's own beat position", () => {
    const seen: number[] = [];
    withBackingTempo([bar(), bar(), bar()], (beat) => {
      seen.push(beat);
      return 1;
    });

    expect(seen).toEqual([0, 4, 8]);
  });

  it("follows bars that are not all the same length", () => {
    const threeFour: TablatureMeasure = {
      timeSignature: [3, 4],
      beats: [1, 1, 1].map((duration) => ({ duration, notes: [] })),
    };
    const seen: number[] = [];
    withBackingTempo([threeFour, bar(), threeFour], (beat) => {
      seen.push(beat);
      return 1;
    });

    expect(seen).toEqual([0, 3, 7]);
  });

  it("drops a tempo the file came with, so the recording wins", () => {
    // A GP import's own automation would otherwise fight the aligned recording.
    const result = withBackingTempo([bar(), bar(0.5), bar()], () => 1)!;

    expect(result.map((m) => m.tempoChange)).toEqual([undefined, undefined, undefined]);
  });

  it("does not mutate the measures it was given", () => {
    const measures = [bar(), bar(0.5)];
    withBackingTempo(measures, (beat) => (beat >= 4 ? 2 : 1));

    expect(measures[0].tempoChange).toBeUndefined();
    expect(measures[1].tempoChange).toBe(0.5);
  });
});

describe("the round trip the whole session depends on", () => {
  /**
   * Bending the tab and reading it back have to be exact inverses.
   *
   * The overlay stamps the recording's curve onto the measures; the metronome
   * turns that into warped beats; the backing track reads warped beats back
   * into bars to decide where the recording should be. If those three do not
   * compose, aligning is impossible in the literal sense — every correction
   * introduces its own error, and the drift grows with the song.
   */
  const at120 = { offsetMs: 2_000, sourceBpm: 120 };

  it("puts the recording exactly where an untouched performance would be", () => {
    // Bars 3–4 took six seconds instead of four: the band dragged badly.
    const recording = createRecordingTempoMap({
      anchors: [
        { beat: 8, sec: 6 },
        { beat: 16, sec: 12 },
      ],
      ...at120,
    });
    const measures = withBackingTempo([bar(), bar(), bar(), bar(), bar(), bar()], (beat) =>
      recording.ratioAtBeat(beat),
    )!;
    const ruler = createTempoRulerFromMeasures(measures);

    const startTime = 1_000_000;
    for (const bpm of [120, 90]) {
      const rate = bpm / at120.sourceBpm;
      for (const elapsed of [0, 1, 2.5, 4, 7, 10]) {
        const beat = beatsSinceStart(startTime + elapsed * 1000, startTime, bpm, ruler);

        // Where the sync loop drives the recording to.
        expect(recording.secForBeat(beat)).toBeCloseTo(at120.offsetMs / 1000 + elapsed * rate, 6);
        // And it gets there without the rate ever moving, which is what
        // "the performance is never warped" means once it is arithmetic.
        expect(
          syncRateFor({
            effectiveBpm: bpm,
            scoreRatio: ruler.ratioAt(beat),
            recordingBpm: recording.bpmAtBeat(beat),
          }),
        ).toBeCloseTo(rate, 6);
      }
    }
  });

  it("keeps the tab's own automation honest when no recording is aligned", () => {
    // Nothing pinned, so the overlay leaves the file's tempo map alone and the
    // recording is the thing that has to bend — 0.8× for two bars.
    const measures = withBackingTempo([bar(), bar(), bar(0.8), bar(0.8)], null)!;
    const ruler = createTempoRulerFromMeasures(measures);
    const recording = createRecordingTempoMap({ anchors: [], ...at120 });

    const startTime = 1_000_000;
    // Bar 3 begins at score beat 8, which the session reaches at 4s flat.
    const beat = beatsSinceStart(startTime + 4_000, startTime, 120, ruler);
    expect(beat).toBeCloseTo(8, 6);
    expect(
      syncRateFor({
        effectiveBpm: 120,
        scoreRatio: ruler.ratioAt(beat),
        recordingBpm: recording.bpmAtBeat(beat),
      }),
    ).toBeCloseTo(0.8, 6);
  });
});
