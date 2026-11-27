import { CASE_DEFINITIONS } from "feature/arsenal/data/caseDefinitions";
import { DROPPABLE_GUITARS_BY_RARITY } from "feature/arsenal/data/guitarDefinitions";
import { describe, expect, it } from "vitest";

import {
  buildRouletteStrip,
  easeInOutQuad,
  easeOutQuart,
  REEL_LENGTH,
  REEL_WIN_INDEX,
  reelHoldMs,
  reelIndexAt,
  reelTarget,
  reelTileLook,
  reelTileWidth,
  type StripItem,
} from "./reelMath";

const firstGuitar = (): StripItem => {
  const def = Object.values(DROPPABLE_GUITARS_BY_RARITY).find((pool) => pool?.length)![0];
  return { kind: "guitar", def };
};

describe("buildRouletteStrip", () => {
  it("puts the pull at the win index of a reel of the default length", () => {
    const win = firstGuitar();
    const strip = buildRouletteStrip(CASE_DEFINITIONS["premium-guitar"], win);
    expect(strip).toHaveLength(REEL_LENGTH);
    expect(strip[REEL_WIN_INDEX]).toBe(win);
  });

  it("fills a guitar-only case with guitars and a parts case with parts", () => {
    const guitars = buildRouletteStrip(CASE_DEFINITIONS["premium-guitar"], firstGuitar());
    expect(guitars.every((item) => item.kind === "guitar")).toBe(true);

    const parts = buildRouletteStrip(CASE_DEFINITIONS.parts, firstGuitar());
    expect(parts.filter((_, i) => i !== REEL_WIN_INDEX).every((item) => item.kind === "component")).toBe(true);
  });
});

describe("reel geometry", () => {
  it("lands the pull's tile under the pointer, wherever the jitter puts it", () => {
    for (const viewport of [390, 960]) {
      const w = reelTileWidth(viewport);
      for (const jitter of [-1, 0, 1]) {
        const x = reelTarget(REEL_WIN_INDEX, viewport, w, jitter);
        expect(reelIndexAt(x, viewport, w)).toBe(REEL_WIN_INDEX);
      }
    }
  });

  it("uses narrower tiles on a phone", () => {
    expect(reelTileWidth(390)).toBeLessThan(reelTileWidth(1280));
  });

  it("makes the centre tile the biggest and fades the far ones out", () => {
    const centre = reelTileLook(0);
    expect(centre).toEqual({ scale: 1.32, y: 0, rotateY: 0, opacity: 1 });
    expect(reelTileLook(1).scale).toBeLessThan(centre.scale);
    expect(reelTileLook(-1).rotateY).toBeGreaterThan(0);
    expect(reelTileLook(1).rotateY).toBeLessThan(0);
    expect(reelTileLook(10).opacity).toBeLessThan(0.1);
  });
});

describe("easing and timing", () => {
  it("eases from 0 to 1", () => {
    for (const ease of [easeOutQuart, easeInOutQuad]) {
      expect(ease(0)).toBe(0);
      expect(ease(1)).toBe(1);
    }
  });

  it("holds a better pull longer", () => {
    expect(reelHoldMs("Common")).toBeLessThan(reelHoldMs("Epic"));
    expect(reelHoldMs("Epic")).toBeLessThan(reelHoldMs("Legendary"));
    expect(reelHoldMs("Mythic")).toBe(reelHoldMs("Legendary"));
  });
});
