import { describe, expect, it } from "vitest";

import { getLocalDayKey, getMsUntilNextLocalDay } from "./localDay";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

describe("getMsUntilNextLocalDay", () => {
  it("lands exactly on the player's midnight, not the device's", () => {
    // 21:30 UTC == 23:30 in Warsaw (UTC+2 in September): half an hour left.
    const now = new Date("2026-09-08T21:30:00Z");

    expect(getMsUntilNextLocalDay(now, "Europe/Warsaw")).toBe(30 * 60 * 1000);
  });

  it("gives a Los Angeles player the whole evening the UTC day already spent", () => {
    // Same instant is 14:30 in Los Angeles, so 9.5 hours of their day remain —
    // while the UTC day has only 2.5 hours left.
    const now = new Date("2026-09-08T21:30:00Z");

    expect(getMsUntilNextLocalDay(now, "America/Los_Angeles")).toBe(9.5 * HOUR);
  });

  it("wakes into the next day, never back into the current one", () => {
    const zones = ["Europe/Warsaw", "America/Los_Angeles", "Asia/Kolkata", "UTC"];

    for (const zone of zones) {
      for (let hour = 0; hour < 24; hour++) {
        const now = new Date(Date.UTC(2026, 8, 8, hour, 17));
        const deadline = new Date(now.getTime() + getMsUntilNextLocalDay(now, zone) + 1000);

        expect(getLocalDayKey(deadline, zone)).not.toBe(getLocalDayKey(now, zone));
      }
    }
  });

  it("falls back to the device day when no zone is stored", () => {
    const now = new Date(2026, 8, 8, 23, 30, 0);
    const deadline = new Date(now.getTime() + getMsUntilNextLocalDay(now, undefined));

    expect(deadline.getDate()).toBe(9);
    expect(deadline.getHours()).toBe(0);
    expect(deadline.getMinutes()).toBe(0);
  });

  it("never returns zero, so a caller re-arming on fire cannot spin", () => {
    const midnight = new Date("2026-09-08T22:00:00Z"); // exactly 00:00 in Warsaw

    const ms = getMsUntilNextLocalDay(midnight, "Europe/Warsaw");
    expect(ms).toBeGreaterThan(0);
    expect(ms).toBeLessThanOrEqual(DAY);
  });
});
