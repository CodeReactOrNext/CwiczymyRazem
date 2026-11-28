import { RACK_LOOK_ART } from "feature/arsenal/utils/rackLookArt";
import { describe, expect, it } from "vitest";

import {
  BOARD_SKINS,
  CABLE_SKINS,
  EMPTY_BOARD_SKINS,
  RACK_SKINS,
  readBoardSkins,
  readRackBays,
  RIG_SKINS,
  SKINS_BY_ID,
  withPurchase,
  withRackOnBays,
  wornBoardLook,
  wornCable,
  wornRackLooks,
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

describe("display cases", () => {
  it("gives every case its own price, none below the cheapest board's", () => {
    const prices = RACK_SKINS.map((skin) => skin.price);
    expect(new Set(prices).size).toBe(prices.length);
    const cheapestBoard = Math.min(...BOARD_SKINS.map((skin) => skin.price));
    expect(Math.min(...prices)).toBeGreaterThanOrEqual(cheapestBoard);
  });

  it("has art for every case, and one case per look", () => {
    const looks = RACK_SKINS.map((skin) => skin.look);
    expect(new Set(looks).size).toBe(looks.length);
    expect([...looks].sort()).toEqual(Object.keys(RACK_LOOK_ART).sort());
  });

  it("reads an account from before the cases as three stock bays", () => {
    const state = readBoardSkins({ owned: ["cable-tweed"], cable: "cable-tweed" });
    expect(state.rack).toEqual([null, null, null]);
    expect(wornRackLooks(state)).toEqual([undefined, undefined, undefined]);
  });

  it("never hangs a case that is not owned, or a skin of another kind", () => {
    const state = readBoardSkins({
      owned: ["rack-velvet", "board-rail"],
      rack: ["rack-velvet", "rack-marble", "board-rail", "rack-velvet"],
    });
    expect(state.rack).toEqual(["rack-velvet", null, null]);
    expect(wornRackLooks(state)).toEqual(["velvet", undefined, undefined]);
  });

  it("hangs a new case in every bay unless bays were named", () => {
    const velvet = SKINS_BY_ID.get("rack-velvet")!;
    const marble = SKINS_BY_ID.get("rack-marble")!;
    const everywhere = withPurchase(EMPTY_BOARD_SKINS, velvet);
    expect(everywhere.rack).toEqual(["rack-velvet", "rack-velvet", "rack-velvet"]);

    const middle = withPurchase(everywhere, marble, [1]);
    expect(middle.rack).toEqual(["rack-velvet", "rack-marble", "rack-velvet"]);
    expect(middle.owned).toEqual(["rack-velvet", "rack-marble"]);
    // The board and the cable are somebody else's business.
    expect(middle.cable).toBeNull();
    expect(middle.board).toBeNull();
  });

  it("takes a case down from the bays named and leaves the rest", () => {
    expect(
      withRackOnBays(["rack-velvet", "rack-marble", "rack-velvet"], null, [0, 1]),
    ).toEqual([null, null, "rack-velvet"]);
  });

  it("reads which bays a request means", () => {
    expect(readRackBays(undefined)).toEqual([0, 1, 2]);
    expect(readRackBays([2, 0, 2])).toEqual([0, 2]);
    expect(readRackBays([])).toBeNull();
    expect(readRackBays([3])).toBeNull();
    expect(readRackBays([0.5])).toBeNull();
    expect(readRackBays("all")).toBeNull();
  });
});
