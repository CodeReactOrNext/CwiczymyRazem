import { describe, expect, it } from "vitest";

import {
  daysBetweenDayKeys,
  getHoursUntilLocalMidnight,
  getLocalDayKey,
  getReminderHourUtc,
  isValidTimeZone,
} from "../localDay";

describe("isValidTimeZone", () => {
  it("accepts IANA zones and rejects junk", () => {
    expect(isValidTimeZone("Europe/Warsaw")).toBe(true);
    expect(isValidTimeZone("UTC")).toBe(true);
    expect(isValidTimeZone("Nowhere/Fake")).toBe(false);
    expect(isValidTimeZone("")).toBe(false);
    expect(isValidTimeZone(undefined)).toBe(false);
  });
});

describe("getLocalDayKey", () => {
  it("uses the calendar day of the given zone, not of UTC", () => {
    // 22:30 UTC — already tomorrow in Warsaw, still today in New York.
    const instant = new Date("2026-08-16T22:30:00Z");

    expect(getLocalDayKey(instant, "UTC")).toBe("2026-08-16");
    expect(getLocalDayKey(instant, "Europe/Warsaw")).toBe("2026-08-17");
    expect(getLocalDayKey(instant, "America/New_York")).toBe("2026-08-16");
    expect(getLocalDayKey(instant, "Pacific/Auckland")).toBe("2026-08-17");
  });

  it("pads single-digit months and days", () => {
    expect(getLocalDayKey(new Date("2026-01-05T12:00:00Z"), "UTC")).toBe(
      "2026-01-05"
    );
  });

  it("falls back to the host calendar when the zone is unusable", () => {
    const instant = new Date(2026, 7, 16, 12, 0, 0);
    expect(getLocalDayKey(instant, "Nowhere/Fake")).toBe("2026-08-16");
    expect(getLocalDayKey(instant)).toBe("2026-08-16");
  });
});

describe("daysBetweenDayKeys", () => {
  it("counts whole calendar days", () => {
    expect(daysBetweenDayKeys("2026-08-15", "2026-08-16")).toBe(1);
    expect(daysBetweenDayKeys("2026-08-13", "2026-08-16")).toBe(3);
    expect(daysBetweenDayKeys("2026-08-16", "2026-08-16")).toBe(0);
  });

  it("crosses month and year boundaries", () => {
    expect(daysBetweenDayKeys("2026-07-31", "2026-08-01")).toBe(1);
    expect(daysBetweenDayKeys("2025-12-31", "2026-01-01")).toBe(1);
  });

  it("is unaffected by a DST transition inside the range", () => {
    // Europe switches on 2026-10-25; the keys carry no offset, so the count
    // must not gain or lose the hour.
    expect(daysBetweenDayKeys("2026-10-24", "2026-10-25")).toBe(1);
  });

  it("goes negative for a future day and null for junk", () => {
    expect(daysBetweenDayKeys("2026-08-17", "2026-08-16")).toBe(-1);
    expect(daysBetweenDayKeys("nope", "2026-08-16")).toBeNull();
  });
});

describe("getReminderHourUtc", () => {
  const summer = new Date("2026-08-16T12:00:00Z"); // Warsaw = UTC+2
  const winter = new Date("2026-01-16T12:00:00Z"); // Warsaw = UTC+1

  it("maps the local hour back to UTC", () => {
    expect(getReminderHourUtc("UTC", 19, summer)).toBe(19);
    expect(getReminderHourUtc("Europe/Warsaw", 19, summer)).toBe(17);
    expect(getReminderHourUtc("America/New_York", 19, summer)).toBe(23);
  });

  it("tracks DST, since it is recomputed on every report", () => {
    expect(getReminderHourUtc("Europe/Warsaw", 19, winter)).toBe(18);
  });

  it("wraps around midnight instead of going out of range", () => {
    // Auckland is UTC+12 in August: 19:00 local is 07:00 UTC the same day.
    expect(getReminderHourUtc("Pacific/Auckland", 19, summer)).toBe(7);
    // Los Angeles is UTC-7: 19:00 local is 02:00 UTC the next day.
    expect(getReminderHourUtc("America/Los_Angeles", 19, summer)).toBe(2);
  });

  it("rounds half-hour zones to the nearest hour", () => {
    // Kolkata is UTC+5:30 — 19:00 local is 13:30 UTC, rounded up to 14.
    expect(getReminderHourUtc("Asia/Kolkata", 19, summer)).toBe(14);
  });

  it("buckets unknown zones into the default hour", () => {
    expect(getReminderHourUtc(null, 19, summer)).toBe(10);
    expect(getReminderHourUtc("Nowhere/Fake", 19, summer)).toBe(10);
  });
});

describe("getHoursUntilLocalMidnight", () => {
  it("measures against the reader's midnight, not the server's", () => {
    // 17:00 UTC = 19:00 in Warsaw (5h left), 13:00 in New York (11h left).
    const instant = new Date("2026-08-16T17:00:00Z");

    expect(getHoursUntilLocalMidnight(instant, "Europe/Warsaw")).toBe(5);
    expect(getHoursUntilLocalMidnight(instant, "America/New_York")).toBe(11);
    expect(getHoursUntilLocalMidnight(instant, "UTC")).toBe(7);
  });

  it("floors rather than rounds up, so it never overpromises", () => {
    // 19:05 local leaves 4h55m — "5 hours" would be a deadline that isn't there.
    const instant = new Date("2026-08-16T17:05:00Z");
    expect(getHoursUntilLocalMidnight(instant, "Europe/Warsaw")).toBe(4);
  });

  it("never reports zero hours left", () => {
    const instant = new Date("2026-08-16T21:50:00Z"); // 23:50 in Warsaw
    expect(getHoursUntilLocalMidnight(instant, "Europe/Warsaw")).toBe(1);
  });

  it("returns null when the zone is unknown", () => {
    expect(getHoursUntilLocalMidnight(new Date(), null)).toBeNull();
    expect(getHoursUntilLocalMidnight(new Date(), "Nowhere/Fake")).toBeNull();
  });
});
