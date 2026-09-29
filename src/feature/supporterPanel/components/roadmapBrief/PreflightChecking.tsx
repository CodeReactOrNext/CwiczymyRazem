import { cn } from "assets/lib/utils";
import { motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

const LINES = [
  "Reading your goal",
  "Checking the song library",
  "Choosing what to ask you",
];

/** How long each line shows as the running one before the next takes over. */
const LINE_MS = 1400;

/**
 * The few seconds between "Continue" and the questions. One model call runs
 * behind it and says nothing until it is done, so the lines walk on their
 * own clock: the last one stays running until the answer lands.
 */
export const PreflightChecking = () => {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (active >= LINES.length - 1) return undefined;
    const timer = setTimeout(() => setActive((value) => value + 1), LINE_MS);
    return () => clearTimeout(timer);
  }, [active]);

  return (
    <div className='flex flex-col items-center gap-8 py-10'>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className='flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10 text-amber-300'>
        <Loader2 size={24} className='animate-spin' />
      </motion.div>

      <ol className='flex flex-col gap-3'>
        {LINES.map((line, index) => {
          const state =
            index < active ? "done" : index === active ? "running" : "next";
          return (
            <motion.li
              key={line}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: state === "next" ? 0.4 : 1, x: 0 }}
              transition={{ delay: index * 0.15 }}
              className={cn(
                "flex items-center gap-3 text-sm",
                state === "done" && "text-emerald-300/90",
                state === "running" && "font-semibold text-zinc-100",
                state === "next" && "text-zinc-500",
              )}>
              <span
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full",
                  state === "done" && "bg-emerald-500/15",
                  state === "running" && "bg-amber-500/15 text-amber-300",
                  state === "next" && "bg-zinc-800",
                )}>
                {state === "done" ? (
                  <Check size={12} strokeWidth={3} />
                ) : state === "running" ? (
                  <span className='h-2 w-2 animate-pulse rounded-full bg-amber-400' />
                ) : null}
              </span>
              {line}
            </motion.li>
          );
        })}
      </ol>

      <p className='text-xs text-zinc-500'>
        Nothing is charged for this — tokens leave only when you generate.
      </p>
    </div>
  );
};
