/**
 * Deciding what a rig's traits actually pay.
 *
 * Everything here reads one session and the gear in service — no day counters,
 * no streaks, no history. That is what makes the payout split-proof without any
 * of the machinery `calculateSessionFame` needs for its curve: `rate × minutes`
 * is linear, so six 15-minute reports and one 90-minute report come to the same
 * number by arithmetic rather than by bookkeeping.
 *
 * Time is counted in whole 15-minute blocks throughout. A three-minute report
 * therefore pays nothing at all, which is the point: every gate in the trait
 * table is a multiple of 15, and a unit finer than the gates would only be a way
 * to farm them.
 *
 * Order of operations, which is load-bearing:
 *   1. base rate per trait — the rolled value, times its counter, or zero if its
 *      condition is unmet
 *   2. amplifiers add their flat Fame/h to whatever they match
 *   3. penalties apply (`Prima Donna` zeroes everything else, `Diva` docks it)
 *   4. clamp each trait at zero, then sum
 *
 * Amplifiers run before penalties so that `Diva` is a real cost — docking a
 * trait that has already been amplified is the only way the two interact
 * honestly. And nothing here clamps the total: the existing
 * `RIG_FAME_HOURLY_CEILING` is the one ceiling in the system, applied where the
 * base rate and the trait rate finally meet in `calculateSessionFame`.
 */

import type {
  EffectDefinition,
  EffectInventoryItem,
  GuitarDefinition,
  GuitarRarity,
  InventoryItem,
  ItemTrait,
  RigSetup,
} from "../types/arsenal.types";
import { geometryOf, inChainOrder } from "../utils/pedalboardLayout";
import { EFFECTS_BY_ID } from "./effectDefinitions";
import { GUITARS_BY_ID } from "./guitarDefinitions";
import { getEffectiveRarity, RARITY_LADDER } from "./itemStats";
import type {
  PracticeCategory,
  TraitCondition,
  TraitDef,
  TraitKind,
} from "./traits";
import { DRIVE_TYPES, PRACTICE_CATEGORIES, TRAITS_BY_ID } from "./traits";

/** Practice time is only ever counted in whole quarter-hours. */
export const TRAIT_TIME_BLOCK_MINUTES = 15;

export const toTraitBlocks = (minutes: number): number =>
  Math.floor(Math.max(0, minutes) / TRAIT_TIME_BLOCK_MINUTES) *
  TRAIT_TIME_BLOCK_MINUTES;

/**
 * Which category each skill belongs to.
 *
 * Duplicated from `GUITAR_SKILLS` on purpose: that module pulls `react-icons` in
 * through its type, and this file is imported by the report API, where a whole
 * icon pack has no business being. `traits.test.ts` asserts the two agree, so
 * the copy cannot drift.
 */
export const SKILL_CATEGORY: Record<string, PracticeCategory> = {
  alternate_picking: "technique",
  finger_independence: "technique",
  legato: "technique",
  sweep_picking: "technique",
  rhythm: "technique",
  bending: "technique",
  tapping: "technique",
  articulation: "technique",
  vibrato: "technique",
  hybrid_picking: "technique",
  string_skipping: "technique",
  chords: "theory",
  scales: "theory",
  harmony: "theory",
  music_theory: "theory",
  ear_training: "hearing",
  "harmony-ear": "hearing",
  transcription: "hearing",
  "rythm-recognition": "hearing",
  phrasing: "creativity",
  improvisation: "creativity",
  composition: "creativity",
  audio_production: "creativity",
};

// ─── Contexts ────────────────────────────────────────────────────────────────

export interface TraitSessionContext {
  /** Practice minutes of this one session, per category. */
  minutes: Record<PracticeCategory, number>;
  /** Skill ids this session trained (any amount of points). */
  skills: string[];
}

/** One in-service item, flattened to just what a condition can ask about. */
export interface RigItem {
  itemId: string;
  kind: TraitKind;
  brand: string;
  rarity: GuitarRarity;
  effectType?: string;
  year?: number;
  buildLevel: number;
  traits: ItemTrait[];
  /** Horizontal position on the board. Undefined for guitars. */
  x?: number;
  /**
   * Where the pedal sits in the signal chain — 0 is closest to the guitar. See
   * `data/signalChain`, which is also what the board draws its cable from, so a
   * trait reading "in front of every drive" means the same thing the player can
   * see running across the board.
   *
   * Undefined for guitars, and for the hand-built rigs in the trait tests, where
   * the horizontal position is the whole fixture.
   */
  chain?: number;
}

export interface RigTraitContext {
  guitars: RigItem[];
  pedals: RigItem[];
}

type ArsenalLike = Pick<
  {
    rig: RigSetup;
    inventory: InventoryItem[];
    effectInventory: EffectInventoryItem[];
  },
  "rig" | "inventory" | "effectInventory"
>;

/**
 * Flatten the gear in service. Only equipped guitars and boarded pedals appear —
 * a trait on something in the stash pays nothing, which is what makes the rig a
 * decision rather than an inventory total.
 */
export const buildRigTraitContext = (
  arsenal: Partial<ArsenalLike> | null | undefined,
): RigTraitContext => {
  const guitars: RigItem[] = [];
  const pedals: RigItem[] = [];
  if (!arsenal) return { guitars, pedals };

  for (const slotId of arsenal.rig?.guitarSlots ?? []) {
    if (!slotId) continue;
    const item = arsenal.inventory?.find((i) => i.id === slotId);
    const def: GuitarDefinition | undefined = item
      ? GUITARS_BY_ID.get(item.guitarId)
      : undefined;
    if (!item || !def) continue;
    guitars.push({
      itemId: item.id,
      kind: "guitar",
      brand: def.brand,
      rarity: getEffectiveRarity(def.rarity, item.buildLevel),
      year: item.year,
      buildLevel: item.buildLevel ?? 0,
      traits: item.traits ?? [],
    });
  }

  // Chain position rather than raw x, because a multi-row board is wired row by
  // row: a pedal at the far right of the bottom row comes *after* one at the
  // far left of the top row, which comparing x alone gets backwards.
  const chainIndex = new Map(
    inChainOrder(
      geometryOf(arsenal.rig?.boardTier),
      arsenal.rig?.pedalboardItems ?? [],
    ).map((placement, index) => [placement.itemId, index] as const),
  );

  for (const placement of arsenal.rig?.pedalboardItems ?? []) {
    const item = arsenal.effectInventory?.find(
      (e) => e.id === placement.itemId,
    );
    const def: EffectDefinition | undefined = item
      ? EFFECTS_BY_ID.get(item.effectId)
      : undefined;
    if (!item || !def) continue;
    pedals.push({
      itemId: item.id,
      kind: "effect",
      brand: def.brand,
      rarity: getEffectiveRarity(def.rarity, item.buildLevel),
      effectType: def.type,
      year: item.year,
      buildLevel: item.buildLevel ?? 0,
      traits: item.traits ?? [],
      x: placement.xPct,
      chain: chainIndex.get(placement.itemId),
    });
  }

  return { guitars, pedals };
};

// ─── Conditions ──────────────────────────────────────────────────────────────

const isDrive = (pedal: RigItem): boolean =>
  !!pedal.effectType && (DRIVE_TYPES as string[]).includes(pedal.effectType);

/**
 * How far down the signal chain a pedal sits. Falls back to the board x read
 * backwards for a rig assembled without chain positions, where the two agree
 * anyway: on a single row, right to left *is* the chain — a pedal takes its
 * input on its right face, so the one nearest the right edge is played first.
 */
const chainPos = (pedal: RigItem): number =>
  pedal.chain ?? (pedal.x === undefined ? 0 : 100 - pedal.x);

const rarityRank = (rarity: GuitarRarity): number =>
  RARITY_LADDER.indexOf(rarity);

const sessionMinutes = (session: TraitSessionContext): number =>
  session.minutes.technique +
  session.minutes.theory +
  session.minutes.hearing +
  session.minutes.creativity;

/** Whether a condition branch depends on the session rather than the rig. */
const isSessionCondition = (cond: TraitCondition): boolean =>
  cond.type === "category-min" ||
  cond.type === "session-min" ||
  cond.type === "single-category" ||
  cond.type === "categories-min" ||
  cond.type === "skills";

export const evaluateCondition = (
  cond: TraitCondition,
  self: RigItem,
  rig: RigTraitContext,
  session: TraitSessionContext,
  trait: ItemTrait,
): boolean => {
  switch (cond.type) {
    case "all":
      return cond.of.every((c) =>
        evaluateCondition(c, self, rig, session, trait),
      );

    case "category-min":
      return toTraitBlocks(session.minutes[cond.category]) >= cond.minutes;

    case "session-min":
      return toTraitBlocks(sessionMinutes(session)) >= cond.minutes;

    case "single-category": {
      const used = PRACTICE_CATEGORIES.filter(
        (c) => toTraitBlocks(session.minutes[c]) > 0,
      );
      return used.length === 1;
    }

    case "categories-min":
      return (
        PRACTICE_CATEGORIES.filter(
          (c) => toTraitBlocks(session.minutes[c]) >= cond.minutes,
        ).length >= cond.count
      );

    case "skills":
      return cond.skills.every((s) => session.skills.includes(s));

    case "board-empty":
      return rig.pedals.length === 0;

    case "board-max":
      return rig.pedals.length <= cond.max;

    case "board-min":
      return rig.pedals.length >= cond.min;

    case "board-has-types":
      return cond.types.every((t) =>
        rig.pedals.some((p) => p.effectType === t),
      );

    case "board-no-drive":
      return !rig.pedals.some(isDrive);

    case "board-drives":
      return rig.pedals.filter(isDrive).length >= cond.min;

    case "board-second-drive":
      return rig.pedals.some((p) => p.itemId !== self.itemId && isDrive(p));

    case "board-rarity":
      return (
        rig.pedals.filter(
          (p) => rarityRank(p.rarity) >= rarityRank(cond.minRarity),
        ).length >= cond.min
      );

    // Both chain rules exclude the carrier from the drives it is measured
    // against: a Fuzz is itself a drive, and asking it to sit in front of
    // itself is a condition no board can ever satisfy.
    case "chain-before-drives": {
      const drives = rig.pedals.filter(
        (p) => p.itemId !== self.itemId && isDrive(p),
      );
      if (drives.length === 0) return false;
      return drives.every((d) => chainPos(self) < chainPos(d));
    }

    case "chain-after-drives": {
      const drives = rig.pedals.filter(
        (p) => p.itemId !== self.itemId && isDrive(p),
      );
      if (drives.length === 0) return false;
      return drives.every((d) => chainPos(self) > chainPos(d));
    }

    case "only-guitar":
      return rig.guitars.length === 1;

    case "guitar-slots":
      return rig.guitars.length >= cond.count;

    case "same-brand":
      return [...rig.guitars, ...rig.pedals].some(
        (i) => i.itemId !== self.itemId && i.brand === self.brand,
      );

    case "all-guitars-brand": {
      const brand = trait.params?.brand;
      if (!brand || rig.guitars.length === 0) return false;
      return rig.guitars.every((g) => g.brand === brand);
    }

    case "items-before-year":
      return (
        [...rig.guitars, ...rig.pedals].filter(
          (i) => i.year != null && i.year < cond.year,
        ).length >= cond.count
      );

    case "all-items-before-year": {
      const all = [...rig.guitars, ...rig.pedals];
      if (all.length === 0) return false;
      return all.every((i) => i.year != null && i.year < cond.year);
    }

    default:
      return false;
  }
};

/**
 * The rig half of a condition, for the card.
 *
 * A card has no session to read, so session gates cannot be judged there. This
 * answers the only question the card *can*: is the gear right? Session gates
 * report as satisfied so the caller can label them separately — see
 * `getTraitCardState`.
 */
const evaluateRigPart = (
  cond: TraitCondition,
  self: RigItem,
  rig: RigTraitContext,
  trait: ItemTrait,
): boolean => {
  if (isSessionCondition(cond)) return true;
  if (cond.type === "all")
    return cond.of.every((c) => evaluateRigPart(c, self, rig, trait));
  return evaluateCondition(
    cond,
    self,
    rig,
    {
      minutes: { technique: 0, theory: 0, hearing: 0, creativity: 0 },
      skills: [],
    },
    trait,
  );
};

const hasSessionPart = (cond: TraitCondition): boolean =>
  cond.type === "all" ? cond.of.some(hasSessionPart) : isSessionCondition(cond);

// ─── Counters ────────────────────────────────────────────────────────────────

/**
 * How many units a counter trait is currently multiplied by. One for everything
 * else, so callers can treat every trait the same way.
 *
 * Exported because the card needs it: a per-unit rate on its own is not what the
 * trait pays, and showing "+2 Fame/h" beside an empty board was how the state
 * bug got in.
 */
export const getTraitUnits = (
  def: TraitDef,
  trait: ItemTrait,
  self: RigItem,
  rig: RigTraitContext,
): number => {
  const counter = def.counter;
  if (!counter) return 1;
  const all = [...rig.guitars, ...rig.pedals];

  switch (counter.type) {
    case "brand-items": {
      const brand = trait.params?.brand;
      if (!brand) return 0;
      return Math.min(counter.cap, all.filter((i) => i.brand === brand).length);
    }
    case "board-pedals":
      return Math.min(counter.cap, rig.pedals.length);
    case "other-guitars":
      return Math.min(
        counter.cap,
        rig.guitars.filter((g) => g.itemId !== self.itemId).length,
      );
    case "items-before-year":
      return Math.min(
        counter.cap,
        all.filter((i) => i.year != null && i.year < counter.year).length,
      );
    case "board-rarity":
      return Math.min(
        counter.cap,
        rig.pedals.filter(
          (p) => rarityRank(p.rarity) >= rarityRank(counter.minRarity),
        ).length,
      );
    case "other-build-levels":
      return Math.min(
        counter.cap,
        all
          .filter((i) => i.itemId !== self.itemId)
          .reduce((sum, i) => sum + i.buildLevel, 0),
      );
    case "other-traits":
      return Math.min(
        counter.cap,
        all.reduce(
          (sum, i) =>
            sum +
            (i.itemId === self.itemId ? i.traits.length - 1 : i.traits.length),
          0,
        ),
      );
    default:
      return 1;
  }
};

// ─── Card state ──────────────────────────────────────────────────────────────

/**
 * How a trait should read on a card the player owns and has in service.
 *
 * `unmet` is the only state worth colouring differently — it is the one the
 * player can fix right now by moving gear. `session` means the gear is right and
 * the rest is up to how they practise, which is not a failure and must not look
 * like one.
 */
export type TraitCardState = "met" | "unmet" | "session";

export const getTraitCardState = (
  def: TraitDef,
  trait: ItemTrait,
  self: RigItem,
  rig: RigTraitContext,
): TraitCardState => {
  // A counter at zero pays nothing, so it cannot read as satisfied — a
  // `Boutique Row` lit up on a board with no Epic pedal is the card telling a
  // lie about the one number the player is building around.
  if (def.counter && getTraitUnits(def, trait, self, rig) === 0) return "unmet";
  if (!def.condition) return "met";
  if (!evaluateRigPart(def.condition, self, rig, trait)) return "unmet";
  return hasSessionPart(def.condition) ? "session" : "met";
};

// ─── Rates ───────────────────────────────────────────────────────────────────

export interface EvaluatedTrait {
  itemId: string;
  def: TraitDef;
  trait: ItemTrait;
  /** Fame/h this trait ends up paying, after amplifiers and penalties. */
  rate: number;
  /** False when its condition failed — the rate is zero and the UI can say why. */
  active: boolean;
}

/** Categories a trait is "about", for the category amplifiers. */
export const getTraitCategories = (def: TraitDef): Set<PracticeCategory> => {
  const out = new Set<PracticeCategory>();
  if (def.clock !== "session") out.add(def.clock);
  const walk = (cond: TraitCondition | undefined): void => {
    if (!cond) return;
    if (cond.type === "all") {
      cond.of.forEach(walk);
      return;
    }
    if (cond.type === "category-min") out.add(cond.category);
    if (cond.type === "skills")
      cond.skills.forEach((s) => {
        const cat = SKILL_CATEGORY[s];
        if (cat) out.add(cat);
      });
  };
  walk(def.condition);
  return out;
};

const usesSkills = (def: TraitDef): boolean => {
  const walk = (cond: TraitCondition | undefined): boolean => {
    if (!cond) return false;
    if (cond.type === "all") return cond.of.some(walk);
    return cond.type === "skills";
  };
  return walk(def.condition);
};

/**
 * Every trait in service, with the Fame/h it actually pays for this session.
 *
 * Amplifiers and penalties are deliberately not traits-that-pay: an amp
 * contributes nothing on its own line and everything through the lines it
 * raises, which is what makes a rig with one Boost worth more than the Boost.
 */
export const evaluateRigTraits = (
  rig: RigTraitContext,
  session: TraitSessionContext,
): EvaluatedTrait[] => {
  const all = [...rig.guitars, ...rig.pedals];
  const entries: EvaluatedTrait[] = [];

  for (const item of all) {
    for (const trait of item.traits) {
      const def = TRAITS_BY_ID.get(trait.id);
      if (!def) continue;
      const active = def.condition
        ? evaluateCondition(def.condition, item, rig, session, trait)
        : true;
      // An amplifier's own line is always zero — it pays through other traits.
      const base = def.amp
        ? 0
        : active
          ? trait.value * getTraitUnits(def, trait, item, rig)
          : 0;
      entries.push({ itemId: item.itemId, def, trait, rate: base, active });
    }
  }

  // 2. Amplifiers.
  for (const item of all) {
    for (const trait of item.traits) {
      const def = TRAITS_BY_ID.get(trait.id);
      if (!def?.amp) continue;
      const bonus = trait.value;
      const amp = def.amp;

      const targets = entries.filter((e) => {
        if (!e.active || e.def.amp) return false;
        switch (amp.type) {
          case "other-pedals":
            return (
              e.itemId !== item.itemId &&
              rig.pedals.some((p) => p.itemId === e.itemId)
            );
          case "category-traits": {
            const cats = getTraitCategories(e.def);
            return amp.categories.some((c) => cats.has(c));
          }
          case "skill-traits":
            return usesSkills(e.def);
          case "pedals-downstream": {
            const target = rig.pedals.find((p) => p.itemId === e.itemId);
            return !!target && chainPos(target) > chainPos(item);
          }
          case "same-brand": {
            const owner = all.find((i) => i.itemId === e.itemId);
            return !!owner && owner.brand === item.brand;
          }
          default:
            return false;
        }
      });

      if (amp.type === "highest") {
        const best = entries
          .filter((e) => e.active && !e.def.amp)
          .sort((a, b) => b.rate - a.rate)[0];
        if (best) best.rate += bonus;
        continue;
      }

      for (const target of targets) target.rate += bonus;
    }
  }

  // 3. Penalties.
  const zeroing = entries.filter(
    (e) => e.def.penalty?.type === "others-zero" && e.active,
  );
  if (zeroing.length > 0) {
    for (const entry of entries) if (!zeroing.includes(entry)) entry.rate = 0;
  }

  for (const item of all) {
    for (const trait of item.traits) {
      const def = TRAITS_BY_ID.get(trait.id);
      if (def?.penalty?.type !== "others-minus") continue;
      for (const entry of entries)
        if (entry.itemId !== item.itemId) entry.rate -= def.penalty.amount;
    }
  }

  // 4. Nothing pays negative.
  for (const entry of entries) entry.rate = Math.max(0, entry.rate);

  return entries;
};

/**
 * Minutes a trait's rate is actually paid on — its own clock, in whole blocks.
 *
 * This is why the total cannot be expressed as one Fame/h number and then
 * multiplied by the session: a `Shred Machine` on a session that was half theory
 * is paid for half of it, and a `Solo Act` on the same session is paid for all
 * of it. Each line has to be integrated over its own minutes.
 */
export const getTraitClockMinutes = (
  def: TraitDef,
  session: TraitSessionContext,
): number =>
  toTraitBlocks(
    def.clock === "session"
      ? sessionMinutes(session)
      : session.minutes[def.clock],
  );

export interface RigTraitPayout {
  /** Fame the rig's traits earned for this session, before any ceiling. */
  fame: number;
  /**
   * The same payout expressed as Fame/h over the session — what the header
   * shows, and the number the rig ceiling is applied to.
   */
  rate: number;
  entries: EvaluatedTrait[];
}

/** What the rig's traits pay for one session. */
export const getRigTraitPayout = (
  rig: RigTraitContext,
  session: TraitSessionContext,
): RigTraitPayout => {
  const entries = evaluateRigTraits(rig, session);
  const fame = entries.reduce(
    (sum, e) => sum + (e.rate * getTraitClockMinutes(e.def, session)) / 60,
    0,
  );
  const hours = toTraitBlocks(sessionMinutes(session)) / 60;
  return {
    fame: Math.round(fame * 10) / 10,
    rate: hours > 0 ? Math.round((fame / hours) * 10) / 10 : 0,
    entries,
  };
};

/**
 * Headline Fame/h for the Arsenal card, measured against a notional hour spread
 * evenly across the four categories.
 *
 * A rate is only meaningful against some session, and the honest choice for a
 * screen with no session in front of it is the neutral one — an even hour. A
 * `Shred Machine` therefore advertises a quarter of its rolled value here and
 * pays its full value on a technique hour, which is exactly the promise the card
 * copy makes.
 */
export const getRigTraitShowcaseRate = (rig: RigTraitContext): number =>
  getRigTraitPayout(rig, {
    minutes: { technique: 15, theory: 15, hearing: 15, creativity: 15 },
    skills: [],
  }).rate;

/**
 * The same headline, asked once per category: what the traits pay on an hour
 * spent entirely on technique, then entirely on theory, and so on.
 *
 * This is what tells a player their rig is a technique rig — the even-hour
 * number cannot, because it averages the categories into one figure that
 * belongs to none of them.
 *
 * The four rates are deliberately *not* four quarters of the showcase rate, and
 * neither is their average it. A `Monk` wants a single-category session, so it
 * pays its whole rolled value in each of these four and nothing at all on the
 * even hour; a `Well Rounded` does the reverse. Each column is its own session.
 *
 * Skills are left empty, exactly as in the showcase: a rate quoted for a
 * category cannot assume the player also happened to train three named skills.
 */
export const getRigTraitCategoryRates = (
  rig: RigTraitContext,
): Record<PracticeCategory, number> =>
  PRACTICE_CATEGORIES.reduce(
    (rates, category) => {
      rates[category] = getRigTraitPayout(rig, {
        minutes: {
          technique: 0,
          theory: 0,
          hearing: 0,
          creativity: 0,
          [category]: 60,
        },
        skills: [],
      }).rate;
      return rates;
    },
    {} as Record<PracticeCategory, number>,
  );
