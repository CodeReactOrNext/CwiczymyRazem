import { EFFECTS_BY_ID } from "../data/effectDefinitions";
import type { BoardTier } from "../data/rigHardware";
import { boardTierOf } from "../data/rigHardware";
import type {
  EffectInventoryItem,
  EffectJackLayout,
  PedalboardPlacement,
} from "../types/arsenal.types";

/**
 * Geometry of the pedalboard, shared by the editable board (Rig) and the
 * read-only one on a public profile, so a pedal lands in the same spot in both.
 *
 * Everything is in board percentages: `xPct`/`yPct` are a pedal's top-left
 * corner on the surface, whatever size that surface is.
 *
 * Percentages, and not units, because that is what is stored: a board saved on
 * one case and reopened on another keeps its proportions rather than its inches.
 * What changes with the case is the *scale* — a pedal is a fixed number of board
 * units tall (`PEDAL_H`) whatever it stands on, so a wider case turns that into
 * a smaller percentage, and more pedals fit. Which is the whole mechanic: the
 * pedals never shrink, the case grows around them.
 *
 * So nothing here is a constant any more. Every measurement is derived from the
 * case the player owns, by `geometryFor`, and handed to the functions that need
 * it. See `data/rigHardware` for the ladder itself.
 */

/**
 * A pedal's own height, in board units. The one fixed dimension in the system —
 * every other number here is measured against it.
 *
 * Its value is the one the original single board was drawn at (42% of a 16 × 7
 * deck), so the bottom rung of the case ladder renders pixel for pixel the board
 * everybody already had before the ladder existed.
 */
export const PEDAL_H = 2.94;

/** Case edge to first pedal, and the strip left above and below each row. */
const EDGE = 0.48;
const MARGIN_Y = 0.385;

/** The channel between two rows: where the cable to the row below runs. */
const ROW_GAP = 0.35;

/** Breathing room left between two pedals whenever the board places them. */
const GAP = 0.24;

export interface BoardGeometry {
  tier: BoardTier;
  /** The deck, in board units. */
  w: number;
  h: number;
  rows: number;
  /** …and in the units both looms draw in (`utils/cableGeometry`). */
  viewW: number;
  viewH: number;
  /** A pedal's height as a share of this deck — its width follows the image. */
  pedalHPct: number;
  /** The top of each row, in board percent. */
  rowYPct: number[];
  edgePct: number;
  gapPct: number;
}

/**
 * The deck a case gives you, worked out from the one fixed dimension.
 *
 * Memoised on the tier, because this is read on every render of the board and
 * every one of its cables, and because a stable object identity is what keeps
 * the `useMemo`s downstream from re-running for a board that has not changed.
 */
const geometryCache = new Map<number, BoardGeometry>();

export const geometryFor = (tier: BoardTier): BoardGeometry => {
  const cached = geometryCache.get(tier.id);
  if (cached) return cached;

  const h = MARGIN_Y * 2 + tier.rows * PEDAL_H + (tier.rows - 1) * ROW_GAP;
  const geometry: BoardGeometry = {
    tier,
    w: tier.w,
    h,
    rows: tier.rows,
    viewW: tier.w * 10,
    viewH: h * 10,
    pedalHPct: (PEDAL_H / h) * 100,
    rowYPct: Array.from(
      { length: tier.rows },
      (_, row) => ((MARGIN_Y + row * (PEDAL_H + ROW_GAP)) / h) * 100,
    ),
    edgePct: (EDGE / tier.w) * 100,
    gapPct: (GAP / tier.w) * 100,
  };
  geometryCache.set(tier.id, geometry);
  return geometry;
};

/** The deck a stored tier index means. The entry point for everything else. */
export const geometryOf = (storedTier?: number | null): BoardGeometry =>
  geometryFor(boardTierOf(storedTier));

/** Aspect used for an image we have no size for (a typical single pedal). */
export const DEFAULT_ASPECT = 480 / 515;

/**
 * What a pedal of this aspect takes across the deck, in board percent.
 *
 * Its real width is `PEDAL_H * aspect` whatever it stands on, so the share of
 * the board it eats is that over the deck's width — the same pedal on a wider
 * case is the same pedal, drawn smaller.
 */
export const widthPctForAspect = (geo: BoardGeometry, aspect: number) =>
  ((PEDAL_H * aspect) / geo.w) * 100;

/**
 * Intrinsic width/height of every pedal image in
 * `public/static/images/effects`. Knowing the aspect up front — instead of
 * waiting for `img.onLoad` — lets the board place pedals without overlap on
 * the very first render. Images that report a different natural size once
 * loaded win over this table, and an image missing from it falls back to
 * `DEFAULT_ASPECT`.
 */
export const EFFECT_IMAGE_ASPECT: Record<number | string, number> = {
  1: 409 / 510,
  2: 410 / 511,
  3: 408 / 544,
  4: 408 / 544,
  5: 416 / 552,
  6: 413 / 515,
  7: 263 / 439,
  8: 264 / 447,
  9: 264 / 437,
  10: 480 / 515,
  11: 777 / 515,
  12: 777 / 515,
  13: 781 / 515,
  14: 776 / 515,
  15: 462 / 515,
  16: 264 / 447,
  17: 264 / 447,
  18: 326 / 535,
  19: 326 / 535,
  20: 326 / 535,
  21: 319 / 535,
  22: 414 / 544,
  23: 414 / 544,
  24: 414 / 544,
  25: 462 / 503,
  26: 462 / 515,
  27: 263 / 440,
};

/** How finely `findFreeSpot` walks a row looking for a gap. */
const SCAN_STEP_PCT = 0.5;

/** Positions that differ by less than this are the same position. */
const EPSILON = 0.01;

export interface LayoutBox {
  xPct: number;
  yPct: number;
  wPct: number;
}

/** Resolves a pedalboard placement to the width its pedal takes on the board. */
export type WidthResolver = (itemId: string) => number;

const boxesOverlap = (
  geo: BoardGeometry,
  a: LayoutBox,
  b: LayoutBox,
  gap: number,
) =>
  a.xPct < b.xPct + b.wPct + gap &&
  a.xPct + a.wPct + gap > b.xPct &&
  a.yPct < b.yPct + geo.pedalHPct &&
  a.yPct + geo.pedalHPct > b.yPct;

/**
 * Does `box` hit anything in `others`? `gap` is the clearance demanded on top
 * of the pedals' own footprints — zero when the player drags a pedal snug
 * against its neighbour, wider when the board picks a spot on its own.
 */
export const collidesWithAny = (
  geo: BoardGeometry,
  box: LayoutBox,
  others: LayoutBox[],
  gap = 0,
) => others.some((other) => boxesOverlap(geo, box, other, gap));

const isOnBoard = (geo: BoardGeometry, box: LayoutBox) =>
  box.xPct >= -EPSILON &&
  box.yPct >= -EPSILON &&
  box.xPct + box.wPct <= 100 + EPSILON &&
  box.yPct + geo.pedalHPct <= 100 + EPSILON;

/**
 * First spot in signal order where a `wPct`-wide pedal fits without touching
 * anything already on the board. The signal runs right to left, so the scan
 * starts hard against the input jack's own corner and walks towards the amp.
 * `null` means the board is full.
 */
export const findFreeSpot = (
  geo: BoardGeometry,
  occupied: LayoutBox[],
  wPct: number,
): { xPct: number; yPct: number } | null => {
  const startX = 100 - geo.edgePct - wPct;
  if (startX < geo.edgePct) return null;

  for (const yPct of geo.rowYPct) {
    for (let step = 0; ; step++) {
      const xPct = Math.max(startX - step * SCAN_STEP_PCT, geo.edgePct);
      if (!collidesWithAny(geo, { xPct, yPct, wPct }, occupied, geo.gapPct)) {
        return { xPct, yPct };
      }
      if (xPct <= geo.edgePct) break;
    }
  }
  return null;
};

/**
 * How many ordinary pedals a case holds, packed as tight as the board itself
 * would pack them.
 *
 * Counted by actually filling the thing rather than by dividing one number by
 * another, so the figure on the shop card is the figure the board will honour —
 * including the half-pedal of edge it will not use. Ordinary meaning
 * `DEFAULT_ASPECT`: a board of wide enclosures holds fewer, and the card says
 * "about", because it is a guide and not a promise.
 *
 * Cached per tier: the fill is cheap but not free, and the shop asks for all
 * every rung on every render.
 */
const slotCache = new Map<number, number>();

export const slotEstimate = (geo: BoardGeometry): number => {
  const cached = slotCache.get(geo.tier.id);
  if (cached !== undefined) return cached;

  const wPct = widthPctForAspect(geo, DEFAULT_ASPECT);
  const occupied: LayoutBox[] = [];
  for (;;) {
    const spot = findFreeSpot(geo, occupied, wPct);
    if (!spot) break;
    occupied.push({ ...spot, wPct });
  }
  slotCache.set(geo.tier.id, occupied.length);
  return occupied.length;
};

/** A box that knows whose it is — what trading two pedals over has to name. */
export interface BoardBox extends LayoutBox {
  itemId: string;
}

/** Alignments a pedal is tried at inside a slot: flush left, centred, flush right. */
const SLOT_ALIGNMENTS = [0, 0.5, 1];

/**
 * Where a `wPct`-wide pedal stands in a slot another pedal is vacating. The
 * two are rarely the same width, so the slot is a region rather than a
 * position: the pedal is tried flush left, centred and flush right, and takes
 * the first of those that clears the rest of the board. `null` when a wider
 * pedal simply cannot be squeezed into a narrower neighbour's place.
 */
const fitInSlot = (
  geo: BoardGeometry,
  slot: LayoutBox,
  wPct: number,
  others: LayoutBox[],
): { xPct: number; yPct: number } | null => {
  for (const align of SLOT_ALIGNMENTS) {
    const xPct = Math.max(
      0,
      Math.min(100 - wPct, slot.xPct + (slot.wPct - wPct) * align),
    );
    if (!collidesWithAny(geo, { xPct, yPct: slot.yPct, wPct }, others)) {
      return { xPct, yPct: slot.yPct };
    }
  }
  return null;
};

/**
 * The pedal a dragged one is standing on: the one its centre has crossed into.
 *
 * Centre-crossing rather than first touch is what makes carrying a pedal over
 * its neighbour feel deliberate — the two only trade places once the dragged
 * pedal has really covered the other one.
 */
export const findSwapTarget = (
  geo: BoardGeometry,
  dragged: LayoutBox,
  others: BoardBox[],
): BoardBox | null => {
  const xPct = dragged.xPct + dragged.wPct / 2;
  const yPct = dragged.yPct + geo.pedalHPct / 2;
  return (
    others.find(
      (box) =>
        xPct >= box.xPct &&
        xPct <= box.xPct + box.wPct &&
        yPct >= box.yPct &&
        yPct <= box.yPct + geo.pedalHPct,
    ) ?? null
  );
};

export interface SwapPlan {
  /** Where the pedal being traded with moves to. */
  target: { xPct: number; yPct: number };
  /** The slot the dragged pedal now owns, and drops into when it is let go. */
  home: { xPct: number; yPct: number };
}

/**
 * Trades the slot a dragged pedal owns for the one it is standing on, which is
 * how the board is reordered: the signal runs row by row from the right, so
 * exchanging two pedals' places exchanges their places in the chain.
 *
 * Both halves have to land somewhere legal or nothing moves — `null` means the
 * pair cannot trade (a wide pedal and the narrow gap it was dragged onto), and
 * the drag carries on as an ordinary move.
 */
export const planSwap = (
  geo: BoardGeometry,
  home: LayoutBox,
  target: BoardBox,
  others: LayoutBox[],
): SwapPlan | null => {
  const targetSpot = fitInSlot(geo, home, target.wPct, others);
  if (!targetSpot) return null;

  const homeSpot = fitInSlot(geo, target, home.wPct, [
    ...others,
    { ...targetSpot, wPct: target.wPct },
  ]);
  return homeSpot ? { target: targetSpot, home: homeSpot } : null;
};

/** Which row a stored `yPct` belongs to — used to read the board in order. */
export const rowIndexOf = (geo: BoardGeometry, yPct: number) => {
  let closest = 0;
  for (let i = 1; i < geo.rowYPct.length; i++) {
    if (
      Math.abs(yPct - geo.rowYPct[i]) < Math.abs(yPct - geo.rowYPct[closest])
    ) {
      closest = i;
    }
  }
  return closest;
};

/**
 * Row first, then right to left — the order the signal runs through the board,
 * which is the order a real one is wired in: a pedal takes its input on its
 * right face and hands its output out of its left, so a chain built out of them
 * travels leftwards. The input jack sits at the top right and the amp jack at
 * the bottom left, so tracing the cable and following the chain are the same
 * act. `data/signalChain` judges the chain in this order, which is why
 * `tidyBoard` can straighten a board without ever rewiring it.
 */
export const inChainOrder = (
  geo: BoardGeometry,
  items: PedalboardPlacement[],
) =>
  [...items].sort(
    (a, b) =>
      rowIndexOf(geo, a.yPct) - rowIndexOf(geo, b.yPct) || b.xPct - a.xPct,
  );

export interface BoardLayout {
  /** Pedals that fit, with the positions they should render at. */
  placed: PedalboardPlacement[];
  /** Pedals the board has no room for — nothing is ever dropped silently. */
  overflow: PedalboardPlacement[];
  /** True when `placed` moved anything, i.e. the layout is worth saving. */
  changed: boolean;
}

const buildLayout = (
  original: PedalboardPlacement[],
  placed: PedalboardPlacement[],
  overflow: PedalboardPlacement[],
): BoardLayout => {
  const byId = new Map(original.map((item) => [item.itemId, item]));
  const changed = placed.some((item) => {
    const before = byId.get(item.itemId);
    return (
      !before ||
      Math.abs(before.xPct - item.xPct) > EPSILON ||
      Math.abs(before.yPct - item.yPct) > EPSILON
    );
  });
  return { placed, overflow, changed };
};

/**
 * Takes the stored board and returns one where no two pedals overlap.
 *
 * Pedals sitting on a free spot keep it — free placement is the point of the
 * board. Only the ones landing on top of a neighbour (or hanging off the
 * surface) get moved to the first free spot, and anything the board has no
 * room for at all comes back as `overflow` rather than being thrown away.
 */
export const layoutBoard = (
  geo: BoardGeometry,
  items: PedalboardPlacement[],
  widthOf: WidthResolver,
): BoardLayout => {
  const kept: LayoutBox[] = [];
  const placed: PedalboardPlacement[] = [];
  const loose: PedalboardPlacement[] = [];

  for (const item of items) {
    const box = {
      xPct: item.xPct,
      yPct: item.yPct,
      wPct: widthOf(item.itemId),
    };
    if (isOnBoard(geo, box) && !collidesWithAny(geo, box, kept)) {
      kept.push(box);
      placed.push(item);
    } else {
      loose.push(item);
    }
  }

  const overflow: PedalboardPlacement[] = [];
  for (const item of loose) {
    const wPct = widthOf(item.itemId);
    const spot = findFreeSpot(geo, kept, wPct);
    if (!spot) {
      overflow.push(item);
      continue;
    }
    kept.push({ ...spot, wPct });
    placed.push({ ...item, ...spot });
  }

  return buildLayout(items, placed, overflow);
};

/**
 * Packs the board into rows in exactly the order it is handed, so the caller
 * owns the ordering decision: `tidyBoard` keeps the order the pedals are already
 * read in, while "Wire It Up" hands over a chain-sorted list and gets the same
 * neat rows out. Pedals past the last row come back as `overflow`.
 */
export const packInOrder = (
  geo: BoardGeometry,
  ordered: PedalboardPlacement[],
  widthOf: WidthResolver,
): BoardLayout => {
  const placed: PedalboardPlacement[] = [];
  const overflow: PedalboardPlacement[] = [];
  let row = 0;
  // The cursor is the right-hand edge of the next pedal, because the chain
  // starts at the input jack in the top right and each pedal is laid down to
  // the left of the one before it.
  let cursor = 100 - geo.edgePct;

  for (const item of ordered) {
    const wPct = widthOf(item.itemId);
    if (cursor - wPct < geo.edgePct) {
      row += 1;
      cursor = 100 - geo.edgePct;
    }
    if (row >= geo.rowYPct.length || cursor - wPct < geo.edgePct) {
      overflow.push(item);
      continue;
    }
    placed.push({ ...item, xPct: cursor - wPct, yPct: geo.rowYPct[row] });
    cursor -= wPct + geo.gapPct;
  }

  return buildLayout(ordered, placed, overflow);
};

/** Repacks the whole board into rows without changing the signal order. */
export const tidyBoard = (
  geo: BoardGeometry,
  items: PedalboardPlacement[],
  widthOf: WidthResolver,
): BoardLayout => packInOrder(geo, inChainOrder(geo, items), widthOf);

/**
 * Width lookup for a board, in the units `layoutBoard` and friends work in.
 * `measured` holds aspects read off images that have actually loaded; it wins
 * over the static table so a swapped-out image corrects itself.
 */
export const createWidthResolver = (
  geo: BoardGeometry,
  effectInventory: EffectInventoryItem[],
  measured: Record<number | string, number> = {},
): WidthResolver => {
  const cache = new Map<string, number>();
  return (itemId: string) => {
    const cached = cache.get(itemId);
    if (cached !== undefined) return cached;

    const invItem = effectInventory.find((e) => e.id === itemId);
    const effect = invItem ? EFFECTS_BY_ID.get(invItem.effectId) : null;
    const aspect = effect
      ? (measured[effect.imageId] ??
        EFFECT_IMAGE_ASPECT[effect.imageId] ??
        DEFAULT_ASPECT)
      : DEFAULT_ASPECT;

    const width = widthPctForAspect(geo, aspect);
    cache.set(itemId, width);
    return width;
  };
};

/** Where a socket sits down an enclosure's side when nothing better is known. */
const DEFAULT_JACK_Y = 0.5;

/**
 * How far down each enclosure's sides its signal sockets are, as a fraction of
 * the pedal's height.
 *
 * Measured off the artwork rather than eyeballed: a quarter-inch socket is the
 * widest thing on nearly every one of these enclosures, so the rows where an
 * image's silhouette reaches furthest out are the rows its sockets are drawn
 * on — the same trick a trim tool uses, run one row at a time. Half way up,
 * which is what the board assumed before, is right for almost none of them: the
 * compact enclosures carry theirs around `0.43`, a good plug's width above
 * where a cable used to meet them.
 *
 * Only side-mounted pedals are listed. Top-mounted ones carry their own `jacks`
 * on the definition, and an image missing from here falls back to half way up.
 */
export const EFFECT_JACK_Y: Record<number | string, number> = {
  1: 0.532,
  2: 0.534,
  3: 0.506,
  4: 0.506,
  5: 0.495,
  6: 0.53,
  7: 0.474,
  8: 0.486,
  9: 0.475,
  16: 0.472,
  17: 0.472,
  18: 0.432,
  19: 0.443,
  20: 0.444,
  21: 0.442,
  22: 0.507,
  23: 0.507,
  24: 0.507,
  27: 0.486,
};

/**
 * The ordinary enclosure: in on the right face, out on the left, half way up.
 *
 * That is the way the sockets are printed on the artwork — the enclosures that
 * label theirs at all say `OUTPUT` down the left side — and the way a real
 * pedal is built, which is why a board is wired right to left rather than the
 * way it is read.
 */
export const SIDE_JACKS: EffectJackLayout = {
  edge: "side",
  in: { x: 1, y: DEFAULT_JACK_Y },
  out: { x: 0, y: DEFAULT_JACK_Y },
};

/** The side-mounted pair at the height this particular enclosure wears them. */
const sideJacksFor = (imageId?: number | string): EffectJackLayout => {
  const y = (imageId !== undefined && EFFECT_JACK_Y[imageId]) || DEFAULT_JACK_Y;
  return y === DEFAULT_JACK_Y
    ? SIDE_JACKS
    : { edge: "side", in: { x: 1, y }, out: { x: 0, y } };
};

/** Resolves a pedalboard placement to where its pedal's sockets are. */
export type JackResolver = (itemId: string) => EffectJackLayout;

/** …and to where its power goes in. */
export type DcResolver = (itemId: string) => { x: number; y: number };

/**
 * Where a pedal's DC inlet sits on its own box, as a fraction of it: the middle
 * of the top edge, which is where nearly every pedal ever built takes its power.
 */
export const DEFAULT_DC_JACK = { x: 0.5, y: 0 };

/**
 * DC inlet lookup for a board. The middle of the top edge unless the pedal's own
 * jack layout says otherwise, because that is where a pedal takes its power —
 * see `utils/powerLayout` for what the cable does with it.
 */
export const createDcResolver = (jacksOf: JackResolver): DcResolver => {
  const cache = new Map<string, { x: number; y: number }>();
  return (itemId: string) => {
    const cached = cache.get(itemId);
    if (cached !== undefined) return cached;

    const dc = jacksOf(itemId).dc ?? DEFAULT_DC_JACK;
    cache.set(itemId, dc);
    return dc;
  };
};

/**
 * Socket lookup for a board, the companion to `createWidthResolver`. A pedal
 * whose definition says nothing about its jacks gets the side-mounted pair,
 * which is what all but a handful of the enclosures actually have — at the
 * height `EFFECT_JACK_Y` measured off its own artwork.
 */
export const createJackResolver = (
  effectInventory: EffectInventoryItem[],
): JackResolver => {
  const cache = new Map<string, EffectJackLayout>();
  return (itemId: string) => {
    const cached = cache.get(itemId);
    if (cached !== undefined) return cached;

    const invItem = effectInventory.find((e) => e.id === itemId);
    const effect = invItem ? EFFECTS_BY_ID.get(invItem.effectId) : null;
    const jacks = effect?.jacks ?? sideJacksFor(effect?.imageId);
    cache.set(itemId, jacks);
    return jacks;
  };
};
