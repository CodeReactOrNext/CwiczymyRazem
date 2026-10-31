import { locateTabNote } from "feature/exercisePlan/views/PracticeSession/utils/tabNoteLocator";
import type { Easing } from "framer-motion";
import { m } from "framer-motion";
import type { RefObject } from "react";
import { useEffect, useState } from "react";

import { useBossFightStore } from "../store/bossFightStore";
import type { BossId } from "../types/boss.types";

interface Point {
  x: number;
  y: number;
}

interface Shot {
  id: number;
  from: Point;
  /** Where the target is when the shot lands… */
  to: Point;
  /** …and where it has scrolled to when what stuck to it is gone. */
  end: Point;
  /** Where the target was when the boss took aim — the reticle follows it to `to`. */
  start: Point;
  /** HP the miss cost — popped off the note; 0 when a shield or second wind caught it. */
  damage: number;
}

/** Seconds the boss winds up — it rears back, then lunges as it lets go. */
const WINDUP_S = 0.2;
/** Seconds a shot flies: the spider spits, the colossus lobs a boulder, the changeling's shard swoops. */
const FLIGHT_S: Record<BossId, number> = {
  fretweaver: 0.26,
  colossus: 0.5,
  changeling: 0.34,
};
/** Seconds what hit stays on the target. */
const STUCK_S: Record<BossId, number> = {
  fretweaver: 1.3,
  colossus: 1.1,
  changeling: 0.8,
};
/** How hard the impact shakes what it hit, px. */
const SHAKE_PX: Record<BossId, number> = {
  fretweaver: 2,
  colossus: 6,
  changeling: 4,
};
const MAX_SHOTS = 4;

/** Where each boss fires from, in its art's viewBox (480 × 380): the spider's fangs, the colossus's fist, the changeling's mask. */
const MUZZLE: Record<BossId, Point> = {
  fretweaver: { x: 240, y: 268 },
  colossus: { x: 115, y: 318 },
  changeling: { x: 240, y: 150 },
};

const SILK = "#e4e4e7";
const SILK_DIM = "#a1a1aa";
const STONE = "#52525b";
const STONE_LIGHT = "#71717a";
const STONE_DARK = "#3f3f46";
const MASK = "#f4f4f5";
/** Damage reads orange everywhere in the fight. */
const HURT = "#fb923c";
const HURT_SOFT = "#fdba74";

const prefersReducedMotion = () =>
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

const f = (n: number) => n.toFixed(1);

/** A point `t` along the quadratic curve a → c → b. */
const quad = (a: Point, c: Point, b: Point, t: number): Point => ({
  x: (1 - t) ** 2 * a.x + 2 * (1 - t) * t * c.x + t ** 2 * b.x,
  y: (1 - t) ** 2 * a.y + 2 * (1 - t) * t * c.y + t ** 2 * b.y,
});

/** The curve as keyframes, evenly in `t`. */
const along = (a: Point, c: Point, b: Point, steps = 8) =>
  Array.from({ length: steps + 1 }, (_, i) => quad(a, c, b, i / steps));

const evenTimes = (count: number) =>
  Array.from({ length: count }, (_, i) => i / (count - 1));

/** What hit rides the target from the impact on, then fades. */
const riding = (to: Point, end: Point, impact: number, stuck: number) => ({
  initial: { x: to.x, y: to.y, opacity: 0 },
  animate: { x: end.x, y: end.y, opacity: [0, 1, 1, 0] },
  transition: {
    x: { delay: impact, duration: stuck, ease: "linear" as Easing },
    y: { delay: impact, duration: stuck, ease: "linear" as Easing },
    opacity: { delay: impact, duration: stuck, times: [0, 0.03, 0.8, 1] },
  },
});

/** A ring bursting out of the point of impact. */
const ImpactRing = ({
  at,
  delay,
  radius = 34,
  color = HURT_SOFT,
}: {
  at: Point;
  delay: number;
  radius?: number;
  color?: string;
}) => (
  <m.circle
    cx={at.x}
    cy={at.y}
    fill='none'
    stroke={color}
    strokeWidth={2}
    initial={{ r: 4, opacity: 0 }}
    animate={{ r: radius, opacity: [0.95, 0] }}
    transition={{ delay, duration: 0.38, ease: "easeOut" }}
  />
);

// ── Every shot: aim, charge, spark, damage ──────────────────────────────────

/** What the boss charges up with at its mouth or fist. */
const CHARGE: Record<BossId, string> = {
  fretweaver: SILK,
  colossus: STONE_LIGHT,
  changeling: MASK,
};

/** A corner of the reticle, around 0,0 — four of them, turned. */
const RETICLE_CORNER = "M-17 -9 L-17 -17 L-9 -17";

/** Spark strokes out of the point of impact. */
const SPARKS = Array.from({ length: 7 }, (_, i) => {
  const angle = (i / 7) * Math.PI * 2 + 0.4;
  const [inner, outer] = [7, 20 + (i % 2) * 7];
  return `M${f(Math.cos(angle) * inner)} ${f(Math.sin(angle) * inner)} L${f(Math.cos(angle) * outer)} ${f(Math.sin(angle) * outer)}`;
});

/**
 * What every shot shares, around whatever the boss throws: the reticle that
 * locks onto the target and rides with it until the hit, the charge
 * gathering where the boss fires from, a flat white spark on impact, and the
 * HP it cost popping off the note.
 */
const ShotFx = ({ shot, boss }: { shot: Shot; boss: BossId }) => {
  const { from, to, start, damage } = shot;
  const impact = WINDUP_S + FLIGHT_S[boss];
  return (
    <g>
      {/* The reticle, closing in and turning as the shot comes. */}
      <m.g
        initial={{ x: start.x, y: start.y, opacity: 0 }}
        animate={{ x: to.x, y: to.y, opacity: [0, 1, 1, 0] }}
        transition={{
          x: { duration: impact, ease: "linear" },
          y: { duration: impact, ease: "linear" },
          opacity: { duration: impact + 0.06, times: [0, 0.2, 0.9, 1] },
        }}>
        <m.g
          initial={{ scale: 1.9, rotate: -90 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: impact, ease: "easeIn" }}>
          {[0, 90, 180, 270].map((turn) => (
            <path
              key={turn}
              d={RETICLE_CORNER}
              transform={`rotate(${turn})`}
              fill='none'
              stroke={HURT_SOFT}
              strokeWidth={2}
              strokeLinecap='round'
              strokeLinejoin='round'
            />
          ))}
        </m.g>
      </m.g>

      {/* The charge, drawn in to where the boss lets go from. */}
      <m.circle
        cx={from.x}
        cy={from.y}
        fill='none'
        stroke={CHARGE[boss]}
        strokeWidth={2}
        initial={{ r: 26, opacity: 0 }}
        animate={{ r: [26, 4], opacity: [0, 0.9, 0] }}
        transition={{ duration: WINDUP_S + 0.04, ease: "easeIn" }}
      />

      {/* The spark: a flat flash and strokes flying out — no glow. */}
      <m.circle
        cx={to.x}
        cy={to.y}
        r={14}
        fill='#fafafa'
        initial={{ opacity: 0 }}
        animate={{ opacity: [0.95, 0] }}
        transition={{ delay: impact, duration: 0.14, ease: "easeOut" }}
      />
      <g transform={`translate(${f(to.x)} ${f(to.y)})`}>
        {SPARKS.map((d) => (
          <m.path
            key={d}
            d={d}
            stroke='#fafafa'
            strokeWidth={2}
            strokeLinecap='round'
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: [1, 0] }}
            transition={{ delay: impact, duration: 0.24, ease: "easeOut" }}
          />
        ))}
      </g>

      {damage > 0 && (
        <m.text
          x={to.x}
          textAnchor='middle'
          className='font-teko'
          fontSize={30}
          fontWeight={600}
          fill={HURT}
          stroke='#09090b'
          strokeWidth={4}
          paintOrder='stroke'
          initial={{ y: to.y - 16, opacity: 0, scale: 0.6 }}
          animate={{
            y: to.y - 50,
            opacity: [0, 1, 1, 0],
            scale: [0.6, 1.3, 1, 1],
          }}
          transition={{
            delay: impact,
            duration: 0.95,
            ease: "easeOut",
            times: [0, 0.15, 0.3, 1],
          }}>
          −{damage}
        </m.text>
      )}
    </g>
  );
};

// ── The spider: silk ────────────────────────────────────────────────────────

const COCOON_SPOKES = 11;

/** The web it wraps the note in, around 0,0: spokes, then rings sagging between them. */
const COCOON = (() => {
  const tip = (i: number, r: number) => {
    const angle = (i / COCOON_SPOKES) * Math.PI * 2 + Math.sin(i * 2.1) * 0.12;
    return { x: Math.cos(angle) * r, y: Math.sin(angle) * r };
  };
  const paths = Array.from({ length: COCOON_SPOKES }, (_, i) => {
    const end = tip(i, 25 + (i % 3) * 4);
    return `M0 0 L${f(end.x)} ${f(end.y)}`;
  });
  for (const r of [8, 15, 23]) {
    let d = `M${f(tip(0, r).x)} ${f(tip(0, r).y)}`;
    for (let i = 0; i < COCOON_SPOKES; i++) {
      const b = tip(i + 1, r);
      const mid = tip(i + 0.5, r * 0.8);
      d += ` Q${f(mid.x)} ${f(mid.y)} ${f(b.x)} ${f(b.y)}`;
    }
    paths.push(d);
  }
  return paths;
})();

/**
 * The spider spits: a ball of web on a strand from its fangs. It wraps the
 * note — the strand still on it as the note rides off — and the spider reels
 * the strand back in.
 */
const SilkShot = ({ shot }: { shot: Shot }) => {
  const { from, to, end } = shot;
  const flight = FLIGHT_S.fretweaver;
  const stuck = STUCK_S.fretweaver;
  const impact = WINDUP_S + flight;
  const total = impact + stuck;
  const sag = (b: Point) => ({
    x: (from.x + b.x) / 2,
    y: (from.y + b.y) / 2 + 28,
  });
  const strand = (b: Point) => {
    const c = sag(b);
    return `M${f(from.x)} ${f(from.y)} Q${f(c.x)} ${f(c.y)} ${f(b.x)} ${f(b.y)}`;
  };
  const path = along(from, sag(to), to);
  const times = evenTimes(path.length);
  const heading = (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI;
  const reel = [
    0,
    WINDUP_S / total,
    impact / total,
    (impact + stuck * 0.75) / total,
    1,
  ];

  return (
    <g>
      {/* The strand — a few fibres — out with the ball, on the note as it rides off, reeled in. */}
      {[
        { offset: 0, width: 2.2, opacity: 0.95 },
        { offset: 1.6, width: 1, opacity: 0.5 },
        { offset: -1.4, width: 1, opacity: 0.4 },
      ].map(({ offset, width, opacity }) => (
        <m.path
          key={offset}
          transform={`translate(${offset} ${-offset})`}
          fill='none'
          stroke={SILK}
          strokeWidth={width}
          strokeOpacity={opacity}
          strokeLinecap='round'
          initial={{ pathLength: 0, d: strand(to) }}
          animate={{
            pathLength: [0, 0, 1, 1, 0],
            d: [strand(to), strand(to), strand(to), strand(end), strand(end)],
          }}
          transition={{
            duration: total,
            times: reel,
            ease: ["linear", "easeOut", "linear", "easeIn"],
          }}
        />
      ))}

      {/* The ball of web, spinning. */}
      <m.g
        initial={{ x: from.x, y: from.y, opacity: 0 }}
        animate={{
          x: path.map((p) => p.x),
          y: path.map((p) => p.y),
          opacity: [1, 1, 0],
        }}
        transition={{
          x: { delay: WINDUP_S, duration: flight, times, ease: "easeOut" },
          y: { delay: WINDUP_S, duration: flight, times, ease: "easeOut" },
          opacity: { delay: WINDUP_S, duration: flight, times: [0, 0.95, 1] },
        }}>
        {/* Stretched along its flight, squashed as it hits. */}
        <g transform={`rotate(${f(heading)})`}>
          <m.g
            initial={{ scaleX: 1, scaleY: 1 }}
            animate={{
              scaleX: [1, 1.8, 1.4, 0.7],
              scaleY: [1, 0.65, 0.75, 1.3],
            }}
            transition={{
              delay: WINDUP_S,
              duration: flight,
              times: [0, 0.3, 0.85, 1],
            }}>
            <circle r={8} fill={SILK} fillOpacity={0.9} />
            <ellipse
              rx={8}
              ry={3.5}
              fill='none'
              stroke={SILK_DIM}
              strokeWidth={1}
            />
            <ellipse
              rx={3.5}
              ry={8}
              fill='none'
              stroke={SILK_DIM}
              strokeWidth={1}
            />
          </m.g>
        </g>
      </m.g>

      <ImpactRing at={to} delay={impact} />

      {/* The note, wrapped. */}
      <m.g {...riding(to, end, impact, stuck)}>
        <circle r={21} fill={SILK} fillOpacity={0.16} />
        {COCOON.map((d, i) => {
          const spoke = i < COCOON_SPOKES;
          return (
            <m.path
              key={d}
              d={d}
              fill='none'
              stroke={SILK}
              strokeWidth={spoke ? 1.4 : 1.1}
              strokeOpacity={spoke ? 0.95 : 0.75}
              strokeLinecap='round'
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{
                delay: impact + (spoke ? 0 : 0.06 * (i - COCOON_SPOKES + 1)),
                duration: 0.16,
                ease: "easeOut",
              }}
            />
          );
        })}
      </m.g>
    </g>
  );
};

// ── The colossus: stone ─────────────────────────────────────────────────────

const BOULDER =
  "-19.5,-9 -9,-19.5 7.5,-18 19.5,-6 18,10.5 6,19.5 -10.5,18 -19.5,6";
const BOULDER_LIT = "-9,-19.5 7.5,-18 3,-4.5 -10.5,-6";
const BOULDER_SHADE = "3,-4.5 19.5,-6 18,10.5 6,6";

/** The cracks it leaves, out from the point of impact. */
const CRATER = [
  "M0 0 L-10.4 -3.9 L-18.2 2.6 L-28.6 -1.3 L-39 3.9",
  "M0 0 L11.7 2.6 L19.5 -3.9 L31.2 0 L42.9 -5.2",
  "M0 0 L-3.9 10.4 L-11.7 15.6 L-14.3 24.7",
  "M0 0 L5.2 -11.7 L1.3 -19.5 L6.5 -28.6",
  "M0 0 L9.1 11.7 L18.2 14.3 L24.7 23.4",
  "M0 0 L-7.8 -13 L-16.9 -15.6",
];

/** Chunks thrown up by the impact: [x it flies to, how high it goes, size]. */
const DEBRIS: [number, number, number][] = [
  [-38, 34, 3.5],
  [-24, 52, 2.5],
  [-12, 40, 3],
  [8, 58, 2.5],
  [20, 36, 3.5],
  [34, 48, 3],
  [44, 26, 2],
  [-46, 22, 2],
];

/**
 * The colossus lobs a boulder in a high arc — dust trailing it — down onto
 * the note: a shockwave, chunks flying, the board shaken, and the cracks
 * stay on the note as it rides off.
 */
const RockShot = ({ shot }: { shot: Shot }) => {
  const { from, to, end } = shot;
  const flight = FLIGHT_S.colossus;
  const stuck = STUCK_S.colossus;
  const impact = WINDUP_S + flight;
  const apex = Math.min(from.y, to.y) - 130;
  // A quadratic's middle sits halfway to its control point: this one tops out at `apex`.
  const control = { x: (from.x + to.x) / 2, y: 2 * apex - (from.y + to.y) / 2 };
  const path = along(from, control, to, 10);
  const xs = path.map((p) => p.x);
  const ys = path.map((p) => p.y);
  const times = evenTimes(path.length);

  return (
    <g>
      {/* Its shadow on the board, growing under the note as it comes down. */}
      <m.ellipse
        fill='#09090b'
        initial={{
          cx: shot.start.x,
          cy: shot.start.y + 6,
          rx: 4,
          ry: 1.5,
          opacity: 0,
        }}
        animate={{
          cx: to.x,
          cy: to.y + 6,
          rx: 26,
          ry: 7,
          opacity: [0, 0.55, 0],
        }}
        transition={{
          cx: { duration: impact, ease: "linear" },
          cy: { duration: impact, ease: "linear" },
          rx: { duration: impact, ease: "easeIn" },
          ry: { duration: impact, ease: "easeIn" },
          opacity: { duration: impact + 0.05, times: [0, 0.95, 1] },
        }}
      />

      {/* Dust trailing the boulder. */}
      {[1, 2, 3, 4].map((i) => (
        <m.circle
          key={i}
          r={7 - i}
          fill={STONE_LIGHT}
          initial={{ cx: from.x, cy: from.y, opacity: 0 }}
          animate={{ cx: xs, cy: ys, opacity: [0.35, 0.3, 0] }}
          transition={{
            cx: {
              delay: WINDUP_S + i * 0.035,
              duration: flight,
              times,
              ease: "linear",
            },
            cy: {
              delay: WINDUP_S + i * 0.035,
              duration: flight,
              times,
              ease: "linear",
            },
            opacity: {
              delay: WINDUP_S + i * 0.035,
              duration: flight,
              times: [0, 0.8, 1],
            },
          }}
        />
      ))}

      {/* The boulder. */}
      <m.g
        initial={{ x: from.x, y: from.y, opacity: 0 }}
        animate={{ x: xs, y: ys, opacity: [1, 1, 0] }}
        transition={{
          x: { delay: WINDUP_S, duration: flight, times, ease: "linear" },
          y: { delay: WINDUP_S, duration: flight, times, ease: "linear" },
          opacity: { delay: WINDUP_S, duration: flight, times: [0, 0.97, 1] },
        }}>
        <m.g
          animate={{ rotate: 420 }}
          transition={{ delay: WINDUP_S, duration: flight, ease: "linear" }}>
          <polygon
            points={BOULDER}
            fill={STONE}
            stroke={SILK_DIM}
            strokeWidth={1.5}
            strokeLinejoin='round'
          />
          <polygon points={BOULDER_LIT} fill={STONE_LIGHT} />
          <polygon points={BOULDER_SHADE} fill={STONE_DARK} />
        </m.g>
      </m.g>

      {/* The shockwave, flat along the board, and the flash. */}
      <m.ellipse
        cx={to.x}
        cy={to.y}
        fill='none'
        stroke={SILK_DIM}
        strokeWidth={2}
        initial={{ rx: 6, ry: 2, opacity: 0 }}
        animate={{ rx: 58, ry: 16, opacity: [0.9, 0] }}
        transition={{ delay: impact, duration: 0.45, ease: "easeOut" }}
      />
      <ImpactRing at={to} delay={impact} radius={28} />

      {/* Chunks thrown up, falling back, and the dust they raise. */}
      <g transform={`translate(${f(to.x)} ${f(to.y)})`}>
        {DEBRIS.map(([x, up, size], i) => (
          <m.rect
            key={i}
            width={size * 2}
            height={size * 2}
            fill={i % 2 ? STONE_LIGHT : STONE}
            initial={{ x: -size, y: -size, opacity: 0, rotate: 0 }}
            animate={{
              x: [-size, x * 0.6, x],
              y: [-size, -up, 24],
              opacity: [1, 1, 0],
              rotate: x * 6,
            }}
            transition={{
              delay: impact,
              duration: 0.6,
              times: [0, 0.4, 1],
              ease: ["easeOut", "easeIn"],
            }}
          />
        ))}
        {[-14, 0, 14].map((x) => (
          <m.circle
            key={x}
            cx={x}
            cy={-4}
            fill={STONE_LIGHT}
            initial={{ r: 3, opacity: 0 }}
            animate={{ r: 15, opacity: [0.4, 0] }}
            transition={{
              delay: impact + 0.03,
              duration: 0.7,
              ease: "easeOut",
            }}
          />
        ))}
      </g>

      {/* The crater, on the note as it rides off. */}
      <m.g {...riding(to, end, impact, stuck)}>
        <circle r={12} fill='#09090b' fillOpacity={0.7} />
        {CRATER.map((d, i) => (
          <m.path
            key={d}
            d={d}
            fill='none'
            stroke={SILK_DIM}
            strokeWidth={2.2}
            strokeLinejoin='round'
            strokeLinecap='round'
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{
              delay: impact + i * 0.02,
              duration: 0.14,
              ease: "easeOut",
            }}
          />
        ))}
      </m.g>
    </g>
  );
};

// ── The changeling: a shard of its mask ─────────────────────────────────────

const SHARD = "M-20.8 -4.8 Q0 -25.6 22.4 -1.6 Q1.6 -12.8 -20.8 -4.8 Z";
/** Splinters off the shard when it hits: [x, y] they fly to. */
const SPLINTERS: [number, number][] = [
  [-26, -14],
  [24, -18],
  [-20, 16],
  [28, 12],
  [2, -28],
  [-4, 26],
];

/**
 * The changeling flings a shard of its mask in a swoop from the side — at
 * the wrong note on the neck, or at the chord let go by — and slashes an X
 * through it.
 */
const ShardShot = ({ shot }: { shot: Shot }) => {
  const { from, to } = shot;
  const flight = FLIGHT_S.changeling;
  const stuck = STUCK_S.changeling;
  const impact = WINDUP_S + flight;
  const side = to.x <= from.x ? 1 : -1;
  const control = {
    x: (from.x + to.x) / 2 + side * 200,
    y: Math.min(from.y, to.y) - 40,
  };
  const path = along(from, control, to, 10);
  const times = evenTimes(path.length);

  return (
    <g>
      {/* The shard, three fading copies of it trailing behind. */}
      {[3, 2, 1, 0].map((ghost) => {
        const delay = WINDUP_S + ghost * 0.03;
        const opacity = ghost ? 0.3 / ghost : 1;
        return (
          <m.g
            key={ghost}
            initial={{ x: from.x, y: from.y, opacity: 0 }}
            animate={{
              x: path.map((p) => p.x),
              y: path.map((p) => p.y),
              opacity: [opacity, opacity, 0],
            }}
            transition={{
              x: { delay, duration: flight, times, ease: "easeIn" },
              y: { delay, duration: flight, times, ease: "easeIn" },
              opacity: { delay, duration: flight, times: [0, 0.95, 1] },
            }}>
            <m.path
              d={SHARD}
              fill={MASK}
              stroke={SILK_DIM}
              strokeWidth={1}
              animate={{ rotate: side * 720 }}
              transition={{ delay, duration: flight, ease: "linear" }}
            />
          </m.g>
        );
      })}

      <ImpactRing at={to} delay={impact} radius={30} />

      <g transform={`translate(${f(to.x)} ${f(to.y)})`}>
        {SPLINTERS.map(([x, y], i) => (
          <m.path
            key={i}
            d='M-3 -1 L3 -2 L0 3 Z'
            fill={MASK}
            initial={{ x: 0, y: 0, opacity: 0 }}
            animate={{ x, y, opacity: [1, 0], rotate: x * 8 }}
            transition={{ delay: impact, duration: 0.5, ease: "easeOut" }}
          />
        ))}
        <m.g
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 1, 0] }}
          transition={{
            delay: impact,
            duration: stuck,
            times: [0, 0.03, 0.75, 1],
          }}>
          {["M-18 -18 L18 18", "M18 -18 L-18 18"].map((d, i) => (
            <m.path
              key={d}
              d={d}
              fill='none'
              stroke={HURT}
              strokeWidth={3.5}
              strokeLinecap='round'
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{
                delay: impact + i * 0.07,
                duration: 0.1,
                ease: "easeOut",
              }}
            />
          ))}
        </m.g>
      </g>
    </g>
  );
};

// ── Firing ──────────────────────────────────────────────────────────────────

/** The boss rears back, then lunges toward what it fires at. */
const lunge = (art: HTMLElement, from: Point, to: Point) => {
  const dir = Math.sign(to.x - from.x) || 1;
  art.animate?.(
    [
      { transform: "translate(0px, 0px) rotate(0deg)" },
      {
        transform: `translate(${-dir * 6}px, -12px) rotate(${-dir * 4}deg)`,
        offset: 0.3,
      },
      {
        transform: `translate(${dir * 10}px, 10px) rotate(${dir * 3}deg)`,
        offset: 0.5,
      },
      { transform: "translate(0px, 0px) rotate(0deg)" },
    ],
    { duration: 460, easing: "ease-out" },
  );
};

/** What the shot hits shakes as it lands. */
const shake = (
  target: Element | null | undefined,
  px: number,
  delaySec: number,
) => {
  target?.animate?.(
    [
      { transform: "translate(0px, 0px)" },
      { transform: `translate(${-px}px, ${px * 0.5}px)` },
      { transform: `translate(${px * 0.8}px, ${-px * 0.4}px)` },
      { transform: `translate(${-px * 0.4}px, 0px)` },
      { transform: "translate(0px, 0px)" },
    ],
    { duration: 260, delay: delaySec * 1000, easing: "ease-out" },
  );
};

const centreOf = (el: Element): Point => {
  const rect = el.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
};

/** The first element for `selector` that is on screen — the desktop and phone boards are both mounted. */
const visible = (selector: string) =>
  Array.from(document.querySelectorAll(selector)).find((el) => {
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }) ?? null;

/**
 * What a boss fires at the player's mistake, from its art (`artRef`, the box
 * it is drawn in): the spider's silk and the colossus's boulder at the tab
 * note missed — led to where it will have scrolled when it lands, riding
 * with it after — the changeling's shard at the wrong note on its neck, or
 * the chord let go by.
 */
export const BossShots = ({
  boss,
  artRef,
}: {
  boss: BossId;
  artRef: RefObject<HTMLDivElement | null>;
}) => {
  const [shots, setShots] = useState<Shot[]>([]);

  useEffect(() => {
    let nextId = 0;
    const timers = new Set<number>();
    const frames = new Set<number>();
    const flight = FLIGHT_S[boss];
    const stuck = STUCK_S[boss];
    const impact = WINDUP_S + flight;

    const fire = (
      start: Point,
      to: Point,
      end: Point,
      target: Element | null,
      damage: number,
    ) => {
      const art = artRef.current;
      const box = art?.getBoundingClientRect();
      if (!art || !box || box.width <= 0) return;
      const muzzle = MUZZLE[boss];
      const from = {
        x: box.left + (muzzle.x / 480) * box.width,
        y: box.top + (muzzle.y / 380) * box.height,
      };
      lunge(art, from, to);
      shake(target, SHAKE_PX[boss], impact);
      const shot: Shot = { id: nextId++, from, to, end, start, damage };
      setShots((list) => [...list, shot].slice(-MAX_SHOTS));
      const timer = window.setTimeout(
        () => {
          timers.delete(timer);
          setShots((list) => list.filter((s) => s.id !== shot.id));
        },
        (impact + stuck) * 1000 + 150,
      );
      timers.add(timer);
    };

    const unsubscribe = useBossFightStore.subscribe((state, previous) => {
      if (prefersReducedMotion()) return;
      if (boss !== "changeling") {
        const { missShot } = state;
        if (!missShot || missShot === previous.missShot) return;
        const to = locateTabNote(missShot.noteKey, impact);
        if (!to) return;
        // The spot aimed at is followed from now until what hit it is gone.
        fire(
          locateTabNote(missShot.noteKey, 0, to.along) ?? to,
          to,
          locateTabNote(missShot.noteKey, impact + stuck, to.along) ?? to,
          to.board,
          state.fight.lastBite,
        );
        return;
      }
      const miss = state.changesLive.lastMiss;
      if (!miss || miss.tick === previous.changesLive.lastMiss?.tick) return;
      const damage = state.fight.lastBite;
      // The board draws the wrong note's ring on its next render: aim once it has.
      const frame = requestAnimationFrame(() => {
        frames.delete(frame);
        const next = requestAnimationFrame(() => {
          frames.delete(next);
          const target =
            miss.pc !== null
              ? visible("[data-changes-played]")
              : (visible(`[data-changes-unit="${miss.unit}"]`) ??
                visible('[data-slot="0"]'));
          if (!target) return;
          const at = centreOf(target);
          fire(
            at,
            at,
            at,
            miss.pc !== null ? target.closest("svg") : target,
            damage,
          );
        });
        frames.add(next);
      });
      frames.add(frame);
    });
    return () => {
      unsubscribe();
      timers.forEach((timer) => window.clearTimeout(timer));
      frames.forEach((frame) => cancelAnimationFrame(frame));
    };
  }, [boss, artRef]);

  if (!shots.length) return null;
  return (
    <svg
      className='pointer-events-none fixed inset-0 z-40 h-full w-full overflow-visible'
      aria-hidden>
      {shots.map((shot) => (
        <g key={shot.id}>
          {boss === "colossus" ? (
            <RockShot shot={shot} />
          ) : boss === "changeling" ? (
            <ShardShot shot={shot} />
          ) : (
            <SilkShot shot={shot} />
          )}
          <ShotFx shot={shot} boss={boss} />
        </g>
      ))}
    </svg>
  );
};
