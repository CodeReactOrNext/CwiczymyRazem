import { describe, expect, it } from "vitest";

import { getAccuracyDisplay } from "./noteMatchingFeedback";

describe("getAccuracyDisplay", () => {
  it("shows a dash before the first judged note instead of 100%", () => {
    const display = getAccuracyDisplay(100, { hits: 0, misses: 0 });
    expect(display.kind).toBe("idle");
    expect(display.text).toBe("—");
  });

  it("says no notes were heard instead of a red 0%", () => {
    const display = getAccuracyDisplay(0, { hits: 0, misses: 6 });
    expect(display.kind).toBe("silent");
    expect(display.text).toBe("No notes heard");
  });

  it("shows the graded percentage once something matched", () => {
    const display = getAccuracyDisplay(40, { hits: 2, misses: 3 });
    expect(display).toMatchObject({
      kind: "value",
      text: "40%",
      color: "text-red-400",
    });
  });

  it("trusts the hunt's own accuracy when there are no tab stats", () => {
    expect(getAccuracyDisplay(100, null)).toMatchObject({
      kind: "value",
      text: "100%",
    });
  });
});
