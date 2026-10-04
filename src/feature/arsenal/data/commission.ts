import { FEATURE_UNLOCKS } from "feature/levelGate/data/featureUnlocks";

import type {
  EffectDefinition,
  EffectInventoryItem,
  GuitarDefinition,
  GuitarRarity,
  InventoryItem,
  ScrapBom,
  ScrapPart,
  WorkshopKind,
} from "../types/arsenal.types";
import { getEffectBom } from "./effectBom";
import { EFFECT_COUNTRIES, EFFECT_YEAR_TO } from "./effectStats";
import { getGuitarBom } from "./guitarBom";
import { getScrapYield, mergeScrapParts } from "./scrapYield";
import { isTrophyGuitar } from "./trophyGuitars";
import type { RecipeLine } from "./workshop";
import { priceRecipe } from "./workshop";

/**
 * Commissions: the bench building a model from scratch, for the players who
 * have run out of patience with the drop tables.
 *
 * Past `COMMISSION_MIN_LEVEL` any guitar or pedal the account has never held can
 * be ordered by name, for Fame plus the parts it is made of. Three rules carry
 * the whole balance, and each one closes a loop the economy would otherwise leak
 * through:
 *
 *  • **Only what the Dex is missing, once.** Delivery writes the model into the
 *    Dex like any other first pull, and the Dex never forgets — so a model can
 *    be commissioned exactly once per account, ever. Nothing here can be farmed:
 *    there is no second copy to sell, list or strip. Roadmap trophies are out
 *    altogether; finishing the roadmap is the only way to one, and that rule is
 *    older and more important than this one.
 *
 *  • **It costs more than the gamble, and less than the tail of it.** The Fame
 *    price of each rarity sits above what the best open case charges, on
 *    average, for one pull of that rarity — so while a player still has a lot
 *    to find, cases stay the better buy (and they hand back duplicates for the
 *    workshop on top). What the commission beats is the *last* few models of a
 *    tier: the re-roll in `utils/openDraw` deliberately stops at Epic, so a
 *    missing Legendary or Mythic gets dearer with every one already found, and
 *    the final one of a tier costs well past this price in Elite cases. It is
 *    also above what the trader charges for the very same instance, because
 *    the counter is the patient route and this one does not wait.
 *
 *    rarity       Elite, per pull   last one, Elite   trader, same copy   commission
 *    Legendary         4,111         5,530 – 5,575     1,500 – 3,400        4,500
 *    Mythic           12,333        15,420 – 16,230    4,500 – 10,250      13,500
 *
 *    (Ranges run pedal – guitar: the pedal pools are smaller, so their last
 *    model is a touch cheaper to pull, and the trader prices a pedal at half.)
 *
 *    Below Legendary the re-roll already makes the last missing model a cheap
 *    pull — a few hundred Fame in Standard or Premium cases — so those prices
 *    are set clear of it and the commission is a convenience there, not a
 *    shortcut. `commission.test.ts` recomputes every number in this table from
 *    the live case odds and trader prices rather than trusting them.
 *
 *  • **The bill is the teardown in reverse.** The parts are exactly what a
 *    teardown of the finished instrument hands back — same parts, same tiers,
 *    same counts — with twice the screws for the assembly. Commission it and
 *    strip it, and the player is down every screw of the difference plus the
 *    whole Fame price, so the bench is never a way to turn parts into other
 *    parts. Unique parts are the one exception, and they go the safe way: the
 *    bill asks for a Legendary in their place, because Unique pieces gate
 *    promotions and nothing that can be ordered on demand may compete for them
 *    (the same rule `MOD_BILLS` follows). A Mythic stripped after delivery
 *    does yield its Unique parts — once per model, at 13,500 Fame a piece of
 *    hardware, which is a worse Unique source than the Elite case by design.
 *
 * What arrives is a *stock* instrument: the model's newest production year, Mint off the bench,
 * at the model's first listed factory, with every mod slot empty and no traits.
 * That is the price of choosing — a case can roll a better copy of the same
 * model, the bench only ever builds the plain one — and the empty slots are what
 * the mods in the stash are for. It also keeps the parts rule above exact: a
 * rolled mod would bump a part a tier on the teardown, a stock build cannot.
 *
 * Deterministic end to end, like the rest of the bench: the dialog shows the
 * exact instance and the exact bill, and the API recomputes both server-side.
 */

/**
 * Account level the bench takes orders from. Owned by the level gate, so the
 * tab that opens and the API that refuses can never disagree on the number.
 */
export const COMMISSION_MIN_LEVEL = FEATURE_UNLOCKS.commissions.requiredLvl;

/**
 * Fame per commission, by the model's rarity. Shared by guitars and pedals: the
 * Elite cases that sell the chase tiers cost the same and roll the same odds for
 * either, so finding a Mythic pedal is exactly as dear as finding a Mythic guitar.
 *
 * `Custom Shop` is absent on purpose — it is a workshop promotion, never a model.
 */
export const COMMISSION_FAME: Record<
  Exclude<GuitarRarity, "Custom Shop">,
  number
> = {
  Common: 500,
  Uncommon: 650,
  Rare: 900,
  Epic: 1600,
  Legendary: 4500,
  Mythic: 13500,
};

/**
 * Condition a commission leaves the bench in — Mint, at the value a restoration
 * to Mint lands on, so a new build and a restored one read as the same grade.
 */
export const COMMISSION_CONDITION = 0.73;

/** Screws in the bill, per screw a teardown of the finished build pays back. */
export const COMMISSION_SCREW_FACTOR = 2;

/** What the build log says about how the item came to exist. */
export const COMMISSION_LOG_LABEL = "Commissioned at the bench";

export const getCommissionFame = (rarity: GuitarRarity): number | null =>
  rarity === "Custom Shop" ? null : COMMISSION_FAME[rarity];

/**
 * The parts a commission costs: the teardown of the finished build, run in
 * reverse — see the module comment for why every line is what it is.
 */
export const getCommissionParts = (
  bom: ScrapBom,
  rarity: GuitarRarity,
): ScrapPart[] =>
  mergeScrapParts([
    getScrapYield({ bom, rarity }).map((part) => ({
      ...part,
      tier: part.tier === "Unique" ? "Legendary" : part.tier,
      qty:
        part.partId === "screws"
          ? part.qty * COMMISSION_SCREW_FACTOR
          : part.qty,
    })),
  ]);

// ─── Subjects ────────────────────────────────────────────────────────────────

/** A model the bench could be asked to build, in one shape for both kinds. */
export interface CommissionSubject {
  kind: WorkshopKind;
  definitionId: number | string;
  rarity: GuitarRarity;
  bom: ScrapBom;
}

export const getGuitarCommissionSubject = (
  def: Pick<GuitarDefinition, "id" | "rarity">,
): CommissionSubject => ({
  kind: "guitar",
  definitionId: def.id,
  rarity: def.rarity,
  bom: getGuitarBom(def.id),
});

export const getEffectCommissionSubject = (
  def: Pick<EffectDefinition, "id" | "rarity" | "type">,
): CommissionSubject => ({
  kind: "effect",
  definitionId: def.id,
  rarity: def.rarity,
  bom: getEffectBom(def.id, def.type),
});

/** A model on the order form, with the definition the card and dialog draw from. */
export type CommissionTarget =
  | { kind: "guitar"; def: GuitarDefinition }
  | { kind: "effect"; def: EffectDefinition };

export const getTargetSubject = (
  target: CommissionTarget,
): CommissionSubject =>
  target.kind === "guitar"
    ? getGuitarCommissionSubject(target.def)
    : getEffectCommissionSubject(target.def);

// ─── Eligibility ─────────────────────────────────────────────────────────────

/**
 * Why a model cannot be ordered, or `null` when it can. Ordered by what the
 * player can do about it: nothing for a trophy, play more for the level.
 */
export type CommissionBlock = "trophy" | "discovered" | "level" | "rarity";

export const getCommissionBlock = ({
  subject,
  discovered,
  playerLvl,
}: {
  subject: Pick<CommissionSubject, "kind" | "definitionId" | "rarity">;
  /** Already on the account's Dex record, or in the stash right now. */
  discovered: boolean;
  playerLvl: number;
}): CommissionBlock | null => {
  if (subject.kind === "guitar" && isTrophyGuitar(subject.definitionId)) {
    return "trophy";
  }
  if (getCommissionFame(subject.rarity) === null) return "rarity";
  if (discovered) return "discovered";
  if (playerLvl < COMMISSION_MIN_LEVEL) return "level";
  return null;
};

/** Whether the bench builds this model at all, for anybody — trophies and promotions aside. */
export const isCommissionableModel = (
  subject: Pick<CommissionSubject, "kind" | "definitionId" | "rarity">,
): boolean =>
  getCommissionBlock({ subject, discovered: false, playerLvl: Infinity }) ===
  null;

// ─── Quote ───────────────────────────────────────────────────────────────────

export interface CommissionQuote {
  fame: number;
  /** The fixed parts list, measured against the wallet. */
  recipe: RecipeLine[];
  /** The Fame is there, and every line of the bill is covered. */
  canAfford: boolean;
}

export const getCommissionQuote = (
  subject: CommissionSubject,
  wallet: ScrapPart[],
  fame: number,
): CommissionQuote => {
  const price = getCommissionFame(subject.rarity) ?? 0;
  const recipe = priceRecipe(
    getCommissionParts(subject.bom, subject.rarity),
    wallet,
  );
  return {
    fame: price,
    recipe,
    canAfford: fame >= price && recipe.every((line) => line.ok),
  };
};

// ─── The instance that leaves the bench ──────────────────────────────────────

/** Everything about a commissioned guitar except what only the server assigns. */
export const getCommissionedGuitar = (
  def: Pick<GuitarDefinition, "id" | "yearTo" | "countries">,
): Omit<InventoryItem, "id" | "acquiredAt" | "isNew" | "serial"> => ({
  guitarId: def.id,
  year: def.yearTo,
  country: def.countries[0],
  condition: COMMISSION_CONDITION,
  mintCondition: COMMISSION_CONDITION,
});

/** Same, for a pedal. Year and country fall back the way the case roller's do. */
export const getCommissionedEffect = (
  def: Pick<EffectDefinition, "id" | "yearTo" | "countries">,
): Omit<EffectInventoryItem, "id" | "acquiredAt" | "isNew" | "serial"> => ({
  effectId: def.id,
  year: def.yearTo ?? EFFECT_YEAR_TO,
  country: (def.countries ?? EFFECT_COUNTRIES)[0],
  condition: COMMISSION_CONDITION,
  mintCondition: COMMISSION_CONDITION,
});
