import type { CalendarItem } from "feature/practiceCalendar/types/calendar.types";
import { describe, expect, it } from "vitest";

import { buildDaySlots, dateProblem, isRealDateKey } from "./calendarDays";

const slot = (over: Partial<CalendarItem>): CalendarItem => ({
  id: "s1",
  kind: "exercise",
  area: "technique",
  minutes: 10,
  role: "main",
  auto: true,
  done: false,
  ...over,
});

const ids = () => {
  let n = 0;
  return () => `new-${++n}`;
};

describe("buildDaySlots", () => {
  it("lays out new slots in order, as the player's own", () => {
    const result = buildDaySlots(
      [],
      [
        {
          type: "new",
          draft: {
            kind: "exercise",
            area: "technique",
            minutes: 5,
            role: "warmup",
            exerciseId: "spider",
          },
        },
        {
          type: "new",
          draft: {
            kind: "custom",
            area: "theory",
            minutes: 15,
            role: "main",
            title: "Modes",
          },
        },
      ],
      ids(),
    );
    expect(result).toEqual({
      items: [
        expect.objectContaining({
          id: "new-1",
          exerciseId: "spider",
          auto: false,
          done: false,
          role: "warmup",
        }),
        expect.objectContaining({
          id: "new-2",
          title: "Modes",
          auto: false,
          done: false,
        }),
      ],
    });
  });

  it("keeps the id and tick of a slot that plays the same thing", () => {
    const existing = [
      slot({ id: "a", exerciseId: "spider", done: true }),
      slot({
        id: "b",
        kind: "song",
        area: "songs",
        song: { id: "song-1", title: "T", artist: "A" },
        done: true,
      }),
    ];
    const result = buildDaySlots(
      existing,
      [
        {
          type: "new",
          draft: {
            kind: "song",
            area: "songs",
            minutes: 20,
            role: "main",
            song: { id: "song-1", title: "T", artist: "A" },
          },
        },
        {
          type: "new",
          draft: {
            kind: "exercise",
            area: "technique",
            minutes: 30,
            role: "main",
            exerciseId: "spider",
          },
        },
        {
          type: "new",
          draft: {
            kind: "exercise",
            area: "technique",
            minutes: 5,
            role: "main",
            exerciseId: "spider",
          },
        },
      ],
      ids(),
    );
    if ("error" in result) throw new Error(result.error);
    expect(
      result.items.map((item) => [item.id, item.done, item.minutes]),
    ).toEqual([
      ["b", true, 20],
      ["a", true, 30],
      // A second copy has nothing left to match.
      ["new-1", false, 5],
    ]);
  });

  it("keeps a slot by id, optionally at a new length", () => {
    const goal = slot({
      id: "g",
      kind: "goal",
      exerciseId: "x",
      bpm: 120,
      done: true,
    });
    const result = buildDaySlots(
      [goal],
      [{ type: "keep", slotId: "g", minutes: 25 }],
      ids(),
    );
    expect(result).toEqual({ items: [{ ...goal, minutes: 25 }] });
  });

  it("refuses a slot that isn't on the day, or one kept twice", () => {
    expect(
      buildDaySlots([], [{ type: "keep", slotId: "nope" }], ids()),
    ).toEqual({
      error: 'No slot "nope" on that day.',
    });
    expect(
      buildDaySlots(
        [slot({ id: "a" })],
        [
          { type: "keep", slotId: "a" },
          { type: "keep", slotId: "a" },
        ],
        ids(),
      ),
    ).toEqual({ error: "The same slotId is kept twice." });
  });

  it("does not hand a kept slot's id to a new one", () => {
    const result = buildDaySlots(
      [slot({ id: "a", exerciseId: "spider", done: true })],
      [
        { type: "keep", slotId: "a" },
        {
          type: "new",
          draft: {
            kind: "exercise",
            area: "technique",
            minutes: 5,
            role: "main",
            exerciseId: "spider",
          },
        },
      ],
      ids(),
    );
    if ("error" in result) throw new Error(result.error);
    expect(result.items.map((item) => item.id)).toEqual(["a", "new-1"]);
  });

  it("clears a day with no slots", () => {
    expect(buildDaySlots([slot({})], [], ids())).toEqual({ items: [] });
  });
});

describe("calendar dates", () => {
  it("accepts only real days", () => {
    expect(isRealDateKey("2026-11-05")).toBe(true);
    expect(isRealDateKey("2026-02-30")).toBe(false);
    expect(isRealDateKey("2026-1-5")).toBe(false);
  });

  it("keeps writes within the window around today", () => {
    expect(dateProblem("2026-11-12", "2026-11-05")).toBeNull();
    expect(dateProblem("2026-10-01", "2026-11-05")).toMatch(/days ago/);
    expect(dateProblem("2027-06-01", "2026-11-05")).toMatch(/days ahead/);
  });
});
