import { describe, expect, it } from "vitest";

import { EFFECTS_BY_ID } from "../data/effectDefinitions";
import { GUITARS_BY_ID } from "../data/guitarDefinitions";
import type { ScrapPart } from "../types/arsenal.types";
import {
  addPartsToWallet,
  countScrapParts,
  getEffectScrapYield,
  getGuitarScrapYield,
  getWalletTierTotals,
  groupWalletByPart,
} from "./scrap";

const guitar = (id: number) => GUITARS_BY_ID.get(id)!;
const effect = (id: number) => EFFECTS_BY_ID.get(id)!;
const tierOf = (parts: ScrapPart[], partId: string) =>
  parts.find((p) => p.partId === partId)?.tier;

describe("getGuitarScrapYield", () => {
  it("pays out the same parts for the same instance every time", () => {
    const item = { features: undefined };
    expect(getGuitarScrapYield(item, guitar(24))).toEqual(
      getGuitarScrapYield(item, guitar(24)),
    );
  });

  it("tiers the yield off the guitar's rarity", () => {
    // 24 = Fairmont Stratocaster (Common), 44 = Stratocaster Custom (Legendary).
    // Same archetype, so the headline slot is the same part in both.
    expect(tierOf(getGuitarScrapYield({}, guitar(24)), "pickup")).toBe(
      "Standard",
    );
    expect(tierOf(getGuitarScrapYield({}, guitar(44)), "pickup")).toBe(
      "Legendary",
    );
  });

  it("gives a cheap guitar one slot, a Legendary one three", () => {
    // Screws ride on top of every teardown, so the BOM half is what is counted.
    const slots = (parts: ScrapPart[]) =>
      parts.filter((p) => p.partId !== "screws");
    expect(slots(getGuitarScrapYield({}, guitar(24)))).toHaveLength(1); // Common
    expect(slots(getGuitarScrapYield({}, guitar(44)))).toHaveLength(3); // Legendary
  });

  it("never yields a neck from a set-neck guitar", () => {
    // 42 = Eclipse Custom (Legendary single-cut)
    const parts = getGuitarScrapYield({}, guitar(42));
    expect(parts.some((p) => p.partId === "body")).toBe(true);
    expect(parts.some((p) => p.partId === "neck")).toBe(false);
  });

  it("yields Unique showpiece parts from a Mythic guitar", () => {
    // 43 = Stratocaster Heavy Relic (Mythic)
    const parts = getGuitarScrapYield({}, guitar(43));
    expect(tierOf(parts, "pickup")).toBe("Unique");
    expect(tierOf(parts, "body")).toBe("Unique");
    // The plain parts stay on the normal ladder.
    expect(tierOf(parts, "neck")).toBe("Legendary");
  });

  it("upgrades the part matching a rolled feature", () => {
    // 44 = Stratocaster Custom (Legendary) — reaches the neck slot.
    const plain = getGuitarScrapYield({}, guitar(44));
    const upgraded = getGuitarScrapYield(
      { features: [{ id: "graphite-neck", points: 2 }] },
      guitar(44),
    );
    expect(tierOf(plain, "neck")).toBe("Legendary");
    // Already at the top of its ladder — the bump cannot push it past Legendary.
    expect(tierOf(upgraded, "neck")).toBe("Legendary");

    // On cheaper gear the same feature does move the needle.
    const cheapPlain = getGuitarScrapYield({}, guitar(47)); // Rare Stratocaster
    const cheapUpgraded = getGuitarScrapYield(
      { features: [{ id: "graphite-neck", points: 2 }] },
      guitar(47),
    );
    expect(tierOf(cheapPlain, "neck")).toBe("Epic");
    expect(tierOf(cheapUpgraded, "neck")).toBe("Legendary");
  });
});

describe("getEffectScrapYield", () => {
  it("strips a cheap pedal down to its headline part", () => {
    // 2 = TS-808 Overdrive (Common) — one slot, and diodes lead an overdrive.
    expect(
      getEffectScrapYield({}, effect(2)).filter((p) => p.partId !== "screws"),
    ).toEqual([{ partId: "diode", tier: "Standard", qty: 2 }]);
  });

  it("gives up the enclosure at Legendary", () => {
    // 14 = Astral Reverberator (Legendary)
    expect(tierOf(getEffectScrapYield({}, effect(14)), "enclosure")).toBe(
      "Legendary",
    );
  });

  it("upgrades the op-amp when the pedal rolled an NOS chip", () => {
    // 3 = Amber Forge (Rare) — three slots, op-amp sits second at Epic.
    const plain = getEffectScrapYield({}, effect(3));
    const upgraded = getEffectScrapYield(
      { features: [{ id: "nos-opamp", points: 4 }] },
      effect(3),
    );
    expect(tierOf(plain, "opamp")).toBe("Epic");
    expect(tierOf(upgraded, "opamp")).toBe("Legendary");
  });

  it("gives a fuzz clipping diodes but no op-amp — it is a discrete circuit", () => {
    // 11 = Stereo Fuzz Lab (Legendary)
    const parts = getEffectScrapYield({}, effect(11));
    expect(tierOf(parts, "diode")).toBe("Legendary");
    expect(tierOf(parts, "opamp")).toBeUndefined();
  });
});

describe("countScrapParts", () => {
  it("sums quantities rather than counting rows", () => {
    expect(
      countScrapParts([
        { partId: "screws", tier: "Standard", qty: 3 },
        { partId: "body", tier: "Epic", qty: 1 },
      ]),
    ).toBe(4);
  });
});

describe("addPartsToWallet", () => {
  it("stacks a payout onto what the player already owns", () => {
    const wallet: ScrapPart[] = [
      { partId: "screws", tier: "Standard", qty: 4 },
    ];
    const gained: ScrapPart[] = [
      { partId: "screws", tier: "Standard", qty: 1 },
      { partId: "pickup", tier: "Epic", qty: 2 },
    ];
    expect(addPartsToWallet(wallet, gained)).toEqual([
      { partId: "pickup", tier: "Epic", qty: 2 },
      { partId: "screws", tier: "Standard", qty: 5 },
    ]);
  });

  it("leaves the original wallet untouched", () => {
    const wallet: ScrapPart[] = [
      { partId: "screws", tier: "Standard", qty: 4 },
    ];
    addPartsToWallet(wallet, [{ partId: "screws", tier: "Standard", qty: 6 }]);
    expect(wallet).toEqual([{ partId: "screws", tier: "Standard", qty: 4 }]);
  });

  it("prunes retired part types out of the stored wallet", () => {
    const stale = "footswitch" as unknown as ScrapPart["partId"];
    const wallet: ScrapPart[] = [
      { partId: stale, tier: "Standard", qty: 2 },
      { partId: "screws", tier: "Standard", qty: 1 },
    ];
    expect(
      addPartsToWallet(wallet, [{ partId: "body", tier: "Epic", qty: 1 }]),
    ).toEqual([
      { partId: "body", tier: "Epic", qty: 1 },
      { partId: "screws", tier: "Standard", qty: 1 },
    ]);
  });
});

describe("groupWalletByPart", () => {
  it("collapses tiers of one part into a single row with a total", () => {
    const rows = groupWalletByPart([
      { partId: "body", tier: "Standard", qty: 2 },
      { partId: "body", tier: "Legendary", qty: 1 },
      { partId: "screws", tier: "Standard", qty: 9 },
    ]);

    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({
      partId: "body",
      total: 3,
      // Rarest tier first.
      tiers: [
        { tier: "Legendary", qty: 1 },
        { tier: "Standard", qty: 2 },
      ],
    });
    expect(rows[1].partId).toBe("screws");
  });

  it("drops empty stacks", () => {
    expect(
      groupWalletByPart([{ partId: "body", tier: "Epic", qty: 0 }]),
    ).toEqual([]);
  });

  it("hides parts left over from a retired part type", () => {
    // Wallets minted before the part list was trimmed still hold these ids.
    const stale = "knob" as unknown as ScrapPart["partId"];
    const rows = groupWalletByPart([
      { partId: stale, tier: "Standard", qty: 3 },
      { partId: "body", tier: "Epic", qty: 1 },
    ]);
    expect(rows.map((r) => r.partId)).toEqual(["body"]);
  });
});

describe("getWalletTierTotals", () => {
  it("splits the wallet by tier, rarest first", () => {
    expect(
      getWalletTierTotals([
        { partId: "screws", tier: "Standard", qty: 5 },
        { partId: "body", tier: "Legendary", qty: 1 },
        { partId: "pickup", tier: "Epic", qty: 2 },
        { partId: "neck", tier: "Standard", qty: 4 },
      ]),
    ).toEqual([
      { tier: "Legendary", qty: 1 },
      { tier: "Epic", qty: 2 },
      { tier: "Standard", qty: 9 },
    ]);
  });

  it("ignores retired part types", () => {
    const stale = "capacitor" as unknown as ScrapPart["partId"];
    expect(
      getWalletTierTotals([
        { partId: stale, tier: "Standard", qty: 7 },
        { partId: "body", tier: "Epic", qty: 1 },
      ]),
    ).toEqual([{ tier: "Epic", qty: 1 }]);
  });
});
