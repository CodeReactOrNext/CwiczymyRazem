import { existsSync } from "node:fs";
import { join } from "node:path";

import { getEffectImageSrc } from "feature/arsenal/utils/effectImage";
import { getRankBadgeSrc } from "feature/arsenal/utils/guitarImage";
import { EFFECT_IMAGE_ASPECT } from "feature/arsenal/utils/pedalboardLayout";
import sharp from "sharp";
import { describe, expect, it } from "vitest";

import { EFFECT_DEFINITIONS, EFFECTS_BY_RARITY } from "./effectDefinitions";
import { DROPPABLE_GUITARS, GUITAR_DEFINITIONS } from "./guitarDefinitions";

const expansionGuitars = GUITAR_DEFINITIONS.filter(
  (g) => Number(g.id) >= 80 && Number(g.id) <= 89,
);
const expansionEffects = EFFECT_DEFINITIONS.filter(
  (e) => Number(e.id) >= 35 && Number(e.id) <= 54,
);

describe("arsenal catalogue assets", () => {
  it("gives every pedal a unique id and art slot in its rarity pool", () => {
    expect(new Set(EFFECT_DEFINITIONS.map((e) => e.id)).size).toBe(
      EFFECT_DEFINITIONS.length,
    );
    expect(new Set(EFFECT_DEFINITIONS.map((e) => e.imageId)).size).toBe(
      EFFECT_DEFINITIONS.length,
    );
    for (const effect of EFFECT_DEFINITIONS) {
      expect(EFFECTS_BY_RARITY[effect.rarity]).toContain(effect);
    }
  });

  it("ships every expansion image in all three consumed sizes", () => {
    const guitars = expansionGuitars;
    const effects = expansionEffects;
    expect(guitars).toHaveLength(10);
    expect(effects).toHaveLength(20);
    for (const guitar of guitars) {
      expect(DROPPABLE_GUITARS).toContain(guitar);
      for (const size of ["small", "medium", "large"] as const) {
        const src = getRankBadgeSrc(guitar.imageId, size);
        expect(existsSync(join(process.cwd(), "public", src)), src).toBe(true);
      }
    }
    for (const effect of effects) {
      for (const size of ["small", "medium", "full"] as const) {
        const src = getEffectImageSrc(effect.imageId, size);
        expect(existsSync(join(process.cwd(), "public", src)), src).toBe(true);
      }
    }
  });

  it("preserves transparency and primes pedalboard geometry from the shipped art", async () => {
    for (const effect of expansionEffects) {
      const file = join(
        process.cwd(),
        "public",
        getEffectImageSrc(effect.imageId, "full"),
      );
      const metadata = await sharp(file).metadata();
      expect(metadata.hasAlpha, effect.name).toBe(true);
      expect(EFFECT_IMAGE_ASPECT[effect.imageId], effect.name).toBeCloseTo(
        metadata.width! / metadata.height!,
        5,
      );
    }
    for (const guitar of expansionGuitars) {
      const file = join(
        process.cwd(),
        "public",
        getRankBadgeSrc(guitar.imageId, "large"),
      );
      const metadata = await sharp(file).metadata();
      expect(metadata.hasAlpha, guitar.name).toBe(true);
      expect(metadata.width!, guitar.name).toBeGreaterThan(metadata.height!);
    }
  });
});
