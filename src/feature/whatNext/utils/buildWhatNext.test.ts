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

  it("keeps a streak through the player's own practice, not a filler step", () => {
    const result = buildWhatNext(
      snapshot({
        goals: [goal({ stageBpm: 120, cleanRuns: 2 })],
        streak: {
          dayWithoutBreak: 30,
          didPracticeToday: false,
          dayEndsAt: NOW + 2 * HOUR,
        },
        dailyQuest: {
          date: "2026-11-07",
          isRewardClaimed: false,
          tasks: [
            {
              id: "t1",
              type: "practice_total_time",
              title: "15 minutes",
              isCompleted: false,
              progress: 0,
              target: 15,
            },
          ],
        },
      }),
    );
    expect(result.hero?.source).toBe("goals");
    expect(result.perks.map((perk) => perk.key)).toEqual([
      "perks.streak",
      "perks.quest",
    ]);
    expect(result.ranked.map((a) => a.source)).not.toContain("streak");
    expect(result.ranked.map((a) => a.source)).not.toContain("dailyQuest");
  });

  it("falls back to a short streak session when there is nothing of their own", () => {
    const result = buildWhatNext(
      snapshot({
        quickPick: { exerciseId: "e1", title: "Warm-up" },
        streak: {
          dayWithoutBreak: 8,
          didPracticeToday: false,
          dayEndsAt: NOW + 5 * HOUR,
        },
      }),
    );
    expect(result.hero?.source).toBe("streak");
    expect(result.ranked[0].id).toBe(result.hero?.id);
    expect(result.perks).toEqual([]);
  });

  it("keeps the hero out of the lanes below it", () => {
    const result = buildWhatNext(snapshot({ goals: [goal()] }));
    const laneIds = Object.values(result.lanes)
      .flat()
      .map((a) => a.id);
    expect(laneIds).not.toContain(result.hero?.id);
  });
});
