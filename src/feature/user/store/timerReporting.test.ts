import { describe, expect, it } from "vitest";

import { subtractReportedTime } from "./timerReporting";

describe("subtractReportedTime", () => {
  it("takes the reported minutes out of the tracked time", () => {
    expect(subtractReportedTime(10 * 60 * 1000, "0", "3")).toBe(7 * 60 * 1000);
  });

  it("handles hours as well as minutes", () => {
    expect(subtractReportedTime(2 * 60 * 60 * 1000, "1", "30")).toBe(30 * 60 * 1000);
  });

  it("empties the timer when the report covered all of it", () => {
    expect(subtractReportedTime(5 * 60 * 1000, "0", "5")).toBe(0);
  });

  it("never goes negative when the report claims more than was tracked", () => {
    expect(subtractReportedTime(3 * 60 * 1000, "0", "45")).toBe(0);
  });

  it("drops a sub-minute remainder left by the report's rounding", () => {
    // 3 min 20 s tracked, reported as 3 min — the 20 s must not survive into
    // the next report.
    expect(subtractReportedTime(3 * 60 * 1000 + 20_000, "0", "3")).toBe(0);
  });

  it("keeps time the report did not touch", () => {
    // The case this fixes: a technique-only session must leave the theory
    // minutes from an abandoned scale drill untouched.
    expect(subtractReportedTime(3 * 60 * 1000, "0", "0")).toBe(3 * 60 * 1000);
  });

  it("treats missing report fields as nothing reported", () => {
    expect(subtractReportedTime(4 * 60 * 1000)).toBe(4 * 60 * 1000);
    expect(subtractReportedTime(4 * 60 * 1000, "", "")).toBe(4 * 60 * 1000);
  });
});
