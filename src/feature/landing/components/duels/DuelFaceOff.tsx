import { cn } from "assets/lib/utils";
import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
} from "framer-motion";
import { fade, transitions } from "lib/motion/motion";
import { Check, UserRound } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

interface Side {
  attempts: number;
  best: number;
  ratingBefore: number;
  ratingAfter: number;
}

/** Moments of the replay, in seconds from its start. */
const T = {
  paired: 1.2,
  drawFrom: 1.4,
  drawTo: 2.7,
  playFrom: 3,
  youReady: 7.4,
  themReady: 8,
  reveal: 8.6,
  restart: 13,
};
/**
 * When each side's runs land (s): spread over the play window, the opponent
 * a little out of step, so the two never tick at once.
 */
const runTimes = (count: number, lag: number) =>
  Array.from(
    { length: count },
    (_, idx) =>
      T.playFrom +
      0.3 +
      lag +
      (idx * (T.youReady - T.playFrom - 1)) / Math.max(count, 1),
  );
/** How much of the 48 hours is left when both press Ready. */
const LEFT_AT_READY = 0.55;
const REEL_STEP_MS = 110;

const signed = (n: number) => (n > 0 ? `+${n}` : `${n}`);

const Ticks = ({ times, at }: { times: number[]; at: number }) => (
  <span className='flex gap-1' aria-hidden>
    {times.map((time, idx) => (
      <span
        key={idx}
        className={cn(
          "h-3 w-1.5 rounded-full transition-colors duration-base",
          at >= time ? "bg-zinc-200" : "bg-zinc-800",
        )}
      />
    ))}
  </span>
);

/**
 * The hero's moving picture: a real duel from the queue to the result. The
 * search, the draw landing on the exercise, the 48-hour bar running down
 * while both sides send runs — the opponent's score hidden the whole time —
 * both pressing Ready, then the reveal and the ratings moving.
 *
 * Every number is from a duel settled on 13 October 2026, seen from the
 * winner's side, with nobody named. Cyan is the clock, emerald the win. With
 * reduced motion it shows the settled duel and stays still.
 */
export const DuelFaceOff = ({
  exercise,
  reel,
  you,
  opponent,
  date,
}: {
  exercise: string;
  reel: string[];
  you: Side;
  opponent: Side;
  date: string;
}) => {
  const still = !!useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.4 });
  const [run, setRun] = useState(0);
  // Seconds into the replay, stepped by a timer rather than per frame: the
  // picture only changes at the moments listed in T.
  const [at, setAt] = useState(still ? T.restart : 0);
  const [reelIdx, setReelIdx] = useState(0);
  const RUNS = useMemo(
    () => ({
      you: runTimes(you.attempts, 0),
      opponent: runTimes(opponent.attempts, 0.45),
    }),
    [you.attempts, opponent.attempts],
  );

  useEffect(() => {
    if (still || !inView) return undefined;
    const moments = [
      T.paired,
      T.drawTo,
      ...RUNS.you,
      ...RUNS.opponent,
      T.youReady,
      T.themReady,
      T.reveal,
    ];
    const timers = moments.map((moment) =>
      window.setTimeout(() => setAt(moment), moment * 1000),
    );
    const reelTimer = window.setInterval(
      () => setReelIdx((value) => value + 1),
      REEL_STEP_MS,
    );
    const stopReel = window.setTimeout(
      () => window.clearInterval(reelTimer),
      T.drawTo * 1000,
    );
    const restart = window.setTimeout(() => {
      setAt(0);
      setReelIdx(0);
      setRun((value) => value + 1);
    }, T.restart * 1000);
    return () => {
      timers.forEach((id) => window.clearTimeout(id));
      window.clearInterval(reelTimer);
      window.clearTimeout(stopReel);
      window.clearTimeout(restart);
    };
  }, [run, inView, still, RUNS]);

  const paired = at >= T.paired;
  const drawn = at >= T.drawTo;
  const revealed = at >= T.reveal;
  const playing = at >= T.playFrom || drawn;
  const shownExercise = drawn
    ? exercise
    : at >= T.paired
      ? reel[reelIdx % reel.length]
      : null;

  const status = revealed
    ? "Both ready · settled early"
    : at >= T.themReady
      ? "Both ready"
      : paired
        ? "Paired · 48 hours to play"
        : "Looking for an opponent…";

  return (
    <div
      ref={ref}
      role='img'
      aria-label={`A real duel on ${exercise}: you made ${you.attempts} runs and scored ${you.best}, your anonymous opponent made ${opponent.attempts} and scored ${opponent.best}; both pressed Ready, you won and your rating went from ${you.ratingBefore} to ${you.ratingAfter}`}
      className='rounded-lg bg-zinc-900/40 p-6 sm:p-8'>
      <div className='flex items-baseline justify-between gap-4 text-xs'>
        <span
          className={cn(
            "font-semibold transition-colors duration-base",
            revealed ? "text-emerald-400" : "text-zinc-300",
          )}>
          {status}
        </span>
        <span className='text-zinc-500'>A real duel, {date}</span>
      </div>

      <div className='mt-5 h-12'>
        <p className='text-xs text-zinc-500'>Exercise</p>
        <p
          className={cn(
            "mt-1 truncate text-lg font-bold transition-colors duration-fast",
            drawn ? "text-white" : "text-zinc-500",
          )}>
          {shownExercise ?? "—"}
        </p>
      </div>

      <div className='mt-4 h-1 overflow-hidden rounded-full bg-zinc-800'>
        <motion.div
          key={`clock-${run}`}
          className='h-full origin-left rounded-full bg-cyan-400'
          initial={still ? false : { scaleX: 1, opacity: 0 }}
          animate={
            still
              ? { scaleX: LEFT_AT_READY, opacity: 1 }
              : {
                  opacity: playing ? 1 : 0,
                  scaleX: playing ? LEFT_AT_READY : 1,
                }
          }
          transition={{
            opacity: transitions.base,
            scaleX: { duration: T.youReady - T.drawTo, ease: "linear" },
          }}
        />
      </div>

      <div className='mt-8 grid grid-cols-[1fr_auto_1fr] items-start gap-4'>
        {/* You */}
        <div className='flex flex-col gap-3'>
          <span className='flex items-center gap-2.5'>
            <span className='flex h-8 w-8 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-200'>
              Y
            </span>
            <span className='text-sm font-semibold text-zinc-100'>You</span>
            {at >= T.youReady && (
              <Check className='h-4 w-4 text-emerald-400' aria-label='Ready' />
            )}
          </span>
          <span className='h-12 font-teko text-5xl tabular-nums leading-none text-white'>
            {at >= RUNS.you[RUNS.you.length - 1] ? you.best : "—"}
          </span>
          <span className='flex items-center gap-2 text-xs text-zinc-500'>
            <Ticks times={RUNS.you} at={at} />
            {RUNS.you.filter((time) => at >= time).length} runs
          </span>
        </div>

        <span className='pt-12 font-teko text-2xl leading-none text-zinc-600'>
          vs
        </span>

        {/* Opponent */}
        <div className='flex flex-col items-end gap-3 text-right'>
          <span className='flex items-center gap-2.5'>
            {at >= T.themReady && (
              <Check className='h-4 w-4 text-emerald-400' aria-label='Ready' />
            )}
            <span className='text-sm font-semibold text-zinc-400'>
              {revealed ? "Opponent" : paired ? "Anonymous" : "…"}
            </span>
            <span className='flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-zinc-400'>
              <UserRound className='h-4 w-4' aria-hidden />
            </span>
          </span>
          <span className='relative h-12 font-teko text-5xl tabular-nums leading-none'>
            <AnimatePresence mode='wait' initial={false}>
              <motion.span
                key={revealed ? "score" : "hidden"}
                variants={fade}
                initial='hidden'
                animate='visible'
                exit='hidden'
                className={revealed ? "text-zinc-300" : "text-zinc-700"}>
                {revealed
                  ? opponent.best
                  : at >= RUNS.opponent[0]
                    ? "???"
                    : "—"}
              </motion.span>
            </AnimatePresence>
          </span>
          <span className='flex items-center gap-2 text-xs text-zinc-500'>
            {RUNS.opponent.filter((time) => at >= time).length} runs
            <Ticks times={RUNS.opponent} at={at} />
          </span>
        </div>
      </div>

      <div className='mt-8 h-11'>
        <AnimatePresence>
          {revealed && (
            <motion.div
              key={`result-${run}`}
              className='flex items-center justify-between gap-4 rounded-lg bg-emerald-500/10 px-4 py-3 text-sm'
              initial={still ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={transitions.base}>
              <span className='font-semibold text-emerald-400'>
                Won{" "}
                <span className='tabular-nums'>
                  {you.ratingBefore} → {you.ratingAfter} (
                  {signed(you.ratingAfter - you.ratingBefore)})
                </span>
              </span>
              <span className='tabular-nums text-zinc-500'>
                {opponent.ratingBefore} → {opponent.ratingAfter} (
                {signed(opponent.ratingAfter - opponent.ratingBefore)})
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
