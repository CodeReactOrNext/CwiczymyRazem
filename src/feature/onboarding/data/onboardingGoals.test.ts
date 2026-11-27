import { DAILY_GOAL_OPTIONS } from "constants/dailyGoal";
import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import { describe, expect, it } from "vitest";

import type { OnboardingLevel } from "../types";
import {
  DAILY_GOAL_CHOICES,
  FIRST_HUNT_DURATION_LABEL,
  FIRST_HUNT_PREVIEWS,
  FIRST_HUNT_SECONDS,
  FIRST_RIFF_DURATION_LABEL,
  FIRST_RIFF_EXERCISE_IDS,
  getFirstHuntExercise,
  getFirstHuntHref,
  getFirstRiffHref,
  LEVEL_OPTIONS,
  toFirstMinutePlan,
} from "./onboardingGoals";

const LEVELS: OnboardingLevel[] = LEVEL_OPTIONS.map((option) => option.level);

describe("LEVEL_OPTIONS", () => {
  it("asks about three levels, beginner first", () => {
    expect(LEVELS).toEqual(["new", "some", "experienced"]);
  });

  it("labels every level with a year range", () => {
    expect(LEVEL_OPTIONS.map((option) => option.years)).toEqual([
      "0–1",
      "1–3",
      "3+",
    ]);
  });
});

describe("DAILY_GOAL_CHOICES", () => {
  it("offers four goals, shortest first", () => {
    const minutes = DAILY_GOAL_CHOICES.map((choice) => choice.minutes);
    expect(minutes).toEqual([5, 15, 30, 60]);
  });

  it("only offers values Settings → Daily goal can show", () => {
    for (const { minutes } of DAILY_GOAL_CHOICES) {
      expect(DAILY_GOAL_OPTIONS).toContain(minutes);
    }
  });
});

describe("first riff", () => {
  it("labels the riff the way the session timer shows 40 s", () => {
    expect(FIRST_RIFF_DURATION_LABEL).toBe("0:40");
  });

  it.each(LEVELS)(
    "gives %s players a hidden exercise of at most 40 s",
    (level) => {
      const exercise = exercisesAgregat.find(
        (ex) => ex.id === FIRST_RIFF_EXERCISE_IDS[level],
      );
      expect(exercise).toBeDefined();
      expect(exercise!.isHiddenFromLibrary).toBe(true);
      expect(exercise!.premium).toBeFalsy();
      expect(exercise!.timeInMinutes * 60).toBeLessThanOrEqual(40);
    },
  );

  it.each(LEVELS)(
    "fits one pass of the %s riff's tab into its 40 s",
    (level) => {
      const exercise = exercisesAgregat.find(
        (ex) => ex.id === FIRST_RIFF_EXERCISE_IDS[level],
      )!;
      const beats = exercise.tablature!.reduce(
        (sum, measure) =>
          sum + measure.beats.reduce((s, beat) => s + beat.duration, 0),
        0,
      );
      const seconds = (beats * 60) / exercise.metronomeSpeed!.recommended;
      expect(seconds).toBeGreaterThan(30);
      expect(seconds).toBeLessThanOrEqual(40);
    },
  );

  it.each(LEVELS)("fills every bar of the %s riff to 4/4", (level) => {
    const exercise = exercisesAgregat.find(
      (ex) => ex.id === FIRST_RIFF_EXERCISE_IDS[level],
    )!;
    for (const measure of exercise.tablature!) {
      expect(measure.beats.reduce((s, beat) => s + beat.duration, 0)).toBe(4);
    }
  });

  it("keeps the level and source in the link", () => {
    expect(getFirstRiffHref("some", "google_signup")).toBe(
      "/onboarding/first-riff?level=some&from=google_signup",
    );
  });
});

describe("first hunt", () => {
  it("lasts one minute", () => {
    expect(FIRST_HUNT_SECONDS).toBe(60);
    expect(FIRST_HUNT_DURATION_LABEL).toBe("1:00");
  });

  it.each(LEVELS)(
    "gives %s players a click hunt from the library, cut to a minute",
    (level) => {
      const exercise = getFirstHuntExercise(level);
      const original = exercisesAgregat.find((ex) => ex.id === exercise.id);
      expect(original).toBeDefined();
      expect(exercise.noteHuntConfig?.mode).toBe("click");
      expect(exercise.disableMic).toBe(true);
      expect(exercise.timeInMinutes * 60).toBe(60);
      // The library copy keeps its own length.
      expect(original!.timeInMinutes * 60).toBeGreaterThan(60);
    },
  );

  it("starts beginners on one string and the rest wider", () => {
    expect(getFirstHuntExercise("new").customGoalStrings).toEqual([6]);
    expect(
      getFirstHuntExercise("experienced").customGoalStrings,
    ).toBeUndefined();
  });

  it.each(LEVELS)(
    "draws the %s card's example spots inside frets 0–6",
    (level) => {
      for (const [string, fret] of FIRST_HUNT_PREVIEWS[level].spots) {
        expect(string).toBeGreaterThanOrEqual(1);
        expect(string).toBeLessThanOrEqual(6);
        expect(fret).toBeGreaterThanOrEqual(0);
        expect(fret).toBeLessThanOrEqual(6);
      }
    },
  );

  it("keeps the level and source in the link", () => {
    expect(getFirstHuntHref("new", "signup")).toBe(
      "/onboarding/first-hunt?level=new&from=signup",
    );
  });

  it("wraps the exercise in a one-item plan for the session", () => {
    const plan = toFirstMinutePlan(
      getFirstHuntExercise("some"),
      "hunt",
      "uid-1",
    );
    expect(plan.id).toBe("onboarding-first-hunt");
    expect(plan.userId).toBe("uid-1");
    expect(plan.exercises).toHaveLength(1);
  });
});
