import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import { existsSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";

import type { OnboardingLevel } from "../types";
import {
  FIRST_RIFF_DURATION_LABEL,
  FIRST_RIFF_EXERCISE_IDS,
  FIRST_RIFF_IMAGE,
  getAfterFirstRiffHref,
  getFirstRiffHref,
  getGoalOptions,
  getOnboardingPlans,
  getPlanHref,
  getPlanMinutes,
  GOAL_OPTIONS,
  LEVEL_OPTIONS,
  LEVEL_PLAN_IDS,
  LOOK_AROUND_CHOICES,
} from "./onboardingGoals";

const LEVELS: OnboardingLevel[] = LEVEL_OPTIONS.map((option) => option.level);
const goalsFor = (level: OnboardingLevel) =>
  getGoalOptions(level).map((option) => option.goal);

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

describe("getGoalOptions", () => {
  it("has one option per goal", () => {
    const goals = GOAL_OPTIONS.map((option) => option.goal);
    expect(new Set(goals).size).toBe(goals.length);
  });

  it("offers learning from scratch only to beginners", () => {
    expect(goalsFor("new")).toContain("journey");
    expect(goalsFor("some")).not.toContain("journey");
    expect(goalsFor("experienced")).not.toContain("journey");
  });

  it("keeps roadmaps for players past the basics", () => {
    expect(goalsFor("new")).not.toContain("roadmap");
    expect(goalsFor("some")).toContain("roadmap");
    expect(goalsFor("experienced")).toContain("roadmap");
  });

  it("no longer offers logging existing practice", () => {
    for (const level of LEVELS) {
      expect(goalsFor(level)).not.toContain("log");
    }
  });

  it.each(LEVELS)("leaves roadmaps out on a phone for %s players", (level) => {
    const onPhone = getGoalOptions(level, { isPhone: true }).map(
      (option) => option.goal,
    );
    expect(onPhone).not.toContain("roadmap");
    expect(onPhone).toEqual(
      goalsFor(level).filter((goal) => goal !== "roadmap"),
    );
  });

  it.each(LEVELS)("offers plans and songs to %s players", (level) => {
    expect(goalsFor(level)).toEqual(expect.arrayContaining(["plans", "songs"]));
  });

  it.each(GOAL_OPTIONS)("$goal illustration exists in public/", (option) => {
    expect(existsSync(join(process.cwd(), "public", option.image))).toBe(true);
  });

  it("sends only the plans goal to the in-onboarding plan picker", () => {
    const pickers = GOAL_OPTIONS.filter((option) => option.href === null);
    expect(pickers.map((option) => option.goal)).toEqual(["plans"]);
  });
});

describe("play step", () => {
  it("offers looking around with or without a guitar under the riff", () => {
    expect(LOOK_AROUND_CHOICES).toEqual(["browse", "no_guitar"]);
  });

  it("shows the riff with a screenshot that exists in public/", () => {
    expect(existsSync(join(process.cwd(), "public", FIRST_RIFF_IMAGE))).toBe(
      true,
    );
  });

  it("labels the riff the way the session timer shows 40 s", () => {
    expect(FIRST_RIFF_DURATION_LABEL).toBe("0:40");
  });
});

describe("first riff", () => {
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

  it("keeps the level and source on the way there and back", () => {
    expect(getFirstRiffHref("some", "google_signup")).toBe(
      "/onboarding/first-riff?level=some&from=google_signup",
    );
    expect(getAfterFirstRiffHref("some", "google_signup")).toBe(
      "/onboarding?step=goal&level=some&played=1&from=google_signup",
    );
  });
});

describe("getOnboardingPlans", () => {
  it.each(LEVELS)("resolves every %s plan id", (level) => {
    expect(getOnboardingPlans(level).map((plan) => plan.id)).toEqual(
      LEVEL_PLAN_IDS[level],
    );
  });

  it.each(LEVELS.flatMap((level) => getOnboardingPlans(level)))(
    "$id is short enough for a first session",
    (plan) => {
      expect(getPlanMinutes(plan)).toBeGreaterThan(0);
      expect(getPlanMinutes(plan)).toBeLessThanOrEqual(20);
    },
  );

  it("gives beginners only beginner-friendly plans", () => {
    for (const plan of getOnboardingPlans("new")) {
      expect(["beginner", "easy"]).toContain(plan.difficulty);
    }
  });

  it("links a plan to the practice screen", () => {
    expect(getPlanHref("strumming_foundations")).toBe(
      "/timer/plans?planId=strumming_foundations",
    );
  });
});
