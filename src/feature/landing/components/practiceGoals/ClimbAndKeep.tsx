import { cn } from "assets/lib/utils";
import { GoalProgressDots } from "feature/exerciseGoals/components/GoalProgressDots";
import {
  autoStepBpm,
  GOAL_CLEAN_RUNS_REQUIRED,
  goalPath,
  raisedTargetBpm,
} from "feature/exerciseGoals/utils/goalRules";
import {
  FreshnessMeter,
  LEVEL_TEXT,
} from "feature/rotation/components/FreshnessMeter";
import type {
  LastPracticedMap,
  RotationItem,
} from "feature/rotation/types/rotation.types";
import {
  DAY_MS,
  STALEST_SESSION_SIZE,
  toRotationEntries,
} from "feature/rotation/utils/rotation.utils";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { transitions } from "lib/motion/motion";
import { useEffect, useMemo, useRef, useState } from "react";

const TICK_MS = 100;
/** Moments of the loop, in ticks. */
const T = {
  firstRun: 4,
  runEvery: 2,
  reachedPause: 3,
  week: 20,
  threeWeeks: 36,
  press: 50,
  refreshed: 56,
  end: 90,
};
const LEVEL_LABEL = {
  fresh: "Fresh",
  cooling: "Cooling down",
  rusty: "Getting rusty",
} as const;
/** A fixed day zero, so the server and the browser compute the same thing. */
const DAY_ZERO = Date.UTC(2026, 9, 1);

/**
 * The hero's moving picture, the page's loop in one card. An exercise climbs
 * from its start tempo to its goal, three clean runs at every milestone;
 * reached, it joins the rotation next to a song and an item of your own.
 * Weeks pass and the freshness dots drain, until Play the stalest brings
 * everything back.
 *
 * Built from the app's own pieces: the milestones are goalPath's, the dots
 * GoalProgressDots and FreshnessMeter, the levels getFreshness's thresholds.
 * With reduced motion it shows the reached goal and a fresh rotation.
 */
export const ClimbAndKeep = ({
  exerciseTitle,
  startBpm,
  targetBpm,
}: {
  exerciseTitle: string;
  startBpm: number;
  targetBpm: number;
}) => {
  const still = !!useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.3 });
  const path = useMemo(
    () => goalPath(startBpm, targetBpm, autoStepBpm(startBpm, targetBpm)),
    [startBpm, targetBpm],
  );
  const totalRuns = path.length * GOAL_CLEAN_RUNS_REQUIRED;
  const reachedAt = T.firstRun + totalRuns * T.runEvery;
  const loopEnd = reachedAt + T.end;

  const [tick, setTick] = useState(still ? loopEnd : 0);
  useEffect(() => {
    if (still || !inView) return undefined;
    const id = window.setInterval(
      () => setTick((value) => (value >= loopEnd ? 0 : value + 1)),
      TICK_MS,
    );
    return () => window.clearInterval(id);
  }, [still, inView, loopEnd]);

  // ── The climb ──
  const runs = Math.max(
    0,
    Math.min(totalRuns, Math.floor((tick - T.firstRun) / T.runEvery) + 1),
  );
  const reached = runs >= totalRuns;
  const stage = Math.min(
    path.length - 1,
    Math.floor(runs / GOAL_CLEAN_RUNS_REQUIRED),
  );
  const cleanAtStage = reached ? 0 : runs % GOAL_CLEAN_RUNS_REQUIRED;

  // ── The rotation ──
  const since = tick - reachedAt;
  const showRotation = reached && since >= T.reachedPause;
  const day = still || since < T.week ? 0 : since < T.threeWeeks ? 9 : 23;
  const refreshed = !still && since >= T.refreshed;
  const pressing = !still && since >= T.press && !refreshed;

  const items: RotationItem[] = [
    { type: "exercise", id: "goal", addedAt: DAY_ZERO, title: exerciseTitle },
    {
      type: "song",
      id: "song",
      addedAt: DAY_ZERO - 40 * DAY_MS,
      title: "Seven Nation Army",
      artist: "The White Stripes",
    },
    {
      type: "custom",
      id: "course",
      addedAt: DAY_ZERO - 40 * DAY_MS,
      title: "Next lesson of my course",
    },
  ];
  const now = DAY_ZERO + day * DAY_MS;
  const playedAt = (offsetDays: number) =>
    refreshed ? now : DAY_ZERO - offsetDays * DAY_MS;
  const lastPracticed = {
    exercise: { goal: playedAt(0) },
    song: { song: playedAt(2) },
    custom: { course: playedAt(12) },
  } as unknown as LastPracticedMap;
  // The exercise only joins the rotation once its goal is reached.
  const entries = toRotationEntries(
    showRotation || still
      ? items
      : items.filter((item) => item.type !== "exercise"),
    lastPracticed,
    now,
  );

  const timeLabel = refreshed
    ? "Played again"
    : day === 0
      ? "Today"
      : day === 9
        ? "A week later"
        : "Three weeks later";

  return (
    <div
      ref={ref}
      role='img'
      aria-label={`${exerciseTitle} climbs from ${startBpm} to ${targetBpm} BPM, three clean runs at every milestone; reached, it joins a rotation with a song and a course lesson, which go from fresh to rusty over three weeks until playing the stalest brings them back`}
      className='flex flex-col gap-6 rounded-lg bg-zinc-900/40 p-6 sm:p-8'>
      {/* The goal */}
      <div>
        <div className='flex items-baseline justify-between gap-4 text-xs'>
          <span className='text-zinc-500'>Goal</span>
          <span
            className={cn(
              "font-semibold transition-colors duration-base",
              reached ? "text-emerald-400" : "text-zinc-500",
            )}>
            {reached
              ? "Goal reached"
              : `Milestone ${stage + 1} of ${path.length}`}
          </span>
        </div>
        <p className='mt-1 truncate font-semibold text-white'>
          {exerciseTitle}
        </p>
        <p className='mt-3 flex items-baseline gap-2'>
          <span className='font-teko text-5xl tabular-nums leading-none text-white'>
            {path[stage]}
          </span>
          <span className='text-sm text-zinc-500'>/ {targetBpm} BPM</span>
        </p>
        <div className='mt-4 flex gap-1'>
          {path.map((bpm, idx) => (
            <span
              key={bpm}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors duration-base",
                reached || idx < stage
                  ? "bg-emerald-400"
                  : idx === stage
                    ? "bg-zinc-200"
                    : "bg-zinc-800",
              )}
            />
          ))}
        </div>
        <div className='mt-4 flex h-5 items-center gap-3 text-sm text-zinc-400'>
          {reached ? (
            <span>
              Next goal offered:{" "}
              <span className='font-semibold tabular-nums text-zinc-200'>
                {raisedTargetBpm(targetBpm)} BPM
              </span>
            </span>
          ) : (
            <>
              <GoalProgressDots cleanRuns={cleanAtStage} />
              <span className='tabular-nums'>
                {cleanAtStage} of {GOAL_CLEAN_RUNS_REQUIRED} clean runs at{" "}
                {path[stage]} BPM
              </span>
            </>
          )}
        </div>
      </div>

      {/* The rotation */}
      <motion.div
        className='flex min-h-[13rem] flex-col gap-3'
        initial={false}
        animate={{ opacity: showRotation || still ? 1 : 0.25 }}
        transition={transitions.slow}>
        <div className='flex items-baseline justify-between gap-4 text-xs'>
          <span className='text-zinc-500'>Rotation</span>
          <span className='font-semibold text-zinc-300'>
            {showRotation || still ? timeLabel : "Waiting for the goal"}
          </span>
        </div>
        <ul className='space-y-2.5'>
          {entries.map((entry) => (
            <motion.li
              key={entry.item.id}
              layout={!still}
              transition={transitions.spring}
              className='flex items-center justify-between gap-4'>
              <span className='min-w-0'>
                <span className='block truncate text-sm text-zinc-100'>
                  {entry.item.title}
                </span>
                <span className='text-xs text-zinc-500'>
                  {entry.item.type === "exercise"
                    ? "Exercise"
                    : entry.item.type === "song"
                      ? "Song"
                      : "Your own"}
                </span>
              </span>
              <span className='flex shrink-0 flex-col items-end gap-1'>
                <FreshnessMeter freshness={entry.freshness} />
                <span
                  className={cn(
                    "text-xs transition-colors duration-slow",
                    LEVEL_TEXT[entry.freshness.level],
                  )}>
                  {LEVEL_LABEL[entry.freshness.level]}
                </span>
              </span>
            </motion.li>
          ))}
        </ul>
        <span
          className={cn(
            "mt-2 self-start rounded-lg px-4 py-2 text-sm font-semibold transition-colors duration-base",
            pressing
              ? "bg-zinc-200 text-zinc-950"
              : "bg-zinc-800 text-zinc-300",
          )}>
          Play the {STALEST_SESSION_SIZE} stalest
        </span>
      </motion.div>
    </div>
  );
};
