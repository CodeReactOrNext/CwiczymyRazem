import { describe, expect, it } from "vitest";

import type { GettingStartedProgressInput } from "./gettingStartedProgress";
import { getGettingStartedProgress } from "./gettingStartedProgress";

const input = (
  overrides: Partial<GettingStartedProgressInput> = {},
): GettingStartedProgressInput => ({
  quest: undefined,
  sessionCount: 0,
  guitarCount: 0,
  songCount: 0,
  practiceDayCount: 0,
  ...overrides,
});

const stepDone = (
  progress: ReturnType<typeof getGettingStartedProgress>,
  id: string,
) => progress.steps.find((step) => step.id === id)?.isDone;

describe("getGettingStartedProgress", () => {
  it("is visible with nothing done for a brand new user", () => {
    const progress = getGettingStartedProgress(input());

    expect(progress.isVisible).toBe(true);
    expect(progress.allStepsDone).toBe(false);
    expect(progress.canClaimReward).toBe(false);
    expect(progress.steps.every((step) => !step.isDone)).toBe(true);
  });

  it("has exactly three steps, all derived from the player's data", () => {
    const progress = getGettingStartedProgress(input());

    expect(progress.steps.map((step) => step.id)).toEqual([
      "first_session",
      "first_song",
      "second_day",
    ]);
  });

  it("unlocks the guitar reward right after the first session", () => {
    const progress = getGettingStartedProgress(
      input({ sessionCount: 1, practiceDayCount: 1 }),
    );

    expect(stepDone(progress, "first_session")).toBe(true);
    expect(progress.allStepsDone).toBe(false);
    expect(progress.canClaimReward).toBe(true);
  });

  it("derives the first-song step from song count", () => {
    const progress = getGettingStartedProgress(input({ songCount: 1 }));

    expect(stepDone(progress, "first_song")).toBe(true);
  });

  it("needs practice on two different days for the second-day step", () => {
    const sameDay = getGettingStartedProgress(
      input({ sessionCount: 3, practiceDayCount: 1 }),
    );
    const twoDays = getGettingStartedProgress(
      input({ sessionCount: 3, practiceDayCount: 2 }),
    );

    expect(stepDone(sameDay, "second_day")).toBe(false);
    expect(stepDone(twoDays, "second_day")).toBe(true);
  });

  it("stops offering the reward once it was claimed", () => {
    const progress = getGettingStartedProgress(
      input({
        quest: { rewardClaimed: true, dismissed: false },
        sessionCount: 1,
      }),
    );

    expect(progress.canClaimReward).toBe(false);
    expect(progress.isVisible).toBe(true);
  });

  it("is fully complete only once every step is done, the reward claimed and a guitar drawn", () => {
    const done = input({
      quest: { rewardClaimed: true, dismissed: false },
      sessionCount: 3,
      songCount: 2,
      practiceDayCount: 2,
    });

    expect(getGettingStartedProgress(done).isFullyComplete).toBe(false);

    const withGuitar = getGettingStartedProgress({ ...done, guitarCount: 1 });
    expect(withGuitar.isFullyComplete).toBe(true);
    expect(withGuitar.isVisible).toBe(false);
  });

  it("hides the widget once dismissed", () => {
    const progress = getGettingStartedProgress(
      input({ quest: { rewardClaimed: false, dismissed: true } }),
    );

    expect(progress.isVisible).toBe(false);
  });
});
