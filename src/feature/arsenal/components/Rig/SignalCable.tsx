import type { ChainVerdict } from "feature/arsenal/data/signalChain";
import { motion, useReducedMotion } from "framer-motion";
import { useId } from "react";

import type { JackResolver } from "../../utils/pedalboardLayout";
import {
  BOARD_H,
  BOARD_W,
  PEDAL_H_PCT,
  rowIndexOf,
  SIDE_JACKS,
} from "../../utils/pedalboardLayout";

/**
 * The patch cable, drawn.
 *
 * The whole point of the signal-path system is that a player should not have to
 * read a number to know whether the board is wired properly — they should see
 * it. So the cable is a real object on the surface: it leaves the input jack,
 * runs into the left side of the first pedal, out of its right side, and on to
 * the amp, sagging between pedals and taking the long way round when it has to
 * change row.
 *
 * Every run is coloured on its own. A cable into the pedal that belongs next
 * glows emerald; one running backwards through the chain is red, which is what
 * makes a bad board legible at a glance rather than only after reading the tip.
 * When nothing is backwards the whole cable carries a travelling pulse — the
 * reward for getting it right, and the reason the panel above can stay quiet
 * about it.
 *
 * Drawn in board units (a 160 × 70 viewBox for the surface's 16/7) so stroke
 * widths stay even instead of stretching with the board, and behind the pedals
 * (`z-index: 1` against their 2) so the cable disappears under each enclosure
 * the way it would on a real board.
 */

/** Where the cable comes in from the guitar, in board percent. */
export const INPUT_JACK = { xPct: 2.2, yPct: 7 };

/** …and where it leaves for the amp. */
export const OUTPUT_JACK = { xPct: 97.8, yPct: 93 };

/** Copper, the same on both jacks — the board's own accent. */
const JACK_COPPER = "#b45309";

/**
 * Outer diameter of the mounting nut, in pixels.
 *
 * A quarter-inch jack's nut is about a fifth of a pedal's width across, and a
 * pedal lands near 130px on a full-size board — so this is roughly life-size
 * rather than a number that merely looked tidy. Anything much smaller stops
 * reading as the big jack a guitar goes into and starts reading as a 3.5mm one.
 */
const SOCKET_PX = 30;

/** Ticks round the nut, so it reads as knurled rather than turned smooth. */
const KNURL = Array.from({ length: 30 }, (_, i) => {
  const turn = (i / 30) * Math.PI * 2;
  return {
    x1: 16 + Math.cos(turn) * 12.4,
    y1: 16 + Math.sin(turn) * 12.4,
    x2: 16 + Math.cos(turn) * 14.6,
    y2: 16 + Math.sin(turn) * 14.6,
  };
});

interface BoardJackProps {
  /** `in` takes the guitar, `out` leaves for the amp. */
  kind: "in" | "out";
}

/**
 * One end of the cable: a panel-mount quarter-inch socket, not a dot.
 *
 * Built the way the real part is, and at the size the real part would be — a
 * knurled nickel nut, the shoulder it tightens onto, a copper washer, and a
 * bore deep enough that the cable running under it looks like it goes
 * somewhere. Nothing is drawn coming out of it: the cable simply disappears
 * into the hole, which is all that is ever visible of a plugged-in jack from
 * this far away.
 *
 * Anchored to the very constants the cable draws from, and in board percent
 * rather than pixels, so the cable meets the socket at every board size instead
 * of near it. The input sits at the top left and the output at the bottom right
 * because that is the order the board is read in: the signal starts where the
 * eye does.
 */
export const BoardJack = ({ kind }: BoardJackProps) => {
  const anchor = kind === "in" ? INPUT_JACK : OUTPUT_JACK;
  const uid = useId();
  const nut = `${uid}-nut`;
  const washer = `${uid}-washer`;
  const bore = `${uid}-bore`;

  return (
    <div
      className='pointer-events-none absolute z-10'
      style={{
        left: `${anchor.xPct}%`,
        top: `${anchor.yPct}%`,
        transform: "translate(-50%, -50%)",
      }}>
      <svg
        width={SOCKET_PX}
        height={SOCKET_PX}
        viewBox='0 0 32 32'
        className='block'>
        <defs>
          <linearGradient id={nut} x1='0.15' y1='0' x2='0.7' y2='1'>
            <stop offset='0%' stopColor='#d5dbe1' />
            <stop offset='28%' stopColor='#798087' />
            <stop offset='56%' stopColor='#2f3338' />
            <stop offset='78%' stopColor='#4d535a' />
            <stop offset='100%' stopColor='#a2a9b0' />
          </linearGradient>
          <radialGradient id={washer} cx='0.36' cy='0.3' r='0.78'>
            <stop offset='0%' stopColor={JACK_COPPER} />
            <stop offset='55%' stopColor='#7c2d12' />
            <stop offset='100%' stopColor='#3f1206' />
          </radialGradient>
          <radialGradient id={bore} cx='0.42' cy='0.28' r='0.82'>
            <stop offset='0%' stopColor='#3a3531' />
            <stop offset='52%' stopColor='#0d0c0b' />
            <stop offset='100%' stopColor='#000000' />
          </radialGradient>
        </defs>

        {/* The shadow the hardware sits in. */}
        <circle cx={16} cy={16.8} r={15} fill='#000000' opacity={0.55} />
        {/* Mounting nut, knurled the way a jack's is. */}
        <circle cx={16} cy={16} r={15} fill={`url(#${nut})`} />
        <g stroke='#14171a' strokeWidth={0.85} opacity={0.4}>
          {KNURL.map((tick, index) => (
            <line key={index} {...tick} />
          ))}
        </g>
        <circle
          cx={16}
          cy={16}
          r={14.7}
          fill='none'
          stroke='#e6ecf1'
          strokeWidth={0.7}
          opacity={0.2}
        />
        {/* The shoulder the nut is tightened down onto. */}
        <circle cx={16} cy={16} r={11.4} fill='#1b1e21' />
        <circle
          cx={16}
          cy={16}
          r={11.4}
          fill='none'
          stroke='#000000'
          strokeWidth={1.1}
          opacity={0.7}
        />
        {/* Copper washer — the one thing keeping the hardware on-palette. */}
        <circle cx={16} cy={16} r={9.2} fill={`url(#${washer})`} />
        {/* …and the bore the cable disappears into. */}
        <circle cx={16} cy={16} r={5.8} fill={`url(#${bore})`} />
        <circle
          cx={16}
          cy={16}
          r={5.8}
          fill='none'
          stroke='#000000'
          strokeWidth={1.4}
          opacity={0.85}
        />
        {/* One highlight, so the nut reads as metal and not a grey disc. */}
        <path
          d='M 6.2 10.4 A 12.4 12.4 0 0 1 17.6 3.7'
          fill='none'
          stroke='#ffffff'
          strokeWidth={1.5}
          strokeLinecap='round'
          opacity={0.28}
        />
      </svg>
      <span
        className='absolute left-1/2 -translate-x-1/2 whitespace-nowrap'
        style={{
          fontSize: 6.5,
          lineHeight: 1,
          letterSpacing: "0.22em",
          fontWeight: 800,
          color: "#c2833a",
          textShadow: "0 1px 2px rgba(0,0,0,0.95)",
          [kind === "in" ? "top" : "bottom"]: "calc(100% + 2.5px)",
        }}>
        {kind === "in" ? "Instr" : "Amp"}
      </span>
    </div>
  );
};

const VIEW_W = BOARD_W * 10;
const VIEW_H = BOARD_H * 10;

/** How close to the case edge a cable is routed when it runs down the side. */
const EDGE_LANE = 2.2;

/** How far past a pedal's jack a cable carries on before it turns. */
const TURN = 7;

/** The radius every corner of a routed run is bent to. Cable, not wire. */
const BEND = 3.2;

/** How far above a pedal a cable off its top edge runs before it turns. */
const TOP_LANE = 2;

/**
 * Gap below which two facing plugs stop being drawable as two plugs.
 *
 * Each one stands 2.65 units off its enclosure, so they need 5.3 units between
 * pedals to sit clear of each other — twice what a tidied board leaves. Rather
 * than draw them jammed through one another, anything under this becomes a
 * single rigid coupler, which is what a real board this tightly packed uses.
 */
const COUPLER_MAX = 3.2;

const toView = (xPct: number, yPct: number) => ({
  x: (xPct / 100) * VIEW_W,
  y: (yPct / 100) * VIEW_H,
});

interface Point {
  x: number;
  y: number;
}

const at = (p: Point) => `${p.x.toFixed(2)} ${p.y.toFixed(2)}`;

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

/**
 * Walks a route and rounds off every corner, so the cable bends where a real one
 * would instead of kinking. Corners tighter than the bend radius borrow half the
 * shorter leg, and a corner sitting on top of its neighbour is dropped rather
 * than drawn as a spike.
 */
const routed = (points: Point[]): string => {
  const parts = [`M ${at(points[0])}`];

  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const here = points[i];
    const next = points[i + 1];
    const inLen = Math.hypot(here.x - prev.x, here.y - prev.y);
    const outLen = Math.hypot(next.x - here.x, next.y - here.y);
    if (inLen < 0.05 || outLen < 0.05) continue;

    const back = Math.min(BEND, inLen / 2) / inLen;
    const on = Math.min(BEND, outLen / 2) / outLen;
    parts.push(
      `L ${at({
        x: here.x + (prev.x - here.x) * back,
        y: here.y + (prev.y - here.y) * back,
      })}`,
      `Q ${at(here)} ${at({
        x: here.x + (next.x - here.x) * on,
        y: here.y + (next.y - here.y) * on,
      })}`,
    );
  }

  parts.push(`L ${at(points[points.length - 1])}`);
  return parts.join(" ");
};

/** Where a cable off a top-mounted socket gets to before it turns sideways. */
const clearOf = (anchor: Anchor): Point => ({ x: anchor.at.x, y: anchor.lane });

/**
 * Guitar to first pedal: down the side lane, then in at the socket's own height.
 * Hugging the rail keeps the run off the surface the pedals stand on, and drops
 * it into the socket square rather than at whatever angle the board happens to
 * be laid out in.
 */
const feedRun = (jack: Point, into: Anchor): string => {
  const lane = Math.max(EDGE_LANE, Math.min(jack.x, into.outer) - 2.4);
  return into.fromTop
    ? routed([
        jack,
        { x: lane, y: into.lane },
        { x: into.at.x, y: into.lane },
        into.at,
      ])
    : routed([jack, { x: lane, y: into.at.y }, into.at]);
};

/** Last pedal to the amp: out to the far lane at socket height, then down. */
const exitRun = (from: Anchor, jack: Point): string => {
  const lane = Math.min(VIEW_W - EDGE_LANE, Math.max(from.outer, jack.x) + 2.4);
  return from.fromTop
    ? routed([
        from.at,
        clearOf(from),
        { x: lane, y: from.lane },
        { x: lane, y: jack.y - 4 },
        jack,
      ])
    : routed([from.at, { x: lane, y: from.at.y }, jack]);
};

/** Side-mounted neighbours in a row: it just sags under its own weight. */
const hopRun = (a: Point, b: Point): string => {
  const sag = Math.min(4.5, 1.2 + (b.x - a.x) * 0.1);
  return `M ${at(a)} Q ${at({ x: (a.x + b.x) / 2, y: a.y + sag })} ${at(b)}`;
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
  const gapMid = (a.outer + b.outer) / 2;
  const points: Point[] = [a.at];

  if (a.fromTop) points.push(clearOf(a));
  else points.push({ x: gapMid, y: a.at.y }, { x: gapMid, y: lane });

  if (b.fromTop) points.push({ x: b.at.x, y: lane }, b.at);
  else points.push({ x: gapMid, y: lane }, { x: gapMid, y: b.at.y }, b.at);

  return routed(points);
};

/**
 * The return run — the one that has to get from the end of one row to the start
 * of the next.
 *
 * Left to a plain curve it cuts a diagonal clean across the middle of the board,
 * which is the one thing no real board has ever looked like. So it takes the
 * detour a real one takes: out to the side rail, down into the channel between
 * the two rows, along it with a shallow dip, and back up into the next row's
 * first pedal. The channel is measured off the pedals themselves rather than off
 * the row constants, so a row dragged out of line still gets a cable that runs
 * between the pedals instead of under them.
 */
const returnRun = (a: Anchor, b: Anchor): string => {
  const from = a.fromTop ? clearOf(a) : a.at;
  const to = b.fromTop ? clearOf(b) : b.at;
  const channel = (a.edgeBottom + b.edgeTop) / 2;
  const right = Math.min(from.x + TURN, VIEW_W - EDGE_LANE);
  const left = Math.max(to.x - TURN, EDGE_LANE);

  return routed([
    a.at,
    ...(a.fromTop ? [from] : []),
    { x: right, y: from.y },
    { x: right, y: channel },
    // A long run of cable never lies flat. One shallow dip, kept clear of the
    // row below it, is the difference between a cable and a drawn line.
    { x: (right + left) / 2, y: channel + 1.2 },
    { x: left, y: channel },
    { x: left, y: to.y },
    ...(b.fromTop ? [to] : []),
    b.at,
  ]);
};

/**
 * Anything the board's reading order says should never happen: a run doubling
 * back, or climbing a row. Bowed away from the board's middle so it stands off
 * the pedals and reads as the mess it is.
 */
const looseRun = (a: Point, b: Point): string => {
  const reach = Math.max(9, Math.min(Math.abs(b.x - a.x) * 0.45, 26));
  const bow = a.y < VIEW_H / 2 ? -6 : 6;
  return `M ${at(a)} C ${at({ x: a.x + reach, y: a.y + bow })} ${at({
    x: b.x - reach,
    y: b.y + bow,
  })} ${at(b)}`;
};

/** Picks the routing a run's own geometry asks for. */
const linkRun = (a: Anchor, b: Anchor): string => {
  if (a.row !== b.row) {
    return b.row > a.row ? returnRun(a, b) : looseRun(a.at, b.at);
  }
  if (a.fromTop || b.fromTop) return overRun(a, b);
  return b.at.x > a.at.x ? hopRun(a.at, b.at) : looseRun(a.at, b.at);
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
}

interface PlugProps {
  at: Point;
  /** 0 into a left face, 180 out of a right one, 90 down into a top edge. */
  spin: 0 | 90 | 180;
  /** Paint for the nickel parts, already turned to suit `spin`. */
  metal: string;
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
 * is cut to about that gap instead. Closer than `COUPLER_MAX` and it is not
 * drawn at all: `Coupler` takes over.
 *
 * A plug facing left is mirrored rather than rotated, because a rotated one
 * would carry its highlight round with it and end up lit from underneath. One
 * facing down has to be turned, so it is handed a gradient already laid the
 * other way to come out top-lit anyway.
 */
const Plug = ({ at: point, spin, metal }: PlugProps) => {
  const turn = spin === 180 ? " scale(-1 1)" : spin === 90 ? " rotate(90)" : "";

  return (
    <g transform={`translate(${at(point)})${turn}`}>
      {/* A plug lying on the surface throws a shadow across it. One pushed into
          a top edge is standing on the enclosure, which casts nothing. */}
      {spin !== 90 && (
        <ellipse
          cx={-1.2}
          cy={1.95}
          rx={2.2}
          ry={0.66}
          fill='#000000'
          opacity={0.42}
        />
      )}

      {/* The moulded strain-relief boot, tapering onto the cable. */}
      <path
        d='M -0.95 -1.72 L -2.1 -1.2 Q -2.65 -1 -2.65 0 Q -2.65 1 -2.1 1.2 L -0.95 1.72 Z'
        fill='#131316'
      />
      <g stroke='#000000' strokeWidth={0.18} opacity={0.55}>
        <line x1={-1.5} y1={-1.5} x2={-1.5} y2={1.5} />
        <line x1={-1.95} y1={-1.28} x2={-1.95} y2={1.28} />
      </g>
      <path
        d='M -0.95 -1.72 L -2.1 -1.2 L -2.1 -0.76 L -0.95 -1.16 Z'
        fill='#ffffff'
        opacity={0.1}
      />

      {/* The handle, seated flush and tucked a little under the enclosure so no
          seam opens up against a pedal image with a transparent margin. */}
      <rect
        x={-1.05}
        y={-1.72}
        width={1.4}
        height={3.44}
        rx={0.36}
        fill={metal}
      />
      <g stroke='#15181b' strokeWidth={0.14} opacity={0.5}>
        <line x1={-0.82} y1={-1.46} x2={-0.82} y2={1.46} />
        <line x1={-0.52} y1={-1.46} x2={-0.52} y2={1.46} />
        <line x1={-0.22} y1={-1.46} x2={-0.22} y2={1.46} />
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
 */
const Coupler = ({ from, to, tone, metal }: CouplerProps) => {
  const span = Math.max(0, to.x - from.x);

  return (
    <g transform={`translate(${at(from)})`}>
      <ellipse
        cx={span / 2}
        cy={2}
        rx={span / 2 + 1.5}
        ry={0.66}
        fill='#000000'
        opacity={0.42}
      />
      {/* The barrel, split so the cable inside it stays readable. */}
      <rect
        x={-0.3}
        y={-1.42}
        width={span + 0.6}
        height={0.92}
        rx={0.3}
        fill={metal}
      />
      <rect
        x={-0.3}
        y={0.5}
        width={span + 0.6}
        height={0.92}
        rx={0.3}
        fill={metal}
      />
      {/* A hairline of the run's own colour along the slot, so a coupler on a
          backwards link is as red as the cable either side of it. */}
      <rect
        x={-0.3}
        y={-0.5}
        width={span + 0.6}
        height={1}
        fill={tone.jacket}
        opacity={0.55}
      />
      {/* The rings seated in each enclosure. */}
      <rect
        x={-0.7}
        y={-1.72}
        width={1.05}
        height={3.44}
        rx={0.34}
        fill={metal}
      />
      <rect
        x={span - 0.35}
        y={-1.72}
        width={1.05}
        height={3.44}
        rx={0.34}
        fill={metal}
      />
      {/* The seam where the two halves meet. */}
      <line
        x1={span / 2}
        y1={-1.42}
        x2={span / 2}
        y2={1.42}
        stroke='#15181b'
        strokeWidth={0.2}
        opacity={0.7}
      />
    </g>
  );
};

interface SignalCableProps {
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
    const edgeTop = (node.yPct / 100) * VIEW_H;

    return {
      at: toView(
        node.xPct + width * socket.x,
        node.yPct + PEDAL_H_PCT * socket.y,
      ),
      fromTop: jacks.edge === "top",
      lane: Math.max(1.5, edgeTop - TOP_LANE),
      edgeTop,
      edgeBottom: ((node.yPct + PEDAL_H_PCT) / 100) * VIEW_H,
      outer: ((which === "in" ? node.xPct : node.xPct + width) / 100) * VIEW_W,
      row: rowIndexOf(node.yPct),
    };
  };

  // One entry per cable between two pedals. A pair standing closer than two
  // plugs can occupy is marked here rather than at draw time, because it
  // changes three things at once: the run goes taut, the two plugs go away, and
  // a coupler takes their place.
  const between = drawn.slice(1).map((entry, offset) => {
    const a = anchorAt(offset, "out");
    const b = anchorAt(offset + 1, "in");
    const gap = b.outer - a.outer;

    return {
      a,
      b,
      ok: entry.okIn,
      coupled:
        a.row === b.row &&
        !a.fromTop &&
        !b.fromTop &&
        gap > 0 &&
        gap < COUPLER_MAX,
    };
  });

  const runs: CableRun[] = [
    {
      d: feedRun(toView(INPUT_JACK.xPct, INPUT_JACK.yPct), anchorAt(0, "in")),
      ok: true,
    },
    ...between.map((link) => ({
      d: link.coupled ? tautRun(link.a.at, link.b.at) : linkRun(link.a, link.b),
      ok: link.ok,
    })),
    {
      d: exitRun(
        anchorAt(drawn.length - 1, "out"),
        toView(OUTPUT_JACK.xPct, OUTPUT_JACK.yPct),
      ),
      ok: true,
    },
  ];

  // A plug per pedal socket, facing into the enclosure it is pushed into —
  // except where a coupler has taken the pair over. The board's own sockets
  // show nothing but the cable going in; see `Plug`.
  const plugs = drawn.flatMap((_, index) => {
    const inAnchor = anchorAt(index, "in");
    const outAnchor = anchorAt(index, "out");
    const drawIn = index === 0 || !between[index - 1].coupled;
    const drawOut = index === drawn.length - 1 || !between[index].coupled;

    return [
      ...(drawIn
        ? [{ at: inAnchor.at, spin: (inAnchor.fromTop ? 90 : 0) as 0 | 90 }]
        : []),
      ...(drawOut
        ? [
            {
              at: outAnchor.at,
              spin: (outAnchor.fromTop ? 90 : 180) as 90 | 180,
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
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
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
              strokeWidth={3.4}
              opacity={0.5}
              transform='translate(0 0.75)'
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
            strokeLinejoin='round'>
            {/* The glow a good run carries, and the alarm a bad one does. */}
            {!plain && (
              <path
                d={run.d}
                stroke={tone.core}
                strokeWidth={5}
                opacity={run.ok ? (verdict.flawless ? 0.14 : 0.08) : 0.18}
              />
            )}
            <path d={run.d} stroke={tone.jacket} strokeWidth={2.3} />
            {/* The sheen off a rubber jacket, which is what makes it round. */}
            <path
              d={run.d}
              stroke='#ffffff'
              strokeWidth={0.5}
              opacity={0.12}
              transform='translate(0 -0.5)'
            />
            <path
              d={run.d}
              stroke={tone.core}
              strokeWidth={0.75}
              opacity={0.95}
            />
            {pulsing && (
              <motion.path
                d={run.d}
                stroke={tone.pulse}
                strokeWidth={1.3}
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
          metal={`url(#${plug.spin === 90 ? metalAcross : metalDown})`}
        />
      ))}
    </svg>
  );
};
