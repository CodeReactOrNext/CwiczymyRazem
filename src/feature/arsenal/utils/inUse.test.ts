import { describe, expect, it } from "vitest";

import type { ArsenalUserData, RigSetup } from "../types/arsenal.types";
import { getInUseGuitarIds, getItemUses } from "./inUse";

const rig = (over: Partial<RigSetup> = {}): RigSetup => ({
  guitarSlots: [null, null, null],
  pedalboardItems: [],
  ampHeadId: null,
  ampId: null,
  ...over,
});

describe("getItemUses", () => {
  it("says nothing about a spare copy sitting in the stash", () => {
    expect(getItemUses({ equippedItemId: "a", rig: rig() }, "spare")).toEqual(
      [],
    );
  });

  it("reports the profile and the rig slot separately", () => {
    const uses = getItemUses(
      {
        equippedItemId: "strat",
        rig: rig({ guitarSlots: [null, "strat", null] }),
      },
      "strat",
    );
    expect(uses).toEqual([{ where: "profile" }, { where: "rig", slot: 1 }]);
  });

  it("finds a pedal by its placement on the board", () => {
    const uses = getItemUses(
      {
        equippedItemId: null,
        rig: rig({ pedalboardItems: [{ itemId: "ds1", xPct: 10, yPct: 20 }] }),
      },
      "ds1",
    );
    expect(uses).toEqual([{ where: "board" }]);
  });

  it("survives an account that has never set a rig up", () => {
    // `rig` is declared as always present, but an older account can still come
    // back from Firestore without one — hence the optional chaining it is
    // written against.
    expect(
      getItemUses({ equippedItemId: null } as ArsenalUserData, "x"),
    ).toEqual([]);
    expect(getItemUses(undefined, "x")).toEqual([]);
  });
});

describe("getInUseGuitarIds", () => {
  it("collects the profile guitar and every filled rig slot", () => {
    expect([...getInUseGuitarIds("profile", ["a", null, "b"])]).toEqual([
      "profile",
      "a",
      "b",
    ]);
  });

  it("is empty when nothing is equipped", () => {
    expect(getInUseGuitarIds(null).size).toBe(0);
  });
});
