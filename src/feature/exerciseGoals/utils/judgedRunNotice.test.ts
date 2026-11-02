import { describe, expect, it } from "vitest";

import type { ExerciseGoal, GoalRunOutcome } from "../types/exerciseGoal.types";
import { judgedRunNotice } from "./judgedRunNotice";

const goal: ExerciseGoal = {
  id: "g1",
  exerciseId: "ex",
  exerciseTitle: "Exercise",
  targetBpm: 120,
  startBpm: 100,
  stepBpm: 10,
  stageBpm: 100,
  strictness: "standard",
  counting: "streak",
  cleanRuns: 1,
  status: "active",
  createdAt: 0,
  completedAt: null,
};

const outcome = (overrides: Partial<GoalRunOutcome>): GoalRunOutcome => ({
  clean: true,
  reason: "clean",
  stageBpm: 100,
  cleanRuns: 2,
  stageCleared: false,
  nextStageBpm: 100,
  justCompleted: false,
  streakReset: false,
  ...overrides,
});

/** Echoes the key and its values, so the test reads what would be said. */
const t = (key: string, options?: Record<string, unknown> | string) =>
  typeof options === "object" ? `${key} ${JSON.stringify(options)}` : key;

describe("judgedRunNotice", () => {
  it("counts a clean run toward the milestone", () => {
    const notice = judgedRunNotice({ goal, outcome: outcome({}) }, 95, t);
    expect(notice?.tone).toBe("success");
    expect(notice?.title).toBe(
      'practice_run.clean {"bpm":100,"count":2,"required":3}',
    );
  });

  it("names the next milestone once one is cleared", () => {
    const notice = judgedRunNotice(
      {
        goal,
        outcome: outcome({
          cleanRuns: 3,
          stageCleared: true,
          nextStageBpm: 110,
        }),
      },
      95,
      t,
    );
    expect(notice?.title).toBe('verdict.stage_cleared {"bpm":100}');
    expect(notice?.description).toBe('practice_run.next_stage {"bpm":110}');
  });

  it("celebrates the goal itself", () => {
    const notice = judgedRunNotice(
      {
        goal,
        outcome: outcome({
          stageBpm: 120,
          cleanRuns: 3,
          stageCleared: true,
          nextStageBpm: null,
          justCompleted: true,
        }),
      },
      95,
      t,
    );
    expect(notice?.title).toBe('verdict.completed {"bpm":120}');
  });

  it("says why a run missed, and that a streak starts over", () => {
    const notice = judgedRunNotice(
      {
        goal,
        outcome: outcome({
          clean: false,
          reason: "accuracy",
          cleanRuns: 0,
          streakReset: true,
        }),
      },
      84,
      t,
    );
    expect(notice?.tone).toBe("neutral");
    expect(notice?.description).toBe(
      'verdict.accuracy {"accuracy":84,"required":90} verdict.streak_reset',
    );
  });

  it("stays quiet for a goal already reached", () => {
    expect(
      judgedRunNotice(
        { goal, outcome: outcome({ reason: "goal_closed" }) },
        95,
        t,
      ),
    ).toBeNull();
  });
});
