import { describe, expect, it } from "vitest";

import { followWindow, homeWindow, spotsOf, windowFor } from "./changesFretboard";

describe("the position on the neck", () => {
  it("starts with the tonic under the first finger, off the nut", () => {
    // A on the 5th fret of the low E: frets 4–8.
    expect(homeWindow(9)).toBe(4);
    expect(homeWindow(7)).toBe(2);
    expect(homeWindow(0)).toBe(7);
    // E would sit on the nut: its A-string root, the 7th fret.
    expect(homeWindow(4)).toBe(6);
  });

  it("stays while a note can be played in it, and goes where the player went", () => {
    // C4 sits on the G string's 5th fret: inside frets 4–8.
    expect(followWindow(4, 60)).toBe(4);
    // E5 at the 12th fret of the high e — only there on the board.
    expect(followWindow(4, 76)).toBe(8);
    expect(windowFor(9, [{ midi: 76 }, { midi: 60 }])).toBe(8);
  });

  it("finds every place a pitch sits", () => {
    expect(spotsOf(64)).toEqual([
      { string: 0, fret: 0 },
      { string: 1, fret: 5 },
      { string: 2, fret: 9 },
    ]);
  });
});
