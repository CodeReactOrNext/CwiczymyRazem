import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { describe, expect, it } from "vitest";

import { nextRoadmapStep } from "../hooks/usePlannerSources";
import type { CalendarItem } from "../types/calendar.types";
import { buildDayPlan, isItemDone, itemHref } from "./calendarItems";

const exercise = (id: string): Exercise => ({
  id,
  title: id,
  description: "",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 5,
  instructions: [],
  tips: [],
  metronomeSpeed: { min: 60, max: 160, recommended: 90 },
  relatedSkills: [],
});

const item = (change: Partial<CalendarItem>): CalendarItem => ({
  id: "i1",
  kind: "exercise",
  area: "technique",
  minutes: 12,
  role: "main",
  auto: true,
  done: false,
  ...change,
});

const CATALOG = new Map([
  ["ex1", exercise("ex1")],
  ["ex2", exercise("ex2")],
]);

describe("buildDayPlan", () => {
  it("plays each slot at its own length, in order", () => {
    const plan = buildDayPlan(
      "2026-11-02",
      [
        item({ id: "a", exerciseId: "ex2", minutes: 7 }),
        item({
          id: "b",
          kind: "song",
          area: "songs",
          song: { id: "s1", title: "T", artist: "A" },
        }),
        item({
          id: "c",
          kind: "goal",
          exerciseId: "ex1",
          goalId: "g",
          bpm: 132,
        }),
      ],
      CATALOG,
    )!;
    expect(plan.exercises.map((entry) => entry.id)).toEqual([
      "ex2",
      "song-s1",
      "ex1",
    ]);
    expect(plan.exercises[0].timeInMinutes).toBe(7);
    expect(plan.exercises[2].metronomeSpeed?.recommended).toBe(132);
  });

  it("gives custom slots and bare roadmap steps a plain timer slot", () => {
    const plan = buildDayPlan(
      "2026-11-02",
      [
        item({ id: "c1", kind: "custom", area: "creativity", title: "Jam" }),
        item({ id: "r1", kind: "roadmap", title: "Listen to the record" }),
      ],
      CATALOG,
    )!;
    expect(plan.exercises.map((entry) => entry.title)).toEqual([
      "Jam",
      "Listen to the record",
    ]);
  });

  it("drops slots that no longer resolve and returns null when nothing is left", () => {
    expect(
      buildDayPlan("2026-11-02", [item({ exerciseId: "gone" })], CATALOG),
    ).toBeNull();
  });
});

describe("isItemDone", () => {
  const stamps = {
    song: { s1: new Date(2026, 10, 2, 20).getTime() },
    exercise: { ex1: new Date(2026, 10, 1, 9).getTime() },
    skill: {},
    custom: {},
  };

  it("counts a slot played that day anywhere in the app", () => {
    const song = item({
      kind: "song",
      area: "songs",
      song: { id: "s1", title: "", artist: "" },
    });
    expect(isItemDone(song, "2026-11-02", stamps)).toBe(true);
    expect(isItemDone(song, "2026-11-03", stamps)).toBe(false);
    expect(isItemDone(item({ exerciseId: "ex1" }), "2026-11-02", stamps)).toBe(
      false,
    );
  });

  it("trusts a slot ticked off by hand", () => {
    expect(isItemDone(item({ done: true }), "2026-11-02", null)).toBe(true);
  });
});

describe("itemHref", () => {
  it("links goals and roadmap steps to their own pages", () => {
    expect(itemHref(item({ kind: "goal", goalId: "g1" }))).toBe(
      "/practice/goal/g1",
    );
    expect(
      itemHref(item({ kind: "roadmap", roadmapId: "r", stepId: "s" })),
    ).toBe("/ai-coach?roadmapId=r&step=s");
    expect(itemHref(item({}))).toBeNull();
  });
});

describe("nextRoadmapStep", () => {
  const step = (id: string, order: number) => ({
    id,
    order,
    title: id,
    description: "",
    successCriteria: "",
    sessionsRequired: 2,
  });
  const roadmap = {
    phases: [
      { id: "p2", title: "", order: 2, steps: [step("c", 1)] },
      { id: "p1", title: "", order: 1, steps: [step("b", 2), step("a", 1)] },
    ],
  };

  it("is the first step in map order whose sessions aren't all logged", () => {
    expect(nextRoadmapStep(roadmap, {})?.id).toBe("a");
    expect(nextRoadmapStep(roadmap, { a: 2 })?.id).toBe("b");
    expect(nextRoadmapStep(roadmap, { a: 2, b: 3, c: 2 })).toBeNull();
  });
});
