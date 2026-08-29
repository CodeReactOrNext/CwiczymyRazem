import {
  DEFAULT_COSMETIC,
  findCosmetic,
  GUILD_COSMETICS,
  slotOf,
} from "feature/guilds/data/guildCosmetics";
import type { GuildCosmetics } from "feature/guilds/types/guild.types";
import {
  accentHex,
  canEquip,
  EMPTY_COSMETICS,
  equippedItem,
  readCosmetics,
} from "feature/guilds/utils/guildCosmetics.utils";
import { describe, expect, it } from "vitest";

const cosmetics = (
  overrides: Partial<GuildCosmetics> = {},
): GuildCosmetics => ({
  ...EMPTY_COSMETICS,
  ...overrides,
});

describe("the catalog", () => {
  it("gives every item an id matching the slot it says it is in", () => {
    for (const item of GUILD_COSMETICS) {
      expect(slotOf(item.id)).toBe(item.slot);
      expect(item.id.startsWith(`${item.slot}:`)).toBe(true);
    }
  });

  it("has an item in every slot to fall back to", () => {
    for (const slot of ["accent", "banner", "frame"] as const) {
      const fallback = DEFAULT_COSMETIC[slot];
      expect(fallback.slot).toBe(slot);
      expect(GUILD_COSMETICS).toContain(fallback);
    }
  });

  it("gives every accent a colour and nothing else one", () => {
    for (const item of GUILD_COSMETICS) {
      if (item.slot === "accent") {
        expect(item.hex).toMatch(/^#[0-9a-f]{6}$/i);
      } else {
        expect(item.hex).toBeUndefined();
      }
    }
  });

  it("does not know ids it was never given", () => {
    expect(findCosmetic("accent:chartreuse")).toBeNull();
    expect(findCosmetic(undefined)).toBeNull();
    expect(slotOf(42)).toBeNull();
  });
});

describe("readCosmetics", () => {
  it("turns a guild founded before cosmetics existed into a dressed one", () => {
    expect(readCosmetics(undefined)).toEqual({
      accent: DEFAULT_COSMETIC.accent.id,
      banner: DEFAULT_COSMETIC.banner.id,
      frame: DEFAULT_COSMETIC.frame.id,
    });
  });

  it("keeps what is there and drops what is the wrong shape", () => {
    const read = readCosmetics({ accent: "accent:ember", banner: 7 });

    expect(read.accent).toBe("accent:ember");
    expect(read.banner).toBe(DEFAULT_COSMETIC.banner.id);
  });

  it("drops the unlocked and funder lists the paid-for kit used to write", () => {
    // Documents from before the kit was free still carry both. Nothing reads
    // them any more, and the next equip writes the object entire.
    expect(
      readCosmetics({
        accent: "accent:ember",
        unlocked: ["accent:ember"],
        funders: { "accent:ember": { uid: "a", fame: 200 } },
      }),
    ).toEqual({
      accent: "accent:ember",
      banner: DEFAULT_COSMETIC.banner.id,
      frame: DEFAULT_COSMETIC.frame.id,
    });
  });
});

describe("equippedItem", () => {
  it("wears whatever the guild put on, paid for by nobody", () => {
    const worn = cosmetics({ accent: "accent:ember" });
    expect(equippedItem(worn, "accent").id).toBe("accent:ember");
    expect(accentHex(worn)).toBe(findCosmetic("accent:ember")?.hex);
  });

  it("falls back on an id from no catalog at all", () => {
    expect(
      equippedItem(cosmetics({ banner: "banner:fireworks" }), "banner").id,
    ).toBe(DEFAULT_COSMETIC.banner.id);
    expect(accentHex(cosmetics({ accent: "accent:gold" }))).toBe(
      DEFAULT_COSMETIC.accent.hex,
    );
  });

  it("falls back when a slot names an item belonging to another slot", () => {
    expect(equippedItem(cosmetics({ frame: "banner:halo" }), "frame").id).toBe(
      DEFAULT_COSMETIC.frame.id,
    );
  });
});

describe("canEquip", () => {
  it("allows anything in the catalog that is not already on", () => {
    expect(canEquip(cosmetics(), "frame:ring")).toBeNull();
    expect(canEquip(cosmetics(), "banner:halo")).toBeNull();
  });

  it("refuses something that is not in the catalog", () => {
    expect(canEquip(cosmetics(), "banner:lasers")).toBe("unknown");
  });

  it("refuses one already being worn, so a no-op is not a write", () => {
    expect(canEquip(cosmetics({ frame: "frame:ring" }), "frame:ring")).toBe(
      "already-worn",
    );
  });
});
