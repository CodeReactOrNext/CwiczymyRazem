import { cn } from "assets/lib/utils";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { transitions } from "lib/motion/motion";
import { Check, Video } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const STEP_MS = 1100;
const HOLD_MS = 3600;

/**
 * A month's challenge board being cleared: one song recorded at a time, each
 * paying its points and Fame, and the clear bonus landing with the last one.
 * The songs are slots, not titles — the real board is voted in every month.
 */
export const ChallengeBoard = ({
  songs,
  points,
  fame,
  clearBonus,
}: {
  songs: number;
  points: number;
  fame: number;
  clearBonus: number;
}) => {
  const still = !!useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.5 });
  const [recorded, setRecorded] = useState(still ? songs : 0);

  useEffect(() => {
    if (still || !inView) return undefined;
    const id = window.setTimeout(
      () => setRecorded((value) => (value >= songs ? 0 : value + 1)),
      recorded >= songs ? HOLD_MS : STEP_MS,
    );
    return () => window.clearTimeout(id);
  }, [recorded, inView, still, songs]);

  const cleared = recorded >= songs;
  const totalFame = recorded * fame + (cleared ? clearBonus : 0);

  return (
    <div ref={ref} aria-hidden className='rounded-lg bg-zinc-900/40 p-6 sm:p-8'>
      <p className='text-xs text-zinc-500'>This month&apos;s board</p>
      <ol className='mt-4 space-y-2.5'>
        {Array.from({ length: songs }, (_, idx) => {
          const done = idx < recorded;
          return (
            <li key={idx} className='flex items-center gap-3'>
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors duration-base",
                  done
                    ? "bg-emerald-500/15 text-emerald-400"
                    : "bg-zinc-800 text-zinc-500",
                )}>
                {done ? (
                  <Check className='h-4 w-4' />
                ) : (
                  <Video className='h-4 w-4' />
                )}
              </span>
              <span className='flex-1 text-sm text-zinc-300'>
                Song {idx + 1} of {songs}
              </span>
              <motion.span
                className='text-xs tabular-nums text-zinc-400'
                initial={false}
                animate={{ opacity: done ? 1 : 0 }}
                transition={transitions.base}>
                +{points} pts · +{fame} Fame
              </motion.span>
            </li>
          );
        })}
      </ol>
      <div className='mt-6 flex items-baseline justify-between gap-4'>
        <motion.span
          className='text-sm font-semibold text-amber-400'
          initial={false}
          animate={{ opacity: cleared ? 1 : 0 }}
          transition={transitions.base}>
          Board cleared: +{clearBonus} Fame
        </motion.span>
        <span className='text-sm text-zinc-400'>
          <span className='font-teko text-3xl tabular-nums text-white'>
            {totalFame}
          </span>{" "}
          Fame this month
        </span>
      </div>
    </div>
  );
};
