import { describe, expect, it } from "vitest";

import {
  formatAmount,
  GUILD_METRIC_KEYS,
  GUILD_METRICS,
  isTimeMetric,
  msToHours,
  objectiveLine,
} from "./guildMetrics";

describe("the metric catalog", () => {
  it("counts sessions and sums a report field for everything else", () => {
    expect(isTimeMetric("sessions")).toBe(false);
    expect(GUILD_METRICS.sessions.field).toBeNull();

    GUILD_METRIC_KEYS.filter((metric) => metric !== "sessions").forEach(
      (metric) => {
        expect(isTimeMetric(metric)).toBe(true);
        // Summed straight off the practice report, so a goal is measured
        // rather than incremented.
        expect(GUILD_METRICS[metric].field).toMatch(/^timeSumary\./);
      },
    );
  });
});

describe("msToHours", () => {
  it("states practice in tenths of an hour", () => {
    expect(msToHours(3_600_000)).toBe(1);
    expect(msToHours(5_400_000)).toBe(1.5);
  });

  it("rounds down, so nothing reads as done while it is short", () => {
    // Six minutes under the hour is 0.9h on screen and 0.9h to the goal.
    expect(msToHours(3_599_999)).toBe(0.9);
  });

  it("reads junk and negatives as nothing", () => {
    expect(msToHours(NaN)).toBe(0);
    expect(msToHours(-10_000)).toBe(0);
  });
});

describe("formatAmount", () => {
  it("counts sessions in whole sessions", () => {
    expect(formatAmount("sessions", 1)).toBe("1 session");
    expect(formatAmount("sessions", 4)).toBe("4 sessions");
  });

  it("states time in hours, to one decimal", () => {
    expect(formatAmount("technique", 2)).toBe("2h");
    expect(formatAmount("technique", 1.25)).toBe("1.3h");
  });
});

describe("objectiveLine", () => {
  it("names the category behind an hours goal", () => {
    expect(objectiveLine("technique", 2)).toBe("2h of technique");
    expect(objectiveLine("hearing", 1)).toBe("1h of ear training");
  });

  it("leaves a session goal as the count it is", () => {
    expect(objectiveLine("sessions", 4)).toBe("4 sessions");
  });
});
