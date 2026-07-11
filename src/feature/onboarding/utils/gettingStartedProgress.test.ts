import { describe, expect, it } from "vitest";

import { GETTING_STARTED_QUEST_DEFAULTS } from "../types";
import { getGettingStartedProgress } from "./gettingStartedProgress";

describe("getGettingStartedProgress", () => {
  it("is visible with nothing done for a brand new user", () => {
    const progress = getGettingStartedProgress({
      quest: undefined,
      sessionCount: 0,
      guitarCount: 0,
    });

    expect(progress.isVisible).toBe(true);
    expect(progress.allStepsDone).toBe(false);
    expect(progress.steps.every((step) => !step.isDone)).toBe(true);
  });

  it("derives the first-exercise step from session count", () => {
    const progress = getGettingStartedProgress({
      quest: GETTING_STARTED_QUEST_DEFAULTS,
      sessionCount: 1,
      guitarCount: 0,
    });

    const firstExercise = progress.steps.find((s) => s.id === "first_exercise");
    expect(firstExercise?.isDone).toBe(true);
    expect(progress.allStepsDone).toBe(false);
  });

  it("marks allStepsDone once every guided step is complete", () => {
    const progress = getGettingStartedProgress({
      quest: {
        welcomeSeen: true,
        planIntroSeen: true,
        customPlanClicked: true,
        rewardClaimed: false,
        dismissed: false,
      },
      sessionCount: 3,
      guitarCount: 0,
    });

    expect(progress.allStepsDone).toBe(true);
    expect(progress.isFullyComplete).toBe(false);
  });

  it("is fully complete only once the reward is claimed and a guitar was drawn", () => {
    const progress = getGettingStartedProgress({
      quest: {
        welcomeSeen: true,
        planIntroSeen: true,
        customPlanClicked: true,
        rewardClaimed: true,
        dismissed: false,
      },
      sessionCount: 3,
      guitarCount: 1,
    });

    expect(progress.isFullyComplete).toBe(true);
    expect(progress.isVisible).toBe(false);
  });

  it("hides the widget once dismissed", () => {
    const progress = getGettingStartedProgress({
      quest: { ...GETTING_STARTED_QUEST_DEFAULTS, dismissed: true },
      sessionCount: 0,
      guitarCount: 0,
    });

    expect(progress.isVisible).toBe(false);
  });
});
