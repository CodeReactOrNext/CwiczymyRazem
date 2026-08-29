import { describe, expect, it } from "vitest";

import {
  msToHours,
  nextWeekId,
  previousWeekId,
  weekEnd,
  weekIdOf,
  weekStart,
} from "./goalWeek";

describe("weekStart", () => {
  it("snaps back to Monday", () => {
    // 2026-08-28 is a Friday.
    expect(weekStart(new Date("2026-08-28T15:00:00.000Z")).toISOString()).toBe(
      "2026-08-24T00:00:00.000Z",
    );
  });

  it("keeps Sunday in the week that already started", () => {
    // The classic off-by-one: Sunday is day 0, not the start of a new week.
    expect(weekStart(new Date("2026-08-30T23:59:00.000Z")).toISOString()).toBe(
      "2026-08-24T00:00:00.000Z",
    );
    expect(weekStart(new Date("2026-08-31T00:00:00.000Z")).toISOString()).toBe(
      "2026-08-31T00:00:00.000Z",
    );
  });

  it("is idempotent on a Monday", () => {
    const monday = new Date("2026-08-24T00:00:00.000Z");
    expect(weekStart(weekStart(monday)).toISOString()).toBe(
      monday.toISOString(),
    );
  });
});

describe("weekEnd", () => {
  it("lands on the next Monday, so the window never overlaps", () => {
    expect(weekEnd(new Date("2026-08-28T15:00:00.000Z")).toISOString()).toBe(
      "2026-08-31T00:00:00.000Z",
    );
  });
});

describe("weekIdOf", () => {
  it("gives every day of one week the same id", () => {
    const id = weekIdOf(new Date("2026-08-24T00:00:00.000Z"));
    expect(weekIdOf(new Date("2026-08-28T15:00:00.000Z"))).toBe(id);
    expect(weekIdOf(new Date("2026-08-30T23:59:00.000Z"))).toBe(id);
  });

  it("changes on the Monday", () => {
    expect(weekIdOf(new Date("2026-08-30T23:59:00.000Z"))).not.toBe(
      weekIdOf(new Date("2026-08-31T00:01:00.000Z")),
    );
  });

  it("sorts in the order the weeks happened", () => {
    const ids = ["2026-01-05", "2026-03-02", "2026-08-24", "2026-12-28"].map(
      (day) => weekIdOf(new Date(`${day}T00:00:00.000Z`)),
    );

    expect([...ids].sort()).toEqual(ids);
  });
});

describe("neighbouring weeks", () => {
  const friday = new Date("2026-08-28T15:00:00.000Z");

  it("steps back exactly one week", () => {
    expect(previousWeekId(friday)).toBe(
      weekIdOf(new Date("2026-08-17T12:00:00.000Z")),
    );
  });

  it("steps forward exactly one week", () => {
    expect(nextWeekId(friday)).toBe(
      weekIdOf(new Date("2026-09-02T12:00:00.000Z")),
    );
  });
});

describe("msToHours", () => {
  it("reports whole hours of practice", () => {
    expect(msToHours(3_600_000)).toBe(1);
    expect(msToHours(5_400_000)).toBe(1);
    expect(msToHours(0)).toBe(0);
  });

  it("survives junk out of Firestore", () => {
    expect(msToHours(NaN)).toBe(0);
    expect(msToHours(-1000)).toBe(0);
  });
});
