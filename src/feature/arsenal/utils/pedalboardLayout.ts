import { EFFECTS_BY_ID } from "../data/effectDefinitions";
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
 * corner on a surface that always renders at a 16/7 aspect ratio.
 */

/** The board surface aspect (`aspectRatio: "16 / 7"` in both views). */
export const BOARD_W = 16;
export const BOARD_H = 7;

/** Every pedal shares this on-board height; its width follows the image. */
export const PEDAL_H_PCT = 42;

/** Aspect used for an image we have no size for (a typical single pedal). */
export const DEFAULT_ASPECT = 480 / 515;

export const widthPctForAspect = (aspect: number) =>
  PEDAL_H_PCT * (BOARD_H / BOARD_W) * aspect;

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

/** Keeps pedals off the case edge and clear of the two corner jacks. */
const EDGE_PCT = 3;

/** Breathing room left between pedals whenever the board places them itself. */
const GAP_PCT = 1.5;

/** Row tops — two rows of `PEDAL_H_PCT` is all a 16/7 board fits. */
export const ROW_Y_PCT = [5, 52];

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

const boxesOverlap = (a: LayoutBox, b: LayoutBox, gap: number) =>
  a.xPct < b.xPct + b.wPct + gap &&
  a.xPct + a.wPct + gap > b.xPct &&
  a.yPct < b.yPct + PEDAL_H_PCT &&
  a.yPct + PEDAL_H_PCT > b.yPct;

/**
 * Does `box` hit anything in `others`? `gap` is the clearance demanded on top
 * of the pedals' own footprints — zero when the player drags a pedal snug
 * against its neighbour, wider when the board picks a spot on its own.
 */
export const collidesWithAny = (box: LayoutBox, others: LayoutBox[], gap = 0) =>
  others.some((other) => boxesOverlap(box, other, gap));

const isOnBoard = (box: LayoutBox) =>
  box.xPct >= -EPSILON &&
  box.yPct >= -EPSILON &&
  box.xPct + box.wPct <= 100 + EPSILON &&
  box.yPct + PEDAL_H_PCT <= 100 + EPSILON;

/**
 * First spot in reading order where a `wPct`-wide pedal fits without touching
 * anything already on the board. `null` means the board is full.
 */
export const findFreeSpot = (
  occupied: LayoutBox[],
  wPct: number,
): { xPct: number; yPct: number } | null => {
  const maxX = 100 - EDGE_PCT - wPct;
  if (maxX < EDGE_PCT) return null;

  for (const yPct of ROW_Y_PCT) {
    for (let step = 0; ; step++) {
      const xPct = Math.min(EDGE_PCT + step * SCAN_STEP_PCT, maxX);
      if (!collidesWithAny({ xPct, yPct, wPct }, occupied, GAP_PCT)) {
        return { xPct, yPct };
      }
      if (xPct >= maxX) break;
    }
  }
  return null;
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
  slot: LayoutBox,
  wPct: number,
  others: LayoutBox[],
): { xPct: number; yPct: number } | null => {
  for (const align of SLOT_ALIGNMENTS) {
    const xPct = Math.max(
      0,
      Math.min(100 - wPct, slot.xPct + (slot.wPct - wPct) * align),
    );
    if (!collidesWithAny({ xPct, yPct: slot.yPct, wPct }, others)) {
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
  dragged: LayoutBox,
  others: BoardBox[],
): BoardBox | null => {
  const xPct = dragged.xPct + dragged.wPct / 2;
  const yPct = dragged.yPct + PEDAL_H_PCT / 2;
  return (
    others.find(
      (box) =>
        xPct >= box.xPct &&
        xPct <= box.xPct + box.wPct &&
        yPct >= box.yPct &&
        yPct <= box.yPct + PEDAL_H_PCT,
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
 * how the board is reordered: the signal runs in reading order, so exchanging
 * two pedals' places exchanges their places in the chain.
 *
 * Both halves have to land somewhere legal or nothing moves — `null` means the
 * pair cannot trade (a wide pedal and the narrow gap it was dragged onto), and
 * the drag carries on as an ordinary move.
 */
export const planSwap = (
  home: LayoutBox,
  target: BoardBox,
  others: LayoutBox[],
): SwapPlan | null => {
  const targetSpot = fitInSlot(home, target.wPct, others);
  if (!targetSpot) return null;

  const homeSpot = fitInSlot(target, home.wPct, [
    ...others,
    { ...targetSpot, wPct: target.wPct },
  ]);
  return homeSpot ? { target: targetSpot, home: homeSpot } : null;
};

/** Which row a stored `yPct` belongs to — used to read the board in order. */
export const rowIndexOf = (yPct: number) => {
  let closest = 0;
  for (let i = 1; i < ROW_Y_PCT.length; i++) {
    if (Math.abs(yPct - ROW_Y_PCT[i]) < Math.abs(yPct - ROW_Y_PCT[closest])) {
      closest = i;
    }
  }
  return closest;
};

/**
 * Row first, then left to right — the order the player reads the board in, and
 * with it the order the signal runs through it: the input jack sits at the top
 * left and the amp jack at the bottom right, so reading the board and tracing
 * the cable are the same act. `data/signalChain` judges the chain in this order,
 * which is why `tidyBoard` can straighten a board without ever rewiring it.
 */
export const inChainOrder = (items: PedalboardPlacement[]) =>
  [...items].sort(
    (a, b) => rowIndexOf(a.yPct) - rowIndexOf(b.yPct) || a.xPct - b.xPct,
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
    if (isOnBoard(box) && !collidesWithAny(box, kept)) {
      kept.push(box);
      placed.push(item);
    } else {
      loose.push(item);
    }
  }

  const overflow: PedalboardPlacement[] = [];
  for (const item of loose) {
    const wPct = widthOf(item.itemId);
    const spot = findFreeSpot(kept, wPct);
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
  ordered: PedalboardPlacement[],
  widthOf: WidthResolver,
): BoardLayout => {
  const placed: PedalboardPlacement[] = [];
  const overflow: PedalboardPlacement[] = [];
  let row = 0;
  let cursor = EDGE_PCT;

  for (const item of ordered) {
    const wPct = widthOf(item.itemId);
    if (cursor + wPct > 100 - EDGE_PCT) {
      row += 1;
      cursor = EDGE_PCT;
    }
    if (row >= ROW_Y_PCT.length || cursor + wPct > 100 - EDGE_PCT) {
      overflow.push(item);
      continue;
    }
    placed.push({ ...item, xPct: cursor, yPct: ROW_Y_PCT[row] });
    cursor += wPct + GAP_PCT;
  }

  return buildLayout(ordered, placed, overflow);
};

/** Repacks the whole board into rows without changing the signal order. */
export const tidyBoard = (
  items: PedalboardPlacement[],
  widthOf: WidthResolver,
): BoardLayout => packInOrder(inChainOrder(items), widthOf);

/**
 * Width lookup for a board, in the units `layoutBoard` and friends work in.
 * `measured` holds aspects read off images that have actually loaded; it wins
 * over the static table so a swapped-out image corrects itself.
 */
export const createWidthResolver = (
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

    const width = widthPctForAspect(aspect);
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

/** The ordinary enclosure: in on the left face, out on the right, half way up. */
export const SIDE_JACKS: EffectJackLayout = {
  edge: "side",
  in: { x: 0, y: DEFAULT_JACK_Y },
  out: { x: 1, y: DEFAULT_JACK_Y },
};

/** The side-mounted pair at the height this particular enclosure wears them. */
const sideJacksFor = (imageId?: number | string): EffectJackLayout => {
  const y = (imageId !== undefined && EFFECT_JACK_Y[imageId]) || DEFAULT_JACK_Y;
  return y === DEFAULT_JACK_Y
    ? SIDE_JACKS
    : { edge: "side", in: { x: 0, y }, out: { x: 1, y } };
};

/** Resolves a pedalboard placement to where its pedal's sockets are. */
export type JackResolver = (itemId: string) => EffectJackLayout;

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
