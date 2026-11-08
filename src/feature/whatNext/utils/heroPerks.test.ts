import type { NextAction } from "feature/whatNext/types/whatNext.types";
import { HOUR, NOW, snapshot } from "feature/whatNext/utils/testSnapshot";
import type { DailyQuest, DailyQuestTask } from "types/api.types";
import { describe, expect, it } from "vitest";

import { heroAdvancesTask, heroPerks } from "./heroPerks";

const hero = (overrides: Partial<NextAction> = {}): NextAction => ({
  id: "goal:g1",
  source: "goals",
  kind: "continue",
  isPractice: true,
  title: { key: "goals.title" },
  href: "/practice/goal/g1",
  sessionItem: {
    kind: "goal",
    goalId: "g1",
    exerciseId: "spider_1",
    bpm: 100,
    minutes: 10,
  },
  ...overrides,
});

const task = (overrides: Partial<DailyQuestTask> = {}): DailyQuestTask => ({
  id: "t1",
  type: "practice_theory_time",
  title: "Theory",
  isCompleted: false,
  progress: 0,
  target: 10,
  ...overrides,
});

const quest = (tasks: DailyQuestTask[], isRewardClaimed = false): DailyQuest => ({
  date: "2026-11-07",
  isRewardClaimed,
  tasks,
});

const streak = (didPracticeToday: boolean, dayWithoutBreak = 12) => ({
  dayWithoutBreak,
  didPracticeToday,
  dayEndsAt: NOW + 9 * HOUR,
});

describe("heroAdvancesTask", () => {
  it("counts any session towards time-only tasks", () => {
    expect(heroAdvancesTask(hero(), task({ type: "practice_total_time" }))).toBe(true);
    expect(heroAdvancesTask(hero(), task({ type: "long_session" }))).toBe(true);
  });

  it("matches a plan to plan tasks and a song to song tasks only", () => {
    const plan = hero({ source: "plan", sessionItem: undefined });
    const songHero = hero({ source: "songs", sessionItem: undefined });
    expect(heroAdvancesTask(plan, task({ type: "practice_plan" }))).toBe(true);
    expect(heroAdvancesTask(plan, task({ type: "practice_any_song" }))).toBe(false);
    expect(heroAdvancesTask(songHero, task({ type: "practice_any_song" }))).toBe(true);
  });

  it("matches a named exercise only when the hero plays that exercise", () => {
    const specific = (exerciseId: string) =>
      task({ type: "practice_specific_exercise", exerciseId });
    expect(heroAdvancesTask(hero(), specific("spider_1"))).toBe(true);
    expect(heroAdvancesTask(hero(), specific("legato_2"))).toBe(false);
  });

  it("does not claim category tasks it cannot vouch for", () => {
    expect(heroAdvancesTask(hero(), task({ type: "practice_theory_time" }))).toBe(false);
  });
});

describe("heroPerks", () => {
  it("says the hero keeps a streak that is still open today", () => {
    expect(heroPerks(snapshot({ streak: streak(false) }), hero())).toEqual([
      { key: "perks.streak", params: { count: 12 } },
    ]);
  });

  it("says nothing about a streak already kept, or with none running", () => {
    expect(heroPerks(snapshot({ streak: streak(true) }), hero())).toEqual([]);
    expect(heroPerks(snapshot({ streak: streak(false, 0) }), hero())).toEqual([]);
  });

  it("mentions the quest only when the hero moves an open task", () => {
    const moving = quest([task({ type: "practice_total_time" })]);
    const other = quest([task({ type: "practice_theory_time" })]);
    const done = quest([task({ type: "practice_total_time", isCompleted: true })]);
    const claimed = quest([task({ type: "practice_total_time" })], true);

    expect(heroPerks(snapshot({ dailyQuest: moving }), hero())).toEqual([
      { key: "perks.quest" },
    ]);
    expect(heroPerks(snapshot({ dailyQuest: other }), hero())).toEqual([]);
    expect(heroPerks(snapshot({ dailyQuest: done }), hero())).toEqual([]);
    expect(heroPerks(snapshot({ dailyQuest: claimed }), hero())).toEqual([]);
  });

  it("does not repeat the streak on a hero that is the streak itself", () => {
    const fallback = hero({ id: "streak:x", source: "streak" });
    expect(heroPerks(snapshot({ streak: streak(false) }), fallback)).toEqual([]);
  });

  it("has nothing to add without a hero to play", () => {
    expect(heroPerks(snapshot({ streak: streak(false) }), null)).toEqual([]);
  });
});
