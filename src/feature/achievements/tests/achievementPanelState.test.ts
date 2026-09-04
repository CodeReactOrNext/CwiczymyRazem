import { EMPTY_ARSENAL_SUMMARY } from "feature/arsenal/data/arsenalSummary";
import { FaMedal } from "react-icons/fa";
import { describe, expect, it } from "vitest";

import { achievementsData } from "../data/achievementsData";
import { getGlobalUnlockRate } from "../data/globalUnlockRate";
import type {
  AchievementContext,
  AchievementList,
  AchievementsDataInterface,
} from "../types";
import type { AchievementPanelState } from "../utils/achievementPanelState";
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
  check: AchievementsDataInterface["check"],
  getProgress?: AchievementsDataInterface["getProgress"]
): AchievementsDataInterface => ({
  id: id as AchievementList,
  rarity: "common",
  Icon: FaMedal,
  name: `${id}.title`,
  description: `${id}.description`,
  check,
  getProgress,
});

/** Threshold-style: met now, and a bigger session cannot un-meet it. */
const pointsDef = def("points_1", (c) => c.statistics.points >= 100, (c) => ({
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
  (c) => c.statistics.actualDayWithoutBreak >= 10 && c.sessionResults.totalPoints <= 15
);

/** Needs a real session, so it can never be "ready" from stored state alone. */
const sessionDef = def("fire", (c) => c.sessionResults.totalPoints >= 60);

/** The list is flat now, so a fixture is found by id rather than by section. */
const entryFor = (state: AchievementPanelState, id: string) =>
  state.entries.find((e) => e.data.id === id)!;
describe("buildAchievementPanelState", () => {
  it("tallies what is owned against the whole registry", () => {
    const state = buildAchievementPanelState(["points_1" as AchievementList], ctx(), null, [
      pointsDef,
      ceilingDef,
      sessionDef,
    ]);

    expect(state.owned).toBe(1);
    expect(state.total).toBe(3);
  });

  it("marks a met threshold as ready", () => {
    const state = buildAchievementPanelState([], ctx({ points: 150 }), null, [pointsDef]);

    expect(entryFor(state, "points_1").state).toBe("ready");
  });

  it("does not promise a badge a real session would fail", () => {
    // The empty-session probe passes this one; the generous probe must veto it.
    const state = buildAchievementPanelState([], ctx({ actualDayWithoutBreak: 12 }), null, [
      ceilingDef,
    ]);

    expect(entryFor(state, "short").state).toBe("locked");
  });

  it("leaves a session-only badge locked rather than showing a dead bar", () => {
    const state = buildAchievementPanelState([], ctx(), null, [sessionDef]);

    expect(entryFor(state, "fire").state).toBe("locked");
  });

  it("clamps progress so a bar can never overrun its track", () => {
    const overshoot = def("points_1", () => false, () => ({ current: 400, max: 100 }));
    const state = buildAchievementPanelState([], ctx(), null, [overshoot]);

    expect(entryFor(state, "points_1").progress).toMatchObject({ current: 100, max: 100 });
  });

  it("lists every badge commonest first, ungrouped", () => {
    const done = def("time_1", () => false);
    const state = buildAchievementPanelState(["time_1" as AchievementList], ctx(), null, [
      done,
      pointsDef,
      ceilingDef,
    ]);

    const rates = state.entries.map((e) => e.globalRate);
    expect(rates).toEqual([...rates].sort((a, b) => b - a));
    // Nothing is dropped or duplicated by the sort.
    expect(state.entries.map((e) => e.data.id).sort()).toEqual(["points_1", "short", "time_1"]);
  });

  it("reads everything as locked until the context has loaded", () => {
    const state = buildAchievementPanelState(["points_1" as AchievementList], null, null, [
      pointsDef,
      sessionDef,
    ]);

    expect(state.owned).toBe(1);
    expect(state.entries.every((e) => e.state !== "ready")).toBe(true);
    expect(entryFor(state, "fire").state).toBe("locked");
  });
  it("gives every badge a share between 0 and 100", () => {
    const state = buildAchievementPanelState([], ctx(), null, [pointsDef, ceilingDef, sessionDef]);
    const rates = state.entries.map((e) => e.globalRate);

    expect(rates.length).toBe(3);
    expect(rates.every((rate) => rate > 0 && rate <= 100)).toBe(true);
  });
});

describe("getGlobalUnlockRate", () => {
  it("returns the same figure every time it is asked", () => {
    // Rows sort on this, so a value that moved would reorder the list on paint.
    for (const badge of achievementsData) {
      const first = getGlobalUnlockRate(badge.id, badge.rarity);
      expect(getGlobalUnlockRate(badge.id, badge.rarity)).toBe(first);
    }
  });

  it("puts rarer badges lower, the way real numbers will", () => {
    const highest = (rarity: (typeof achievementsData)[number]["rarity"]) =>
      Math.max(
        ...achievementsData
          .filter((d) => d.rarity === rarity)
          .map((d) => getGlobalUnlockRate(d.id, d.rarity))
      );

    expect(highest("epic")).toBeLessThan(highest("veryRare"));
    expect(highest("veryRare")).toBeLessThan(highest("rare"));
    expect(highest("rare")).toBeLessThan(highest("common"));
  });
});