import { describe, expect, it } from "vitest";

import type {
  GuitarRarity,
  ScrapPart,
  WorkshopKind,
} from "../types/arsenal.types";
import { NEW_ITEM_BIAS } from "../utils/openDraw";
import { CASE_DEFINITIONS } from "./caseDefinitions";
import {
  COMMISSION_CONDITION,
  COMMISSION_FAME,
  COMMISSION_MIN_LEVEL,
  COMMISSION_SCREW_FACTOR,
  getCommissionBlock,
  getCommissionedEffect,
  getCommissionedGuitar,
  getCommissionFame,
  getCommissionParts,
  getCommissionQuote,
  getEffectCommissionSubject,
  getGuitarCommissionSubject,
} from "./commission";
import { EFFECT_DEFINITIONS, EFFECTS_BY_RARITY } from "./effectDefinitions";
import { getEffectValue } from "./effectStats";
import {
  DROPPABLE_GUITARS_BY_RARITY,
  GUITAR_DEFINITIONS,
} from "./guitarDefinitions";
import { getConditionGrade, getItemValue, RARITY_LADDER } from "./itemStats";
import { getPartSupply } from "./partSupply";
import { getScrapYield } from "./scrapYield";
import { ITEM_PRICE_MULTIPLIER } from "./traderShop";
import { isTrophyGuitar } from "./trophyGuitars";

type SellableRarity = keyof typeof COMMISSION_FAME;

const CHASE: SellableRarity[] = ["Legendary", "Mythic"];

/** Every model the bench will take an order for, in one list. */
const COMMISSIONABLE = [
  ...GUITAR_DEFINITIONS.filter((g) => !isTrophyGuitar(g.id)).map((def) => ({
    name: `${def.brand} ${def.name} (#${def.id})`,
    subject: getGuitarCommissionSubject(def),
    sellValue: getItemValue({ id: "x", ...getCommissionedGuitar(def) }, def),
  })),
  ...EFFECT_DEFINITIONS.map((def) => ({
    name: `${def.brand} ${def.name} (pedal #${def.id})`,
    subject: getEffectCommissionSubject(def),
    sellValue: getEffectValue(def),
  })),
];

/** The droppable pool a case rolls one kind from, by rarity. */
const poolFor = (kind: WorkshopKind, rarity: GuitarRarity) =>
  (kind === "guitar" ? DROPPABLE_GUITARS_BY_RARITY : EFFECTS_BY_RARITY)[
    rarity
  ] ?? [];

/** Cases locked to one kind — the shelf a player buys for a specific pool. */
const casesFor = (kind: WorkshopKind) =>
  Object.values(CASE_DEFINITIONS).filter(
    (c) => c.dropKind === kind && c.id !== "daily" && c.id !== "supporter",
  );

/**
 * Average Fame one pull of `rarity` costs from the cheapest open case that
 * sells it — the price of *a* model of that tier, before targeting.
 */
const casePerPull = (kind: WorkshopKind, rarity: SellableRarity): number =>
  Math.min(
    ...casesFor(kind)
      .filter((c) => (c.probabilities[rarity] ?? 0) > 0)
      .map((c) => c.fameCost / c.probabilities[rarity]),
  );

/**
 * Expected Fame to pull one *specific* model when it is the last of its tier
 * still missing: the tier rolls at its printed odds (Legendary and Mythic sit
 * above the re-roll ceiling, so nothing redirects onto them), then the new-item
 * bias picks it 70% of the time and the plain draw the rest.
 */
const caseLastOne = (kind: WorkshopKind, rarity: SellableRarity): number => {
  const pool = poolFor(kind, rarity).length;
  return Math.min(
    ...casesFor(kind)
      .filter((c) => (c.probabilities[rarity] ?? 0) > 0)
      .map(
        (c) =>
          c.fameCost /
          (c.probabilities[rarity] *
            (NEW_ITEM_BIAS + (1 - NEW_ITEM_BIAS) / pool)),
      ),
  );
};

/** Share of an unlocked case's pulls that land on each kind — `open-case.ts`. */
const UNLOCKED_KIND_SHARE: Record<WorkshopKind, number> = {
  guitar: 0.6,
  effect: 0.4,
};

/** Tiers the re-roll in `drawOpenRarity` may redirect a pull onto. */
const REROLL_TIERS: SellableRarity[] = ["Common", "Uncommon", "Rare", "Epic"];

/**
 * Expected Fame for the last missing model of a tier the re-roll covers, with
 * every other tier up to Epic already finished: any pull landing up to Epic is
 * redirected onto it, then the new-item bias does the rest. Read off the
 * cheapest open case for that kind, the Standard one included.
 */
const caseLastLowTier = (
  kind: WorkshopKind,
  rarity: SellableRarity,
): number => {
  const pool = poolFor(kind, rarity).length;
  const pick = NEW_ITEM_BIAS + (1 - NEW_ITEM_BIAS) / pool;
  return Math.min(
    ...Object.values(CASE_DEFINITIONS)
      .filter(
        (c) =>
          c.id !== "daily" &&
          c.id !== "supporter" &&
          (!c.dropKind || c.dropKind === kind) &&
          (c.probabilities[rarity] ?? 0) > 0,
      )
      .map((c) => {
        const share = c.dropKind ? 1 : UNLOCKED_KIND_SHARE[kind];
        const landsLow = REROLL_TIERS.reduce(
          (sum, r) => sum + (c.probabilities[r] ?? 0),
          0,
        );
        return c.fameCost / (share * landsLow * pick);
      }),
  );
};

const countOf = (parts: ScrapPart[], partId: string, tier: string) =>
  parts
    .filter((p) => p.partId === partId && p.tier === tier)
    .reduce((sum, p) => sum + p.qty, 0);

describe("commission prices", () => {
  it("climbs strictly with rarity", () => {
    const ordered = RARITY_LADDER.filter(
      (r): r is SellableRarity => r in COMMISSION_FAME,
    );
    for (let i = 1; i < ordered.length; i++) {
      expect(COMMISSION_FAME[ordered[i]]).toBeGreaterThan(
        COMMISSION_FAME[ordered[i - 1]],
      );
    }
  });

  it("never prices Custom Shop — it is a promotion, not a model", () => {
    expect(getCommissionFame("Custom Shop")).toBeNull();
  });

  it.each(["guitar", "effect"] as const)(
    "%s: never undercuts the average case pull of the same tier, from Rare up",
    (kind) => {
      for (const rarity of ["Rare", "Epic", "Legendary", "Mythic"] as const) {
        expect(
          COMMISSION_FAME[rarity],
          `${kind} ${rarity}: case ${casePerPull(kind, rarity).toFixed(0)}`,
        ).toBeGreaterThanOrEqual(casePerPull(kind, rarity));
      }
    },
  );

  it.each(["guitar", "effect"] as const)(
    "%s: beats the case route on the last missing Legendary and Mythic",
    (kind) => {
      for (const rarity of CHASE) {
        // A commission nobody can justify is a feature nobody uses. Where the
        // drop tables are at their worst, it has to be the better deal.
        expect(
          COMMISSION_FAME[rarity],
          `${kind} ${rarity}: last one ${caseLastOne(kind, rarity).toFixed(0)}`,
        ).toBeLessThan(caseLastOne(kind, rarity));
      }
    },
  );

  it.each(["guitar", "effect"] as const)(
    "%s: is never the cheaper way to finish a tier below Legendary",
    (kind) => {
      // Up to Epic the re-roll redirects a pull that lands on a finished tier
      // onto whatever is still missing, so the last model of a low tier is a
      // pull or two away — the commission is a convenience there, not a deal.
      for (const rarity of ["Common", "Uncommon", "Rare", "Epic"] as const) {
        expect(
          COMMISSION_FAME[rarity],
          `${kind} ${rarity}: last one ${caseLastLowTier(kind, rarity).toFixed(0)}`,
        ).toBeGreaterThanOrEqual(caseLastLowTier(kind, rarity));
      }
    },
  );

  it.each(COMMISSIONABLE)(
    "$name: costs more than the trader asks for the very same copy",
    ({ subject, sellValue }) => {
      // The trader marks every item up at least fourfold over its sell value,
      // so clearing it also means a commission sold straight back returns a
      // fraction of the price — there is no buy-and-sell loop to run.
      const traderPrice = sellValue * ITEM_PRICE_MULTIPLIER[subject.rarity];
      expect(getCommissionFame(subject.rarity)).toBeGreaterThanOrEqual(
        traderPrice,
      );
      expect(getCommissionFame(subject.rarity)).toBeGreaterThan(sellValue * 4);
    },
  );
});

describe("commission bills", () => {
  it.each(COMMISSIONABLE)(
    "$name: a teardown of the delivery never pays back more than went in",
    ({ subject }) => {
      const bill = getCommissionParts(subject.bom, subject.rarity);
      // The delivery is stock — no mods to bump a tier — so its teardown is the
      // plain yield of its mint rarity.
      const teardown = getScrapYield({
        bom: subject.bom,
        rarity: subject.rarity,
      });

      for (const part of teardown) {
        if (part.partId === "screws") {
          expect(countOf(bill, "screws", "Standard")).toBe(
            part.qty * COMMISSION_SCREW_FACTOR,
          );
          continue;
        }
        // A Unique coming out was paid for as a Legendary going in.
        const billedTier = part.tier === "Unique" ? "Legendary" : part.tier;
        expect(countOf(bill, part.partId, billedTier)).toBeGreaterThanOrEqual(
          part.qty,
        );
      }
    },
  );

  it.each(COMMISSIONABLE)(
    "$name: asks for nothing the drop tables cannot supply",
    ({ subject }) => {
      for (const line of getCommissionParts(subject.bom, subject.rarity)) {
        expect(line.tier).not.toBe("Unique");
        expect(
          getPartSupply(line.partId, line.tier),
          `${line.partId} ${line.tier}`,
        ).toBeGreaterThan(0);
      }
    },
  );

  it("keeps Legendary lines in single digits — the workshop's own ceiling", () => {
    for (const { subject } of COMMISSIONABLE) {
      const legendary = getCommissionParts(subject.bom, subject.rarity)
        .filter((p) => p.tier === "Legendary")
        .reduce((sum, p) => sum + p.qty, 0);
      expect(legendary).toBeLessThan(10);
    }
  });

  it.each(["guitar", "effect"] as const)(
    "%s: a commissioned Mythic is never a cheaper Unique source than the Elite case",
    (kind) => {
      const uniqueYield = (bom: ReturnType<typeof getCommissionParts>) =>
        bom.filter((p) => p.tier === "Unique").reduce((s, p) => s + p.qty, 0);

      const mythics = COMMISSIONABLE.filter(
        (c) => c.subject.kind === kind && c.subject.rarity === "Mythic",
      );
      const bestCaseYield = Math.max(
        ...mythics.map((m) =>
          uniqueYield(getScrapYield({ bom: m.subject.bom, rarity: "Mythic" })),
        ),
      );
      const casePerUnique = casePerPull(kind, "Mythic") / bestCaseYield;

      for (const { name, subject } of mythics) {
        const units = uniqueYield(
          getScrapYield({ bom: subject.bom, rarity: "Mythic" }),
        );
        if (units === 0) continue;
        expect(
          COMMISSION_FAME.Mythic / units,
          `${name}: ${units} Unique`,
        ).toBeGreaterThanOrEqual(casePerUnique);
      }
    },
  );
});

describe("commission eligibility", () => {
  const guitar = GUITAR_DEFINITIONS.find(
    (g) => g.rarity === "Legendary" && !isTrophyGuitar(g.id),
  )!;
  const subject = getGuitarCommissionSubject(guitar);

  it("opens at the minimum level and not a level before", () => {
    expect(
      getCommissionBlock({
        subject,
        discovered: false,
        playerLvl: COMMISSION_MIN_LEVEL - 1,
      }),
    ).toBe("level");
    expect(
      getCommissionBlock({
        subject,
        discovered: false,
        playerLvl: COMMISSION_MIN_LEVEL,
      }),
    ).toBeNull();
  });

  it("refuses anything already in the Dex", () => {
    expect(
      getCommissionBlock({ subject, discovered: true, playerLvl: 99 }),
    ).toBe("discovered");
  });

  it("refuses every roadmap trophy, at any level", () => {
    const trophies = GUITAR_DEFINITIONS.filter((g) => isTrophyGuitar(g.id));
    expect(trophies.length).toBeGreaterThan(0);
    for (const trophy of trophies) {
      expect(
        getCommissionBlock({
          subject: getGuitarCommissionSubject(trophy),
          discovered: false,
          playerLvl: 999,
        }),
      ).toBe("trophy");
    }
  });

  it("covers every pedal and every non-trophy guitar", () => {
    const open = COMMISSIONABLE.filter(
      ({ subject: s }) =>
        getCommissionBlock({ subject: s, discovered: false, playerLvl: 50 }) ===
        null,
    );
    expect(open).toHaveLength(COMMISSIONABLE.length);
  });
});

describe("commission quote", () => {
  const effect = EFFECT_DEFINITIONS.find((e) => e.rarity === "Mythic")!;
  const subject = getEffectCommissionSubject(effect);
  const bill = getCommissionParts(subject.bom, subject.rarity);

  it("is affordable with exactly the bill and exactly the Fame", () => {
    const quote = getCommissionQuote(subject, bill, COMMISSION_FAME.Mythic);
    expect(quote.fame).toBe(COMMISSION_FAME.Mythic);
    expect(quote.canAfford).toBe(true);
  });

  it("is not, one Fame or one part short", () => {
    expect(
      getCommissionQuote(subject, bill, COMMISSION_FAME.Mythic - 1).canAfford,
    ).toBe(false);

    const short = bill.map((p, i) => (i === 0 ? { ...p, qty: p.qty - 1 } : p));
    expect(
      getCommissionQuote(subject, short, COMMISSION_FAME.Mythic).canAfford,
    ).toBe(false);
  });
});

describe("the delivered instance", () => {
  it("is a stock guitar: this year's, Mint, no mods, no traits", () => {
    const def = GUITAR_DEFINITIONS[0];
    const item = getCommissionedGuitar(def);
    expect(item.year).toBe(def.yearTo);
    expect(item.country).toBe(def.countries[0]);
    expect(getConditionGrade(COMMISSION_CONDITION).key).toBe("Mint");
    expect(item.mintCondition).toBe(COMMISSION_CONDITION);
    expect(item).not.toHaveProperty("features");
    expect(item).not.toHaveProperty("traits");
  });

  it("is a stock pedal, with the case roller's fallbacks for year and country", () => {
    const def = EFFECT_DEFINITIONS[0];
    const item = getCommissionedEffect(def);
    expect(item.condition).toBe(COMMISSION_CONDITION);
    expect(typeof item.year).toBe("number");
    expect(typeof item.country).toBe("string");
    expect(item).not.toHaveProperty("features");
  });
});
