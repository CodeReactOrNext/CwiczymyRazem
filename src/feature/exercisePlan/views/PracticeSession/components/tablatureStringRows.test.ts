import { describe, expect, it } from "vitest";

import { staffLineSpacing, stringRow } from "./tablatureStringRows";

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

describe("a four-string staff", () => {
  it("puts the G on top and the E on the bottom line", () => {
    expect(stringRow(1, false, 4)).toBe(0);
    expect(stringRow(4, false, 4)).toBe(3);
    expect(stringRow(4, true, 4)).toBe(0);
  });

  it("spreads its lines over the height six strings take", () => {
    expect(staffLineSpacing(32, 4) * 3).toBe(32 * 5);
    expect(staffLineSpacing(32)).toBe(32);
  });
});
