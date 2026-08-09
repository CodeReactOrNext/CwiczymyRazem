import { cn } from "assets/lib/utils";
import { motion } from "framer-motion";

interface SlotPipsProps {
  used: number;
  max: number;
  /** Slots a promotion would still unlock, drawn as ghosts past the current cap. */
  locked?: number;
}

/**
 * Mod slots as slots.
 *
 * "2 / 4 mod slots used" makes the reader do the subtraction; four boxes with two
 * filled does not. Ghost pips past the cap show what a promotion would open up,
 * which is the one thing the sentence could never say without getting longer.
 */
export const SlotPips = ({ used, max, locked = 0 }: SlotPipsProps) => (
  <span
    className='flex flex-wrap items-center gap-1.5'
    aria-label={`${used} of ${max} mod slots used`}>
    {Array.from({ length: max }).map((_, i) => (
      <motion.span
        key={i}
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: i * 0.04, duration: 0.2 }}
        className={cn(
          "block h-2.5 w-4 rounded",
          i < used ? "bg-purple-400" : "bg-zinc-700/70",
        )}
        style={
          i < used ? { boxShadow: "0 0 8px rgba(192,132,252,0.45)" } : undefined
        }
      />
    ))}

    {locked > 0 && (
      <>
        <span className='mx-0.5 text-zinc-700'>|</span>
        {Array.from({ length: locked }).map((_, i) => (
          <span
            key={`locked-${i}`}
            title='Unlocked by the next promotion'
            className='block h-2.5 w-4 rounded border border-dashed border-zinc-700'
          />
        ))}
      </>
    )}
  </span>
);
