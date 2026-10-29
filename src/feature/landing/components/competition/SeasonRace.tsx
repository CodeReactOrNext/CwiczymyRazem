import { cn } from "assets/lib/utils";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { transitions } from "lib/motion/motion";
import { useEffect, useRef, useState } from "react";

/**
 * An example month, not real players: each row's season points at the end of
 * weeks 1–4. "You" starts behind and practises a little every day, which is
 * what a season rewards.
 */
const ROWS = [
  {
    id: "a",
    name: "A player with a big first week",
    weeks: [520, 640, 720, 780],
  },
  { id: "you", name: "You", weeks: [180, 420, 690, 960] },
  { id: "b", name: "A steady regular", weeks: [300, 560, 800, 900] },
  { id: "c", name: "A weekend player", weeks: [260, 300, 520, 560] },
  { id: "d", name: "Someone who joined mid-month", weeks: [0, 0, 330, 640] },
];
const WEEKS = 4;
/** The podium's tones, as the app's season rewards wear them: gold, silver, bronze. */
const PODIUM_TEXT = ["text-amber-300", "text-zinc-200", "text-orange-300"];
const PODIUM_BAR = ["bg-amber-400", "bg-zinc-300", "bg-orange-400"];
const STEP_MS = 1500;
const HOLD_MS = 4200;

/**
 * The season as a race: one example month, week by week, the rows sliding
 * into their new order as the points come in, and the month closing with the
 * top places paid in Fame. Bars, not tickers — the order is the story.
 */
export const SeasonRace = ({ rewards }: { rewards: readonly number[] }) => {
  const still = !!useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.4 });
  const [week, setWeek] = useState(still ? WEEKS : 0);

  useEffect(() => {
    if (still || !inView) return undefined;
    const id = window.setTimeout(
      () => setWeek((value) => (value >= WEEKS ? 0 : value + 1)),
      week >= WEEKS ? HOLD_MS : STEP_MS,
    );
    return () => window.clearTimeout(id);
  }, [week, inView, still]);

  const closed = week >= WEEKS;
  const pointsAt = (row: (typeof ROWS)[number]) =>
    week === 0 ? 0 : row.weeks[week - 1];
  const top = Math.max(...ROWS.map((row) => row.weeks[WEEKS - 1]));
  const ranked = [...ROWS].sort((a, b) => pointsAt(b) - pointsAt(a));

  return (
    <div
      ref={ref}
      role='img'
      aria-label='An example season: five players over four weeks; the one who practises a little every day finishes first and is paid Fame when the month closes'
      className='rounded-lg bg-zinc-900/40 p-6 sm:p-8'>
      <div className='flex items-baseline justify-between gap-4 text-xs'>
        <span
          className={cn(
            "font-semibold transition-colors duration-base",
            closed ? "text-emerald-400" : "text-zinc-300",
          )}>
          {closed
            ? "Season closed"
            : week === 0
              ? "The 1st: everyone at zero"
              : `Week ${week}`}
        </span>
        <span className='text-zinc-500'>An example month</span>
      </div>

      <ol className='mt-6 space-y-3'>
        {ranked.map((row, idx) => {
          const isYou = row.id === "you";
          const points = pointsAt(row);
          return (
            <motion.li
              key={row.id}
              layout={!still}
              transition={transitions.spring}
              className='flex items-center gap-3'>
              <span
                className={cn(
                  "w-6 shrink-0 font-teko text-2xl tabular-nums leading-none transition-colors duration-base",
                  week > 0 && PODIUM_TEXT[idx]
                    ? PODIUM_TEXT[idx]
                    : "text-zinc-500",
                )}>
                {idx + 1}
              </span>
              <span className='min-w-0 flex-1'>
                <span
                  className={cn(
                    "block truncate text-sm",
                    isYou ? "font-semibold text-cyan-300" : "text-zinc-300",
                  )}>
                  {row.name}
                </span>
                <span className='mt-1.5 block h-1.5 overflow-hidden rounded-full bg-zinc-800'>
                  <motion.span
                    className={cn(
                      "block h-full origin-left rounded-full",
                      isYou
                        ? "bg-cyan-400"
                        : week > 0 && PODIUM_BAR[idx]
                          ? PODIUM_BAR[idx]
                          : "bg-zinc-500",
                    )}
                    initial={false}
                    animate={{ scaleX: points / top }}
                    transition={transitions.slow}
                  />
                </span>
              </span>
              <span className='w-20 shrink-0 text-right text-xs tabular-nums'>
                {closed && rewards[idx] ? (
                  <span className='font-semibold text-amber-400'>
                    +{rewards[idx]} Fame
                  </span>
                ) : (
                  <span className='text-zinc-600'>{points || ""}</span>
                )}
              </span>
            </motion.li>
          );
        })}
      </ol>
    </div>
  );
};
