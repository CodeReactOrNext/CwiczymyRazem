import { describe, expect, it } from "vitest";

import type {
  EffectInventoryItem,
  PedalboardPlacement,
} from "../types/arsenal.types";
import {
  collidesWithAny,
  createJackResolver,
  EFFECT_JACK_Y,
  findFreeSpot,
  findSwapTarget,
  inChainOrder,
  layoutBoard,
  packInOrder,
  PEDAL_H_PCT,
  planSwap,
  ROW_Y_PCT,
  SIDE_JACKS,
  tidyBoard,
  type WidthResolver,
} from "./pedalboardLayout";

/** A plain single pedal is roughly this wide on the board. */
const W = 15;

/** Where the first pedal of a row lands: hard against the input jack's corner. */
const HEAD_X = 100 - 3 - W;

const widthOf: WidthResolver = () => W;
const wideAt =
  (wide: string[], wideW = 28): WidthResolver =>
  (itemId) =>
    wide.includes(itemId) ? wideW : W;

const at = (
  itemId: string,
  xPct: number,
  yPct: number,
): PedalboardPlacement => ({
  itemId,
  xPct,
  yPct,
});

const boxesOf = (
  items: PedalboardPlacement[],
  resolve: WidthResolver = widthOf,
) => items.map((item) => ({ ...item, wPct: resolve(item.itemId) }));

const hasOverlap = (
  items: PedalboardPlacement[],
  resolve: WidthResolver = widthOf,
) => {
  const boxes = boxesOf(items, resolve);
  return boxes.some((box, i) => collidesWithAny(box, boxes.slice(i + 1)));
};

describe("findFreeSpot", () => {
  it("puts the first pedal at the head of the top row, on the right", () => {
    expect(findFreeSpot([], W)).toEqual({ xPct: HEAD_X, yPct: ROW_Y_PCT[0] });
  });

  it("leaves a gap instead of butting the next pedal against it", () => {
    const spot = findFreeSpot(
      [{ xPct: HEAD_X, yPct: ROW_Y_PCT[0], wPct: W }],
      W,
    );
    expect(spot?.yPct).toBe(ROW_Y_PCT[0]);
    // The next pedal down the chain stands to the left of the first, clear of it.
    expect((spot?.xPct ?? 0) + W).toBeLessThan(HEAD_X);
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
      Array.from({ length: 6 }, (_, i) => ({
        xPct: 3 + i * 16,
        yPct,
        wPct: W,
      })),
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
  it("reads the top row before the bottom one, each right to left", () => {
    const items = [
      at("bottom-right", 70, ROW_Y_PCT[1]),
      at("top-right", 70, ROW_Y_PCT[0]),
      at("bottom-left", 3, ROW_Y_PCT[1]),
      at("top-left", 3, ROW_Y_PCT[0]),
    ];

    expect(inChainOrder(items).map((i) => i.itemId)).toEqual([
      "top-right",
      "top-left",
      "bottom-right",
      "bottom-left",
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
    const items = [
      at("second", 3, ROW_Y_PCT[0]),
      at("first", 70, ROW_Y_PCT[1]),
    ];
    const layout = packInOrder(items, widthOf);

    expect(layout.placed.map((i) => i.itemId)).toEqual(["second", "first"]);
    // First in the handed order stands nearest the input jack, so furthest right.
    expect(layout.placed[0].xPct).toBeGreaterThan(layout.placed[1].xPct);
    expect(layout.placed.every((i) => i.yPct === ROW_Y_PCT[0])).toBe(true);
  });

  it("reports the board as changed when it had to move something", () => {
    const layout = packInOrder([at("a", 40, ROW_Y_PCT[1])], widthOf);
    expect(layout.changed).toBe(true);
  });

  it("reports no change when everything was already where it belongs", () => {
    const packed = packInOrder([at("a", 0, 0), at("b", 0, 0)], widthOf).placed;

    expect(packInOrder(packed, widthOf).changed).toBe(false);
  });
});

describe("tidyBoard", () => {
  it("packs the board into rows, top row first", () => {
    const items = [at("a", 70, ROW_Y_PCT[1]), at("b", 3, ROW_Y_PCT[0])];
    const layout = tidyBoard(items, widthOf);

    // Signal order puts the top-row pedal first, so it stays rightmost.
    expect(layout.placed[0].itemId).toBe("b");
    expect(layout.placed[0]).toMatchObject({
      xPct: HEAD_X,
      yPct: ROW_Y_PCT[0],
    });
    expect(layout.placed[1].yPct).toBe(ROW_Y_PCT[0]);
    expect(layout.placed[1].xPct + W).toBeLessThan(HEAD_X);
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

describe("findSwapTarget", () => {
  const boxes = boxesOf([at("a", 3, ROW_Y_PCT[0]), at("b", 40, ROW_Y_PCT[1])]);

  it("names the pedal the dragged one's centre has crossed into", () => {
    const dragged = { xPct: 36, yPct: ROW_Y_PCT[1], wPct: W };
    expect(findSwapTarget(dragged, boxes)?.itemId).toBe("b");
  });

  it("stays quiet while the two only touch", () => {
    // Overlapping "b" by a sliver: carrying a pedal past its neighbour is not
    // yet asking to take its place.
    const dragged = { xPct: 26, yPct: ROW_Y_PCT[1], wPct: W };
    expect(findSwapTarget(dragged, boxes)).toBeNull();
  });

  it("stays quiet over clear board", () => {
    const dragged = { xPct: 70, yPct: ROW_Y_PCT[0], wPct: W };
    expect(findSwapTarget(dragged, boxes)).toBeNull();
  });
});

describe("planSwap", () => {
  it("exchanges two pedals of the same size outright", () => {
    const home = { xPct: 3, yPct: ROW_Y_PCT[0], wPct: W };
    const target = { itemId: "b", xPct: 40, yPct: ROW_Y_PCT[1], wPct: W };
    const plan = planSwap(home, target, []);

    expect(plan?.target).toEqual({ xPct: 3, yPct: ROW_Y_PCT[0] });
    expect(plan?.home).toEqual({ xPct: 40, yPct: ROW_Y_PCT[1] });
  });

  it("shifts a wide pedal inside the slot it is handed so it clears the neighbours", () => {
    const resolve = wideAt(["wide"]);
    const others = boxesOf([at("right", 55, ROW_Y_PCT[0])], resolve);
    const home = { xPct: 35, yPct: ROW_Y_PCT[0], wPct: W };
    const target = { itemId: "wide", xPct: 3, yPct: ROW_Y_PCT[0], wPct: 28 };
    const plan = planSwap(home, target, others);

    expect(plan).not.toBeNull();
    const swapped = [
      { ...plan!.target, wPct: 28 },
      { ...plan!.home, wPct: W },
      ...others,
    ];
    expect(
      swapped.some((box, i) => collidesWithAny(box, swapped.slice(i + 1))),
    ).toBe(false);
  });

  it("refuses the trade when the wide pedal cannot fit the slot at all", () => {
    const others = boxesOf([
      at("left", 18, ROW_Y_PCT[0]),
      at("right", 52, ROW_Y_PCT[0]),
    ]);
    const home = { xPct: 35, yPct: ROW_Y_PCT[0], wPct: W };
    const target = { itemId: "wide", xPct: 3, yPct: ROW_Y_PCT[1], wPct: 28 };

    expect(planSwap(home, target, others)).toBeNull();
  });

  it("keeps the board free of overlaps when a narrow pedal takes a wide one's place", () => {
    const resolve = wideAt(["wide"]);
    const others = boxesOf([at("tail", 60, ROW_Y_PCT[0])], resolve);
    const home = { xPct: 3, yPct: ROW_Y_PCT[0], wPct: 28 };
    const target = { itemId: "narrow", xPct: 40, yPct: ROW_Y_PCT[0], wPct: W };
    const plan = planSwap(home, target, others);

    expect(plan).not.toBeNull();
    const swapped = [
      { ...plan!.target, wPct: W },
      { ...plan!.home, wPct: 28 },
      ...others,
    ];
    expect(
      swapped.some((box, i) => collidesWithAny(box, swapped.slice(i + 1))),
    ).toBe(false);
  });
});

describe("createJackResolver", () => {
  const owned = (id: string, effectId: number): EffectInventoryItem => ({
    id,
    effectId,
    acquiredAt: 0,
    isNew: false,
  });

  it("puts a side socket at the height its own artwork wears it", () => {
    // Effect 17 is the compact OD-5, whose sockets sit well above centre.
    const resolve = createJackResolver([owned("compact", 17)]);
    const jacks = resolve("compact");

    expect(jacks.edge).toBe("side");
    expect(jacks.in.y).toBe(EFFECT_JACK_Y[18]);
    expect(jacks.in.y).toEqual(jacks.out.y);
    expect(jacks.in.y).toBeLessThan(0.5);
  });

  it("reads the two faces at the same height, one per side", () => {
    const resolve = createJackResolver([owned("echo", 1)]);
    const jacks = resolve("echo");

    expect(jacks.in.x).toBe(1);
    expect(jacks.out.x).toBe(0);
    expect(jacks.in.y).toBe(EFFECT_JACK_Y[1]);
  });

  it("leaves a top-mounted pedal to the layout on its own definition", () => {
    // Effect 13 takes its cable over the top, not in through a side.
    const resolve = createJackResolver([owned("lab", 13)]);
    expect(resolve("lab").edge).toBe("top");
  });

  it("falls back to mid-height for a pedal it knows nothing about", () => {
    const resolve = createJackResolver([]);
    expect(resolve("nobody")).toEqual(SIDE_JACKS);
  });
});
