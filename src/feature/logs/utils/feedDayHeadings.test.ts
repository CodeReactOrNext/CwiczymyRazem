import { describe, expect, it } from "vitest";

import { formatFeedDay, getFeedDayHeadings } from "./feedDayHeadings";

const at = (day: number, hour: number) =>
  new Date(2026, 10, day, hour, 0, 0).getTime();

const NOW = at(20, 15);

describe("formatFeedDay", () => {
  it("names today and yesterday in the viewer's language", () => {
    expect(formatFeedDay(at(20, 9), NOW, "en")).toBe("today");
    expect(formatFeedDay(at(19, 23), NOW, "en")).toBe("yesterday");
    expect(formatFeedDay(at(19, 23), NOW, "pl")).toBe("wczoraj");
  });

  it("counts calendar days, not 24-hour spans", () => {
    // 16 hours ago, but on the previous date.
    expect(formatFeedDay(at(19, 23), at(20, 1), "en")).toBe("yesterday");
  });

  it("uses the weekday and date for anything older", () => {
    expect(formatFeedDay(at(17, 12), NOW, "en")).toBe("Tuesday, November 17");
  });

  it("never reads a clock running ahead as tomorrow", () => {
    expect(formatFeedDay(at(21, 1), NOW, "en")).toBe("today");
  });
});

describe("getFeedDayHeadings", () => {
  it("names each earlier day once and leaves today unnamed", () => {
    expect(
      getFeedDayHeadings(
        [at(20, 14), at(20, 9), at(19, 22), at(19, 8), at(17, 12)],
        NOW,
        "en",
      ),
    ).toEqual([null, null, "yesterday", null, "Tuesday, November 17"]);
  });

  it("skips entries without a timestamp and keeps the day running", () => {
    expect(
      getFeedDayHeadings([null, at(19, 14), null, at(19, 9)], NOW, "en"),
    ).toEqual([null, "yesterday", null, null]);
  });

  it("gives a malformed timestamp no heading", () => {
    expect(getFeedDayHeadings([Number.NaN, at(19, 9)], NOW, "en")).toEqual([
      null,
      "yesterday",
    ]);
  });
});
