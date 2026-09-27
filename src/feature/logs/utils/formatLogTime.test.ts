import { describe, expect, it } from "vitest";

import { formatLogTime } from "./formatLogTime";

const now = new Date("2026-09-27T12:00:00Z");
const offset = (ms: number) => new Date(now.getTime() + ms);

describe("formatLogTime", () => {
  it("reads a log from the last minute as just now", () => {
    expect(formatLogTime(offset(-20 * 1000), now)).toBe("just now");
  });

  it("never shows a future time when the server clock runs ahead", () => {
    expect(formatLogTime(offset(30 * 1000), now)).toBe("just now");
    expect(formatLogTime(offset(5 * 60 * 1000), now)).toBe("just now");
  });

  it("falls back to a relative distance for older logs", () => {
    expect(formatLogTime(offset(-2 * 60 * 1000), now)).toBe("2 minutes ago");
  });
});
