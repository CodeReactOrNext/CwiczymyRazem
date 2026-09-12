import { EFFECT_FEATURES } from "../data/effectStats";
import { GUITAR_FEATURES } from "../data/itemStats";
import type { WorkshopKind } from "../types/arsenal.types";

/** Where on the render a connector lands, as fractions of the *visible* picture. */
export interface ModAnchor {
  x: number;
  y: number;
}

export type SocketSide = "left" | "right";

/** One fitted mod placed on the bench diagram. */
export interface ModSocketLayout {
  modId: string;
  side: SocketSide;
  anchor: ModAnchor;
}

/**
 * Where each stat category physically lives on the picture: how far down the
 * visible picture, and how far out from its centre line a connector should
 * stop so it meets the part's edge instead of running into the middle.
 *
 * A stood-up guitar runs down the middle of the box: neck in the top third and
 * narrow, pickups over the body's centre, bridge and hardware below. A pedal is
 * drawn upright and wide: knobs up top, the footswitch at the bottom, the
 * sockets on its flanks.
 */
interface CategorySpot {
  y: number;
  /** Half-width of the part at that height, as a fraction of the picture's width (0–0.5). */
  halfWidth: number;
}

const GUITAR_SPOTS: Record<string, CategorySpot> = {
  playFeeling: { y: 0.3, halfWidth: 0.1 },
  pickups: { y: 0.6, halfWidth: 0.36 },
  sustain: { y: 0.74, halfWidth: 0.32 },
};

const EFFECT_SPOTS: Record<string, CategorySpot> = {
  tone: { y: 0.3, halfWidth: 0.42 },
  versatility: { y: 0.5, halfWidth: 0.46 },
  headroom: { y: 0.72, halfWidth: 0.4 },
};

const FALLBACK: CategorySpot = { y: 0.5, halfWidth: 0.3 };

/** Two mods on the same part step down the picture instead of stacking. */
const SIBLING_STEP = 0.06;

/** The stat category a fitted mod belongs to, or undefined for an unknown id. */
export const getModCategory = (
  kind: WorkshopKind,
  modId: string,
): string | undefined =>
  kind === "guitar"
    ? GUITAR_FEATURES.find((f) => f.id === modId)?.category
    : EFFECT_FEATURES.find((f) => f.id === modId)?.category;

/**
 * Lays the fitted mods out around the instrument.
 *
 * Mods are ordered by where they land on the picture, top to bottom, then
 * dealt alternately to the left and right columns. Both columns therefore run
 * top to bottom in the same order as their anchors, which is what keeps the
 * connectors from ever crossing — the one thing a fan of lines from a single
 * column could not promise. Siblings of one category step down the part so no
 * two connectors share a pixel, and each connector stops at the part's edge on
 * its own side.
 */
export const layoutModSockets = (
  kind: WorkshopKind,
  modIds: readonly string[],
): ModSocketLayout[] => {
  const table = kind === "guitar" ? GUITAR_SPOTS : EFFECT_SPOTS;
  const seen = new Map<string, number>();
  const spots = modIds.map((modId) => {
    const category = getModCategory(kind, modId) ?? "unknown";
    const nth = seen.get(category) ?? 0;
    seen.set(category, nth + 1);
    const base = table[category] ?? FALLBACK;
    return { modId, y: base.y + nth * SIBLING_STEP, halfWidth: base.halfWidth };
  });

  return spots
    .map((spot, index) => ({ spot, index }))
    .sort((a, b) => a.spot.y - b.spot.y || a.index - b.index)
    .map(({ spot }, rank) => {
      const side: SocketSide = rank % 2 === 0 ? "left" : "right";
      const x = side === "left" ? 0.5 - spot.halfWidth : 0.5 + spot.halfWidth;
      return { modId: spot.modId, side, anchor: { x, y: spot.y } };
    });
};
