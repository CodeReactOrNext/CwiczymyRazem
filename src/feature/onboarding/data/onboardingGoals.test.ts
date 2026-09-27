import { existsSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";

import type { OnboardingLevel } from "../types";
import {
  getGoalOptions,
  getOnboardingPlans,
  getPlanHref,
  getPlanMinutes,
  GOAL_OPTIONS,
  LEVEL_OPTIONS,
  LEVEL_PLAN_IDS,
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

  it("keeps roadmaps and the practice log for players past the basics", () => {
    expect(goalsFor("new")).not.toContain("roadmap");
    expect(goalsFor("new")).not.toContain("log");
    expect(goalsFor("experienced")).toEqual(
      expect.arrayContaining(["plans", "songs", "roadmap", "log"]),
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
