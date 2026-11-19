import { cn } from "assets/lib/utils";
import { motion, type TargetAndTransition, type Transition, useAnimationControls, useReducedMotion } from "framer-motion";
import { type ReactNode, useEffect, useId, useMemo, useRef, useState } from "react";

import { smoothControls } from "./smoothMotion";

/**
 * Echo — the Riff Quest mascot (see docs/MASCOT.md), "Noir" style: a dark
 * pebble the colour of the app with two glowing eyes and one cyan rim of light.
 * No mouth, no cheeks, no stickers: everything it feels is the shape of the
 * eyes, how the light on it glows or dims, and a restrained squash of the body.
 * Sound rings around it show what it hears.
 *
 * Layers: pose (held tilt / squash of a mood) → breath (idle loop) → action
 * (one-off reactions) → face (eyes, gaze). Keyframe moves run along splines
 * (smoothMotion) so they never stop-and-go. Loops only run while Echo is on
 * screen and the tab is in front. Reduced motion: expression only.
 */

export type EchoMood =
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
  | "think";

type LookAt = "left" | "right" | "up" | "down";

const C = {
  body: "#272C34",
  shade: "#1C2026",
  eye: "#67E8F9",
  eyeDim: "#2E6F7B",
  rim: "#22D3EE",
  rimOff: "#2A3036",
  ring: "#22D3EE",
  warn: "#F4B63E",
};

const EASE: [number, number, number, number] = [0.45, 0, 0.25, 1];
const SPRING: Transition = { type: "spring", stiffness: 220, damping: 20 };
const BODY = "M22 70 C22 44 38 30 60 30 C82 30 98 44 98 70 C98 92 82 104 60 104 C38 104 22 92 22 70 Z";
const SHADE = "M98 70 C98 92 82 104 60 104 C76 98 88 86 90 66 C92 56 90 48 86 42 C94 50 98 58 98 70 Z";
const RIM = "M30 56 C34 42 46 34 60 33";

// ─── Eyes ─────────────────────────────────────────────────────────────────────
// Two glowing pills. Every expression is a change of their size, tilt or a
// swap to a stroke (arcs for joy, flat lines for closed, spirals for dizzy).
type EyeShape = "open" | "happy" | "closed" | "sad" | "wide" | "focus" | "sleepy" | "spiral";
const EYE_Y = 64;
type PillShape = { w: number; h: number; tilt: number; y: number };
const PILL: Partial<Record<EyeShape, PillShape>> = {
  open: { w: 6.4, h: 15, tilt: 0, y: 0 },
  wide: { w: 8, h: 18, tilt: 0, y: -1 },
  sad: { w: 6.4, h: 12, tilt: 18, y: 1 },
  focus: { w: 6.4, h: 7.5, tilt: -14, y: 1 },
  sleepy: { w: 6.4, h: 5, tilt: 0, y: 3 },
};

const Eye = ({ cx, shape, side, spin, talk }: { cx: number; shape: EyeShape; side: -1 | 1; spin: boolean; talk: number }) => {
  const cy = EYE_Y;
  const t = { duration: 0.16, ease: EASE };
  const pill = PILL[shape];
  const show = (s: EyeShape) => ({ opacity: shape === s ? 1 : 0 });
  const dim = shape === "sleepy";
  return (
    <>
      {/* The pill: size, tilt and a nod down for sad / focus, a squeeze while talking. */}
      <motion.rect
        x={cx - 3.2}
        y={cy - 7.5}
        width={6.4}
        height={15}
        rx={3.2}
        fill={dim ? C.eyeDim : C.eye}
        style={{ transformBox: "fill-box", transformOrigin: "50% 50%" }}
        initial={false}
        animate={
          pill
            ? {
                opacity: 1,
                scaleX: pill.w / 6.4,
                scaleY: (pill.h / 15) * (talk ? 0.82 : 1),
                rotate: pill.tilt * -side,
                y: pill.y,
              }
            : { opacity: 0, scaleX: 1, scaleY: 0.6, rotate: 0, y: 0 }
        }
        transition={t}
      />
      <motion.path
        d={`M${cx - 6},${cy + 3} Q${cx},${cy - 6} ${cx + 6},${cy + 3}`}
        fill='none'
        stroke={C.eye}
        strokeWidth={5}
        strokeLinecap='round'
        initial={false}
        animate={show("happy")}
        transition={t}
      />
      <motion.path
        d={`M${cx - 5},${cy + 2} L${cx + 5},${cy + 2}`}
        fill='none'
        stroke={C.eyeDim}
        strokeWidth={5}
        strokeLinecap='round'
        initial={false}
        animate={show("closed")}
        transition={t}
      />
      <motion.g initial={false} animate={show("spiral")} transition={t}>
        <motion.path
          d={`M${cx},${cy} m-1.5,0 a1.5,1.5 0 1,1 3,0 a3,3 0 1,1 -6,0 a4.5,4.5 0 1,1 9,0`}
          fill='none'
          stroke={C.eye}
          strokeWidth={2.6}
          strokeLinecap='round'
          style={{ transformBox: "fill-box", transformOrigin: "50% 50%" }}
          animate={spin ? { rotate: side * 360 } : { rotate: 0 }}
          transition={spin ? { duration: 1.4, repeat: Infinity, ease: "linear" } : { duration: 0 }}
        />
      </motion.g>
    </>
  );
};

// ─── Moods ────────────────────────────────────────────────────────────────────
type Look = { x: number; y: number };
const LOOK: Record<LookAt, Look> = { left: { x: -3.5, y: 0.5 }, right: { x: 3.5, y: 0.5 }, up: { x: 0, y: -3.5 }, down: { x: 0, y: 3 } };
type Pose = {
  eyes: EyeShape;
  look: Look;
  body: { scaleX: number; scaleY: number; rotate: number; y: number };
  /** Light level: the rim and the eyes dim when it is low on energy. */
  lit: boolean;
};
const REST = { scaleX: 1, scaleY: 1, rotate: 0, y: 0 };
const ZERO: Look = { x: 0, y: 0 };

const poseFor = (mood: EchoMood, lookAt?: LookAt): Pose => {
  const look = lookAt ? LOOK[lookAt] : null;
  const s = lookAt === "left" ? -1 : 1;
  switch (mood) {
    case "celebrate":
    case "hop":
    case "levelUp":
    case "plugIn":
      return { eyes: "happy", look: ZERO, body: REST, lit: true };
    case "asleep":
      return { eyes: "closed", look: ZERO, body: { scaleX: 1.04, scaleY: 0.95, rotate: 6, y: 0 }, lit: false };
    case "standby":
      return { eyes: "sleepy", look: { x: 0, y: 1.5 }, body: { scaleX: 1.02, scaleY: 0.97, rotate: 3, y: 0 }, lit: false };
    case "focus":
      return { eyes: "focus", look: { x: 0, y: 1 }, body: { scaleX: 1.05, scaleY: 0.94, rotate: 0, y: 0 }, lit: true };
    case "nudge":
      return { eyes: "open", look: look ?? LOOK.right, body: { ...REST, rotate: s * 6 }, lit: true };
    case "shrug":
    case "think":
      return { eyes: "open", look: look ?? { x: 2.5, y: -3 }, body: { ...REST, rotate: -5 }, lit: true };
    case "dizzy":
    case "error":
      return { eyes: "spiral", look: ZERO, body: { ...REST, rotate: -3 }, lit: true };
    case "warmup":
      return { eyes: "sleepy", look: ZERO, body: { ...REST, scaleY: 0.98 }, lit: false };
    case "unplugged":
      return { eyes: "sad", look: look ?? LOOK.down, body: { scaleX: 1.03, scaleY: 0.96, rotate: -5, y: 0 }, lit: false };
    case "listen":
      return { eyes: "open", look: look ?? { x: 0, y: -1.5 }, body: REST, lit: true };
    case "sad":
      return { eyes: "sad", look: { x: 0, y: 2 }, body: { scaleX: 1.04, scaleY: 0.93, rotate: 0, y: 0 }, lit: true };
    case "surprised":
      return { eyes: "wide", look: ZERO, body: { scaleX: 0.96, scaleY: 1.05, rotate: 0, y: 0 }, lit: true };
    default:
      return { eyes: "open", look: look ?? ZERO, body: REST, lit: true };
  }
};

// ─── Echo ─────────────────────────────────────────────────────────────────────
type Action = "glance" | "bounce" | "tilt" | "ping" | "lookUp";
const ACTIONS: Action[] = ["glance", "ping", "tilt", "glance", "lookUp", "bounce"];

export interface EchoProps {
  mood?: EchoMood;
  className?: string;
  /** Extra wait (s) before the entry reaction, e.g. while a parent enters. */
  delay?: number;
  /** Idle: small random actions every few seconds and a hover reaction. */
  lively?: boolean;
  /** Idle: drop in with a squash shortly after mounting. */
  arrive?: boolean;
  /** Celebrate: one hop instead of the full reaction. */
  short?: boolean;
  /** Where it looks (and leans, for nudge). */
  lookAt?: LookAt;
  /** Shut the eyes (e.g. while a password is typed). */
  eyesClosed?: boolean;
  /** Listen: input level 0–1 driving the rings and the body pulse. */
  signal?: number;
  /** Speaking: the eyes pulse in syllables and a faint ring keeps time. */
  talking?: boolean;
}

export const Echo = ({
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
}: EchoProps) => {
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
  if (eyesClosed) pose = { ...pose, eyes: "closed" };
  if (joy) pose = { ...pose, eyes: "happy" };

  const burstRings = (at: number, times = 1) =>
    ringCtl.start({ scale: [0.85, 1.45], opacity: [0.7, 0] }, { duration: 0.8, delay: at, repeat: times - 1, ease: "easeOut" });

  // ── Entry reaction for each mood: short and restrained ──
  useEffect(() => {
    if (reduceMotion) return undefined;
    const d = delay + 0.15;
    const hop = (h: number, at: number) =>
      action.start(
        { y: [0, 2, -h, 1, 0], scaleX: [1, 1.07, 0.96, 1.04, 1], scaleY: [1, 0.93, 1.05, 0.96, 1] },
        { duration: 0.7, delay: at, times: [0, 0.18, 0.5, 0.8, 1] },
      );

    switch (mood) {
      case "celebrate":
        if (short) {
          hop(14, d);
          burstRings(d + 0.35);
          break;
        }
        action.start(
          { y: [0, 2, -24, 1, -8, 0], scaleX: [1, 1.08, 0.95, 1.06, 0.98, 1], scaleY: [1, 0.92, 1.06, 0.94, 1.02, 1] },
          { duration: 1.3, delay: d, times: [0, 0.12, 0.42, 0.66, 0.84, 1] },
        );
        burstRings(d + 0.5, 2);
        break;
      case "hop":
        hop(14, d);
        burstRings(d + 0.35);
        break;
      case "plugIn":
        // Sound comes back: the light snaps on, one hop with the rings.
        eyesCtl.start({ opacity: [0.2, 1, 0.4, 1] }, { duration: 0.45, delay: d });
        hop(14, d + 0.4);
        burstRings(d + 0.6, 2);
        break;
      case "levelUp":
        // Crouch, a turn in the air, land, rings.
        action.start(
          { y: [0, 3, -30, 2, 0], scaleX: [1, 1.1, 0.95, 1.06, 1], scaleY: [1, 0.88, 1.05, 0.94, 1], rotate: [0, 0, 360, 360, 360] },
          { duration: 1.2, delay: d, times: [0, 0.2, 0.6, 0.82, 1] },
        );
        burstRings(d + 0.8, 3);
        break;
      case "focus":
        action.start({ y: [0, -3, 0] }, { duration: 0.6, delay: d + 0.2, repeat: Infinity, repeatDelay: 0.6 });
        break;
      case "nudge": {
        const s = lookAt === "left" ? -1 : 1;
        action.start({ x: [0, s * 5, 0], y: [0, -4, 0] }, { duration: 0.7, delay: d, repeat: Infinity, repeatDelay: 2.2 });
        break;
      }
      case "shrug":
        action.start({ rotate: [0, 5, -3, 0] }, { duration: 1.1, delay: d + 0.2, repeat: Infinity, repeatDelay: 2.8 });
        break;
      case "dizzy":
        action.start({ rotate: [0, -7, 7, -4, 4, 0], x: [0, -3, 3, -2, 2, 0] }, { duration: 1.8, delay: d });
        break;
      case "error":
        // A short-circuit: the light flickers, a nervous jitter.
        eyesCtl.start({ opacity: [1, 0.15, 1, 0.3, 1] }, { duration: 0.5, delay: d, repeat: Infinity, repeatDelay: 2 });
        action.start({ x: [0, -2, 2, -1, 0] }, { duration: 0.3, delay: d, repeat: Infinity, repeatDelay: 2.2 });
        break;
      case "lookAround":
        gaze.start({ x: [0, -3.5, -3.5, 3.5, 3.5, 0] }, { duration: 3.4, delay: d, times: [0, 0.15, 0.4, 0.55, 0.85, 1], repeat: Infinity, repeatDelay: 1.2 });
        action.start({ rotate: [0, -4, -4, 4, 4, 0] }, { duration: 3.4, delay: d, times: [0, 0.15, 0.4, 0.55, 0.85, 1], repeat: Infinity, repeatDelay: 1.2 });
        break;
      case "warmup":
        // The light comes up slowly, again and again.
        eyesCtl.start({ opacity: [0.35, 1, 0.35] }, { duration: 2.2, delay: d, repeat: Infinity, ease: EASE });
        ringCtl.start({ scale: [0.9, 1.2], opacity: [0.25, 0] }, { duration: 2.2, delay: d, repeat: Infinity, ease: "easeOut" });
        break;
      case "sad":
        action.start({ y: [0, 3, 0], scaleY: [1, 0.95, 1] }, { duration: 0.6, delay: d });
        break;
      case "surprised":
        action.start({ y: [0, -8, 0], scaleY: [1, 1.08, 1] }, { duration: 0.45, delay: d });
        break;
      default:
        break;
    }
    return () => {
      if (!mounted.current) return;
      actionCtl.stop();
      gazeCtl.stop();
      eyesCtl.stop();
      actionCtl.start({ x: 0, y: 0, rotate: 0, scaleX: 1, scaleY: 1 }, { duration: 0.3 });
      gazeCtl.start({ x: 0, y: 0 }, { duration: 0.3 });
      eyesCtl.start({ opacity: 1 }, { duration: 0.2 });
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

  // ── Talking: the eyes pulse in syllables, a faint ring keeps time ──
  useEffect(() => {
    if (!talking || reduceMotion) return undefined;
    const id = setInterval(() => setSyllable((n) => (Math.random() < 0.3 ? 0 : n + 1)), 130);
    ringCtl.start({ scale: [0.9, 1.15], opacity: [0.35, 0] }, { duration: 0.6, repeat: Infinity, ease: "easeOut" });
    return () => {
      clearInterval(id);
      if (!mounted.current) return;
      setSyllable(0);
      ringCtl.stop();
      ringCtl.start({ opacity: 0 }, { duration: 0.2 });
    };
  }, [talking, reduceMotion, ringCtl]);

  // ── Idle life: rare, small ──
  const play = async (act: Action) => {
    if (busy.current) return;
    busy.current = true;
    if (act === "glance") {
      await gaze.start({ x: [0, -3.5, -3.5, 3.5, 3.5, 0] }, { duration: 2.2, times: [0, 0.12, 0.4, 0.52, 0.85, 1] });
    } else if (act === "lookUp") {
      await gaze.start({ y: [0, -3.5, -3.5, 0], x: [0, 1, 1, 0] }, { duration: 1.8, times: [0, 0.2, 0.75, 1] });
    } else if (act === "bounce") {
      setJoy(true);
      await action.start({ y: [0, 2, -10, 1, 0], scaleX: [1, 1.06, 0.97, 1.03, 1], scaleY: [1, 0.94, 1.04, 0.97, 1] }, { duration: 0.65, times: [0, 0.18, 0.5, 0.8, 1] });
      setJoy(false);
    } else if (act === "tilt") {
      await action.start({ rotate: [0, -5, -5, 0] }, { duration: 1.4, times: [0, 0.25, 0.75, 1] });
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
    if (arrive)
      timers.push(
        setTimeout(() => {
          actionCtl.set({ y: -18, scaleY: 1.05, scaleX: 0.96, opacity: 0 });
          action.start({ y: [-18, 1, 0], scaleY: [1.05, 0.94, 1], scaleX: [0.96, 1.05, 1], opacity: [0, 1, 1] }, { duration: 0.5, times: [0, 0.6, 1] });
        }, 150),
      );
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
    playRef.current("ping");
  };

  // ── Listen ──
  const level = Math.max(0, Math.min(1, signal));
  const listening = mood === "listen";

  const breath: TargetAndTransition = !loops || mood === "dizzy" || mood === "error"
    ? { scaleY: 1, scaleX: 1 }
    : mood === "asleep" || mood === "standby"
      ? { scaleY: [1, 1.03, 1], scaleX: [1, 0.99, 1], transition: { duration: 4, repeat: Infinity, ease: EASE } }
      : { scaleY: [1, 1.015, 1], transition: { duration: 3, repeat: Infinity, ease: EASE } };

  const origin = { transformBox: "fill-box" as const, transformOrigin: "50% 100%" };
  const talk = talking && !reduceMotion ? syllable % 2 : 0;

  return (
    <motion.svg ref={svgRef} viewBox='10 18 100 98' overflow='visible' className={cn("h-32 w-auto", className)} aria-hidden onHoverStart={onHover}>
      <defs>
        <clipPath id={`echo-${uid}`}>
          <path d={BODY} />
        </clipPath>
      </defs>

      <motion.ellipse
        cx='60'
        cy='111'
        rx='30'
        ry='3.6'
        fill='#000'
        opacity={0.35}
        style={{ transformBox: "fill-box", transformOrigin: "50% 50%" }}
        initial={false}
        animate={{ scaleX: pose.body.scaleX }}
      />

      {/* Sound rings: a steady pulse while listening (the input sets how
          bright it is), single bursts on reactions, none when it is dark. */}
      <motion.g
        initial={false}
        animate={{ opacity: listening && loops ? 0.25 + level * 0.75 : 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}>
        {[0, 1].map((i) =>
          listening && loops ? (
            <motion.circle
              key={`l${i}`}
              cx='60'
              cy='67'
              r='40'
              fill='none'
              stroke={C.ring}
              strokeWidth={2.4 - i * 0.8}
              style={{ transformBox: "fill-box", transformOrigin: "50% 50%" }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ scale: [0.9, 1.4], opacity: [0.7, 0] }}
              transition={{ duration: 1.3, repeat: Infinity, delay: i * 0.65, ease: "easeOut" }}
            />
          ) : (
            <motion.circle
              key={`r${i}`}
              cx='60'
              cy='67'
              r='40'
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
            <motion.g
              style={origin}
              animate={listening && loops ? { scale: 1 + level * 0.04 } : { scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 22 }}>
              <path d={BODY} fill={C.body} />
              <g clipPath={`url(#echo-${uid})`}>
                <path d={SHADE} fill={C.shade} />
              </g>
              {/* The rim of light: Echo's one bit of colour, dark when it is. */}
              <motion.path
                d={RIM}
                fill='none'
                strokeWidth={2.6}
                strokeLinecap='round'
                initial={false}
                animate={{ stroke: pose.lit ? C.rim : C.rimOff, opacity: pose.lit ? 0.95 : 0.8 }}
                transition={{ duration: 0.4 }}
              />

              {/* Face: shifts with the gaze so it reads as turning. */}
              <motion.g initial={false} animate={{ x: pose.look.x, y: pose.look.y }} transition={reduceMotion ? { duration: 0 } : SPRING}>
                <motion.g animate={gazeCtl}>
                  <motion.g animate={eyesCtl}>
                    <motion.g
                      key={blink}
                      style={{ transformBox: "fill-box", transformOrigin: "50% 50%" }}
                      animate={blink ? { scaleY: [1, 0.12, 1] } : { scaleY: 1 }}
                      transition={{ duration: 0.18, ease: EASE }}>
                      <Eye cx={48} shape={pose.eyes} side={-1} spin={loops} talk={talk} />
                      <Eye cx={72} shape={pose.eyes} side={1} spin={loops} talk={talk} />
                    </motion.g>
                  </motion.g>
                </motion.g>
              </motion.g>
            </motion.g>
          </motion.g>
        </motion.g>
      </motion.g>

      {/* A short-circuit is the one place a second colour shows. */}
      {loops && mood === "error" && (
        <motion.path
          d={RIM}
          fill='none'
          stroke={C.warn}
          strokeWidth={2.6}
          strokeLinecap='round'
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0, 0] }}
          transition={{ duration: 0.5, times: [0, 0.2, 0.5, 1], repeat: Infinity, repeatDelay: 2 }}
        />
      )}
    </motion.svg>
  );
};

// ─── Speech ───────────────────────────────────────────────────────────────────

/**
 * Echo with a speech bubble: the line types itself out while the eyes keep
 * time, then it goes quiet. Reduced motion shows the line at once.
 */
export const EchoSays = ({
  text,
  mood = "idle",
  layout = "row",
  className,
  echoClassName,
  bubbleClassName,
  delay = 0.3,
  children,
  ...echoProps
}: Omit<EchoProps, "talking" | "className"> & {
  text: string;
  layout?: "row" | "column";
  className?: string;
  echoClassName?: string;
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
      <Echo {...echoProps} mood={mood} talking={talking} className={cn("h-24 shrink-0", echoClassName)} />
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
 * Echo's face alone for 16–32 px (header streak chip, small markers). `active`
 * is the streak: eyes and rim lit while it lives, dark and asleep once it breaks.
 */
export const EchoFace = ({
  className,
  active = true,
  asleep = false,
  title,
}: {
  className?: string;
  active?: boolean;
  asleep?: boolean;
  title?: string;
}) => (
  <svg viewBox='18 26 84 82' className={cn("h-6 w-6", className)} role={title ? "img" : undefined} aria-hidden={title ? undefined : true}>
    {title && <title>{title}</title>}
    <path d={BODY} fill='#2A2F37' />
    <path d={RIM} fill='none' stroke={active ? C.rim : "#3A414A"} strokeWidth={4} strokeLinecap='round' />
    {asleep ? (
      <g fill='none' stroke={C.eyeDim} strokeWidth={6} strokeLinecap='round'>
        <path d='M42 66 L54 66' />
        <path d='M66 66 L78 66' />
      </g>
    ) : (
      <>
        <rect x='43.5' y='55' width='9' height='19' rx='4.5' fill={active ? C.eye : C.eyeDim} />
        <rect x='67.5' y='55' width='9' height='19' rx='4.5' fill={active ? C.eye : C.eyeDim} />
      </>
    )}
  </svg>
);
