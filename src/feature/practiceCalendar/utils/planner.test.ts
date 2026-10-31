import { describe, expect, it } from "vitest";

import type { CalendarItem, PlannerPrefs } from "../types/calendar.types";
import { dateRange } from "./calendarDates";
import type { PlannerExercise, PlannerInput } from "./planner";
import {
  areaTargets,
  DEFAULT_PLANNER_PREFS,
  difficultyWindow,
  pickLightDay,
  planDays,
} from "./planner";

const exercise = (
  id: string,
  category: PlannerExercise["category"],
  difficulty: PlannerExercise["difficulty"] = "easy",
  timeInMinutes = 10,
): PlannerExercise => ({ id, category, difficulty, timeInMinutes });

const CATALOG: PlannerExercise[] = [
  ...Array.from({ length: 8 }, (_, i) =>
    exercise(`tech-easy-${i}`, "technique", "easy"),
  ),
  ...Array.from({ length: 8 }, (_, i) =>
    exercise(`tech-med-${i}`, "technique", "medium"),
  ),
  ...Array.from({ length: 4 }, (_, i) =>
    exercise(`tech-hard-${i}`, "technique", "hard"),
  ),
  exercise("warm-0", "technique", "beginner", 5),
  exercise("warm-1", "technique", "beginner", 5),
  ...Array.from({ length: 4 }, (_, i) =>
    exercise(`theory-${i}`, "theory", "medium"),
  ),
  exercise("hearing-0", "hearing", "easy"),
  exercise("creative-0", "creativity", "medium"),
];

// Mon 2026-11-02 … Sun 2026-11-08
const WEEK = dateRange("2026-11-02", "2026-11-08");

const input = (
  prefs: Partial<PlannerPrefs> = {},
  extra: Partial<PlannerInput> = {},
): PlannerInput => ({
  dates: WEEK,
  prefs: { ...DEFAULT_PLANNER_PREFS, ...prefs },
  catalog: CATALOG,
  songs: [
    { song: { id: "s1", title: "Song One", artist: "A" }, status: "learning" },
    {
      song: { id: "s2", title: "Song Two", artist: "B" },
      status: "wantToLearn",
    },
  ],
  goals: [],
  roadmapSteps: [],
  lastPracticed: {},
  now: new Date("2026-11-01T12:00:00").getTime(),
  existing: {},
  seed: 42,
  ...extra,
});

const minutesOf = (items: CalendarItem[]) =>
  items.reduce((sum, item) => sum + item.minutes, 0);

describe("planDays", () => {
  it("fills every day to the minutes asked for", () => {
    const { days } = planDays(input({ minutesPerDay: 45 }));
    WEEK.forEach((date) => expect(minutesOf(days[date])).toBe(45));
  });

  it("is deterministic for a seed and changes with it", () => {
    const first = planDays(input());
    expect(planDays(input())).toEqual(first);
    expect(planDays(input({}, { seed: 7 }))).not.toEqual(first);
  });

  it("keeps rest days empty and respects per-weekday lengths", () => {
    const { days } = planDays(input({ minutesByWeekday: { 0: 0, 6: 60 } }));
    expect(days["2026-11-08"]).toEqual([]);
    expect(minutesOf(days["2026-11-07"])).toBe(60);
  });

  it("never goes over the item cap", () => {
    const { days } = planDays(input({ minutesPerDay: 120, maxItemsPerDay: 3 }));
    WEEK.forEach((date) => {
      expect(days[date].length).toBeLessThanOrEqual(3);
      expect(minutesOf(days[date])).toBe(120);
    });
  });

  it("opens each day with a warm-up when asked", () => {
    const { days } = planDays(input({ warmup: true }));
    WEEK.forEach((date) => expect(days[date][0].role).toBe("warmup"));
    const without = planDays(input({ warmup: false }));
    WEEK.forEach((date) =>
      expect(without.days[date].some((item) => item.role === "warmup")).toBe(
        false,
      ),
    );
  });

  it("does not repeat an exercise within one day", () => {
    const { days } = planDays(input({ minutesPerDay: 90, maxItemsPerDay: 8 }));
    WEEK.forEach((date) => {
      const ids = days[date].flatMap((item) =>
        item.exerciseId ? [item.exerciseId] : [],
      );
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  it("plays at the player's level", () => {
    const { days } = planDays(
      input({ level: "advanced", warmup: false, minutesPerDay: 60 }),
    );
    const techniqueIds = WEEK.flatMap((date) =>
      days[date].filter(
        (item) => item.kind === "exercise" && item.area === "technique",
      ),
    ).map((item) => item.exerciseId!);
    expect(techniqueIds.length).toBeGreaterThan(0);
    techniqueIds.forEach((id) => expect(id).toMatch(/med|hard/));
  });

  it("leaves songs out when the source is off", () => {
    const { days, minutesByArea } = planDays(
      input({ sources: { songs: false, goals: true, roadmaps: true } }),
    );
    expect(minutesByArea.songs).toBe(0);
    WEEK.forEach((date) =>
      expect(days[date].some((item) => item.kind === "song")).toBe(false),
    );
  });

  it("gives focused areas a bigger share", () => {
    const even = planDays(input({ minutesPerDay: 60, warmup: false }));
    const focused = planDays(
      input({ minutesPerDay: 60, warmup: false, focus: ["theory"] }),
    );
    expect(focused.minutesByArea.theory).toBeGreaterThan(
      even.minutesByArea.theory,
    );
  });

  it("spaces goals out by variety", () => {
    const goals = [
      { goalId: "g1", exerciseId: "tech-med-0", title: "Goal", bpm: 120 },
    ];
    const count = (variety: PlannerPrefs["variety"]) => {
      const { days } = planDays(
        input({ variety, minutesPerDay: 40 }, { goals }),
      );
      return WEEK.filter((date) =>
        days[date].some((item) => item.kind === "goal"),
      ).length;
    };
    expect(count("steady")).toBe(7);
    expect(count("balanced")).toBe(4);
    expect(count("explore")).toBe(3);
  });

  it("puts the started roadmap step on the calendar", () => {
    const roadmapSteps = [
      {
        roadmapId: "r1",
        roadmapTitle: "Rhythm",
        stepId: "st1",
        title: "Steady eighths",
        exerciseId: "tech-easy-3",
      },
    ];
    const { days } = planDays(input({ minutesPerDay: 40 }, { roadmapSteps }));
    const withStep = WEEK.filter((date) =>
      days[date].some((item) => item.kind === "roadmap"),
    );
    expect(withStep.length).toBe(4);
  });

  it("keeps the player's own and finished slots when filling around them", () => {
    const manual: CalendarItem = {
      id: "m1",
      kind: "custom",
      area: "creativity",
      minutes: 15,
      role: "main",
      auto: false,
      done: false,
      title: "Jam",
    };
    const doneAuto: CalendarItem = {
      ...manual,
      id: "a1",
      auto: true,
      done: true,
      minutes: 10,
    };
    const staleAuto: CalendarItem = {
      ...manual,
      id: "a2",
      auto: true,
      done: false,
    };
    const existing = { "2026-11-02": [manual, doneAuto, staleAuto] };

    const kept = planDays(input({ minutesPerDay: 40 }, { existing }));
    const monday = kept.days["2026-11-02"];
    expect(monday.map((item) => item.id)).toEqual(
      expect.arrayContaining(["m1", "a1"]),
    );
    expect(monday.some((item) => item.id === "a2")).toBe(false);
    expect(minutesOf(monday)).toBe(40);

    const replaced = planDays(
      input({ minutesPerDay: 40, keepManual: false }, { existing }),
    );
    expect(replaced.days["2026-11-02"].some((item) => item.id === "m1")).toBe(
      false,
    );
    expect(replaced.days["2026-11-02"].some((item) => item.id === "a1")).toBe(
      true,
    );
  });

  it("makes one day lighter when asked", () => {
    const { days } = planDays(input({ minutesPerDay: 60, lightDay: true }));
    expect(minutesOf(days["2026-11-04"])).toBe(30);
  });
});

describe("planDays with picked skills", () => {
  const catalog: PlannerExercise[] = [
    { ...exercise("legato-0", "technique", "easy"), relatedSkills: ["legato"] },
    {
      ...exercise("legato-1", "technique", "medium"),
      relatedSkills: ["legato"],
    },
    {
      ...exercise("pick-0", "technique", "easy"),
      relatedSkills: ["alternate_picking"],
    },
    {
      ...exercise("theory-0", "theory", "easy"),
      relatedSkills: ["music_theory"],
    },
    {
      ...exercise("ear-0", "hearing", "easy"),
      relatedSkills: ["ear_training", "legato"],
    },
  ];

  it("only plays exercises that train a picked skill", () => {
    const { days, minutesByArea } = planDays(
      input(
        { skills: ["legato"], warmup: false, minutesPerDay: 40 },
        { catalog, songs: [] },
      ),
    );
    const ids = WEEK.flatMap((date) => days[date]).map(
      (item) => item.exerciseId,
    );
    expect(ids.length).toBeGreaterThan(0);
    ids.forEach((id) => expect(id).toMatch(/legato|ear-0/));
    expect(minutesByArea.theory).toBe(0);
  });
});

describe("difficultyWindow", () => {
  it("moves with level and intensity, within the ladder", () => {
    expect(difficultyWindow("beginner", "steady")).toEqual([
      "beginner",
      "easy",
    ]);
    expect(difficultyWindow("beginner", "light")).toEqual(["beginner", "easy"]);
    expect(difficultyWindow("intermediate", "push")).toEqual([
      "medium",
      "hard",
    ]);
    expect(difficultyWindow("advanced", "push")).toEqual(["medium", "hard"]);
  });
});

describe("areaTargets", () => {
  it("sums to one and drops unavailable areas", () => {
    const targets = areaTargets(DEFAULT_PLANNER_PREFS, {
      technique: true,
      songs: false,
      theory: true,
      hearing: true,
      creativity: true,
    });
    expect(targets.songs).toBe(0);
    const sum = Object.values(targets).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1);
  });
});

describe("pickLightDay", () => {
  it("needs four working days", () => {
    expect(
      pickLightDay(WEEK.slice(0, 3), {
        ...DEFAULT_PLANNER_PREFS,
        lightDay: true,
      }),
    ).toBeNull();
    expect(
      pickLightDay(WEEK, { ...DEFAULT_PLANNER_PREFS, lightDay: false }),
    ).toBeNull();
  });
});
