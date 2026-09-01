import { describe, expect, it } from "vitest";

import { geometryFor, slotEstimate } from "../utils/pedalboardLayout";
import { railFor } from "../utils/powerLayout";
import {
  BOARD_TIERS,
  boardTierOf,
  nextTier,
  SUPPLY_TIERS,
  supplyTierOf,
} from "./rigHardware";

/**
 * The ladders are the economy, so what is worth pinning down is not the numbers
 * themselves — those will be tuned — but the shape they have to keep: every
 * rung strictly better than the one below, every rung dearer, and holes the
 * thing a new rig runs out of first.
 */

describe("the ladders", () => {
  it("starts both of them free, because that is what everybody owns", () => {
    expect(BOARD_TIERS[0].fame).toBe(0);
    expect(SUPPLY_TIERS[0].fame).toBe(0);
  });

  it("numbers every rung by its own position, so a stored index is the rung", () => {
    BOARD_TIERS.forEach((tier, index) => expect(tier.id).toBe(index));
    SUPPLY_TIERS.forEach((tier, index) => expect(tier.id).toBe(index));
  });

  it("charges more for every step up", () => {
    for (const ladder of [BOARD_TIERS, SUPPLY_TIERS]) {
      for (let i = 1; i < ladder.length; i++) {
        expect(ladder[i].fame).toBeGreaterThan(ladder[i - 1].fame);
      }
    }
  });

  it("never sells a case that holds less than the one before it", () => {
    for (let i = 1; i < BOARD_TIERS.length; i++) {
      const before = slotEstimate(geometryFor(BOARD_TIERS[i - 1]));
      const after = slotEstimate(geometryFor(BOARD_TIERS[i]));
      expect(after).toBeGreaterThan(before);
    }
  });

  it("never sells a brick that carries less than the one before it", () => {
    for (let i = 1; i < SUPPLY_TIERS.length; i++) {
      expect(SUPPLY_TIERS[i].outputs).toBeGreaterThan(
        SUPPLY_TIERS[i - 1].outputs,
      );
    }
  });
});

describe("the pinch the two ladders are for", () => {
  it("gives the biggest brick a hole for everything the biggest case holds", () => {
    // The top of the ladder is where the brick stops being a constraint at all:
    // it is what the player has been paying for the whole way up.
    const slots = slotEstimate(
      geometryFor(BOARD_TIERS[BOARD_TIERS.length - 1]),
    );
    expect(
      SUPPLY_TIERS[SUPPLY_TIERS.length - 1].outputs,
    ).toBeGreaterThanOrEqual(slots);
  });

  it("makes holes, not room, the first thing a new rig runs out of", () => {
    // The case ladder starts where every board already was, so the starter brick
    // has to be the binding constraint — otherwise the first upgrade a player is
    // sold is one they have no use for yet.
    expect(SUPPLY_TIERS[0].outputs).toBeLessThan(
      slotEstimate(geometryFor(BOARD_TIERS[0])),
    );
  });

  it("never takes room away from a rig that has bought nothing", () => {
    // The bottom rung *is* the board that shipped before the ladder existed:
    // two rows on a 16-wide deck. Anything smaller would silently park pedals
    // that were on the surface yesterday.
    expect(BOARD_TIERS[0].w).toBe(16);
    expect(BOARD_TIERS[0].rows).toBe(2);
  });
});

describe("reading a stored tier", () => {
  it("treats a rig that has bought nothing as the bottom rung", () => {
    expect(boardTierOf(undefined).id).toBe(0);
    expect(supplyTierOf(undefined).id).toBe(0);
    expect(boardTierOf(null).id).toBe(0);
  });

  it("clamps a stored index rather than trusting it", () => {
    expect(boardTierOf(99).id).toBe(BOARD_TIERS.length - 1);
    expect(supplyTierOf(-4).id).toBe(0);
    expect(boardTierOf(Number.NaN).id).toBe(0);
    expect(supplyTierOf(1.7).id).toBe(1);
  });
});

describe("nextTier", () => {
  it("sells the rung above the one owned", () => {
    expect(nextTier("board", 0)?.id).toBe(1);
    expect(nextTier("supply", 1)?.id).toBe(2);
  });

  it("has nothing to sell at the top", () => {
    expect(nextTier("board", BOARD_TIERS.length - 1)).toBeNull();
    expect(nextTier("supply", SUPPLY_TIERS.length - 1)).toBeNull();
  });

  it("sells off the clamped rung, so a bad index cannot skip a purchase", () => {
    expect(nextTier("board", 99)).toBeNull();
    expect(nextTier("supply", -1)?.id).toBe(1);
  });
});

describe("the brick on the case", () => {
  it("stands every output on the brick, at every pairing", () => {
    for (const board of BOARD_TIERS) {
      for (const supply of SUPPLY_TIERS) {
        const rail = railFor(geometryFor(board), supply);
        expect(rail.sockets).toHaveLength(supply.outputs);
        for (const socket of rail.sockets) {
          expect(socket.x).toBeGreaterThan(rail.brick.x);
          expect(socket.x).toBeLessThan(rail.brick.x + rail.brick.w);
        }
      }
    }
  });

  it("never hangs a brick off the end of the case it is racked in", () => {
    // A big supply bought before a big case is a legal state, and it has to
    // draw as one: overhanging the deck would put its cables off the board.
    for (const board of BOARD_TIERS) {
      const geo = geometryFor(board);
      for (const supply of SUPPLY_TIERS) {
        const { brick } = railFor(geo, supply);
        expect(brick.x).toBeGreaterThanOrEqual(0);
        expect(brick.x + brick.w).toBeLessThanOrEqual(geo.viewW);
      }
    }
  });

  it("centres it over the deck", () => {
    for (const board of BOARD_TIERS) {
      const geo = geometryFor(board);
      const { brick } = railFor(geo, SUPPLY_TIERS[1]);
      expect(brick.x + brick.w / 2).toBeCloseTo(geo.viewW / 2, 5);
    }
  });

  it("grows the brick with its output count, not with the board", () => {
    const geo = geometryFor(BOARD_TIERS[0]);
    const small = railFor(geo, SUPPLY_TIERS[0]).brick.w;
    const big = railFor(geo, SUPPLY_TIERS[SUPPLY_TIERS.length - 1]).brick.w;
    expect(big).toBeGreaterThan(small);

    // …and the same brick is the same size whatever it is standing on.
    const onSmallCase = railFor(geometryFor(BOARD_TIERS[0]), SUPPLY_TIERS[1]);
    const onBigCase = railFor(
      geometryFor(BOARD_TIERS[BOARD_TIERS.length - 1]),
      SUPPLY_TIERS[1],
    );
    expect(onBigCase.brick.w).toBeCloseTo(onSmallCase.brick.w, 5);
  });
});
