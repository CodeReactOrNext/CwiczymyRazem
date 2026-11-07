import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { buildDayPlan } from "feature/practiceCalendar/utils/calendarItems";
import type {
  NextSessionItem,
  RankedAction,
} from "feature/whatNext/types/whatNext.types";
import { describe, expect, it } from "vitest";

import { pickSessionItems, toCalendarItems } from "./buildSession";

const ranked = (id: string, sessionItem?: NextSessionItem): RankedAction => ({
  id,
  source: "goals",
  kind: "continue",
  isPractice: true,
  title: { key: id },
  href: "/",
  score: 1,
  ...(sessionItem && { sessionItem }),
});

const exercise = (id: string, minutes = 10): NextSessionItem => ({
  kind: "exercise",
  exerciseId: id,
  minutes,
});

describe("pickSessionItems", () => {
  it("packs the top of the road into the time asked for", () => {
    const picks = pickSessionItems(
      [
        ranked("a", exercise("e1")),
        ranked("b", exercise("e2")),
        ranked("c", exercise("e3")),
      ],
      20,
    );
    expect(picks.map((p) => p.item.minutes)).toEqual([10, 10]);
  });

  it("skips actions that cannot be played and repeats nothing", () => {
    const picks = pickSessionItems(
      [
        ranked("a", exercise("e1")),
        ranked("b"),
        ranked("c", exercise("e1")),
        ranked("d", exercise("e2")),
      ],
      30,
    );
    expect(picks.map((p) => p.actionId)).toEqual(["a", "d"]);
  });

  it("shortens the last slot to fit and gives spare time to the first", () => {
    const shortened = pickSessionItems(
      [ranked("a", exercise("e1")), ranked("b", exercise("e2", 15))],
      18,
    );
    expect(shortened.map((p) => p.item.minutes)).toEqual([10, 8]);

    const spare = pickSessionItems([ranked("a", exercise("e1"))], 15);
    expect(spare.map((p) => p.item.minutes)).toEqual([15]);
  });
});

describe("toCalendarItems", () => {
  it("builds slots the calendar can turn into a session", () => {
    const catalog = new Map<string, Exercise>([
      [
        "e1",
        {
          id: "e1",
          title: "Spider",
          description: "",
          difficulty: "easy",
          category: "technique",
          timeInMinutes: 5,
          instructions: [],
          tips: [],
          metronomeSpeed: { min: 40, max: 200, recommended: 80 },
          relatedSkills: [],
        } as Exercise,
      ],
    ]);
    const items = toCalendarItems(
      pickSessionItems(
        [
          ranked("goal", {
            kind: "goal",
            exerciseId: "e1",
            goalId: "g1",
            bpm: 110,
            minutes: 10,
          }),
          ranked("song", {
            kind: "song",
            song: { id: "s1", title: "Song", artist: "A" },
            minutes: 10,
          }),
        ],
        20,
      ),
      () => "technique",
    );
    expect(items.map((i) => [i.kind, i.area])).toEqual([
      ["goal", "technique"],
      ["song", "songs"],
    ]);

    const plan = buildDayPlan("2026-11-07", items, catalog);
    expect(plan?.exercises).toHaveLength(2);
    expect(plan?.exercises[0].metronomeSpeed?.recommended).toBe(110);
  });
});
