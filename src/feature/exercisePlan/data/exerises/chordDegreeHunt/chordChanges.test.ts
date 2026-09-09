import { NOTES } from "utils/audio/noteUtils";
import { describe, expect, it } from "vitest";

import { chordDegreeHuntChangesExercise } from "./chordDegreeHuntChanges";
import { createChordChangesExercise } from "./createChordChangesExercise";

const loop = { name: "ii–V–I in C", chords: ["Dm7", "G7", "Cmaj7"] };

const makeDrill = (overrides: Partial<Parameters<typeof createChordChangesExercise>[0]> = {}) =>
  createChordChangesExercise({
    id: "test_changes",
    title: "Test — Changes",
    description: "",
    addedAt: "2026-09-09",
    difficulty: "hard",
    timeInMinutes: 5,
    progressions: [loop],
    degrees: ["3", "7"],
    barsPerChord: 2,
    metronomeSpeed: { min: 50, max: 140, recommended: 80 },
    fallbackSecondsPerChord: 6,
    instructions: [],
    tips: [],
    whyItMatters: "",
    ...overrides,
  });

/** The prompt of each of the next `count` rounds, as "chord degree" pairs. */
const walk = (exercise: ReturnType<typeof makeDrill>, count: number) =>
  Array.from({ length: count }, () => {
    const rolled = exercise.rollHuntTarget!();
    return { label: `${rolled.prompt!.title} ${rolled.prompt!.subtitle}`, rolled };
  });

describe("chord changes walk", () => {
  it("walks the progression in playing order rather than shuffling it", () => {
    const drill = makeDrill();
    const chords = walk(drill, 3).map((step) => step.rolled.prompt!.title);
    // Started somewhere in the loop, but the three that follow are consecutive.
    const start = loop.chords.indexOf(chords[0]);
    expect(start).toBeGreaterThanOrEqual(0);
    expect(chords).toEqual([0, 1, 2].map((i) => loop.chords[(start + i) % 3]));
  });

  it("keeps the same degree for a whole lap, then changes it", () => {
    const drill = makeDrill();
    // Line the walk up on the top of a lap, whatever it started on.
    while (drill.rollHuntTarget!().prompt!.title !== loop.chords[loop.chords.length - 1]) { /* seek */ }

    const lap = walk(drill, 3).map((step) => step.rolled.prompt!.subtitle);
    expect(new Set(lap).size).toBe(1);

    const nextLap = walk(drill, 3).map((step) => step.rolled.prompt!.subtitle);
    expect(new Set(nextLap).size).toBe(1);
    expect(nextLap[0]).not.toBe(lap[0]);
  });

  it("carries the loop and the player's place in it for the strip", () => {
    const drill = makeDrill();
    for (let i = 0; i < 8; i++) {
      const rolled = drill.rollHuntTarget!();
      const steps = rolled.prompt!.steps!;
      expect(steps.labels).toEqual(loop.chords);
      // The lit step is always the chord the prompt is actually asking about.
      expect(steps.labels[steps.activeIndex]).toBe(rolled.prompt!.title);
    }
  });

  // A degree one chord in the loop can't answer would strand the walk on a round
  // with no correct note, so the whole lap is dropped instead.
  it("drops a degree the whole loop can't answer", () => {
    const triads = makeDrill({
      progressions: [{ name: "pop", chords: ["C", "G", "Am", "F"] }],
      degrees: ["3", "7", "5"],
    });
    const subtitles = new Set(walk(triads, 24).map((step) => step.rolled.prompt!.subtitle));
    expect(subtitles).toEqual(new Set(["3rd", "5th"]));
  });

  it("refuses to build a drill where nothing can be asked", () => {
    expect(() =>
      makeDrill({ progressions: [{ name: "triads", chords: ["C", "G"] }], degrees: ["7"] }),
    ).toThrow(/no progression/);
  });

  it("moves to another progression once every degree has had a lap", () => {
    const second = { name: "blues", chords: ["A7", "D7"] };
    const drill = makeDrill({ progressions: [loop, second], degrees: ["3"] });
    const seen = new Set(walk(drill, 12).map((step) => step.rolled.prompt!.title));
    expect(seen.size).toBeGreaterThan(loop.chords.length);
  });
});

describe("Chords — Degree Hunt (Changes)", () => {
  it("changes on the bar line and never waits for the answer", () => {
    expect(chordDegreeHuntChangesExercise.noteHuntConfig).toEqual({
      rotateSeconds: 6,
      mode: "interval",
      advanceOn: "bar",
      advanceEveryBars: 2,
    });
    expect(chordDegreeHuntChangesExercise.disableMic).toBeUndefined();
  });

  // Bar pacing is only reachable when there is a click to lock to, so the drill
  // has to offer a tempo — and `rotateSeconds` has to stay a usable fallback for
  // a player who turns the click off.
  it("offers the click it locks to, and a fallback for when it's off", () => {
    expect(chordDegreeHuntChangesExercise.metronomeSpeed).toBeTruthy();
    expect(chordDegreeHuntChangesExercise.noteHuntConfig!.rotateSeconds).toBeGreaterThan(0);
  });

  it("answers every round with a real note", () => {
    for (let i = 0; i < 100; i++) {
      const rolled = chordDegreeHuntChangesExercise.rollHuntTarget!();
      expect(NOTES).toContain(rolled.goal);
      expect(rolled.prompt!.steps!.labels.length).toBeGreaterThan(1);
    }
  });
});
