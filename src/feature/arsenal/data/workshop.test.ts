import { describe, expect, it } from "vitest";

import type {
  GuitarRarity,
  PartId,
  PartTier,
  ScrapPart,
} from "../types/arsenal.types";
import { getEffectBom } from "./effectBom";
import { EFFECT_DEFINITIONS } from "./effectDefinitions";
import { getGuitarBom } from "./guitarBom";
import { GUITAR_DEFINITIONS } from "./guitarDefinitions";
import {
  getEffectiveRarity,
  getItemCondition,
  getPromotionsAvailable,
} from "./itemStats";
import { PARTS_BY_ID } from "./partDefinitions";
import { getPartSupply } from "./partSupply";
import {
  getBuildFameCost,
  getBuildQuote,
  getBuildRecipeParts,
  getBuildRequirement,
  getFittableMods,
  getModBill,
  getModDef,
  getModQuote,
  getModSlots,
  getRepairQuote,
  isPromotionLevel,
  MOD_ROLL_BONUS,
  recipeToParts,
  rollModPoints,
  subtractParts,
  type WorkshopSubject,
} from "./workshop";

/** Guitar #1 tears down into body / pickup / pot — three distinct parts. */
const STRAT_BOM = getGuitarBom(1);

const subject = (over: Partial<WorkshopSubject> = {}): WorkshopSubject => {
  // Mirrors `getGuitarSubject`: the effective rarity follows from the mint rarity
  // and the build level, so a test subject can never be internally inconsistent.
  const mintRarity = over.mintRarity ?? over.rarity ?? "Rare";
  const buildLevel = over.buildLevel ?? 0;
  return {
    id: over.id ?? "item-1",
    kind: over.kind ?? "guitar",
    name: over.name ?? "Test Guitar",
    mintRarity,
    rarity: over.rarity ?? getEffectiveRarity(mintRarity, buildLevel),
    buildLevel,
    condition: over.condition ?? 0.5,
    bom: over.bom ?? STRAT_BOM,
    features: over.features ?? [],
    effectType: over.effectType,
  };
};

const part = (partId: PartId, tier: PartTier, qty: number): ScrapPart => ({
  partId,
  tier,
  qty,
});

/** Enough Standard stock to pay for anything early, spread across both halves. */
const richWallet = (): ScrapPart[] => [
  part("body", "Standard", 40),
  part("neck", "Standard", 40),
  part("pickup", "Standard", 40),
  part("tuners", "Standard", 40),
  part("pot", "Standard", 40),
  part("screws", "Standard", 40),
];

/**
 * Deep stock of every part at every tier it can reach — mod bills name specific
 * tiers, so a wallet that is merely large is not the same as one that can pay.
 */
const modWallet = (): ScrapPart[] => [
  part("body", "Standard", 40),
  part("body", "Epic", 40),
  part("body", "Legendary", 40),
  part("neck", "Standard", 40),
  part("neck", "Epic", 40),
  part("neck", "Legendary", 40),
  part("bridge", "Standard", 40),
  part("bridge", "Epic", 40),
  part("bridge", "Legendary", 40),
  part("pickup", "Standard", 40),
  part("pickup", "Epic", 40),
  part("pickup", "Legendary", 40),
  part("tuners", "Standard", 40),
  part("tuners", "Epic", 40),
  part("tuners", "Legendary", 40),
  part("enclosure", "Standard", 40),
  part("enclosure", "Epic", 40),
  part("opamp", "Standard", 40),
  part("opamp", "Epic", 40),
  part("opamp", "Legendary", 40),
  part("diode", "Standard", 40),
  part("diode", "Epic", 40),
  part("pot", "Standard", 40),
  part("pot", "Epic", 40),
  part("screws", "Standard", 40),
];

describe("mods — what fits", () => {
  // Guitar #1 has no `neck`, `bridge` or `tuners` slot in its BOM, so the parts
  // those mods physically are cannot be on the instrument.
  const fittableIds = getFittableMods(subject()).map((m) => m.id);

  it("offers only mods the instrument physically has the part for", () => {
    expect(fittableIds).toContain("hand-wound"); // pickup — in the BOM
    expect(fittableIds).not.toContain("graphite-neck"); // neck — not in the BOM
    expect(fittableIds).not.toContain("locking-tuners"); // tuners — not in the BOM
    expect(fittableIds).not.toContain("brass-trem-block"); // bridge — not in the BOM
  });

  it("always offers mods that are not a part at all", () => {
    // Copper shielding and a fret level are work, not hardware — nothing has to
    // be in the BOM for a bench to do them.
    expect(fittableIds).toContain("copper-shielding");
    expect(fittableIds).toContain("fret-level");
  });

  it("gates pedal mods by type, the way the case roller does", () => {
    const delay = subject({
      kind: "effect",
      effectType: "Delay",
      bom: getEffectBom(1, "Delay"),
    });
    const ids = getFittableMods(delay).map((m) => m.id);

    expect(ids).toContain("kill-dry"); // Delay / Reverb only
    expect(ids).not.toContain("led-clipping"); // Overdrive / Distortion only
  });

  it("never offers a mod the item already carries", () => {
    const quote = getModQuote(
      subject({ features: [{ id: "hand-wound", points: 4 }] }),
      modWallet(),
    );

    expect(quote.candidates.map((c) => c.id)).not.toContain("hand-wound");
    expect(quote.fitted.map((f) => f.id)).toEqual(["hand-wound"]);
  });
});

describe("mods — the bill", () => {
  const candidate = (quote: ReturnType<typeof getModQuote>, id: string) =>
    quote.candidates.find((c) => c.id === id)!;

  it("charges every mod its own bill, not one flat price", () => {
    const quote = getModQuote(subject(), modWallet());

    expect(recipeToParts(candidate(quote, "hand-wound").recipe)).not.toEqual(
      recipeToParts(candidate(quote, "copper-shielding").recipe),
    );
  });

  it("asks for the part the mod physically is", () => {
    const quote = getModQuote(subject(), modWallet());

    // Hand-wound pickups are pickups; shielding is a box of screws.
    expect(
      candidate(quote, "hand-wound").recipe.map((line) => line.partId),
    ).toContain("pickup");
    expect(
      candidate(quote, "copper-shielding").recipe.map((line) => line.partId),
    ).toContain("screws");
  });

  it("costs the same on every item, whatever its BOM, rarity or build", () => {
    const strat = getModQuote(subject({ bom: getGuitarBom(1) }), modWallet());
    const mythic = getModQuote(
      subject({ bom: getGuitarBom(1), mintRarity: "Mythic", buildLevel: 6 }),
      modWallet(),
    );

    expect(recipeToParts(candidate(strat, "hand-wound").recipe)).toEqual(
      recipeToParts(candidate(mythic, "hand-wound").recipe),
    );
    expect(getModBill("hand-wound")).toEqual(
      recipeToParts(candidate(strat, "hand-wound").recipe),
    );
  });

  it("blocks both actions when the wallet covers no mod at all", () => {
    // Standard stock only — every bill here wants Epic parts or better.
    const quote = getModQuote(
      subject({ features: [{ id: "hand-wound", points: 4 }] }),
      [part("screws", "Standard", 40)],
    );

    expect(quote.candidates.every((c) => !c.affordable)).toBe(true);
    expect(quote.canFit).toBe(false);
    expect(quote.canReroll).toBe(false);
  });

  it("lets an affordable mod through while a dearer one stays blocked", () => {
    // Enough screws and Standard pots for shielding, nothing for a pickup rewind.
    const quote = getModQuote(subject(), [
      part("screws", "Standard", 40),
      part("pot", "Standard", 10),
    ]);

    expect(candidate(quote, "copper-shielding").affordable).toBe(true);
    expect(candidate(quote, "hand-wound").affordable).toBe(false);
    expect(quote.canFit).toBe(true);
  });

  it("asks pedals for pedal parts", () => {
    const pedal = getModQuote(
      subject({
        kind: "effect",
        effectType: "Delay",
        bom: getEffectBom(1, "Delay"),
      }),
      modWallet(),
    );

    // MIDI control is one of the mods a delay can take, and it is op-amp work.
    expect(
      candidate(pedal, "midi").recipe.map((line) => line.partId),
    ).toContain("opamp");
  });

  it("gives every mod in either pool a payable bill", () => {
    const guitar = getModQuote(subject(), modWallet());
    const pedal = getModQuote(
      subject({
        kind: "effect",
        effectType: "Delay",
        bom: getEffectBom(1, "Delay"),
      }),
      modWallet(),
    );

    for (const mod of [...guitar.candidates, ...pedal.candidates]) {
      expect(mod.recipe.length).toBeGreaterThan(0);
      expect(mod.recipe.every((line) => line.need > 0)).toBe(true);
      // Unique parts gate promotions — a repeatable job must never want them.
      expect(mod.recipe.every((line) => line.tier !== "Unique")).toBe(true);
    }
  });
});

describe("mods — rarity caps how many", () => {
  const twoMods = [
    { id: "hand-wound", points: 4 },
    { id: "copper-shielding", points: 2 },
  ];

  it("fills up at RARITY_MAX_FEATURES and then takes no more", () => {
    const full = getModQuote(
      subject({ mintRarity: "Common", features: twoMods }),
      modWallet(),
    );

    expect(full.slots).toEqual({ used: 2, max: 2, free: 0 });
    expect(full.canFit).toBe(false);
  });

  it("counts what came out of the case against the same cap", () => {
    const { slots } = getModQuote(
      subject({ mintRarity: "Rare", features: twoMods }),
      modWallet(),
    );

    expect(slots.used).toBe(2);
    expect(slots.free).toBe(2); // Rare holds four in total, case rolls included
  });

  it("hands out more room when a build promotes the item", () => {
    // Three build levels promote a Common to Uncommon, which holds one more.
    const promoted = getModQuote(
      subject({ mintRarity: "Common", buildLevel: 3, features: twoMods }),
      modWallet(),
    );

    expect(promoted.slots.max).toBe(3);
    expect(promoted.canFit).toBe(true);
  });

  it("still allows a re-roll once every slot is filled", () => {
    const full = getModQuote(
      subject({ mintRarity: "Common", features: twoMods }),
      modWallet(),
    );

    expect(full.canFit).toBe(false);
    expect(full.canReroll).toBe(true);
  });
});

describe("mods — the roll", () => {
  it("can beat anything a case rolls, by exactly MOD_ROLL_BONUS", () => {
    // `hand-wound` rolls 3–5 out of a case; the bench widens the top only.
    const def = getModDef("guitar", "hand-wound")!;

    expect(def.min).toBe(3);
    expect(def.max).toBe(5 + MOD_ROLL_BONUS);
  });

  it("stays inside the widened range for every mod in the pool", () => {
    for (const def of getFittableMods(subject())) {
      for (let i = 0; i < 200; i++) {
        const points = rollModPoints(def);
        expect(points).toBeGreaterThanOrEqual(def.min);
        expect(points).toBeLessThanOrEqual(def.max);
      }
    }
  });

  it("resolves a fitted mod even when the pool no longer offers it", () => {
    // A neck mod on a guitar with no neck slot — legacy rolls and pool edits both
    // produce this, and the bench still has to show and re-roll it.
    const quote = getModQuote(
      subject({ features: [{ id: "graphite-neck", points: 2 }] }),
      modWallet(),
    );

    expect(quote.fitted.map((f) => f.id)).toEqual(["graphite-neck"]);
    expect(quote.canReroll).toBe(true);
  });
});

describe("getModSlots", () => {
  it("reads the cap off the item's current rarity, not the minted one", () => {
    const mint = getModSlots(subject({ mintRarity: "Common" }));
    const promoted = getModSlots(
      subject({ mintRarity: "Common", buildLevel: 6 }),
    );

    expect(mint.max).toBe(2); // Common
    expect(promoted.max).toBe(4); // two promotions in — Rare
  });
});

describe("build recipes", () => {
  // Guitar #1 tears down into body / pickup / pot, so its structural parts are
  // pickup and body — a pot caps at Epic and can never fill a Legendary slot.
  // Pickup leads because the roster supplies more of it at Legendary than body.
  const recipe = (level: number, mint: GuitarRarity = "Common") =>
    getBuildRecipeParts(level, STRAT_BOM, mint);

  it("asks for named parts in named quantities, never a loose total", () => {
    // Pickup before body: both are structural, and the roster supplies far more
    // Legendary pickups than Legendary bodies.
    expect(recipe(1)).toEqual([
      { partId: "pickup", tier: "Standard", qty: 2 },
      { partId: "screws", tier: "Standard", qty: 6 },
    ]);
  });

  it("gives the same list every time — nothing depends on the wallet", () => {
    expect(recipe(5)).toEqual(recipe(5));
    expect(recipe(5)).toEqual(getBuildRecipeParts(5, STRAT_BOM, "Common"));
  });

  it("steps the tier up flight by flight", () => {
    expect(recipe(2).every((l) => l.tier === "Standard")).toBe(true);
    expect(recipe(5).every((l) => l.tier === "Epic")).toBe(true);
    expect(recipe(8).every((l) => l.tier === "Legendary")).toBe(true);
  });

  it("only ever asks for parts the item is actually built from, plus filler", () => {
    const bomParts = new Set(["body", "pickup", "pot"]);
    for (let level = 1; level <= 12; level++) {
      for (const line of recipe(level)) {
        expect(bomParts.has(line.partId) || line.partId === "screws").toBe(
          true,
        );
      }
    }
  });

  it("never asks a pot or a screw for a tier it cannot reach", () => {
    for (let level = 1; level <= 12; level++) {
      for (const line of recipe(level)) {
        if (line.partId === "screws") expect(line.tier).toBe("Standard");
        if (line.partId === "pot") {
          expect(["Standard", "Epic"]).toContain(line.tier);
        }
      }
    }
  });

  it("adds Unique parts on promotion levels only", () => {
    const uniqueOn = (level: number, mint: GuitarRarity) =>
      recipe(level, mint).find((l) => l.tier === "Unique")?.qty ?? 0;

    expect(uniqueOn(1, "Common")).toBe(0);
    expect(uniqueOn(3, "Common")).toBe(1);
    expect(uniqueOn(6, "Common")).toBe(2);
    expect(uniqueOn(9, "Common")).toBe(3);
  });

  it("keeps every Unique demand inside what Mythic teardowns can pay out", () => {
    // Unique parts drop from Mythic gear only, and there are two Mythic guitars
    // in the roster. Six of them per promotion is not a grind, it is a wall.
    const uniques = [3, 6, 9].map(
      (level) => recipe(level, "Common").find((l) => l.tier === "Unique")!.qty,
    );
    expect(Math.max(...uniques)).toBeLessThanOrEqual(3);
  });

  it("bills no Unique part to an item with no promotions left", () => {
    // A Mythic reaches Custom Shop on its first promotion; levels 6 and 9 are then
    // ordinary builds and must not charge it for a promotion it cannot receive.
    expect(isPromotionLevel(3, "Mythic")).toBe(true);
    expect(isPromotionLevel(6, "Mythic")).toBe(false);
    expect(recipe(6, "Mythic").some((l) => l.tier === "Unique")).toBe(false);
    expect(recipe(9, "Mythic").some((l) => l.tier === "Unique")).toBe(false);
  });

  it("keeps growing past the ladder so surplus parts always have a sink", () => {
    const qty = (level: number) =>
      recipe(level).reduce((sum, l) => sum + l.qty, 0);
    expect(qty(10)).toBeGreaterThan(qty(9) - 6); // level 9 carries 6 Unique
    expect(qty(14)).toBeGreaterThan(qty(10));
    expect(recipe(30).length).toBeGreaterThan(0);
  });

  it("charges Fame on the side", () => {
    expect(getBuildFameCost(1)).toBe(10);
    expect(getBuildFameCost(12)).toBe(120);
  });
});

describe("rarity promotion", () => {
  it("gives every item three promotions unless the ladder runs out first", () => {
    expect(getPromotionsAvailable("Common")).toBe(3);
    expect(getPromotionsAvailable("Epic")).toBe(3);
    expect(getPromotionsAvailable("Legendary")).toBe(2);
    expect(getPromotionsAvailable("Mythic")).toBe(1);
    expect(getPromotionsAvailable("Custom Shop")).toBe(0);
  });

  it("promotes one rarity per three builds", () => {
    expect(getEffectiveRarity("Common", 0)).toBe("Common");
    expect(getEffectiveRarity("Common", 2)).toBe("Common");
    expect(getEffectiveRarity("Common", 3)).toBe("Uncommon");
    expect(getEffectiveRarity("Common", 6)).toBe("Rare");
    expect(getEffectiveRarity("Common", 9)).toBe("Epic");
  });

  it("stops at three promotions however far the item is built", () => {
    expect(getEffectiveRarity("Common", 12)).toBe("Epic");
    expect(getEffectiveRarity("Common", 99)).toBe("Epic");
  });

  it("never climbs past Custom Shop", () => {
    expect(getEffectiveRarity("Mythic", 3)).toBe("Custom Shop");
    expect(getEffectiveRarity("Mythic", 99)).toBe("Custom Shop");
    expect(getEffectiveRarity("Legendary", 6)).toBe("Custom Shop");
    expect(getEffectiveRarity("Legendary", 99)).toBe("Custom Shop");
  });

  it("treats a legacy item with no build level as unpromoted", () => {
    expect(getEffectiveRarity("Rare", undefined)).toBe("Rare");
  });
});

describe("getBuildRequirement", () => {
  const req = (level: number, mint: GuitarRarity = "Common") =>
    getBuildRequirement(level, mint, getEffectiveRarity(mint, level - 1));

  it("raises the condition gate flight by flight", () => {
    expect(req(1).condition).toBe("Good");
    expect(req(4).condition).toBe("Mint");
    expect(req(7).condition).toBe("Museum");
  });

  it("names the rarity a promotion level lands on", () => {
    expect(req(3).promotesTo).toBe("Uncommon");
    expect(req(2).promotesTo).toBeNull();
    expect(getBuildRequirement(3, "Mythic", "Mythic").promotesTo).toBe(
      "Custom Shop",
    );
  });
});

describe("subtractParts", () => {
  it("removes exactly what was spent and drops emptied stacks", () => {
    const wallet = [part("screws", "Standard", 10), part("pot", "Epic", 2)];
    const left = subtractParts(wallet, [
      part("screws", "Standard", 4),
      part("pot", "Epic", 2),
    ]);
    expect(left).toEqual([{ partId: "screws", tier: "Standard", qty: 6 }]);
  });

  it("leaves untouched tiers of the same part alone", () => {
    const wallet = [part("pickup", "Standard", 5), part("pickup", "Epic", 5)];
    const left = subtractParts(wallet, [part("pickup", "Standard", 5)]);
    expect(left).toEqual([{ partId: "pickup", tier: "Epic", qty: 5 }]);
  });
});

describe("getBuildQuote", () => {
  it("blocks the job when the item is too battered, and says so", () => {
    const quote = getBuildQuote(
      subject({ condition: 0.2 }),
      richWallet(),
      9999,
    );
    const condition = quote.checks.find((c) => c.kind === "condition")!;
    expect(condition.ok).toBe(false);
    expect(condition.detail).toBe("Good");
    expect(quote.canBuild).toBe(false);
  });

  it("clears a level-1 job on a decent guitar and logs it as bench work", () => {
    const quote = getBuildQuote(
      subject({ condition: 0.5 }),
      richWallet(),
      9999,
    );
    expect(quote.canBuild).toBe(true);
    expect(quote.recipe.every((line) => line.ok)).toBe(true);
    expect(quote.logLabel).toBe("Bench work · build 1");
    expect(quote.requirement.level).toBe(1);
  });

  it("pays out per rarity while charging everyone the same", () => {
    const wallet = richWallet();
    const gains: Record<string, number> = {};
    const costs = new Set<string>();
    for (const rarity of ["Common", "Rare", "Mythic"] as GuitarRarity[]) {
      const quote = getBuildQuote(
        subject({ rarity, condition: 0.95 }),
        wallet,
        9999,
      );
      gains[rarity] = quote.gain;
      costs.add(JSON.stringify(recipeToParts(quote.recipe)));
    }
    expect(gains.Mythic).toBeGreaterThan(gains.Rare);
    expect(gains.Rare).toBeGreaterThan(gains.Common);
    // Identical bill for everyone — only the payout scales with rarity.
    expect(costs.size).toBe(1);
  });

  it("reports Fame as a blocker of its own", () => {
    const quote = getBuildQuote(subject({ condition: 0.5 }), richWallet(), 0);
    expect(quote.checks.find((c) => c.kind === "fame")!.ok).toBe(false);
    expect(quote.canBuild).toBe(false);
  });

  it("only asks for a Unique part on levels that promote", () => {
    const ordinary = getBuildQuote(
      subject({ mintRarity: "Common", buildLevel: 0, condition: 0.95 }),
      richWallet(),
      9999,
    );
    expect(ordinary.recipe.some((l) => l.tier === "Unique")).toBe(false);

    // Build 2 → 3 is the first promotion, so it is the first level to want one.
    const promotion = getBuildQuote(
      subject({ mintRarity: "Common", buildLevel: 2, condition: 0.95 }),
      richWallet(),
      9999,
    );
    expect(promotion.requirement.promotesTo).toBe("Uncommon");
    expect(promotion.recipe.find((l) => l.tier === "Unique")).toMatchObject({
      need: 1,
      ok: false,
    });
  });

  it("reports stock line by line against the fixed list", () => {
    const wallet = [
      part("pickup", "Standard", 1),
      part("screws", "Standard", 20),
    ];
    const quote = getBuildQuote(subject({ condition: 0.95 }), wallet, 9999);
    expect(quote.recipe).toEqual([
      { partId: "pickup", tier: "Standard", need: 2, have: 1, ok: false },
      { partId: "screws", tier: "Standard", need: 6, have: 20, ok: true },
    ]);
    expect(quote.canBuild).toBe(false);
  });
});

describe("getRepairQuote", () => {
  it("walks the condition ladder one grade at a time", () => {
    expect(
      getRepairQuote(subject({ condition: 0.05 }), richWallet()).target,
    ).toBe("Worn");
    expect(
      getRepairQuote(subject({ condition: 0.2 }), richWallet()).target,
    ).toBe("Good");
    expect(
      getRepairQuote(subject({ condition: 0.5 }), richWallet()).target,
    ).toBe("Mint");
    expect(
      getRepairQuote(subject({ condition: 0.8 }), richWallet()).target,
    ).toBe("Museum");
  });

  it("has nothing left to do at Museum grade", () => {
    const quote = getRepairQuote(subject({ condition: 0.96 }), richWallet());
    expect(quote.target).toBeNull();
    expect(quote.canRepair).toBe(false);
  });

  it("never offers a job that lands on the grade the item is already at", () => {
    // 0.93 sits inside Museum but below the step's 0.95 target — matching on the
    // raw number would offer a pointless "Museum Grade → Museum Grade" job.
    const quote = getRepairQuote(subject({ condition: 0.93 }), richWallet());
    expect(quote.target).toBeNull();
  });

  it("gets steeper the higher the grade and the rarer the item", () => {
    const total = (q: ReturnType<typeof getRepairQuote>) =>
      q.recipe.reduce((sum, l) => sum + l.need, 0);
    const wallet = richWallet();

    const early = total(getRepairQuote(subject({ condition: 0.05 }), wallet));
    const late = total(getRepairQuote(subject({ condition: 0.8 }), wallet));
    expect(late).toBeGreaterThan(early);

    const common = total(
      getRepairQuote(subject({ rarity: "Common", condition: 0.5 }), wallet),
    );
    const mythic = total(
      getRepairQuote(subject({ rarity: "Mythic", condition: 0.5 }), wallet),
    );
    expect(mythic).toBeGreaterThan(common);
  });

  it("reports the Item Level the step is worth", () => {
    const quote = getRepairQuote(subject({ condition: 0.43 }), richWallet());
    expect(quote.gain).toBe(3); // 0.43 → 0.73 is +3 condition points
  });

  it("asks only for screws at the bottom of the ladder", () => {
    const quote = getRepairQuote(subject({ condition: 0.05 }), [
      part("screws", "Standard", 200),
    ]);
    expect(quote.target).toBe("Worn");
    expect(quote.recipe.map((l) => l.partId)).toEqual(["screws"]);
    expect(quote.canRepair).toBe(true);
  });

  it("wants parts off the instrument itself for a Museum restoration", () => {
    const quote = getRepairQuote(subject({ condition: 0.8 }), richWallet());
    expect(quote.target).toBe("Museum");
    // Guitar #1's structural parts are body and pickup — never the pot.
    expect(quote.recipe.map((l) => l.partId).sort()).toEqual([
      "body",
      "pickup",
    ]);
    expect(quote.recipe.every((l) => l.tier === "Epic")).toBe(true);
  });
});

describe("condition fallback", () => {
  it("gives legacy items without a rolled condition a stable value", () => {
    const a = getItemCondition({ id: "legacy-item" });
    const b = getItemCondition({ id: "legacy-item" });
    expect(a).toBe(b);
  });
});

describe("every recipe in the game is fillable", () => {
  // The ladder asks for two structural parts at Legendary and one Unique part.
  // If any BOM could not supply those, that item would have an unbuildable level
  // — so this is the invariant the whole recipe system rests on.
  const boms = [
    ...GUITAR_DEFINITIONS.map((g) => ({
      label: `guitar ${g.id} ${g.name}`,
      bom: getGuitarBom(g.id),
    })),
    ...EFFECT_DEFINITIONS.map((e) => ({
      label: `effect ${e.id} ${e.name}`,
      bom: getEffectBom(e.id, e.type),
    })),
  ];

  it("has at least two parts that can reach Legendary", () => {
    for (const { label, bom } of boms) {
      const structural = bom.filter(
        (slot) => PARTS_BY_ID.get(slot.partId)?.maxTier === "Legendary",
      );
      expect(
        new Set(structural.map((s) => s.partId)).size,
        label,
      ).toBeGreaterThanOrEqual(2);
    }
  });

  it("has a part that can roll Unique, for the promotion levels", () => {
    for (const { label, bom } of boms) {
      const hasUnique = bom.some(
        (slot) => PARTS_BY_ID.get(slot.partId)?.unique,
      );
      expect(hasUnique, label).toBe(true);
    }
  });

  it("only asks for parts the drop tables can actually supply", () => {
    // The bug this exists to catch: `tuners` heads one archetype, and the roster
    // has no Legendary guitar built that way — so the game's entire Legendary
    // supply of tuners was one Mythic paying out a single piece, and every recipe
    // asking for them was unpayable. A third of the guitars were hard-blocked at
    // build level 6 and nothing in the tests noticed.
    const MIN_SUPPLY = 3;
    for (const { label, bom } of boms) {
      for (let level = 1; level <= 9; level++) {
        for (const line of getBuildRecipeParts(level, bom, "Common")) {
          // Unique parts are Mythic-only by design and scarce on purpose; screws
          // are the one part every teardown pays out.
          if (line.tier === "Unique" || line.partId === "screws") continue;
          expect(
            getPartSupply(line.partId, line.tier),
            `${label} · L${level} · ${line.partId}/${line.tier}`,
          ).toBeGreaterThanOrEqual(MIN_SUPPLY);
        }
      }
    }
  });

  it("never produces an empty or duplicated recipe line", () => {
    for (const { label, bom } of boms) {
      for (let level = 1; level <= 12; level++) {
        const recipe = getBuildRecipeParts(level, bom, "Common");
        expect(recipe.length, label).toBeGreaterThan(0);
        const keys = recipe.map((l) => `${l.partId}:${l.tier}`);
        expect(new Set(keys).size, label).toBe(keys.length);
        for (const line of recipe) expect(line.qty, label).toBeGreaterThan(0);
      }
    }
  });
});
