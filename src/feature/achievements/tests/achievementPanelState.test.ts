import { EMPTY_ARSENAL_SUMMARY } from "feature/arsenal/data/arsenalSummary";
import { FaMedal } from "react-icons/fa";
import { describe, expect, it } from "vitest";

import type {
  AchievementCategory,
  AchievementContext,
  AchievementList,
  AchievementsDataInterface,
} from "../types";
import { buildAchievementPanelState } from "../utils/achievementPanelState";

const ctx = (over: Partial<AchievementContext["statistics"]> = {}): AchievementContext =>
  ({
    statistics: { points: 0, achievements: [], actualDayWithoutBreak: 0, ...over },
    arsenal: EMPTY_ARSENAL_SUMMARY,
    sessionResults: {
      reportDate: new Date(0),
      totalPoints: 0,
      bonusPoints: {
        multiplier: 0,
        habitsCount: 0,
        additionalPoints: 0,
        time: 0,
        timePoints: 0,
      },
    },
    inputData: {
      techniqueHours: "0",
      techniqueMinutes: "0",
      theoryHours: "0",
      theoryMinutes: "0",
      hearingHours: "0",
      hearingMinutes: "0",
      creativityHours: "0",
      creativityMinutes: "0",
      countBackDays: 0,
      reportTitle: "",
      habbits: [],
      avatarUrl: null,
    },
  }) as unknown as AchievementContext;

const def = (
  id: string,
  category: AchievementCategory,
  check: AchievementsDataInterface["check"],
  getProgress?: AchievementsDataInterface["getProgress"]
): AchievementsDataInterface => ({
  id: id as AchievementList,
  category,
  rarity: "common",
  Icon: FaMedal,
  name: `${id}.title`,
  description: `${id}.description`,
  check,
  getProgress,
});

/** Threshold-style: met now, and a bigger session cannot un-meet it. */
const pointsDef = def("points_1", "stat", (c) => c.statistics.points >= 100, (c) => ({
  current: c.statistics.points,
  max: 100,
  unit: "pts",
}));

/**
 * Ceiling-style, exactly like the real `short`: wants a *small* report. Passes
 * against an empty session and fails against a generous one, so the panel must
 * not promise it.
 */
const ceilingDef = def(
  "short",
  "special",
  (c) => c.statistics.actualDayWithoutBreak >= 10 && c.sessionResults.totalPoints <= 15
);

/** Needs a real session, so it can never be "ready" from stored state alone. */
const sessionDef = def("fire", "special", (c) => c.sessionResults.totalPoints >= 60);

describe("buildAchievementPanelState", () => {
  it("tallies what is owned against the whole registry", () => {
    const state = buildAchievementPanelState(["points_1" as AchievementList], ctx(), [
      pointsDef,
      ceilingDef,
      sessionDef,
    ]);

    expect(state.owned).toBe(1);
    expect(state.total).toBe(3);
    expect(state.rarities).toEqual([{ rarity: "common", owned: 1, total: 3 }]);
  });

  it("marks a met threshold as ready", () => {
    const state = buildAchievementPanelState([], ctx({ points: 150 }), [pointsDef]);

    expect(state.ready.map((e) => e.data.id)).toEqual(["points_1"]);
  });

  it("does not promise a badge a real session would fail", () => {
    // The empty-session probe passes this one; the generous probe must veto it.
    const state = buildAchievementPanelState([], ctx({ actualDayWithoutBreak: 12 }), [
      ceilingDef,
    ]);

    expect(state.ready).toEqual([]);
    expect(state.categories[0].entries[0].state).toBe("locked");
  });

  it("leaves a session-only badge locked rather than showing a dead bar", () => {
    const state = buildAchievementPanelState([], ctx(), [sessionDef]);

    expect(state.categories[0].entries[0].state).toBe("locked");
  });

  it("clamps progress so a bar can never overrun its track", () => {
    const overshoot = def("points_1", "stat", () => false, () => ({ current: 400, max: 100 }));
    const state = buildAchievementPanelState([], ctx(), [overshoot]);

    expect(state.categories[0].entries[0].progress).toMatchObject({ current: 100, max: 100 });
  });

  it("puts the least complete category first", () => {
    const done = def("time_1", "time", () => false);
    const state = buildAchievementPanelState(["time_1" as AchievementList], ctx(), [
      done,
      pointsDef,
      ceilingDef,
    ]);

    expect(state.categories.map((c) => c.category)).toEqual(["stat", "special", "time"]);
  });

  it("reads everything as locked until the context has loaded", () => {
    const state = buildAchievementPanelState(["points_1" as AchievementList], null, [
      pointsDef,
      sessionDef,
    ]);

    expect(state.owned).toBe(1);
    expect(state.ready).toEqual([]);
    expect(state.categories.flatMap((c) => c.entries).map((e) => e.state)).toContain("locked");
  });
});
