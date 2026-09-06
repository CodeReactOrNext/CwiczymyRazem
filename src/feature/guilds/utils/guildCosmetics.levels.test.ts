import {
  COSMETIC_SLOTS,
  DEFAULT_COSMETIC,
  DEFAULT_MOTIF_KEYS,
  findCosmetic,
  GUILD_COSMETICS,
  MOTIF_ICONS,
  motifIconLevel,
  motifId,
} from "feature/guilds/data/guildCosmetics";
import {
  canEquip,
  EMPTY_COSMETICS,
  isUnlocked,
  sortByUnlock,
  unlockLevel,
} from "feature/guilds/utils/guildCosmetics.utils";
import { describe, expect, it } from "vitest";

/**
 * The kit gated by the guild's level: what a level unlocks, what the wardrobe
 * shows first, and what the server refuses.
 */
describe("unlock levels", () => {
  it("asks nothing of the defaults, so a new guild is never naked", () => {
    for (const item of Object.values(DEFAULT_COSMETIC)) {
      expect(unlockLevel(item)).toBe(0);
    }
  });

  it("leaves something to wear in every slot from level zero", () => {
    for (const { slot, items } of COSMETIC_SLOTS) {
      if (items.length === 0) continue; // the motif is picked, not listed
      const free = items.filter((item) => isUnlocked(item, 0));
      expect(free.length, slot).toBeGreaterThanOrEqual(2);
    }
  });

  it("gates the fancier half, at levels a guild can actually reach", () => {
    const gated = GUILD_COSMETICS.filter((item) => unlockLevel(item) > 0);
    expect(gated.length).toBeGreaterThan(10);
    for (const item of gated) {
      // Within the first lap of the ladder — see `guildQuests.ts`.
      expect(unlockLevel(item)).toBeLessThanOrEqual(50);
    }
  });

  it("treats a missing or nonsense level as unlocked from the start", () => {
    const plain = {
      id: "accent:x",
      slot: "accent" as const,
      name: "",
      blurb: "",
    };
    expect(unlockLevel(plain)).toBe(0);
    expect(unlockLevel({ ...plain, level: -3 })).toBe(0);
    expect(unlockLevel({ ...plain, level: 4.7 })).toBe(4);
    expect(isUnlocked({ ...plain, level: 4 }, Number.NaN)).toBe(false);
    expect(isUnlocked({ ...plain, level: 4 }, 4)).toBe(true);
  });
});

describe("sortByUnlock", () => {
  const items = COSMETIC_SLOTS.find((entry) => entry.slot === "frame")!.items;

  it("keeps what can be worn first, in catalog order, then the locked by level", () => {
    const sorted = sortByUnlock(items, 5);
    const open = sorted.filter((item) => isUnlocked(item, 5));
    const locked = sorted.filter((item) => !isUnlocked(item, 5));

    expect(sorted.slice(0, open.length)).toEqual(open);
    expect(open).toEqual(items.filter((item) => isUnlocked(item, 5)));

    const levels = locked.map(unlockLevel);
    expect(levels).toEqual([...levels].sort((a, b) => a - b));
    expect(levels[0]).toBeGreaterThan(5);
  });

  it("does not touch the catalog's own array", () => {
    const before = [...items];
    sortByUnlock(items, 0);
    expect(items).toEqual(before);
  });
});

describe("motif icons gated by level", () => {
  it("leaves every instrument free, since the default motif is drawn from them", () => {
    const instruments = MOTIF_ICONS.filter(
      (icon) => icon.group === "instruments",
    );
    expect(instruments.length).toBeGreaterThan(10);
    for (const icon of instruments) {
      expect(motifIconLevel(icon.key)).toBe(0);
    }
    for (const key of DEFAULT_MOTIF_KEYS) {
      expect(motifIconLevel(key)).toBe(0);
    }
  });

  it("gates every other group, icon by icon, within the first lap", () => {
    const gated = MOTIF_ICONS.filter((icon) => icon.group !== "instruments");
    expect(gated.length).toBeGreaterThan(50);
    for (const icon of gated) {
      expect(motifIconLevel(icon.key)).toBeGreaterThan(0);
      expect(motifIconLevel(icon.key)).toBeLessThanOrEqual(50);
    }
  });

  it("prices a set of four at the highest of the four", () => {
    const allFree = motifId(["guitar", "notes", "metalhand", "headphones"]);
    expect(unlockLevel(findCosmetic(allFree)!)).toBe(0);

    const oneGated = motifId(["guitar", "notes", "skull", "headphones"]);
    expect(unlockLevel(findCosmetic(oneGated)!)).toBe(motifIconLevel("skull"));

    const twoGated = motifId(["skull", "dragon", "guitar", "notes"]);
    expect(unlockLevel(findCosmetic(twoGated)!)).toBe(
      Math.max(motifIconLevel("skull"), motifIconLevel("dragon")),
    );
  });

  it("refuses a set the guild has not levelled up to yet", () => {
    const id = motifId(["guitar", "notes", "dragon", "headphones"]);
    const needs = motifIconLevel("dragon");

    expect(canEquip(EMPTY_COSMETICS, id, needs - 1)).toBe("locked");
    expect(canEquip(EMPTY_COSMETICS, id, needs)).toBeNull();
  });
});

describe("canEquip with a level", () => {
  const locked = GUILD_COSMETICS.find((item) => unlockLevel(item) >= 10)!;

  it("refuses an item above the guild's level, and allows it once reached", () => {
    expect(canEquip(EMPTY_COSMETICS, locked.id, unlockLevel(locked) - 1)).toBe(
      "locked",
    );
    expect(
      canEquip(EMPTY_COSMETICS, locked.id, unlockLevel(locked)),
    ).toBeNull();
  });

  it("still answers unknown and already-worn before anything about levels", () => {
    expect(canEquip(EMPTY_COSMETICS, "accent:nothing", 99)).toBe("unknown");
    expect(canEquip(EMPTY_COSMETICS, EMPTY_COSMETICS.accent, 0)).toBe(
      "already-worn",
    );
  });
});
