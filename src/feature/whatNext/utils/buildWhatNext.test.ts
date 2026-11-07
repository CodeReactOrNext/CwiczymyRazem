import {
  goal,
  HOUR,
  NOW,
  snapshot,
  song,
} from "feature/whatNext/utils/testSnapshot";
import { describe, expect, it } from "vitest";

import { buildWhatNext } from "./buildWhatNext";

/**
 * Whole-road scenarios: the situations a player is actually in, and what the
 * road should lead with. These pin the weights — change RANK_WEIGHTS and these
 * say what moved.
 */
describe("buildWhatNext", () => {
  it("leads a brand-new player to a first session", () => {
    const result = buildWhatNext(
      snapshot({
        sessionCount: 0,
        lvl: 1,
        points: 0,
        quickPick: { exerciseId: "e1", title: "Warm-up" },
        songs: { learning: [], wantToLearn: [], learnedCount: 0 },
      }),
    );
    expect(result.hero?.id).toBe("onboarding:first-session");
    expect(result.lanes.inProgress.map((a) => a.id)).toContain(
      "onboarding:first-song",
    );
  });

  it("puts a nearly finished goal ahead of an old song", () => {
    const result = buildWhatNext(
      snapshot({
        goals: [goal({ stageBpm: 120, cleanRuns: 2 })],
        songs: { learning: [song()], wantToLearn: [], learnedCount: 0 },
        streak: {
          dayWithoutBreak: 5,
          didPracticeToday: true,
          dayEndsAt: NOW + 9 * HOUR,
        },
      }),
    );
    expect(result.hero?.source).toBe("goals");
  });

  it("rescues a streak in its last hours", () => {
    const result = buildWhatNext(
      snapshot({
        goals: [goal({ stageBpm: 120, cleanRuns: 2 })],
        streak: {
          dayWithoutBreak: 30,
          didPracticeToday: false,
          dayEndsAt: NOW + 2 * HOUR,
        },
      }),
    );
    expect(result.hero?.source).toBe("streak");
  });

  it("never offers a claim as the thing to play", () => {
    const result = buildWhatNext(
      snapshot({
        rewards: {
          caseTokens: 3,
          achievementsClaimable: 2,
          achievementsPending: { fame: 50, caseTokens: 0, parts: [] },
        },
      }),
    );
    expect(result.claims).toHaveLength(2);
    expect(result.hero?.source).not.toBe("claims");
  });

  it("keeps the hero out of the lanes below it", () => {
    const result = buildWhatNext(snapshot({ goals: [goal()] }));
    const laneIds = Object.values(result.lanes)
      .flat()
      .map((a) => a.id);
    expect(laneIds).not.toContain(result.hero?.id);
  });
});
