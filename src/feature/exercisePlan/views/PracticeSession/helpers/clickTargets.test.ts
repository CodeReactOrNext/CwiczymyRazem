import { describe, expect, it } from "vitest";

import { computeClickTargets, isWithinReach, reachZoneKeys, targetsWithinReach } from "./clickTargets";

describe("interval reach", () => {
  it("keeps the answer inside a hand span of the root", () => {
    const anchor = { string: 6, fret: 5 }; // A on the low E string
    expect(isWithinReach({ string: 5, fret: 7 }, anchor)).toBe(true); // the 5th, E
    expect(isWithinReach({ string: 6, fret: 9 }, anchor)).toBe(true);
    expect(isWithinReach({ string: 6, fret: 10 }, anchor)).toBe(false); // five frets away
    expect(isWithinReach({ string: 3, fret: 5 }, anchor)).toBe(false); // three strings away
  });

  it("narrows the answer note to the positions reachable from the placed root", () => {
    const anchor = { string: 6, fret: 5 };
    const everyE = computeClickTargets("E", 0, 12, [5, 6]);
    expect(targetsWithinReach(everyE, anchor)).toEqual([{ string: 5, fret: 7 }]);
  });

  it("falls back to every position rather than leaving a round unanswerable", () => {
    // One string only: A at fret 5, E at 0 and 12 — nothing a hand can reach.
    const anchor = { string: 6, fret: 5 };
    const everyE = computeClickTargets("E", 0, 12, [6]);
    expect(targetsWithinReach(everyE, anchor)).toEqual(everyE);
  });

  it("shades a whole area around the root, not just the answers", () => {
    const keys = reachZoneKeys({ string: 6, fret: 2 }, 0, 4, [5, 6]);
    // Frets 0–4 (the window clips the span) on strings 4–6, of which only 5 and 6
    // are in play: 5 frets × 2 strings.
    expect(keys).toHaveLength(10);
    expect(keys).toContain("6-2");
    expect(keys).toContain("5-4");
  });

  it("clips the zone to the exercise's own window", () => {
    const keys = reachZoneKeys({ string: 1, fret: 12 }, 8, 12, undefined);
    // Frets 8–12 only, strings 1–3 only.
    expect(keys).toHaveLength(15);
    expect(keys.every((key) => Number(key.split("-")[1]) <= 12)).toBe(true);
  });
});
