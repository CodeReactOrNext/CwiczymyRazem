import { describe, expect, it } from "vitest";

import {
  getLastReportInstant,
  isLastReportTimeExceeded,
} from "./isLastReportTimeExceeded";

const HOUR = 60 * 60 * 1000;
const MINUTE = 60 * 1000;

describe("getLastReportInstant", () => {
  it("returns null when the activity log has nothing to offer", () => {
    expect(getLastReportInstant(null)).toBeNull();
    expect(getLastReportInstant(undefined)).toBeNull();
    expect(getLastReportInstant([])).toBeNull();
  });

  it("picks the latest report across days", () => {
    const older = new Date("2026-09-01T18:00:00Z");
    const newer = new Date("2026-09-02T07:05:00Z");

    expect(getLastReportInstant([{ date: newer }, { date: older }])).toBe(
      newer.getTime()
    );
  });

  it("prefers a day's last session over the day entry's first one", () => {
    const first = new Date("2026-09-02T07:05:00Z");
    const last = new Date("2026-09-02T08:46:00Z");

    expect(
      getLastReportInstant([{ date: first, lastActivityDate: last }])
    ).toBe(last.getTime());
  });

  it("accepts ISO strings and skips unparsable entries", () => {
    expect(
      getLastReportInstant([
        { date: "not a date" },
        { date: "2026-09-02T07:05:00Z" },
      ])
    ).toBe(new Date("2026-09-02T07:05:00Z").getTime());
  });
});

describe("isLastReportTimeExceeded", () => {
  it("passes a second report of the day filed well after the first", () => {
    // The bug this guards: `statistics.lastReportDate` is UTC-midnight of the
    // local day, so a UTC+11 user filing a 1h02 session at 09:48 local was told
    // they had exceeded the elapsed time by 02:18. Against the real instant of
    // the previous report — two hours earlier — the entry fits.
    const now = new Date("2026-09-02T09:48:00+11:00").getTime();
    const lastReport = new Date("2026-09-02T07:05:00+11:00").getTime();

    expect(isLastReportTimeExceeded(lastReport, HOUR + 2 * MINUTE, now)).toBe(
      false
    );
  });

  it("returns the excess when the session outruns the elapsed window", () => {
    const now = new Date("2026-09-02T09:00:00Z").getTime();
    const lastReport = new Date("2026-09-02T08:00:00Z").getTime();

    expect(isLastReportTimeExceeded(lastReport, 3 * HOUR, now)).toBe(2 * HOUR);
  });

  it("passes a session exactly filling the elapsed window", () => {
    const now = new Date("2026-09-02T09:00:00Z").getTime();
    const lastReport = new Date("2026-09-02T08:00:00Z").getTime();

    expect(isLastReportTimeExceeded(lastReport, HOUR, now)).toBe(false);
  });

  it("passes when there is no known last report", () => {
    expect(isLastReportTimeExceeded(null, 5 * HOUR)).toBe(false);
    expect(isLastReportTimeExceeded(undefined, 5 * HOUR)).toBe(false);
  });

  it("passes when a skewed clock puts the last report in the future", () => {
    const now = new Date("2026-09-02T09:00:00Z").getTime();
    const lastReport = new Date("2026-09-02T11:00:00Z").getTime();

    expect(isLastReportTimeExceeded(lastReport, HOUR, now)).toBe(false);
  });
});
