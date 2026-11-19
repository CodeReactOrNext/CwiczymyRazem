import { animate, type MotionValue, type TargetAndTransition, type Transition, type useAnimationControls } from "framer-motion";

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
export const smoothMove = (target: TargetAndTransition, tr: Transition = {}): [TargetAndTransition, Transition] => {
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
export const smoothControls = (c: Controls) => ({
  start: (target: TargetAndTransition, tr?: Transition) => c.start(...smoothMove(target, tr)),
  stop: () => c.stop(),
});

/**
 * Plays keyframes on a motion value along a spline that starts from wherever
 * the value is the moment the move actually begins (after any delay).
 */
export const splineValue = (mv: MotionValue<number>, keys: number[], tr: Transition) => {
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
