import { STASH_COLUMNS } from "feature/arsenal/utils/stashLayout";
import {
  shelfHasRoom,
  shelfPiece,
  shelfRowsUsed,
} from "feature/guilds/utils/guildShelf.utils";
import { describe, expect, it } from "vitest";

const singles = (count: number, from = 0) =>
  Array.from({ length: count }, (_, index) => ({
    id: `p${from + index}`,
    tall: false,
  }));

const guitars = (count: number, from = 0) =>
  Array.from({ length: count }, (_, index) => ({
    id: `g${from + index}`,
    tall: true,
  }));

describe("shelfRowsUsed", () => {
  it("is nothing at all for an empty shelf", () => {
    expect(shelfRowsUsed([])).toBe(0);
  });

  it("counts the rows the pieces actually fill", () => {
    expect(shelfRowsUsed(singles(1))).toBe(1);
    expect(shelfRowsUsed(singles(STASH_COLUMNS))).toBe(1);
    expect(shelfRowsUsed(singles(STASH_COLUMNS + 1))).toBe(2);
  });

  it("gives a guitar the two rows it hangs across", () => {
    expect(shelfRowsUsed(guitars(1))).toBe(2);
  });

  it("counts the hole a guitar cannot hang in", () => {
    // A full row of pedals, then a guitar: the guitar needs two stacked cells,
    // so it drops to the row below and hangs into a third. Twelve cells' worth
    // of sockets are left free above it and none of them can take it — which is
    // exactly why the limit is rows and not cells.
    expect(shelfRowsUsed([...singles(STASH_COLUMNS), ...guitars(1)])).toBe(3);
  });
});

describe("shelfHasRoom", () => {
  it("lets a shelf fill the rows it has bought", () => {
    expect(shelfHasRoom(singles(2 * STASH_COLUMNS), 2)).toBe(true);
  });

  it("refuses the piece that would need a row nobody paid for", () => {
    expect(shelfHasRoom(singles(2 * STASH_COLUMNS + 1), 2)).toBe(false);
  });
});

describe("shelfPiece", () => {
  it("hangs guitars tall and everything else in one socket", () => {
    expect(shelfPiece({ id: "a", kind: "guitar" })).toEqual({
      id: "a",
      tall: true,
    });
    for (const kind of ["effect", "part", "mod"] as const) {
      expect(shelfPiece({ id: "a", kind })).toEqual({ id: "a", tall: false });
    }
  });
});
