import { describe, expect, it } from "vitest";

import { accentIndexes, buildMeterBar, buildMeterTablature, meterGridFor } from "./createMeterSwitchExercise";
import { meterRegroup78Exercise } from "./meterRegroup78";
import { meterRegroup88Exercise } from "./meterRegroup88";
import { meterSwitch34To58Exercise } from "./meterSwitch34To58";
import { meterSwitch44To68PulseExercise } from "./meterSwitch44To68Pulse";
import { meterSwitch44To78Exercise } from "./meterSwitch44To78";
import { meterSwitch54To74Exercise } from "./meterSwitch54To74";
import { meterSwitch68To34Exercise } from "./meterSwitch68To34";
import { meterSwitch128To44Exercise } from "./meterSwitch128To44";

const allExercises = [
  meterSwitch44To78Exercise,
  meterSwitch34To58Exercise,
  meterRegroup78Exercise,
  meterRegroup88Exercise,
  meterSwitch68To34Exercise,
  meterSwitch128To44Exercise,
  meterSwitch44To68PulseExercise,
  meterSwitch54To74Exercise,
];

describe("accentIndexes", () => {
  it("accents the first note of every group", () => {
    expect([...accentIndexes([2, 2, 3])]).toEqual([0, 2, 4]);
    expect([...accentIndexes([3, 2, 2])]).toEqual([0, 3, 5]);
    expect([...accentIndexes([4, 4, 4])]).toEqual([0, 4, 8]);
  });
});

describe("buildMeterBar", () => {
  const sevenEight = { timeSignature: [7, 8] as [number, number], groups: [2, 2, 3], noteDuration: 0.5 };

  it("marks the group openings and closes the bar with the ringing G–A pair", () => {
    const bar = buildMeterBar(sevenEight, "lift");
    const frets = bar.beats.map((beat) => beat.notes[0].fret);
    const accented = bar.beats.map((beat) => beat.notes[0].isAccented === true);

    expect(frets).toEqual([0, 0, 0, 0, 0, 3, 5]);
    // 2+2+3 opens groups on notes 1, 3 and 5; the last two are the seam, always accented.
    expect(accented).toEqual([true, false, true, false, true, true, true]);
    // Only the pulse notes are muted — the seam is meant to ring out.
    expect(bar.beats.map((beat) => beat.notes[0].isPalmMute === true)).toEqual([
      true, true, true, true, true, false, false,
    ]);
  });

  it("splits the final quarter into two eighths in split mode, keeping the bar length", () => {
    const bar = buildMeterBar({ timeSignature: [5, 4], groups: [3, 2], noteDuration: 1 }, "split");

    expect(bar.beats.map((beat) => beat.duration)).toEqual([1, 1, 1, 1, 0.5, 0.5]);
    expect(bar.beats.map((beat) => beat.notes[0].fret)).toEqual([0, 0, 0, 0, 3, 5]);
  });

  it("carries tuplet and tempoChange through to the measure", () => {
    const bar = buildMeterBar(
      { timeSignature: [4, 4], groups: [4, 4, 4], noteDuration: 1 / 3, tuplet: 3, tempoChange: 1.5 },
      "lift",
    );

    expect(bar.tempoChange).toBe(1.5);
    expect(bar.beats.every((beat) => beat.tuplet === 3)).toBe(true);
  });

  it("leaves tempoChange off measures that do not declare one", () => {
    expect(buildMeterBar(sevenEight, "lift").tempoChange).toBeUndefined();
  });
});

describe("buildMeterTablature", () => {
  it("alternates the two bars, one pair at a time", () => {
    const measures = buildMeterTablature(
      [
        { timeSignature: [4, 4], groups: [2, 2, 2, 2], noteDuration: 0.5 },
        { timeSignature: [7, 8], groups: [2, 2, 3], noteDuration: 0.5 },
      ],
      "lift",
      3,
    );

    expect(measures).toHaveLength(6);
    expect(measures.map((measure) => measure.timeSignature)).toEqual([
      [4, 4],
      [7, 8],
      [4, 4],
      [7, 8],
      [4, 4],
      [7, 8],
    ]);
  });
});

describe("meter switching exercises", () => {
  it.each(allExercises.map((exercise) => [exercise.id, exercise] as const))(
    "%s — every measure fills its declared time signature",
    (_id, exercise) => {
      for (const measure of exercise.tablature!) {
        const [numerator, denominator] = measure.timeSignature;
        const total = measure.beats.reduce((sum, beat) => sum + beat.duration, 0);
        expect(total).toBeCloseTo(numerator * (4 / denominator), 5);
      }
    },
  );

  it.each(allExercises.map((exercise) => [exercise.id, exercise] as const))(
    "%s — every bar ends with the two-note change signal",
    (_id, exercise) => {
      for (const measure of exercise.tablature!) {
        const tail = measure.beats.slice(-2);
        expect(tail.map((beat) => beat.notes[0].fret)).toEqual([3, 5]);
        expect(tail.every((beat) => beat.notes[0].isAccented)).toBe(true);
      }
    },
  );

  it("gives every exercise a unique id", () => {
    const ids = allExercises.map((exercise) => exercise.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("metronome grids", () => {
  it.each(allExercises.map((exercise) => [exercise.id, exercise] as const))(
    "%s — the grid measures exactly one full pair of bars",
    (_id, exercise) => {
      const grid = exercise.metronomeGrid!;
      const entryQuarters = grid.unit === 8 ? 0.5 : 1;
      const pairQuarters = exercise
        .tablature!.slice(0, 2)
        .reduce((sum, m) => sum + m.beats.reduce((bar, beat) => bar + beat.duration, 0), 0);

      // A grid shorter or longer than the pair is exactly the drift being fixed:
      // the click would restart its accents somewhere other than the bar line.
      expect(grid.pattern.length * entryQuarters).toBeCloseTo(pairQuarters, 5);
      expect(grid.pattern.length).toBeLessThanOrEqual(16);
    },
  );

  it("accents the tab's group openings and nothing else", () => {
    // 4/4 as 2+2+2+2, then 7/8 as 2+2+3. The tab also accents the last two notes of
    // each bar; the click stays out of that, or 3/4 would sound like it had four
    // accents in six eighths.
    expect(meterSwitch44To78Exercise.metronomeGrid).toEqual({
      unit: 8,
      pattern: [2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 1],
    });
    // The hemiola itself: 3+3 answered by 2+2+2 over the same six eighths.
    expect(meterSwitch68To34Exercise.metronomeGrid).toEqual({
      unit: 8,
      pattern: [2, 1, 1, 2, 1, 1, 2, 1, 2, 1, 2, 1],
    });
  });

  it("declines a shared grid when the two bars have no shared note length", () => {
    // 12/8 in eighths against 4/4 in triplet eighths: no one grid sits on both, so
    // that exercise carries a hand-written quarter grid that claims the bar lines only.
    expect(
      meterGridFor([
        { timeSignature: [12, 8], groups: [3, 3, 3, 3], noteDuration: 0.5 },
        { timeSignature: [4, 4], groups: [4, 4, 4], noteDuration: 1 / 3, tuplet: 3 },
      ]),
    ).toBeNull();
    expect(meterSwitch128To44Exercise.metronomeGrid?.unit).toBe(4);
  });
});
