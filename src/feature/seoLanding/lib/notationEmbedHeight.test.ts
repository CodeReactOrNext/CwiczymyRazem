import { describe, expect, it } from "vitest";

import { notationEmbedHeightPx } from "./notationEmbedHeight";

describe("notationEmbedHeightPx", () => {
  it("reserves the same height for an empty and a single-system drill", () => {
    expect(notationEmbedHeightPx(0)).toBe(notationEmbedHeightPx(1));
    expect(notationEmbedHeightPx(1)).toBe(220);
  });

  it("grows with measure count", () => {
    expect(notationEmbedHeightPx(12)).toBeGreaterThan(notationEmbedHeightPx(4));
  });

  it("never shrinks as measures are added", () => {
    for (let count = 0; count < 40; count += 1) {
      expect(notationEmbedHeightPx(count + 1)).toBeGreaterThanOrEqual(
        notationEmbedHeightPx(count),
      );
    }
  });

  it("caps long drills so the box scrolls instead of pushing the page", () => {
    // The longest drill embedded on a landing page today is 25 measures.
    expect(notationEmbedHeightPx(25)).toBe(560);
    expect(notationEmbedHeightPx(500)).toBe(560);
  });

  it("is a pure function of the measure count, so SSR and hydration agree", () => {
    expect(notationEmbedHeightPx(10)).toBe(notationEmbedHeightPx(10));
  });
});
