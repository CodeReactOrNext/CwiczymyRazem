import { describe, expect, it } from "vitest";

import { EXAM_CLICK_ROTATE_SECONDS } from "./clickExamGrade";
import { EXAM_HINT_MS, unfoundTwinEStrings } from "./clickHuntHints";

// A on fret 5: the thick E (string 6) and the thin e (string 1).
const A_ON_FRET_5 = [
  { string: 1, fret: 5 },
  { string: 6, fret: 5 },
];

describe("unfoundTwinEStrings", () => {
  it("points at the thin e once the thick E is found", () => {
    expect(unfoundTwinEStrings(A_ON_FRET_5, ["6-5"])).toEqual([1]);
  });

  it("points at the thick E once the thin e is found", () => {
    expect(unfoundTwinEStrings(A_ON_FRET_5, ["1-5"])).toEqual([6]);
  });

  it("says nothing before either is found, or after both are", () => {
    expect(unfoundTwinEStrings(A_ON_FRET_5, [])).toEqual([]);
    expect(unfoundTwinEStrings(A_ON_FRET_5, ["1-5", "6-5"])).toEqual([]);
  });

  it("only pairs the two E strings at the same fret", () => {
    // D on fret 5 (A string) and fret 0 (D string): no E string involved.
    expect(unfoundTwinEStrings([{ string: 5, fret: 5 }, { string: 4, fret: 0 }], ["5-5"])).toEqual([]);
    // E on fret 0 and fret 12 of the thick E: found at 0, the thin e at 12 isn't its twin.
    expect(unfoundTwinEStrings([{ string: 6, fret: 0 }, { string: 1, fret: 12 }], ["6-0"])).toEqual([]);
  });
});

describe("exam hint timing", () => {
  it("shows both hints before an exam round runs out", () => {
    expect(EXAM_HINT_MS[1]).toBeLessThan(EXAM_CLICK_ROTATE_SECONDS * 1000);
  });
});
