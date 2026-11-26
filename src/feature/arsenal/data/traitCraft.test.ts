import { describe, expect, it } from "vitest";

import {
  decideExtract,
  decideInsert,
  EXTRACTOR_DROP_CHANCE,
  getImprintResaleValue,
  getInsertCost,
  MAX_ITEM_TRAITS,
  TRAIT_INSERT_FAME,
  type TraitImprint,
} from "./traitCraft";
import { TRAIT_DEFINITIONS } from "./traits";

const NOW = Date.UTC(2026, 10, 26, 20, 0, 0);

const imprint = (
  traitId: string,
  kind: "guitar" | "effect" = "guitar",
  value = 10,
): TraitImprint => ({
  id: `imprint:x:${traitId}`,
  traitId,
  kind,
  value,
  extractedAt: NOW,
});

describe("decideExtract", () => {
  it("lifts the trait off with its exact value and spends one extractor", () => {
    const decision = decideExtract({
      salt: "abc",
      kind: "guitar",
      traits: [
        { id: "workhorse", value: 7.5 },
        { id: "shred-machine", value: 11.5 },
      ],
      traitId: "shred-machine",
      extractors: [
        { id: "e1", acquiredAt: 1 },
        { id: "e2", acquiredAt: 2 },
      ],
      nowMs: NOW,
    });

    expect(decision.ok).toBe(true);
    if (!decision.ok) return;
    expect(decision.imprint).toMatchObject({
      traitId: "shred-machine",
      kind: "guitar",
      value: 11.5,
    });
    expect(Object.keys(decision.imprint).sort()).toEqual([
      "extractedAt",
      "id",
      "kind",
      "traitId",
      "value",
    ]);
    expect(decision.traits).toEqual([{ id: "workhorse", value: 7.5 }]);
    expect(decision.extractors).toEqual([{ id: "e2", acquiredAt: 2 }]);
  });

  it("keeps a rolled brand with the imprint", () => {
    const decision = decideExtract({
      salt: "abc",
      kind: "guitar",
      traits: [
        { id: "brand-endorsement", value: 9, params: { brand: "Gibson" } },
      ],
      traitId: "brand-endorsement",
      extractors: [{ id: "e1", acquiredAt: 1 }],
      nowMs: NOW,
    });

    expect(decision.ok && decision.imprint.params).toEqual({ brand: "Gibson" });
  });

  it("refuses without an extractor or without the trait", () => {
    const base = {
      salt: "abc",
      kind: "guitar" as const,
      nowMs: NOW,
    };
    expect(
      decideExtract({
        ...base,
        traits: [{ id: "workhorse", value: 7 }],
        traitId: "workhorse",
        extractors: [],
      }),
    ).toEqual({ ok: false, reason: "NO_EXTRACTOR" });
    expect(
      decideExtract({
        ...base,
        traits: [],
        traitId: "workhorse",
        extractors: [{ id: "e", acquiredAt: 1 }],
      }),
    ).toEqual({ ok: false, reason: "NO_TRAIT" });
  });
});

describe("decideInsert", () => {
  it("charges more for every trait already on the instrument, up to three", () => {
    expect(getInsertCost(0)).toBe(TRAIT_INSERT_FAME[0]);
    expect(getInsertCost(1)).toBe(TRAIT_INSERT_FAME[1]);
    expect(getInsertCost(2)).toBe(TRAIT_INSERT_FAME[2]);
    expect(getInsertCost(MAX_ITEM_TRAITS)).toBeNull();
    expect(TRAIT_INSERT_FAME[0]).toBeLessThan(TRAIT_INSERT_FAME[1]);
    expect(TRAIT_INSERT_FAME[1]).toBeLessThan(TRAIT_INSERT_FAME[2]);

    const decision = decideInsert({
      imprint: imprint("shred-machine"),
      kind: "guitar",
      rarity: "Common",
      traits: [{ id: "workhorse", value: 7 }],
    });
    expect(decision).toEqual({
      ok: true,
      cost: TRAIT_INSERT_FAME[1],
      traits: [
        { id: "workhorse", value: 7 },
        { id: "shred-machine", value: 10 },
      ],
    });
  });

  it("refuses a full instrument and the same trait twice", () => {
    const full = [
      { id: "workhorse", value: 7 },
      { id: "reliable", value: 8 },
      { id: "jazz-box", value: 9 },
    ];
    expect(
      decideInsert({
        imprint: imprint("shred-machine"),
        kind: "guitar",
        rarity: "Epic",
        traits: full,
      }),
    ).toEqual({
      ok: false,
      reason: "FULL",
    });
    expect(
      decideInsert({
        imprint: imprint("workhorse"),
        kind: "guitar",
        rarity: "Epic",
        traits: [{ id: "workhorse", value: 6.5 }],
      }),
    ).toEqual({ ok: false, reason: "DUPLICATE" });
  });

  it("keeps guitar traits out of pedals and pedal traits off the wrong pedal", () => {
    expect(
      decideInsert({
        imprint: imprint("workhorse"),
        kind: "effect",
        rarity: "Common",
        effectType: "Reverb",
        traits: [],
      }),
    ).toEqual({
      ok: false,
      reason: "WRONG_KIND",
    });
    expect(
      decideInsert({
        imprint: imprint("long-take", "effect"),
        kind: "effect",
        rarity: "Common",
        effectType: "Fuzz",
        traits: [],
      }),
    ).toEqual({ ok: false, reason: "NOT_ELIGIBLE" });
    expect(
      decideInsert({
        imprint: imprint("long-take", "effect"),
        kind: "effect",
        rarity: "Common",
        effectType: "Reverb",
        traits: [],
      }).ok,
    ).toBe(true);
  });

  it("keeps a rarity-gated trait off instruments below its window", () => {
    const gated = TRAIT_DEFINITIONS.find(
      (t) => t.kind === "guitar" && t.minRarity === "Legendary",
    );
    expect(gated).toBeDefined();
    if (!gated) return;
    const gatedImprint = imprint(gated.id, "guitar", gated.min);
    expect(
      decideInsert({
        imprint: gatedImprint,
        kind: "guitar",
        rarity: "Rare",
        traits: [],
      }),
    ).toEqual({
      ok: false,
      reason: "NOT_ELIGIBLE",
    });
    expect(
      decideInsert({
        imprint: gatedImprint,
        kind: "guitar",
        rarity: "Legendary",
        traits: [],
      }).ok,
    ).toBe(true);
  });
});

describe("prices", () => {
  it("never lets the bin pay back what an extractor costs to find", () => {
    // A Parts Crate is 300 Fame; on average five of them drop one extractor.
    const crateCost = 300;
    expect(getImprintResaleValue({ value: 100 })).toBeLessThan(
      crateCost / EXTRACTOR_DROP_CHANCE,
    );
    expect(getImprintResaleValue({ value: 7 })).toBe(75);
  });
});

describe("listInsertTargets", () => {
  it("lists the instruments of the imprint's kind, the ones that take it first", async () => {
    const { listInsertTargets } = await import("./traitCraft");
    const { GUITAR_DEFINITIONS } = await import("./guitarDefinitions");
    const common = GUITAR_DEFINITIONS.find((g) => g.rarity === "Common")!;
    const guitar = (
      id: string,
      traits: { id: string; value: number }[] = [],
    ) => ({
      id,
      guitarId: common.id,
      acquiredAt: 0,
      isNew: false,
      year: 2000,
      country: common.countries[0],
      traits,
    });

    const targets = listInsertTargets(
      imprint("shred-machine"),
      [
        guitar("full", [
          { id: "workhorse", value: 7 },
          { id: "reliable", value: 8 },
          { id: "jazz-box", value: 9 },
        ]),
        guitar("one", [{ id: "workhorse", value: 7 }]),
        guitar("empty"),
      ],
      [],
    );

    expect(targets.map((t) => [t.itemId, t.decision.ok])).toEqual([
      ["empty", true],
      ["one", true],
      ["full", false],
    ]);
  });
});
