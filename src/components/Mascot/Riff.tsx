import { cn } from "assets/lib/utils";
import {
  animate,
  AnimatePresence,
  motion,
  type MotionValue,
  type TargetAndTransition,
  type Transition,
  useAnimationControls,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import { type ReactNode, useEffect, useId, useMemo, useRef, useState } from "react";

/**
 * Riff — the combo-amp mascot (see docs/MASCOT.md).
 *
 * Built in layers so poses and reactions never fight:
 *   pose     — the held body attitude of a mood (slump, crouch, lean, tilt)
 *   breath   — a slow idle loop so he is never frozen
 *   action   — one-off reactions on top of it (hops, shrugs, wobbles)
 *   arms     — two noodle arms with cream mitts, posed per mood and driven by
 *              gestures (wave, point, shrug, flail, plug the cable in)
 *   face     — lids, pupils and the mouth cut into the speaker grille
 * plus per-mood effects drawn around him (Zzz, stars, smoke, ?, !, glow).
 *
 * `talking` makes the mouth flap in syllables; `RiffSays` pairs that with a
 * speech bubble typed out letter by letter. With reduced motion only the pose
 * and the face are drawn — no reactions, no loops, text shown at once.
 */

export type RiffMood =
  | "idle"
  | "celebrate"
  | "hop"
  | "levelUp"
  | "asleep"
  | "standby"
  | "focus"
  | "nudge"
  | "shrug"
  | "dizzy"
  | "lookAround"
  | "warmup"
  | "unplugged"
  | "plugIn"
  | "error"
  | "listen";

const C = {
  body: "#45454f",
  bodyShade: "#36363f",
  bodyLight: "#585865",
  bodyDeep: "#2a2a32",
  side: "#30303a",
  sideShade: "#222229",
  sideLight: "#3e3e49",
  top: "#55555f",
  foot: "#1d1d24",
  highlight: "#686875",
  handle: "#5e5e6b",
  panel: "#f4b63e",
  panelLip: "#d49327",
  panelLight: "#fcd57c",
  panelShade: "#e8a233",
  navy: "#17213a",
  mouth: "#0a0f1e",
  tongue: "#e8676d",
  white: "#ffffff",
  eyeShade: "#d3d9e6",
  occlusion: "#000000",
  lamp: "#ff6b1a",
  lampDim: "#9a4a20",
  lampOff: "#566079",
  metal: "#c9ced8",
  metalDark: "#8f96a3",
  cloth: "#1e2433",
  weave: "#29314a",
  cone: "#252d41",
  coneLight: "#34405f",
  coneRing: "#2e3850",
  piping: "#e9dcbe",
  cable: "#2a2a31",
  smoke: "#71717a",
  star: "#f4b63e",
  arm: "#5c5c68",
  armShade: "#3b3b44",
  pipingShade: "#c9b991",
};

// ─── Drawing system ──────────────────────────────────────────────────────────
// One line weight for every cream line (piping, mouth, closed eyes), flat
// colours with a single shade step, and geometry snapped to a few radii so the
// figure reads as one drawing, not a pile of details.
const LINE = 2.4;
/** One curve for every eased move, so all motion shares a feel. */
const EASE: [number, number, number, number] = [0.45, 0, 0.25, 1];
const FRONT = { x: 30, y: 50, width: 131, height: 116, rx: 14 };
/** The side of the cabinet: the front, pushed back to the right. */
/**
 * The back of the cabinet: the front pushed back along the depth vector
 * (16, -7), so the top face and the right side both show — a box in 3/4 view,
 * not a slab with another slab behind it.
 */
const BACK = { ...FRONT, x: 46, y: 43 };
/**
 * Joins front and back: the band between the two lines tangent to the
 * top-left and bottom-right corner arcs (normal to the depth vector).
 */
const HULL_JOIN = "M38.4,51.2 L54.4,44.2 L168.6,157.8 L152.6,164.8 Z";
/** Everything above the ridge running back from the front's top-right corner: the top face. */
const TOP_FACE = "M20,20 L200,20 L200,35.2 L156.9,54.1 L20,54.1 Z";
const GRILLE = { x: 38, y: 99, width: 115, height: 59, rx: 8 };
/** Top-left metal cap; centred on the front's corner arc (44,64), r 14. */
const CORNER = "M27.5,70 L27.5,64 A16.5,16.5 0 0 1 44,47.5 L50,47.5 L50,52.5 L44,52.5 A11.5,11.5 0 0 0 32.5,64 L32.5,70 Z";

type LookAt = "left" | "right" | "up" | "down";

interface RiffProps {
  mood?: RiffMood;
  className?: string;
  /** Extra wait (s) before the entry reaction, e.g. while a parent enters. */
  delay?: number;
  /** Idle: random small actions every few seconds and a hover reaction. */
  lively?: boolean;
  /** Idle: land with a squash shortly after mounting. */
  arrive?: boolean;
  /** Celebrate: one hop instead of the full party. */
  short?: boolean;
  /** Nudge / shrug / unplugged: where he looks and leans. */
  lookAt?: LookAt;
  /** Shut the eyes (e.g. while a password is typed). */
  eyesClosed?: boolean;
  /** Listen: signal level 0–1 driving the speaker and mouth. */
  signal?: number;
  /** Mouth flaps in syllables. */
  talking?: boolean;
}

// ─── Mouth shapes ─────────────────────────────────────────────────────────────
// One closed path, same structure for every shape, so they morph into each
// other: left corner → top edge → right corner → down to the bottom middle →
// back up to the left corner.
type MouthShape = "smile" | "grin" | "open" | "mid" | "o" | "flat" | "frown" | "wavy" | "sleep";
const MOUTH: Record<MouthShape, string> = {
  smile: "M80,124 C92,129 106,129 118,124 C117,133 109,140 99,140 C89,140 81,133 80,124 Z",
  grin: "M76,118 C90,121 108,121 122,118 C121,136 111,149 99,149 C87,149 77,136 76,118 Z",
  open: "M80,117 C92,118 106,118 118,117 C118,135 110,148 99,148 C88,148 80,135 80,117 Z",
  mid: "M83,121 C93,122 105,122 115,121 C114,132 108,139 99,139 C90,139 84,132 83,121 Z",
  o: "M90,121 C93,115 105,115 108,121 C110,130 106,138 99,138 C92,138 88,130 90,121 Z",
  flat: "M84,129 C94,128 104,128 114,129 C114,132 107,133 99,133 C91,133 84,132 84,129 Z",
  frown: "M82,137 C92,127 106,127 116,137 C113,139 108,134 99,134 C90,134 85,139 82,137 Z",
  wavy: "M82,131 C90,125 96,137 104,129 C110,124 115,131 117,132 C110,137 104,134 99,136 C92,139 86,134 82,131 Z",
  sleep: "M94,130 C95,126 103,126 104,130 C105,134 102,137 99,137 C96,137 93,134 94,130 Z",
};
const TALK: MouthShape[] = ["open", "mid", "smile", "open", "o", "mid", "grin", "smile"];
const TONGUE_SHAPES: MouthShape[] = ["open", "grin"];

// ─── Poses ────────────────────────────────────────────────────────────────────
type Lid = { left: number; right: number };
type Body = { rotate: number; scaleX: number; scaleY: number; y: number; skewX: number };
type Pose = {
  body: Body;
  lidL: Lid;
  lidR: Lid;
  pupilL: { x: number; y: number };
  pupilR: { x: number; y: number };
  mouth: MouthShape;
  lamp: string;
  unplugged: boolean;
  slack: boolean;
  handleUp: number;
  armL: Arm;
  armR: Arm;
};

// ─── Smooth motion ────────────────────────────────────────────────────────────
// Framer eases each keyframe segment on its own, so a move through several
// keyframes slows to a stop at every one of them — the "stop-and-go" look.
// Instead every multi-keyframe move runs along one monotone cubic spline
// through all its keyframes: velocity carries through each point, it only
// comes to rest at turning points and at the ends, and it never overshoots.

/** Tangents for a monotone cubic Hermite spline (Fritsch–Butland). */
const splineTangents = (v: number[], t: number[]) => {
  const n = v.length;
  const m = new Array<number>(n).fill(0);
  for (let i = 1; i < n - 1; i++) {
    const h0 = t[i] - t[i - 1];
    const h1 = t[i + 1] - t[i];
    if (h0 <= 0 || h1 <= 0) continue;
    const d0 = (v[i] - v[i - 1]) / h0;
    const d1 = (v[i + 1] - v[i]) / h1;
    if (d0 * d1 <= 0) continue; // a turning point or a hold: come to rest there
    m[i] = (3 * (h0 + h1)) / ((2 * h1 + h0) / d0 + (h1 + 2 * h0) / d1);
  }
  return m;
};

const knotsFor = (n: number, times?: number[]) =>
  times && times.length === n ? times : Array.from({ length: n }, (_, i) => i / (n - 1));

/** The spline through `v` (at `t`) evaluated at progress p ∈ [0, 1]. */
const splineAt = (v: number[], t: number[], m: number[], p: number) => {
  let i = 0;
  while (i < v.length - 2 && p > t[i + 1]) i++;
  const h = t[i + 1] - t[i] || 1;
  const u = Math.min(1, Math.max(0, (p - t[i]) / h));
  const u2 = u * u;
  const u3 = u2 * u;
  return (
    (2 * u3 - 3 * u2 + 1) * v[i] + (u3 - 2 * u2 + u) * h * m[i] + (-2 * u3 + 3 * u2) * v[i + 1] + (u3 - u2) * h * m[i + 1]
  );
};

const SPLINE_FPS = 45;

/** Turns every numeric keyframe list (3+ values) into a dense spline sampling, played linearly. */
const smoothMove = (target: TargetAndTransition, tr: Transition = {}): [TargetAndTransition, Transition] => {
  const duration = typeof tr.duration === "number" ? tr.duration : 0.3;
  const times = Array.isArray(tr.times) ? (tr.times as number[]) : undefined;
  const out: Record<string, unknown> = {};
  let changed = false;
  for (const [key, value] of Object.entries(target)) {
    if (Array.isArray(value) && value.length >= 3 && value.every((x) => typeof x === "number")) {
      const v = value as number[];
      const t = knotsFor(v.length, times);
      const m = splineTangents(v, t);
      const n = Math.max(12, Math.ceil(duration * SPLINE_FPS));
      out[key] = Array.from({ length: n }, (_, j) => splineAt(v, t, m, j / (n - 1)));
      changed = true;
    } else {
      out[key] = value;
    }
  }
  if (!changed) return [target, tr];
  const rest: Transition = { ...tr };
  delete (rest as { times?: unknown }).times;
  return [out as TargetAndTransition, { ...rest, ease: "linear" }];
};

type Controls = ReturnType<typeof useAnimationControls>;
/** Animation controls whose keyframe moves run along a spline (see smoothMove). */
const smoothControls = (c: Controls) => ({
  start: (target: TargetAndTransition, tr?: Transition) => c.start(...smoothMove(target, tr)),
  stop: () => c.stop(),
});

/**
 * Plays keyframes on a motion value along a spline that starts from wherever
 * the value is the moment the move actually begins (after any delay).
 */
const splineValue = (mv: MotionValue<number>, keys: number[], tr: Transition) => {
  const times = Array.isArray(tr.times) ? (tr.times as number[]) : undefined;
  const rest: Transition = { ...tr };
  delete (rest as { times?: unknown }).times;
  let curve: { v: number[]; t: number[]; m: number[] } | null = null;
  return animate(0, 1, {
    ...(rest as object),
    ease: "linear",
    onUpdate: (p: number) => {
      if (!curve) {
        const v = [mv.get(), ...keys];
        const t = knotsFor(v.length, times);
        curve = { v, t, m: splineTangents(v, t) };
      }
      mv.set(splineAt(curve.v, curve.t, curve.m, p));
    },
  });
};

// ─── Arms ─────────────────────────────────────────────────────────────────────
// Two joints per arm. `s` is the upper arm's angle from hanging straight down,
// positive = swinging outward (away from the body), 180 = straight up. `e` is
// the elbow bend added on top, positive = forearm turning further outward.
type Arm = { s: number; e: number };
const UPPER = 20;
const FORE = 18;
const SHOULDER = { l: { x: 33, y: 110 }, r: { x: 175, y: 108 } };

const ARMS = {
  rest: { s: 22, e: -8 },
  droop: { s: 6, e: 0 },
  low: { s: 12, e: -6 },
  up: { s: 155, e: 10 },
  open: { s: 125, e: 30 },
  guard: { s: 30, e: -150 },
  point: { s: 98, e: -8 },
  hip: { s: 42, e: -122 },
  palmsUp: { s: 65, e: 75 },
  loose: { s: 55, e: 35 },
  visor: { s: 165, e: 70 },
  hug: { s: 25, e: -115 },
  reachDown: { s: 10, e: 6 },
  scratch: { s: 165, e: 85 },
  plug: { s: 150, e: 110 },
  panic: { s: 140, e: -30 },
  bent: { s: 40, e: 50 },
  peek: { s: 150, e: 100 },
} satisfies Record<string, Arm>;

const armGeo = (side: -1 | 1, s: number, e: number) => {
  const o = side < 0 ? SHOULDER.l : SHOULDER.r;
  const a = (s * Math.PI) / 180;
  const b = ((s + e) * Math.PI) / 180;
  const ex = o.x + side * UPPER * Math.sin(a);
  const ey = o.y + UPPER * Math.cos(a);
  const hx = ex + side * FORE * Math.sin(b);
  const hy = ey + FORE * Math.cos(b);
  // Control point pushed past the elbow so the curve bends right through it.
  return { o, cx: 2 * ex - (o.x + hx) / 2, cy: 2 * ey - (o.y + hy) / 2, hx, hy };
};

type ArmMV = { s: MotionValue<number>; e: MotionValue<number> };

/**
 * Each arm is drawn twice, once behind the body and once over it, and only one
 * copy shows: over the body while the mitt is in front of it (on the hip,
 * plugging the cable, scratching), behind it while the arm hangs or waves at
 * his side. So the shoulder always tucks in and no pose has to say which.
 */
const RiffArm = ({
  side,
  arm,
  sway,
  layer,
  bold,
}: {
  side: -1 | 1;
  arm: ArmMV;
  sway: boolean;
  layer: "back" | "front";
  /** Small figure: thicker limbs and bigger mitts so they still read. */
  bold: boolean;
}) => {
  const w = bold ? 12 : 9;
  const hand = bold ? 9.5 : 7.5;
  const o = side < 0 ? SHOULDER.l : SHOULDER.r;
  const opacity = useTransform(() => {
    const { hx } = armGeo(side, arm.s.get(), arm.e.get());
    // 0 = fully behind, 1 = fully in front; a 4-unit band so the switch fades.
    const front = Math.min(1, Math.max(0, side < 0 ? (hx - 34) / 4 : (176 - hx) / 4));
    return layer === "front" ? front : 1 - front;
  });
  const d = useTransform(() => {
    const g = armGeo(side, arm.s.get(), arm.e.get());
    return `M${o.x},${o.y} Q${g.cx.toFixed(2)},${g.cy.toFixed(2)} ${g.hx.toFixed(2)},${g.hy.toFixed(2)}`;
  });
  const hx = useTransform(() => armGeo(side, arm.s.get(), arm.e.get()).hx);
  const hy = useTransform(() => armGeo(side, arm.s.get(), arm.e.get()).hy);
  return (
    <motion.g
      style={{ transformOrigin: `${o.x}px ${o.y}px`, opacity }}
      animate={sway ? { rotate: [0, side * 5, 0] } : { rotate: 0 }}
      transition={sway ? { duration: 2.2, repeat: Infinity, ease: EASE, delay: side > 0 ? 0.3 : 0 } : { duration: 0.3 }}>
      {/* Same flat, two-tone shading as the cabinet: a darker copy peeks out
          bottom-right, no outline. */}
      {!bold && <motion.path d={d} fill='none' stroke={C.armShade} strokeWidth={w} strokeLinecap='round' style={{ x: 1.2, y: 1.4 }} />}
      <motion.path d={d} fill='none' stroke={bold ? C.highlight : C.arm} strokeWidth={w} strokeLinecap='round' />
      <motion.circle cx={hx} cy={hy} r={hand} fill={bold ? C.piping : C.pipingShade} />
      {!bold && <motion.circle cx={hx} cy={hy} r={hand - 1.1} fill={C.piping} style={{ x: -1, y: -1.1 }} />}
    </motion.g>
  );
};

const NEUTRAL: Body = { rotate: 0, scaleX: 1, scaleY: 1, y: 0, skewX: 0 };
const OPEN_L: Lid = { left: 0.1, right: 0.2 };
const OPEN_R: Lid = { left: 0.2, right: 0.1 };
const SHUT: Lid = { left: 1.05, right: 1.05 };
const LOOK: Record<LookAt, { x: number; y: number }> = {
  left: { x: -4.5, y: 0.5 },
  right: { x: 4.5, y: 0.5 },
  up: { x: 0, y: -4.5 },
  down: { x: -1, y: 4.5 },
};
const side = (lookAt?: LookAt) => (lookAt === "left" ? -1 : lookAt === "right" ? 1 : 0);

const poseFor = (mood: RiffMood, lookAt: LookAt | undefined, eyesClosed: boolean): Pose => {
  const base: Pose = {
    body: NEUTRAL,
    lidL: OPEN_L,
    lidR: OPEN_R,
    pupilL: { x: 0, y: 0 },
    pupilR: { x: 0, y: 0 },
    mouth: "smile",
    lamp: C.lamp,
    unplugged: false,
    slack: false,
    handleUp: 0,
    armL: ARMS.rest,
    armR: ARMS.rest,
  };
  const look = lookAt ? LOOK[lookAt] : null;
  const s = side(lookAt);
  let pose: Pose = base;
  switch (mood) {
    case "asleep":
      pose = { ...base, body: { rotate: 7, scaleX: 1.06, scaleY: 0.88, y: 2, skewX: 0 }, lidL: SHUT, lidR: SHUT, mouth: "sleep", lamp: C.lampOff, slack: true, armL: ARMS.droop, armR: ARMS.droop };
      break;
    case "standby":
      pose = { ...base, body: { ...NEUTRAL, rotate: 3, scaleY: 0.95, scaleX: 1.02 }, lidL: { left: 0.52, right: 0.56 }, lidR: { left: 0.56, right: 0.52 }, pupilL: { x: 0, y: 2.5 }, pupilR: { x: 0, y: 2.5 }, mouth: "flat", lamp: C.lampDim, armL: ARMS.low, armR: ARMS.low };
      break;
    case "focus":
      pose = { ...base, body: { rotate: 0, scaleX: 1.08, scaleY: 0.88, y: 0, skewX: -4 }, lidL: { left: 0.22, right: 0.62 }, lidR: { left: 0.62, right: 0.22 }, pupilL: { x: 1.5, y: 2.5 }, pupilR: { x: -1.5, y: 2.5 }, mouth: "flat", armL: ARMS.guard, armR: ARMS.guard };
      break;
    case "nudge":
      pose = { ...base, body: { ...NEUTRAL, rotate: (s || 1) * 8, skewX: (s || 1) * -6 }, lidR: { left: 0.42, right: 0.36 }, pupilL: look ?? LOOK.right, pupilR: look ?? LOOK.right, mouth: "smile", armL: s < 0 ? ARMS.point : ARMS.hip, armR: s < 0 ? ARMS.hip : ARMS.point };
      break;
    case "shrug":
      pose = { ...base, body: { ...NEUTRAL, rotate: (s || -1) * 6, scaleY: 1.02 }, lidL: { left: 0.3, right: 0.1 }, lidR: { left: 0.1, right: 0.3 }, pupilL: look ?? LOOK.left, pupilR: look ?? LOOK.left, mouth: "wavy", handleUp: -5, armL: ARMS.palmsUp, armR: ARMS.palmsUp };
      break;
    case "dizzy":
      pose = { ...base, body: { ...NEUTRAL, rotate: -5 }, lidL: { left: 0.2, right: 0.3 }, lidR: { left: 0.3, right: 0.2 }, mouth: "wavy", armL: ARMS.loose, armR: ARMS.loose };
      break;
    case "lookAround":
      pose = { ...base, mouth: "flat", armR: ARMS.visor };
      break;
    case "warmup":
      pose = { ...base, body: { ...NEUTRAL, scaleY: 0.96 }, lidL: { left: 0.45, right: 0.5 }, lidR: { left: 0.5, right: 0.45 }, mouth: "o", lamp: C.lampDim, armL: ARMS.hug, armR: ARMS.hug };
      break;
    case "unplugged":
      pose = { ...base, body: { rotate: -10, scaleX: 1, scaleY: 0.96, y: 0, skewX: 5 }, unplugged: true, pupilL: look ?? LOOK.down, pupilR: look ?? LOOK.down, lidL: { left: 0.28, right: 0.32 }, lidR: { left: 0.32, right: 0.28 }, mouth: "o", armL: ARMS.reachDown, armR: ARMS.scratch };
      break;
    case "plugIn":
      pose = { ...base, pupilL: { x: -3, y: 3 }, pupilR: { x: -3, y: 3 }, mouth: "grin", armL: ARMS.plug };
      break;
    case "error":
      pose = { ...base, body: { rotate: 7, scaleX: 1.03, scaleY: 0.95, y: 0, skewX: 0 }, pupilL: { x: -3.5, y: -3 }, pupilR: { x: 3.5, y: 3 }, lidL: { left: 0.05, right: 0.3 }, lidR: { left: 0.35, right: 0.12 }, mouth: "frown", armL: ARMS.panic, armR: ARMS.panic };
      break;
    case "celebrate":
    case "hop":
    case "levelUp":
      pose = { ...base, mouth: "grin", armL: mood === "levelUp" ? ARMS.up : ARMS.open, armR: mood === "levelUp" ? ARMS.up : ARMS.open };
      break;
    case "listen":
      pose = { ...base, armL: ARMS.bent, armR: ARMS.bent };
      break;
    default:
      break;
  }
  if (eyesClosed) pose = { ...pose, lidL: SHUT, lidR: SHUT, mouth: "flat", armL: ARMS.peek, armR: ARMS.peek };
  return pose;
};

const lidPath = (cx: number, cy: number, r: number, lid: Lid) =>
  `M${cx - r - 3},${cy - r - 3} L${cx + r + 3},${cy - r - 3} L${cx + r + 3},${cy - r + 2 * r * lid.right} L${cx - r - 3},${cy - r + 2 * r * lid.left} Z`;

// ─── Eyes ─────────────────────────────────────────────────────────────────────
const Eye = ({
  cx,
  cy,
  r,
  clipId,
  lid,
  pupil,
  look,
  instant,
}: {
  cx: number;
  cy: number;
  r: number;
  clipId: string;
  lid: Lid;
  pupil: { x: number; y: number };
  look: ReturnType<typeof useAnimationControls>;
  instant: boolean;
}) => (
  <>
    <clipPath id={clipId}>
      <circle cx={cx} cy={cy} r={r} />
    </clipPath>
    <g clipPath={`url(#${clipId})`}>
      <circle cx={cx} cy={cy} r={r} fill={C.eyeShade} />
      <circle cx={cx - r * 0.14} cy={cy - r * 0.16} r={r * 0.92} fill={C.white} />
      <motion.g initial={false} animate={pupil} transition={instant ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 20 }}>
        <motion.g animate={look}>
          <circle cx={cx - 1.5} cy={cy + 1.5} r={r * 0.52} fill={C.navy} />
          <circle cx={cx - 1.5 - r * 0.2} cy={cy + 1.5 - r * 0.22} r={r * 0.17} fill={C.white} />
        </motion.g>
      </motion.g>
      <motion.path
        initial={false}
        animate={{ d: lidPath(cx, cy, r, lid) }}
        transition={instant ? { duration: 0 } : { duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        fill={C.navy}
      />
    </g>
  </>
);

const HappyEye = ({ cx, cy, r, clipId }: { cx: number; cy: number; r: number; clipId: string }) => (
  <>
    <clipPath id={clipId}>
      <circle cx={cx} cy={cy} r={r} />
    </clipPath>
    <g clipPath={`url(#${clipId})`}>
      <circle cx={cx} cy={cy} r={r} fill={C.eyeShade} />
      <circle cx={cx - r * 0.14} cy={cy - r * 0.16} r={r * 0.92} fill={C.white} />
      <circle cx={cx} cy={cy + r * 0.62} r={r * 1.08} fill={C.navy} />
    </g>
  </>
);

// ─── Sound ────────────────────────────────────────────────────────────────────
const BEAT_GAP = 0.64;
const ARCS = [
  { r: 14, lag: 0, travel: 20 },
  { r: 22, lag: 0.09, travel: 30 },
];
const arcPath = (s: number, r: number) => `M0,${-r} C${s * r * 0.58},${-r * 0.5} ${s * r * 0.58},${r * 0.5} 0,${r}`;

const SoundBeat = ({ beat }: { beat: number }) => (
  <>
    {[-1, 1].map((s) => (
      <g key={s} transform={`translate(${s > 0 ? 184 : 16} 118)`}>
        {ARCS.map((a) => (
          <motion.path
            key={a.r}
            d={arcPath(s, a.r)}
            fill='none'
            stroke={C.piping}
            strokeLinecap='round'
            style={{ transformBox: "fill-box", transformOrigin: s > 0 ? "0% 50%" : "100% 50%" }}
            initial={{ opacity: 0, x: 0, scale: 0.6, strokeWidth: 5 }}
            animate={{ opacity: [0, 0.95, 0], x: s * a.travel, scale: 1.25, strokeWidth: 1.5 }}
            transition={{ duration: 0.75, delay: beat * BEAT_GAP + a.lag, ease: "easeOut" }}
          />
        ))}
      </g>
    ))}
  </>
);

const BassRing = ({ beat }: { beat: number }) => (
  <motion.circle
    cx='99'
    cy='128.5'
    r='26'
    fill='none'
    stroke={C.piping}
    style={{ transformBox: "fill-box", transformOrigin: "50% 50%" }}
    initial={{ opacity: 0, scale: 1, strokeWidth: 4 }}
    animate={{ opacity: [0, 0.5, 0], scale: 3.4, strokeWidth: 1 }}
    transition={{ duration: 0.8, delay: beat * BEAT_GAP, ease: "easeOut" }}
  />
);

// ─── Effects around him ───────────────────────────────────────────────────────
const loop = (duration: number, delay = 0, repeatDelay = 0): Transition => ({ duration, delay, repeat: Infinity, repeatDelay, ease: "easeOut" });

const Zzz = () => (
  <g fontFamily='Georgia, serif' fontWeight='700' fill={C.piping}>
    {[0, 1, 2].map((i) => (
      <motion.text
        key={i}
        x={150}
        y={44}
        fontSize={12 + i * 5}
        initial={{ opacity: 0, x: 0, y: 0 }}
        animate={{ opacity: [0, 1, 0], x: [0, 10 + i * 8], y: [0, -26 - i * 10] }}
        transition={loop(2.4, i * 0.8)}>
        z
      </motion.text>
    ))}
  </g>
);

const STAR = "M0,-6 L1.6,-1.6 L6,0 L1.6,1.6 L0,6 L-1.6,1.6 L-6,0 L-1.6,-1.6 Z";
const DizzyStars = () => (
  <g transform='translate(100 30)'>
    <g transform='scale(1 0.4)'>
      <motion.g animate={{ rotate: 360 }} transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}>
        {[0, 120, 240].map((a) => (
          <g key={a} transform={`rotate(${a}) translate(36 0)`}>
            <g transform='scale(1 2.5)'>
              <path d={STAR} fill={C.star} />
            </g>
          </g>
        ))}
      </motion.g>
    </g>
  </g>
);

const Smoke = () => (
  <g>
    {[0, 1, 2].map((i) => (
      <motion.circle
        key={i}
        cx={122 + i * 6}
        cy={42}
        r={6 + i * 2}
        fill={C.smoke}
        initial={{ opacity: 0, y: 0, scale: 0.5 }}
        animate={{ opacity: [0, 0.6, 0], y: -34 - i * 6, x: 8 + i * 4, scale: 1.6 }}
        transition={loop(1.8, i * 0.55)}
      />
    ))}
    {[0, 1].map((i) => (
      <motion.path
        key={`spark-${i}`}
        d={i ? "M36,74 L28,70 M36,74 L30,80 M36,74 L26,76" : "M164,92 L172,86 M164,92 L174,94 M164,92 L170,100"}
        stroke={C.star}
        strokeWidth={LINE}
        strokeLinecap='round'
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0, 0] }}
        transition={{ duration: 0.5, times: [0, 0.2, 0.5, 1], repeat: Infinity, repeatDelay: 1.6 + i * 0.7, delay: i * 0.9 }}
      />
    ))}
  </g>
);

const Mark = ({ char, x = 156 }: { char: "?" | "!"; x?: number }) => (
  <motion.text
    x={x}
    y={40}
    fontFamily='Georgia, serif'
    fontWeight='700'
    fontSize='34'
    fill={C.panel}
    textAnchor='middle'
    style={{ transformBox: "fill-box", transformOrigin: "50% 100%" }}
    initial={{ opacity: 0, scale: 0.3, y: 10 }}
    animate={{ opacity: 1, scale: [0.3, 1.25, 1], y: 0, rotate: [0, -10, 6, 0] }}
    transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}>
    {char}
  </motion.text>
);

const Heat = () => (
  <g fill='none' stroke={C.lamp} strokeWidth={LINE} strokeLinecap='round'>
    {[0, 1, 2].map((i) => (
      <motion.path
        key={i}
        d={`M${84 + i * 14},40 C${80 + i * 14},34 ${88 + i * 14},30 ${84 + i * 14},24`}
        initial={{ opacity: 0, y: 0 }}
        animate={{ opacity: [0, 0.7, 0], y: -14 }}
        transition={loop(1.6, i * 0.4)}
      />
    ))}
  </g>
);

const Burst = ({ delay }: { delay: number }) => (
  <g transform='translate(99 100)'>
    {Array.from({ length: 10 }, (_, i) => (
      <g key={i} transform={`rotate(${i * 36})`}>
        <motion.path
          d='M0,-92 L0,-108'
          stroke={i % 2 ? C.panel : C.piping}
          strokeWidth='5'
          strokeLinecap='round'
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: [0, 1, 0], y: -10 }}
          transition={{ duration: 0.7, delay, ease: "easeOut" }}
        />
      </g>
    ))}
  </g>
);

// ─── Cable ────────────────────────────────────────────────────────────────────
// Tucks behind the cabinet right away and comes out on the floor below, so it
// never tangles with the left arm.
const CABLE_IN = "M44,84 C36,90 33,96 34,106 C35,150 34,178 4,183";
const CABLE_OUT = "M30,170 C22,174 16,167 9,171 C3,175 0,181 -8,183";

const PlugInCable = ({ delay }: { delay: number }) => (
  <>
    <motion.path
      fill='none'
      stroke={C.cable}
      strokeWidth='5.5'
      strokeLinecap='round'
      initial={{ d: CABLE_OUT }}
      animate={{ d: CABLE_IN }}
      transition={{ duration: 0.55, delay, ease: [0.34, 1.3, 0.64, 1] }}
    />
    <motion.g
      initial={{ x: -18, y: 86, rotate: -60 }}
      animate={{ x: 0, y: 0, rotate: 0 }}
      transition={{ duration: 0.55, delay, ease: [0.34, 1.3, 0.64, 1] }}
      style={{ transformOrigin: "45px 85px" }}>
      <path d='M48,82 L42,87' stroke={C.metal} strokeWidth='6.5' strokeLinecap='round' />
      <path d='M42.5,86.5 L39,89.5' stroke={C.cable} strokeWidth='6' strokeLinecap='round' />
    </motion.g>
  </>
);

// ─── Reactions ────────────────────────────────────────────────────────────────
const PARTY_TIMES = [0, 0.1, 0.3, 0.45, 0.55, 0.68, 0.82, 1];
const PARTY_DURATION = 2.2;
const PUMP: Transition = { duration: 0.32, repeat: 5, repeatType: "reverse", ease: EASE };
const BOP: TargetAndTransition = { y: [0, 3, -16, 0, 0], scaleX: [1, 1.08, 0.95, 1.06, 1], scaleY: [1, 0.9, 1.08, 0.94, 1] };

type Action = "glance" | "bop" | "groove" | "knob" | "spin" | "wave" | "stretch" | "airGuitar";
const ACTIONS: Action[] = ["wave", "glance", "bop", "groove", "airGuitar", "knob", "stretch", "bop", "wave", "spin"];

export const Riff = ({
  mood = "idle",
  className,
  delay = 0,
  lively = false,
  arrive = false,
  short = false,
  lookAt,
  eyesClosed = false,
  signal = 0,
  talking = false,
}: RiffProps) => {
  const reduceMotion = !!useReducedMotion();
  const svgRef = useRef<SVGSVGElement>(null);
  // Below ~96 px tall the fine detail (shading bands, knob shadows, the badge
  // lettering) turns to mush, so a simplified drawing takes over.
  const [small, setSmall] = useState(false);
  // Loops only run while he is on screen and the tab is in front.
  const [onScreen, setOnScreen] = useState(true);
  const [pageVisible, setPageVisible] = useState(true);
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return undefined;
    const cleanups: (() => void)[] = [];
    if (typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver(([entry]) => setSmall(entry.contentRect.height > 0 && entry.contentRect.height < 96));
      ro.observe(el);
      cleanups.push(() => ro.disconnect());
    }
    if (typeof IntersectionObserver !== "undefined") {
      const io = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), { rootMargin: "120px" });
      io.observe(el);
      cleanups.push(() => io.disconnect());
    }
    const onVisibility = () => setPageVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    cleanups.push(() => document.removeEventListener("visibilitychange", onVisibility));
    return () => cleanups.forEach((fn) => fn());
  }, []);
  const awake = onScreen && pageVisible;
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const id = (name: string) => `riff-${uid}-${name}`;

  const actionCtl = useAnimationControls();
  const shadowCtl = useAnimationControls();
  const cableCtl = useAnimationControls();
  const lookCtl = useAnimationControls();
  const action = useMemo(() => smoothControls(actionCtl), [actionCtl]);
  const shadow = useMemo(() => smoothControls(shadowCtl), [shadowCtl]);
  const cable = useMemo(() => smoothControls(cableCtl), [cableCtl]);
  const look = useMemo(() => smoothControls(lookCtl), [lookCtl]);
  const knob = useAnimationControls();
  const knob2 = useAnimationControls();
  const cone = useAnimationControls();
  const handleCtl = useAnimationControls();
  const handle = useMemo(() => smoothControls(handleCtl), [handleCtl]);
  const lamp = useAnimationControls();

  const pose = poseFor(mood, lookAt, eyesClosed);
  const [happy, setHappy] = useState(false);
  const [waves, setWaves] = useState(0);
  const [beats, setBeats] = useState(1);
  const [burst, setBurst] = useState(0);
  const [syllable, setSyllable] = useState<MouthShape | null>(null);
  const busy = useRef(false);
  // Declared before every other effect, so on unmount it flips first and no
  // cleanup below tries to animate a component that is going away.
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const prevMood = useRef<RiffMood | null>(null);

  // ── Arms: motion values driven by pose springs and gesture keyframes ──
  const lS = useMotionValue(pose.armL.s);
  const lE = useMotionValue(pose.armL.e);
  const rS = useMotionValue(pose.armR.s);
  const rE = useMotionValue(pose.armR.e);
  const armL = useMemo<ArmMV>(() => ({ s: lS, e: lE }), [lS, lE]);
  const armR = useMemo<ArmMV>(() => ({ s: rS, e: rE }), [rS, rE]);
  const poseRef = useRef(pose);
  useEffect(() => {
    poseRef.current = pose;
  });
  const armRuns = useRef(new Set<{ stop: () => void }>());
  const armGen = useRef(0);
  const settleArms = () => {
    const p = poseRef.current;
    const tr: Transition = reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 170, damping: 13 };
    animate(lS, p.armL.s, tr);
    animate(lE, p.armL.e, tr);
    animate(rS, p.armR.s, tr);
    animate(rE, p.armR.e, tr);
  };
  const stopArms = () => {
    armRuns.current.forEach((r) => r.stop());
    armRuns.current.clear();
  };
  type Move = { arm: ArmMV; s: number[]; e: number[] };
  /** Keyframes start from where the arm is now; afterwards it springs back to the pose. */
  const gesture = (moves: Move[], tr: Transition, settle = true) => {
    const gen = ++armGen.current;
    const runs = moves.flatMap(({ arm, s, e }) => [
      splineValue(arm.s, s, tr),
      splineValue(arm.e, e, tr),
    ]);
    runs.forEach((r) => armRuns.current.add(r));
    const done = Promise.all(runs).then(() => {
      runs.forEach((r) => armRuns.current.delete(r));
      if (settle && mounted.current && gen === armGen.current) settleArms();
    });
    return done;
  };
  const gestureRef = useRef({ gesture, settleArms, stopArms });
  useEffect(() => {
    gestureRef.current = { gesture, settleArms, stopArms };
  });

  // A new held pose (mood, look direction, closed eyes) springs the arms there.
  useEffect(() => {
    armGen.current += 1;
    gestureRef.current.settleArms();
  }, [pose.armL.s, pose.armL.e, pose.armR.s, pose.armR.e, reduceMotion]);

  // Listening, the mouth opens with the input level instead of in syllables.
  const level = Math.max(0, Math.min(1, signal));
  const listenMouth: MouthShape | null =
    mood === "listen" && !reduceMotion ? (level > 0.6 ? "open" : level > 0.3 ? "mid" : level > 0.1 ? "o" : null) : null;
  const mouth: MouthShape = (talking ? syllable : null) ?? listenMouth ?? syllable ?? (happy ? "grin" : pose.mouth);

  useEffect(() => {
    lamp.start({ fill: pose.lamp }, { duration: reduceMotion ? 0 : 0.25 });
  }, [lamp, pose.lamp, reduceMotion]);

  useEffect(() => {
    cable.start({ rotate: pose.slack ? -6 : 0 }, { duration: reduceMotion ? 0 : 0.4 });
    handle.start({ y: pose.handleUp }, { duration: reduceMotion ? 0 : 0.35 });
  }, [cable, handle, pose.slack, pose.handleUp, reduceMotion]);

  // ── Talking: the mouth flaps through syllables, the body nods along ──
  useEffect(() => {
    if (!talking || reduceMotion) return undefined;
    let i = Math.floor(Math.random() * TALK.length);
    const tick = setInterval(() => {
      i = (i + 1 + Math.floor(Math.random() * 3)) % TALK.length;
      setSyllable(TALK[i]);
    }, 125);
    action.start({ y: [0, -3, 0], scaleY: [1, 1.02, 1] }, { duration: 0.32, repeat: Infinity, ease: EASE });
    cone.start({ scale: [1, 1.07] }, { duration: 0.16, repeat: Infinity, repeatType: "reverse" });
    // Talks with his hands: the free arm explains, the other chips in.
    const g = gestureRef.current;
    g.gesture(
      [
        { arm: armR, s: [70, 105, 60, 95, 70], e: [70, 40, 85, 50, 70] },
        { arm: armL, s: [30, 45, 30, 50, 30], e: [10, 40, 0, 30, 10] },
      ],
      { duration: 2, repeat: Infinity, ease: EASE },
      false,
    );
    return () => {
      clearInterval(tick);
      if (!mounted.current) return;
      gestureRef.current.stopArms();
      gestureRef.current.settleArms();
      setSyllable(null);
      action.start({ y: 0, scaleY: 1 }, { duration: 0.2 });
      cone.start({ scale: 1 }, { duration: 0.15 });
    };
  }, [talking, reduceMotion, action, cone, armL, armR]);

  // ── Entry reactions: played once when a mood is entered ──
  useEffect(() => {
    const from = prevMood.current;
    prevMood.current = mood;
    const g = gestureRef.current;
    g.settleArms();
    if (reduceMotion) return undefined;
    const both = (s: number[], e: number[]): Move[] => [
      { arm: armL, s, e },
      { arm: armR, s, e },
    ];

    const timers: ReturnType<typeof setTimeout>[] = [];
    const later = (s: number, fn: () => void) => timers.push(setTimeout(fn, s * 1000));
    const d = 0.25 + delay;
    const hop = (scale = 1, at = d) => {
      const tr: Transition = { duration: 0.62, delay: at, ease: EASE };
      action.start({ ...BOP, y: (BOP.y as number[]).map((v) => v * scale) }, tr);
      shadow.start({ scaleX: [1, 1.06, 0.7, 1.06, 1] }, tr);
      cable.start({ rotate: [0, -6, 14, -6, 0] }, { ...tr, duration: 0.8, delay: at + 0.08 });
      g.gesture(both([168, 150], [8, 25]), { duration: 0.62, delay: at, ease: "easeOut" });
    };
    const happyFor = (at: number, len: number) => {
      later(at, () => setHappy(true));
      later(at + len, () => setHappy(false));
    };
    const sound = (n: number, at: number) =>
      later(at, () => {
        setBeats(n);
        setWaves((w) => w + 1);
      });

    if (from === "asleep" && mood !== "asleep") {
      // Startled awake: jolt up, lamp sputters on, a big hop.
      lamp.start({ fill: [C.lampOff, C.lamp, C.lampOff, C.lamp] }, { duration: 0.45, delay: 0.1 });
      action.start({ y: [0, -10, 0], scaleY: [1, 1.12, 1] }, { duration: 0.35, delay: 0.1 });
      hop(1.4, 0.55);
      happyFor(0.55, 1);
      return () => {
        timers.forEach(clearTimeout);
        g.stopArms();
      };
    }

    switch (mood) {
      case "celebrate": {
        if (short) {
          hop(1.6);
          later(d + 0.62, () => hop(0.8, 0));
          happyFor(d, 1.6);
          cone.start({ scale: [1, 1.12] }, { duration: 0.3, repeat: 3, repeatType: "reverse", delay: d + 0.3 });
          sound(2, d + 0.3);
          break;
        }
        const t: Transition = { duration: PARTY_DURATION, delay: d, times: PARTY_TIMES, ease: EASE };
        action.start(
          {
            y: [0, 4, -34, 0, 3, -14, 0, 0],
            scaleX: [1, 1.12, 0.9, 1.12, 1.04, 0.96, 1.03, 1],
            scaleY: [1, 0.84, 1.12, 0.86, 0.95, 1.06, 0.97, 1],
            rotate: [0, 0, -10, 5, 0, 8, -5, 0],
          },
          t,
        );
        shadow.start({ scaleX: [1, 1.1, 0.5, 1.12, 1.03, 0.75, 1.03, 1], opacity: [0.5, 0.55, 0.18, 0.55, 0.5, 0.3, 0.5, 0.5] }, t);
        cable.start({ rotate: [0, -8, 20, -14, 9, -11, 5, 0] }, { ...t, delay: d + 0.1 });
        cone.start({ scale: [1, 1.14] }, { ...PUMP, delay: d + 0.45 });
        knob.start({ rotate: [0, 300, 300] }, { duration: 1.1, delay: d + 0.25, times: [0, 0.7, 1], ease: "easeOut" });
        knob2.start({ rotate: [0, -260, -260] }, { duration: 1.1, delay: d + 0.35, times: [0, 0.7, 1], ease: "easeOut" });
        lamp.start({ fill: [C.lampOff, C.lamp] }, { duration: 0.15, delay: d + 0.7 });
        g.gesture(both([170, 118, 172, 118, 172, 140], [8, 45, 5, 45, 5, 25]), { duration: PARTY_DURATION, delay: d, ease: EASE });
        happyFor(d + 0.05, 2.5);
        sound(3, d + 0.5);
        later(d + 0.7, () => setBurst((b) => b + 1));
        // Then keeps waving while the party lasts.
        later(d + PARTY_DURATION + 0.5, () =>
          g.gesture([{ arm: armR, s: [150, 125, 150, 125], e: [-20, 35, -20, 35] }], { duration: 1.3, repeat: Infinity, repeatDelay: 1.6, ease: EASE }, false),
        );
        break;
      }
      case "hop":
        hop(1.4);
        happyFor(d, 1);
        sound(1, d + 0.3);
        break;
      case "levelUp":
        // Both small knobs sweep right round to max, overshoot, settle on 11.
        action.start({ scaleY: [1, 0.9, 0.9], scaleX: [1, 1.06, 1.06] }, { duration: 0.4, delay: d });
        // Flexes while the knobs crank, then both fists go up and keep pumping.
        g.gesture(both([40, 40], [115, 125]), { duration: 0.9, delay: d, ease: "easeOut" }, false);
        later(d + 2.3, () =>
          g.gesture(
            [
              { arm: armL, s: [172, 150, 155], e: [0, 15, 10] },
              { arm: armR, s: [150, 172, 155], e: [15, 0, 10] },
            ],
            { duration: 0.9, repeat: Infinity, repeatDelay: 0.7, ease: EASE },
            false,
          ),
        );
        knob.start({ rotate: [0, 320, 290, 300] }, { duration: 1.1, delay: d, times: [0, 0.6, 0.8, 1], ease: "easeOut" });
        knob2.start({ rotate: [0, 270, 245, 255] }, { duration: 1.1, delay: d + 0.12, times: [0, 0.6, 0.8, 1], ease: "easeOut" });
        lamp.start({ fill: [C.lamp, "#ffe0b3", C.lamp] }, { duration: 0.6, delay: d + 1.0 });
        later(d + 1.0, () => {
          hop(2.4, 0);
          setBurst((b) => b + 1);
        });
        happyFor(d + 1.0, 1.8);
        sound(2, d + 1.1);
        break;
      case "focus":
        action.start({ y: [0, -6, 0], scaleY: [1, 1.06, 1] }, { duration: 0.45, delay: d });
        look.start({ x: [0, -2, 2, 0] }, { duration: 0.6, delay: d + 0.4 });
        // Boxer on the balls of his feet, throwing the odd jab.
        later(d + 0.5, () => action.start({ y: [0, -3, 0] }, { duration: 0.5, repeat: Infinity, ease: EASE }));
        g.gesture([{ arm: armR, s: [60, 30], e: [-175, -150] }], { duration: 0.35, delay: d + 0.8, repeat: Infinity, repeatDelay: 1.9 }, false);
        later(d + 1.9, () => g.gesture([{ arm: armL, s: [60, 30], e: [-175, -150] }], { duration: 0.35, repeat: Infinity, repeatDelay: 1.9 }, false));
        break;
      case "nudge":
        action.start({ rotate: [0, side(lookAt) * 6 || 6, 0, side(lookAt) * 4 || 4, 0] }, { duration: 0.9, delay: d, ease: EASE });
        // Over there! The pointing arm jabs again and again.
        g.gesture([{ arm: side(lookAt) < 0 ? armL : armR, s: [112, 98], e: [-28, -8] }], { duration: 0.45, delay: d + 0.3, repeat: Infinity, repeatDelay: 1.2 }, false);
        break;
      case "shrug": {
        const tr: Transition = { duration: 1, delay: d + 0.3, times: [0, 0.25, 0.5, 0.75, 1], ease: EASE, repeat: Infinity, repeatDelay: 2.4 };
        handle.start({ y: [-5, -14, -5, -11, -5] }, tr);
        action.start({ y: [0, -7, 0, -5, 0], rotate: [0, 4, 0, -3, 0] }, tr);
        cable.start({ rotate: [0, 8, -4, 5, 0] }, { ...tr, delay: d + 0.4 });
        g.gesture(both([88, 65, 82, 65], [100, 75, 95, 75]), tr, false);
        break;
      }
      case "dizzy":
        look.start({ x: [0, 4, 0, -4, 0], y: [-4, 0, 4, 0, -4] }, { duration: 0.7, delay: d, repeat: 3, ease: "linear" });
        knob.start({ rotate: [0, 720] }, { duration: 1.6, delay: d, ease: EASE });
        knob2.start({ rotate: [0, -720] }, { duration: 1.6, delay: d, ease: EASE });
        action.start({ rotate: [0, -8, 8, -6, 6, -3, 0], x: [0, -4, 4, -3, 3, 0, 0] }, { duration: 2, delay: d, ease: EASE });
        cable.start({ rotate: [0, 10, -10, 7, -6, 3, 0] }, { duration: 2, delay: d + 0.1 });
        g.gesture([{ arm: armL, s: [85, 35, 55], e: [5, 70, 35] }], { duration: 1.1, delay: d, repeat: Infinity, ease: EASE }, false);
        g.gesture([{ arm: armR, s: [35, 85, 55], e: [70, 5, 35] }], { duration: 1.1, delay: d + 0.3, repeat: Infinity, ease: EASE }, false);
        break;
      case "lookAround":
        look.start(
          { x: [0, -4.5, -4.5, 4.5, 4.5, 0], y: [0, 0.5, 0.5, 0.5, 0.5, 0] },
          { duration: 3.2, delay: d, times: [0, 0.15, 0.4, 0.55, 0.85, 1], repeat: Infinity, repeatDelay: 1.2 },
        );
        action.start(
          { rotate: [0, -6, -6, 6, 6, 0], skewX: [0, 6, 6, -6, -6, 0] },
          { duration: 3.2, delay: d, times: [0, 0.15, 0.4, 0.55, 0.85, 1], repeat: Infinity, repeatDelay: 1.2 },
        );
        break;
      case "warmup":
        lamp.start({ fill: [C.lampDim, C.lamp, C.lampDim] }, { duration: 1.6, delay: d, repeat: Infinity, ease: EASE });
        action.start({ scaleY: [1, 1.03, 1], y: [0, -2, 0] }, { duration: 1.6, delay: d, repeat: Infinity, ease: EASE });
        // Rubbing his sides to warm up.
        g.gesture(
          [
            { arm: armL, s: [30, 22, 25], e: [-100, -125, -115] },
            { arm: armR, s: [22, 30, 25], e: [-125, -100, -115] },
          ],
          { duration: 0.5, delay: d, repeat: Infinity, ease: EASE },
          false,
        );
        break;
      case "unplugged":
        look.start({ x: [0, 0, -1.5, 0], y: [0, 0, 1, 0] }, { duration: 2.4, delay: d + 1, repeat: Infinity, repeatDelay: 2 });
        action.start({ rotate: [0, -3, 0] }, { duration: 2.4, delay: d + 1, repeat: Infinity, repeatDelay: 2, ease: EASE });
        // Scratches his head over the loose cable.
        g.gesture([{ arm: armR, s: [168, 162, 168, 162, 165], e: [100, 80, 100, 80, 85] }], { duration: 0.9, delay: d + 0.6, repeat: Infinity, repeatDelay: 1.8 }, false);
        g.gesture([{ arm: armL, s: [4, 16, 10], e: [14, -4, 6] }], { duration: 2.4, delay: d + 1, repeat: Infinity, repeatDelay: 2, ease: EASE }, false);
        break;
      case "plugIn":
        action.start({ rotate: [0, -8, -8, 0], skewX: [0, 4, 4, 0] }, { duration: 0.8, delay: d, times: [0, 0.3, 0.7, 1] });
        lamp.start({ fill: [C.lampOff, C.lampOff, C.lamp, C.lampOff, C.lamp] }, { duration: 1.1, times: [0, 0.6, 0.7, 0.8, 1], delay: d });
        // Pushes the plug home with his own hand, then throws both arms up.
        g.gesture([{ arm: armL, s: [150, 150], e: [110, 110] }], { duration: 0.8, delay: d, ease: "easeOut" }, false);
        later(d + 0.75, () => hop(2, 0));
        happyFor(d + 0.75, 1.2);
        sound(2, d + 0.8);
        break;
      case "error":
        lamp.start(
          { fill: [C.lamp, C.lampOff, C.lamp, C.lampOff, C.lampOff, C.lamp, C.lampOff] },
          { duration: 1.4, delay: d, repeat: Infinity, repeatDelay: 1.6, times: [0, 0.1, 0.18, 0.3, 0.6, 0.66, 0.75] },
        );
        action.start({ x: [0, -3, 3, -2, 2, 0] }, { duration: 0.4, delay: d, repeat: Infinity, repeatDelay: 2.6 });
        g.gesture([{ arm: armL, s: [158, 128, 150, 140], e: [-8, -48, -18, -30] }], { duration: 0.8, delay: d, repeat: Infinity, ease: EASE }, false);
        g.gesture([{ arm: armR, s: [128, 158, 135, 140], e: [-48, -8, -40, -30] }], { duration: 0.8, delay: d + 0.15, repeat: Infinity, ease: EASE }, false);
        break;
      default:
        break;
    }
    return () => {
      timers.forEach(clearTimeout);
      g.stopArms();
    };
    // Only a change of mood replays an entry reaction.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mood, reduceMotion]);

  // ── Listen: speaker and mouth follow the input level ──
  const lastWave = useRef(0);
  useEffect(() => {
    if (mood !== "listen" || reduceMotion) return;
    cone.start({ scale: 1 + level * 0.18 }, { type: "spring", stiffness: 500, damping: 18 });
    const now = Date.now();
    if (level > 0.55 && now - lastWave.current > 650) {
      lastWave.current = now;
      queueMicrotask(() => {
        setBeats(1);
        setWaves((w) => w + 1);
      });
      action.start({ y: [0, -6, 0], scaleY: [1, 1.05, 1] }, { duration: 0.3 });
      gestureRef.current.gesture(
        [
          { arm: armL, s: [75, 40], e: [80, 50] },
          { arm: armR, s: [75, 40], e: [80, 50] },
        ],
        { duration: 0.35, ease: "easeOut" },
      );
    }
  }, [mood, level, reduceMotion, cone, action, armL, armR]);

  // ── Small idle actions ──
  const play = async (act: Action) => {
    if (busy.current) return;
    busy.current = true;
    if (act === "glance") {
      action.start({ rotate: [0, -5, -5, 5, 5, 0], skewX: [0, 4, 4, -4, -4, 0] }, { duration: 2.2, times: [0, 0.1, 0.4, 0.52, 0.85, 1] });
      await look.start({ x: [0, -4, -4, 4, 4, 0], y: [0, 0, 0, -1, -1, 0] }, { duration: 2.2, times: [0, 0.1, 0.4, 0.52, 0.85, 1] });
    } else if (act === "wave") {
      setHappy(true);
      action.start({ rotate: [0, -4, -4, 0] }, { duration: 1.5 });
      await gesture([{ arm: armR, s: [155, 150, 155, 150, 155], e: [-25, 35, -25, 35, -25] }], { duration: 1.5, ease: EASE });
      setHappy(false);
    } else if (act === "stretch") {
      setSyllable("o");
      action.start({ scaleY: [1, 0.92, 1.1, 1.1, 1], scaleX: [1, 1.05, 0.95, 0.95, 1], y: [0, 2, -4, -4, 0] }, { duration: 1.6, times: [0, 0.15, 0.45, 0.8, 1] });
      await gesture(
        [
          { arm: armL, s: [175, 178, 22], e: [0, -5, -8] },
          { arm: armR, s: [175, 178, 22], e: [0, -5, -8] },
        ],
        { duration: 1.6, ease: EASE },
      );
      setSyllable(null);
    } else if (act === "airGuitar") {
      // Left hand on an invisible neck, right hand strumming.
      setSyllable("grin");
      setBeats(2);
      setWaves((n) => n + 1);
      cone.start({ scale: [1, 1.1] }, { duration: 0.2, repeat: 7, repeatType: "reverse" });
      action.start({ rotate: [0, -6, -5, -6, -5, -6, 0], y: [0, -3, 0, -3, 0, -3, 0] }, { duration: 1.6 });
      gesture([{ arm: armL, s: [110, 110], e: [20, 20] }], { duration: 1.6 });
      await gesture([{ arm: armR, s: [30, 30, 30, 30, 30, 30, 30], e: [-150, -100, -150, -100, -150, -100, -150] }], { duration: 1.6, ease: EASE });
      setSyllable(null);
    } else if (act === "bop") {
      gesture(
        [
          { arm: armL, s: [60, 140, 22], e: [20, 20, -8] },
          { arm: armR, s: [60, 140, 22], e: [20, 20, -8] },
        ],
        { duration: 0.62, ease: EASE },
      );
      shadow.start({ scaleX: [1, 1.06, 0.7, 1.06, 1] }, { duration: 0.62 });
      cable.start({ rotate: [0, -6, 14, -6, 0] }, { duration: 0.8, delay: 0.08 });
      setHappy(true);
      await action.start(BOP, { duration: 0.62, ease: EASE });
      setHappy(false);
    } else if (act === "groove") {
      setBeats(2);
      setWaves((n) => n + 1);
      setSyllable("grin");
      cone.start({ scale: [1, 1.1] }, { duration: 0.3, repeat: 5, repeatType: "reverse" });
      cable.start({ rotate: [0, 8, -8, 8, -8, 0] }, { duration: 1.8, delay: 0.1 });
      gesture(
        [
          { arm: armL, s: [120, 60, 120, 60, 22], e: [30, 60, 30, 60, -8] },
          { arm: armR, s: [60, 120, 60, 120, 22], e: [60, 30, 60, 30, -8] },
        ],
        { duration: 1.8, ease: EASE },
      );
      await action.start({ rotate: [0, -7, 7, -7, 7, 0], y: [0, -5, 0, -5, 0, 0] }, { duration: 1.8, ease: EASE });
      setSyllable(null);
    } else if (act === "spin") {
      await knob.start({ rotate: [0, 360] }, { duration: 0.8, ease: EASE });
    } else {
      setSyllable("o");
      // Reaches up and turns the knob himself.
      gesture([{ arm: armR, s: [160, 160, 160], e: [95, 105, 95] }], { duration: 1, ease: EASE });
      await knob.start({ rotate: [0, 90, -30, 0] }, { duration: 1, ease: EASE });
      setSyllable(null);
    }
    busy.current = false;
  };
  const playRef = useRef(play);
  useEffect(() => {
    playRef.current = play;
  });

  useEffect(() => {
    if (mood !== "idle" || reduceMotion || talking || !awake) return undefined;
    const timers: ReturnType<typeof setTimeout>[] = [];
    if (arrive) timers.push(setTimeout(() => playRef.current("bop"), 450));
    if (lively) {
      const next = () => {
        timers.push(
          setTimeout(
            () => {
              playRef.current(ACTIONS[Math.floor(Math.random() * ACTIONS.length)]);
              next();
            },
            2200 + Math.random() * 2000,
          ),
        );
      };
      next();
    }
    return () => timers.forEach(clearTimeout);
  }, [mood, lively, arrive, reduceMotion, talking, awake]);

  const onHover = () => {
    if (!lively || reduceMotion || mood !== "idle" || eyesClosed || talking) return;
    setBeats(1);
    setWaves((n) => n + 1);
    playRef.current(Math.random() < 0.5 ? "wave" : "bop");
  };

  // Random blink every 3.5–6 s while the eyes are open.
  const canBlink = !reduceMotion && !eyesClosed && mood !== "asleep" && awake;
  const [blink, setBlink] = useState(0);
  useEffect(() => {
    if (!canBlink) return undefined;
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timer = setTimeout(
        () => {
          setBlink((n) => n + 1);
          schedule();
        },
        3500 + Math.random() * 2500,
      );
    };
    schedule();
    return () => clearTimeout(timer);
  }, [canBlink]);

  const cableOut = pose.unplugged;
  const plugging = mood === "plugIn" && !reduceMotion;
  const fx = !reduceMotion;
  /** Looping ambience (breath, sway, glow, Zzz…): only while he can be seen. */
  const loops = fx && awake;
  const lampLit = pose.lamp === C.lamp;
  const sway = loops && !talking && (mood === "idle" || mood === "standby" || mood === "asleep" || mood === "lookAround");
  const breath: TargetAndTransition = !loops || mood === "error" || mood === "dizzy"
    ? { scaleY: 1, scaleX: 1, y: 0 }
    : mood === "asleep"
      ? { scaleY: [1, 1.04, 1], scaleX: [1, 0.988, 1], transition: { duration: 3.4, repeat: Infinity, ease: EASE } }
      : { scaleY: [1, 1.018, 1], scaleX: [1, 0.994, 1], transition: { duration: 2.4, repeat: Infinity, ease: EASE } };
  const url = (name: string) => `url(#${id(name)})`;

  return (
    <motion.svg ref={svgRef} viewBox='0 18 200 175' overflow='visible' className={cn("h-32 w-auto", className)} aria-hidden onHoverStart={onHover}>
      <defs>
        <pattern id={id("weave")} width='5' height='5' patternUnits='userSpaceOnUse' patternTransform='rotate(45)'>
          <rect width='5' height='5' fill={C.cloth} />
          <rect width='1.6' height='5' fill={C.weave} />
        </pattern>
        <clipPath id={id("grille")}>
          <rect {...GRILLE} />
        </clipPath>
        <clipPath id={id("front")}>
          <rect {...FRONT} />
        </clipPath>
        <clipPath id={id("side")}>
          <rect {...BACK} />
          <path d={HULL_JOIN} />
        </clipPath>
        <path id={id("corner")} d={CORNER} />
      </defs>

      <motion.ellipse
        cx='106'
        cy='170'
        rx='76'
        ry='6.5'
        fill='#000'
        initial={{ opacity: 0.4 }}
        style={{ transformBox: "fill-box", transformOrigin: "50% 50%" }}
        animate={shadowCtl}
      />

      <ellipse cx='102' cy='169.5' rx='56' ry='3.5' fill='#000' opacity={0.35} />

      {waves > 0 && (
        <g key={`waves-${waves}`}>
          {Array.from({ length: beats }, (_, beat) => (
            <g key={beat}>
              <BassRing beat={beat} />
              <SoundBeat beat={beat} />
            </g>
          ))}
        </g>
      )}

      {cableOut && (
        <g>
          <path d={CABLE_OUT} fill='none' stroke={C.cable} strokeWidth='5' strokeLinecap='round' />
          <path d='M30,170 L37,167' stroke={C.metal} strokeWidth='6.5' strokeLinecap='round' />
          <path d='M38.5,166.4 L42,165' stroke={C.metal} strokeWidth='3' strokeLinecap='round' />
        </g>
      )}

      {/* Pose layer: the held attitude of the mood. */}
      <motion.g
        style={{ transformBox: "fill-box", transformOrigin: "50% 100%" }}
        initial={false}
        animate={pose.body}
        transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 170, damping: 16 }}>
        {/* Breath layer: never quite still. */}
        <motion.g style={{ transformBox: "fill-box", transformOrigin: "50% 100%" }} initial={false} animate={breath}>
          {/* Action layer: one-off reactions on top of the pose. */}
          <motion.g style={{ transformBox: "fill-box", transformOrigin: "50% 100%" }} animate={actionCtl}>
            <RiffArm side={-1} arm={armL} sway={sway} layer='back' bold={small} />
            <RiffArm side={1} arm={armR} sway={sway} layer='back' bold={small} />

            {!cableOut && !plugging && (
              <motion.path
                d={CABLE_IN}
                fill='none'
                stroke={C.cable}
                strokeWidth='5'
                strokeLinecap='round'
                style={{ transformBox: "fill-box", transformOrigin: "100% 0%" }}
                initial={{ rotate: pose.slack ? -6 : 0 }}
                animate={cableCtl}
              />
            )}
            {plugging && <PlugInCable delay={0.25 + delay} />}

            {/* Rubber feet: two at the front, the back-right one peeking out. */}
            <rect x='155' y='155' width='22' height='8' rx='3.5' fill={C.foot} />
            <rect x='44' y='162' width='24' height='9' rx='3.5' fill={C.foot} />
            <rect x='123' y='162' width='24' height='9' rx='3.5' fill={C.foot} />

            <motion.g initial={{ y: pose.handleUp }} animate={handleCtl}>
              <g transform='translate(8 -3.5)'>
              <path d='M70,50 C70,42 78,40 95.5,40 C113,40 121,42 121,50' fill='none' stroke={C.side} strokeWidth='7.5' strokeLinecap='round' transform='translate(0.8 1.6)' />
              <path d='M70,50 C70,42 78,40 95.5,40 C113,40 121,42 121,50' fill='none' stroke={C.handle} strokeWidth='7.5' strokeLinecap='round' />
              {!small && <path d='M74,45 C76,42.5 82,41.6 95.5,41.6' fill='none' stroke={C.highlight} strokeWidth='2' strokeLinecap='round' />}
              <rect x='64.5' y='45' width='11' height='7' rx='3' fill={C.metalDark} />
              <rect x='115.5' y='45' width='11' height='7' rx='3' fill={C.metalDark} />
              </g>
            </motion.g>

            {/* Cabinet: a box in 3/4 view — top face (lit), right face (shade),
                front. One flat colour per plane, one darker band toward the
                back and the bottom, one highlight along the front's top-left. */}
            <rect {...BACK} fill={C.side} />
            <path d={HULL_JOIN} fill={C.side} />
            <g clipPath={url("side")}>
              {!small && <rect x='160' y='40' width='6' height='130' fill={C.sideLight} />}
              <rect x='168' y='30' width='12' height='140' fill={C.sideShade} />
              <path d='M140,152 L190,130 L190,180 L140,180 Z' fill={C.sideShade} />
              <path d={TOP_FACE} fill={C.top} />
              {!small && <path d='M60,46.5 L160,46.5' stroke={C.highlight} strokeWidth='2' strokeLinecap='round' />}
            </g>
            {/* The back corners' caps, in shade. */}
            <g fill={C.metalDark}>
              <use href={`#${id("corner")}`} transform='translate(207 -7) scale(-1 1)' />
              <use href={`#${id("corner")}`} transform='translate(207 209) scale(-1 -1)' />
            </g>
            <rect {...FRONT} fill={C.body} />
            <g clipPath={url("front")}>
              {!small && (
                <>
                  <rect x='30' y='50' width='131' height='10' fill={C.bodyLight} />
                  <rect x='30' y='50' width='9' height='116' fill={C.bodyLight} />
                  <rect x='152' y='50' width='9' height='116' fill={C.bodyShade} />
                </>
              )}
              <rect x='30' y='148' width='131' height='18' fill={C.bodyShade} />
              {!small && <rect x='30' y='160' width='131' height='6' fill={C.bodyDeep} />}
            </g>
            <path d='M34,96 L34,64 A10,10 0 0 1 44,54 L74,54' fill='none' stroke={C.highlight} strokeWidth='3' strokeLinecap='round' />

            {/* Control panel. */}
            <rect x='39' y='57' width='115' height='41' rx='6' fill={C.occlusion} opacity={0.28} />
            <rect x='38' y='55' width='115' height='40' rx='6' fill={C.panelLip} />
            <rect x='38' y='52' width='115' height='40' rx='6' fill={C.panel} />
            {!small && (
              <>
                <path d='M38,82 L153,82 L153,86 A6,6 0 0 1 147,92 L44,92 A6,6 0 0 1 38,86 Z' fill={C.panelShade} />
                <rect x='43' y='55' width='105' height='4' rx='2' fill={C.panelLight} />
              </>
            )}
            <rect x='145' y='58' width='4' height='30' rx='2' fill={C.panelLip} opacity={0.45} />

            <circle cx='48' cy='82' r='5' fill={C.navy} />
            <circle cx='48' cy='82' r={cableOut ? 2 : 3.2} fill={cableOut ? "#0b1020" : C.metal} />
            {!cableOut && !plugging && (
              <>
                <path d='M48,82 L42,87' stroke={C.metal} strokeWidth='6.5' strokeLinecap='round' />
                <path d='M42.5,86.5 L39,89.5' stroke={C.cable} strokeWidth='6' strokeLinecap='round' />
              </>
            )}

            {/* Eyes. */}
            <circle cx='75' cy='72.5' r='16' fill={C.panelLip} />
            <circle cx='106' cy='72.5' r='15' fill={C.panelLip} />
            <circle cx='74' cy='71' r='16' fill={C.navy} />
            <circle cx='105' cy='71' r='15' fill={C.navy} />
            <motion.g
              key={blink}
              style={{ transformBox: "fill-box", transformOrigin: "50% 50%" }}
              animate={blink > 0 ? { scaleY: [1, 0.08, 1] } : { scaleY: 1 }}
              transition={{ duration: 0.18, times: [0, 0.45, 1], ease: EASE }}>
              <Eye cx={74} cy={71} r={12.5} clipId={id("eye-l")} lid={pose.lidL} pupil={pose.pupilL} look={lookCtl} instant={reduceMotion} />
              <Eye cx={105} cy={71} r={11.5} clipId={id("eye-r")} lid={pose.lidR} pupil={pose.pupilR} look={lookCtl} instant={reduceMotion} />
            </motion.g>
            {pose.lidL === SHUT && !happy && (
              <g fill='none' stroke={C.piping} strokeWidth={LINE} strokeLinecap='round'>
                <path d='M66,72 C69,77 79,77 82,72' />
                <path d='M98,72 C100.5,76.5 109.5,76.5 112,72' />
              </g>
            )}
            <motion.g initial={false} animate={{ opacity: happy ? 1 : 0 }} transition={{ duration: 0.12 }}>
              <HappyEye cx={74} cy={71} r={12.5} clipId={id("happy-l")} />
              <HappyEye cx={105} cy={71} r={11.5} clipId={id("happy-r")} />
            </motion.g>

            {/* Knobs, toggle, lamp. */}
            {!small && <circle cx='129.8' cy='65.4' r='6.5' fill={C.occlusion} opacity={0.22} />}
            <circle cx='129' cy='64' r='6.5' fill={C.panelLip} />
            <circle cx='129' cy='64' r='5' fill={C.navy} />
            <motion.path d='M129,64 L129,59.5' stroke={C.white} strokeWidth='1.8' strokeLinecap='round' style={{ transformOrigin: "129px 64px" }} initial={mood === "error" ? { rotate: 130 } : false} animate={knob} />
            {!small && <circle cx='143.8' cy='65.4' r='6.5' fill={C.occlusion} opacity={0.22} />}
            <circle cx='143' cy='64' r='6.5' fill={C.panelLip} />
            <circle cx='143' cy='64' r='5' fill={C.navy} />
            <motion.path d='M143,64 L146.2,60.8' stroke={C.white} strokeWidth='1.8' strokeLinecap='round' style={{ transformOrigin: "143px 64px" }} initial={mood === "error" ? { rotate: -150 } : false} animate={knob2} />
            <rect x='125.5' y='79' width='7' height='8' rx='2' fill={C.navy} />
            <rect x='128' y={pose.lamp === C.lampOff ? 82 : 80} width='2' height='4' rx='1' fill={C.metal} />
            {/* The lamp is the streak: lit, a soft halo breathes around it. */}
            <motion.circle
              cx='143'
              cy='83'
              r='7.8'
              fill={C.lamp}
              initial={false}
              animate={lampLit ? (loops ? { opacity: [0.12, 0.26, 0.12] } : { opacity: 0.18 }) : { opacity: 0 }}
              transition={lampLit && loops ? { duration: 2.4, repeat: Infinity, ease: EASE } : { duration: 0.3 }}
            />
            <circle cx='143' cy='83' r='5' fill={C.navy} />
            <motion.circle cx='143' cy='83' r='3.2' initial={{ fill: pose.lamp }} animate={lamp} />

            {/* Speaker grille with the mouth cut into it. */}
            <rect {...GRILLE} fill={url("weave")} />
            <g clipPath={url("grille")}>
              <motion.g style={{ transformOrigin: "99px 128.5px" }} animate={cone}>
                <circle cx='99' cy='128.5' r='26' fill={C.cone} />
                {!small && <circle cx='96' cy='125' r='21' fill={C.coneLight} />}
                <circle cx='99' cy='128.5' r='17' fill={C.cone} />
                <circle cx='99' cy='128.5' r='26' fill='none' stroke={C.coneRing} strokeWidth='2.5' />
                <circle cx='99' cy='128.5' r='17' fill='none' stroke={C.coneRing} strokeWidth='1.5' />
              </motion.g>
              <rect x='38' y='99' width='115' height='8' fill={C.occlusion} opacity={0.4} />
              {!small && (
                <>
                  <rect x='38' y='99' width='6' height='59' fill={C.occlusion} opacity={0.25} />
                  <rect x='38' y='151' width='115' height='7' fill={C.occlusion} opacity={0.2} />
                </>
              )}
              <motion.path
                initial={false}
                animate={{ d: MOUTH[mouth] }}
                transition={reduceMotion ? { duration: 0 } : { duration: syllable ? 0.1 : 0.28, ease: EASE }}
                fill={C.mouth}
                stroke={C.piping}
                strokeWidth={LINE}
                strokeLinejoin='round'
              />
              <motion.ellipse
                cx='99'
                cy='143'
                rx='9'
                ry='4.5'
                fill={C.tongue}
                initial={false}
                animate={{ opacity: TONGUE_SHAPES.includes(mouth) ? 1 : 0 }}
                transition={{ duration: 0.1 }}
              />
            </g>
            <rect {...GRILLE} fill='none' stroke={C.piping} strokeWidth={LINE} />
            <rect x='44' y='104' width='27' height='10' rx='5' fill={C.piping} />
            {!small && (
              <text x='57.5' y='111.6' textAnchor='middle' fontFamily='Georgia, serif' fontStyle='italic' fontWeight='700' fontSize='7.5' fill={C.navy}>
                riff
              </text>
            )}

            {/* Metal corners: one cap, mirrored, hugging the cabinet radius. */}
            <g fill={C.metalDark} transform='translate(0.6 1)' opacity={small ? 0 : 1}>
              <use href={`#${id("corner")}`} />
              <use href={`#${id("corner")}`} transform='translate(191 0) scale(-1 1)' />
              <use href={`#${id("corner")}`} transform='translate(0 216) scale(1 -1)' />
              <use href={`#${id("corner")}`} transform='translate(191 216) scale(-1 -1)' />
            </g>
            <g fill={C.metal}>
              <use href={`#${id("corner")}`} />
              <use href={`#${id("corner")}`} transform='translate(191 0) scale(-1 1)' />
              <use href={`#${id("corner")}`} transform='translate(0 216) scale(1 -1)' />
              <use href={`#${id("corner")}`} transform='translate(191 216) scale(-1 -1)' />
            </g>

            <RiffArm side={-1} arm={armL} sway={sway} layer='front' bold={small} />
            <RiffArm side={1} arm={armR} sway={sway} layer='front' bold={small} />
          </motion.g>
        </motion.g>
      </motion.g>

      {/* Effects around him, per mood. */}
      {loops && mood === "asleep" && <Zzz />}
      {loops && mood === "dizzy" && <DizzyStars />}
      {loops && mood === "error" && <Smoke />}
      {loops && mood === "warmup" && <Heat />}
      {(mood === "shrug" || mood === "unplugged") && <Mark char='?' x={mood === "shrug" ? 160 : 168} />}
      {mood === "nudge" && <Mark char='!' x={lookAt === "left" ? 40 : 160} />}
      {fx && burst > 0 && <Burst key={`burst-${burst}`} delay={0} />}
    </motion.svg>
  );
};

// ─── Speech ───────────────────────────────────────────────────────────────────

/**
 * Riff with a speech bubble. The text types itself out while his mouth flaps,
 * then he goes quiet. `children` replaces the text node (for rich content),
 * typed or not.
 */
export const RiffSays = ({
  text,
  mood = "idle",
  layout = "row",
  className,
  riffClassName,
  bubbleClassName,
  delay = 0.3,
  children,
  ...riffProps
}: Omit<RiffProps, "talking" | "className"> & {
  text: string;
  layout?: "row" | "column";
  className?: string;
  riffClassName?: string;
  bubbleClassName?: string;
  children?: ReactNode;
}) => {
  const reduceMotion = !!useReducedMotion();
  const [typed, setTyped] = useState({ text, count: 0 });
  // A new line starts typing from scratch; reduced motion shows it whole.
  const shown = reduceMotion ? text.length : typed.text === text ? typed.count : 0;

  useEffect(() => {
    if (reduceMotion) return undefined;
    let i = 0;
    let tick: ReturnType<typeof setInterval> | undefined;
    const start = setTimeout(() => {
      tick = setInterval(() => {
        i += 1;
        setTyped({ text, count: i });
        if (i >= text.length && tick) clearInterval(tick);
      }, 28);
    }, delay * 1000);
    return () => {
      clearTimeout(start);
      if (tick) clearInterval(tick);
    };
  }, [text, delay, reduceMotion]);

  const talking = shown < text.length;
  const column = layout === "column";

  return (
    <div className={cn("flex items-center gap-4", column && "flex-col", className)}>
      <Riff {...riffProps} mood={mood} talking={talking} className={cn("h-28 shrink-0", riffClassName)} />
      <AnimatePresence>
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, scale: 0.85, x: column ? 0 : -8, y: column ? -6 : 0 }}
          animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
          transition={{ delay: reduceMotion ? 0 : delay * 0.6, type: "spring", stiffness: 300, damping: 22 }}
          className={cn(
            "relative max-w-xs rounded-lg bg-zinc-800 px-4 py-3 text-left text-sm leading-relaxed text-zinc-100",
            column ? "text-center" : "",
            bubbleClassName,
          )}>
          {/* Tail pointing at Riff. */}
          <span
            aria-hidden
            className={cn(
              "absolute h-3 w-3 rotate-45 bg-zinc-800",
              column ? "-top-1.5 left-1/2 -translate-x-1/2" : "-left-1.5 top-1/2 -translate-y-1/2",
            )}
          />
          {/* The whole line is there for layout and screen readers; the typed
              part is drawn over it. */}
          <span className='invisible' aria-hidden>
            {children ?? text}
          </span>
          <span className='absolute inset-0 px-4 py-3' aria-live='polite'>
            {talking ? text.slice(0, shown) : (children ?? text)}
          </span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

/**
 * Riff's face alone, for 16–32 px (avatar, streak chip, small markers) — a
 * separate simplified drawing, not the full figure scaled down.
 */
export const RiffFace = ({
  lampOn = true,
  asleep = false,
  className,
  title,
}: {
  lampOn?: boolean;
  asleep?: boolean;
  className?: string;
  title?: string;
}) => (
  <svg viewBox='0 0 24 24' className={cn("h-6 w-6", className)} role={title ? "img" : undefined} aria-hidden={title ? undefined : true}>
    {title && <title>{title}</title>}
    <rect x='1.5' y='3' width='21' height='19' rx='4' fill={C.side} />
    <rect x='1.5' y='2' width='21' height='19' rx='4' fill={C.body} />
    <rect x='3.5' y='4' width='17' height='9.5' rx='2' fill={C.panel} />
    <circle cx='8.3' cy='8.8' r='3.4' fill={C.navy} />
    <circle cx='14.2' cy='8.8' r='3.2' fill={C.navy} />
    {asleep ? (
      <g fill='none' stroke={C.white} strokeWidth='1' strokeLinecap='round' opacity={0.7}>
        <path d='M6.6,9.2 C7.4,10.2 9.2,10.2 10,9.2' />
        <path d='M12.6,9.2 C13.3,10.1 15.1,10.1 15.8,9.2' />
      </g>
    ) : (
      <>
        <circle cx='8.3' cy='8.8' r='2.6' fill={C.white} />
        <circle cx='14.2' cy='8.8' r='2.4' fill={C.white} />
        <circle cx='8' cy='9.2' r='1.35' fill={C.navy} />
        <circle cx='13.9' cy='9.2' r='1.25' fill={C.navy} />
      </>
    )}
    <circle cx='18.4' cy='6.4' r='1.35' fill={lampOn ? C.lamp : C.lampOff} />
    <rect x='3.5' y='15' width='17' height='4.5' rx='1.5' fill={C.cloth} />
    <path d={asleep ? "M11,17.2 C11.5,16.6 12.5,16.6 13,17.2" : "M9.5,16.4 C11,18.4 13,18.4 14.5,16.4"} fill='none' stroke={C.piping} strokeWidth='1.1' strokeLinecap='round' />
  </svg>
);
