import { describe, expect, it } from "vitest";

import type {
  EffectInventoryItem,
  InventoryItem,
  PowerLink,
  RigSetup,
} from "../types/arsenal.types";
import { EFFECT_DEFINITIONS } from "./effectDefinitions";
import { getEffectLevel } from "./effectStats";
import { GUITAR_DEFINITIONS } from "./guitarDefinitions";
import { getItemLevel } from "./itemStats";
import { SUPPLY_TIERS } from "./rigHardware";
import { getRigLevel } from "./rigLevel";

const GUITAR = GUITAR_DEFINITIONS[0];
const EFFECT = EFFECT_DEFINITIONS[0];

const guitar: InventoryItem = {
  id: "g1",
  guitarId: GUITAR.id,
  acquiredAt: 0,
  isNew: false,
  year: 2000,
  country: "USA",
};

/** Five pedals, one more than the bottom brick has outputs. */
const pedals: EffectInventoryItem[] = Array.from({ length: 5 }, (_, i) => ({
  id: `p${i}`,
  effectId: EFFECT.id,
  acquiredAt: 0,
  isNew: false,
}));

const GUITAR_LEVEL = getItemLevel(guitar, GUITAR);

/** Condition is derived from the item id, so every pedal is worth its own. */
const expected = (...poweredIds: string[]) =>
  poweredIds.reduce(
    (total, id) =>
      total + getEffectLevel(pedals.find((p) => p.id === id)!, EFFECT),
    GUITAR_LEVEL,
  );

const rigWith = (
  boarded: string[],
  power?: PowerLink[],
  supplyTier?: number,
): RigSetup => ({
  guitarSlots: ["g1", null, null],
  pedalboardItems: boarded.map((itemId, index) => ({
    itemId,
    xPct: 87 - index * 10,
    yPct: 10,
  })),
  ampHeadId: null,
  ampId: null,
  ...(power === undefined ? {} : { power }),
  ...(supplyTier === undefined ? {} : { supplyTier }),
});

const levelOf = (rig: RigSetup) =>
  getRigLevel({ rig, inventory: [guitar], effectInventory: pedals });

/** One cable per pedal, on consecutive outputs. */
const allOn = (ids: string[]): PowerLink[] =>
  ids.map((itemId, out) => ({ itemId, out }));

describe("getRigLevel", () => {
  it("counts an equipped guitar and every powered pedal", () => {
    const boarded = ["p0", "p1", "p2"];
    expect(levelOf(rigWith(boarded, allOn(boarded)))).toBe(
      expected("p0", "p1", "p2"),
    );
  });

  it("does not count a pedal with no cable to the brick", () => {
    // Three pedals on the board, the middle one dead: standing a pedal on the
    // case must not buy the Fame rate the power brick is there to gate.
    expect(levelOf(rigWith(["p0", "p1", "p2"], allOn(["p0", "p2"])))).toBe(
      expected("p0", "p2"),
    );
  });

  it("counts nothing on the board when nothing is plugged in", () => {
    expect(levelOf(rigWith(["p0", "p1", "p2"], []))).toBe(expected());
  });

  it("counts every pedal on a board saved before the brick existed", () => {
    // `power` absent, rather than empty — nobody loses levels to a migration.
    expect(levelOf(rigWith(["p0", "p1", "p2"]))).toBe(
      expected("p0", "p1", "p2"),
    );
  });

  it("ignores a link to an output the rig's brick does not have", () => {
    // Five pedals patched as if the rig owned a bigger brick than tier 0's
    // four outputs. The fifth link is a supply that has not been paid for.
    const boarded = ["p0", "p1", "p2", "p3", "p4"];
    expect(SUPPLY_TIERS[0].outputs).toBe(4);
    expect(levelOf(rigWith(boarded, allOn(boarded), 0))).toBe(
      expected("p0", "p1", "p2", "p3"),
    );
    expect(levelOf(rigWith(boarded, allOn(boarded), 1))).toBe(
      expected("p0", "p1", "p2", "p3", "p4"),
    );
  });

  it("ignores two cables claiming the same output", () => {
    expect(
      levelOf(
        rigWith(
          ["p0", "p1"],
          [
            { itemId: "p0", out: 0 },
            { itemId: "p1", out: 0 },
          ],
        ),
      ),
    ).toBe(expected("p0"));
  });

  it("pays nothing for a player with no arsenal at all", () => {
    expect(getRigLevel(null)).toBe(0);
  });
});
