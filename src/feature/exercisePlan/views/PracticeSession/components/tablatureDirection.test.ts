import { describe, expect, it } from "vitest";

import {
  boardOffsetX,
  boardSpan,
  mirrorBoardStyle,
  pointerAlongBoard,
  scrollAfterDrag,
} from "./tablatureDirection";

const rect = { left: 100, right: 500 };

describe("tablature direction", () => {
  it("leaves a normal board untouched", () => {
    expect(mirrorBoardStyle(false)).toBeUndefined();
    expect(boardOffsetX(140, rect, false)).toBe(40);
  });

  it("measures a mirrored board from its right edge", () => {
    expect(mirrorBoardStyle(true)).toBe("scaleX(-1)");
    // The same point 40px into the music sits 40px from the RIGHT edge.
    expect(boardOffsetX(460, rect, true)).toBe(40);
    // Both edges agree on where the middle is.
    expect(boardOffsetX(300, rect, true)).toBe(boardOffsetX(300, rect, false));
  });

  it("scrubs forwards when the board is dragged the way the notes travel", () => {
    // Normal board: notes travel left, so dragging left (negative) scrubs on.
    expect(scrollAfterDrag(500, -120, false)).toBe(620);
    // Mirrored board: notes travel right, so it is dragging right that scrubs on.
    expect(scrollAfterDrag(500, 120, true)).toBe(620);
  });

  it("never scrolls back past the start", () => {
    expect(scrollAfterDrag(50, 200, false)).toBe(0);
    expect(scrollAfterDrag(50, -200, true)).toBe(0);
  });
});

describe("quarter-turned board", () => {
  // A 400px-long board turned onto its side: its music runs from y=50 down to y=450.
  const turned = { left: 20, right: 320, top: 50, bottom: 450 };

  it("reads the pointer along the music from y once turned", () => {
    expect(pointerAlongBoard({ clientX: 7, clientY: 90 }, true)).toBe(90);
    expect(pointerAlongBoard({ clientX: 7, clientY: 90 }, false)).toBe(7);
  });

  it("measures from the top of a turned board, and from its bottom when also mirrored", () => {
    const span = boardSpan(turned, true);
    expect(boardOffsetX(90, span, false)).toBe(40);
    expect(boardOffsetX(90, span, true)).toBe(360);
  });

  it("leaves an upright board's span alone", () => {
    expect(boardSpan(turned, false)).toEqual({ left: 20, right: 320 });
  });
});
