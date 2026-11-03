import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { describe, expect, it } from "vitest";

import { nextRoadmapStep } from "../hooks/usePlannerSources";
import type { CalendarItem } from "../types/calendar.types";
import {
  buildDayPlan,
  isItemDone,
  itemHref,
  planToItems,
} from "./calendarItems";

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

  it("plays a song slot in the mode it was added with", () => {
    const song = { id: "s1", title: "T", artist: "A" };
    const plan = buildDayPlan(
      "2026-11-02",
      [item({ kind: "song", area: "songs", song, songMode: "sections" })],
      CATALOG,
      new Set(["s1"]),
    )!;
    expect(plan.exercises[0].songData?.mode).toBe("sections");
  });

  it("gives older song slots the tab only when one is attached", () => {
    const slot = item({
      kind: "song",
      area: "songs",
      song: { id: "s1", title: "T", artist: "A" },
    });
    const modeWith = (gpSongIds: Set<string>) =>
      buildDayPlan("2026-11-02", [slot], CATALOG, gpSongIds)!.exercises[0]
        .songData?.mode;
    expect(modeWith(new Set(["s1"]))).toBe("gp");
    expect(modeWith(new Set())).toBe("sections");
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

describe("planToItems", () => {
  const plan = {
    exercises: [
      { ...exercise("ex1"), timeInMinutes: 7.4 },
      {
        ...exercise("song-s1"),
        timeInMinutes: 12,
        songData: {
          songId: "s1",
          title: "T",
          artist: "A",
          mode: "gp" as const,
        },
      },
      {
        ...exercise("community-x"),
        title: "My drill",
        description: "Slow, then fast",
        category: "creativity" as const,
        timeInMinutes: 0,
      },
    ],
  };

  it("keeps the routine's order and lengths, to the minute", () => {
    const items = planToItems(plan, CATALOG);
    expect(items.map((slot) => slot.kind)).toEqual([
      "exercise",
      "song",
      "custom",
    ]);
    expect(items.map((slot) => slot.minutes)).toEqual([7, 12, 1]);
    expect(items.every((slot) => !slot.auto && !slot.done)).toBe(true);
    expect(new Set(items.map((slot) => slot.id)).size).toBe(3);
  });

  it("brings songs over with their mode", () => {
    const [, song] = planToItems(plan, CATALOG);
    expect(song).toMatchObject({
      area: "songs",
      song: { id: "s1", title: "T", artist: "A" },
      songMode: "gp",
    });
  });

  it("turns an exercise outside the catalog into a custom slot", () => {
    const [, , custom] = planToItems(plan, CATALOG);
    expect(custom).toMatchObject({
      area: "creativity",
      title: "My drill",
      note: "Slow, then fast",
    });
    expect(custom.exerciseId).toBeUndefined();
  });

  it("plays back through buildDayPlan", () => {
    const dayPlan = buildDayPlan(
      "2026-11-02",
      planToItems(plan, CATALOG),
      CATALOG,
    );
    expect(dayPlan?.exercises.map((entry) => entry.timeInMinutes)).toEqual([
      7, 12, 1,
    ]);
  });
});

describe("buildDayPlan with a goal outside the catalog", () => {
  it("plays it on a plain timer under the goal's name", () => {
    const plan = buildDayPlan(
      "2026-11-03",
      [
        item({
          kind: "goal",
          exerciseId: "community-abc",
          goalId: "g1",
          bpm: 60,
          title: "My own drill",
          minutes: 8,
        }),
      ],
      CATALOG,
    );
    expect(plan?.exercises).toHaveLength(1);
    expect(plan?.exercises[0]).toMatchObject({
      title: "My own drill",
      timeInMinutes: 8,
    });
  });
});
