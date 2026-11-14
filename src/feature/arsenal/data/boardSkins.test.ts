import { describe, expect, it } from "vitest";

import {
  BOARD_SKINS,
  CABLE_SKINS,
  EMPTY_BOARD_SKINS,
  readBoardSkins,
  RIG_SKINS,
  SKINS_BY_ID,
  withPurchase,
  wornBoardLook,
  wornCable,
} from "./boardSkins";

describe("board skins", () => {
  it("gives every skin its own id and a whole, positive price", () => {
    expect(SKINS_BY_ID.size).toBe(RIG_SKINS.length);
    for (const skin of RIG_SKINS) {
      expect(Number.isInteger(skin.price)).toBe(true);
      expect(skin.price).toBeGreaterThan(0);
    }
  });

  it("prices every board above every cable", () => {
    const dearestCable = Math.max(...CABLE_SKINS.map((skin) => skin.price));
    const cheapestBoard = Math.min(...BOARD_SKINS.map((skin) => skin.price));
    expect(cheapestBoard).toBeGreaterThan(dearestCable);
  });

  it("keeps the verdict colours for the verdict", () => {
    // Emerald means wired by the book and red means backwards, on every cable.
    const reserved = ["#34d399", "#f87171"];
    for (const skin of CABLE_SKINS) {
      expect(reserved).not.toContain(skin.paint.core);
      expect(reserved).not.toContain(skin.paint.jacket);
    }
  });

  it("reads a missing or broken record as nothing owned", () => {
    expect(readBoardSkins(undefined)).toEqual(EMPTY_BOARD_SKINS);
    expect(readBoardSkins({ owned: "cable-tweed" })).toEqual(EMPTY_BOARD_SKINS);
  });

  it("drops unknown ids and repeats", () => {
    const state = readBoardSkins({
      owned: ["cable-tweed", "cable-tweed", "cable-retired", 7],
    });
    expect(state.owned).toEqual(["cable-tweed"]);
  });

  it("never wears a skin that is not owned, or one of the wrong kind", () => {
    const state = readBoardSkins({
      owned: ["cable-tweed", "board-rail"],
      cable: "cable-cobalt",
      board: "cable-tweed",
    });
    expect(state.cable).toBeNull();
    expect(state.board).toBeNull();
    expect(wornCable(state)).toBeUndefined();
    expect(wornBoardLook(state)).toBeUndefined();
  });

  it("puts a new purchase straight on, leaving the other kind alone", () => {
    const tweed = SKINS_BY_ID.get("cable-tweed")!;
    const rail = SKINS_BY_ID.get("board-rail")!;
    const state = withPurchase(withPurchase(EMPTY_BOARD_SKINS, tweed), rail);

    expect(state.owned).toEqual(["cable-tweed", "board-rail"]);
    expect(wornCable(state)?.id).toBe("cable-tweed");
    expect(wornBoardLook(state)).toBe("rail");
  });
});
