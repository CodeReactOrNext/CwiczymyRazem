import { describe, expect, it } from "vitest";

import { formatSeasonMonth, summarizeSeasonFinishes } from "./seasonFinishes";

describe("formatSeasonMonth", () => {
  it("names the month and year in the given language", () => {
    expect(formatSeasonMonth("2026-10", "en-US")).toBe("October 2026");
    expect(formatSeasonMonth("2026-01", "en-US")).toBe("January 2026");
    expect(formatSeasonMonth("2026-10", "pl-PL")).toMatch(/październik 2026/i);
  });

  it("accepts a month without a leading zero", () => {
    expect(formatSeasonMonth("2026-3", "en-US")).toBe("March 2026");
  });

  it("leaves anything that is not a year and a month as it was", () => {
    expect(formatSeasonMonth("summer-cup", "en-US")).toBe("summer-cup");
    expect(formatSeasonMonth("2026-13", "en-US")).toBe("2026-13");
    expect(formatSeasonMonth("2026-00", "en-US")).toBe("2026-00");
  });
});

describe("summarizeSeasonFinishes", () => {
  it("finds the best place and counts the top-10 finishes", () => {
    expect(
      summarizeSeasonFinishes([{ place: 7 }, { place: 2 }, { place: 3 }]),
    ).toEqual({ bestPlace: 2, topTenCount: 3 });
  });

  it("does not count places outside the top 10", () => {
    expect(summarizeSeasonFinishes([{ place: 12 }, { place: 4 }])).toEqual({
      bestPlace: 4,
      topTenCount: 1,
    });
  });

  it("has no best place without finishes", () => {
    expect(summarizeSeasonFinishes([])).toEqual({
      bestPlace: null,
      topTenCount: 0,
    });
  });
});
