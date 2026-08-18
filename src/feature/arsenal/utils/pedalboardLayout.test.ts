import { describe, expect, it } from "vitest";

import type { PedalboardPlacement } from "../types/arsenal.types";
import {
  collidesWithAny,
  findFreeSpot,
  inChainOrder,
  layoutBoard,
  packInOrder,
  PEDAL_H_PCT,
  ROW_Y_PCT,
  tidyBoard,
  type WidthResolver,
} from "./pedalboardLayout";

/** A plain single pedal is roughly this wide on the board. */
const W = 15;

const widthOf: WidthResolver = () => W;
const wideAt = (wide: string[], wideW = 28): WidthResolver => (itemId) =>
  wide.includes(itemId) ? wideW : W;

const at = (itemId: string, xPct: number, yPct: number): PedalboardPlacement => ({
  itemId,
  xPct,
  yPct,
});

const boxesOf = (items: PedalboardPlacement[], resolve: WidthResolver = widthOf) =>
  items.map((item) => ({ ...item, wPct: resolve(item.itemId) }));

const hasOverlap = (
  items: PedalboardPlacement[],
  resolve: WidthResolver = widthOf,
) => {
  const boxes = boxesOf(items, resolve);
  return boxes.some((box, i) => collidesWithAny(box, boxes.slice(i + 1)));
};

describe("findFreeSpot", () => {
  it("puts the first pedal at the start of the top row", () => {
    expect(findFreeSpot([], W)).toEqual({ xPct: 3, yPct: ROW_Y_PCT[0] });
  });

  it("leaves a gap instead of butting the next pedal against it", () => {
    const spot = findFreeSpot([{ xPct: 3, yPct: ROW_Y_PCT[0], wPct: W }], W);
    expect(spot?.yPct).toBe(ROW_Y_PCT[0]);
    expect(spot?.xPct).toBeGreaterThan(3 + W);
  });

  it("drops to the second row once the first one is full", () => {
    const full = Array.from({ length: 6 }, (_, i) => ({
      xPct: 3 + i * 16,
      yPct: ROW_Y_PCT[0],
      wPct: W,
    }));
    expect(findFreeSpot(full, W)?.yPct).toBe(ROW_Y_PCT[1]);
  });

  it("returns null when both rows are taken", () => {
    const full = ROW_Y_PCT.flatMap((yPct) =>
      Array.from({ length: 6 }, (_, i) => ({ xPct: 3 + i * 16, yPct, wPct: W })),
    );
    expect(findFreeSpot(full, W)).toBeNull();
  });

  it("refuses a pedal wider than the board", () => {
    expect(findFreeSpot([], 99)).toBeNull();
  });
});

describe("layoutBoard", () => {
  it("leaves a board that is already fine exactly as it is", () => {
    const items = [at("a", 3, ROW_Y_PCT[0]), at("b", 40, ROW_Y_PCT[1])];
    const layout = layoutBoard(items, widthOf);

    expect(layout.placed).toEqual(items);
    expect(layout.changed).toBe(false);
    expect(layout.overflow).toEqual([]);
  });

  it("moves a pedal off the one it was dropped on", () => {
    const items = [at("a", 3, ROW_Y_PCT[0]), at("b", 3, ROW_Y_PCT[0])];
    const layout = layoutBoard(items, widthOf);

    expect(layout.changed).toBe(true);
    expect(layout.placed).toHaveLength(2);
    expect(hasOverlap(layout.placed)).toBe(false);
    // The pedal that was there first is the one that keeps its spot.
    expect(layout.placed[0]).toEqual(items[0]);
  });

  it("repairs a whole stack of pedals sharing three positions", () => {
    const items = [
      at("a", 3, 8),
      at("b", 3, 8),
      at("c", 35, 8),
      at("d", 35, 8),
      at("e", 67, 8),
      at("f", 67, 8),
    ];
    const layout = layoutBoard(items, widthOf);

    expect(layout.overflow).toEqual([]);
    expect(layout.placed).toHaveLength(6);
    expect(hasOverlap(layout.placed)).toBe(false);
  });

  it("pulls a pedal hanging off the surface back onto it", () => {
    const layout = layoutBoard([at("a", 96, ROW_Y_PCT[0])], widthOf);

    expect(layout.changed).toBe(true);
    expect(layout.placed[0].xPct + W).toBeLessThanOrEqual(100);
    expect(layout.placed[0].yPct + PEDAL_H_PCT).toBeLessThanOrEqual(100);
  });

  it("hands back the pedals a full board cannot hold instead of dropping them", () => {
    const items = Array.from({ length: 16 }, (_, i) => at(`p${i}`, 3, 8));
    const layout = layoutBoard(items, widthOf);

    expect(layout.overflow.length).toBeGreaterThan(0);
    expect(layout.placed.length + layout.overflow.length).toBe(items.length);
    expect(hasOverlap(layout.placed)).toBe(false);
  });

  it("keeps wide pedals from swallowing their neighbours", () => {
    const resolve = wideAt(["wide"]);
    const items = [at("wide", 3, ROW_Y_PCT[0]), at("a", 20, ROW_Y_PCT[0])];
    const layout = layoutBoard(items, resolve);

    expect(hasOverlap(layout.placed, resolve)).toBe(false);
  });
});

describe("inChainOrder", () => {
  it("reads the top row before the bottom one, each left to right", () => {
    const items = [
      at("bottom-right", 70, ROW_Y_PCT[1]),
      at("top-right", 70, ROW_Y_PCT[0]),
      at("bottom-left", 3, ROW_Y_PCT[1]),
      at("top-left", 3, ROW_Y_PCT[0]),
    ];

    expect(inChainOrder(items).map((i) => i.itemId)).toEqual([
      "top-left",
      "top-right",
      "bottom-left",
      "bottom-right",
    ]);
  });

  it("leaves the caller's array alone", () => {
    const items = [at("b", 70, ROW_Y_PCT[0]), at("a", 3, ROW_Y_PCT[0])];
    inChainOrder(items);
    expect(items.map((i) => i.itemId)).toEqual(["b", "a"]);
  });
});

describe("packInOrder", () => {
  it("keeps the order it was handed rather than re-reading the board", () => {
    // Deliberately against reading order: this is what "Wire It Up" relies on.
    const items = [at("second", 3, ROW_Y_PCT[0]), at("first", 70, ROW_Y_PCT[1])];
    const layout = packInOrder(items, widthOf);

    expect(layout.placed.map((i) => i.itemId)).toEqual(["second", "first"]);
    expect(layout.placed[0].xPct).toBeLessThan(layout.placed[1].xPct);
    expect(layout.placed.every((i) => i.yPct === ROW_Y_PCT[0])).toBe(true);
  });

  it("reports the board as changed when it had to move something", () => {
    const layout = packInOrder([at("a", 40, ROW_Y_PCT[1])], widthOf);
    expect(layout.changed).toBe(true);
  });

  it("reports no change when everything was already where it belongs", () => {
    const packed = packInOrder(
      [at("a", 0, 0), at("b", 0, 0)],
      widthOf,
    ).placed;

    expect(packInOrder(packed, widthOf).changed).toBe(false);
  });
});

describe("tidyBoard", () => {
  it("packs the board into rows, top row first", () => {
    const items = [at("a", 70, ROW_Y_PCT[1]), at("b", 3, ROW_Y_PCT[0])];
    const layout = tidyBoard(items, widthOf);

    // Reading order puts the top-row pedal first, so it stays leftmost.
    expect(layout.placed[0].itemId).toBe("b");
    expect(layout.placed[0]).toMatchObject({ xPct: 3, yPct: ROW_Y_PCT[0] });
    expect(layout.placed[1].yPct).toBe(ROW_Y_PCT[0]);
    expect(layout.placed[1].xPct).toBeGreaterThan(3 + W);
  });

  it("never leaves two pedals touching", () => {
    const items = Array.from({ length: 10 }, (_, i) => at(`p${i}`, 3, 8));
    const layout = tidyBoard(items, widthOf);

    expect(layout.overflow).toEqual([]);
    expect(hasOverlap(layout.placed)).toBe(false);
  });

  it("overflows what is left once both rows are packed", () => {
    const items = Array.from({ length: 14 }, (_, i) => at(`p${i}`, 3, 8));
    const layout = tidyBoard(items, widthOf);

    expect(layout.placed.length + layout.overflow.length).toBe(items.length);
    expect(layout.overflow.length).toBeGreaterThan(0);
    expect(hasOverlap(layout.placed)).toBe(false);
  });
});
