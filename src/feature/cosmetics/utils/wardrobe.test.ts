import {
  AVATAR_EFFECTS,
  BANNERS,
  cosmeticImage,
  COSMETICS,
} from "feature/cosmetics/data/cosmeticsCatalog";
import {
  checkPurchase,
  EMPTY_WARDROBE,
  publicEntry,
  readWardrobe,
  withEquipped,
  withPurchase,
} from "feature/cosmetics/utils/wardrobe";
import { existsSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";

const WOLF = "banner:wolf";
const FIRE = "avatar:fire";

describe("cosmetics catalog", () => {
  it("has unique ids and whole, positive prices", () => {
    expect(new Set(COSMETICS.map((item) => item.id)).size).toBe(COSMETICS.length);
    COSMETICS.forEach((item) => {
      expect(Number.isInteger(item.price)).toBe(true);
      expect(item.price).toBeGreaterThan(0);
    });
  });

  it("ships a picture for every item that is not drawn in code", () => {
    COSMETICS.filter((item) => !(item.kind === "banner" && item.drawn)).forEach((item) => {
      expect(
        existsSync(join(process.cwd(), "public", cosmeticImage(item))),
        cosmeticImage(item),
      ).toBe(true);
    });
  });

  it("keeps banners and avatar effects in their own lists", () => {
    expect(BANNERS.every((item) => item.id.startsWith("banner:"))).toBe(true);
    expect(AVATAR_EFFECTS.every((item) => item.id.startsWith("avatar:"))).toBe(true);
  });
});

describe("readWardrobe", () => {
  it("reads nothing as an empty wardrobe", () => {
    expect(readWardrobe(undefined)).toEqual({
      owned: [],
      equipped: { banner: null, avatar: null },
    });
  });

  it("drops ids the catalog does not know and pieces that are not owned", () => {
    const wardrobe = readWardrobe({
      owned: [WOLF, "banner:gone", WOLF],
      equipped: { banner: WOLF, avatar: FIRE },
    });
    expect(wardrobe.owned).toEqual([WOLF]);
    expect(wardrobe.equipped).toEqual({ banner: WOLF, avatar: null });
  });

  it("refuses a piece stored in the wrong slot", () => {
    const wardrobe = readWardrobe({ owned: [FIRE], equipped: { banner: FIRE } });
    expect(wardrobe.equipped.banner).toBeNull();
  });
});

describe("checkPurchase", () => {
  it("prices a new piece from the catalog", () => {
    const wolf = BANNERS.find((item) => item.id === WOLF)!;
    expect(checkPurchase(EMPTY_WARDROBE, WOLF)).toEqual({ ok: true, price: wolf.price });
  });

  it("refuses a second copy and an unknown id", () => {
    expect(checkPurchase({ owned: [WOLF], equipped: {} }, WOLF)).toEqual({
      ok: false,
      reason: "owned",
    });
    expect(checkPurchase(EMPTY_WARDROBE, "banner:nope")).toEqual({
      ok: false,
      reason: "unknown",
    });
  });
});

describe("wearing", () => {
  it("puts a bought piece straight on, leaving the other slot alone", () => {
    const wardrobe = withPurchase({ owned: [FIRE], equipped: { avatar: FIRE } }, WOLF);
    expect(wardrobe.owned).toEqual([FIRE, WOLF]);
    expect(wardrobe.equipped).toEqual({ avatar: FIRE, banner: WOLF });
  });

  it("only wears what is owned, in the slot it belongs to", () => {
    const wardrobe = { owned: [WOLF], equipped: {} };
    expect(withEquipped(wardrobe, "banner", WOLF)?.equipped.banner).toBe(WOLF);
    expect(withEquipped(wardrobe, "avatar", WOLF)).toBeNull();
    expect(withEquipped(wardrobe, "avatar", FIRE)).toBeNull();
  });

  it("takes a piece off", () => {
    const wardrobe = { owned: [WOLF], equipped: { banner: WOLF } };
    expect(withEquipped(wardrobe, "banner", null)?.equipped.banner).toBeNull();
  });

  it("publishes only the filled slots", () => {
    expect(publicEntry({ banner: WOLF, avatar: null })).toEqual({ banner: WOLF });
    expect(publicEntry({})).toEqual({});
  });
});
