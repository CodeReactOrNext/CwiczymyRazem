import { describe, expect, it } from "vitest";

import { getQuestDayKey, isPreMigrationQuestDay } from "./questDay";

/** 2026-09-04T01:05Z — the instant a Los Angeles player finished a 45-minute
 *  evening session, three hours before their own day was over. */
const LA_EVENING = new Date("2026-09-04T01:05:00.000Z");

describe("getQuestDayKey", () => {
  it("keeps a Los Angeles evening on the day the player is living", () => {
    expect(getQuestDayKey("America/Los_Angeles", LA_EVENING)).toBe("2026-09-03");
  });

  it("gives a Warsaw player past midnight the day they have already started", () => {
    expect(getQuestDayKey("Europe/Warsaw", new Date("2026-09-03T23:30:00.000Z"))).toBe(
      "2026-09-04",
    );
  });

  it("does not split a player's day the way the UTC key did", () => {
    const beforeUtcMidnight = getQuestDayKey(
      "America/Los_Angeles",
      new Date("2026-09-03T22:00:00.000Z"),
    );

    expect(beforeUtcMidnight).toBe(getQuestDayKey("America/Los_Angeles", LA_EVENING));
  });

  it("falls back to the device day when the profile carries no usable zone", () => {
    const deviceDay = getQuestDayKey(undefined, LA_EVENING);

    expect(deviceDay).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(getQuestDayKey("Mars/Olympus_Mons", LA_EVENING)).toBe(deviceDay);
  });
});

describe("isPreMigrationQuestDay", () => {
  it("recognises the set a player is holding under the old UTC key", () => {
    expect(isPreMigrationQuestDay("2026-09-04", "2026-09-03", LA_EVENING)).toBe(true);
  });

  it("leaves a genuinely older quest to be redrawn", () => {
    expect(isPreMigrationQuestDay("2026-09-02", "2026-09-03", LA_EVENING)).toBe(false);
  });

  it("says nothing about a quest that already carries today's key", () => {
    expect(isPreMigrationQuestDay("2026-09-03", "2026-09-03", LA_EVENING)).toBe(false);
  });
});
