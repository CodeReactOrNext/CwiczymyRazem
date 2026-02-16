import { describe, expect, it, vi } from "vitest";

import { getUpdatedActualDayWithoutBreak } from "../getUpdatedActualDayWithoutBreak";

describe("getUpdatedActualDayWithoutBreak", () => {
  it("should return the same streak if the user already practiced today", () => {
    const actualDayWithoutBreak = 5;
    const userLastReportDate = new Date(2024, 0, 15);
    const didPracticeToday = true;

    const result = getUpdatedActualDayWithoutBreak(
      actualDayWithoutBreak,
      userLastReportDate,
      didPracticeToday
    );

    expect(result).toBe(5);
  });

  it("should increment the streak if the last report was yesterday", () => {
    const mockToday = new Date(2024, 0, 15);
    vi.setSystemTime(mockToday);

    const actualDayWithoutBreak = 5;
    const userLastReportDate = new Date(2024, 0, 14); // Yesterday
    const didPracticeToday = false;

    const result = getUpdatedActualDayWithoutBreak(
      actualDayWithoutBreak,
      userLastReportDate,
      didPracticeToday
    );

    expect(result).toBe(6);
  });

  it("should reset the streak to 1 if the last report was more than a day ago", () => {
    const mockToday = new Date(2024, 0, 15);
    vi.setSystemTime(mockToday);

    const actualDayWithoutBreak = 5;
    const userLastReportDate = new Date(2024, 0, 13); // 2 days ago
    const didPracticeToday = false;

    const result = getUpdatedActualDayWithoutBreak(
      actualDayWithoutBreak,
      userLastReportDate,
      didPracticeToday
    );

    expect(result).toBe(1);
  });

  it("should handle month boundaries correctly (increment)", () => {
    const mockToday = new Date(2024, 1, 1); // Feb 1st
    vi.setSystemTime(mockToday);

    const actualDayWithoutBreak = 10;
    const userLastReportDate = new Date(2024, 0, 31); // Jan 31st
    const didPracticeToday = false;

    const result = getUpdatedActualDayWithoutBreak(
      actualDayWithoutBreak,
      userLastReportDate,
      didPracticeToday
    );

    expect(result).toBe(11);
  });

  it("should handle year boundaries correctly (increment)", () => {
    const mockToday = new Date(2025, 0, 1); // Jan 1st, 2025
    vi.setSystemTime(mockToday);

    const actualDayWithoutBreak = 365;
    const userLastReportDate = new Date(2024, 11, 31); // Dec 31st, 2024
    const didPracticeToday = false;

    const result = getUpdatedActualDayWithoutBreak(
      actualDayWithoutBreak,
      userLastReportDate,
      didPracticeToday
    );

    expect(result).toBe(366);
  });

  it("should return 1 if last report was today but didPracticeToday is false (unexpected but possible state)", () => {
    const mockToday = new Date(2024, 0, 15);
    vi.setSystemTime(mockToday);

    const actualDayWithoutBreak = 5;
    const userLastReportDate = new Date(2024, 0, 15); // Today
    const didPracticeToday = false;

    const result = getUpdatedActualDayWithoutBreak(
      actualDayWithoutBreak,
      userLastReportDate,
      didPracticeToday
    );

    expect(result).toBe(1);
  });
});
