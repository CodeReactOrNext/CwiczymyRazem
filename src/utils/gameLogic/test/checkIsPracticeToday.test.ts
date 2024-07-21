import { describe, expect, it } from "vitest";
import { checkIsPracticeToday } from "../checkIsPracticeToday";

describe("checkIsPracticeToday", () => {
  it("returns true for today date", () => {
    const mockToday = new Date();
    const isToday = checkIsPracticeToday(mockToday);
    expect(isToday).toBe(true);
  });

  it("returns false for other dates", () => {
    const mockDate = new Date(2000, 1, 1, 13);
    const isToday = checkIsPracticeToday(mockDate);
    expect(isToday).toBe(false);
  });
});

