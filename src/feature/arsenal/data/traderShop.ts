import type {
  GuitarRarity,
  InventoryItem,
  PartId,
  PartTier,
} from "../types/arsenal.types";
import type {
  TraderEffectOffer,
  TraderGuitarOffer,
  TraderModOffer,
  TraderOffer,
  TraderPartOffer,
  TraderShop,
} from "../types/trader.types";
import {
  mulberry32,
  seededPick,
  weightedPick,
  weightedSample,
} from "../utils/seededRandom";
import { EFFECTS_BY_RARITY } from "./effectDefinitions";
import {
  getEffectValue,
  rollEffectCountry,
  rollEffectFeatures,
  rollEffectYear,
} from "./effectStats";
import { GUITARS_BY_RARITY } from "./guitarDefinitions";
import {
  getItemValue,
  rollCondition,
  rollItemFeatures,
  rollVintageYear,
} from "./itemStats";
import { PART_DEFINITIONS, PART_TIERS } from "./partDefinitions";
import { getPartSupply } from "./partSupply";
import { rollItemTraits } from "./traits";
import type { ModFeatureDef } from "./workshop";
import { getModPool, MOD_ROLL_BONUS } from "./workshop";

/**
 * The trader: a system-run shop that restocks every day.
 *
 * Two things separate it from the marketplace next door. It sells what players
 * cannot list — *parts*, and one loose *mod* a day — and everything it sells is
 * priced by the system rather than by whoever listed it, so it is the only place
 * where a player who needs one specific Legendary pickup can simply go and buy
 * one.
 *
 * **The whole stock is derived from the window number and nothing else.** Same
 * trick as `dailyCase.ts`: every client renders the shop front with zero reads,
 * the server recomputes the identical offers when someone pays, and there is no
 * stock document to write, contend on, or keep in sync. What a player has already
 * taken lives in their own user doc, so two players never race each other.
 *
 * ─── Pricing ───────────────────────────────────────────────────────────────
 *
 * Parts are priced off what they *already* cost in the game: scrapping is the
 * only other way to get one, so a part's real price is the sell value the player
 * gives up by tearing an item down instead of selling it. The cheapest donor of
 * an Epic part is a Rare pedal — 40 Fame for three pieces, so about 13 Fame each.
 * The counter charges roughly triple that, and the premium is for precision: no
 * RNG, no needing the donor item first, and exactly the part the recipe asks for.
 * Scrapping has to stay clearly the cheaper route or the salvage loop dies, so
 * the multiple is deliberately well above 1 — see `traderShop.test.ts`, which
 * measures it against the real drop tables rather than trusting these numbers.
 *
 * Items are priced off their own sell value (`getItemValue` / `getEffectValue`)
 * times a multiplier that climbs steeply with rarity. Two consequences, both
 * deliberate: buying and selling back always returns a fixed fraction, so there
 * is no arbitrage at any rarity, and a Legendary costs roughly what a player
 * would otherwise burn on Elite cases hunting one — the trader is the patient
 * route to a specific instrument, never the cheap one. Player listings have a
 * floor of one sell value, so the marketplace always undercuts the trader; this
 * counter sets its ceiling, it does not compete with it.
 */

/** A window is one UTC day — the stock turns over at midnight UTC. */
export const TRADER_WINDOW_MS = 86_400_000;

/**
 * Offsets the seed away from `getDailyPoolSeed`, which counts the same days.
 * Without it the featured case pool and the trader would rotate in lockstep and
 * their draws would correlate.
 */
const TRADER_SEED_SALT = 0x9e3779b9;

export const getTraderWindow = (date: Date = new Date()): number =>
  Math.floor(date.getTime() / TRADER_WINDOW_MS);

export const getTraderRestockAt = (date: Date = new Date()): number =>
  (getTraderWindow(date) + 1) * TRADER_WINDOW_MS;

// ─── Prices ──────────────────────────────────────────────────────────────────

/** Fame per piece, before the scarcity multiplier. Screws are priced separately. */
export const PART_UNIT_PRICE: Record<Exclude<PartTier, "Unique">, number> = {
  Standard: 12,
  Epic: 35,
  /**
   * Priced far above the tier below it, and far above what a teardown of a
   * Legendary donor costs. That is the point: this slot exists to unstick a
   * build that a starved drop table has walled off, not to be the way players
   * supply themselves with Legendary parts. One a day at this price is a month
   * of practice for a single top-flight build level.
   */
  Legendary: 450,
};

/**
 * Filler is priced as filler. Screws come off every teardown for free on top of
 * the BOM, so they have no scrap opportunity cost to anchor to.
 */
export const SCREW_UNIT_PRICE = 2;

/**
 * Multiplied by the instance's own sell value. Steep on purpose: a Mythic has to
 * read as a season's savings, not as a purchase.
 *
 * `Custom Shop` is workshop-only — the trader never stocks one.
 */
export const ITEM_PRICE_MULTIPLIER: Record<GuitarRarity, number> = {
  Common: 4,
  Uncommon: 5,
  Rare: 6,
  Epic: 8,
  Legendary: 10,
  Mythic: 12,
  "Custom Shop": 0,
};

/** The cut on the one part offer flagged as the day's deal. */
export const DEAL_DISCOUNT_PCT = 30;

/**
 * What the day's mod costs, as a multiple of buying its own bill at this same
 * counter and doing the job at the bench.
 *
 * Above 1 by a wide margin, for the same reason parts cost more than scrapping:
 * the counter is the precise route, never the cheap one. What the premium buys
 * here is bigger than usual, though — a bench mod needs an instrument that
 * physically takes it, a free slot on that instrument, and the parts in hand,
 * and it rolls its value only after the bill is paid. This one is a component in
 * the stash with its number already on it, and it can wait there until the
 * instrument worth putting it on turns up.
 */
export const MOD_PRICE_MULTIPLIER = 2;

/** Extra on top at a perfect roll, tapering to nothing at the pool's floor. */
export const MOD_ROLL_PREMIUM = 0.6;

// ─── Stock ───────────────────────────────────────────────────────────────────

/**
 * Parts sell by the piece, so a slot's stock is its per-player daily limit and
 * nothing else — a player with 30 Fame to their name can still walk out with
 * fifteen screws.
 *
 * The ceilings are what keep the workshop honest: at one piece a day, and only on
 * the days the slot turns up at all, a Legendary part takes weeks to add up to a
 * single top-flight build level, which is the pace `workshop.ts` was balanced
 * around.
 */
const SCREW_STOCK = 40;
const STANDARD_STOCKS = [8, 6];
const EPIC_STOCKS = [4, 3];
/**
 * One piece, not a stack. The slot exists to unstick a build the drop tables have
 * walled off, so it hands over the missing piece — it does not let a player buy
 * their way through a whole Legendary bill in one visit.
 */
const LEGENDARY_STOCK = 1;

/**
 * Potentiometers get a slot of their own because no drop table supplies them.
 * `pot` caps at Epic and sits deep in every BOM, which makes an Epic pot rarer
 * than a Legendary pickup while half the mod bills ask for three of them.
 */
const POT_STOCK: Record<"Standard" | "Epic", number> = { Standard: 6, Epic: 3 };
const POT_EPIC_CHANCE = 0.4;

/** How often the counter has a Legendary part at all. Roughly one day in three. */
const LEGENDARY_SLOT_CHANCE = 0.35;

/**
 * One mod a day, one to a player. It is a component, not a stack: a second copy
 * of the same feature cannot go on the same instrument anyway.
 */
const MOD_STOCK = 1;

/** How often the day's mod is a guitar mod rather than a pedal one. */
const MOD_GUITAR_CHANCE = 0.5;

/** Rarity of each featured slot. Legendary lands every week or two, Mythic ~monthly. */
export const TRADER_ITEM_RARITY_WEIGHTS: Record<string, number> = {
  Common: 30,
  Uncommon: 30,
  Rare: 23,
  Epic: 12,
  Legendary: 4,
  Mythic: 1,
};

// ─── Scarcity ────────────────────────────────────────────────────────────────

const SCARCITY_MIN = 0.8;
const SCARCITY_MAX = 1.25;

/**
 * Parts the counter can stock at random. Screws and pots are excluded because
 * they have dedicated slots; everything else is a structural part that some
 * recipe asks for by name.
 */
const STOCKABLE_PARTS = PART_DEFINITIONS.filter((p) => p.group !== "shared");

const medianOf = (values: number[]): number => {
  if (values.length === 0) return 1;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
};

/** Median supply per tier, computed once — the yardstick every part is measured against. */
const MEDIAN_SUPPLY = new Map<PartTier, number>(
  PART_TIERS.map((tier) => [
    tier,
    medianOf(
      STOCKABLE_PARTS.map((p) => getPartSupply(p.id, tier)).filter(
        (s) => s > 0,
      ),
    ),
  ]),
);

/**
 * How much dearer than average a part is, by how little of it the drop tables
 * actually pay out (`partSupply.ts`).
 *
 * One number does two jobs: it prices the part *and* weights how often the
 * counter stocks it. So the parts the game starves — `tuners` at Legendary being
 * the documented worst case — show up more often and cost more, which is exactly
 * the shape of a shortage.
 */
export const getPartScarcityMultiplier = (
  partId: PartId,
  tier: PartTier,
): number => {
  const supply = getPartSupply(partId, tier);
  if (supply <= 0) return SCARCITY_MAX;
  const median = MEDIAN_SUPPLY.get(tier) ?? supply;
  return Math.min(SCARCITY_MAX, Math.max(SCARCITY_MIN, median / supply));
};

const roundTo = (value: number, step: number): number =>
  Math.max(step, Math.round(value / step) * step);

/** Fame for one piece of a part, scarcity included. */
export const getPartUnitPrice = (partId: PartId, tier: PartTier): number => {
  if (partId === "screws") return SCREW_UNIT_PRICE;
  const base = PART_UNIT_PRICE[tier as Exclude<PartTier, "Unique">] ?? 0;
  if (base === 0) return 0;
  return roundTo(base * getPartScarcityMultiplier(partId, tier), 5);
};

/** Round prices so they read as prices. Big ones lose their last digits entirely. */
const roundItemPrice = (value: number): number =>
  value >= 500 ? roundTo(value, 25) : roundTo(value, 5);

// ─── Offers ──────────────────────────────────────────────────────────────────

const partOffer = (
  id: string,
  partId: PartId,
  tier: PartTier,
  stock: number,
): TraderPartOffer => {
  const unitPrice = getPartUnitPrice(partId, tier);
  return {
    id,
    kind: "part",
    partId,
    tier,
    stock,
    unitPrice,
    basePrice: unitPrice,
    discountPct: 0,
  };
};

const canStockAt = (maxTier: PartTier, tier: PartTier): boolean =>
  PART_TIERS.indexOf(maxTier) >= PART_TIERS.indexOf(tier);

const drawParts = (tier: PartTier, count: number, random: () => number) =>
  weightedSample(
    STOCKABLE_PARTS.filter((p) => canStockAt(p.maxTier, tier)),
    (p) => getPartScarcityMultiplier(p.id, tier),
    count,
    random,
  );

const drawRarity = (random: () => number): GuitarRarity =>
  (weightedPick(
    Object.keys(TRADER_ITEM_RARITY_WEIGHTS),
    (rarity) => TRADER_ITEM_RARITY_WEIGHTS[rarity],
    random,
  ) ?? "Common") as GuitarRarity;

/**
 * Keeps two slots of the same kind off the same model. Falls back to the whole
 * pool when a rarity has nothing else to offer — a repeat beats an empty slot.
 */
const pickUnused = <T extends { id: number | string }>(
  pool: readonly T[],
  used: Set<number | string>,
  random: () => number,
): T | undefined => {
  const fresh = pool.filter((def) => !used.has(def.id));
  return seededPick(fresh.length > 0 ? fresh : pool, random);
};

const drawGuitarOffer = (
  id: string,
  random: () => number,
  used: Set<number | string>,
): TraderGuitarOffer | null => {
  const pool = GUITARS_BY_RARITY[drawRarity(random)] ?? [];
  const def = pickUnused(pool, used, random);
  if (!def) return null;
  used.add(def.id);

  const rolled = rollItemFeatures(def.rarity, random);
  // Driven by the same seeded `random` as every other roll on this offer, so the
  // instance the shop card advertises is the one the purchase mints server-side.
  const rolledTraits = rollItemTraits(def.rarity, "guitar", undefined, random);
  const roll = {
    guitarId: def.id,
    year: rollVintageYear(def.yearFrom, def.yearTo, random),
    country: seededPick(def.countries, random) ?? def.countries[0],
    condition: rollCondition(random),
    ...(rolled ? { stats: rolled.stats, features: rolled.features } : {}),
    ...(rolledTraits ? { traits: rolledTraits } : {}),
  };

  // Priced off this exact instance, so a Museum-grade '61 costs what it is worth
  // and a mint-condition reissue of the same model does not.
  const price = roundItemPrice(
    getItemValue({ ...roll, id } as InventoryItem, def) *
      ITEM_PRICE_MULTIPLIER[def.rarity],
  );

  return {
    id,
    kind: "guitar",
    roll,
    stock: 1,
    unitPrice: price,
    basePrice: price,
    discountPct: 0,
  };
};

const drawEffectOffer = (
  id: string,
  random: () => number,
  used: Set<number | string>,
): TraderEffectOffer | null => {
  const pool = EFFECTS_BY_RARITY[drawRarity(random)] ?? [];
  const def = pickUnused(pool, used, random);
  if (!def) return null;
  used.add(def.id);

  const rolled = rollEffectFeatures(def.rarity, def.type, random);
  const rolledTraits = rollItemTraits(def.rarity, "effect", def.type, random);
  const roll = {
    effectId: def.id,
    year: rollEffectYear(def, random),
    country: rollEffectCountry(def, random),
    condition: rollCondition(random),
    ...(rolled ? { stats: rolled.stats, features: rolled.features } : {}),
    ...(rolledTraits ? { traits: rolledTraits } : {}),
  };

  // Effect sell value is flat per rarity — condition and vintage don't move it,
  // so neither does the price.
  const price = roundItemPrice(
    getEffectValue(def) * ITEM_PRICE_MULTIPLIER[def.rarity],
  );

  return {
    id,
    kind: "effect",
    roll,
    stock: 1,
    unitPrice: price,
    basePrice: price,
    discountPct: 0,
  };
};

/**
 * What the parts for one mod cost at this counter today.
 *
 * The bill is the mod, so the bill is the price — scarcity, tier steps and all.
 * A `hand-wound` asking for two Legendary pickups is dear because Legendary
 * pickups are dear, and it stays in step with the parts on the shelf next to it
 * without a second table to keep in sync.
 */
export const getModBillValue = (def: ModFeatureDef): number =>
  def.parts.reduce(
    (sum, line) => sum + getPartUnitPrice(line.partId, line.tier) * line.qty,
    0,
  );

/**
 * Fame for a mod of this value. The roll is worth paying for — a `+1` and a `+6`
 * of the same feature are not the same object — but the bill dominates, so a
 * cheap mod on a perfect roll never overtakes a dear one on a poor one.
 */
export const getModOfferPrice = (
  def: ModFeatureDef,
  points: number,
): number => {
  const span = def.max - def.min;
  const quality = span > 0 ? (points - def.min) / span : 0;
  return roundItemPrice(
    getModBillValue(def) *
      MOD_PRICE_MULTIPLIER *
      (1 + MOD_ROLL_PREMIUM * Math.min(1, Math.max(0, quality))),
  );
};

/**
 * The day's mod.
 *
 * The value is rolled over the *case* range rather than the widened bench one:
 * the workshop has to keep rolling the best numbers in the game, or paying Fame
 * for a component beats doing the work. `MOD_ROLL_BONUS` is the bench's edge and
 * the counter does not get it.
 */
const drawModOffer = (
  id: string,
  random: () => number,
): TraderModOffer | null => {
  const modKind = random() < MOD_GUITAR_CHANCE ? "guitar" : "effect";
  const def = seededPick(getModPool(modKind), random);
  if (!def) return null;

  const max = Math.max(def.min, def.max - MOD_ROLL_BONUS);
  const points = def.min + Math.floor(random() * (max - def.min + 1));
  const price = getModOfferPrice(def, points);

  return {
    id,
    kind: "mod",
    modKind,
    featureId: def.id,
    label: def.label,
    points,
    minPoints: def.min,
    maxPoints: max,
    stock: MOD_STOCK,
    unitPrice: price,
    basePrice: price,
    discountPct: 0,
  };
};

const discounted = (offer: TraderPartOffer): TraderPartOffer => ({
  ...offer,
  unitPrice: Math.max(
    1,
    Math.round((offer.basePrice * (100 - DEAL_DISCOUNT_PCT)) / 100),
  ),
  discountPct: DEAL_DISCOUNT_PCT,
});

/**
 * Everything the counter stocks in the window containing `date`.
 *
 * Deterministic: the same date yields the same offers, the same rolls and the
 * same prices on every client and on the server.
 */
export const getTraderOffers = (date: Date = new Date()): TraderOffer[] => {
  const window = getTraderWindow(date);
  const random = mulberry32(window ^ TRADER_SEED_SALT);
  const id = (slot: string) => `${window}-${slot}`;

  const parts: TraderPartOffer[] = [
    partOffer(id("screws"), "screws", "Standard", SCREW_STOCK),
  ];

  drawParts("Standard", STANDARD_STOCKS.length, random).forEach((part, i) =>
    parts.push(
      partOffer(id(`std-${i}`), part.id, "Standard", STANDARD_STOCKS[i]),
    ),
  );

  const potTier = random() < POT_EPIC_CHANCE ? "Epic" : "Standard";
  parts.push(partOffer(id("pot"), "pot", potTier, POT_STOCK[potTier]));

  drawParts("Epic", EPIC_STOCKS.length, random).forEach((part, i) =>
    parts.push(partOffer(id(`epic-${i}`), part.id, "Epic", EPIC_STOCKS[i])),
  );

  if (random() < LEGENDARY_SLOT_CHANCE) {
    const [part] = drawParts("Legendary", 1, random);
    if (part) {
      parts.push(partOffer(id("leg"), part.id, "Legendary", LEGENDARY_STOCK));
    }
  }

  // One part offer goes on sale. Screws are left out — 30% off two Fame is not a
  // deal, and it would waste the day's only discount.
  const dealCandidates = parts.filter((p) => p.partId !== "screws");
  const deal = seededPick(dealCandidates, random);
  const priced = parts.map((offer) =>
    deal && offer.id === deal.id ? discounted(offer) : offer,
  );

  // Two of each, drawn alternately so the rarity rolls interleave rather than
  // both guitars sharing one run of the sequence. Models never repeat within a
  // window: four slots showing the same pedal twice is not four slots.
  const usedGuitars = new Set<number | string>();
  const usedEffects = new Set<number | string>();
  const items = [
    drawGuitarOffer(id("guitar-0"), random, usedGuitars),
    drawEffectOffer(id("effect-0"), random, usedEffects),
    drawGuitarOffer(id("guitar-1"), random, usedGuitars),
    drawEffectOffer(id("effect-1"), random, usedEffects),
  ].filter((offer): offer is TraderGuitarOffer | TraderEffectOffer =>
    Boolean(offer),
  );

  // Drawn last so adding it left every offer above it — and therefore every
  // price and every rolled instance — exactly as it was.
  const mod = drawModOffer(id("mod"), random);

  return [...priced, ...items, ...(mod ? [mod] : [])];
};

export const getTraderShop = (date: Date = new Date()): TraderShop => ({
  window: getTraderWindow(date),
  restockAt: getTraderRestockAt(date),
  offers: getTraderOffers(date),
});
