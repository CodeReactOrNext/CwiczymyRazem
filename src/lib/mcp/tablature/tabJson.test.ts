import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import type { TablatureMeasure } from "feature/exercisePlan/types/exercise.types";
import { describe, expect, it } from "vitest";

import {
  checkTab,
  measuresToTab,
  renderAsciiTab,
  type TabJson,
  tabSchema,
  tabToMeasures,
} from "./tabJson";
import { isPlayableDuration, TAB_LIMITS } from "./validateTablature";

const FLAGS = [
  "isHammerOn",
  "isPullOff",
  "isTap",
  "isVibrato",
  "isPalmMute",
  "isLetRing",
  "isStaccato",
  "isAccented",
  "isGhost",
  "isDead",
  "isPreBend",
  "isRelease",
] as const;

/** What of a stored tab this format carries — the part a round trip must keep. */
const playable = (measures: TablatureMeasure[]) =>
  measures.map((measure) => ({
    timeSignature: measure.timeSignature,
    beats: measure.beats.map((beat) => ({
      duration: Math.round(beat.duration * 1000) / 1000,
      // A triplet stored by its length alone comes back marked as one.
      tuplet: beat.tuplet ?? (isPlayableDuration(beat.duration) ? null : 3),
      pick: beat.pickStroke ?? null,
      chord: beat.chordName ?? null,
      notes: (beat.notes ?? []).map((note) => ({
        string: note.string,
        fret: note.fret,
        flags: FLAGS.filter((flag) => note[flag]),
        bent: !!(note.isBend || note.isPreBend || note.isRelease),
        slideIn: note.slideIn || null,
        slideOut: note.slideOut ? Math.min(note.slideOut, 2) : null,
        harmonic: note.harmonicType || null,
      })),
    })),
  }));

describe("measuresToTab ↔ tabToMeasures", () => {
  const withTabs = exercisesAgregat.filter((e) => e.tablature?.length);

  it("carries every library tab there and back without changing what's played", () => {
    expect(withTabs.length).toBeGreaterThan(20);
    for (const exercise of withTabs) {
      const tab = measuresToTab(exercise.tablature!);
      const back = tabToMeasures(tab);
      expect(back.issues, exercise.id).toEqual([]);
      expect(playable(back.measures), exercise.id).toEqual(
        playable(exercise.tablature!),
      );
    }
  });

  it("writes every library tab in a shape the input schema accepts", () => {
    for (const exercise of withTabs) {
      if (exercise.tablature!.length > TAB_LIMITS.maxMeasures) continue;
      const parsed = tabSchema.safeParse(measuresToTab(exercise.tablature!));
      expect(parsed.success, exercise.id).toBe(true);
    }
  });
});

describe("tabToMeasures", () => {
  const beat = (extra: object) => ({
    duration: "quarter" as const,
    notes: [{ string: 3, fret: 5 }],
    ...extra,
  });

  it("turns note values, dots and tuplets into sounding lengths", () => {
    const { measures, issues } = tabToMeasures({
      timeSignature: "6/8",
      measures: [
        {
          beats: [
            beat({ duration: "quarter", dots: 1 }),
            beat({ duration: "eighth", tuplet: 3 }),
            beat({ duration: "eighth", tuplet: 3 }),
            beat({ duration: "eighth", tuplet: 3 }),
            beat({ duration: "quarter", rest: true, notes: undefined }),
          ],
        },
      ],
    });
    expect(issues).toEqual([]);
    expect(measures[0].timeSignature).toEqual([6, 8]);
    expect(measures[0].beats.map((b) => b.duration)).toEqual([
      1.5,
      1 / 3,
      1 / 3,
      1 / 3,
      1,
    ]);
    expect(measures[0].beats[1].tuplet).toBe(3);
    expect(measures[0].beats[4].notes).toEqual([]);
  });

  it("names techniques and bends the way the app stores them", () => {
    const { measures } = tabToMeasures({
      measures: [
        {
          beats: [
            {
              duration: "whole",
              notes: [
                {
                  string: 2,
                  fret: 8,
                  techniques: ["hammer-on", "palm-mute"],
                  bend: { semitones: 2, release: true },
                  slideIn: "from-above",
                  harmonic: "pinch",
                },
              ],
            },
          ],
        },
      ],
    });
    expect(measures[0].beats[0].notes[0]).toEqual({
      string: 2,
      fret: 8,
      isHammerOn: true,
      isPalmMute: true,
      isBend: true,
      bendSemitones: 2,
      isRelease: true,
      slideIn: 2,
      harmonicType: 4,
    });
  });

  it("keeps a measure's time signature until another measure changes it", () => {
    const quarters = (count: number) =>
      Array.from({ length: count }, () => beat({}));
    const { measures } = tabToMeasures({
      measures: [
        { beats: quarters(4) },
        { timeSignature: "3/4", beats: quarters(3) },
        { beats: quarters(3) },
      ],
    });
    expect(measures.map((m) => m.timeSignature)).toEqual([
      [4, 4],
      [3, 4],
      [3, 4],
    ]);
  });

  it("says where a beat is neither notes nor a rest, or both", () => {
    const tab: TabJson = {
      measures: [
        {
          beats: [
            beat({ rest: true }),
            { duration: "quarter" },
            beat({ tuplet: 4 }),
            beat({}),
          ],
        },
      ],
    };
    const { validation } = checkTab(tab);
    expect(validation.ok).toBe(false);
    expect(validation.errors.slice(0, 3)).toEqual([
      {
        measure: 1,
        beat: 1,
        message: "a beat is either a rest or notes, not both",
      },
      { measure: 1, beat: 2, message: 'a beat needs notes, or "rest": true' },
      {
        measure: 1,
        beat: 3,
        message: expect.stringMatching(/^tuplet 4 isn't supported/),
      },
    ]);
  });

  it("refuses arguments the format doesn't have", () => {
    const misspelt = {
      measures: [
        {
          beats: [
            {
              duration: "quarter",
              notes: [{ string: 1, fret: 0, hammer: true }],
            },
          ],
        },
      ],
    };
    expect(tabSchema.safeParse(misspelt).success).toBe(false);
  });
});

describe("renderAsciiTab", () => {
  it("draws strings top to bottom from the high e, with chords and a legend", () => {
    const { measures } = tabToMeasures({
      measures: [
        {
          beats: [
            { duration: "quarter", notes: [{ string: 3, fret: 5 }] },
            {
              duration: "quarter",
              notes: [{ string: 3, fret: 7, techniques: ["hammer-on"] }],
            },
            {
              duration: "half",
              chord: "Am",
              notes: [
                { string: 1, fret: 0 },
                { string: 2, fret: 1 },
                { string: 3, fret: 2 },
                { string: 4, fret: 2 },
                { string: 5, fret: 0 },
              ],
            },
          ],
        },
      ],
    });
    expect(renderAsciiTab(measures)).toBe(
      [
        "        Am",
        "e|------0-|",
        "B|------1-|",
        "G|-5-h7-2-|",
        "D|------2-|",
        "A|------0-|",
        "E|--------|",
        "",
        "h hammer-on",
      ].join("\n"),
    );
  });

  it("names a bass's four strings", () => {
    const { measures } = tabToMeasures({
      measures: [
        { beats: [{ duration: "whole", notes: [{ string: 4, fret: 0 }] }] },
      ],
    });
    expect(renderAsciiTab(measures, "bass").split("\n")).toEqual([
      "G|---|",
      "D|---|",
      "A|---|",
      "E|-0-|",
    ]);
  });
});
