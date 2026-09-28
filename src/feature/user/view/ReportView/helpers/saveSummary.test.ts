import { describe, expect, it } from "vitest";

import { buildSaveSummary } from "./saveSummary";

const empty = {
  techniqueHours: "0",
  techniqueMinutes: "0",
  theoryHours: "0",
  theoryMinutes: "0",
  hearingHours: "0",
  hearingMinutes: "0",
  creativityHours: "0",
  creativityMinutes: "0",
  countBackDays: 0,
};

describe("buildSaveSummary", () => {
  it("names the single category and the day", () => {
    expect(buildSaveSummary({ ...empty, techniqueMinutes: "5" })).toBe(
      "5 min · Technique · Today",
    );
  });

  it("splits the total across categories when there are several", () => {
    expect(
      buildSaveSummary({
        ...empty,
        techniqueHours: "1",
        hearingMinutes: "15",
        countBackDays: 1,
      }),
    ).toBe("1h 15m · Technique 1h, Hearing 15 min · Yesterday");
  });

  it("counts days back further than yesterday", () => {
    expect(buildSaveSummary({ ...empty, theoryMinutes: "20", countBackDays: 3 })).toBe(
      "20 min · Theory · 3 days ago",
    );
  });
});
