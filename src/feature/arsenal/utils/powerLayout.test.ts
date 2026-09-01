import { describe, expect, it } from "vitest";

import { BOARD_TIERS, SUPPLY_TIERS } from "../data/rigHardware";
import { geometryFor } from "./pedalboardLayout";
import {
  dcJackAt,
  RAIL_H,
  railFor,
  railOf,
  railPaddingPct,
  socketStub,
} from "./powerLayout";

/**
 * The loom is drawn, so what is worth testing is not how a cable looks but that
 * every part of it lands somewhere real: on the brick, on the deck, and on the
 * same brick whatever case it is standing on.
 */

const geo = geometryFor(BOARD_TIERS[0]);

describe("railFor", () => {
  it("gives the brick one socket per output", () => {
    for (const supply of SUPPLY_TIERS) {
      const rail = railFor(geo, supply);
      expect(rail.sockets).toHaveLength(supply.outputs);
      expect(rail.sockets.map((socket) => socket.index)).toEqual(
        supply.outputs > 0
          ? Array.from({ length: supply.outputs }, (_, i) => i)
          : [],
      );
    }
  });

  it("stands every socket inside the brick it belongs to", () => {
    for (const supply of SUPPLY_TIERS) {
      const { brick, sockets } = railFor(geo, supply);
      for (const socket of sockets) {
        expect(socket.x).toBeGreaterThan(brick.x);
        expect(socket.x).toBeLessThan(brick.x + brick.w);
      }
    }
  });

  it("spaces them evenly, left to right", () => {
    const { sockets } = railFor(geo, SUPPLY_TIERS[2]);
    const gaps = sockets.slice(1).map((socket, i) => socket.x - sockets[i].x);
    for (const gap of gaps) expect(gap).toBeCloseTo(gaps[0], 5);
  });

  it("keeps the brick on the case it is racked in", () => {
    for (const board of BOARD_TIERS) {
      const cased = geometryFor(board);
      for (const supply of SUPPLY_TIERS) {
        const { brick } = railFor(cased, supply);
        expect(brick.x).toBeGreaterThanOrEqual(0);
        expect(brick.x + brick.w).toBeLessThanOrEqual(cased.viewW);
        expect(brick.y + brick.h).toBeLessThanOrEqual(RAIL_H);
      }
    }
  });

  it("hands back the same rail for the same pair, so the memos downstream hold", () => {
    expect(railFor(geo, SUPPLY_TIERS[1])).toBe(railFor(geo, SUPPLY_TIERS[1]));
  });
});

describe("railOf", () => {
  it("reads a stored tier index the way the rest of the rig does", () => {
    expect(railOf(geo, 1)).toBe(railFor(geo, SUPPLY_TIERS[1]));
  });

  it("treats a rig that has bought nothing as the bottom rung", () => {
    expect(railOf(geo, undefined)).toBe(railFor(geo, SUPPLY_TIERS[0]));
    expect(railOf(geo, null)).toBe(railFor(geo, SUPPLY_TIERS[0]));
  });
});

describe("socketStub", () => {
  it("draws a path that starts at the socket it is for", () => {
    const socket = railFor(geo, SUPPLY_TIERS[0]).sockets[0];
    const path = socketStub(socket);
    expect(path.startsWith("M")).toBe(true);
    expect(path).toContain(socket.x.toFixed(2));
  });
});

describe("dcJackAt", () => {
  it("puts the inlet on the pedal, in board units", () => {
    const point = dcJackAt(geo, 0, 0, 10, { x: 0.5, y: 0 });
    expect(point.x).toBeGreaterThan(0);
    expect(point.x).toBeLessThan(geo.viewW);
    expect(point.y).toBeGreaterThanOrEqual(0);
  });

  it("moves with the pedal it belongs to", () => {
    const left = dcJackAt(geo, 0, 0, 10, { x: 0.5, y: 0 });
    const right = dcJackAt(geo, 50, 0, 10, { x: 0.5, y: 0 });
    expect(right.x).toBeGreaterThan(left.x);
  });
});

describe("railPaddingPct", () => {
  it("reserves the same real height above every case", () => {
    const small = railPaddingPct(geometryFor(BOARD_TIERS[0]));
    const big = railPaddingPct(
      geometryFor(BOARD_TIERS[BOARD_TIERS.length - 1]),
    );
    expect(small).toBeGreaterThan(0);
    // A wider deck is a smaller share for the same strip of rail.
    expect(big).toBeLessThan(small);
  });
});
