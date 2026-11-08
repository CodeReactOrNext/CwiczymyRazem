import type { FeatureGoalId } from "feature/whatNext/data/featureGoals";
import { FEATURE_GOAL_IDS } from "feature/whatNext/data/featureGoals";
import { describe, expect, it } from "vitest";

import type { FeatureGoalStatus } from "./featureGoalsView";
import { pendingFeatureGoals } from "./featureGoalsView";

const status = (id: FeatureGoalId, done = false): FeatureGoalStatus => ({
  id,
  done,
});

const ids = (rows: { id: string }[]) => rows.map((row) => row.id);

describe("pendingFeatureGoals", () => {
  it("keeps the goals in priority order", () => {
    expect(ids(pendingFeatureGoals([], 1)).slice(0, 3)).toEqual([
      "first_session",
      "first_song",
      "tempo_goal",
    ]);
  });

  it("drops a goal once it is done", () => {
    expect(
      ids(pendingFeatureGoals([status("first_session", true)], 1)),
    ).not.toContain("first_session");
  });

  it("leaves level-locked goals out until their page opens", () => {
    const early = FEATURE_GOAL_IDS.map((id) =>
      status(id, id !== "guild" && id !== "weekly_goal"),
    );
    expect(ids(pendingFeatureGoals(early, 1))).toEqual([]);
    expect(ids(pendingFeatureGoals(early, 99))).toEqual([
      "weekly_goal",
      "guild",
    ]);
  });
});
