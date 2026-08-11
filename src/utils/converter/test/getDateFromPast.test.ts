import { afterEach,describe, expect, it, vi } from "vitest";

import { getDateFromPast } from "../getDateFromPast";

describe("getDateFromPast", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns the date from the given days back", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2000, 1, 20));

    // Built after the clock is faked so both dates come from the same Date
    // implementation — toStrictEqual compares prototypes, not just the value.
    const expectedDate = new Date(2000, 1, 15);

    expect(getDateFromPast(5)).toStrictEqual(expectedDate);
  });

  it("counts back from an explicit base date instead of today", () => {
    expect(getDateFromPast(5, new Date(2000, 1, 20))).toStrictEqual(
      new Date(2000, 1, 15)
    );
  });

  it("rolls back over a month boundary", () => {
    expect(getDateFromPast(5, new Date(2000, 2, 3))).toStrictEqual(
      new Date(2000, 1, 27)
    );
  });
});
