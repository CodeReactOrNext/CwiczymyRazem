import { describe, expect, it } from "vitest";

import { FUSION_FAME_COST } from "../data/fusion";
import { getGuitarBom } from "../data/guitarBom";
import { S_TYPE } from "../data/guitarSpecs";
import { getEffectiveRarity } from "../data/itemStats";
import type { WorkshopSubject } from "../data/workshop";
import type { SalvagedMod, ScrapPart } from "../types/arsenal.types";
import type { WorkshopEntry } from "./workshopEntries";
import {
  getBenchReadiness,
  getMakeOffer,
  getModTargets,
  getReadyGearIds,
  getTierProgress,
  isBenchReady,
} from "./workshopReadiness";

const subject = (over: Partial<WorkshopSubject> = {}): WorkshopSubject => {
  const mintRarity = over.mintRarity ?? "Epic";
  const buildLevel = over.buildLevel ?? 0;
  return {
    id: over.id ?? "item-1",
    kind: "guitar",
    name: "Test Guitar",
    mintRarity,
    rarity: getEffectiveRarity(mintRarity, buildLevel),
    buildLevel,
    condition: over.condition ?? 0.5,
    bom: getGuitarBom(1),
    features: over.features ?? [],
    spec: S_TYPE,
  };
};

const entry = (over: Partial<WorkshopSubject> = {}): WorkshopEntry => {
  const s = subject(over);
  return {
    id: s.id,
    kind: "guitar",
    name: s.name,
    brand: "Test",
    rarity: s.rarity,
    imageSrc: "",
    heroImageSrc: "",
    rotate: true,
    buildLevel: s.buildLevel,
    condition: s.condition,
    level: 1,
    buildLog: [],
    restored: false,
    subject: s,
    uses: [],
    traits: [],
  };
};

const stashed = (over: Partial<SalvagedMod> = {}): SalvagedMod => ({
  id: over.id ?? "salvage:dead-1:cts-pots",
  featureId: over.featureId ?? "cts-pots",
  kind: over.kind ?? "guitar",
  points: over.points ?? 2,
  sourceName: "Dead Strat",
  salvagedAt: 0,
});

/** Enough of everything for any early job — the readiness checks are what is tested. */
const RICH: ScrapPart[] = (
  ["body", "neck", "bridge", "pickup", "tuners", "pot", "screws"] as const
).flatMap((partId) =>
  (["Standard", "Epic", "Legendary", "Unique"] as const).map((tier) => ({
    partId,
    tier,
    qty: 999,
  })),
);

describe("getBenchReadiness", () => {
  it("is all false with an empty wallet and nothing in the stash", () => {
    const readiness = getBenchReadiness(subject(), [], 0, []);
    expect(readiness).toEqual({ repair: false, build: false, fit: false });
    expect(isBenchReady(readiness)).toBe(false);
  });

  it("marks restoration ready once the wallet covers it", () => {
    const readiness = getBenchReadiness(subject({ condition: 0.2 }), RICH, 0, []);
    expect(readiness.repair).toBe(true);
    expect(isBenchReady(readiness)).toBe(true);
  });

  it("counts a fitting mod in the stash as work to do", () => {
    const readiness = getBenchReadiness(subject(), [], 0, [stashed()]);
    expect(readiness.fit).toBe(true);
  });

  it("does not count a mod the instrument already carries", () => {
    const readiness = getBenchReadiness(
      subject({ features: [{ id: "cts-pots", points: 1 }] }),
      [],
      0,
      [stashed()],
    );
    expect(readiness.fit).toBe(false);
  });
});

describe("getReadyGearIds / getModTargets", () => {
  it("lists only the gear with something to press", () => {
    const ready = entry({ id: "ready", condition: 0.2 });
    const idle = entry({ id: "idle", condition: 1 });
    // The wallet covers a restore; the idle guitar is already Museum grade and
    // the build is gated on Fame, which the player does not have.
    const ids = getReadyGearIds([ready, idle], RICH, 0, []);
    expect(ids.has("ready")).toBe(true);
    expect(ids.has("idle")).toBe(false);
  });

  it("sends each stashed mod to the first instrument that takes it", () => {
    const first = entry({ id: "first" });
    const second = entry({ id: "second" });
    const targets = getModTargets([first, second], [], 0, [stashed()]);
    expect(targets.get("salvage:dead-1:cts-pots")?.id).toBe("first");
  });

  it("skips an instrument that already carries the mod", () => {
    const carrying = entry({
      id: "carrying",
      features: [{ id: "cts-pots", points: 1 }],
    });
    const free = entry({ id: "free" });
    const targets = getModTargets([carrying, free], [], 0, [stashed()]);
    expect(targets.get("salvage:dead-1:cts-pots")?.id).toBe("free");
  });
});

describe("getTierProgress", () => {
  it("fills towards the next tier and caps at full", () => {
    const part: ScrapPart = { partId: "pickup", tier: "Standard", qty: 3 };
    expect(getTierProgress(part, 999)).toMatchObject({
      outputTier: "Epic",
      ratio: 5,
      fill: 0.6,
      ready: false,
    });
    expect(getTierProgress({ ...part, qty: 34 }, 999)?.fill).toBe(1);
  });

  it("is ready only with the Fame for the bench fee", () => {
    const part: ScrapPart = { partId: "pickup", tier: "Standard", qty: 5 };
    expect(getTierProgress(part, FUSION_FAME_COST)?.ready).toBe(true);
    expect(getTierProgress(part, FUSION_FAME_COST - 1)?.ready).toBe(false);
  });

  it("has no bar for a part that does not climb", () => {
    expect(
      getTierProgress({ partId: "screws", tier: "Standard", qty: 50 }, 999),
    ).toBeNull();
  });
});

describe("getMakeOffer", () => {
  it("makes exactly the shortfall from the tier below", () => {
    const wallet: ScrapPart[] = [{ partId: "neck", tier: "Standard", qty: 12 }];
    expect(getMakeOffer(wallet, "neck", "Epic", 1, 999)).toEqual({
      partId: "neck",
      fromTier: "Standard",
      crafts: 1,
    });
  });

  it("makes fewer when the lower tier runs out", () => {
    const wallet: ScrapPart[] = [{ partId: "neck", tier: "Standard", qty: 12 }];
    // 12 Standard pieces make two Epic ones, not the three that are short.
    expect(getMakeOffer(wallet, "neck", "Epic", 3, 999)?.crafts).toBe(2);
  });

  it("offers nothing without a lower tier, pieces or Fame", () => {
    const wallet: ScrapPart[] = [{ partId: "neck", tier: "Standard", qty: 12 }];
    expect(getMakeOffer(wallet, "neck", "Standard", 1, 999)).toBeNull();
    expect(getMakeOffer([], "neck", "Epic", 1, 999)).toBeNull();
    expect(getMakeOffer(wallet, "neck", "Epic", 1, 0)).toBeNull();
    expect(getMakeOffer(wallet, "neck", "Epic", 0, 999)).toBeNull();
  });
});
