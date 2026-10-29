import { cn } from "assets/lib/utils";
import { PROGRESS_HABITS, sessionPoints } from "feature/landing/data/progress";
import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
} from "framer-motion";
import { fadeUp, transitions } from "lib/motion/motion";
import { Check, Trophy } from "lucide-react";
import { useEffect, useRef, useState } from "react";

/** The example session: what was played, which habits, which day of the streak. */
const SESSION = {
  categories: [
    { label: "Technique", minutes: 20, color: "bg-cyan-400" },
    { label: "Theory", minutes: 10, color: "bg-zinc-300" },
  ],
  habits: 3,
  streakDay: 3,
  skills: ["Alternate Picking", "Finger Independence"],
};
/** Moments of the loop, in seconds. */
const T = { habits: 1.2, points: 2.4, level: 4, skills: 5, badge: 6, end: 10 };

/**
 * The hero's moving picture: one ordinary half-hour session and everything it
 * turns into. The minutes per category, the habits ticked, the points worked
 * out line by line with the app's own formula (time, habits, the streak
 * bonus), the level bar moving, the skills the exercises fed, and the
 * achievement the third day in a row unlocks.
 */
export const SessionToProgress = ({
  achievement,
}: {
  achievement: { title: string; description: string };
}) => {
  const still = !!useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.4 });
  const [at, setAt] = useState(still ? T.end : 0);
  const [run, setRun] = useState(0);

  useEffect(() => {
    if (still || !inView) return undefined;
    const timers = [T.habits, T.points, T.level, T.skills, T.badge].map(
      (moment) => window.setTimeout(() => setAt(moment), moment * 1000),
    );
    const restart = window.setTimeout(() => {
      setAt(0);
      setRun((value) => value + 1);
    }, T.end * 1000);
    return () => {
      timers.forEach((id) => window.clearTimeout(id));
      window.clearTimeout(restart);
    };
  }, [run, inView, still]);

  const minutes = SESSION.categories.reduce((n, c) => n + c.minutes, 0);
  const points = sessionPoints(minutes, SESSION.habits, SESSION.streakDay);
  const rows = [
    { label: `${minutes} minutes of practice`, value: points.time },
    { label: `${SESSION.habits} healthy habits`, value: points.habits },
    {
      label: `Day ${SESSION.streakDay} of your streak, +${Math.round(points.multiplier * 100)}%`,
      value: points.bonus,
    },
  ];

  return (
    <div
      ref={ref}
      role='img'
      aria-label={`One ${minutes}-minute session with ${SESSION.habits} habits on day ${SESSION.streakDay} of a streak pays ${points.total} points, moves the level bar, feeds two skills and unlocks the ${achievement.title} achievement`}
      className='rounded-lg bg-zinc-900/40 p-6 sm:p-8'>
      <p className='text-xs text-zinc-500'>Today&apos;s session</p>
      <div className='mt-3 space-y-2'>
        {SESSION.categories.map((category) => (
          <div key={category.label} className='flex items-center gap-3'>
            <span className='w-20 shrink-0 text-sm text-zinc-300'>
              {category.label}
            </span>
            <span className='h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-800'>
              <motion.span
                key={`${category.label}-${run}`}
                className={cn(
                  "block h-full origin-left rounded-full",
                  category.color,
                )}
                initial={still ? false : { scaleX: 0 }}
                animate={{ scaleX: category.minutes / minutes }}
                transition={{ duration: 0.9, ease: "easeOut" }}
              />
            </span>
            <span className='w-12 shrink-0 text-right text-xs tabular-nums text-zinc-500'>
              {category.minutes} min
            </span>
          </div>
        ))}
      </div>

      <ul className='mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs'>
        {PROGRESS_HABITS.map((habit, idx) => {
          const ticked = idx < SESSION.habits && at >= T.habits;
          return (
            <li
              key={habit}
              className={cn(
                "flex items-center gap-1.5 transition-colors duration-base",
                ticked ? "text-zinc-200" : "text-zinc-600",
              )}>
              <Check
                className={cn(
                  "h-3.5 w-3.5 transition-colors duration-base",
                  ticked ? "text-emerald-400" : "text-zinc-700",
                )}
              />
              {habit}
            </li>
          );
        })}
      </ul>

      <div className='mt-6 min-h-[7.5rem]'>
        <AnimatePresence>
          {at >= T.points && (
            <motion.div
              key={`points-${run}`}
              initial={still ? false : "hidden"}
              animate='visible'
              exit={{ opacity: 0 }}
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.15 } },
              }}
              className='space-y-1.5 text-sm'>
              {rows.map((row) => (
                <motion.p
                  key={row.label}
                  variants={fadeUp}
                  className='flex justify-between gap-4 text-zinc-400'>
                  <span>{row.label}</span>
                  <span className='tabular-nums text-zinc-200'>
                    +{row.value}
                  </span>
                </motion.p>
              ))}
              <motion.p
                variants={fadeUp}
                className='flex justify-between gap-4 pt-1 font-semibold text-white'>
                <span>Points</span>
                <span className='font-teko text-2xl tabular-nums leading-none'>
                  +{points.total}
                </span>
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className='mt-4'>
        <div className='flex justify-between text-xs text-zinc-500'>
          <span>Level</span>
          <span
            className={cn(
              "transition-colors duration-base",
              at >= T.level ? "text-cyan-400" : "text-zinc-500",
            )}>
            {at >= T.level ? "Level up" : "Almost there"}
          </span>
        </div>
        <div className='mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-800'>
          <motion.div
            className='h-full origin-left rounded-full bg-cyan-400'
            initial={false}
            animate={{ scaleX: at >= T.level ? 1 : 0.86 }}
            transition={transitions.slow}
          />
        </div>
      </div>

      <div className='mt-5 flex min-h-[2rem] flex-wrap items-center gap-2'>
        {at >= T.skills &&
          SESSION.skills.map((skill) => (
            <motion.span
              key={`${skill}-${run}`}
              initial={still ? false : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={transitions.base}
              className='rounded bg-zinc-800 px-2.5 py-1 text-xs text-zinc-300'>
              {skill} <span className='text-emerald-400'>+1</span>
            </motion.span>
          ))}
      </div>

      <div className='mt-4 h-14'>
        <AnimatePresence>
          {at >= T.badge && (
            <motion.div
              key={`badge-${run}`}
              initial={still ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={transitions.spring}
              className='flex items-center gap-3 rounded-lg bg-zinc-800/60 px-4 py-2.5'>
              <Trophy className='h-5 w-5 shrink-0 text-amber-400' />
              <span className='min-w-0'>
                <span className='block text-sm font-semibold text-white'>
                  {achievement.title}
                </span>
                <span className='block truncate text-xs text-zinc-400'>
                  {achievement.description}
                </span>
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
