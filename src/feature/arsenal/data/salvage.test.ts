import { describe, expect, it } from "vitest";

import type { ItemFeature, SalvagedMod } from "../types/arsenal.types";
import { getGuitarBom } from "./guitarBom";
import { getEffectiveRarity } from "./itemStats";
import {
  canFitSalvagedMod,
  getSalvageableMod,
  getSalvagedModOptions,
  SALVAGE_POINT_LOSS,
  toSalvagedMod,
} from "./salvage";
import { getModDef, type WorkshopSubject } from "./workshop";

const STRAT_BOM = getGuitarBom(1);

const subject = (over: Partial<WorkshopSubject> = {}): WorkshopSubject => {
  const mintRarity = over.mintRarity ?? over.rarity ?? "Epic";
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

const feature = (id: string, points: number): ItemFeature => ({ id, points });

const stashed = (over: Partial<SalvagedMod> = {}): SalvagedMod => ({
  id: over.id ?? "salvage:dead-1:cts-pots",
  featureId: over.featureId ?? "cts-pots",
  kind: over.kind ?? "guitar",
  points: over.points ?? 3,
  sourceName: over.sourceName ?? "Dead Strat",
  salvagedAt: over.salvagedAt ?? 0,
});

describe("getSalvageableMod", () => {
  it("returns nothing for an item with no mods", () => {
    expect(getSalvageableMod({ id: "a", features: [] }, "guitar")).toBeNull();
    expect(getSalvageableMod({ id: "a" }, "guitar")).toBeNull();
  });

  it("hands back exactly one mod however many are fitted", () => {
    const mod = getSalvageableMod(
      {
        id: "item-42",
        features: [
          feature("cts-pots", 3),
          feature("hand-wound", 5),
          feature("locking-tuners", 2),
          feature("bone-nut", 1),
        ],
      },
      "guitar",
    );

    expect(mod).not.toBeNull();
    expect(["cts-pots", "hand-wound", "locking-tuners", "bone-nut"]).toContain(
      mod!.featureId,
    );
  });

  it("picks the same mod every time for the same item", () => {
    const item = {
      id: "item-42",
      features: [feature("cts-pots", 3), feature("hand-wound", 5)],
    };
    const picks = Array.from(
      { length: 5 },
      () => getSalvageableMod(item, "guitar")!.featureId,
    );
    expect(new Set(picks).size).toBe(1);
  });

  it("does not depend on the order the features are stored in", () => {
    const features = [
      feature("cts-pots", 3),
      feature("hand-wound", 5),
      feature("bone-nut", 2),
    ];
    const forwards = getSalvageableMod({ id: "x", features }, "guitar");
    const backwards = getSalvageableMod(
      { id: "x", features: [...features].reverse() },
      "guitar",
    );
    expect(forwards!.featureId).toBe(backwards!.featureId);
  });

  it("keeps its pick when an unrelated mod is fitted afterwards", () => {
    // Two mods, then a third bolted on: whichever of the first two was going to
    // come off must still be the one that comes off, unless the newcomer wins
    // outright. What must never happen is the pick jumping between the old two.
    const before = getSalvageableMod(
      { id: "item-7", features: [feature("cts-pots", 3), feature("plek", 2)] },
      "guitar",
    )!;
    const after = getSalvageableMod(
      {
        id: "item-7",
        features: [
          feature("cts-pots", 3),
          feature("plek", 2),
          feature("bone-nut", 1),
        ],
      },
      "guitar",
    )!;
    expect([before.featureId, "bone-nut"]).toContain(after.featureId);
  });

  it("spreads its picks across the pool rather than favouring one mod", () => {
    const features = [
      feature("cts-pots", 3),
      feature("hand-wound", 5),
      feature("bone-nut", 2),
      feature("plek", 2),
    ];
    const picked = new Set(
      Array.from(
        { length: 60 },
        (_, i) =>
          getSalvageableMod({ id: `item-${i}`, features }, "guitar")!.featureId,
      ),
    );
    expect(picked.size).toBeGreaterThan(1);
  });

  it("takes the teardown's toll off the value, floored at the mod's own minimum", () => {
    const def = getModDef("guitar", "hand-wound")!;

    const worn = getSalvageableMod(
      { id: "a", features: [feature("hand-wound", 5)] },
      "guitar",
    )!;
    expect(worn.points).toBe(5 - SALVAGE_POINT_LOSS);
    expect(worn.pointsBefore).toBe(5);

    const floored = getSalvageableMod(
      { id: "a", features: [feature("hand-wound", def.min)] },
      "guitar",
    )!;
    expect(floored.points).toBe(def.min);
  });

  it("ignores features the pool no longer knows", () => {
    expect(
      getSalvageableMod(
        { id: "a", features: [feature("retired-feature", 4)] },
        "guitar",
      ),
    ).toBeNull();
  });

  it("reads pedal mods out of the pedal pool", () => {
    const mod = getSalvageableMod(
      { id: "pedal-1", features: [feature("nos-opamp", 4)] },
      "effect",
    )!;
    expect(mod.featureId).toBe("nos-opamp");
    expect(mod.kind).toBe("effect");
  });
});

describe("toSalvagedMod", () => {
  it("keys the stash entry on the instrument it came off", () => {
    const mod = getSalvageableMod(
      { id: "item-9", features: [feature("cts-pots", 3)] },
      "guitar",
    )!;
    const entry = toSalvagedMod(mod, "item-9", "Dead Strat", 1234);

    expect(entry.id).toBe("salvage:item-9:cts-pots");
    expect(entry).toMatchObject({
      featureId: "cts-pots",
      kind: "guitar",
      points: mod.points,
      sourceName: "Dead Strat",
      salvagedAt: 1234,
    });
  });
});

describe("getSalvagedModOptions", () => {
  it("offers a stashed mod the instrument can take", () => {
    const options = getSalvagedModOptions(subject(), [stashed()]);

    expect(options).toHaveLength(1);
    expect(options[0]).toMatchObject({
      salvagedId: "salvage:dead-1:cts-pots",
      featureId: "cts-pots",
      label: "CTS pots",
      points: 3,
      sourceName: "Dead Strat",
    });
  });

  it("hides a mod the instrument already carries", () => {
    const options = getSalvagedModOptions(
      subject({ features: [feature("cts-pots", 2)] }),
      [stashed()],
    );
    expect(options).toHaveLength(0);
  });

  it("hides a pedal mod on a guitar bench", () => {
    const options = getSalvagedModOptions(subject(), [
      stashed({ id: "s2", featureId: "nos-opamp", kind: "effect" }),
    ]);
    expect(options).toHaveLength(0);
  });

  it("hides a mod the construction has nowhere to put", () => {
    // A BOM without a `tuners` slot cannot take locking tuners, exactly as the
    // fresh-mod menu already refuses to offer them.
    const options = getSalvagedModOptions(
      subject({ bom: [{ partId: "body", qty: 1 }] }),
      [stashed({ id: "s3", featureId: "locking-tuners" })],
    );
    expect(options).toHaveLength(0);
  });
});

describe("canFitSalvagedMod", () => {
  // What the stash board asks of every socket while a mod is being carried.
  it("accepts an instrument with room and a place to put it", () => {
    expect(canFitSalvagedMod(subject(), stashed())).toBe(true);
  });

  it("refuses one that already carries the mod", () => {
    expect(
      canFitSalvagedMod(
        subject({ features: [feature("cts-pots", 2)] }),
        stashed(),
      ),
    ).toBe(false);
  });

  it("refuses one whose mod slots are all taken", () => {
    // Common holds two features, so two fitted leaves nothing free.
    expect(
      canFitSalvagedMod(
        subject({
          rarity: "Common",
          mintRarity: "Common",
          features: [feature("bone-nut", 1), feature("plek", 2)],
        }),
        stashed(),
      ),
    ).toBe(false);
  });

  it("refuses a pedal mod, and a pedal for a guitar mod", () => {
    expect(
      canFitSalvagedMod(
        subject(),
        stashed({ featureId: "nos-opamp", kind: "effect" }),
      ),
    ).toBe(false);
    expect(canFitSalvagedMod(subject({ kind: "effect" }), stashed())).toBe(
      false,
    );
  });

  it("refuses a construction with nowhere to bolt it on", () => {
    expect(
      canFitSalvagedMod(
        subject({ bom: [{ partId: "body", qty: 1 }] }),
        stashed({ featureId: "locking-tuners" }),
      ),
    ).toBe(false);
  });

  it("does not care what the wallet holds — that is the dialog's job", () => {
    // Same answer either way: affordability is uniform across instruments, so
    // it must never decide *which* socket lights up.
    expect(canFitSalvagedMod(subject(), stashed())).toBe(true);
  });
});
