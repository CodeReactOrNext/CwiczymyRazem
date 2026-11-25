import { describe, expect, it } from "vitest";

import { octavePlaces } from "./HuntOctaves";

describe("octavePlaces", () => {
  it("lists every place of the octave up to the 15th fret, low strings first", () => {
    expect(octavePlaces("C", 3)).toBe("E 8, A 3");
    expect(octavePlaces("C", 4)).toBe("A 15, D 10, G 5, B 1");
    expect(octavePlaces("C", 5)).toBe("B 13, e 8");
  });

  it("follows a guitar tuned down, where the same fret sounds lower", () => {
    // Half a step down the C frets sound B, so the octave number drops by one.
    expect(octavePlaces("C", 2, -1)).toBe("E 8, A 3");
  });
});
