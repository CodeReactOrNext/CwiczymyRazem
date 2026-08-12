import { describe, expect, it } from "vitest";

import type { StashPiece } from "./stashLayout";
import {
  hasSavedArrangement,
  pieceAt,
  planMove,
  resolveLayout,
} from "./stashLayout";

// A four-column board keeps the arithmetic readable in the expectations.
const COLS = 4;

const small = (id: string): StashPiece => ({ id, tall: false });
const tall = (id: string): StashPiece => ({ id, tall: true });

describe("resolveLayout", () => {
  it("fills from the top-left when nothing has been arranged yet", () => {
    const { layout } = resolveLayout([small("a"), small("b")], {}, COLS);
    expect(layout).toEqual({ a: 0, b: 1 });
  });

  it("keeps a guitar and the cell under it clear for the next piece", () => {
    const { layout } = resolveLayout([tall("g"), small("a")], {}, COLS);
    expect(layout.g).toBe(0);
    // Cell 4 is the guitar's lower half, so the pedal takes the next column.
    expect(layout.a).toBe(1);
  });

  it("honours saved positions and auto-places only what is new", () => {
    const { layout } = resolveLayout([small("a"), small("b")], { a: 7 }, COLS);
    expect(layout.a).toBe(7);
    expect(layout.b).toBe(0);
  });

  it("gives a contested cell to one piece and rehomes the other", () => {
    const { layout } = resolveLayout(
      [small("a"), small("b")],
      { a: 5, b: 5 },
      COLS,
    );
    expect(layout.a).toBe(5);
    expect(layout.b).toBe(0);
  });

  it("counts the rows a guitar reaches, plus the spare ones", () => {
    // A guitar dropped at index 4 covers rows 1 and 2 → 3 rows + 2 spare.
    const { rows } = resolveLayout([tall("g")], { g: 4 }, COLS);
    expect(rows).toBe(5);
  });
});

describe("planMove", () => {
  // a b c .        a, b, c across the top row, a guitar hanging from cell 3
  // . . . g        down into cell 7.
  const pieces = [small("a"), small("b"), small("c"), tall("g")];
  const layout = { a: 0, b: 1, c: 2, g: 3 };

  it("drops a piece into empty space", () => {
    expect(planMove(pieces, layout, "a", 9, COLS)).toEqual({ ...layout, a: 9 });
  });

  it("swaps two pieces that land on each other", () => {
    expect(planMove(pieces, layout, "a", 1, COLS)).toEqual({
      ...layout,
      a: 1,
      b: 0,
    });
  });

  it("refuses a drop that would cover two pieces at once", () => {
    // The guitar dropped on cell 1 would cover b and, one row down, nothing —
    // so put something there first: it covers b and the cell below it.
    const crowded = [...pieces, small("d")];
    const withD = { ...layout, d: 5 };
    expect(planMove(crowded, withD, "g", 1, COLS)).toBeNull();
  });

  it("refuses a swap the displaced piece has no room for", () => {
    // Swapping the pedal into the guitar's cell would push the guitar into
    // cell 0, whose lower half (cell 4) is occupied.
    const blocked = [...pieces, small("d")];
    const withD = { ...layout, d: 4 };
    expect(planMove(blocked, withD, "a", 3, COLS)).toBeNull();
  });

  it("ignores a drop back onto the same cell", () => {
    expect(planMove(pieces, layout, "a", 0, COLS)).toBeNull();
  });
});

describe("pieceAt", () => {
  // g is a guitar at cell 0, so it covers cells 0 and 4; a sits at cell 1.
  const pieces = [tall("g"), small("a")];
  const layout = { g: 0, a: 1 };

  it("finds the piece covering a cell", () => {
    expect(pieceAt(pieces, layout, 1, undefined, COLS)?.id).toBe("a");
  });

  it("finds a tall piece by its lower half as well", () => {
    expect(pieceAt(pieces, layout, 4, undefined, COLS)?.id).toBe("g");
  });

  it("returns null for an empty cell", () => {
    expect(pieceAt(pieces, layout, 2, undefined, COLS)).toBeNull();
  });

  it("skips the piece being carried, which is still in the layout", () => {
    expect(pieceAt(pieces, layout, 1, "a", COLS)).toBeNull();
  });
});

describe("hasSavedArrangement", () => {
  it("is false for a player who has never dragged anything", () => {
    expect(hasSavedArrangement(undefined)).toBe(false);
    expect(hasSavedArrangement({})).toBe(false);
  });

  it("is true once anything has a saved position", () => {
    expect(hasSavedArrangement({ a: 0 })).toBe(true);
  });
});
