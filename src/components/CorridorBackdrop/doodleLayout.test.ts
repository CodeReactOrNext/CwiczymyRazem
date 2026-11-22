import { describe, expect, it } from "vitest";

import { buildDoodleLayout, doodleRadius, torusDistance } from "./doodleLayout";

const OPTIONS = {
  tile: 640,
  seed: 7,
  iconKinds: 30,
  iconCount: 60,
  fillerCount: 120,
  minIconSize: 16,
  maxIconSize: 40,
  gap: 8,
};

describe("buildDoodleLayout", () => {
  it("draws the same layout for the same seed", () => {
    expect(buildDoodleLayout(OPTIONS)).toEqual(buildDoodleLayout(OPTIONS));
    expect(buildDoodleLayout({ ...OPTIONS, seed: 8 })).not.toEqual(buildDoodleLayout(OPTIONS));
  });

  it("keeps every item inside the tile with clear space around it, across the seam too", () => {
    const items = buildDoodleLayout(OPTIONS);
    for (const item of items) {
      expect(item.x).toBeGreaterThanOrEqual(0);
      expect(item.x).toBeLessThan(OPTIONS.tile);
      expect(item.y).toBeGreaterThanOrEqual(0);
      expect(item.y).toBeLessThan(OPTIONS.tile);
    }
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const a = items[i];
        const b = items[j];
        expect(torusDistance(a.x, a.y, b.x, b.y, OPTIONS.tile)).toBeGreaterThanOrEqual(
          doodleRadius(a) + doodleRadius(b) + OPTIONS.gap - 1e-9
        );
      }
    }
  });

  it("fills the tile and uses every icon before repeating one", () => {
    const items = buildDoodleLayout(OPTIONS);
    const icons = items.flatMap((item) => (item.kind === "icon" ? [item.icon] : []));
    expect(icons).toHaveLength(OPTIONS.iconCount);
    expect(new Set(icons.slice(0, OPTIONS.iconKinds)).size).toBe(OPTIONS.iconKinds);
    expect(items.length - icons.length).toBe(OPTIONS.fillerCount);
  });
});
