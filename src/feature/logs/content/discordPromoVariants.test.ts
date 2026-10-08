import { describe, expect, it } from "vitest";

import {
  DISCORD_PROMO_VARIANT_COUNT,
  getDiscordPromoCopy,
  pickDiscordPromoVariant,
} from "./discordPromoVariants";

describe("discord promo variants", () => {
  it("never tells the same joke twice in a row", () => {
    for (let shown = 0; shown < DISCORD_PROMO_VARIANT_COUNT * 2; shown++) {
      expect(pickDiscordPromoVariant(shown)).not.toBe(
        pickDiscordPromoVariant(shown + 1),
      );
    }
  });

  it("goes through every joke before repeating", () => {
    const seen = new Set(
      Array.from({ length: DISCORD_PROMO_VARIANT_COUNT }, (_, i) =>
        pickDiscordPromoVariant(i),
      ),
    );
    expect(seen.size).toBe(DISCORD_PROMO_VARIANT_COUNT);
  });

  it("wraps an unknown stored variant instead of rendering nothing", () => {
    const copy = getDiscordPromoCopy(DISCORD_PROMO_VARIANT_COUNT + 1);
    expect(copy).toEqual(getDiscordPromoCopy(1));
    expect(getDiscordPromoCopy(Number.NaN).headline).toBeTruthy();
  });

  it("gives every joke a headline and a pitch", () => {
    for (let variant = 0; variant < DISCORD_PROMO_VARIANT_COUNT; variant++) {
      const copy = getDiscordPromoCopy(variant);
      expect(copy.headline).toBeTruthy();
      expect(copy.body).toBeTruthy();
    }
  });
});
