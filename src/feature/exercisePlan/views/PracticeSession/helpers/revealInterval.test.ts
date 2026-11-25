import { describe, expect, it } from "vitest";

import { revealInterval } from "./clickTargets";

describe("revealInterval", () => {
  const targets = [
    { string: 1, fret: 9 },
    { string: 5, fret: 7 },
  ];

  it("answers from the root the player placed", () => {
    expect(revealInterval({ string: 2, fret: 8 }, [{ string: 6, fret: 5 }], targets)?.target).toEqual(targets[0]);
  });

  it("picks the closest pair when no root was placed", () => {
    const roots = [{ string: 6, fret: 5 }, { string: 3, fret: 2 }];
    expect(revealInterval(null, roots, targets)).toEqual({ root: roots[0], target: targets[1] });
  });

  it("answers above the root even where a lower one is nearer", () => {
    const root = { string: 4, fret: 5 };
    const above = { string: 4, fret: 7 };
    expect(revealInterval(root, [], [{ string: 6, fret: 5 }, above])?.target).toEqual(above);
  });

  it("has nothing to show on a window without the notes", () => {
    expect(revealInterval(null, [], targets)).toBeNull();
  });
});
