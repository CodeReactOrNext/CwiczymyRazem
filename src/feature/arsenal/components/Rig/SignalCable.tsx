import type { ChainVerdict } from "feature/arsenal/data/signalChain";
import { motion, useReducedMotion } from "framer-motion";
import { useId } from "react";

import type { Point } from "../../utils/cableGeometry";
import { at, routed as bent, toView } from "../../utils/cableGeometry";
import type { BoardGeometry, JackResolver } from "../../utils/pedalboardLayout";
import { rowIndexOf, SIDE_JACKS } from "../../utils/pedalboardLayout";

/**
 * The patch cable, drawn.
 *
 * The whole point of the signal-path system is that a player should not have to
 * read a number to know whether the board is wired properly — they should see
 * it. So the cable is a real object on the surface: it comes onto the deck from
 * the guitar, runs into the right side of the first pedal, out of its left side,
 * and on off the deck to the amp, sagging between pedals and taking the long way
 * round when it has to change row. Right to left, because that is the side of
 * the enclosure each socket is actually printed on.
 *
 * Every run is coloured on its own. A cable into the pedal that belongs next
 * glows emerald; one running backwards through the chain is red, which is what
 * makes a bad board legible at a glance rather than only after reading the tip.
 * When nothing is backwards the whole cable carries a travelling pulse — the
 * reward for getting it right, and the reason the panel above can stay quiet
 * about it.
 *
 * Drawn in the board's own units — see `utils/cableGeometry`, and note that the
 * svg's viewBox has to be the case's, or the whole loom lands in a corner of it
 * at the wrong scale with every path still perfectly correct — so stroke widths
 * stay even instead of stretching with the board, and behind the pedals
 * (`z-index: 1` against their 2) so the cable disappears under each enclosure
 * the way it would on a real board.
 */

/**
 * There is nothing at either end of the board to plug into. The guitar's own
 * lead runs onto the deck over the top edge, straight into the first pedal, and
 * the last pedal's lead runs off it over the bottom edge to the amp — which is
 * what the ends of a real board look like from above, and why neither end is
 * drawn as a socket: a jack seen from the top with a cable going into it
 * sideways is a hole, not a connection.
 *
 * So each end is a run that leaves the picture. `OFF_BOARD` is how far past
 * the deck's edge it is drawn — beyond the clip, so the round cap never shows —
 * and `FADE` is the stretch of run, measured back in from that edge, over
 * which the whole of it (shadow, glow, jacket and pulse) thins out to nothing.
 * Long enough to read as a cable going somewhere rather than a cable cut off.
 */
const OFF_BOARD = 6;
const FADE = 11;

/** How close to the case edge a cable is routed when it runs down the side. */
const EDGE_LANE = 2.2;

/** How far past a pedal's jack a cable carries on before it turns. */
const TURN = 7;

/** The radius every corner of a routed run is bent to. Cable, not wire. */
const BEND = 3.2;

/**
 * How far above a pedal a cable off its top edge runs before it turns.
 *
 * It has to clear the plug standing in that socket, not just the enclosure —
 * a lane closer than the plug is tall puts the run straight through the boot
 * it is supposed to be leaving.
 */
const TOP_LANE = 2.4;

/**
 * The gauge of the whole loom: jacket, boot and handle, in that order.
 *
 * They have to stack the way they do on a real lead — the handle fatter than
 * the boot, the boot fatter than the jacket it grips — or the cable reads as
 * bulging out of a strain relief too narrow to hold it, which is what happens
 * when each part is sized on its own. The handle is also kept near the size of
 * the socket it goes into: `EFFECT_JACK_Y`'s own measurements put those between
 * 1.65 and 2.35 units across, and a plug half again as fat as its hole looks
 * pushed against the pedal rather than into it.
 */
const JACKET_W = 1.9;
const BOOT_H = 2.15;
const HANDLE_H = 2.75;

/** How far a plug stands out of its socket: tip to the back of the boot. */
const PLUG_REACH = 2.65;

/** The shortest one can be cut back to and still read as a quarter-inch plug. */
const MIN_PLUG_REACH = 1.9;

/** Cable left showing between two plugs facing each other across a gap. */
const PLUG_BREATH = 1.5;

/**
 * Gap below which two facing plugs stop being drawable as two plugs.
 *
 * A facing pair share the gap between their enclosures — half each, less the
 * `PLUG_BREATH` of cable that has to stay showing between them, or the two read
 * as one grey lump bridging the pedals rather than as two plugs on a lead.
 * Below `MIN_PLUG_REACH` apiece there is nothing left to cut, and the pair
 * becomes a single rigid coupler instead, which is what a real board packed
 * this tightly uses anyway.
 */
const COUPLER_MAX = MIN_PLUG_REACH * 2 + PLUG_BREATH;

/** A plug's share of the gap it stands in, never longer than a real one. */
const reachInGap = (gap: number) =>
  Math.max(MIN_PLUG_REACH, Math.min(PLUG_REACH, (gap - PLUG_BREATH) / 2));

/**
 * One socket on one pedal, with everything the routing needs to know about the
 * enclosure it belongs to: a cable off a top edge has to clear the pedal before
 * it can go anywhere, and one off a side face must arrive level with the socket.
 */
interface Anchor {
  /** The socket itself. */
  at: Point;
  /** True when it is on the top edge rather than a side face. */
  fromTop: boolean;
  /** The clear strip just above the pedal, where a top-mounted cable runs. */
  lane: number;
  /** The pedal's own top and bottom edges. */
  edgeTop: number;
  edgeBottom: number;
  /** The pedal's outer x on this side — where the gap to its neighbour starts. */
  outer: number;
  /** Which row of the board the pedal stands in. */
  row: number;
}

/** Every run on this loom bends to the same radius: a fat instrument lead's. */
const routed = (points: Point[]): string => bent(points, BEND);

/** Where a cable off a top-mounted socket gets to before it turns sideways. */
const clearOf = (anchor: Anchor): Point => ({ x: anchor.at.x, y: anchor.lane });

/** How much straight cable a plug needs beside it before a run may bend. */
const PLUG_CLEAR = PLUG_REACH + BEND + 0.4;

/**
 * How far a plug may stand out of a top-mounted socket.
 *
 * A board only ever leaves a few units between the top of one row and the
 * bottom of the one above it, and the cable off that socket has to cross them
 * too. So the plug takes what the room allows rather than its full length —
 * a short plug reads as a plug, a plug with a cable drawn through it does not.
 */
const topReach = (anchor: Anchor) =>
  Math.max(1.7, Math.min(PLUG_REACH, anchor.at.y - anchor.lane - 0.55));

/**
 * The climb out of a top-mounted socket: the back of the plug's boot first, and
 * only then the lane it turns in. Standing the corner above the plug rather
 * than inside it is what makes the cable read as coming out of the boot instead
 * of through the side of it.
 */
const riseOf = (anchor: Anchor): Point[] => {
  const lane = clearOf(anchor);
  const boot = anchor.at.y - topReach(anchor) - 0.3;
  return boot > lane.y ? [{ x: anchor.at.x, y: boot }, lane] : [lane];
};

/**
 * Where a run out of a side-mounted socket turns for the lane over the row:
 * the middle of the gap when it is wide, and as far from the socket as the gap
 * allows when it is not. Turning any nearer would put the bend inside the plug.
 */
const laneTurn = (socket: Anchor, other: Anchor): number => {
  const middle = (socket.outer + other.outer) / 2;
  const gap = other.outer - socket.outer;
  if (Math.abs(gap) < 1.2) return middle;

  const away = Math.sign(gap);
  const wanted = socket.outer + away * PLUG_CLEAR;
  const limit = other.outer - away * 0.6;
  return away > 0
    ? Math.max(middle, Math.min(wanted, limit))
    : Math.min(middle, Math.max(wanted, limit));
};

/**
 * Guitar to first pedal: in over the top edge, down the lane just past the
 * pedal, then in at the socket's own height. Hugging the rail keeps the run off
 * the surface the pedals stand on, and drops it into the socket square rather
 * than at whatever angle the board happens to be laid out in.
 */
const feedRun = (geo: BoardGeometry, into: Anchor): string => {
  const lane = Math.min(geo.viewW - EDGE_LANE, into.outer + 2.4);
  const off = { x: lane, y: -OFF_BOARD };
  return into.fromTop
    ? routed([
        off,
        { x: lane, y: into.lane },
        { x: into.at.x, y: into.lane },
        into.at,
      ])
    : routed([off, { x: lane, y: into.at.y }, into.at]);
};

/** Last pedal to the amp: out to the lane at socket height, then off the bottom. */
const exitRun = (geo: BoardGeometry, from: Anchor): string => {
  const lane = Math.max(EDGE_LANE, from.outer - 2.4);
  const off = { x: lane, y: geo.viewH + OFF_BOARD };
  return from.fromTop
    ? routed([from.at, ...riseOf(from), { x: lane, y: from.lane }, off])
    : routed([from.at, { x: lane, y: from.at.y }, off]);
};

/**
 * Side-mounted neighbours in a row: it just sags under its own weight.
 *
 * The first and last stretch is dead straight, and longer than the plug it
 * leaves — a cable comes out of a strain-relief boot pointing the way the boot
 * points and only starts to hang once it is clear of it. Curving from the
 * socket itself put the bend under the plug, which read as a cable pushed
 * through the enclosure sideways.
 */
const hopRun = (a: Point, b: Point, reach: number): string => {
  const span = Math.abs(b.x - a.x);
  // The run travels leftwards, so every step along it is measured against the
  // way it is going rather than against the board's own x.
  const along = Math.sign(b.x - a.x) || 1;
  const lead = Math.min(reach + 0.9, span * 0.34);
  const from = { x: a.x + lead * along, y: a.y };
  const to = { x: b.x - lead * along, y: b.y };
  const sag = Math.min(4.5, 1.2 + span * 0.1);
  const belly = { x: (from.x + to.x) / 2, y: Math.max(a.y, b.y) + sag };

  return `M ${at(a)} L ${at(from)} Q ${at(belly)} ${at(to)} L ${at(b)}`;
};

/** Two pedals coupled nose to nose: the cable is too short to hang at all. */
const tautRun = (a: Point, b: Point): string => `M ${at(a)} L ${at(b)}`;

/**
 * A run with a top-mounted socket at one end or both.
 *
 * The sockets on those pedals face the sky, so the cable cannot go straight
 * across — it has to come up out of the enclosure, travel in the clear strip
 * above the row, and drop back down. Which is the entire reason a pedal is
 * built that way: the patch runs over the board instead of stealing the width
 * beside it. A side-mounted partner is met in the gap between the two pedals,
 * never over one of them, so the drop is always somewhere it can be seen.
 */
const overRun = (a: Anchor, b: Anchor): string => {
  const lane = Math.min(a.lane, b.lane);
  const points: Point[] = [a.at];

  if (a.fromTop) {
    points.push(...riseOf(a));
  } else {
    const turn = laneTurn(a, b);
    points.push({ x: turn, y: a.at.y }, { x: turn, y: lane });
  }

  if (b.fromTop) {
    points.push({ x: b.at.x, y: lane }, ...riseOf(b).reverse(), b.at);
  } else {
    const turn = laneTurn(b, a);
    points.push({ x: turn, y: lane }, { x: turn, y: b.at.y }, b.at);
  }

  return routed(points);
};

/**
 * The return run — the one that has to get from the end of one row to the start
 * of the next.
 *
 * Left to a plain curve it cuts a diagonal clean across the middle of the board,
 * which is the one thing no real board has ever looked like. So it takes the
 * detour a real one takes: out to the side rail the row ends at — the left one,
 * since the signal travels leftwards — down into the channel between the two
 * rows, along it with a shallow dip, and back up the right rail into the next
 * row's first pedal. The channel is measured off the pedals themselves rather
 * than off the row constants, so a row dragged out of line still gets a cable
 * that runs between the pedals instead of under them.
 */
const returnRun = (geo: BoardGeometry, a: Anchor, b: Anchor): string => {
  const from = a.fromTop ? clearOf(a) : a.at;
  const to = b.fromTop ? clearOf(b) : b.at;
  const channel = (a.edgeBottom + b.edgeTop) / 2;
  /** The rail the row runs out to, and the one the next row is entered from. */
  const exitLane = Math.max(from.x - TURN, EDGE_LANE);
  const entryLane = Math.min(to.x + TURN, geo.viewW - EDGE_LANE);

  return routed([
    a.at,
    ...(a.fromTop ? riseOf(a) : []),
    { x: exitLane, y: from.y },
    { x: exitLane, y: channel },
    // A long run of cable never lies flat. One shallow dip, kept clear of the
    // row below it, is the difference between a cable and a drawn line.
    { x: (exitLane + entryLane) / 2, y: channel + 1.2 },
    { x: entryLane, y: channel },
    { x: entryLane, y: to.y },
    ...(b.fromTop ? riseOf(b).reverse() : []),
    b.at,
  ]);
};

/**
 * Anything the board's reading order says should never happen: a run doubling
 * back, or climbing a row. Bowed away from the board's middle so it stands off
 * the pedals and reads as the mess it is.
 */
const looseRun = (geo: BoardGeometry, a: Point, b: Point): string => {
  const reach = Math.max(9, Math.min(Math.abs(b.x - a.x) * 0.45, 26));
  const bow = a.y < geo.viewH / 2 ? -6 : 6;
  // Both ends reach *away* from the other, which is what throws the loop out
  // past the pedals instead of pulling it into a straight line between them.
  const away = Math.sign(a.x - b.x) || 1;
  return `M ${at(a)} C ${at({ x: a.x + reach * away, y: a.y + bow })} ${at({
    x: b.x - reach * away,
    y: b.y + bow,
  })} ${at(b)}`;
};

/** Picks the routing a run's own geometry asks for. */
const linkRun = (
  geo: BoardGeometry,
  a: Anchor,
  b: Anchor,
  reach: number,
): string => {
  if (a.row !== b.row) {
    return b.row > a.row ? returnRun(geo, a, b) : looseRun(geo, a.at, b.at);
  }
  if (a.fromTop || b.fromTop) return overRun(a, b);
  // Leftwards is forwards. A run heading the other way is doubling back.
  return b.at.x < a.at.x
    ? hopRun(a.at, b.at, reach)
    : looseRun(geo, a.at, b.at);
};

const TONES = {
  ok: { jacket: "#0b3b2e", core: "#34d399", pulse: "#a7f3d0" },
  bad: { jacket: "#4c1111", core: "#f87171", pulse: "#fecaca" },
  /**
   * What a visitor sees. The colours are a working tool: they tell the owner
   * which cable to move next. On somebody else's profile there is nothing to
   * move, so the board is just a board and the cable is just black — with only
   * enough grey down its spine to keep it from reading as a hole in the deck.
   */
  plain: { jacket: "#0c0c0e", core: "#3b3b3f", pulse: "#3b3b3f" },
} as const;

type Tone = (typeof TONES)[keyof typeof TONES];

interface CableRun {
  d: string;
  ok: boolean;
  /** The mask that fades a run leaving the deck — the two ends carry one. */
  mask?: string;
}

interface PlugProps {
  at: Point;
  /** 0 into a left face, 180 into a right one, 90 down into a top edge. */
  spin: 0 | 90 | 180;
  /** Paint for the nickel parts, already turned to suit `spin`. */
  metal: string;
  /** How far it stands out of the socket — cut back to fit a tight gap. */
  reach?: number;
}

/**
 * A quarter-inch plug, drawn tip-first at the origin so it reads as pushed into
 * the pedal's own enclosure — which is where the whole of the sleeve belongs,
 * so no part of it is drawn at all. A plug that is actually seated shows its
 * handle and its boot and nothing else; leave a length of bare pin standing in
 * the gap and it reads as a cable half pulled out, not a cable plugged in.
 *
 * Sized off the cable rather than off the board. What tells a big jack from a
 * 3.5mm one is not its length but its girth: a real plug's handle is about twice
 * the cable's diameter, so anything drawn thinner than the cable it terminates
 * reads as a mini jack no matter how long it is. The handle here is `1.5×` the
 * jacket's width for exactly that reason.
 *
 * Length is the one place it cannot be honest. A real plug stands some 45mm out
 * of the socket — four times the gap a tidy board leaves between pedals — so it
 * is cut to `PLUG_REACH` instead, and cut back further still when the pair it
 * belongs to has less room than that between them: a plug drawn through its
 * opposite number is worse than a short one. Below `COUPLER_MAX` between the two
 * enclosures neither is drawn at all and `Coupler` takes over. The handle keeps
 * its size whatever happens — girth is what says quarter-inch — so it is the
 * boot that gives up the room.
 *
 * A plug standing in a right-hand face is mirrored rather than rotated, because
 * a rotated one would carry its highlight round with it and end up lit from
 * underneath. One facing down has to be turned, so it is handed a gradient
 * already laid the other way to come out top-lit anyway.
 */
const Plug = ({ at: point, spin, metal, reach = PLUG_REACH }: PlugProps) => {
  const turn = spin === 180 ? " scale(-1 1)" : spin === 90 ? " rotate(90)" : "";
  /** The back face of the boot, and the shoulder tapering onto it. */
  const back = -reach;
  const shoulder = back + 0.55;
  /** The moulded ribs, spaced along whatever boot is left. */
  const rib = (along: number) => -0.95 + (back + 0.95) * along;
  const handle = HANDLE_H / 2;
  const boot = BOOT_H / 2;
  /** Where the boot has finished tapering off the handle. */
  const taper = (handle + boot) / 2;

  return (
    <g transform={`translate(${at(point)})${turn}`}>
      {/* A plug lying on the surface throws a shadow across it. One pushed into
          a top edge is standing on the enclosure, which casts nothing. */}
      {spin !== 90 && (
        <ellipse
          cx={(0.35 + back) / 2}
          cy={handle + 0.55}
          rx={(0.35 - back) / 2 + 0.7}
          ry={0.6}
          fill='#000000'
          opacity={0.42}
        />
      )}

      {/* The moulded strain-relief boot, tapering onto the cable. Lifted off
          black so it separates from the deck it lies on rather than reading as
          a hole with a handle floating over it. */}
      <path
        d={`M -0.95 ${-handle} L ${shoulder} ${-taper} Q ${back} ${-boot} ${back} 0 Q ${back} ${boot} ${shoulder} ${taper} L -0.95 ${handle} Z`}
        fill='#1b1c21'
      />
      <g stroke='#000000' strokeWidth={0.18} opacity={0.55}>
        <line x1={rib(0.35)} y1={-taper} x2={rib(0.35)} y2={taper} />
        <line x1={rib(0.65)} y1={-boot} x2={rib(0.65)} y2={boot} />
      </g>
      <path
        d={`M -0.95 ${-handle} L ${shoulder} ${-taper} L ${shoulder} ${-taper + 0.44} L -0.95 ${-handle + 0.56} Z`}
        fill='#ffffff'
        opacity={0.1}
      />

      {/* The handle, seated flush and tucked a little under the enclosure so no
          seam opens up against a pedal image with a transparent margin. */}
      <rect
        x={-1.05}
        y={-handle}
        width={1.4}
        height={HANDLE_H}
        rx={0.34}
        fill={metal}
      />
      <g stroke='#15181b' strokeWidth={0.14} opacity={0.5}>
        <line x1={-0.82} y1={-handle + 0.26} x2={-0.82} y2={handle - 0.26} />
        <line x1={-0.52} y1={-handle + 0.26} x2={-0.52} y2={handle - 0.26} />
        <line x1={-0.22} y1={-handle + 0.26} x2={-0.22} y2={handle - 0.26} />
      </g>
    </g>
  );
};

interface CouplerProps {
  from: Point;
  to: Point;
  tone: Tone;
  metal: string;
}

/**
 * What two pedals standing nose to nose get instead of two plugs.
 *
 * There is no room for a pair of them — nor, on a real board packed this
 * tightly, for a cable at all — so the two enclosures are bridged by one rigid
 * coupler: a ring seated in each socket and a barrel between them, split by the
 * seam where its two halves screw together.
 *
 * The barrel is drawn in two pieces with a slot down the middle, and the run it
 * covers is left in place underneath. So the verdict still shows — emerald or
 * red, travelling pulse and all — through the gap in the metal, and a coupled
 * link says exactly what every other link says.
 *
 * It is laid socket to socket, not level. Two enclosures rarely wear their
 * jacks at the same height — a compact box carries its pair a good way above
 * where a Friedman-style one does — and a rigid coupler between them stands at
 * whatever angle joins the two holes. Drawn level from one of them it left the
 * other ring hanging in the air a plug's width above the nut it was meant to be
 * seated in.
 */
const Coupler = ({ from, to, tone, metal }: CouplerProps) => {
  // The pair arrives in signal order, which runs right to left, so the barrel
  // is laid from whichever of the two sockets is the leftmost.
  const start = from.x <= to.x ? from : to;
  const end = start === from ? to : from;
  const span = Math.hypot(end.x - start.x, end.y - start.y);
  /** The angle the bar has to stand at to reach the far socket. */
  const tilt = (Math.atan2(end.y - start.y, end.x - start.x) * 180) / Math.PI;
  /** Barrel and rings, at the gauge the plugs it stands in for are drawn to. */
  const ring = HANDLE_H / 2;
  const barrel = BOOT_H / 2;
  /** The slot down the middle, wide enough for the run's colour to read
   *  through it without eating the barrel it is cut into. */
  const slot = JACKET_W / 4;

  return (
    <g transform={`translate(${at(start)}) rotate(${tilt.toFixed(2)})`}>
      <ellipse
        cx={span / 2}
        cy={ring + 0.55}
        rx={span / 2 + 1.5}
        ry={0.6}
        fill='#000000'
        opacity={0.42}
      />
      {/* The barrel, split so the cable inside it stays readable. */}
      <rect
        x={-0.3}
        y={-barrel}
        width={span + 0.6}
        height={barrel - slot}
        rx={0.28}
        fill={metal}
      />
      <rect
        x={-0.3}
        y={slot}
        width={span + 0.6}
        height={barrel - slot}
        rx={0.28}
        fill={metal}
      />
      {/* A hairline of the run's own colour along the slot, so a coupler on a
          backwards link is as red as the cable either side of it. */}
      <rect
        x={-0.3}
        y={-slot}
        width={span + 0.6}
        height={slot * 2}
        fill={tone.jacket}
        opacity={0.55}
      />
      {/* The rings seated in each enclosure. */}
      <rect
        x={-0.7}
        y={-ring}
        width={1.05}
        height={HANDLE_H}
        rx={0.32}
        fill={metal}
      />
      <rect
        x={span - 0.35}
        y={-ring}
        width={1.05}
        height={HANDLE_H}
        rx={0.32}
        fill={metal}
      />
      {/* The seam where the two halves meet. */}
      <line
        x1={span / 2}
        y1={-barrel}
        x2={span / 2}
        y2={barrel}
        stroke='#15181b'
        strokeWidth={0.2}
        opacity={0.7}
      />
    </g>
  );
};

interface SignalCableProps {
  /** The case the board stands in — every measurement below is taken off it. */
  geo: BoardGeometry;
  verdict: ChainVerdict;
  /** A pedal's width on the board, in board percent. */
  widthOf: (itemId: string) => number;
  /** Where a pedal's sockets are. Defaults to the ordinary side-mounted pair. */
  jacksOf?: JackResolver;
  /**
   * Drop the verdict colours and draw the whole loom black.
   *
   * For the read-only board on a public profile: emerald and red are an
   * instruction to rewire, and a visitor cannot rewire anything. The chip above
   * the board still says what the wiring is worth.
   */
  plain?: boolean;
  /**
   * Whether a pedal is actually on the surface. Parked pedals still count in the
   * chain, but there is nothing on the board to run a cable to, so their runs
   * are folded into the neighbouring one.
   */
  isOnBoard?: (itemId: string) => boolean;
}

export const SignalCable = ({
  geo,
  verdict,
  widthOf,
  jacksOf,
  isOnBoard,
  plain = false,
}: SignalCableProps) => {
  const reduceMotion = useReducedMotion();
  const uid = useId();
  const metalDown = `${uid}-metal-down`;
  const metalAcross = `${uid}-metal-across`;
  const feedFade = `${uid}-feed-fade`;
  const exitFade = `${uid}-exit-fade`;
  const { nodes, links } = verdict;

  // Fold the chain down to the pedals that can actually be drawn, carrying the
  // verdict of every run skipped along the way — a run that hops over a parked
  // pedal is only sound if every cable it stands in for was.
  const drawn: { node: (typeof nodes)[number]; okIn: boolean }[] = [];
  let carry = true;

  nodes.forEach((node, index) => {
    if (index > 0) carry = carry && links[index - 1].ok;
    if (isOnBoard && !isOnBoard(node.itemId)) return;
    // The first run comes from the guitar, and a cable out of the guitar can
    // never be in the wrong place.
    drawn.push({ node, okIn: drawn.length === 0 ? true : carry });
    carry = true;
  });

  if (drawn.length === 0) return null;

  const anchorAt = (index: number, which: "in" | "out"): Anchor => {
    const { node } = drawn[index];
    const width = widthOf(node.itemId);
    const jacks = jacksOf ? jacksOf(node.itemId) : SIDE_JACKS;
    const socket = jacks[which];
    const edgeTop = (node.yPct / 100) * geo.viewH;

    return {
      at: toView(
        geo,
        node.xPct + width * socket.x,
        node.yPct + geo.pedalHPct * socket.y,
      ),
      fromTop: jacks.edge === "top",
      lane: Math.max(1.5, edgeTop - TOP_LANE),
      edgeTop,
      edgeBottom: ((node.yPct + geo.pedalHPct) / 100) * geo.viewH,
      outer:
        ((which === "in" ? node.xPct + width : node.xPct) / 100) * geo.viewW,
      row: rowIndexOf(geo, node.yPct),
    };
  };

  // One entry per cable between two pedals. A pair standing closer than two
  // plugs can occupy is marked here rather than at draw time, because it
  // changes three things at once: the run goes taut, the two plugs go away, and
  // a coupler takes their place.
  const between = drawn.slice(1).map((entry, offset) => {
    const a = anchorAt(offset, "out");
    const b = anchorAt(offset + 1, "in");
    // The next pedal stands to the left, so the gap opens up the other way.
    const gap = a.outer - b.outer;

    const facing = a.row === b.row && !a.fromTop && !b.fromTop && gap > 0;

    return {
      a,
      b,
      ok: entry.okIn,
      coupled: facing && gap < COUPLER_MAX,
      /** Two plugs nose to nose share the gap; every other run gets a whole one. */
      reach: facing ? reachInGap(gap) : PLUG_REACH,
    };
  });

  const runs: CableRun[] = [
    {
      d: feedRun(geo, anchorAt(0, "in")),
      ok: true,
      mask: `url(#${feedFade})`,
    },
    ...between.map((link) => ({
      d: link.coupled
        ? tautRun(link.a.at, link.b.at)
        : linkRun(geo, link.a, link.b, link.reach),
      ok: link.ok,
    })),
    {
      d: exitRun(geo, anchorAt(drawn.length - 1, "out")),
      ok: true,
      mask: `url(#${exitFade})`,
    },
  ];

  // A plug per pedal socket, facing into the enclosure it is pushed into —
  // except where a coupler has taken the pair over. The two ends of the board
  // have nothing to plug into: the cable simply runs off the deck; see `Plug`.
  const plugs = drawn.flatMap((_, index) => {
    const inAnchor = anchorAt(index, "in");
    const outAnchor = anchorAt(index, "out");
    // The runs either side decide how much room this pedal's two plugs have.
    // The first and the last face the board's own jacks, which are never in the
    // way, so those keep their full length.
    const before = index > 0 ? between[index - 1] : null;
    const after = index < drawn.length - 1 ? between[index] : null;

    return [
      ...(!before || !before.coupled
        ? [
            {
              at: inAnchor.at,
              spin: (inAnchor.fromTop ? 90 : 180) as 90 | 180,
              reach: inAnchor.fromTop
                ? topReach(inAnchor)
                : (before?.reach ?? PLUG_REACH),
            },
          ]
        : []),
      ...(!after || !after.coupled
        ? [
            {
              at: outAnchor.at,
              spin: (outAnchor.fromTop ? 90 : 0) as 0 | 90,
              reach: outAnchor.fromTop
                ? topReach(outAnchor)
                : (after?.reach ?? PLUG_REACH),
            },
          ]
        : []),
    ];
  });

  const couplers = between.filter((link) => link.coupled);
  const pulsing = verdict.flawless && !reduceMotion && !plain;
  const toneFor = (ok: boolean) =>
    plain ? TONES.plain : ok ? TONES.ok : TONES.bad;

  return (
    <svg
      viewBox={`0 0 ${geo.viewW} ${geo.viewH}`}
      preserveAspectRatio='none'
      className='pointer-events-none absolute inset-0 h-full w-full'
      style={{ zIndex: 1 }}
      aria-hidden>
      <defs>
        {/* Nickel read as a cylinder: highlight up top, core shadow low, and a
            little bounce off the board underneath it. The second copy runs the
            other way across the shape, for the plugs that get turned on their
            side and would otherwise come out lit from the left. */}
        <linearGradient id={metalDown} x1='0' y1='0' x2='0' y2='1'>
          <stop offset='0%' stopColor='#c9d1d8' />
          <stop offset='22%' stopColor='#8e969d' />
          <stop offset='48%' stopColor='#454b51' />
          <stop offset='72%' stopColor='#2a2e33' />
          <stop offset='100%' stopColor='#767d84' />
        </linearGradient>
        <linearGradient id={metalAcross} x1='0' y1='0' x2='1' y2='0'>
          <stop offset='0%' stopColor='#c9d1d8' />
          <stop offset='22%' stopColor='#8e969d' />
          <stop offset='48%' stopColor='#454b51' />
          <stop offset='72%' stopColor='#2a2e33' />
          <stop offset='100%' stopColor='#767d84' />
        </linearGradient>

        {/* The two ends fade out towards the edge they leave by. A luminance
            mask rather than a gradient stroke, so every layer of the run —
            cast shadow, glow, jacket, sheen, core and pulse — thins out
            together instead of each needing its own copy of the ramp. Drawn in
            board units and padded past the deck, so the region never clips the
            glow off a run that hugs the rail. */}
        <linearGradient
          id={`${feedFade}-ramp`}
          gradientUnits='userSpaceOnUse'
          x1='0'
          y1='0'
          x2='0'
          y2={FADE}>
          <stop offset='0%' stopColor='#000000' />
          <stop offset='100%' stopColor='#ffffff' />
        </linearGradient>
        <linearGradient
          id={`${exitFade}-ramp`}
          gradientUnits='userSpaceOnUse'
          x1='0'
          y1={geo.viewH - FADE}
          x2='0'
          y2={geo.viewH}>
          <stop offset='0%' stopColor='#ffffff' />
          <stop offset='100%' stopColor='#000000' />
        </linearGradient>
        {[
          { id: feedFade, ramp: `${feedFade}-ramp` },
          { id: exitFade, ramp: `${exitFade}-ramp` },
        ].map((fade) => (
          <mask
            key={fade.id}
            id={fade.id}
            maskUnits='userSpaceOnUse'
            x={-OFF_BOARD}
            y={-OFF_BOARD}
            width={geo.viewW + OFF_BOARD * 2}
            height={geo.viewH + OFF_BOARD * 2}>
            <rect
              x={-OFF_BOARD}
              y={-OFF_BOARD}
              width={geo.viewW + OFF_BOARD * 2}
              height={geo.viewH + OFF_BOARD * 2}
              fill={`url(#${fade.ramp})`}
            />
          </mask>
        ))}
      </defs>

      {/* Every shadow first, so one run's cast never darkens the next one's
          core. A black loom skips them altogether: the cast under a dark cable
          only thickens it into a smear, where under a lit one it was what
          lifted the cable off the deck. */}
      {!plain && (
        <g fill='none' strokeLinecap='round' strokeLinejoin='round'>
          {runs.map((run, index) => (
            <path
              key={index}
              d={run.d}
              stroke='#000000'
              strokeWidth={2.8}
              opacity={0.5}
              transform='translate(0 0.75)'
              mask={run.mask}
            />
          ))}
        </g>
      )}

      {runs.map((run, index) => {
        const tone = toneFor(run.ok);

        return (
          <g
            key={index}
            fill='none'
            strokeLinecap='round'
            strokeLinejoin='round'
            mask={run.mask}>
            {/* The glow a good run carries, and the alarm a bad one does. */}
            {!plain && (
              <path
                d={run.d}
                stroke={tone.core}
                strokeWidth={4.1}
                opacity={run.ok ? (verdict.flawless ? 0.14 : 0.08) : 0.18}
              />
            )}
            <path d={run.d} stroke={tone.jacket} strokeWidth={JACKET_W} />
            {/* The sheen off a rubber jacket, which is what makes it round. */}
            <path
              d={run.d}
              stroke='#ffffff'
              strokeWidth={0.42}
              opacity={0.12}
              transform='translate(0 -0.5)'
            />
            <path
              d={run.d}
              stroke={tone.core}
              strokeWidth={0.62}
              opacity={0.95}
            />
            {pulsing && (
              <motion.path
                d={run.d}
                stroke={tone.pulse}
                strokeWidth={1.08}
                strokeDasharray='3 15'
                initial={{ strokeDashoffset: 0 }}
                animate={{ strokeDashoffset: -18 }}
                transition={{
                  duration: 0.85,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
            )}
          </g>
        );
      })}

      {couplers.map((link, index) => (
        <Coupler
          key={`coupler-${index}`}
          from={link.a.at}
          to={link.b.at}
          tone={toneFor(link.ok)}
          metal={`url(#${metalDown})`}
        />
      ))}

      {plugs.map((plug, index) => (
        <Plug
          key={index}
          at={plug.at}
          spin={plug.spin}
          reach={plug.reach}
          metal={`url(#${plug.spin === 90 ? metalAcross : metalDown})`}
        />
      ))}
    </svg>
  );
};
