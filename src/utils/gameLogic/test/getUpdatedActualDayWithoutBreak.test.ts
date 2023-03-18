import { describe, expect, it, vi } from "vitest";
import { getUpdatedActualDayWithoutBreak } from "../getUpdatedActualDayWithoutBreak";

describe("getUpdatedActualDayWithouyBreak", () => {
  it("return 1 if you don't practice today", () => {
    const actualDayWithoutBreak = 5;
    const userLastReportDate = new Date(2000, 1, 1, 13);
    const didPracticeToday = false;
    const expectedUpdatedActualDayWithoutBreak = 1;
    const updatedActualDayWithoutBreak = getUpdatedActualDayWithoutBreak(
      actualDayWithoutBreak,
      userLastReportDate,
      didPracticeToday
    );

    expect(updatedActualDayWithoutBreak).toBe(
      expectedUpdatedActualDayWithoutBreak
    );
  });
  it("return actualDayWithoutBreak if you already practice today", () => {
    const actualDayWithoutBreak = 5;
    const userLastReportDate = new Date(2000, 1, 1, 13);
    const didPracticeToday = true;
    const expectedUpdatedActualDayWithoutBreak = 5;
    const updatedActualDayWithoutBreak = getUpdatedActualDayWithoutBreak(
      actualDayWithoutBreak,
      userLastReportDate,
      didPracticeToday
    );

    expect(updatedActualDayWithoutBreak).toBe(
      expectedUpdatedActualDayWithoutBreak
    );
  });
  it("return updated actualDayWithoutBreak if you practice today", () => {
    const mockDate = new Date(2000, 1, 20);
    vi.setSystemTime(mockDate);
    const actualDayWithoutBreak = 5;
    const userLastReportDate = new Date(2000, 1, 19);
    const didPracticeToday = false;
    const expectedUpdatedActualDayWithoutBreak = 6;
    const updatedActualDayWithoutBreak = getUpdatedActualDayWithoutBreak(
      actualDayWithoutBreak,
      userLastReportDate,
      didPracticeToday
    );

    expect(updatedActualDayWithoutBreak).toBe(
      expectedUpdatedActualDayWithoutBreak
    );
  });
});
