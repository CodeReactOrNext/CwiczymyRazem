"use client";

import { cn } from "assets/lib/utils";
import type {
  DifficultyLevel,
  ExerciseCategory,
} from "feature/exercisePlan/types/exercise.types";
import { getPerformanceGrade } from "feature/exercisePlan/views/PracticeSession/hooks/noteMatchingFeedback";
import {
  BOARD,
  HIT_FILL,
  STRING_COLORS,
  STRING_LABELS,
} from "feature/landing/components/ownMaterial/TabPlayback";
import type { ExerciseCounts } from "feature/practice/utils/autoPlan";
import {
  PLAN_CATEGORIES,
  PLAN_DIFFICULTIES,
} from "feature/practice/utils/autoPlan";
import type { AnimationPlaybackControls } from "framer-motion";
import {
  animate,
  AnimatePresence,
  m,
  useInView,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import {
  ArrowUp,
  Check,
  CheckIcon,
  Clock,
  Gem,
  GripVertical,
  Guitar,
  Heart,
  HistoryIcon,
  Minus,
  MoreHorizontal,
  Play,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { getPointsToLvlUp } from "utils/gameLogic/getPointsToLvlUp";

/*
 * The three How it works pictures, rebuilt from the app's own screens: the
 * Auto Plan (PlanSetup + GeneratedPlan), a practice session (the tab, MicHud,
 * the bottom bar's timers, BpmProgressGrid) and the stats (StatsField,
 * the category split, LevelProgressCircle). Markup and classes follow those
 * components; only the data is a fixed example.
 */

/* ─────────────────────────────────────────────
   Shared: a fixed-size stage scaled to its column, and a step clock that only
   runs while the stage is on screen.
───────────────────────────────────────────── */
const STAGE_W = 720;

const Stage = ({
  height,
  label,
  children,
}: {
  height: number;
  label: string;
  children: ReactNode;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const observer = new ResizeObserver(([entry]) =>
      setScale(Math.min(1, entry.contentRect.width / STAGE_W)),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      role='img'
      aria-label={label}
      className='font-openSans relative w-full'
      style={{ height: height * (scale ?? 1), maxWidth: STAGE_W }}>
      <div
        aria-hidden='true'
        className={cn(
          "absolute left-0 top-0 origin-top-left transition-opacity duration-300",
          scale === null && "opacity-0",
        )}
        style={{ width: STAGE_W, height, transform: `scale(${scale ?? 1})` }}>
        {children}
      </div>
    </div>
  );
};

/** Steps through `durations` (ms) while `active`, then starts over; reduced motion parks on the last but one. */
const useSteps = (durations: readonly number[], active: boolean) => {
  const reduceMotion = useReducedMotion();
  const [step, setStep] = useState(0);
  const last = durations.length - 1;

  useEffect(() => {
    if (!active || reduceMotion) return undefined;
    const id = window.setTimeout(
      () => setStep((s) => (s >= last ? 0 : s + 1)),
      durations[step],
    );
    return () => window.clearTimeout(id);
  }, [active, reduceMotion, step, last, durations]);

  return reduceMotion ? last - 1 : step;
};

/** The app's Card. */
const card = "rounded-lg bg-zinc-800/40";
/** The app's default (primary) button in the dark theme. */
const primaryButton =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-50 px-4 text-sm font-medium text-zinc-900";

/* ─────────────────────────────────────────────
   Step 01 — Auto Plan
───────────────────────────────────────────── */
export interface PlanDemoExercise {
  title: string;
  minutes: number;
  category: ExerciseCategory;
  difficulty: DifficultyLevel;
}

export interface PlanDemoProps {
  counts: ExerciseCounts;
  /** The cells the demo ticks, in order. */
  picks: { category: ExerciseCategory; difficulty: DifficultyLevel }[];
  /** "N exercises match": with nothing picked, then after each pick. */
  matches: number[];
  exercises: PlanDemoExercise[];
  /** The length asked for. */
  minutes: number;
}

const CATEGORY_LABEL: Record<string, string> = {
  technique: "Technique",
  theory: "Theory",
  creativity: "Creativity",
  hearing: "Hearing",
};
const DIFFICULTY_LABEL: Record<string, string> = {
  beginner: "Beginner",
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};
// ExerciseCard's colours.
const CATEGORY_TEXT: Record<string, string> = {
  technique: "text-emerald-400",
  theory: "text-blue-400",
  creativity: "text-purple-400",
  hearing: "text-amber-400",
};
const CATEGORY_LINE: Record<string, string> = {
  technique: "from-emerald-500/0 via-emerald-500 to-emerald-500/0",
  theory: "from-blue-500/0 via-blue-500 to-blue-500/0",
  creativity: "from-purple-500/0 via-purple-500 to-purple-500/0",
  hearing: "from-amber-500/0 via-amber-500 to-amber-500/0",
};
const DIFFICULTY_TEXT: Record<string, string> = {
  beginner: "text-sky-400",
  easy: "text-green-400",
  medium: "text-yellow-400",
  hard: "text-red-400",
};
const badge =
  "inline-flex items-center rounded bg-white/5 px-2.5 py-0.5 text-[11px] font-medium tracking-wide";

const START_MINUTES = 15;
// 0 idle · 1 time set · 2… a pick each · then generate · plan · a row each · start · hold · fade
const planSteps = (picks: number, rows: number) => [
  900,
  1200,
  ...Array.from({ length: picks }, () => 800),
  600,
  450,
  ...Array.from({ length: rows }, () => 260),
  3400,
  700,
];

export const PlanDemo = ({
  counts,
  picks,
  matches,
  exercises,
  minutes,
}: PlanDemoProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.4 });
  const durations = useMemo(
    () => planSteps(picks.length, exercises.length),
    [picks.length, exercises.length],
  );
  const step = useSteps(durations, inView);

  const timeSet = step >= 1;
  const picked = Math.max(0, Math.min(picks.length, step - 1));
  const generateAt = 2 + picks.length;
  const planAt = generateAt + 1;
  const rowsAt = planAt + 1;
  const fading = step === durations.length - 1;
  const time = timeSet ? minutes : START_MINUTES;
  const total = exercises.reduce((sum, exercise) => sum + exercise.minutes, 0);
  const isPicked = (category: ExerciseCategory, difficulty: DifficultyLevel) =>
    picks
      .slice(0, picked)
      .some((p) => p.category === category && p.difficulty === difficulty);

  return (
    <div ref={ref}>
      <Stage
        height={560}
        label={`The Auto Plan: ${minutes} minutes, ${picks
          .map(
            (p) =>
              `${DIFFICULTY_LABEL[p.difficulty]} ${CATEGORY_LABEL[p.category]}`,
          )
          .join(
            " and ",
          )}, generated into a plan of ${exercises.length} exercises`}>
        <m.div
          className='h-full w-full'
          animate={{ opacity: fading ? 0 : 1 }}
          transition={{ duration: 0.5 }}>
          {/* PlanSetup */}
          <div
            className={cn(
              card,
              "absolute left-0 top-0 w-[390px] space-y-7 bg-zinc-800/60 p-6",
            )}>
            <div className='space-y-3'>
              <h3 className='text-lg font-semibold text-zinc-100'>
                Available Time
              </h3>
              <div className='flex items-center gap-2'>
                <span className='flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-700 text-zinc-300'>
                  -
                </span>
                <div className='relative mx-1 h-1.5 flex-1 rounded-full bg-zinc-50/20'>
                  <m.div
                    className='absolute inset-y-0 left-0 rounded-full bg-zinc-50'
                    animate={{ width: `${((time - 15) / 105) * 100}%` }}
                    transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                  />
                  <m.div
                    className='absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-zinc-50/50 bg-zinc-950'
                    animate={{ left: `${((time - 15) / 105) * 100}%` }}
                    transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg border text-zinc-300 transition-colors duration-200",
                    step === 1
                      ? "border-zinc-400 bg-zinc-700"
                      : "border-zinc-700",
                  )}>
                  +
                </span>
                <span className='w-16 text-center text-sm font-medium tabular-nums text-zinc-100'>
                  {time} min
                </span>
              </div>
            </div>

            <div className='space-y-3'>
              <div>
                <h3 className='text-lg font-semibold text-zinc-100'>
                  Practice Focus
                </h3>
                <p className='text-xs text-zinc-400'>
                  Pick difficulties per category, or leave it empty.
                </p>
              </div>
              <div className='grid grid-cols-[1.4fr_repeat(4,1fr)] items-center gap-1'>
                <span />
                {PLAN_DIFFICULTIES.map((difficulty) => (
                  <span
                    key={difficulty}
                    className='py-1 text-center text-[11px] font-medium text-zinc-400'>
                    {DIFFICULTY_LABEL[difficulty]}
                  </span>
                ))}
                {PLAN_CATEGORIES.map((category) => (
                  <div key={category} className='contents'>
                    <span className='px-1 py-1.5 text-sm font-medium text-zinc-300'>
                      {CATEGORY_LABEL[category]}
                    </span>
                    {PLAN_DIFFICULTIES.map((difficulty) => {
                      const available = counts[category]?.[difficulty] ?? 0;
                      const on = isPicked(category, difficulty);
                      return (
                        <span
                          key={difficulty}
                          className={cn(
                            "flex items-center justify-center rounded py-2 transition-colors duration-300",
                            on && "bg-cyan-500/10",
                          )}>
                          {available === 0 ? (
                            <Minus className='h-4 w-4 text-zinc-600' />
                          ) : (
                            <span
                              className={cn(
                                "flex h-4 w-4 items-center justify-center rounded-sm border transition-colors duration-300",
                                on
                                  ? "border-cyan-500 bg-cyan-500 text-zinc-950"
                                  : "border-zinc-600",
                              )}>
                              {on && (
                                <Check className='h-3 w-3' strokeWidth={3} />
                              )}
                            </span>
                          )}
                        </span>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            <div className='flex items-center justify-between'>
              <span className='text-sm tabular-nums text-zinc-400'>
                {matches[picked]} exercises match your picks
              </span>
              <span
                className={cn(
                  primaryButton,
                  "h-9 transition-colors",
                  step === generateAt && "bg-zinc-300",
                )}>
                Generate Plan
              </span>
            </div>
          </div>

          {/* GeneratedPlan */}
          <m.div
            className={cn(
              card,
              "absolute right-0 top-[56px] w-[350px] bg-zinc-900 p-5 outline outline-[6px] outline-zinc-950",
            )}
            initial={false}
            animate={
              step >= planAt ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }
            }
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}>
            <div className='mb-4 flex items-baseline justify-between'>
              <p className='text-base font-semibold text-zinc-100'>
                {total} min{" "}
                <span className='font-normal text-zinc-500'>
                  of {minutes} min
                </span>
              </p>
              <span className='text-xs text-zinc-400'>
                {exercises.length} exercises
              </span>
            </div>
            <div className='space-y-2.5'>
              {exercises.map((exercise, i) => (
                <m.div
                  key={exercise.title}
                  className='relative flex items-stretch overflow-hidden rounded-lg bg-zinc-900/20 ring-1 ring-inset ring-white/5'
                  initial={false}
                  animate={
                    step >= rowsAt + i
                      ? { opacity: 1, x: 0 }
                      : { opacity: 0, x: 18 }
                  }
                  transition={{ duration: 0.3 }}>
                  <span
                    className={cn(
                      "absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r opacity-40",
                      CATEGORY_LINE[exercise.category],
                    )}
                  />
                  <span className='flex items-center pl-2 pr-1 text-zinc-600'>
                    <GripVertical className='h-4 w-4' />
                  </span>
                  <span className='min-w-0 flex-1 py-3 pl-1 pr-2'>
                    <span className='block truncate text-[15px] font-semibold leading-tight text-zinc-100'>
                      {exercise.title}
                    </span>
                    <span className='mt-2 flex flex-wrap gap-1.5'>
                      <span className={cn(badge, "text-zinc-300")}>
                        <Clock className='mr-1 h-3 w-3' />
                        {exercise.minutes} min
                      </span>
                      <span
                        className={cn(badge, CATEGORY_TEXT[exercise.category])}>
                        {CATEGORY_LABEL[exercise.category]}
                      </span>
                      <span
                        className={cn(
                          badge,
                          DIFFICULTY_TEXT[exercise.difficulty],
                        )}>
                        {DIFFICULTY_LABEL[exercise.difficulty]}
                      </span>
                    </span>
                  </span>
                  <span className='flex items-start p-2 text-zinc-400'>
                    <MoreHorizontal className='h-4 w-4' />
                  </span>
                </m.div>
              ))}
            </div>
            <m.span
              className={cn(primaryButton, "mt-4 h-10 w-full")}
              initial={false}
              animate={{
                opacity: step >= rowsAt + exercises.length ? 1 : 0.25,
              }}>
              <Play className='h-4 w-4' />
              Start
            </m.span>
          </m.div>
        </m.div>
      </Stage>
    </div>
  );
};

/* ─────────────────────────────────────────────
   Step 02 — a session
───────────────────────────────────────────── */

// Finger Permutations 1-3-2-4 at the fifth fret: 5-7-6-8 up four strings, a bar each.
const SESSION_FRETS = [5, 7, 6, 8];
const SESSION_STRINGS = [6, 5, 4, 3];
const SESSION_NOTES = SESSION_STRINGS.flatMap((string) =>
  SESSION_FRETS.map((fret) => ({ string, fret })),
);
/** The two notes the run misses. */
const SESSION_MISSES = new Set([6, 13]);
/** Timing grade per note: on time, with a couple of "close" ones. */
const SESSION_CLOSE = new Set([3, 9]);
const SESSION_BPM = 100;
const PX_PER_NOTE = 64;
const LANE_ROW = 24;
const LANE_PLAYHEAD = 110;
const RUN_SECONDS = (SESSION_NOTES.length * 60) / SESSION_BPM;
const HOLD_MS = 2600;

const BPM_STAGES = [
  60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 170, 180,
];
const BPM_DONE = 5;

/** The HUD after each note, the way useNoteMatching scores it: combo, ×min(8, ⌊combo/5⌋+1), 100 × multiplier × grade. */
const SESSION_HUD = (() => {
  let combo = 0;
  let score = 0;
  let hits = 0;
  return SESSION_NOTES.map((_, i) => {
    if (SESSION_MISSES.has(i)) {
      combo = 0;
    } else {
      combo += 1;
      hits += 1;
      const multiplier = Math.min(8, Math.floor(combo / 5) + 1);
      score += Math.round(
        100 * multiplier * (SESSION_CLOSE.has(i) ? 2 / 3 : 1),
      );
    }
    return {
      score,
      combo,
      multiplier: Math.min(8, Math.floor(combo / 5) + 1),
      accuracy: Math.round((hits / (i + 1)) * 100),
    };
  });
})();

const HUD_RING_R = 42;
const HUD_RING_C = 2 * Math.PI * HUD_RING_R;

const SessionClock = ({ running }: { running: boolean }) => {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!running) return undefined;
    const id = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [running]);
  const session = 14 * 60 + 32 + seconds;
  const left = Math.max(0, 3 * 60 - 19 - seconds);
  const mmss = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  return (
    <div className='flex items-center gap-8'>
      <div className='flex flex-col items-end gap-1'>
        <span className='text-[10px] font-bold leading-none tracking-wide text-zinc-500'>
          Session
        </span>
        <span className='flex items-center gap-2 text-white'>
          <HistoryIcon className='h-3.5 w-3.5 text-cyan-500/50' />
          <span className='font-mono text-base font-black tracking-wide'>
            00:{mmss(session)}
          </span>
        </span>
      </div>
      <div className='flex flex-col items-start gap-1'>
        <span className='text-[10px] font-bold leading-none tracking-wide text-zinc-500'>
          Exercise
        </span>
        <span
          className={cn(
            "font-mono text-2xl font-black leading-none tracking-tight",
            running ? "text-cyan-400" : "text-white",
          )}>
          {mmss(left)}
        </span>
      </div>
    </div>
  );
};

export const PlayDemo = () => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.4 });
  const still = !!useReducedMotion();
  const laneWidth = SESSION_NOTES.length * PX_PER_NOTE;

  const progress = useMotionValue(still ? 1 : 0);
  const scroll = useTransform(progress, (p) => LANE_PLAYHEAD - p * laneWidth);
  const [played, setPlayed] = useState(still ? SESSION_NOTES.length : 0);
  const [cleared, setCleared] = useState(still);

  useMotionValueEvent(progress, "change", (p) => {
    const next = Math.min(
      SESSION_NOTES.length,
      Math.floor(p * SESSION_NOTES.length + 0.5),
    );
    if (next !== played) setPlayed(next);
  });

  // One pass of the drill, the tempo ticked off, a pause, and again.
  useEffect(() => {
    if (still || !inView) return undefined;
    let controls: AnimationPlaybackControls | null = null;
    let hold: number | undefined;
    const run = () => {
      setCleared(false);
      progress.set(0);
      controls = animate(progress, 1, {
        duration: RUN_SECONDS,
        ease: "linear",
        onComplete: () => {
          setCleared(true);
          hold = window.setTimeout(run, HOLD_MS);
        },
      });
    };
    run();
    return () => {
      controls?.stop();
      window.clearTimeout(hold);
    };
  }, [still, inView, progress]);

  const hud = played === 0 ? null : SESSION_HUD[played - 1];
  const tier =
    hud && hud.multiplier >= 3
      ? { from: "#fbbf24", to: "#d97706", text: "text-amber-400" }
      : { from: "#67e8f9", to: "#0891b2", text: "text-cyan-400" };
  const comboProgress = hud ? (hud.combo % 5) / 5 : 0;
  const bar = Math.min(3, Math.floor(played / 4));

  return (
    <div ref={ref}>
      <Stage
        height={470}
        label='A practice session: Finger Permutations 1-3-2-4 on a scrolling tab, notes turning green as Pitch Detect hears them, the score, accuracy and combo multiplier above it, the session and exercise timers and a BPM progress ladder ticking off 110 BPM'>
        {/* Title row with MicHud */}
        <div className='flex items-center justify-between'>
          <div>
            <p className='text-xl font-bold text-white'>
              Finger Permutations — 1-3-2-4
            </p>
            <div className='mt-2 flex gap-1.5'>
              <span className={cn(badge, "text-emerald-400")}>Technique</span>
              <span className={cn(badge, "text-yellow-400")}>Medium</span>
              <span className={cn(badge, "text-zinc-300")}>
                {SESSION_BPM} BPM
              </span>
            </div>
          </div>
          <div className='flex w-[330px] items-center justify-between gap-6 rounded-lg bg-zinc-900/50 px-6 py-3'>
            <div className='flex flex-col items-start'>
              <span className='text-[10px] font-semibold tracking-wide text-zinc-400'>
                Score
              </span>
              <m.span
                key={hud?.score ?? 0}
                initial={{ scale: 1.08 }}
                animate={{ scale: 1 }}
                className='text-4xl font-bold tabular-nums leading-none tracking-tighter text-zinc-100'>
                {(hud?.score ?? 0).toLocaleString("en")}
              </m.span>
            </div>
            <div className='flex flex-col items-start'>
              <span className='text-[10px] font-semibold tracking-wide text-zinc-400'>
                Accuracy
              </span>
              <span
                className={cn(
                  "text-xl font-bold tabular-nums",
                  hud
                    ? getPerformanceGrade(hud.accuracy).color
                    : "text-zinc-500",
                )}>
                {hud ? `${hud.accuracy}%` : "—"}
              </span>
            </div>
            <div className='relative'>
              <svg width={64} height={64} viewBox='0 0 100 100'>
                <defs>
                  <linearGradient
                    id='hiwHudRing'
                    x1='0%'
                    y1='0%'
                    x2='100%'
                    y2='100%'>
                    <stop offset='0%' stopColor={tier.from} />
                    <stop offset='100%' stopColor={tier.to} />
                  </linearGradient>
                </defs>
                <circle
                  cx='50'
                  cy='50'
                  r={HUD_RING_R}
                  fill='rgba(0,0,0,0.35)'
                />
                <circle
                  cx='50'
                  cy='50'
                  r={HUD_RING_R}
                  fill='none'
                  stroke='rgba(255,255,255,0.08)'
                  strokeWidth='5'
                />
                <m.circle
                  cx='50'
                  cy='50'
                  r={HUD_RING_R}
                  fill='none'
                  stroke='url(#hiwHudRing)'
                  strokeWidth='5'
                  strokeLinecap='round'
                  strokeDasharray={HUD_RING_C}
                  transform='rotate(-90 50 50)'
                  animate={{
                    strokeDashoffset: HUD_RING_C * (1 - comboProgress),
                  }}
                  transition={{ type: "spring", stiffness: 260, damping: 30 }}
                />
              </svg>
              <span
                className={cn(
                  "absolute inset-0 flex items-center justify-center text-xl font-bold tabular-nums tracking-tighter",
                  hud && hud.multiplier > 1 ? tier.text : "text-zinc-300",
                )}>
                x{hud?.multiplier ?? 1}
              </span>
            </div>
          </div>
        </div>

        {/* The tab, in the session's default look */}
        <div
          className='mt-4 overflow-hidden rounded-lg'
          style={{ background: BOARD }}>
          <div className='flex gap-1.5 px-4 pt-3'>
            {[0, 1, 2, 3].map((idx) => (
              <span
                key={idx}
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded text-[11px] font-semibold tabular-nums transition-colors",
                  idx === bar
                    ? "bg-cyan-500/10 text-cyan-300 ring-1 ring-cyan-500/70"
                    : "bg-zinc-800/80 text-zinc-400",
                )}>
                {idx + 1}
              </span>
            ))}
          </div>
          <div className='relative mt-2 flex'>
            <div className='z-10 flex shrink-0 flex-col pl-3 pr-2 pt-1'>
              {STRING_LABELS.map((label, idx) => (
                <span
                  key={idx}
                  className='flex items-center'
                  style={{ height: LANE_ROW }}>
                  <span
                    className='flex h-[17px] w-[22px] items-center justify-center rounded text-[11px] font-bold text-black'
                    style={{ background: STRING_COLORS[idx] }}>
                    {label}
                  </span>
                </span>
              ))}
            </div>
            <div
              className='relative flex-1 overflow-hidden'
              style={{ height: LANE_ROW * 6 + 12 }}>
              {STRING_LABELS.map((_, idx) => (
                <span
                  key={idx}
                  className='absolute inset-x-0 h-px bg-zinc-800'
                  style={{ top: 4 + idx * LANE_ROW + LANE_ROW / 2 }}
                />
              ))}
              <m.div
                className='absolute left-0 top-0 h-full'
                style={{ x: scroll, width: laneWidth + 400 }}>
                {[0, 4, 8, 12, 16].map((at) => (
                  <span
                    key={at}
                    className='absolute w-px bg-zinc-700'
                    style={{
                      left: at * PX_PER_NOTE - 4,
                      top: 4,
                      height: LANE_ROW * 6,
                    }}
                  />
                ))}
                {SESSION_NOTES.map((note, i) => {
                  const hit = i < played && !SESSION_MISSES.has(i);
                  return (
                    <span
                      key={i}
                      className='absolute flex h-[18px] items-center justify-center rounded-[5px] text-[12px] font-bold text-black transition-colors duration-150'
                      style={{
                        left: i * PX_PER_NOTE,
                        width: PX_PER_NOTE - 10,
                        top:
                          4 +
                          (note.string - 1) * LANE_ROW +
                          (LANE_ROW - 18) / 2,
                        background: hit
                          ? HIT_FILL
                          : STRING_COLORS[note.string - 1],
                      }}>
                      {note.fret}
                    </span>
                  );
                })}
              </m.div>
              <span
                className='absolute bottom-1 top-0 w-0.5 bg-red-500'
                style={{ left: LANE_PLAYHEAD }}
              />
            </div>
          </div>
        </div>

        {/* The bottom bar: timers and BPM progress */}
        <div className='mt-4 flex items-center justify-between gap-6 rounded-lg bg-zinc-900/80 px-5 py-4'>
          <SessionClock running={inView && !still} />
          <div className='w-[380px] space-y-2'>
            <div className='flex items-center justify-between'>
              <span className='text-xs font-bold text-zinc-500'>
                BPM progress
              </span>
              <span className='text-[10px] font-bold text-white'>
                {BPM_DONE + (cleared ? 1 : 0)}/{BPM_STAGES.length}
              </span>
            </div>
            <div className='flex flex-wrap gap-1.5'>
              {BPM_STAGES.map((bpm, i) => {
                const done = i < BPM_DONE || (i === BPM_DONE && cleared);
                const recommended = i === BPM_DONE + (cleared ? 1 : 0);
                return (
                  <span
                    key={bpm}
                    className={cn(
                      "font-mono relative flex min-w-[44px] items-center justify-center rounded-md border px-2 py-1 text-xs font-bold transition-colors duration-300",
                      done
                        ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-600/40"
                        : recommended
                          ? "border-cyan-500/30 bg-cyan-500/5 text-cyan-300"
                          : "border-white/5 bg-zinc-900/60 text-zinc-300",
                    )}>
                    <span
                      className={cn(
                        done &&
                          "line-through decoration-emerald-500/60 decoration-2",
                      )}>
                      {bpm}
                    </span>
                    <AnimatePresence>
                      {done && (
                        <m.span
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{
                            type: "spring",
                            stiffness: 500,
                            damping: 25,
                          }}
                          className='absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 text-white'>
                          <CheckIcon className='h-2 w-2' strokeWidth={4} />
                        </m.span>
                      )}
                    </AnimatePresence>
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </Stage>
    </div>
  );
};

/* ─────────────────────────────────────────────
   Step 03 — the stats
───────────────────────────────────────────── */

// The numbers from the stats screenshot the landing already uses (/images/stats-overview.webp).
const STATS_POINTS = 1901;
const STATS_TIME_TREND = [0, 0, 0, 0, 0, 0, 2.1, 2.5, 0, 3.4, 0, 0.6, 0.3, 0];
const STATS_POINTS_TREND = [0, 0, 0.6, 0, 0, 0, 0.8, 3, 0, 2.2, 0, 0.8, 0, 0];
const STATS_CATEGORIES = [
  { label: "Technique", share: 50, time: "34h 27m", bar: "bg-red-500" },
  { label: "Theory", share: 18, time: "12h 24m", bar: "bg-blue-500" },
  { label: "Creativity", share: 17, time: "11h 43m", bar: "bg-violet-500" },
  { label: "Hearing", share: 15, time: "10h 20m", bar: "bg-emerald-500" },
];

/** The level a points total sits in, and how far through it. */
const levelOf = (points: number) => {
  let level = 1;
  while (getPointsToLvlUp(level) <= points) level += 1;
  const start = getPointsToLvlUp(level - 1);
  const end = getPointsToLvlUp(level);
  return { level, into: points - start, range: end - start };
};

const trendPath = (data: number[], close: boolean) => {
  const max = Math.max(...data);
  const pts = data.map(
    (v, i) => `${(i / (data.length - 1)) * 200},${88 - (v / max) * 76}`,
  );
  return `M${pts.join(" L")}${close ? " L200,90 L0,90 Z" : ""}`;
};

const Trend = ({
  data,
  show,
  delay,
  id,
}: {
  data: number[];
  show: boolean;
  delay: number;
  id: string;
}) => (
  <svg
    viewBox='0 0 200 90'
    preserveAspectRatio='none'
    className='mt-3 h-[84px] w-full'>
    <defs>
      <linearGradient id={id} x1='0' y1='0' x2='0' y2='1'>
        <stop offset='5%' stopColor='rgb(34, 197, 94)' stopOpacity={0.3} />
        <stop offset='95%' stopColor='rgb(34, 197, 94)' stopOpacity={0} />
      </linearGradient>
    </defs>
    <m.path
      d={trendPath(data, true)}
      fill={`url(#${id})`}
      initial={false}
      animate={{ opacity: show ? 1 : 0 }}
      transition={{ duration: 0.6, delay: delay + 0.9 }}
    />
    <m.path
      d={trendPath(data, false)}
      fill='none'
      stroke='rgb(34, 197, 94)'
      strokeWidth='2'
      vectorEffect='non-scaling-stroke'
      initial={false}
      animate={{ pathLength: show ? 1 : 0 }}
      transition={{ duration: 1.2, delay, ease: "easeInOut" }}
    />
  </svg>
);

const StatTile = ({
  icon,
  label,
  value,
  trend,
  children,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  trend?: string;
  children?: ReactNode;
}) => (
  <div className='flex flex-col rounded-lg bg-zinc-800/40 p-5'>
    <div className='flex items-start justify-between'>
      <div className='space-y-1.5'>
        <div className='flex items-center gap-2 text-zinc-500'>
          {icon}
          <span className='text-[11px] font-semibold tracking-widest'>
            {label}
          </span>
        </div>
        <p className='text-2xl font-bold tabular-nums text-white'>{value}</p>
      </div>
      {trend && (
        <span className='flex items-center gap-1 text-xs text-green-400'>
          <ArrowUp className='h-3 w-3' />
          {trend}
        </span>
      )}
    </div>
    {children}
  </div>
);

export const ProgressDemo = () => {
  const ref = useRef<HTMLDivElement>(null);
  const seen = useInView(ref, { amount: 0.4, once: true });
  const reduceMotion = useReducedMotion();
  const show = seen || !!reduceMotion;
  const { level, into, range } = levelOf(STATS_POINTS);
  const arcR = 38;
  const arcC = 2 * Math.PI * arcR;

  return (
    <div ref={ref}>
      <Stage
        height={430}
        label={`Your stats: 68 hours 54 minutes of practice, ${STATS_POINTS} points, 76 sessions, time split by category with Technique at 50%, and level ${level} with ${into} of ${range} points to the next`}>
        <div className='grid h-full grid-cols-[1fr_260px] gap-3'>
          <div className='grid grid-cols-2 content-start gap-3'>
            <StatTile
              icon={<Clock className='h-4 w-4' />}
              label='Total time'
              value='68:54'
              trend='200%'>
              <Trend
                id='hiwTimeTrend'
                data={STATS_TIME_TREND}
                show={show}
                delay={0.2}
              />
            </StatTile>
            <StatTile
              icon={<Gem className='h-4 w-4 text-cyan-300' />}
              label='Points'
              value={String(STATS_POINTS)}
              trend='300%'>
              <Trend
                id='hiwPointsTrend'
                data={STATS_POINTS_TREND}
                show={show}
                delay={0.4}
              />
            </StatTile>
            <StatTile
              icon={<Guitar className='h-4 w-4' />}
              label='Sessions'
              value='76'
            />
            <StatTile
              icon={<Heart className='h-4 w-4' />}
              label='Healthy habits'
              value='130'
            />
            <div className='col-span-2 flex items-center gap-5 rounded-lg bg-zinc-800/40 p-4'>
              <svg
                width={92}
                height={92}
                viewBox='0 0 100 100'
                className='shrink-0'>
                <defs>
                  <linearGradient
                    id='hiwLvlArc'
                    x1='0%'
                    y1='0%'
                    x2='100%'
                    y2='100%'>
                    <stop offset='0%' stopColor='#a5f3fc' />
                    <stop offset='100%' stopColor='#0891b2' />
                  </linearGradient>
                </defs>
                <circle cx='50' cy='50' r='46' fill='rgba(0,0,0,0.45)' />
                <circle
                  cx='50'
                  cy='50'
                  r={arcR}
                  fill='none'
                  stroke='rgba(255,255,255,0.1)'
                  strokeWidth='6'
                />
                <m.circle
                  cx='50'
                  cy='50'
                  r={arcR}
                  fill='none'
                  stroke='url(#hiwLvlArc)'
                  strokeWidth='6'
                  strokeLinecap='round'
                  strokeDasharray={arcC}
                  transform='rotate(-90 50 50)'
                  initial={false}
                  animate={{
                    strokeDashoffset: show ? arcC * (1 - into / range) : arcC,
                  }}
                  transition={{
                    duration: 1.4,
                    delay: 0.6,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                />
                <text
                  x='50'
                  y='51'
                  textAnchor='middle'
                  fill='white'
                  fontSize='24'
                  fontWeight='900'>
                  {level}
                </text>
                <text
                  x='50'
                  y='69'
                  textAnchor='middle'
                  fill='#67e8f9'
                  fontSize='15'
                  fontWeight='700'
                  letterSpacing='2'>
                  LVL
                </text>
              </svg>
              <div>
                <p className='text-sm font-semibold text-zinc-100'>
                  Level {level}
                </p>
                <p className='mt-0.5 text-xs tabular-nums text-zinc-500'>
                  {into} / {range} points to level {level + 1}
                </p>
              </div>
            </div>
          </div>

          <div className='flex flex-col gap-3'>
            <div className='space-y-5 rounded-lg bg-zinc-800/40 p-5'>
              {STATS_CATEGORIES.map((category, i) => (
                <div key={category.label}>
                  <div className='flex items-baseline justify-between'>
                    <span className='text-sm font-semibold text-white'>
                      {category.label}
                    </span>
                    <span className='text-sm font-bold text-white'>
                      {category.share}%{" "}
                      <span className='text-[11px] font-normal text-zinc-500'>
                        {category.time}
                      </span>
                    </span>
                  </div>
                  <div className='mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-900'>
                    <m.div
                      className={cn("h-full rounded-full", category.bar)}
                      initial={false}
                      animate={{ width: show ? `${category.share}%` : "0%" }}
                      transition={{
                        duration: 0.9,
                        delay: 0.3 + i * 0.12,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className='flex items-center justify-between rounded-lg bg-zinc-800/40 px-5 py-4'>
              <span className='text-sm font-semibold text-zinc-200'>
                Total practice time
              </span>
              <span className='text-lg font-bold text-white'>68h 54m</span>
            </div>
          </div>
        </div>
      </Stage>
    </div>
  );
};
