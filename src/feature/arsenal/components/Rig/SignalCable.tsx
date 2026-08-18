import type { ChainVerdict } from "feature/arsenal/data/signalChain";
import { motion, useReducedMotion } from "framer-motion";

import {
  BOARD_H,
  BOARD_W,
  PEDAL_H_PCT,
} from "../../utils/pedalboardLayout";

/**
 * The patch cable, drawn.
 *
 * The whole point of the signal-path system is that a player should not have to
 * read a number to know whether the board is wired properly — they should see
 * it. So the cable is a real object on the surface: it leaves the input jack,
 * runs into the left side of the first pedal, out of its right side, and on to
 * the amp, sagging between pedals and looping when it has to double back.
 *
 * Every run is coloured on its own. A cable into the pedal that belongs next
 * glows emerald; one running backwards through the chain is red and visibly
 * crosses itself, which is what makes a bad board legible at a glance rather
 * than only after reading the tip. When nothing is backwards the whole cable
 * carries a travelling pulse — the reward for getting it right, and the reason
 * the panel above can stay quiet about it.
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
const JACK_RING = "#92400e";

interface BoardJackProps {
  /** `in` takes the guitar, `out` leaves for the amp. */
  kind: "in" | "out";
}

/**
 * One end of the cable.
 *
 * Anchored to the very constants `SignalCable` draws from, and in board percent
 * rather than pixels, so the cable meets the socket at every board size instead
 * of near it. The input sits at the top left and the output at the bottom right
 * because that is the order the board is read in: the signal starts where the
 * eye does.
 */
export const BoardJack = ({ kind }: BoardJackProps) => {
  const anchor = kind === "in" ? INPUT_JACK : OUTPUT_JACK;

  return (
    <div
      className='pointer-events-none absolute z-10'
      style={{
        left: `${anchor.xPct}%`,
        top: `${anchor.yPct}%`,
        width: 14,
        height: 14,
        borderRadius: "50%",
        background: "#111",
        border: `2px solid ${JACK_RING}`,
        boxShadow: "0 0 8px rgba(146,64,14,0.5)",
        transform: "translate(-50%, -50%)",
      }}>
      <div
        style={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: "#b45309",
          margin: "2.5px auto",
        }}
      />
      <span
        className='absolute left-1/2 -translate-x-1/2 whitespace-nowrap'
        style={{
          fontSize: 6,
          letterSpacing: "0.2em",
          fontWeight: 900,
          textTransform: "capitalize",
          color: "#78350f",
          [kind === "in" ? "top" : "bottom"]: "100%",
        }}>
        {kind === "in" ? "Instr" : "Amp"}
      </span>
    </div>
  );
};

const VIEW_W = BOARD_W * 10;
const VIEW_H = BOARD_H * 10;

const toView = (xPct: number, yPct: number) => ({
  x: (xPct / 100) * VIEW_W,
  y: (yPct / 100) * VIEW_H,
});

interface Point {
  x: number;
  y: number;
}

/**
 * One run of cable between two points.
 *
 * A run that goes forward inside its own row just sags under its own weight. A
 * run that changes row, or doubles back to a pedal standing earlier on the
 * board, gets its control points pushed outward — which draws the loop of slack
 * a real cable would need, and for a backward run makes the cable cross itself.
 */
const runPath = (a: Point, b: Point): string => {
  const dx = b.x - a.x;

  if (Math.abs(b.y - a.y) < 1 && dx > 0) {
    const sag = Math.min(4.5, 1.2 + dx * 0.1);
    return `M ${a.x} ${a.y} Q ${(a.x + b.x) / 2} ${a.y + sag} ${b.x} ${b.y}`;
  }

  const reach = Math.max(11, Math.abs(dx) * 0.45);
  return `M ${a.x} ${a.y} C ${a.x + reach} ${a.y} ${b.x - reach} ${b.y} ${b.x} ${b.y}`;
};

const TONES = {
  ok: { jacket: "#0b3b2e", core: "#34d399", pulse: "#a7f3d0" },
  bad: { jacket: "#4c1111", core: "#f87171", pulse: "#fecaca" },
} as const;

interface CableRun {
  d: string;
  ok: boolean;
}

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
      d: runPath(toView(INPUT_JACK.xPct, INPUT_JACK.yPct), jackIn(0)),
      ok: true,
    },
    ...drawn.slice(1).map((entry, offset) => ({
      d: runPath(jackOut(offset), jackIn(offset + 1)),
      ok: entry.okIn,
    })),
    {
      d: runPath(
        jackOut(drawn.length - 1),
        toView(OUTPUT_JACK.xPct, OUTPUT_JACK.yPct),
      ),
      ok: true,
    },
  ];

  const plugs = drawn.flatMap((_, index) => [jackIn(index), jackOut(index)]);
  const pulsing = verdict.flawless && !reduceMotion;

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      preserveAspectRatio='none'
      className='pointer-events-none absolute inset-0 h-full w-full'
      style={{ zIndex: 1 }}
      aria-hidden>
      {runs.map((run, index) => {
        const tone = run.ok ? TONES.ok : TONES.bad;

        return (
          <g key={index} fill='none' strokeLinecap='round'>
            {/* Cast on the board, so the cable sits above the surface. */}
            <path
              d={run.d}
              stroke='#000'
              strokeWidth={3.4}
              opacity={0.5}
              transform='translate(0 0.7)'
            />
            {/* The glow a good run carries, and the alarm a bad one does. */}
            <path
              d={run.d}
              stroke={tone.core}
              strokeWidth={5}
              opacity={run.ok ? (verdict.flawless ? 0.14 : 0.08) : 0.18}
            />
            <path d={run.d} stroke={tone.jacket} strokeWidth={2.3} />
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
                transition={{ duration: 0.85, repeat: Infinity, ease: "linear" }}
              />
            )}
          </g>
        );
      })}

      {/* Plug ends, so the cable reads as plugged in rather than drawn on. */}
      {plugs.map((point, index) => (
        <circle
          key={index}
          cx={point.x}
          cy={point.y}
          r={1.3}
          fill='#141414'
          stroke='#5a5a5a'
          strokeWidth={0.5}
        />
      ))}
    </svg>
  );
};
