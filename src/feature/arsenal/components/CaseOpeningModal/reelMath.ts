import { getDailyPool } from "feature/arsenal/data/dailyCase";
import { EFFECTS_BY_RARITY } from "feature/arsenal/data/effectDefinitions";
import { DROPPABLE_GUITARS_BY_RARITY } from "feature/arsenal/data/guitarDefinitions";
import { GUITAR_CHANCE } from "feature/arsenal/utils/caseRoll";
import { isAtLeast } from "feature/arsenal/utils/pity";
import { COMPONENT_DEFS } from "feature/guitarBuilder/data/components";
import type { ComponentDef } from "feature/guitarBuilder/types/guitarBuilder.types";

import type {
  CaseDefinition,
  EffectDefinition,
  GuitarDefinition,
  GuitarRarity,
} from "../../types/arsenal.types";

/**
 * The case reel: a drum of items that spins past a pointer and stops on the
 * pull. Everything here is plain numbers, so the component only has to put
 * them on the page, once a frame, without React rendering in between.
 */

export type StripItem =
  | { kind: "guitar"; def: GuitarDefinition }
  | { kind: "effect"; def: EffectDefinition }
  | { kind: "component"; def: ComponentDef };

/** Items on the drum. Enough for three seconds of spin, few enough to paint cheaply. */
export const REEL_LENGTH = 36;
/** Where the pull sits. The six after it are only there so the drum never ends in view. */
export const REEL_WIN_INDEX = 30;

/** The spin itself. */
export const SPIN_MS = 3200;
/** What is left of the spin after a tap. */
export const BRAKE_MS = 900;
/** The drum runs past the pull and settles back onto it, like a ratchet. */
export const SETTLE_MS = 380;
/** How far past, in tile widths. */
export const OVERSHOOT = 0.22;
/** The case rattles at least this long, even when the art is already cached. */
export const INTRO_MIN_MS = 500;
/** And never longer than this waiting for art: a slow image just pops in late. */
export const PRELOAD_CAP_MS = 900;

/** Tile width: narrower on a phone, so the drum still shows five items. */
export const reelTileWidth = (viewportWidth: number): number =>
  viewportWidth < 640 ? 124 : 172;

/**
 * How a tile looks at `dist` tile widths from the centre (negative: left).
 * The centre one is biggest; the rest shrink, drop and turn away, as on the
 * face of a turning drum.
 */
export const reelTileLook = (dist: number) => {
  const away = Math.min(Math.abs(dist), 3.2);
  return {
    scale: 1.32 - away * 0.22,
    y: away * away * 7,
    // `|| 0` keeps the centre tile at 0, not -0.
    rotateY: -dist * 22 || 0,
    opacity: Math.max(0, 1 - away * 0.3),
  };
};

/** The tile under the pointer when the strip has moved `x` px. */
export const reelIndexAt = (x: number, viewport: number, tileWidth: number) =>
  Math.floor((x + viewport / 2) / tileWidth);

/**
 * Where the strip stops: the pull's tile under the pointer, off its centre by
 * `jitter` (−1…1) times 15% of a tile, so it does not land dead centre every time.
 */
export const reelTarget = (
  winIndex: number,
  viewport: number,
  tileWidth: number,
  jitter: number,
) => winIndex * tileWidth - (viewport / 2 - tileWidth / 2) + jitter * tileWidth * 0.15;

export const easeOutQuart = (p: number) => 1 - Math.pow(1 - p, 4);
export const easeInOutQuad = (p: number) =>
  p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;

/** How long the drum holds the pull before the reward screen — longer for a better pull. */
export const reelHoldMs = (rarity: GuitarRarity): number =>
  isAtLeast(rarity, "Legendary") ? 1500 : isAtLeast(rarity, "Epic") ? 1200 : 900;

/** A random Guitar Builder part of a rarity, for the reel's fillers. */
function randomComponent(rarity: GuitarRarity): StripItem | null {
  const pool = COMPONENT_DEFS.filter((def) => def.rarity === rarity);
  return pool.length
    ? { kind: "component", def: pool[Math.floor(Math.random() * pool.length)] }
    : null;
}

export function buildRouletteStrip(
  caseDef: CaseDefinition,
  winItem: StripItem,
  length = REEL_LENGTH,
  winIndex = REEL_WIN_INDEX,
): StripItem[] {
  const rarities = Object.entries(caseDef.probabilities) as [GuitarRarity, number][];
  const strip: StripItem[] = [];

  // Daily case can only drop today's featured pool, so the roulette fillers
  // come from that pool too — the animation never teases an impossible item.
  const dailyPool = caseDef.id === "daily" ? getDailyPool() : null;

  for (let i = 0; i < length; i++) {
    if (i === winIndex) {
      strip.push(winItem);
      continue;
    }

    let roll = Math.random();
    let chosen: GuitarRarity = "Common";
    for (const [rarity, prob] of rarities) {
      roll -= prob;
      if (roll <= 0) {
        chosen = rarity;
        break;
      }
    }

    // The Parts Crate drops builder parts and nothing else, so its whole reel is
    // parts; every other case drops gear only and never shows one.
    if (caseDef.dropKind === "component") {
      strip.push(randomComponent(chosen) ?? winItem);
      continue;
    }

    if (dailyPool) {
      const candidates = dailyPool.filter((e) => e.def.rarity === chosen);
      const pickFrom = candidates.length > 0 ? candidates : dailyPool;
      strip.push(pickFrom[Math.floor(Math.random() * pickFrom.length)]);
      continue;
    }

    // Guitar/effect-only cases (e.g. "Elite Guitar Case") must only fill the
    // strip with items they can actually drop — otherwise the reel teases an
    // impossible pull. Mixed cases keep the same guitar/effect split they roll.
    const wantsGuitar = caseDef.dropKind
      ? caseDef.dropKind === "guitar"
      : Math.random() < GUITAR_CHANCE;

    if (wantsGuitar) {
      const pool = DROPPABLE_GUITARS_BY_RARITY[chosen];
      strip.push(
        pool && pool.length > 0
          ? { kind: "guitar", def: pool[Math.floor(Math.random() * pool.length)] }
          : winItem,
      );
    } else {
      const pool = EFFECTS_BY_RARITY[chosen] || EFFECTS_BY_RARITY["Common"] || [];
      strip.push(
        pool.length > 0
          ? { kind: "effect", def: pool[Math.floor(Math.random() * pool.length)] }
          : winItem,
      );
    }
  }

  return strip;
}
