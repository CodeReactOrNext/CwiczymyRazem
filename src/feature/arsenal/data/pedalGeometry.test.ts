import { join } from "node:path";

import { BOARD_TIERS } from "feature/arsenal/data/rigHardware";
import { getEffectImageSrc } from "feature/arsenal/utils/effectImage";
import {
  createWidthResolver,
  geometryFor,
  heightPctFor,
} from "feature/arsenal/utils/pedalboardLayout";
import sharp from "sharp";
import { describe, expect, it } from "vitest";

import { EFFECT_DEFINITIONS } from "./effectDefinitions";

const expansion = EFFECT_DEFINITIONS.filter(
  (effect) => Number(effect.id) >= 35 && Number(effect.id) <= 54,
);

describe("pedal geometry measured from the shipped artwork", () => {
  it.each(expansion)("seats both signal plugs in $name", async (effect) => {
    const { data, info } = await sharp(
      join(process.cwd(), "public", getEffectImageSrc(effect.imageId, "full")),
    )
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const { width, height } = info;
    const jacks = effect.jacks!;
    const alpha = (x: number, y: number) => data[(y * width + x) * 4 + 3] ?? 0;
    for (const side of ["in", "out"] as const) {
      const socket = jacks[side];
      const x = Math.round(socket.x * width);
      const y = Math.round(socket.y * height);
      // The visible socket tip must reach the authored cable centre.
      const column = Math.max(
        0,
        Math.min(width - 1, x + (side === "in" ? -2 : 2)),
      );
      expect(alpha(column, y), `${effect.name} ${side}`).toBeGreaterThan(180);
      // The plug extends past the nut to the enclosure, rather than floating beside it.
      const seat = Math.round(
        (socket.x + (side === "in" ? -1 : 1) * jacks.nut!) * width,
      );
      expect(alpha(seat, y), `${effect.name} ${side} seat`).toBeGreaterThan(
        180,
      );
    }
  });

  it("keeps the standard compressor, flanger, EQ and tuner at comparable heights", () => {
    const geo = geometryFor(BOARD_TIERS[2]);
    const inventory = [38, 43, 48, 51].map((effectId) => ({
      id: String(effectId),
      effectId,
      acquiredAt: 0,
      isNew: false,
    }));
    const widthOf = createWidthResolver(geo, inventory);
    const heights = inventory.map((item) =>
      heightPctFor(geo, widthOf, item.id),
    );
    expect(Math.max(...heights) / Math.min(...heights)).toBeLessThan(1.1);
  });

  it("gives full-size treadles a consistent footprint larger than a single stompbox", () => {
    const geo = geometryFor(BOARD_TIERS[2]);
    const inventory = [34, 35, 36, 37, 38, 46].map((effectId) => ({
      id: String(effectId),
      effectId,
      acquiredAt: 0,
      isNew: false,
    }));
    const widthOf = createWidthResolver(geo, inventory);
    const standard = heightPctFor(geo, widthOf, "38");
    const treadles = [34, 35, 36, 37].map((id) =>
      heightPctFor(geo, widthOf, String(id)),
    );
    expect(Math.max(...treadles) / Math.min(...treadles)).toBeLessThan(1.05);
    expect(Math.min(...treadles) / standard).toBeGreaterThan(1.4);
    expect(heightPctFor(geo, widthOf, "46") / standard).toBeLessThan(0.9);
  });
});
