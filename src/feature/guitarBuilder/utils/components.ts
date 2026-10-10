import { RARITY_BASE_VALUE } from "feature/arsenal/data/itemStats";

import {
  COMPONENT_DEFS,
  COMPONENT_LEVELS,
  COMPONENTS_BY_ID,
  STICKERS_COUNTED,
} from "../data/components";
import { getBody } from "../data/guitarParts";
import type {
  ComponentDef,
  ComponentOf,
  ComponentRarity,
  ComponentSlot,
  GuitarBuild,
  Loadout,
  OwnedComponent,
  PlacedSticker,
} from "../types/guitarBuilder.types";

export type Random = () => number;

export const RARITY_ORDER: ComponentRarity[] = [
  "Common",
  "Uncommon",
  "Rare",
  "Epic",
  "Legendary",
  "Mythic",
];

/** Drop odds — the Standard Case table, until parts get their own crates. */
export const DROP_ODDS: Record<ComponentRarity, number> = {
  Common: 0.38,
  Uncommon: 0.28,
  Rare: 0.2,
  Epic: 0.11,
  Legendary: 0.025,
  Mythic: 0.005,
};

/**
 * Lowest guitar level for each rarity, set midway between the average level a
 * full set of neighbouring rarities sums to (14 / 19 / 25 / 34 / 47 / 63).
 */
export const BUILD_RARITY_FLOORS: [ComponentRarity, number][] = [
  ["Mythic", 55],
  ["Legendary", 41],
  ["Epic", 30],
  ["Rare", 22],
  ["Uncommon", 17],
  ["Common", 0],
];

export const getComponent = (defId: string): ComponentDef | undefined =>
  COMPONENTS_BY_ID.get(defId);

export function levelRange(def: ComponentDef): [number, number] {
  return COMPONENT_LEVELS[def.slot][def.rarity] ?? [1, 1];
}

export function rollLevel(def: ComponentDef, random: Random): number {
  const [min, max] = levelRange(def);
  return min + Math.floor(random() * (max - min + 1));
}

export function rollDrop(random: Random): ComponentDef {
  let roll = random();
  let rarity: ComponentRarity = "Common";
  for (const tier of RARITY_ORDER) {
    roll -= DROP_ODDS[tier];
    if (roll < 0) {
      rarity = tier;
      break;
    }
  }
  const pool = COMPONENT_DEFS.filter((def) => def.rarity === rarity);
  return pool[Math.floor(random() * pool.length)];
}

export const rarityForLevel = (level: number): ComponentRarity =>
  BUILD_RARITY_FLOORS.find(([, floor]) => level >= floor)?.[0] ?? "Common";

/** Small seeded PRNG (mulberry32) so a demo stash rolls the same every load. */
export function seededRandom(seed: number): Random {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Owned<S extends ComponentSlot = ComponentSlot> = OwnedComponent & {
  def: ComponentOf<S>;
};

export function resolveOwned<S extends ComponentSlot>(
  stash: OwnedComponent[],
  uid: string | null,
  slot: S,
): Owned<S> | null {
  if (!uid) return null;
  const owned = stash.find((item) => item.uid === uid);
  const def = owned && getComponent(owned.defId);
  return owned && def?.slot === slot
    ? { ...owned, def: def as ComponentOf<S> }
    : null;
}

/** Why a component can't go on the current body, or null when it fits. */
export function fitProblem(
  def: ComponentDef,
  body: ComponentOf<"body"> | null,
) {
  if (!body) return null;
  if (def.slot === "pickups" && def.type !== body.routing) {
    return "Doesn't fit this body's routing";
  }
  if (def.slot === "pickguard" && getBody(body.partKey).pickguardL === null) {
    return "This body has no pickguard to swap";
  }
  return null;
}

export interface LevelLine {
  slot: ComponentSlot;
  name: string;
  level: number;
}

/**
 * The guitar's level: every fitted part, plus the best few stickers. A part
 * that doesn't fit the body (pickups of the wrong type) adds nothing.
 */
export function buildLevel(
  stash: OwnedComponent[],
  loadout: Loadout,
  stickers: PlacedSticker[],
) {
  const body = resolveOwned(stash, loadout.body, "body");
  const lines: LevelLine[] = [];
  (["body", "neck", "head", "pickups", "finish", "pickguard"] as const).forEach(
    (slot) => {
      const owned = resolveOwned(stash, loadout[slot], slot);
      if (owned && !fitProblem(owned.def, body?.def ?? null)) {
        lines.push({ slot, name: owned.def.name, level: owned.level });
      }
    },
  );
  const stickerLevels = stickers
    .map((placed) => resolveOwned(stash, placed.id, "sticker"))
    .filter((owned): owned is Owned<"sticker"> => owned !== null)
    .map((owned) => owned.level)
    .sort((a, b) => b - a)
    .slice(0, STICKERS_COUNTED);
  if (stickerLevels.length) {
    lines.push({
      slot: "sticker",
      name: `Best ${stickerLevels.length} of ${stickers.length}`,
      level: stickerLevels.reduce((sum, level) => sum + level, 0),
    });
  }
  const total = lines.reduce((sum, line) => sum + line.level, 0);
  const complete = Boolean(
    body &&
    lines.some((line) => line.slot === "neck") &&
    lines.some((line) => line.slot === "head") &&
    lines.some((line) => line.slot === "pickups") &&
    lines.some((line) => line.slot === "finish"),
  );
  return { total, lines, complete, rarity: rarityForLevel(total) };
}

/** What the renderer needs from a loadout. Missing neck/head fall back to stock art. */
export function toGuitarBuild(
  stash: OwnedComponent[],
  loadout: Loadout,
  stickers: PlacedSticker[],
  fallback: { bodyKey: string; neckKey: string; headKey: string },
): GuitarBuild {
  const body = resolveOwned(stash, loadout.body, "body");
  const neck = resolveOwned(stash, loadout.neck, "neck");
  const head = resolveOwned(stash, loadout.head, "head");
  const pickups = resolveOwned(stash, loadout.pickups, "pickups");
  const finish = resolveOwned(stash, loadout.finish, "finish");
  const guard = resolveOwned(stash, loadout.pickguard, "pickguard");
  const fits = (def: ComponentDef | undefined) =>
    def && !fitProblem(def, body?.def ?? null) ? def : null;
  const pickupsDef = fits(pickups?.def) as ComponentOf<"pickups"> | null;
  const guardDef = fits(guard?.def) as ComponentOf<"pickguard"> | null;
  return {
    bodyKey: body?.def.partKey ?? fallback.bodyKey,
    neckKey: neck?.def.partKey ?? fallback.neckKey,
    headKey: head?.def.partKey ?? fallback.headKey,
    finish: finish?.def.color ?? null,
    top: finish?.def.top ?? null,
    burst: finish?.def.burst ?? false,
    burstColor: finish?.def.burstColor ?? null,
    style: finish?.def.style ?? "gloss",
    pickguard: guardDef?.color ?? null,
    pickups: pickupsDef
      ? { color: pickupsDef.cover, metal: pickupsDef.metal }
      : null,
    stickers,
  };
}

let dropCounter = 0;

export function dropComponent(
  random: Random,
  def = rollDrop(random),
): OwnedComponent {
  dropCounter += 1;
  return {
    uid: `${def.id}#${Date.now().toString(36)}${dropCounter}`,
    defId: def.id,
    level: rollLevel(def, random),
  };
}

/**
 * Demo stash: one copy of everything, plus a pile of extra drops so the same
 * model shows up at different levels. Seeded, so it's identical every load.
 */
export function createDemoStash(seed = 7, extraDrops = 40): OwnedComponent[] {
  const random = seededRandom(seed);
  const stash = COMPONENT_DEFS.map((def, i) => ({
    uid: `${def.id}#demo${i}`,
    defId: def.id,
    level: rollLevel(def, random),
  }));
  for (let i = 0; i < extraDrops; i++) {
    const def = rollDrop(random);
    stash.push({
      uid: `${def.id}#extra${i}`,
      defId: def.id,
      level: rollLevel(def, random),
    });
  }
  return stash;
}

// ─── Case drops ──────────────────────────────────────────────────────────────

/**
 * Cases that can hand out a Guitar Builder part instead of their usual drop,
 * and how often. Parts come almost entirely from cases, so the chance is high;
 * the effects-only cases keep to pedals, and the curated Featured / Supporter
 * cases keep to their slate.
 */
export const COMPONENT_CASE_CHANCE: Partial<Record<string, number>> = {
  standard: 0.6,
  "premium-guitar": 0.6,
  "elite-guitar": 0.6,
};

/**
 * A part rolled from a case's own rarity table, so a better case drops better
 * parts. A rarity no part comes in falls back one step down.
 */
export function rollCaseComponent(
  probabilities: Partial<Record<ComponentRarity, number>>,
  random: Random,
): OwnedComponent {
  let roll = random();
  let rarity: ComponentRarity = "Common";
  for (const tier of RARITY_ORDER) {
    roll -= probabilities[tier] ?? 0;
    if (roll < 0) {
      rarity = tier;
      break;
    }
  }
  let index = RARITY_ORDER.indexOf(rarity);
  let pool = COMPONENT_DEFS.filter((def) => def.rarity === rarity);
  while (!pool.length && index > 0) {
    index -= 1;
    pool = COMPONENT_DEFS.filter((def) => def.rarity === RARITY_ORDER[index]);
  }
  const def = pool[Math.floor(random() * pool.length)];
  return {
    uid: `${def.id}#${Date.now().toString(36)}${Math.floor(random() * 1e9).toString(36)}`,
    defId: def.id,
    level: rollLevel(def, random),
    acquiredAt: Date.now(),
    isNew: true,
  };
}

// ─── Building ────────────────────────────────────────────────────────────────

export type BuildCheck =
  | { ok: true; level: number; rarity: ComponentRarity; used: OwnedComponent[] }
  | { ok: false; error: string };

/**
 * Whether a loadout can be built from a stash — every slot the guitar needs,
 * each one a part the player owns, fitting the body, no part used twice. The
 * client greys the Build button with it; the API refuses with the same answer.
 */
export function checkBuild(
  stash: OwnedComponent[],
  loadout: Loadout,
  stickers: PlacedSticker[],
  maxStickers: number,
): BuildCheck {
  const uids = [
    ...Object.values(loadout).filter((uid): uid is string => Boolean(uid)),
    ...stickers.map((sticker) => sticker.id),
  ];
  if (new Set(uids).size !== uids.length) {
    return { ok: false, error: "A part can only go on once" };
  }
  if (stickers.length > maxStickers) {
    return { ok: false, error: "Too many stickers" };
  }
  const owned = new Map(stash.map((item) => [item.uid, item]));
  for (const uid of uids) {
    if (!owned.has(uid)) return { ok: false, error: "You don't own that part" };
  }
  for (const [slot, uid] of Object.entries(loadout)) {
    if (uid && !resolveOwned(stash, uid, slot as ComponentSlot)) {
      return { ok: false, error: "A part is in the wrong slot" };
    }
  }
  for (const sticker of stickers) {
    const art = resolveOwned(stash, sticker.id, "sticker");
    if (!art || art.def.stickerKey !== sticker.key) {
      return { ok: false, error: "Unknown sticker" };
    }
  }
  const body = resolveOwned(stash, loadout.body, "body");
  for (const slot of ["pickups", "pickguard"] as const) {
    const part = resolveOwned(stash, loadout[slot], slot);
    if (part && fitProblem(part.def, body?.def ?? null)) {
      return { ok: false, error: fitProblem(part.def, body?.def ?? null)! };
    }
  }
  const summary = buildLevel(stash, loadout, stickers);
  if (!summary.complete) {
    return {
      ok: false,
      error: "Body, neck, headstock, pickups and finish are all needed",
    };
  }
  return {
    ok: true,
    level: summary.total,
    rarity: summary.rarity,
    used: uids.map((uid) => owned.get(uid)!),
  };
}

// ─── Resale ──────────────────────────────────────────────────────────────────

/**
 * Fame for selling a part, and the floor under a market listing of one.
 *
 * Pegged to what a whole guitar of the same rarity sells for: a part is one
 * piece of five, so it pays a quarter of that at the bottom of its level
 * range and a bit over half at the top — a high roll is worth more.
 */
export function getComponentResaleValue(owned: OwnedComponent): number {
  const def = getComponent(owned.defId);
  if (!def) return 0;
  const [min, max] = levelRange(def);
  const fraction = max > min ? (owned.level - min) / (max - min) : 1;
  const clamped = Math.min(1, Math.max(0, fraction));
  return Math.max(
    1,
    Math.round(RARITY_BASE_VALUE[def.rarity] * (0.25 + 0.3 * clamped)),
  );
}
