import { describe, expect, it } from "vitest";

import { weekEnd, weekStart } from "./utcWeek";

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
