import { cn } from "assets/lib/utils";
import {
  animate,
  motion,
  type MotionValue,
  type TargetAndTransition,
  type Transition,
  useAnimationControls,
  useMotionValue,
  useReducedMotion,
} from "framer-motion";
import { type ReactNode, useEffect, useId, useMemo, useRef, useState } from "react";

import { smoothControls, splineValue } from "./smoothMotion";

/**
 * Kostek — the Riff Quest mascot (see docs/MASCOT.md), drawn in the logo's
 * style: a flat guitar pick in the logo's off-white, details cut out of it so
 * the background shows through, cyan #22d3ee as the only accent (the sound
 * rings), and a face that is nothing but two eyes. Two round floating mitts do
 * the gesturing. On the light theme the body turns dark (`--mascot-fg`).
 *
 * Layers: pose (held tilt / squash) → breath + sway (idle loop) → action
 * (one-off reactions) → face (eyes, gaze) and hands. The hands are springs
 * that chase their pose a beat behind the body, so every move overlaps and
 * settles instead of stopping dead; gestures run along splines (smoothMotion).
 * Loops only run while Kostek is on screen and the tab is in front. Reduced
 * motion: the held pose only.
 */

export type KostekMood =
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
  | "listen"
  | "sad"
  | "surprised"
  | "think"
  | "wave"
  | "approve"
  | "chill"
  | "wait"
  | "ready";

type LookAt = "left" | "right" | "up" | "down";

/**
 * Logo style: one flat colour for the body and hands, the face cut out of it
 * (it shows whatever is behind), cyan as the only accent. The body colour is a
 * CSS variable so the light theme turns it dark (see globals.css).
 */
const FG = "var(--mascot-fg, #FBFBFA)";
const C = {
  ring: "#22D3EE",
};

const EASE: [number, number, number, number] = [0.45, 0, 0.25, 1];
const SPRING: Transition = { type: "spring", stiffness: 220, damping: 20 };
/** Hands chase their pose a little late and overshoot a touch: follow-through. */
const HAND_SPRING: Transition = { type: "spring", stiffness: 150, damping: 13, mass: 0.9 };
/** The pick: wide and round on top, narrowing to a soft point. */
const BODY = "M60 115.1 C50.8 115.1 22 77 22 52.9 C22 34.4 37.8 26 60 26 C82.3 26 98.1 34.4 98.1 52.9 C98.1 77 69.3 115.1 60 115.1 Z";

// ─── Eyes ─────────────────────────────────────────────────────────────────────
// Two narrow upright slots cut out of the body (they are drawn into a mask,
// so the page shows through). Every expression is their size, tilt or a swap
// to a stroke: arcs for joy, flat arcs for contentment, a line for closed,
// spirals for dizzy. The eyes are the only place Kostek has a face.
type EyeShape = "open" | "happy" | "content" | "closed" | "sad" | "wide" | "focus" | "sleepy" | "spiral";
const EYE_Y = 57.5;
const EYE_L = 50;
const EYE_R = 70;
type PillShape = { w: number; h: number; tilt: number; y: number };
const PILL: Partial<Record<EyeShape, PillShape>> = {
  open: { w: 5, h: 12, tilt: 0, y: 0 },
  wide: { w: 6.2, h: 14.5, tilt: 0, y: -1 },
  sad: { w: 5, h: 9.5, tilt: 18, y: 1 },
  focus: { w: 5, h: 6, tilt: -14, y: 1 },
  sleepy: { w: 5, h: 4, tilt: 0, y: 2.5 },
};
/** Colour of a cut in the mask: black removes the body there. */
const CUT = "#000";

const Eye = ({ cx, shape, side, spin, talk }: { cx: number; shape: EyeShape; side: -1 | 1; spin: boolean; talk: number }) => {
  const cy = EYE_Y;
  const t = { duration: 0.16, ease: EASE };
  const pill = PILL[shape];
  const show = (s: EyeShape) => ({ opacity: shape === s ? 1 : 0 });
  return (
    <>
      <motion.rect
        x={cx - 2.5}
        y={cy - 6}
        width={5}
        height={12}
        rx={2.5}
        fill={CUT}
        style={{ transformBox: "fill-box", transformOrigin: "50% 50%" }}
        initial={false}
        animate={
          pill
            ? { opacity: 1, scaleX: pill.w / 5, scaleY: (pill.h / 12) * (talk ? 0.8 : 1), rotate: pill.tilt * -side, y: pill.y }
            : { opacity: 0, scaleX: 1, scaleY: 0.6, rotate: 0, y: 0 }
        }
        transition={t}
      />
      <motion.path
        d={`M${cx - 4.6},${cy + 2.6} Q${cx},${cy - 5.4} ${cx + 4.6},${cy + 2.6}`}
        fill='none'
        stroke={CUT}
        strokeWidth={3.4}
        strokeLinecap='round'
        initial={false}
        animate={show("happy")}
        transition={t}
      />
      <motion.path
        d={`M${cx - 4.4},${cy + 2.4} Q${cx},${cy - 1.6} ${cx + 4.4},${cy + 2.4}`}
        fill='none'
        stroke={CUT}
        strokeWidth={3.2}
        strokeLinecap='round'
        initial={false}
        animate={show("content")}
        transition={t}
      />
      <motion.path
        d={`M${cx - 4},${cy + 1.5} L${cx + 4},${cy + 1.5}`}
        fill='none'
        stroke={CUT}
        strokeWidth={3.2}
        strokeLinecap='round'
        initial={false}
        animate={show("closed")}
        transition={t}
      />
      <motion.g initial={false} animate={show("spiral")} transition={t}>
        <motion.path
          d={`M${cx},${cy} m-1.2,0 a1.2,1.2 0 1,1 2.4,0 a2.4,2.4 0 1,1 -4.8,0 a3.6,3.6 0 1,1 7.2,0`}
          fill='none'
          stroke={CUT}
          strokeWidth={2.1}
          strokeLinecap='round'
          style={{ transformBox: "fill-box", transformOrigin: "50% 50%" }}
          animate={spin ? { rotate: side * 360 } : { rotate: 0 }}
          transition={spin ? { duration: 1.4, repeat: Infinity, ease: "linear" } : { duration: 0 }}
        />
      </motion.g>
    </>
  );
};

// ─── Hands ────────────────────────────────────────────────────────────────────
// Two floating round mitts, no arms. Shapes are drawn around (0, 0); `point`
// extends a finger along +x, `thumb` raises one along −y and `horns` is the
// rock-on fist, so rotating the hand aims them.
type HandShape = "mitt" | "fist" | "point" | "thumb" | "horns";
type HandPose = { x: number; y: number; r: number; shape?: HandShape; behind?: boolean };
type HandMV = { x: MotionValue<number>; y: MotionValue<number>; r: MotionValue<number> };

const HAND_R = 6.4;
const HandShapes = ({ shape }: { shape: HandShape }) => (
  <>
    {shape === "point" && <rect x={3} y={-2} width={9.5} height={4} rx={2} fill={FG} />}
    {shape === "thumb" && <rect x={-6.6} y={-12} width={4.4} height={8.5} rx={2.2} fill={FG} transform='rotate(-24 -4.4 -4)' />}
    {shape === "horns" ? (
      // Rock on: a rounded fist with two fingers up.
      <>
        <rect x={-7} y={-5} width={14} height={11.5} rx={4.6} fill={FG} />
        <rect x={-7} y={-15.5} width={4} height={13} rx={2} fill={FG} />
        <rect x={3} y={-15.5} width={4} height={13} rx={2} fill={FG} />
      </>
    ) : (
      <circle cx={0} cy={0} r={shape === "fist" ? HAND_R - 0.4 : HAND_R} fill={FG} />
    )}
  </>
);
const Hand = ({ mv, shape }: { mv: HandMV; shape: HandShape }) => (
  <motion.g style={{ x: mv.x, y: mv.y, rotate: mv.r }}>
    <HandShapes shape={shape} />
  </motion.g>
);

// ─── Moods ────────────────────────────────────────────────────────────────────
type Look = { x: number; y: number };
const LOOK: Record<LookAt, Look> = { left: { x: -3.5, y: 0.5 }, right: { x: 3.5, y: 0.5 }, up: { x: 0, y: -3.5 }, down: { x: 0, y: 3 } };
type Pose = {
  eyes: EyeShape;
  look: Look;
  body: { scaleX: number; scaleY: number; rotate: number; y: number };
  /** Light level: the rim and the eyes dim when it is low on energy. */
  lit: boolean;
  l: HandPose;
  r: HandPose;
};
const REST = { scaleX: 1, scaleY: 1, rotate: 0, y: 0 };
const ZERO: Look = { x: 0, y: 0 };
const H = {
  restL: { x: 13, y: 86, r: -10 },
  restR: { x: 107, y: 86, r: 10 },
  lowL: { x: 17, y: 96, r: -20 },
  lowR: { x: 103, y: 96, r: 20 },
  upL: { x: 12, y: 40, r: -20 },
  upR: { x: 108, y: 40, r: 20 },
};

/** A pointing hand aimed at `lookAt`, the other resting. */
const pointing = (lookAt: LookAt | undefined): { l: HandPose; r: HandPose } => {
  switch (lookAt) {
    case "left":
      return { l: { x: 8, y: 70, r: 180, shape: "point" }, r: H.restR };
    case "up":
      return { l: H.restL, r: { x: 104, y: 44, r: -70, shape: "point" } };
    case "down":
      return { l: H.restL, r: { x: 100, y: 100, r: 60, shape: "point" } };
    default:
      return { l: H.restL, r: { x: 112, y: 70, r: 0, shape: "point" } };
  }
};

const poseFor = (mood: KostekMood, lookAt?: LookAt): Pose => {
  const look = lookAt ? LOOK[lookAt] : null;
  const s = lookAt === "left" ? -1 : 1;
  const base = { look: look ?? ZERO, body: REST, lit: true, l: H.restL, r: H.restR };
  switch (mood) {
    case "celebrate":
      return { ...base, eyes: "happy", look: ZERO, l: H.upL, r: { ...H.upR, x: 110, y: 42, r: 10, shape: "horns" } };
    case "hop":
    case "plugIn":
      return { ...base, eyes: "happy", look: ZERO, l: H.upL, r: H.upR };
    case "levelUp":
      return { ...base, eyes: "happy", look: ZERO, l: { ...H.upL, y: 34, shape: "fist" }, r: { ...H.upR, x: 110, y: 38, r: 10, shape: "horns" } };
    case "asleep":
      return { ...base, eyes: "closed", look: ZERO, body: { scaleX: 1.04, scaleY: 0.95, rotate: 6, y: 0 }, lit: false, l: H.lowL, r: H.lowR };
    case "standby":
      return { ...base, eyes: "sleepy", look: { x: 0, y: 1.5 }, body: { scaleX: 1.02, scaleY: 0.97, rotate: 3, y: 0 }, lit: false, l: H.lowL, r: H.lowR };
    case "focus":
      return {
        ...base,
        eyes: "focus",
        look: { x: 0, y: 1 },
        body: { scaleX: 1.05, scaleY: 0.94, rotate: 0, y: 0 },
        l: { x: 34, y: 94, r: 0, shape: "fist" },
        r: { x: 86, y: 94, r: 0, shape: "fist" },
      };
    case "nudge":
      return { ...base, eyes: "open", look: look ?? LOOK.right, body: { ...REST, rotate: s * 4 }, ...pointing(lookAt ?? "right") };
    case "shrug":
      return {
        ...base,
        eyes: "open",
        look: look ?? { x: 2.5, y: -2 },
        body: { ...REST, rotate: -4 },
        l: { x: 9, y: 74, r: -35 },
        r: { x: 111, y: 74, r: 35 },
      };
    case "think":
      return { ...base, eyes: "open", look: { x: 2.5, y: -3 }, body: { ...REST, rotate: -5 }, r: { x: 78, y: 96, r: -30, shape: "fist" } };
    case "dizzy":
      return { ...base, eyes: "spiral", look: ZERO, body: { ...REST, rotate: -3 }, l: { x: 11, y: 78, r: -30 }, r: { x: 109, y: 74, r: 30 } };
    case "error":
      return { ...base, eyes: "spiral", look: ZERO, body: { ...REST, rotate: -3 }, l: { x: 18, y: 40, r: -40 }, r: { x: 102, y: 40, r: 40 } };
    case "lookAround":
      return { ...base, eyes: "open", look: ZERO, r: { x: 86, y: 47, r: -25 } };
    case "warmup":
      return { ...base, eyes: "sleepy", look: ZERO, body: { ...REST, scaleY: 0.98 }, lit: false, l: { x: 52, y: 100, r: -20 }, r: { x: 68, y: 100, r: 20 } };
    case "unplugged":
      return {
        ...base,
        eyes: "sad",
        look: look ?? LOOK.down,
        body: { scaleX: 1.03, scaleY: 0.96, rotate: -5, y: 0 },
        lit: false,
        l: H.lowL,
        r: { x: 101, y: 44, r: 30 },
      };
    case "listen":
      return { ...base, eyes: "open", look: look ?? { x: 0, y: -1.5 }, r: { x: 104, y: 58, r: -40 } };
    case "sad":
      return { ...base, eyes: "sad", look: { x: 0, y: 2 }, body: { scaleX: 1.04, scaleY: 0.93, rotate: 0, y: 0 }, l: { x: 27, y: 98, r: 0 }, r: { x: 93, y: 98, r: 0 } };
    case "surprised":
      return { ...base, eyes: "wide", look: ZERO, body: { scaleX: 0.96, scaleY: 1.05, rotate: 0, y: 0 }, l: { x: 16, y: 58, r: -30 }, r: { x: 104, y: 58, r: 30 } };
    case "wave":
      return { ...base, eyes: "happy", look: ZERO, body: { ...REST, rotate: -3 }, r: { x: 108, y: 44, r: 15 } };
    case "approve":
      return { ...base, eyes: "happy", look: ZERO, r: { x: 106, y: 62, r: 0, shape: "thumb" } };
    case "chill":
      // Leaning back, hands behind the head.
      return {
        ...base,
        eyes: "content",
        look: { x: 0, y: -1 },
        body: { scaleX: 1.02, scaleY: 0.98, rotate: -4, y: 0 },
        l: { x: 30, y: 36, r: -30, behind: true },
        r: { x: 90, y: 36, r: 30, behind: true },
      };
    case "wait":
      return { ...base, eyes: "open", look: { x: -2.5, y: -2.5 }, r: { x: 84, y: 104, r: 0 } };
    case "ready":
      return { ...base, eyes: "open", look: ZERO, body: { scaleX: 1.02, scaleY: 0.98, rotate: 0, y: 0 }, l: { x: 50, y: 98, r: -15 }, r: { x: 70, y: 98, r: 15 } };
    default:
      return { ...base, eyes: "open" };
  }
};

// ─── Kostek ─────────────────────────────────────────────────────────────────────
type Action = "glance" | "bounce" | "tilt" | "ping" | "lookUp" | "wave" | "stretch";
const ACTIONS: Action[] = ["glance", "ping", "tilt", "wave", "glance", "lookUp", "bounce", "stretch"];

export interface KostekProps {
  mood?: KostekMood;
  className?: string;
  /** Extra wait (s) before the entry reaction, e.g. while a parent enters. */
  delay?: number;
  /** Idle: small random actions every few seconds and a hover reaction. */
  lively?: boolean;
  /** Idle: drop in and wave hello shortly after mounting. */
  arrive?: boolean;
  /** Celebrate: one hop instead of the full reaction. */
  short?: boolean;
  /** Where it looks, and points for nudge. */
  lookAt?: LookAt;
  /** Shut the eyes and cover them (e.g. while a password is typed). */
  eyesClosed?: boolean;
  /** Listen: input level 0–1 driving the rings and the body pulse. */
  signal?: number;
  /** Speaking: the eyes pulse in syllables, a hand gestures, a faint ring keeps time. */
  talking?: boolean;
}

export const Kostek = ({
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
}: KostekProps) => {
  const reduceMotion = !!useReducedMotion();
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const actionCtl = useAnimationControls();
  const ringCtl = useAnimationControls();
  const gazeCtl = useAnimationControls();
  const eyesCtl = useAnimationControls();
  const action = useMemo(() => smoothControls(actionCtl), [actionCtl]);
  const gaze = useMemo(() => smoothControls(gazeCtl), [gazeCtl]);
  const svgRef = useRef<SVGSVGElement>(null);
  const [onScreen, setOnScreen] = useState(true);
  const [pageVisible, setPageVisible] = useState(true);
  const [blink, setBlink] = useState(0);
  const [syllable, setSyllable] = useState(0);
  const [joy, setJoy] = useState(false);
  const busy = useRef(false);
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    const el = svgRef.current;
    const offs: (() => void)[] = [];
    if (el && typeof IntersectionObserver !== "undefined") {
      const io = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting), { rootMargin: "120px" });
      io.observe(el);
      offs.push(() => io.disconnect());
    }
    const onVis = () => setPageVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVis);
    offs.push(() => document.removeEventListener("visibilitychange", onVis));
    return () => offs.forEach((f) => f());
  }, []);

  const awake = onScreen && pageVisible;
  const loops = !reduceMotion && awake;
  let pose = poseFor(mood, lookAt);
  if (eyesClosed)
    pose = {
      ...pose,
      eyes: "closed",
      l: { x: 50, y: 58, r: -15 },
      r: { x: 70, y: 58, r: 15 },
    };
  if (joy) pose = { ...pose, eyes: "happy" };

  // ── Hands: motion values sprung to the pose, driven by gestures ──
  const hand = {
    l: { x: useMotionValue(pose.l.x), y: useMotionValue(pose.l.y), r: useMotionValue(pose.l.r) },
    r: { x: useMotionValue(pose.r.x), y: useMotionValue(pose.r.y), r: useMotionValue(pose.r.r) },
  };
  const handsRef = useRef(hand);
  const poseRef = useRef(pose);
  useEffect(() => {
    poseRef.current = pose;
  });
  const handRuns = useRef(new Set<{ stop: () => void }>());
  const stopHands = () => {
    handRuns.current.forEach((r) => r.stop());
    handRuns.current.clear();
  };
  const settleHands = (instant = false) => {
    const p = poseRef.current;
    const h = handsRef.current;
    const tr = instant ? { duration: 0 } : HAND_SPRING;
    (["l", "r"] as const).forEach((k) => {
      animate(h[k].x, p[k].x, tr);
      animate(h[k].y, p[k].y, tr);
      animate(h[k].r, p[k].r, tr);
    });
  };
  /** Keyframes (absolute) for one hand; afterwards it springs back to the pose. */
  const gesture = (k: "l" | "r", keys: { x?: number[]; y?: number[]; r?: number[] }, tr: Transition, settle = true) => {
    const h = handsRef.current[k];
    const runs = (["x", "y", "r"] as const).filter((a) => keys[a]).map((a) => splineValue(h[a], keys[a] as number[], tr));
    runs.forEach((r) => handRuns.current.add(r));
    if (settle && tr.repeat !== Infinity)
      void Promise.all(runs).then(() => {
        runs.forEach((r) => handRuns.current.delete(r));
        if (mounted.current) settleHands();
      });
  };
  const handsApi = useRef({ gesture, stopHands, settleHands });
  useEffect(() => {
    handsApi.current = { gesture, stopHands, settleHands };
  });
  const poseKey = `${pose.l.x},${pose.l.y},${pose.l.r},${pose.r.x},${pose.r.y},${pose.r.r}`;
  useEffect(() => {
    handsApi.current.settleHands(reduceMotion);
  }, [poseKey, reduceMotion]);

  const burstRings = (at: number, times = 1) =>
    ringCtl.start({ scale: [0.85, 1.45], opacity: [0.7, 0] }, { duration: 0.8, delay: at, repeat: times - 1, ease: "easeOut" });

  // ── Entry reaction for each mood ──
  useEffect(() => {
    if (reduceMotion) return undefined;
    const g = handsApi.current;
    const d = delay + 0.15;
    const p = poseRef.current;
    const hop = (h: number, at: number) =>
      action.start(
        { y: [0, 2, -h, 1, 0], scaleX: [1, 1.07, 0.96, 1.04, 1], scaleY: [1, 0.93, 1.05, 0.96, 1] },
        { duration: 0.7, delay: at, times: [0, 0.18, 0.5, 0.8, 1] },
      );
    // Hands dip on the crouch and fling on the jump, a beat behind the body.
    const handsHop = (at: number) => {
      g.gesture("l", { y: [p.l.y + 6, p.l.y - 8, p.l.y] }, { duration: 0.75, delay: at + 0.05 });
      g.gesture("r", { y: [p.r.y + 6, p.r.y - 8, p.r.y] }, { duration: 0.75, delay: at + 0.08 });
    };

    switch (mood) {
      case "celebrate":
        if (short) {
          hop(14, d);
          handsHop(d);
          burstRings(d + 0.35);
          break;
        }
        action.start(
          { y: [0, 2, -24, 1, -8, 0], scaleX: [1, 1.08, 0.95, 1.06, 0.98, 1], scaleY: [1, 0.92, 1.06, 0.94, 1.02, 1] },
          { duration: 1.3, delay: d, times: [0, 0.12, 0.42, 0.66, 0.84, 1] },
        );
        // Both hands pump while it bounces, out of phase.
        g.gesture("l", { y: [44, 30, 44, 32, 40], r: [-20, -32, -18, -30, -20] }, { duration: 1.4, delay: d + 0.1 });
        g.gesture("r", { y: [30, 44, 32, 44, 40], r: [32, 18, 30, 18, 20] }, { duration: 1.4, delay: d + 0.15 });
        burstRings(d + 0.5, 2);
        break;
      case "hop":
        hop(14, d);
        handsHop(d);
        burstRings(d + 0.35);
        break;
      case "plugIn":
        eyesCtl.start({ opacity: [0.2, 1, 0.4, 1] }, { duration: 0.45, delay: d });
        hop(14, d + 0.4);
        handsHop(d + 0.4);
        burstRings(d + 0.6, 2);
        break;
      case "levelUp":
        action.start(
          { y: [0, 3, -30, 2, 0], scaleX: [1, 1.1, 0.95, 1.06, 1], scaleY: [1, 0.88, 1.05, 0.94, 1], rotate: [0, 0, 360, 360, 360] },
          { duration: 1.2, delay: d, times: [0, 0.2, 0.6, 0.82, 1] },
        );
        // Fists pump twice after the landing.
        g.gesture("l", { y: [34, 26, 34, 26, 34] }, { duration: 0.9, delay: d + 1.1 });
        g.gesture("r", { y: [26, 34, 26, 34, 34] }, { duration: 0.9, delay: d + 1.1 });
        burstRings(d + 0.8, 3);
        break;
      case "focus":
        action.start({ y: [0, -3, 0] }, { duration: 0.6, delay: d + 0.2, repeat: Infinity, repeatDelay: 0.6 });
        // Fists bob in a guard, out of step with the body.
        g.gesture("l", { y: [94, 90, 94] }, { duration: 0.6, delay: d + 0.35, repeat: Infinity, repeatDelay: 0.6 }, false);
        g.gesture("r", { y: [94, 90, 94] }, { duration: 0.6, delay: d + 0.5, repeat: Infinity, repeatDelay: 0.6 }, false);
        break;
      case "nudge": {
        const k = lookAt === "left" ? "l" : "r";
        const ph = p[k];
        const dx = Math.cos((ph.r * Math.PI) / 180) * 4;
        const dy = Math.sin((ph.r * Math.PI) / 180) * 4;
        // Jab, jab, rest: the finger taps toward the thing.
        g.gesture(k, { x: [ph.x + dx, ph.x, ph.x + dx, ph.x], y: [ph.y + dy, ph.y, ph.y + dy, ph.y] }, { duration: 0.8, delay: d + 0.2, repeat: Infinity, repeatDelay: 1.6 }, false);
        break;
      }
      case "shrug":
        action.start({ y: [0, -3, 0], rotate: [0, 3, 0] }, { duration: 0.9, delay: d + 0.2, repeat: Infinity, repeatDelay: 2.6 });
        g.gesture("l", { y: [66, 74], r: [-45, -35] }, { duration: 0.9, delay: d + 0.2, repeat: Infinity, repeatDelay: 2.6 }, false);
        g.gesture("r", { y: [66, 74], r: [45, 35] }, { duration: 0.9, delay: d + 0.25, repeat: Infinity, repeatDelay: 2.6 }, false);
        break;
      case "think":
        // Taps the chin now and then.
        g.gesture("r", { y: [92, 96, 92, 96] }, { duration: 0.8, delay: d + 0.6, repeat: Infinity, repeatDelay: 2 }, false);
        break;
      case "dizzy":
        action.start({ rotate: [0, -7, 7, -4, 4, 0], x: [0, -3, 3, -2, 2, 0] }, { duration: 1.8, delay: d });
        g.gesture("l", { x: [8, 14, 9, 12], y: [70, 84, 74, 78] }, { duration: 1.6, delay: d, repeat: Infinity }, false);
        g.gesture("r", { x: [112, 106, 111, 108], y: [84, 70, 80, 74] }, { duration: 1.6, delay: d + 0.2, repeat: Infinity }, false);
        break;
      case "error":
        eyesCtl.start({ opacity: [1, 0.15, 1, 0.3, 1] }, { duration: 0.5, delay: d, repeat: Infinity, repeatDelay: 2 });
        action.start({ x: [0, -2, 2, -1, 0] }, { duration: 0.3, delay: d, repeat: Infinity, repeatDelay: 2.2 });
        // Hands clutch the head and shake.
        g.gesture("l", { x: [16, 20, 16, 20], y: [38, 42, 38, 40] }, { duration: 0.5, delay: d, repeat: Infinity, repeatDelay: 2 }, false);
        g.gesture("r", { x: [104, 100, 104, 100], y: [42, 38, 42, 40] }, { duration: 0.5, delay: d, repeat: Infinity, repeatDelay: 2 }, false);
        break;
      case "lookAround":
        gaze.start({ x: [0, -3.5, -3.5, 3.5, 3.5, 0] }, { duration: 3.4, delay: d, times: [0, 0.15, 0.4, 0.55, 0.85, 1], repeat: Infinity, repeatDelay: 1.2 });
        action.start({ rotate: [0, -4, -4, 4, 4, 0] }, { duration: 3.4, delay: d, times: [0, 0.15, 0.4, 0.55, 0.85, 1], repeat: Infinity, repeatDelay: 1.2 });
        // The visor hand travels with the gaze.
        g.gesture("r", { x: [86, 80, 80, 90, 90, 86] }, { duration: 3.4, delay: d, times: [0, 0.15, 0.4, 0.55, 0.85, 1], repeat: Infinity, repeatDelay: 1.2 }, false);
        break;
      case "warmup":
        eyesCtl.start({ opacity: [0.35, 1, 0.35] }, { duration: 2.2, delay: d, repeat: Infinity, ease: EASE });
        ringCtl.start({ scale: [0.9, 1.2], opacity: [0.25, 0] }, { duration: 2.2, delay: d, repeat: Infinity, ease: "easeOut" });
        // Rubbing the hands to warm up.
        g.gesture("l", { x: [52, 56, 52], y: [100, 98, 100] }, { duration: 0.45, delay: d, repeat: Infinity }, false);
        g.gesture("r", { x: [68, 64, 68], y: [98, 100, 98] }, { duration: 0.45, delay: d, repeat: Infinity }, false);
        break;
      case "unplugged":
        // Scratches its head over the silence.
        g.gesture("r", { y: [44, 40, 44, 40, 44], r: [30, 20, 30, 20, 30] }, { duration: 0.9, delay: d + 0.5, repeat: Infinity, repeatDelay: 1.8 }, false);
        action.start({ rotate: [0, -2, 0] }, { duration: 2.4, delay: d + 0.6, repeat: Infinity, repeatDelay: 1.6 });
        break;
      case "sad":
        action.start({ y: [0, 3, 0], scaleY: [1, 0.95, 1] }, { duration: 0.6, delay: d });
        break;
      case "surprised":
        action.start({ y: [0, -8, 0], scaleY: [1, 1.08, 1] }, { duration: 0.45, delay: d });
        g.gesture("l", { y: [52, 58] }, { duration: 0.45, delay: d });
        g.gesture("r", { y: [52, 58] }, { duration: 0.45, delay: d + 0.03 });
        break;
      case "wave":
        action.start({ rotate: [-3, -5, -3] }, { duration: 1.2, delay: d, repeat: Infinity, repeatDelay: 1.4 });
        g.gesture("r", { r: [15, -15, 20, -15, 15], x: [108, 110, 108, 110, 108] }, { duration: 1.2, delay: d, repeat: Infinity, repeatDelay: 1.4 }, false);
        break;
      case "approve":
        // Thumb pops up with a nod.
        g.gesture("r", { y: [78, 58, 62], r: [-30, 8, 0] }, { duration: 0.55, delay: d });
        action.start({ y: [0, 2, 0], rotate: [0, 3, 0] }, { duration: 0.5, delay: d + 0.25 });
        action.start({ y: [0, 2, 0] }, { duration: 0.5, delay: d + 2.2, repeat: Infinity, repeatDelay: 2.4 });
        break;
      case "chill":
        action.start({ rotate: [-4, -6, -4] }, { duration: 4.5, delay: d, repeat: Infinity, ease: EASE });
        break;
      case "wait":
        // Drums the fingers, sighs now and then.
        g.gesture("r", { y: [100, 104, 100, 104, 100, 104] }, { duration: 0.9, delay: d, repeat: Infinity, repeatDelay: 1 }, false);
        gaze.start({ x: [0, 0, 5, 5, 0] }, { duration: 4, delay: d + 1, times: [0, 0.3, 0.4, 0.8, 1], repeat: Infinity });
        action.start({ scaleY: [1, 1.04, 0.97, 1] }, { duration: 1.2, delay: d + 3, repeat: Infinity, repeatDelay: 4 });
        break;
      case "ready":
        // Rubs the hands, then a little bounce of anticipation.
        g.gesture("l", { x: [50, 55, 50, 55, 50] }, { duration: 0.8, delay: d, repeat: Infinity, repeatDelay: 1.8 }, false);
        g.gesture("r", { x: [70, 65, 70, 65, 70] }, { duration: 0.8, delay: d, repeat: Infinity, repeatDelay: 1.8 }, false);
        action.start({ y: [0, -4, 0] }, { duration: 0.5, delay: d + 0.85, repeat: Infinity, repeatDelay: 2.1 });
        break;
      default:
        break;
    }
    return () => {
      if (!mounted.current) return;
      g.stopHands();
      actionCtl.stop();
      gazeCtl.stop();
      eyesCtl.stop();
      actionCtl.start({ x: 0, y: 0, rotate: 0, scaleX: 1, scaleY: 1 }, { duration: 0.3 });
      gazeCtl.start({ x: 0, y: 0 }, { duration: 0.3 });
      eyesCtl.start({ opacity: 1 }, { duration: 0.2 });
      g.settleHands();
    };
    // Only a change of mood replays an entry reaction.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mood, reduceMotion]);

  // ── Blink every 3.5–6 s while the eyes are open ──
  const canBlink = loops && !eyesClosed && ["open", "wide", "focus"].includes(pose.eyes);
  useEffect(() => {
    if (!canBlink) return undefined;
    let timer: ReturnType<typeof setTimeout>;
    const next = () => {
      timer = setTimeout(() => {
        setBlink((b) => b + 1);
        next();
      }, 3500 + Math.random() * 2500);
    };
    next();
    return () => clearTimeout(timer);
  }, [canBlink]);

  // ── Talking: eyes pulse in syllables, one hand explains, a ring keeps time ──
  useEffect(() => {
    if (!talking || reduceMotion) return undefined;
    const g = handsApi.current;
    const p = poseRef.current;
    const id = setInterval(() => setSyllable((n) => (Math.random() < 0.3 ? 0 : n + 1)), 130);
    ringCtl.start({ scale: [0.9, 1.15], opacity: [0.35, 0] }, { duration: 0.6, repeat: Infinity, ease: "easeOut" });
    g.gesture("r", { x: [p.r.x - 2, p.r.x + 1, p.r.x - 1, p.r.x], y: [p.r.y - 10, p.r.y - 4, p.r.y - 8, p.r.y], r: [-10, 15, 0, p.r.r] }, { duration: 1.8, repeat: Infinity }, false);
    return () => {
      clearInterval(id);
      if (!mounted.current) return;
      setSyllable(0);
      ringCtl.stop();
      ringCtl.start({ opacity: 0 }, { duration: 0.2 });
      g.stopHands();
      g.settleHands();
    };
  }, [talking, reduceMotion, ringCtl]);

  // ── Idle life: rare, small ──
  const play = async (act: Action) => {
    if (busy.current) return;
    busy.current = true;
    const g = handsApi.current;
    if (act === "glance") {
      await gaze.start({ x: [0, -3.5, -3.5, 3.5, 3.5, 0] }, { duration: 2.2, times: [0, 0.12, 0.4, 0.52, 0.85, 1] });
    } else if (act === "lookUp") {
      await gaze.start({ y: [0, -3.5, -3.5, 0], x: [0, 1, 1, 0] }, { duration: 1.8, times: [0, 0.2, 0.75, 1] });
    } else if (act === "bounce") {
      setJoy(true);
      g.gesture("l", { y: [92, 76, 86] }, { duration: 0.7, delay: 0.05 });
      g.gesture("r", { y: [92, 76, 86] }, { duration: 0.7, delay: 0.08 });
      await action.start({ y: [0, 2, -10, 1, 0], scaleX: [1, 1.06, 0.97, 1.03, 1], scaleY: [1, 0.94, 1.04, 0.97, 1] }, { duration: 0.65, times: [0, 0.18, 0.5, 0.8, 1] });
      setJoy(false);
    } else if (act === "tilt") {
      g.gesture("l", { y: [80, 86] }, { duration: 1.4 });
      await action.start({ rotate: [0, -5, -5, 0] }, { duration: 1.4, times: [0, 0.25, 0.75, 1] });
    } else if (act === "wave") {
      setJoy(true);
      await new Promise<void>((resolve) => {
        g.gesture("r", { x: [108, 109, 108, 109, 107], y: [48, 44, 44, 44, 86], r: [15, -15, 20, -15, 10] }, { duration: 1.6 });
        setTimeout(resolve, 1600);
      });
      setJoy(false);
    } else if (act === "stretch") {
      g.gesture("l", { x: [12, 12, 13], y: [40, 40, 86], r: [-20, -20, -10] }, { duration: 1.6 });
      g.gesture("r", { x: [108, 108, 107], y: [40, 40, 86], r: [20, 20, 10] }, { duration: 1.6 });
      await action.start({ scaleY: [1, 1.06, 1.06, 1], scaleX: [1, 0.97, 0.97, 1] }, { duration: 1.6, times: [0, 0.35, 0.7, 1] });
    } else {
      burstRings(0);
      await action.start({ scaleX: [1, 1.04, 1], scaleY: [1, 0.97, 1] }, { duration: 0.35 });
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
    if (arrive) {
      timers.push(
        setTimeout(() => {
          actionCtl.set({ y: -18, scaleY: 1.05, scaleX: 0.96, opacity: 0 });
          action.start({ y: [-18, 1, 0], scaleY: [1.05, 0.94, 1], scaleX: [0.96, 1.05, 1], opacity: [0, 1, 1] }, { duration: 0.5, times: [0, 0.6, 1] });
        }, 150),
      );
      // …and says hello.
      timers.push(setTimeout(() => playRef.current("wave"), 750));
    }
    if (lively) {
      const next = () => {
        timers.push(
          setTimeout(
            () => {
              playRef.current(ACTIONS[Math.floor(Math.random() * ACTIONS.length)]);
              next();
            },
            4000 + Math.random() * 3000,
          ),
        );
      };
      next();
    }
    return () => timers.forEach(clearTimeout);
  }, [mood, lively, arrive, reduceMotion, talking, awake, action, actionCtl]);

  const onHover = () => {
    if (!lively || reduceMotion || mood !== "idle" || eyesClosed || talking) return;
    playRef.current("wave");
  };

  // ── Listen ──
  const level = Math.max(0, Math.min(1, signal));
  const listening = mood === "listen";

  // Idle life on the body: breath plus a slow sway, so it is never a statue.
  const breath: TargetAndTransition = !loops || mood === "dizzy" || mood === "error"
    ? { scaleY: 1, scaleX: 1, rotate: 0 }
    : mood === "asleep" || mood === "standby"
      ? { scaleY: [1, 1.03, 1], scaleX: [1, 0.99, 1], rotate: 0, transition: { duration: 4, repeat: Infinity, ease: EASE } }
      : {
          scaleY: [1, 1.015, 1, 1.015, 1],
          rotate: [0, 0.8, 0, -0.8, 0],
          transition: { duration: 6, repeat: Infinity, ease: EASE },
        };

  const origin = { transformBox: "fill-box" as const, transformOrigin: "50% 100%" };
  const talk = talking && !reduceMotion ? syllable % 2 : 0;
  const shapeL = pose.l.shape ?? "mitt";
  const shapeR = pose.r.shape ?? "mitt";
  // Hands float a little on their own, out of phase with each other.
  const float = (phase: number): TargetAndTransition =>
    loops && !eyesClosed ? { y: [0, -1.6, 0], transition: { duration: 2.6, repeat: Infinity, ease: EASE, delay: phase } } : { y: 0 };
  const hands = (behind: boolean) => (
    <>
      {!!pose.l.behind === behind && (
        <motion.g initial={false} animate={float(0)}>
          <Hand mv={hand.l} shape={shapeL} />
        </motion.g>
      )}
      {!!pose.r.behind === behind && (
        <motion.g initial={false} animate={float(1.3)}>
          <Hand mv={hand.r} shape={shapeR} />
        </motion.g>
      )}
    </>
  );

  const maskId = `kostek-${uid}`;
  return (
    <motion.svg
      ref={svgRef}
      viewBox='4 16 112 110'
      overflow='visible'
      className={cn("h-32 w-auto", className)}
      aria-hidden
      onHoverStart={onHover}>
      <motion.ellipse
        cx='60'
        cy='121'
        rx='14'
        ry='2.2'
        fill={FG}
        opacity={0.18}
        style={{ transformBox: "fill-box", transformOrigin: "50% 50%" }}
        initial={false}
        animate={{ scaleX: pose.body.scaleX }}
      />

      {/* Sound rings, the one accent colour: a steady pulse while listening
          (the input sets how bright it is), single bursts on reactions. */}
      <motion.g
        initial={false}
        animate={{ opacity: listening && loops ? 0.25 + level * 0.75 : 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}>
        {[0, 1].map((i) =>
          listening && loops ? (
            <motion.circle
              key={`l${i}`}
              cx='60'
              cy='68'
              r='46'
              fill='none'
              stroke={C.ring}
              strokeWidth={2.4 - i * 0.8}
              style={{ transformBox: "fill-box", transformOrigin: "50% 50%" }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ scale: [0.9, 1.35], opacity: [0.7, 0] }}
              transition={{ duration: 1.3, repeat: Infinity, delay: i * 0.65, ease: "easeOut" }}
            />
          ) : (
            <motion.circle
              key={`r${i}`}
              cx='60'
              cy='68'
              r='46'
              fill='none'
              stroke={C.ring}
              strokeWidth={2.4 - i * 0.8}
              style={{ transformBox: "fill-box", transformOrigin: "50% 50%" }}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={ringCtl}
            />
          ),
        )}
      </motion.g>

      <motion.g style={origin} initial={false} animate={pose.body} transition={reduceMotion ? { duration: 0 } : SPRING}>
        <motion.g style={origin} initial={false} animate={breath}>
          <motion.g style={origin} animate={actionCtl}>
            {hands(true)}
            <motion.g
              style={origin}
              animate={listening && loops ? { scale: 1 + level * 0.04 } : { scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 22 }}>
              {/* The face is cut out of the body: the mask is white where the
                  body shows and black where the eyes are. */}
              <mask id={maskId} maskUnits='userSpaceOnUse' x='0' y='0' width='120' height='130'>
                <rect x='0' y='0' width='120' height='130' fill='#fff' />
                <motion.g initial={false} animate={{ x: pose.look.x, y: pose.look.y }} transition={reduceMotion ? { duration: 0 } : SPRING}>
                  <motion.g animate={gazeCtl}>
                    <motion.g animate={eyesCtl}>
                      <motion.g
                        key={blink}
                        style={{ transformBox: "fill-box", transformOrigin: "50% 50%" }}
                        animate={blink ? { scaleY: [1, 0.12, 1] } : { scaleY: 1 }}
                        transition={{ duration: 0.18, ease: EASE }}>
                        <Eye cx={EYE_L} shape={pose.eyes} side={-1} spin={loops} talk={talk} />
                        <Eye cx={EYE_R} shape={pose.eyes} side={1} spin={loops} talk={talk} />
                      </motion.g>
                    </motion.g>
                  </motion.g>
                </motion.g>
              </mask>
              <path d={BODY} fill={FG} mask={`url(#${maskId})`} />
            </motion.g>
            {hands(false)}
          </motion.g>
        </motion.g>
      </motion.g>
    </motion.svg>
  );
};

// ─── Still ────────────────────────────────────────────────────────────────────

/**
 * Kostek as a plain, motionless SVG for raster export (the email art). The
 * animated figure relies on CSS transform origins, which rasterisers ignore,
 * so every pose transform is written out as an SVG `transform` here, and the
 * colours are literal (`fg`, `bg` — the face is cut to `bg`).
 */
export const KostekStill = ({
  mood = "idle",
  lookAt,
  eyesClosed = false,
  fg = "#FBFBFA",
  bg = "#0B0D10",
}: {
  mood?: KostekMood;
  lookAt?: LookAt;
  eyesClosed?: boolean;
  fg?: string;
  bg?: string;
}) => {
  let pose = poseFor(mood, lookAt);
  if (eyesClosed) pose = { ...pose, eyes: "closed", l: { x: 50, y: 58, r: -15 }, r: { x: 70, y: 58, r: 15 } };
  const b = pose.body;
  const bodyT = `translate(60 115) rotate(${b.rotate}) scale(${b.scaleX} ${b.scaleY}) translate(-60 -115)`;
  const eye = (cx: number, side: -1 | 1) => {
    const cy = EYE_Y;
    const pill = PILL[pose.eyes];
    if (pill)
      return (
        <rect
          x={cx - pill.w / 2}
          y={cy - pill.h / 2 + pill.y}
          width={pill.w}
          height={pill.h}
          rx={Math.min(pill.w, pill.h) / 2}
          fill={bg}
          transform={`rotate(${pill.tilt * -side} ${cx} ${cy + pill.y})`}
        />
      );
    if (pose.eyes === "happy")
      return <path d={`M${cx - 4.6},${cy + 2.6} Q${cx},${cy - 5.4} ${cx + 4.6},${cy + 2.6}`} fill='none' stroke={bg} strokeWidth={3.4} strokeLinecap='round' />;
    if (pose.eyes === "content")
      return <path d={`M${cx - 4.4},${cy + 2.4} Q${cx},${cy - 1.6} ${cx + 4.4},${cy + 2.4}`} fill='none' stroke={bg} strokeWidth={3.2} strokeLinecap='round' />;
    if (pose.eyes === "closed") return <path d={`M${cx - 4},${cy + 1.5} L${cx + 4},${cy + 1.5}`} fill='none' stroke={bg} strokeWidth={3.2} strokeLinecap='round' />;
    return (
      <path
        d={`M${cx},${cy} m-1.2,0 a1.2,1.2 0 1,1 2.4,0 a2.4,2.4 0 1,1 -4.8,0 a3.6,3.6 0 1,1 7.2,0`}
        fill='none'
        stroke={bg}
        strokeWidth={2.1}
        strokeLinecap='round'
      />
    );
  };
  const hand = (h: HandPose) => (
    <g transform={`translate(${h.x} ${h.y}) rotate(${h.r})`} style={{ ["--mascot-fg" as string]: fg }}>
      <HandShapes shape={h.shape ?? "mitt"} />
    </g>
  );
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='4 16 112 110' overflow='visible' style={{ ["--mascot-fg" as string]: fg }}>
      <ellipse cx='60' cy='121' rx={14 * b.scaleX} ry='2.2' fill={fg} opacity={0.18} />
      <g transform={bodyT}>
        {pose.l.behind && hand(pose.l)}
        {pose.r.behind && hand(pose.r)}
        <path d={BODY} fill={fg} />
        <g transform={`translate(${pose.look.x} ${pose.look.y})`}>
          {eye(EYE_L, -1)}
          {eye(EYE_R, 1)}
        </g>
        {!pose.l.behind && hand(pose.l)}
        {!pose.r.behind && hand(pose.r)}
      </g>
    </svg>
  );
};

// ─── Speech ───────────────────────────────────────────────────────────────────

/**
 * Kostek with a speech bubble: the line types itself out while the eyes keep
 * time and a hand explains, then it goes quiet. Reduced motion shows the line at once.
 */
export const KostekSays = ({
  text,
  mood = "idle",
  layout = "row",
  className,
  kostekClassName,
  bubbleClassName,
  delay = 0.3,
  children,
  ...echoProps
}: Omit<KostekProps, "talking" | "className"> & {
  text: string;
  layout?: "row" | "column";
  className?: string;
  kostekClassName?: string;
  bubbleClassName?: string;
  children?: ReactNode;
}) => {
  const reduceMotion = !!useReducedMotion();
  const [typed, setTyped] = useState({ text, count: 0 });
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
      <Kostek {...echoProps} mood={mood} talking={talking} className={cn("h-24 shrink-0", kostekClassName)} />
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, scale: 0.9, x: column ? 0 : -8, y: column ? -6 : 0 }}
        animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
        transition={{ delay: reduceMotion ? 0 : delay * 0.6, type: "spring", stiffness: 300, damping: 24 }}
        className={cn("relative max-w-xs rounded-lg bg-zinc-800 px-4 py-3 text-left text-sm leading-relaxed text-zinc-100", column && "text-center", bubbleClassName)}>
        <span
          aria-hidden
          className={cn("absolute h-3 w-3 rotate-45 bg-zinc-800", column ? "-top-1.5 left-1/2 -translate-x-1/2" : "-left-1.5 top-1/2 -translate-y-1/2")}
        />
        <span className='invisible' aria-hidden>
          {children ?? text}
        </span>
        <span className='absolute inset-0 px-4 py-3' aria-live='polite'>
          {talking ? text.slice(0, shown) : (children ?? text)}
        </span>
      </motion.div>
    </div>
  );
};

/**
 * Kostek's face alone for 16–32 px (header streak chip, small markers): the
 * pick with its eyes cut out. `active` is the streak — solid while it lives,
 * faded and asleep once it breaks.
 */
export const KostekFace = ({
  className,
  active = true,
  asleep = false,
  title,
}: {
  className?: string;
  active?: boolean;
  asleep?: boolean;
  title?: string;
}) => {
  const id = `kostek-face-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <svg viewBox='18 22 84 96' className={cn("h-6 w-6", className)} role={title ? "img" : undefined} aria-hidden={title ? undefined : true}>
      {title && <title>{title}</title>}
      <mask id={id} maskUnits='userSpaceOnUse' x='0' y='0' width='120' height='130'>
        <rect x='0' y='0' width='120' height='130' fill='#fff' />
        {asleep ? (
          <g fill='none' stroke='#000' strokeWidth={6} strokeLinecap='round'>
            <path d='M43 60 L55 60' />
            <path d='M65 60 L77 60' />
          </g>
        ) : (
          <>
            <rect x='45' y='47' width='10' height='22' rx='5' fill='#000' />
            <rect x='65' y='47' width='10' height='22' rx='5' fill='#000' />
          </>
        )}
      </mask>
      <path d={BODY} fill={FG} mask={`url(#${id})`} opacity={active ? 1 : 0.45} />
    </svg>
  );
};
