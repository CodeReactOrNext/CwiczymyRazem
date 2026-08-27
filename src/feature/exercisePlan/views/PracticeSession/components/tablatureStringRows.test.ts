import { describe, expect, it } from "vitest";

import { stringRow } from "./tablatureStringRows";

describe("stringRow", () => {
  it("puts the high e on the top line by default", () => {
    expect(stringRow(1)).toBe(0);
    expect(stringRow(6)).toBe(5);
  });

  it("turns the staff upside down when strings are flipped", () => {
    expect(stringRow(1, true)).toBe(5);
    expect(stringRow(6, true)).toBe(0);
  });

  it("uses every line exactly once either way", () => {
    const strings = [1, 2, 3, 4, 5, 6];
    for (const flipped of [false, true]) {
      const rows = strings.map((string) => stringRow(string, flipped));
      expect([...rows].sort()).toEqual([0, 1, 2, 3, 4, 5]);
    }
  });
});
