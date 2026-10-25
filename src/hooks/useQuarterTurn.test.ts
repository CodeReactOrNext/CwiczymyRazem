import { describe, expect, it } from "vitest";

import { fractionAlongX } from "./useQuarterTurn";

const rect = { left: 100, top: 50, width: 200, height: 400 };

describe("fractionAlongX", () => {
  it("measures across the box when upright", () => {
    expect(fractionAlongX(rect, { clientX: 150, clientY: 999 }, false)).toBe(0.25);
  });

  it("measures down the box when turned a quarter clockwise", () => {
    expect(fractionAlongX(rect, { clientX: 999, clientY: 150 }, true)).toBe(0.25);
  });

  it("clamps a pointer past either end", () => {
    expect(fractionAlongX(rect, { clientX: 0, clientY: 0 }, false)).toBe(0);
    expect(fractionAlongX(rect, { clientX: 0, clientY: 9999 }, true)).toBe(1);
  });
});
