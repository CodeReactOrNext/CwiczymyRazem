import { describe, expect, it } from "vitest";

import { getRankBadgeSrc } from "./guitarImage";

describe("getRankBadgeSrc", () => {
  it("appends the size suffix for special guitar badges", () => {
    expect(getRankBadgeSrc("special/22", "small")).toBe("/static/images/rank/special/22-small.webp");
    expect(getRankBadgeSrc("special/22", "medium")).toBe("/static/images/rank/special/22-medium.webp");
  });

  it("uses the original file for the large variant", () => {
    expect(getRankBadgeSrc("special/22", "large")).toBe("/static/images/rank/special/22.webp");
  });

  it("defaults to the small variant", () => {
    expect(getRankBadgeSrc("special/22")).toBe("/static/images/rank/special/22-small.webp");
  });

  it("never suffixes plain (non-special) rank badges", () => {
    expect(getRankBadgeSrc(5, "small")).toBe("/static/images/rank/5.webp");
    expect(getRankBadgeSrc(5, "large")).toBe("/static/images/rank/5.webp");
  });
});
