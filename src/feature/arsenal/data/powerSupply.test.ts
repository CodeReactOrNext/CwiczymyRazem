import { describe, expect, it } from "vitest";

import type { PedalboardPlacement, PowerLink } from "../types/arsenal.types";
import { geometryFor } from "../utils/pedalboardLayout";
import { railFor } from "../utils/powerLayout";
import {
  autoPatch,
  pickOutput,
  readPowerState,
  refusalFor,
} from "./powerSupply";
import { BOARD_TIERS, SUPPLY_TIERS } from "./rigHardware";

/**
 * One pedal is one output. What these pin down is that the rule really is that
 * simple: nothing about a pedal changes what it costs the brick, so the only
 * question the module ever answers is whether a hole is free.
 */

const geo = geometryFor(BOARD_TIERS[0]);
const supply = SUPPLY_TIERS[0]; // four outputs
const rail = railFor(geo, supply);

/** A row of pedals across the deck, left to right. */
const board = (count: number): PedalboardPlacement[] =>
  Array.from({ length: count }, (_, i) => ({
    itemId: `p${i}`,
    xPct: i * 12,
    yPct: 0,
  }));

const widthOf = () => 10;

describe("readPowerState", () => {
  it("powers a pedal for as long as it holds an output", () => {
    const state = readPowerState(supply, board(2), [
      { itemId: "p0", out: 0 },
      { itemId: "p1", out: 1 },
    ]);
    expect(state.poweredIds).toEqual(new Set(["p0", "p1"]));
    expect(state.outputsUsed).toBe(2);
    expect(state.outputsFree).toBe(supply.outputs - 2);
    expect(state.unpoweredIds).toEqual([]);
  });

  it("counts a pedal with no cable as unpowered rather than dropping it", () => {
    const state = readPowerState(supply, board(2), [{ itemId: "p0", out: 0 }]);
    expect(state.unpoweredIds).toEqual(["p1"]);
    expect(state.outputsUsed).toBe(1);
  });

  it("forgets a link to a pedal that is no longer on the board", () => {
    const state = readPowerState(supply, board(1), [
      { itemId: "p0", out: 0 },
      { itemId: "sold", out: 1 },
    ]);
    expect(state.links).toEqual([{ itemId: "p0", out: 0 }]);
    expect(state.outputsUsed).toBe(1);
  });

  it("lets only one cable claim an output", () => {
    const state = readPowerState(supply, board(2), [
      { itemId: "p0", out: 2 },
      { itemId: "p1", out: 2 },
    ]);
    expect(state.outputsUsed).toBe(1);
    expect(state.unpoweredIds).toEqual(["p1"]);
  });

  it("refuses an output the brick this rig owns does not have", () => {
    // A link off a bigger brick — a downgrade, or a tampered save.
    const state = readPowerState(supply, board(1), [
      { itemId: "p0", out: supply.outputs + 3 },
    ]);
    expect(state.unpoweredIds).toEqual(["p0"]);
  });

  it("never powers more pedals than the brick has holes", () => {
    const links: PowerLink[] = board(6).map((item, i) => ({
      itemId: item.itemId,
      out: i,
    }));
    const state = readPowerState(supply, board(6), links);
    expect(state.outputsUsed).toBe(supply.outputs);
    expect(state.unpoweredIds).toHaveLength(6 - supply.outputs);
  });
});

describe("pickOutput", () => {
  it("takes the free socket nearest the pedal", () => {
    const near = pickOutput(
      rail,
      { itemId: "p", xPct: 0, yPct: 0 },
      10,
      new Set(),
    );
    const far = pickOutput(
      rail,
      { itemId: "p", xPct: 90, yPct: 0 },
      10,
      new Set(),
    );
    expect(near).not.toBeNull();
    expect(far).not.toBeNull();
    expect(near).toBeLessThan(far!);
  });

  it("has nothing to give once every socket is taken", () => {
    const taken = new Set(rail.sockets.map((socket) => socket.index));
    expect(
      pickOutput(rail, { itemId: "p", xPct: 0, yPct: 0 }, 10, taken),
    ).toBeNull();
  });
});

describe("autoPatch", () => {
  it("plugs in everything the brick has a hole for, in signal order", () => {
    // The signal comes in at the right and leaves at the left, so the pedal it
    // meets first is the rightmost one — that is the order cables go in too.
    const patched = autoPatch(rail, board(3), [], widthOf);
    expect(patched.map((link) => link.itemId)).toEqual(["p2", "p1", "p0"]);
    expect(new Set(patched.map((link) => link.out)).size).toBe(3);
  });

  it("stops at the last output and leaves the rest dark", () => {
    const patched = autoPatch(rail, board(6), [], widthOf);
    expect(patched).toHaveLength(supply.outputs);
    // …and it is the far end of the chain that goes without.
    expect(patched.map((link) => link.itemId)).not.toContain("p0");
  });

  it("keeps the cables already in the brick", () => {
    const existing = [{ itemId: "p1", out: 3 }];
    const patched = autoPatch(rail, board(2), existing, widthOf);
    expect(patched).toContainEqual({ itemId: "p1", out: 3 });
    expect(patched).toHaveLength(2);
  });
});

describe("refusalFor", () => {
  it("says nothing while a hole is free", () => {
    const state = readPowerState(supply, board(1), [{ itemId: "p0", out: 0 }]);
    expect(refusalFor(supply, state)).toBeNull();
  });

  it("names the brick when every output is taken", () => {
    const links = Array.from({ length: supply.outputs }, (_, i) => ({
      itemId: `p${i}`,
      out: i,
    }));
    const state = readPowerState(supply, board(supply.outputs), links);
    expect(refusalFor(supply, state)).toContain(supply.name);
  });
});
