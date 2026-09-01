import type { SupplyTier } from "../data/rigHardware";
import { supplyTierOf } from "../data/rigHardware";
import type { Point } from "./cableGeometry";
import { routed, sagged, toView } from "./cableGeometry";
import type { BoardGeometry } from "./pedalboardLayout";

/**
 * Where the power brick stands, and how a DC cable gets from one of its outputs
 * to the pedal it feeds.
 *
 * The brick is mounted on its own rail in the case, above the deck, with all its
 * outputs along the underside — the way a supply is racked above a board rather
 * than squeezed between the rows of it. That buys three things at once: the
 * brick is a real object instead of a sliver, the channels between the rows stay
 * clear for cable to run in, and every output faces the same way, so no cable
 * ever has to go round the end of the thing to reach the row it feeds.
 *
 * The rail is drawn in its own space (`0 0 viewW RAIL_H`) and the deck in the
 * board's (`0 0 viewW viewH`), sharing an x axis and meeting edge to edge. So a
 * cable is drawn in two pieces — a stub down the rail, and the run itself inside
 * the deck — that join invisibly because both leave the same socket's x.
 *
 * The rest follows from where a pedal takes its power: the DC socket is on the
 * top edge of the enclosure, always, because that is where it is on nearly every
 * pedal ever built. The top row's inlets face the brick, so those runs are a
 * drop and a plug. Every row below it has to be reached past the rows above —
 * and a run does that through the gaps *between* enclosures rather than under
 * one, which is both what a person wiring a board does and the only way the run
 * is visible at all.
 *
 * Nothing here is fixed to one board or one brick. Both are bought (see
 * `data/rigHardware`), so the geometry is derived per rig by `railFor`: the
 * brick is as wide as it has outputs, the deck is as tall as it has rows, and a
 * run crosses however many rows stand between its socket and its pedal.
 */

/**
 * Height of the brick's rail, in the board's own view units — so the strip of
 * case it occupies keeps its proportions at every board size, exactly as the
 * deck below it does.
 */
export const RAIL_H = 8;

/** The brick's own body: how far down the rail it hangs, and how deep it is. */
const BRICK_Y = 0.8;
const BRICK_H = 4.9;

/**
 * Distance between two outputs on the brick's underside, in view units.
 *
 * The brick is *this times its output count* wide, rather than a fixed share of
 * the deck, because that is what a supply is: a row of holes in an extrusion. A
 * four-output brick on a big case really does look lost on it, and a twelve
 * spans nearly the whole of a small one — both of which are the truth about the
 * hardware, and both of which are the point of buying the next one.
 */
const SOCKET_PITCH = 10.5;

/** …but it can never be wider than the case it is racked in. */
const BRICK_MAX_SHARE = 0.92;

/** Radius of one DC output, sized to the bay it is recessed into. */
export const SOCKET_R = 0.72;

export interface PowerSocket {
  index: number;
  x: number;
  /** Down the rail, not down the board — the stub is drawn in rail space. */
  y: number;
}

export interface Brick {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface RailGeometry {
  geo: BoardGeometry;
  supply: SupplyTier;
  brick: Brick;
  /**
   * The outputs, in one row along the brick's underside.
   *
   * They all face the deck because every cable leaving them goes the same way:
   * down. Which row of pedals an output ends up feeding is decided by the cable,
   * not by the hole, so a board with every pedal in one row wires as tidily as
   * one spread over three.
   */
  sockets: PowerSocket[];
}

/**
 * The brick a rig owns, standing on the case it owns.
 *
 * Memoised on the pair, because both looms and the board itself read it every
 * render, and because a stable identity keeps the memos downstream honest.
 */
const railCache = new Map<string, RailGeometry>();

export const railFor = (
  geo: BoardGeometry,
  supply: SupplyTier,
): RailGeometry => {
  const key = `${geo.tier.id}:${supply.id}`;
  const cached = railCache.get(key);
  if (cached) return cached;

  const w = Math.min(
    supply.outputs * SOCKET_PITCH,
    geo.viewW * BRICK_MAX_SHARE,
  );
  const brick: Brick = {
    x: (geo.viewW - w) / 2,
    y: BRICK_Y,
    w,
    h: BRICK_H,
  };
  const rail: RailGeometry = {
    geo,
    supply,
    brick,
    sockets: Array.from({ length: supply.outputs }, (_, index) => ({
      index,
      x: brick.x + (brick.w * (index + 0.5)) / supply.outputs,
      y: brick.y + brick.h - 1.15,
    })),
  };
  railCache.set(key, rail);
  return rail;
};

/** The rail a stored supply-tier index means. */
export const railOf = (
  geo: BoardGeometry,
  storedTier?: number | null,
): RailGeometry => railFor(geo, supplyTierOf(storedTier));

/** How close to the board's own edge a riser may be put. */
const RAIL_EDGE = 1.6;

/** The gauge of a DC cable. Thin — it is not carrying the signal. */
export const DC_JACKET_W = 0.95;

/** DC cable turns tighter than an instrument lead, because it is thinner. */
const DC_BEND = 1.15;

/**
 * How far the moulded plug body stands out of the socket it is pushed into, and
 * how wide it is.
 *
 * Sized to be grabbed rather than to scale: a DC plug drawn true to a 9mm barrel
 * against a 60mm enclosure is three pixels of body on a phone, and a player
 * trying to pull one out is aiming at nothing. Bigger than life by about a
 * third, which is enough to have an edge to take hold of and still small enough
 * to read as the plumbing it is.
 */
export const DC_PLUG_REACH = 1.3;
export const DC_PLUG_HALF_W = 0.82;

/**
 * The brick's own end stands further out than the pedal's, because its socket is
 * sunk in a bay: a plug the pedal's length would spend most of itself inside the
 * overhang and read as a shadow. This one clears the underside.
 */
export const DC_BRICK_PLUG_REACH = 1.9;

/** The collar that seats against whatever the plug is pushed into. */
export const DC_COLLAR_H = 0.46;

/** The narrowest gap between two pedals a cable is routed down through. */
const RISER_MIN = 1.7;

/**
 * The lanes across the board's top margin, one per output.
 *
 * Cables sharing a single height would lie on top of each other wherever their
 * runs overlap, so they are split across two — enough to read as a loom rather
 * than as one thick cable, without spending the margin that the DC plugs
 * standing in it need. In view units off the deck's top edge, which is a real
 * distance and so the same on every case.
 */
export const topLaneFor = (socketIndex: number) =>
  1.15 + (socketIndex % 2) * 0.62;

/**
 * …and the same again down a channel, for the runs crossing to a lower row.
 *
 * `above` is the row the channel runs under, so a three-row board has two of
 * them and a run to the bottom row uses both.
 */
export const channelLaneFor = (
  geo: BoardGeometry,
  above: number,
  socketIndex: number,
) => {
  const bottom = ((geo.rowYPct[above] + geo.pedalHPct) / 100) * geo.viewH;
  const top = (geo.rowYPct[above + 1] / 100) * geo.viewH;
  return (bottom + top) / 2 - 0.35 + (socketIndex % 2) * 0.7;
};

export interface DcTarget {
  itemId: string;
  /** Which row of the board the pedal stands in. */
  row: number;
  /** The DC socket on its top edge. */
  jack: Point;
  /** The pedal's own edges, so its own box can be left out of a gap search. */
  left: number;
  right: number;
}

/** A pedal box a cable has to get past, in board units. */
export interface RowSpan {
  left: number;
  right: number;
}

/**
 * The gap in a row of pedals a cable should be threaded down, nearest to `near`.
 *
 * A cable run under a pedal is a cable nobody can see, and half the point of
 * drawing the loom is that the player can follow it. So the run takes the gap:
 * between two enclosures, or between the outer one and the board's own rail. A
 * row packed tight enough to have no gap at all gets the run straight down
 * `near`, where it is at least hidden under the artwork rather than across it.
 */
export const riserFor = (
  geo: BoardGeometry,
  spans: RowSpan[],
  near: number,
): number => {
  const gaps: { at: number; width: number }[] = [];
  let cursor = RAIL_EDGE;

  for (const span of [...spans].sort((a, b) => a.left - b.left)) {
    const width = span.left - cursor;
    if (width >= RISER_MIN) gaps.push({ at: (cursor + span.left) / 2, width });
    cursor = Math.max(cursor, span.right);
  }
  const tail = geo.viewW - RAIL_EDGE - cursor;
  if (tail >= RISER_MIN) {
    gaps.push({ at: (cursor + geo.viewW - RAIL_EDGE) / 2, width: tail });
  }

  if (gaps.length === 0) return near;
  return gaps.reduce((best, gap) =>
    Math.abs(gap.at - near) < Math.abs(best.at - near) ? gap : best,
  ).at;
};

/**
 * A riser for every row a run to `row` has to cross, nearest to the pedal it is
 * heading for. Empty for the top row, which is reached by dropping straight onto
 * it.
 */
export const risersFor = (
  geo: BoardGeometry,
  rowSpans: Record<number, RowSpan[]>,
  row: number,
  near: number,
): number[] =>
  Array.from({ length: row }, (_, above) =>
    riserFor(geo, rowSpans[above] ?? [], near),
  );

/**
 * The stub between an output and the deck's top edge, in rail units.
 *
 * Dead straight, and the only piece of the loom drawn outside the board: it is
 * the bit of cable hanging out of the brick before the run proper takes over on
 * the other side of the seam.
 *
 * It starts at the back of the plug rather than at the socket, because there is
 * a plug in the way: cable leaves the moulded body, not the hole.
 */
export const socketStub = (socket: PowerSocket): string =>
  `M ${socket.x.toFixed(2)} ${(socket.y + DC_BRICK_PLUG_REACH).toFixed(2)} L ${socket.x.toFixed(2)} ${RAIL_H}`;

/**
 * The run itself, deck edge to DC jack, in board units.
 *
 * One shape, walked once per row the cable has to get past. It drops out of the
 * brick into the top margin, and then, for every row standing between it and its
 * pedal, runs along to that row's gap and drops through it into the channel
 * below. The last leg is the same in every case: along the lane it has arrived
 * in, and down into the plug.
 *
 * So a top-row pedal is a drop and a plug, a second-row pedal threads one gap,
 * and a bottom-row pedal on the big case threads two — without any of the three
 * being a special case in the code.
 */
export const powerRun = (
  rail: RailGeometry,
  socket: PowerSocket,
  target: DcTarget,
  risers: number[],
): string => {
  const { geo } = rail;
  const lane = topLaneFor(socket.index);
  const points: Point[] = [
    { x: socket.x, y: 0 },
    { x: socket.x, y: lane },
  ];

  let here: Point = { x: socket.x, y: lane };
  for (let above = 0; above < target.row; above++) {
    // A row with no gap at all hands back the pedal's own x, which at least
    // hides the drop under the artwork instead of ruling it across the face.
    const riser = risers[above] ?? target.jack.x;
    const channel = channelLaneFor(geo, above, socket.index);
    points.push(
      // The one leg long enough to hang under its own weight is the one that
      // gets a sag. A cable crossing a board never lies flat.
      ...sagged(here, { x: riser, y: here.y }, 0.3).slice(1),
      { x: riser, y: channel },
    );
    here = { x: riser, y: channel };
  }

  points.push(
    ...sagged(here, { x: target.jack.x, y: here.y }, 0.28).slice(1),
    target.jack,
  );

  return routed(points, DC_BEND);
};

/**
 * The cable hanging off the brick while the player is still deciding where it
 * goes. It droops between the deck's edge and the cursor rather than running
 * straight to it — a lead held in the hand has weight, and a rubber band does
 * not.
 */
export const dragRun = (from: Point, to: Point): string => {
  const span = Math.hypot(to.x - from.x, to.y - from.y);
  const droop = Math.min(9, 2 + span * 0.16);
  return routed(
    [from, { x: (from.x + to.x) / 2, y: Math.max(from.y, to.y) + droop }, to],
    6,
  );
};

/** The DC jack of a boarded pedal, in board units. */
export const dcJackAt = (
  geo: BoardGeometry,
  xPct: number,
  yPct: number,
  wPct: number,
  jack: { x: number; y: number },
): Point =>
  toView(geo, xPct + wPct * jack.x, yPct + geo.pedalHPct * jack.y);

/**
 * The height of the strip the rail occupies, as a share of the deck's width —
 * what the board's own container reserves above the surface.
 *
 * The rail is in view units and the deck is ten of those to the board unit, so
 * this keeps the brick the same real size against the pedals it feeds, whatever
 * case they are standing on.
 */
export const railPaddingPct = (geo: BoardGeometry) =>
  (RAIL_H / geo.viewW) * 100;

