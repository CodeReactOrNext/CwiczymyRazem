import { computeClickTargets } from "feature/exercisePlan/views/PracticeSession/helpers/clickTargets";
import { NOTES } from "utils/audio/noteUtils";
import { describe, expect, it } from "vitest";

import { intervalClickBox04Exercise } from "./intervalClickBox04";
import { intervalClickBox59Exercise } from "./intervalClickBox59";
import { intervalClickBox812Exercise } from "./intervalClickBox812";
import { intervalClickSprintExercise } from "./intervalClickSprint";

const exercises = [
  intervalClickBox04Exercise,
  intervalClickBox59Exercise,
  intervalClickBox812Exercise,
  intervalClickSprintExercise,
];

describe("interval click drills", () => {
  it.each(exercises.map((e) => [e.title, e] as const))("%s is a click-answered interval drill", (_title, exercise) => {
    expect(exercise.noteHuntConfig?.mode).toBe("intervalClick");
    expect(exercise.disableMic).toBe(true);
    // The prompt carries the root; the answer stays hidden in customGoal.
    expect(exercise.customGoalPrompt?.title).toBeTruthy();
    expect(exercise.customGoal).toBeTruthy();
    expect(exercise.customGoalRegion).toBeDefined();
  });

  // Every round asks for two full sets of cells. If a window held no position of
  // some note, that round would be unwinnable — and since the roll is random, it
  // would only show up for players, never in review.
  it.each(exercises.map((e) => [e.title, e] as const))("%s can answer every note in its window", (_title, exercise) => {
    const { startFret, endFret } = exercise.customGoalRegion!;
    for (const note of NOTES) {
      const positions = computeClickTargets(note, startFret, endFret, exercise.customGoalStrings);
      expect(positions.length).toBeGreaterThan(0);
    }
  });

  it.each(exercises.map((e) => [e.title, e] as const))("%s rolls a fresh, solvable prompt", (_title, exercise) => {
    const rolled = exercise.rollHuntTarget!();
    expect(rolled.prompt?.title).toBeTruthy();
    expect(rolled.prompt?.subtitle).toBeTruthy();
    // The region has to come back with the roll: the session reads the window off
    // the rolled target, and an undefined one silently falls back to frets 0–12.
    expect(rolled.region).toEqual(exercise.customGoalRegion);
    // Root and answer are different notes — an interval that lands back on the
    // root would make step 2 a repeat of step 1.
    expect(rolled.goal).not.toBe(rolled.prompt!.title);
  });

  it("never repeats the same root+interval pair twice in a row", () => {
    const seen: string[] = [];
    for (let i = 0; i < 40; i++) {
      const rolled = intervalClickBox04Exercise.rollHuntTarget!();
      seen.push(`${rolled.prompt!.title}-${rolled.prompt!.subtitle}`);
    }
    for (let i = 1; i < seen.length; i++) expect(seen[i]).not.toBe(seen[i - 1]);
  });
});
