import type { ChainVerdict } from "feature/arsenal/data/signalChain";
import { motion, useReducedMotion } from "framer-motion";
import { useId } from "react";

import { BOARD_H, BOARD_W, PEDAL_H_PCT } from "../../utils/pedalboardLayout";

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

/** Half a pedal's height in view units — the reach from a side jack to its edge. */
const HALF_PEDAL = (PEDAL_H_PCT / 200) * VIEW_H;

/** How close to the case edge a cable is routed when it runs down the side. */
const EDGE_LANE = 2.2;

/** How far past a pedal's jack a cable carries on before it turns. */
const TURN = 7;

/** The radius every corner of a routed run is bent to. Cable, not wire. */
const BEND = 3.2;

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

/**
 * Guitar to first pedal: down the side lane, then in at the pedal's own height.
 * Hugging the rail keeps the run off the surface the pedals stand on, and drops
 * it into the socket square rather than at whatever angle the board happens to
 * be laid out in.
 */
const feedRun = (jack: Point, into: Point): string => {
  const lane = Math.max(EDGE_LANE, Math.min(jack.x, into.x) - 2.4);
  return routed([jack, { x: lane, y: into.y }, into]);
};

/** Last pedal to the amp: out to the far lane at pedal height, then down. */
const exitRun = (from: Point, jack: Point): string => {
  const lane = Math.min(VIEW_W - EDGE_LANE, Math.max(from.x, jack.x) + 2.4);
  return routed([from, { x: lane, y: from.y }, jack]);
};

/** Neighbours in a row: nothing to route around, so it just sags under itself. */
const hopRun = (a: Point, b: Point): string => {
  const sag = Math.min(4.5, 1.2 + (b.x - a.x) * 0.1);
  return `M ${at(a)} Q ${at({ x: (a.x + b.x) / 2, y: a.y + sag })} ${at(b)}`;
};

/**
 * The return run — the one that has to get from the end of one row to the start
 * of the next.
 *
 * Left to a plain curve it cuts a diagonal clean across the middle of the board,
 * which is the one thing no real board has ever looked like. So it takes the
 * detour a real one takes: out to the side rail, down into the channel between
 * the two rows, along it, and back up into the next row's first pedal. The
 * channel is measured off the pedals themselves rather than off the row
 * constants, so a row dragged out of line still gets a cable that runs between
 * the pedals instead of under them.
 */
const returnRun = (a: Point, b: Point): string => {
  const channel = (a.y + HALF_PEDAL + (b.y - HALF_PEDAL)) / 2;
  const right = Math.min(a.x + TURN, VIEW_W - EDGE_LANE);
  const left = Math.max(b.x - TURN, EDGE_LANE);

  return routed([
    a,
    { x: right, y: a.y },
    { x: right, y: channel },
    // A long run of cable never lies flat. One shallow dip, kept clear of the
    // row below it, is the difference between a cable and a drawn line.
    { x: (right + left) / 2, y: channel + 1.2 },
    { x: left, y: channel },
    { x: left, y: b.y },
    b,
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
const linkRun = (a: Point, b: Point): string => {
  if (Math.abs(b.y - a.y) < HALF_PEDAL) {
    return b.x > a.x ? hopRun(a, b) : looseRun(a, b);
  }
  return b.y > a.y ? returnRun(a, b) : looseRun(a, b);
};

const TONES = {
  ok: { jacket: "#0b3b2e", core: "#34d399", pulse: "#a7f3d0" },
  bad: { jacket: "#4c1111", core: "#f87171", pulse: "#fecaca" },
} as const;

interface CableRun {
  d: string;
  ok: boolean;
}

interface PlugProps {
  at: Point;
  /** A pedal's output faces out of the enclosure, so its plug is mirrored. */
  flip: boolean;
  /** Paint for the nickel parts. */
  metal: string;
}

/**
 * A quarter-inch plug, drawn tip-first at the origin so it reads as pushed into
 * the pedal's own enclosure — which covers the shaft, leaving only the collar
 * and the moulded boot in the open.
 *
 * Sized off the cable rather than off the board. What tells a big jack from a
 * 3.5mm one is not its length but its girth: a real plug's handle is about twice
 * the cable's diameter and its sleeve about half again, so anything drawn
 * thinner than the cable it terminates reads as a mini jack no matter how long
 * it is. The handle here is `1.5×` the jacket's width for exactly that reason.
 *
 * Length is the one place it cannot be honest. A real plug stands some 45mm out
 * of the socket — four times the gap a tidy board leaves between pedals — so it
 * is cut to a little over the gap instead, which lets two facing plugs sit
 * nearly nose to nose on a tight board rather than swallowing their neighbours.
 *
 * Only the pedals get one. The board's own sockets are drawn at something near
 * life size, and at that size all a plugged-in jack shows is a cable vanishing
 * into a hole, so `BoardJack` gets the cable run under it and nothing else.
 *
 * A plug facing left is mirrored rather than rotated, because a rotated one
 * would carry its highlight round with it and end up lit from underneath.
 */
const Plug = ({ at: point, flip, metal }: PlugProps) => (
  <g transform={`translate(${at(point)})${flip ? " scale(-1 1)" : ""}`}>
    {/* What it throws on the surface. */}
    <ellipse
      cx={-1.7}
      cy={1.95}
      rx={2.7}
      ry={0.68}
      fill='#000000'
      opacity={0.42}
    />

    {/* The moulded strain-relief boot, tapering onto the cable. */}
    <path
      d='M -2.7 -1.7 L -3.6 -1.15 Q -4 -0.95 -4 0 Q -4 0.95 -3.6 1.15 L -2.7 1.7 Z'
      fill='#131316'
    />
    <g stroke='#000000' strokeWidth={0.18} opacity={0.55}>
      <line x1={-3.05} y1={-1.48} x2={-3.05} y2={1.48} />
      <line x1={-3.45} y1={-1.26} x2={-3.45} y2={1.26} />
    </g>
    <path
      d='M -2.7 -1.7 L -3.6 -1.15 L -3.6 -0.72 L -2.7 -1.14 Z'
      fill='#ffffff'
      opacity={0.1}
    />

    {/* The sleeve, sunk into the socket, then the handle it screws onto. */}
    <rect x={-2.05} y={-1.08} width={3.25} height={2.16} rx={1} fill={metal} />
    <rect
      x={-0.95}
      y={-1.08}
      width={0.3}
      height={2.16}
      fill='#23262a'
      opacity={0.8}
    />
    <rect
      x={-1.95}
      y={-0.86}
      width={3}
      height={0.34}
      rx={0.17}
      fill='#ffffff'
      opacity={0.26}
    />
    <rect
      x={-2.75}
      y={-1.72}
      width={0.95}
      height={3.44}
      rx={0.36}
      fill={metal}
    />
    <g stroke='#15181b' strokeWidth={0.14} opacity={0.5}>
      <line x1={-2.52} y1={-1.46} x2={-2.52} y2={1.46} />
      <line x1={-2.28} y1={-1.46} x2={-2.28} y2={1.46} />
      <line x1={-2.04} y1={-1.46} x2={-2.04} y2={1.46} />
    </g>
  </g>
);

interface SignalCableProps {
  verdict: ChainVerdict;
  /** A pedal's width on the board, in board percent. */
  widthOf: (itemId: string) => number;
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
  isOnBoard,
}: SignalCableProps) => {
  const reduceMotion = useReducedMotion();
  const metalId = useId();
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

  const jackIn = (index: number) => {
    const { node } = drawn[index];
    return toView(node.xPct, node.yPct + PEDAL_H_PCT / 2);
  };
  const jackOut = (index: number) => {
    const { node } = drawn[index];
    return toView(
      node.xPct + widthOf(node.itemId),
      node.yPct + PEDAL_H_PCT / 2,
    );
  };

  const runs: CableRun[] = [
    {
      d: feedRun(toView(INPUT_JACK.xPct, INPUT_JACK.yPct), jackIn(0)),
      ok: true,
    },
    ...drawn.slice(1).map((entry, offset) => ({
      d: linkRun(jackOut(offset), jackIn(offset + 1)),
      ok: entry.okIn,
    })),
    {
      d: exitRun(
        jackOut(drawn.length - 1),
        toView(OUTPUT_JACK.xPct, OUTPUT_JACK.yPct),
      ),
      ok: true,
    },
  ];

  // A plug per pedal jack, facing into the enclosure it is pushed into. The
  // board's own sockets show nothing but the cable going in — see `Plug`.
  const plugs = drawn.flatMap((_, index) => [
    { at: jackIn(index), flip: false },
    { at: jackOut(index), flip: true },
  ]);
  const pulsing = verdict.flawless && !reduceMotion;

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      preserveAspectRatio='none'
      className='pointer-events-none absolute inset-0 h-full w-full'
      style={{ zIndex: 1 }}
      aria-hidden>
      <defs>
        <linearGradient id={metalId} x1='0' y1='0' x2='0' y2='1'>
          {/* Nickel read as a cylinder: highlight up top, core shadow low, and
              a little bounce off the board underneath it. */}
          <stop offset='0%' stopColor='#c9d1d8' />
          <stop offset='22%' stopColor='#8e969d' />
          <stop offset='48%' stopColor='#454b51' />
          <stop offset='72%' stopColor='#2a2e33' />
          <stop offset='100%' stopColor='#767d84' />
        </linearGradient>
      </defs>

      {/* Every shadow first, so one run's cast never darkens the next one's core. */}
      <g fill='none' strokeLinecap='round' strokeLinejoin='round'>
        {runs.map((run, index) => (
          <path
            key={index}
            d={run.d}
            stroke='#000'
            strokeWidth={3.4}
            opacity={0.5}
            transform='translate(0 0.75)'
          />
        ))}
      </g>

      {runs.map((run, index) => {
        const tone = run.ok ? TONES.ok : TONES.bad;

        return (
          <g
            key={index}
            fill='none'
            strokeLinecap='round'
            strokeLinejoin='round'>
            {/* The glow a good run carries, and the alarm a bad one does. */}
            <path
              d={run.d}
              stroke={tone.core}
              strokeWidth={5}
              opacity={run.ok ? (verdict.flawless ? 0.14 : 0.08) : 0.18}
            />
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

      {plugs.map((plug, index) => (
        <Plug
          key={index}
          at={plug.at}
          flip={plug.flip}
          metal={`url(#${metalId})`}
        />
      ))}
    </svg>
  );
};
