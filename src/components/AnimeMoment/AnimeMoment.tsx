import { cn } from "assets/lib/utils";
import { Kostek, type KostekMood } from "components/Mascot/Kostek";
import { motion, useReducedMotion } from "framer-motion";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * A full-screen anime "moment" for the few big wins in the app (a finished
 * session, a mastered exam, a boss record, a roadmap guitar). It plays on its
 * own and hands over — no button; a click or Enter / Esc only skips ahead.
 *
 * Beats:
 *   0.00  three hairline slashes cut across the dark, focus lines fade in and
 *         flicker "on twos" like hand-drawn cels — nothing fills the screen
 *   0.45  the hero springs in (Kostek, or whatever `hero` is)
 *   land  a small shake, shockwaves, speed streaks and a burst of picks /
 *         notes / stars
 *   +     the title slams in letter by letter with a chromatic split, the
 *         underline swooshes, the chips pop — then it washes out.
 *
 * With reduced motion only the hero, the title and the chips are shown.
 */

const EASE_OUT = [0.22, 1, 0.36, 1] as const;
const WIPE_EASE = [0.7, 0, 0.3, 1] as const;

export interface AnimeMomentColors {
  /** First wipe band, focus-line accent, underline. */
  a: string;
  /** Second wipe band, shockwave, ghost of the title. */
  b: string;
}
const DEFAULT_COLORS: AnimeMomentColors = { a: "#22d3ee", b: "#f4b63e" };

interface AnimeMomentProps {
  title: string;
  subtitle?: ReactNode;
  /** What springs into the middle. Defaults to Kostek in `mood`. */
  hero?: ReactNode;
  mood?: KostekMood;
  /** Chips under the title (see AnimeChip). */
  children?: ReactNode;
  /** When the hero lands, in seconds — the impact beat is timed to it. */
  land?: number;
  durationMs?: number;
  /** Shared layout id, so the hero can fly on into the next screen. */
  layoutId?: string;
  colors?: AnimeMomentColors;
  zIndex?: number;
  /** A shorter cut for wins that repeat (the second session of a day): no
   *  eyecatch wipe or screen tone, and it hands over sooner. */
  brief?: boolean;
  onDone: () => void;
}

// ─── Focus lines ──────────────────────────────────────────────────────────────
// Three hand-varied sets of wedges, swapped every other frame at 12 fps so the
// lines shimmer like drawn cels instead of sitting still. They start well away
// from the centre, the way manga focus lines leave the subject clear.
const rand = (k: number, i: number) => {
  const x = Math.sin(k * 97.3 + i * 13.17) * 43758.5453;
  return x - Math.floor(x);
};
const LINE_SETS = [0, 1, 2].map((k) =>
  Array.from({ length: 60 }, (_, i) => {
    const a = (i / 60) * Math.PI * 2 + (rand(k, i) - 0.5) * 0.09;
    const w = 0.004 + rand(k + 7, i) * 0.012;
    const r0 = 250 + rand(k + 3, i) * 140;
    const r1 = 1500;
    const p = (r: number, t: number) => `${(Math.cos(t) * r).toFixed(1)},${(Math.sin(t) * r).toFixed(1)}`;
    return {
      d: `M${p(r0, a)} L${p(r1, a - w)} L${p(r1, a + w)} Z`,
      accent: i % 9 === 0 ? "a" : i % 9 === 5 ? "b" : null,
    };
  }),
);

const FocusLines = ({ land, colors }: { land: number; colors: AnimeMomentColors }) => {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setFrame((f) => (f + 1) % LINE_SETS.length), 1000 / 12);
    return () => clearInterval(id);
  }, []);
  return (
    <svg viewBox='-500 -500 1000 1000' preserveAspectRatio='xMidYMid slice' className='absolute inset-0 h-full w-full' aria-hidden>
      <motion.g
        initial={{ scale: 1.8, opacity: 0 }}
        animate={{ scale: [1.8, 1, 1, 0.9, 1], opacity: [0, 1, 1, 1, 1] }}
        transition={{ duration: land + 0.4, times: [0, 0.2, 0.78, 0.86, 1], ease: "easeOut", delay: 0.35 }}>
        {LINE_SETS[frame].map((line, i) => (
          <path
            key={i}
            d={line.d}
            fill={line.accent === "a" ? colors.a : line.accent === "b" ? colors.b : "#3f3f46"}
            opacity={line.accent ? 0.35 : 0.55}
          />
        ))}
      </motion.g>
    </svg>
  );
};

// ─── Entry ────────────────────────────────────────────────────────────────────
// Thin slashes, not walls of colour: three hairline streaks cut across the
// dark at an angle and are gone, like a fast pan. Nothing ever covers the
// whole screen.
const SLASHES = [
  { top: "34%", width: "46%", height: 3, delay: 0, color: "a" },
  { top: "58%", width: "30%", height: 2, delay: 0.06, color: "white" },
  { top: "46%", width: "62%", height: 1.5, delay: 0.12, color: "b" },
] as const;

const Slashes = ({ colors }: { colors: AnimeMomentColors }) => (
  <>
    {SLASHES.map((sl, i) => (
      <motion.div
        key={i}
        aria-hidden
        className='absolute left-0 origin-left -rotate-12 rounded-full'
        style={{
          top: sl.top,
          width: sl.width,
          height: sl.height,
          background: sl.color === "a" ? colors.a : sl.color === "b" ? colors.b : "#fafafa",
        }}
        initial={{ x: "-110%", opacity: 0 }}
        animate={{ x: "260%", opacity: [0, 0.9, 0.9, 0] }}
        transition={{ duration: 0.6, delay: sl.delay, ease: WIPE_EASE, opacity: { duration: 0.6, delay: sl.delay, times: [0, 0.15, 0.7, 1] } }}
      />
    ))}
  </>
);

/** Halftone dots gathering in the corners, manga-screen-tone style. */
const ScreenTone = () => (
  <motion.div
    aria-hidden
    className='absolute inset-0 opacity-0'
    style={{
      backgroundImage: "radial-gradient(circle, rgba(250,250,250,0.10) 1.5px, transparent 1.8px)",
      backgroundSize: "11px 11px",
      maskImage: "radial-gradient(ellipse at center, transparent 42%, black 88%)",
      WebkitMaskImage: "radial-gradient(ellipse at center, transparent 42%, black 88%)",
    }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.5, delay: 0.5 }}
  />
);

// ─── Impact ───────────────────────────────────────────────────────────────────
const Shockwaves = ({ at, colors }: { at: number; colors: AnimeMomentColors }) => (
  <div className='pointer-events-none absolute left-1/2 top-1/2' aria-hidden>
    {[colors.b, colors.a, "#fafafa"].map((color, i) => (
      <motion.span
        key={i}
        className='absolute -left-24 -top-24 h-48 w-48 rounded-full'
        style={{ border: `${6 - i * 2}px solid ${color}` }}
        initial={{ scale: 0.2, opacity: 0 }}
        animate={{ scale: 3.4 - i * 0.4, opacity: [0, 0.9, 0] }}
        transition={{ duration: 0.8, delay: at + i * 0.1, ease: "easeOut" }}
      />
    ))}
  </div>
);

/** Short thick streaks shooting out of the landing, like ink speed lines. */
const STREAKS = Array.from({ length: 16 }, (_, i) => ({
  angle: (i / 16) * 360 + (i % 2 ? 6 : -4),
  length: 60 + ((i * 41) % 70),
  from: 120 + ((i * 29) % 50),
}));
const Streaks = ({ at }: { at: number }) => (
  <div className='pointer-events-none absolute left-1/2 top-1/2' aria-hidden>
    {STREAKS.map((s, i) => (
      <div key={i} className='absolute left-0 top-0' style={{ transform: `rotate(${s.angle}deg)` }}>
        <motion.span
          className='absolute block h-[5px] origin-left rounded-full bg-zinc-50'
          style={{ width: s.length, top: -2.5 }}
          initial={{ x: s.from, scaleX: 0, opacity: 0 }}
          animate={{ x: s.from + 140, scaleX: [0, 1, 0], opacity: [0, 1, 0] }}
          transition={{ duration: 0.45, delay: at + (i % 4) * 0.02, ease: "easeOut" }}
        />
      </div>
    ))}
  </div>
);

// Burst pieces: guitar picks, eighth notes and four-point stars.
const PICK = "M0,-9 C6,-9 8,-6.5 7.6,-3.5 C7.2,0 3.2,5 0,8 C-3.2,5 -7.2,0 -7.6,-3.5 C-8,-6.5 -6,-9 0,-9 Z";
const NOTE = "M-2,6 C-2,9 -7,10 -7.5,7.5 C-8,5 -4,3.5 -2,4.5 L-2,-9 L6,-11 L6,-7 L0,-5.5 L0,6 Z";
const STAR = "M0,-9 L2.2,-2.2 L9,0 L2.2,2.2 L0,9 L-2.2,2.2 L-9,0 L-2.2,-2.2 Z";
const PARTICLES = Array.from({ length: 24 }, (_, i) => {
  const angle = (i / 24) * Math.PI * 2 + (i % 2 ? 0.12 : -0.08);
  const dist = 230 + ((i * 53) % 190);
  const kind = i % 3;
  return {
    x: Math.cos(angle) * dist,
    y: Math.sin(angle) * dist * 0.8,
    rotate: (i % 2 ? 1 : -1) * (120 + ((i * 37) % 200)),
    scale: 1.2 + ((i * 7) % 10) / 10,
    path: kind === 0 ? PICK : kind === 1 ? NOTE : STAR,
    tone: kind === 0 ? "a" : kind === 1 ? "b" : i % 2 ? "white" : "b",
    lag: (i % 5) * 0.025,
  };
});

const Burst = ({ at, colors }: { at: number; colors: AnimeMomentColors }) => (
  <div className='pointer-events-none absolute left-1/2 top-1/2' aria-hidden>
    {PARTICLES.map((p, i) => (
      <motion.svg
        key={i}
        viewBox='-12 -12 24 24'
        className='absolute -left-3 -top-3 h-6 w-6'
        initial={{ x: 0, y: 0, opacity: 0, scale: 0.3, rotate: 0 }}
        // Flies out fast, then floats down a little as it fades.
        animate={{ x: p.x, y: [0, p.y, p.y + 40], opacity: [0, 1, 1, 0], scale: p.scale, rotate: p.rotate }}
        transition={{
          duration: 1.3,
          delay: at + p.lag,
          ease: EASE_OUT,
          y: { duration: 1.3, delay: at + p.lag, times: [0, 0.55, 1], ease: ["easeOut", "easeIn"] },
          opacity: { duration: 1.3, delay: at + p.lag, times: [0, 0.08, 0.7, 1] },
        }}>
        <path d={p.path} fill={p.tone === "a" ? colors.a : p.tone === "b" ? colors.b : "#fafafa"} />
      </motion.svg>
    ))}
  </div>
);

// ─── Title ────────────────────────────────────────────────────────────────────
const Title = ({ text, delay, colors, reduceMotion }: { text: string; delay: number; colors: AnimeMomentColors; reduceMotion: boolean }) => {
  const letters = Array.from(text);
  const settled = delay + letters.length * 0.035 + 0.15;
  return (
    <div className='relative mt-6'>
      {/* Chromatic split: two coloured ghosts snap onto the title and vanish. */}
      {!reduceMotion &&
        [
          { color: colors.a, from: -10 },
          { color: colors.b, from: 10 },
        ].map((g) => (
          <motion.p
            key={g.color}
            aria-hidden
            className='absolute inset-0 flex justify-center font-teko text-6xl font-bold leading-none md:text-7xl'
            style={{ color: g.color }}
            initial={{ x: g.from, opacity: 0 }}
            animate={{ x: [g.from, 0], opacity: [0, 0.9, 0] }}
            transition={{ duration: 0.35, delay: settled - 0.1, ease: "easeOut" }}>
            {text}
          </motion.p>
        ))}
      <h2 aria-label={text} className='relative flex justify-center font-teko text-6xl font-bold leading-none text-zinc-50 md:text-7xl'>
        {letters.map((ch, i) => (
          <motion.span
            key={i}
            aria-hidden
            className='inline-block whitespace-pre'
            // Each letter slams down from big and blurred-fast, like a stamp.
            initial={reduceMotion ? false : { opacity: 0, y: -24, scale: 2.4, rotate: i % 2 ? 10 : -10 }}
            animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
            transition={{ delay: delay + i * 0.035, type: "spring", stiffness: 520, damping: 18 }}>
            {ch}
          </motion.span>
        ))}
      </h2>
      <motion.span
        aria-hidden
        className='mx-auto mt-2 block h-1.5 w-2/3 origin-left -skew-x-12 rounded-full'
        style={{ background: colors.a }}
        initial={reduceMotion ? false : { scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.35, delay: settled, ease: EASE_OUT }}
      />
    </div>
  );
};

const TITLE_DELAY = 0.95;
const CHIP_DELAY = 1.4;

/** A headline number under the title. */
export const AnimeChip = ({ children, index = 0, className }: { children: ReactNode; index?: number; className?: string }) => {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 18, scale: 0.7 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: reduceMotion ? 0 : CHIP_DELAY + index * 0.12, type: "spring", stiffness: 320, damping: 15 }}
      className={cn("flex items-center gap-2 rounded-lg bg-zinc-900/85 px-4 py-2.5", className)}>
      {children}
    </motion.div>
  );
};
// ─── Moment ───────────────────────────────────────────────────────────────────
export const AnimeMoment = ({
  title,
  subtitle,
  hero,
  mood = "celebrate",
  children,
  land = 1.6,
  durationMs,
  brief = false,
  layoutId,
  colors = DEFAULT_COLORS,
  zIndex = 60,
  onDone,
}: AnimeMomentProps) => {
  const reduceMotion = !!useReducedMotion();

  // The parent may re-render while this plays; keep the timer independent of that.
  const doneRef = useRef(onDone);
  useEffect(() => {
    doneRef.current = onDone;
  });
  useEffect(() => {
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      doneRef.current();
    };
    const timer = setTimeout(finish, reduceMotion ? 1800 : (durationMs ?? (brief ? 2700 : 3600)));
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === "Escape") finish();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", onKey);
    };
  }, [reduceMotion, durationMs, brief]);

  if (typeof document === "undefined") return null;
  const d = (s: number) => (reduceMotion ? 0 : s);

  const heroNode = hero ?? <Kostek mood={mood} delay={d(0.55)} className='h-48 md:h-60' />;

  return createPortal(
    <motion.div
      role='status'
      aria-label={title}
      onClick={() => doneRef.current()}
      style={{ zIndex }}
      className='fixed inset-0 flex cursor-pointer items-center justify-center overflow-hidden bg-zinc-950'
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.45, ease: "easeInOut" } }}
      transition={{ duration: 0.12 }}>
      {/* Screen shake on landing moves everything, background included. */}
      <motion.div
        className='absolute inset-0 flex items-center justify-center'
        animate={reduceMotion ? undefined : { x: [0, -5, 4, -2, 1, 0], y: [0, 3, -2, 1, 0, 0] }}
        transition={{ duration: 0.42, delay: land, ease: "easeOut" }}>
        {!reduceMotion && (
          <>
            <FocusLines land={land} colors={colors} />
            {!brief && <ScreenTone />}
            {/* Keeps the middle dark so the hero and title read on the lines. */}
            <div
              aria-hidden
              className='absolute inset-0'
              style={{ background: "radial-gradient(circle at center, #09090b 22%, rgba(9,9,11,0) 48%)" }}
            />
            {!brief && <Slashes colors={colors} />}
            <Shockwaves at={land} colors={colors} />
            <Streaks at={land} />
            <Burst at={land} colors={colors} />
          </>
        )}

        <div className='relative flex flex-col items-center px-6 text-center'>
          <motion.div layoutId={layoutId} transition={{ type: "spring", stiffness: 140, damping: 20 }}>
            <motion.div
              initial={reduceMotion ? false : { scale: 0.2, opacity: 0, rotate: -14, y: 60 }}
              animate={{ scale: 1, opacity: 1, rotate: 0, y: 0 }}
              transition={{ delay: d(0.45), type: "spring", stiffness: 230, damping: 13 }}>
              {heroNode}
            </motion.div>
          </motion.div>

          <Title text={title} delay={d(TITLE_DELAY)} colors={colors} reduceMotion={reduceMotion} />

          {subtitle && (
            <motion.p
              className='mt-3 max-w-md text-base text-zinc-300'
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: d(CHIP_DELAY - 0.1), duration: 0.3 }}>
              {subtitle}
            </motion.p>
          )}

          {children && <div className='mt-7 flex flex-wrap justify-center gap-3'>{children}</div>}
        </div>

      </motion.div>
    </motion.div>,
    document.body,
  );
};
