import type { DailyQuest, DailyQuestTask, DailyQuestTaskType } from "types/api.types";
import { describe, expect, it } from "vitest";

import { isSameQuest, mergeDailyQuests } from "./dailyQuest.merge";

const TODAY = "2026-08-26";
const YESTERDAY = "2026-08-25";

const task = (
  type: DailyQuestTaskType,
  overrides: Partial<DailyQuestTask> = {}
): DailyQuestTask => ({
  id: `quest_${TODAY}_${type}`,
  type,
  title: type,
  isCompleted: false,
  progress: 0,
  target: 1,
  ...overrides,
});

const quest = (date: string, tasks: DailyQuestTask[], isRewardClaimed = false): DailyQuest => ({
  date,
  tasks,
  isRewardClaimed,
});

describe("mergeDailyQuests", () => {
  it("never lets a stale client revert progress made elsewhere", () => {
    // The reported bug: a tab open since the morning knows only about the rated
    // song, the session finished on another device completed the other two.
    const stale = quest(TODAY, [
      task("practice_specific_exercise", { exerciseId: "musician_fitness_lvl1_s2" }),
      task("practice_plan"),
      task("rate_song", { progress: 1, isCompleted: true }),
    ]);
    const stored = quest(TODAY, [
      task("practice_specific_exercise", {
        exerciseId: "musician_fitness_lvl1_s2",
        progress: 1,
        isCompleted: true,
      }),
      task("practice_plan", { progress: 1, isCompleted: true }),
      task("rate_song", { progress: 1, isCompleted: true }),
    ]);

    const merged = mergeDailyQuests(stale, stored, TODAY);

    expect(merged?.tasks.every((t) => t.isCompleted)).toBe(true);
  });

  it("still publishes progress the stored copy has not seen yet", () => {
    const local = quest(TODAY, [task("practice_plan", { progress: 1, isCompleted: true })]);
    const stored = quest(TODAY, [task("practice_plan")]);

    const merged = mergeDailyQuests(local, stored, TODAY);

    expect(merged?.tasks[0].isCompleted).toBe(true);
  });

  it("takes the higher progress of a partially completed task from either side", () => {
    const local = quest(TODAY, [task("practice_total_time", { target: 15, progress: 12 })]);
    const stored = quest(TODAY, [task("practice_total_time", { target: 15, progress: 5 })]);

    expect(mergeDailyQuests(local, stored, TODAY)?.tasks[0]).toMatchObject({
      progress: 12,
      isCompleted: false,
    });
  });

  it("completes a task once merged progress reaches the target", () => {
    const local = quest(TODAY, [task("practice_total_time", { target: 15, progress: 15 })]);
    const stored = quest(TODAY, [task("practice_total_time", { target: 15, progress: 5 })]);

    expect(mergeDailyQuests(local, stored, TODAY)?.tasks[0].isCompleted).toBe(true);
  });

  it("keeps a claimed reward claimed", () => {
    const local = quest(TODAY, [task("rate_song")], true);
    const stored = quest(TODAY, [task("rate_song")], false);

    expect(mergeDailyQuests(local, stored, TODAY)?.isRewardClaimed).toBe(true);
    expect(mergeDailyQuests(stored, local, TODAY)?.isRewardClaimed).toBe(true);
  });

  it("keeps the stored task set when two clients drew different tasks, carrying progress over", () => {
    const local = quest(TODAY, [task("rate_song", { progress: 1, isCompleted: true }), task("auto_plan")]);
    const stored = quest(TODAY, [task("rate_song"), task("healthy_habits", { target: 2 })]);

    const merged = mergeDailyQuests(local, stored, TODAY);

    expect(merged?.tasks.map((t) => t.type)).toEqual(["rate_song", "healthy_habits"]);
    expect(merged?.tasks[0].isCompleted).toBe(true);
  });

  it("matches specific-exercise tasks by exercise, not by type alone", () => {
    const local = quest(TODAY, [
      task("practice_specific_exercise", { exerciseId: "spiderPermutation1234", progress: 1, isCompleted: true }),
    ]);
    const stored = quest(TODAY, [
      task("practice_specific_exercise", { exerciseId: "musician_fitness_lvl1_s2" }),
    ]);

    expect(mergeDailyQuests(local, stored, TODAY)?.tasks[0].isCompleted).toBe(false);
  });

  it("drops a quest left over from yesterday in favour of today's stored one", () => {
    const stale = quest(YESTERDAY, [task("rate_song", { progress: 1, isCompleted: true })], true);
    const stored = quest(TODAY, [task("practice_plan")]);

    expect(mergeDailyQuests(stale, stored, TODAY)).toEqual(stored);
  });

  it("publishes the new day's quest over yesterday's stored one", () => {
    const fresh = quest(TODAY, [task("practice_plan")]);
    const stored = quest(YESTERDAY, [task("rate_song", { progress: 1, isCompleted: true })], true);

    expect(mergeDailyQuests(fresh, stored, TODAY)).toEqual(fresh);
  });

  it("converges on the later date when neither copy belongs to today", () => {
    const behind = quest("2026-08-24", [task("rate_song")]);
    const ahead = quest(YESTERDAY, [task("practice_plan")]);

    expect(mergeDailyQuests(behind, ahead, TODAY)).toEqual(ahead);
    expect(mergeDailyQuests(ahead, behind, TODAY)).toEqual(ahead);
  });

  it("falls back to whichever side exists", () => {
    const stored = quest(TODAY, [task("rate_song")]);

    expect(mergeDailyQuests(null, stored, TODAY)).toEqual(stored);
    expect(mergeDailyQuests(stored, null, TODAY)).toEqual(stored);
    expect(mergeDailyQuests(null, null, TODAY)).toBeNull();
  });
});

describe("isSameQuest", () => {
  it("detects an unchanged quest so the sync can skip the write", () => {
    const a = quest(TODAY, [task("rate_song", { progress: 1, isCompleted: true })]);
    const b = quest(TODAY, [task("rate_song", { progress: 1, isCompleted: true })]);

    expect(isSameQuest(a, b)).toBe(true);
  });

  it("detects changed progress, reward and task sets", () => {
    const base = quest(TODAY, [task("rate_song")]);

    expect(isSameQuest(base, quest(TODAY, [task("rate_song", { progress: 1 })]))).toBe(false);
    expect(isSameQuest(base, quest(TODAY, [task("rate_song")], true))).toBe(false);
    expect(isSameQuest(base, quest(TODAY, [task("rate_song"), task("auto_plan")]))).toBe(false);
    expect(isSameQuest(base, quest(YESTERDAY, [task("rate_song")]))).toBe(false);
    expect(isSameQuest(base, null)).toBe(false);
    expect(isSameQuest(null, null)).toBe(true);
  });
});
