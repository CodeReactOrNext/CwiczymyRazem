import { cn } from "assets/lib/utils";
import { CONDITION_GRADES } from "feature/arsenal/data/itemStats";
import { motion } from "framer-motion";

/** Low → high. `CONDITION_GRADES` is authored high → low for grade lookup. */
const LADDER = [...CONDITION_GRADES].reverse();

interface ConditionPathProps {
  condition: number;
  /** Highlights the grade a job is about to reach. */
  target?: string;
}

/**
 * The condition ladder as a track, matching the promotion path.
 *
 * The segmented meter on the item cards shows which grade an instrument is at.
 * That is all a card needs, but it is not enough on a bench: condition is a
 * continuous 0–1 value, so "most of the way to Mint" is real information the
 * five equal pips throw away — and it is exactly what a player deciding whether
 * to spend parts on a restoration wants to know.
 *
 * So the dots are the grades, and the connector between them carries the part of
 * the number the meter cannot: how far into the current grade the item sits.
 */
export const ConditionPath = ({ condition, target }: ConditionPathProps) => {
  const currentIndex = Math.max(
    0,
    LADDER.findIndex((g, i) => {
      const next = LADDER[i + 1];
      return !next || condition < next.min;
    }),
  );

  const current = LADDER[currentIndex];
  const next = LADDER[currentIndex + 1];
  // Where the item sits between this grade's floor and the next one's.
  const progress = next
    ? Math.min(
        1,
        Math.max(0, (condition - current.min) / (next.min - current.min)),
      )
    : 1;

  return (
    <div className='flex items-center gap-1.5' aria-label='Condition'>
      {LADDER.map((grade, i) => {
        const reached = i <= currentIndex;
        const isCurrent = i === currentIndex;
        const isTarget = target === grade.key;

        return (
          <div key={grade.key} className='flex items-center gap-1.5'>
            <span
              title={
                isCurrent
                  ? `${grade.label} — where it is now`
                  : isTarget
                    ? `${grade.label} — this job's target`
                    : grade.label
              }
              className={cn(
                "block shrink-0 rounded-full transition-all",
                isCurrent || isTarget ? "h-3 w-3" : "h-2 w-2",
              )}
              style={{
                backgroundColor: reached ? grade.color : "transparent",
                border: reached
                  ? undefined
                  : `1.5px ${isTarget ? "solid" : "solid"} ${grade.color}${isTarget ? "cc" : "55"}`,
                boxShadow: isCurrent
                  ? `0 0 8px ${grade.color}`
                  : isTarget
                    ? `0 0 6px ${grade.color}88`
                    : undefined,
              }}
            />

            {i < LADDER.length - 1 && (
              <span className='relative h-[2px] w-7 overflow-hidden rounded-full bg-zinc-800'>
                <motion.span
                  className='absolute inset-y-0 left-0 rounded-full'
                  style={{ backgroundColor: LADDER[i + 1].color }}
                  initial={{ width: 0 }}
                  animate={{
                    width:
                      i < currentIndex
                        ? "100%"
                        : i === currentIndex
                          ? `${progress * 100}%`
                          : 0,
                  }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};
