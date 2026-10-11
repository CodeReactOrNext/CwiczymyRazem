import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { describe, expect, it } from "vitest";

import type { LastPracticedMap, RotationItem } from "../types/rotation.types";
import {
  buildRotationPlan,
  CUSTOM_SLOT_MINUTES,
  DAY_MS,
  drawCard,
  emptyLastPracticed,
  getFreshness,
  groupByLevel,
  isSessionPlayable,
  normalizeLink,
  pickSkillExercise,
  ROTATION_SONG_MINUTES,
  rotationKey,
  toRotationEntries,
} from "./rotation.utils";

const NOW = Date.UTC(2026, 9, 11, 12);
const daysAgo = (days: number) => NOW - days * DAY_MS;

const exercise = (id: string, skills: string[], timeInMinutes = 5): Exercise =>
  ({
    id,
    title: id,
    description: "",
    difficulty: "medium",
    category: "technique",
    timeInMinutes,
    instructions: [],
    tips: [],
    metronomeSpeed: null,
    relatedSkills: skills,
  }) as unknown as Exercise;

const CATALOG = [
  exercise("alt-1", ["alternate_picking"]),
  exercise("alt-2", ["alternate_picking"]),
  exercise("legato-1", ["legato"], 8),
];

const lastPlayed = (
  stamps: Partial<{ [K in keyof LastPracticedMap]: Record<string, number> }>,
): LastPracticedMap => ({ ...emptyLastPracticed(), ...stamps });

const item = (
  type: RotationItem["type"],
  id: string,
  addedAt = daysAgo(100),
  extra: Partial<RotationItem> = {},
): RotationItem => ({ type, id, addedAt, ...extra });

describe("getFreshness", () => {
  it("is fresh within a week, cooling after it, rusty from three weeks on", () => {
    const at = (days: number) =>
      getFreshness(
        item("exercise", "x"),
        lastPlayed({ exercise: { x: daysAgo(days) } }),
        NOW,
      ).level;

    expect(at(0)).toBe("fresh");
    expect(at(6)).toBe("fresh");
    expect(at(7)).toBe("cooling");
    expect(at(20)).toBe("cooling");
    expect(at(21)).toBe("rusty");
  });

  it("drains freshness from 1 on the day played to 0 at three weeks", () => {
    const freshnessAt = (days: number) =>
      getFreshness(
        item("song", "s"),
        lastPlayed({ song: { s: daysAgo(days) } }),
        NOW,
      ).freshness;

    expect(freshnessAt(0)).toBe(1);
    expect(freshnessAt(10.5)).toBeCloseTo(0.5);
    expect(freshnessAt(40)).toBe(0);
  });

  it("counts a never-played item from the day it was added, as rusty", () => {
    const result = getFreshness(
      item("skill", "legato", daysAgo(3)),
      emptyLastPracticed(),
      NOW,
    );

    expect(result).toEqual({
      lastPracticedAt: null,
      days: 3,
      level: "rusty",
      freshness: 0,
    });
  });
});

describe("toRotationEntries", () => {
  it("puts never-played first (oldest added first), then the longest-unplayed", () => {
    const entries = toRotationEntries(
      [
        item("song", "recent"),
        item("song", "new-late", daysAgo(1)),
        item("song", "old"),
        item("song", "new-early", daysAgo(5)),
      ],
      lastPlayed({ song: { recent: daysAgo(2), old: daysAgo(30) } }),
      NOW,
    );

    expect(entries.map((entry) => entry.item.id)).toEqual([
      "new-early",
      "new-late",
      "old",
      "recent",
    ]);
  });

  it("groups by level, keeping the stalest-first order inside each group", () => {
    const groups = groupByLevel(
      toRotationEntries(
        [item("song", "a"), item("song", "b"), item("song", "c")],
        lastPlayed({ song: { a: daysAgo(1), b: daysAgo(10), c: daysAgo(3) } }),
        NOW,
      ),
    );

    expect(groups.rusty).toEqual([]);
    expect(groups.cooling.map((entry) => entry.item.id)).toEqual(["b"]);
    expect(groups.fresh.map((entry) => entry.item.id)).toEqual(["c", "a"]);
  });
});

describe("drawCard", () => {
  const entries = toRotationEntries(
    [item("song", "stale"), item("song", "fresh")],
    lastPlayed({ song: { stale: daysAgo(59), fresh: daysAgo(0) } }),
    NOW,
  );

  it("leans towards what has gone stale", () => {
    // Weights 60 (stale) and 1 (fresh): almost the whole roll lands on stale.
    expect(drawCard(entries, () => 0.5)?.item.id).toBe("stale");
    expect(drawCard(entries, () => 0.999)?.item.id).toBe("fresh");
  });

  it("never deals the same card twice running when there is another", () => {
    expect(drawCard(entries, () => 0, "song:stale")?.item.id).toBe("fresh");
  });

  it("deals the only card again, and nothing from an empty deck", () => {
    expect(drawCard(entries.slice(0, 1), () => 0, "song:stale")?.item.id).toBe(
      "stale",
    );
    expect(drawCard([], () => 0)).toBeNull();
  });
});

describe("pickSkillExercise", () => {
  it("plays the exercise of the skill that was played least recently", () => {
    const picked = pickSkillExercise(
      "alternate_picking",
      CATALOG,
      lastPlayed({ exercise: { "alt-1": daysAgo(1), "alt-2": daysAgo(9) } }),
    );

    expect(picked?.id).toBe("alt-2");
  });

  it("picks at random among equally stale ones", () => {
    const pick = (roll: number) =>
      pickSkillExercise(
        "alternate_picking",
        CATALOG,
        emptyLastPracticed(),
        () => roll,
      )?.id;

    expect(pick(0)).toBe("alt-1");
    expect(pick(0.99)).toBe("alt-2");
  });

  it("skips exercises already in the session while it has others", () => {
    const exclude = new Set(["alt-2"]);
    expect(
      pickSkillExercise(
        "alternate_picking",
        CATALOG,
        emptyLastPracticed(),
        () => 0.99,
        exclude,
      )?.id,
    ).toBe("alt-1");
    expect(
      pickSkillExercise(
        "legato",
        CATALOG,
        emptyLastPracticed(),
        () => 0,
        new Set(["legato-1"]),
      )?.id,
    ).toBe("legato-1");
  });

  it("returns null for a skill nothing trains", () => {
    expect(
      pickSkillExercise("tapping", CATALOG, emptyLastPracticed()),
    ).toBeNull();
  });
});

describe("buildRotationPlan", () => {
  it("turns songs, exercises and skills into one session", () => {
    const plan = buildRotationPlan(
      [
        item("song", "s1", NOW, {
          title: "Fade to Black",
          artist: "Metallica",
        }),
        item("exercise", "legato-1"),
        item("skill", "alternate_picking"),
      ],
      CATALOG,
      emptyLastPracticed(),
      NOW,
      () => 0,
    );

    expect(plan?.id).toBe(`rotation-${NOW}`);
    expect(plan?.exercises.map((entry) => entry.id)).toEqual([
      "song-s1",
      "legato-1",
      "alt-1",
    ]);
    expect(plan?.exercises[0].songData).toMatchObject({
      songId: "s1",
      title: "Fade to Black",
      artist: "Metallica",
    });
    expect(plan?.exercises[0].timeInMinutes).toBe(ROTATION_SONG_MINUTES);
  });

  it("lets a skill pick another drill than an exercise already in the session", () => {
    const plan = buildRotationPlan(
      [item("exercise", "alt-1"), item("skill", "alternate_picking")],
      CATALOG,
      emptyLastPracticed(),
      NOW,
      () => 0,
    );

    expect(plan?.exercises.map((entry) => entry.id)).toEqual([
      "alt-1",
      "alt-2",
    ]);
  });

  it("leaves out what no longer resolves, and gives up when nothing does", () => {
    expect(
      buildRotationPlan(
        [item("exercise", "removed-from-catalog"), item("skill", "tapping")],
        CATALOG,
        emptyLastPracticed(),
        NOW,
      ),
    ).toBeNull();
  });
});

describe("rotationKey", () => {
  it("keeps the same id apart across types", () => {
    expect(rotationKey({ type: "song", id: "x" })).not.toBe(
      rotationKey({ type: "exercise", id: "x" }),
    );
  });
});

describe("custom items", () => {
  const course = item("custom", "c1", NOW, {
    title: "Blues course: lesson 4",
    note: "Turnaround at 80 BPM",
    link: "https://www.justinguitar.com/lesson-4",
    category: "theory",
    timer: true,
  });
  const habit = item("custom", "c2", NOW, { title: "Restring the guitar" });

  it("plays only the timed ones in a session", () => {
    expect(isSessionPlayable(course)).toBe(true);
    expect(isSessionPlayable(habit)).toBe(false);
    expect(isSessionPlayable(item("song", "s"))).toBe(true);
  });

  it("gives a timed one a slot of its own, with its note and link", () => {
    const plan = buildRotationPlan(
      [habit, course, item("exercise", "legato-1")],
      CATALOG,
      emptyLastPracticed(),
      NOW,
    );

    expect(plan?.exercises.map((entry) => entry.id)).toEqual([
      "rotation-custom-c1",
      "legato-1",
    ]);
    expect(plan?.exercises[0]).toMatchObject({
      title: "Blues course: lesson 4",
      category: "theory",
      timeInMinutes: CUSTOM_SLOT_MINUTES,
      instructions: ["Turnaround at 80 BPM"],
      links: [
        {
          label: "justinguitar.com",
          url: "https://www.justinguitar.com/lesson-4",
        },
      ],
    });
  });

  it("reads its freshness from its own stamps", () => {
    expect(
      getFreshness(course, lastPlayed({ custom: { c1: daysAgo(2) } }), NOW)
        .level,
    ).toBe("fresh");
  });
});

describe("normalizeLink", () => {
  it("adds https:// to a bare address and keeps full web links", () => {
    expect(normalizeLink("justinguitar.com/lessons")).toBe(
      "https://justinguitar.com/lessons",
    );
    expect(normalizeLink(" http://example.com/a ")).toBe(
      "http://example.com/a",
    );
  });

  it("refuses anything that isn't a web link", () => {
    expect(normalizeLink("")).toBeNull();
    expect(normalizeLink("lesson 4")).toBeNull();
    expect(normalizeLink("javascript:alert(1)")).toBeNull();
    expect(normalizeLink("ftp://example.com")).toBeNull();
  });
});
