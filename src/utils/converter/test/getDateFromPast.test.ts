import { describe, expect, it, vi } from "vitest";

import { getDateFromPast } from "../getDateFromPast";

describe("reportHandler", () => {
  it("returns the date from the given days back", () => {
    const mockDate = new Date(2000, 1, 20);
    const expectedDate = new Date(2000, 1, 15);
    vi.setSystemTime(mockDate);
    const dateFromPast = getDateFromPast(5);
    expect(dateFromPast).toStrictEqual(expectedDate);
  });
});
