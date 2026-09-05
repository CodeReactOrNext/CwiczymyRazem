import { deriveMetronomeGrid } from "feature/exercisePlan/components/Metronome/utils/meterGrid";
import { describe, expect, it } from "vitest";

import { accentIndexes, buildMeterBar, buildMeterTablature } from "./createMeterSwitchExercise";
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

describe("the click grid the tab gives these drills", () => {
  // The drills carry no metronomeGrid of their own: the session reads the meter
  // off the tablature (see deriveMetronomeGrid), which is what keeps one rule for
  // the click across every exercise in the app rather than a hand-made grid here
  // and a derived one everywhere else.
  it.each(allExercises.map((exercise) => [exercise.id, exercise] as const))(
    "%s — declares no grid of its own",
    (_id, exercise) => {
      expect(exercise.metronomeGrid).toBeUndefined();
    },
  );

  it.each(allExercises.map((exercise) => [exercise.id, exercise] as const))(
    "%s — the derived grid divides the drill's pair of bars evenly",
    (_id, exercise) => {
      const grid = deriveMetronomeGrid(exercise.tablature)!;
      const gridQuarters = grid.pattern.length * (grid.unit === 8 ? 0.5 : 1);
      const pairQuarters = exercise
        .tablature!.slice(0, 2)
        .reduce((sum, m) => sum + m.beats.reduce((bar, beat) => bar + beat.duration, 0), 0);

      // Usually the grid IS the pair. The two regroup drills are the exception:
      // both their bars are the same time signature (7/8 against 7/8), so the
      // cycle is one bar and the pair is two of it. Either way the click has to
      // come back around on a bar line, or it restarts its accents mid-bar and
      // walks away from the tab from there.
      expect(pairQuarters % gridQuarters).toBeCloseTo(0, 5);
    },
  );

  it("clicks a steady bar for the regroup drills, whose two bars share a meter", () => {
    // 2+2+3 against 3+2+2 is one time signature written twice, and a time
    // signature is all the click can read — so the regrouping is the player's to
    // play against a level 7/8, not something the metronome spells out.
    expect(deriveMetronomeGrid(meterRegroup78Exercise.tablature)).toEqual({
      unit: 8,
      pattern: [2, 1, 1, 1, 1, 1, 1],
      barLengths: [7],
      label: "7/8",
    });
  });

  it.each(allExercises.map((exercise) => [exercise.id, exercise] as const))(
    "%s — accents nothing but the first beat of each bar",
    (_id, exercise) => {
      const grid = deriveMetronomeGrid(exercise.tablature)!;
      const accentAt = grid.pattern.flatMap((level, index) => (level === 2 ? [index] : []));

      // One accent per bar, on its opening entry — the bar lines and nothing else.
      const barStarts: number[] = [];
      let offset = 0;
      for (const length of grid.barLengths) {
        barStarts.push(offset);
        offset += length;
      }
      expect(accentAt).toEqual(barStarts);
    },
  );

  it("clicks 4/4 in quarters and 6/8 in eighths, in the same pattern", () => {
    // The pair the player sees as "4/4 ↔ 6/8": four clicks then six, one accent
    // each, with the 4/4 bar's off-eighths resting so it still sounds in quarters.
    expect(deriveMetronomeGrid(meterSwitch44To68PulseExercise.tablature)).toEqual({
      unit: 8,
      pattern: [2, 0, 1, 0, 1, 0, 1, 0, 2, 1, 1, 1, 1, 1],
      barLengths: [8, 6],
      label: "4/4 ↔ 6/8",
    });
  });

  it("spells out the 12/8 pair the old hand-made grid had no room for", () => {
    // Twenty entries: past what the +/- control can build, which is why that limit
    // is not the one the grid is measured against.
    const grid = deriveMetronomeGrid(meterSwitch128To44Exercise.tablature);

    expect(grid?.barLengths).toEqual([12, 8]);
    expect(grid?.label).toBe("12/8 ↔ 4/4");
  });
});
