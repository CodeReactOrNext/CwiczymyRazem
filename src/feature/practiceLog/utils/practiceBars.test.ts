import { describe, expect, it } from "vitest";

import { buildPracticeBars, formatBarTime, yearMarks } from "./practiceBars";

const MIN = 60_000;
const day = (key: string, minutes: number) => ({
  date: new Date(`${key}T18:00:00`),
  totalTimeMs: minutes * MIN,
});
const end = new Date("2026-11-24T20:30:00");

describe("buildPracticeBars", () => {
  it("shows a new player a whole week of days", () => {
    const { unit, bars } = buildPracticeBars([day("2026-11-24", 5)], end);
    expect(unit).toBe("day");
    expect(bars.map((bar) => bar.totalMs / MIN)).toEqual([0, 0, 0, 0, 0, 0, 5]);
  });

  it("keeps the days without practice between sessions", () => {
    const { unit, bars } = buildPracticeBars(
      [day("2026-11-24", 5), day("2026-11-14", 20)],
      end,
    );
    expect(unit).toBe("day");
    expect(bars).toHaveLength(11);
    expect(bars[0].totalMs).toBe(20 * MIN);
  });

  it("sums Monday-to-Sunday weeks past two weeks", () => {
    const { unit, bars } = buildPracticeBars(
      [
        day("2026-11-23", 10), // Monday
        day("2026-11-22", 7), // Sunday before
        day("2026-11-16", 3), // the same week's Monday
        day("2026-11-02", 1),
      ],
      end,
    );
    expect(unit).toBe("week");
    expect(bars.map((bar) => bar.totalMs / MIN)).toEqual([1, 0, 10, 10]);
  });

  it("moves to months, then years, as the range grows", () => {
    expect(buildPracticeBars([day("2026-05-01", 1)], end)).toMatchObject({
      unit: "month",
      bars: { length: 7 },
    });
    expect(buildPracticeBars([day("2023-01-01", 1)], end)).toMatchObject({
      unit: "year",
      bars: { length: 4 },
    });
  });

  it("ends on the last day of a picked range", () => {
    const { bars } = buildPracticeBars(
      [day("2026-08-10", 4)],
      new Date(2026, 7, 10),
    );
    expect(bars.at(-1)?.totalMs).toBe(4 * MIN);
  });
});

describe("yearMarks", () => {
  it("names the year on the first month and on each January", () => {
    const { unit, bars } = buildPracticeBars([day("2024-12-05", 1)], end);
    expect(unit).toBe("month");
    expect(yearMarks(bars, unit)).toEqual([0, 1, 13]);
  });

  it("stays out of the way within one year", () => {
    const { unit, bars } = buildPracticeBars([day("2026-05-01", 1)], end);
    expect(yearMarks(bars, unit)).toEqual([]);
  });
});

describe("formatBarTime", () => {
  it("stays short enough for a narrow bar", () => {
    expect(formatBarTime(59 * MIN, "en")).toBe("59m");
    expect(formatBarTime(90 * MIN, "en")).toBe("1.5h");
    expect(formatBarTime(90 * MIN, "pl")).toBe("1,5h");
    expect(formatBarTime(240 * MIN, "en")).toBe("4h");
  });
});
