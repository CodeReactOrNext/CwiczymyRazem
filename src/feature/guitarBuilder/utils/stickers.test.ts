import { describe, expect, it } from "vitest";

import type { PlacedSticker } from "../types/guitarBuilder.types";
import {
  applyStickers,
  clientToBody,
  hitSticker,
  unrotateQuarterTurn,
} from "./stickers";

const px = (...values: number[]) => new Uint8ClampedArray(values);

describe("applyStickers", () => {
  const base = px(100, 100, 100, 255);
  const maps = px(255, 50, 0, 255);
  const red = px(255, 0, 0, 255);

  it("sticks only where the surface map allows", () => {
    const onFinish = applyStickers(
      px(100, 100, 100, 255),
      red,
      base,
      px(255, 255, 255, 255),
      maps,
      0.39,
      null,
    );
    expect(onFinish[0]).toBeGreaterThan(200);

    const onHardware = applyStickers(
      px(100, 100, 100, 255),
      red,
      base,
      px(0, 0, 0, 255),
      maps,
      0.39,
      null,
    );
    expect([...onHardware]).toEqual([100, 100, 100, 255]);
  });

  it("darkens in the body's shadows and catches its gloss", () => {
    const surface = px(255, 255, 255, 255);
    const shadow = applyStickers(
      px(0, 0, 0, 255),
      red,
      px(30, 30, 30, 255),
      surface,
      maps,
      0.4,
      null,
    );
    const lit = applyStickers(
      px(0, 0, 0, 255),
      red,
      px(102, 102, 102, 255),
      surface,
      maps,
      0.4,
      null,
    );
    const gloss = applyStickers(
      px(0, 0, 0, 255),
      red,
      px(240, 240, 240, 255),
      surface,
      maps,
      0.4,
      null,
    );
    expect(shadow[0]).toBeLessThan(lit[0]);
    expect(gloss[1]).toBeGreaterThan(lit[1]);
  });
});

describe("hitSticker", () => {
  const stickers: PlacedSticker[] = [
    { id: "a", key: "star", x: 100, y: 100, size: 80, rotation: 0 },
    { id: "b", key: "bolt", x: 130, y: 100, size: 80, rotation: 0 },
  ];

  it("returns the topmost sticker under the point", () => {
    expect(hitSticker(stickers, 115, 100)?.id).toBe("b");
    expect(hitSticker(stickers, 65, 100)?.id).toBe("a");
    expect(hitSticker(stickers, 300, 300)).toBeNull();
  });
});

describe("clientToBody", () => {
  it("undoes object-fit: contain letterboxing and the body offset", () => {
    // 1000×400 drawing in a 1000×200 box → scale 0.5, 250 px bars left/right
    const box = { left: 10, top: 20, width: 1000, height: 200 };
    const point = clientToBody(
      10 + 250 + 50,
      20 + 25,
      box,
      { width: 1000, height: 400 },
      { x: 8, y: 30 },
    );
    expect(point).toEqual({ x: 92, y: 20 });
  });
});

describe("unrotateQuarterTurn", () => {
  it("maps a stood-up canvas back to its own frame", () => {
    // 400×400 element at (100, 50), rotated −90°: its local right edge is
    // drawn at the top of the screen, its local top edge on the left
    const rect = { left: 100, top: 50, width: 400, height: 400 };
    const size = { width: 400, height: 400 };
    const top = unrotateQuarterTurn(300, 60, rect, size);
    expect(top.clientX).toBeCloseTo(390);
    expect(top.clientY).toBeCloseTo(200);
    const left = unrotateQuarterTurn(110, 250, rect, size);
    expect(left.clientX).toBeCloseTo(200);
    expect(left.clientY).toBeCloseTo(10);
  });
});
