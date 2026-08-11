import { cn } from "assets/lib/utils";

import { parsePairs } from "./parseProps";

interface ProgressLadderProps {
  /** Pipe-separated `"Rung::What it gives you"` pairs, in order. */
  items: string;
  /** Title of the rung to highlight — usually the best one, e.g. the maximum bonus. */
  highlight?: string;
  caption?: string;
}

/**
 * Anything that gets better step by step — streak days, milestone levels, star
 * grades. The bar next to each rung grows so the shape of the progression is
 * readable at a glance, without doing the maths.
 */
export const ProgressLadder = ({ items, highlight, caption }: ProgressLadderProps) => {
  const rungs = parsePairs(items);

  return (
    <div className='not-prose my-10'>
      <div className='flex flex-col gap-2'>
        {rungs.map((rung, index) => {
          const isHighlighted = highlight === rung.title;
          const width = ((index + 1) / rungs.length) * 100;

          return (
            <div
              key={rung.title}
              className='flex flex-col gap-2 rounded-lg bg-zinc-900/40 p-4 sm:flex-row sm:items-center sm:gap-5'>
              <span
                className={cn(
                  "w-32 shrink-0 text-sm font-bold",
                  isHighlighted ? "text-cyan-400" : "text-zinc-200"
                )}>
                {rung.title}
              </span>
              <span
                className='h-2 shrink-0 rounded-full bg-zinc-800 sm:w-40'
                aria-hidden='true'>
                <span
                  className={cn(
                    "block h-2 rounded-full",
                    isHighlighted ? "bg-cyan-500/70" : "bg-zinc-700"
                  )}
                  style={{ width: `${width}%` }}
                />
              </span>
              {rung.description && (
                <span className='text-sm leading-relaxed text-zinc-400'>
                  {rung.description}
                </span>
              )}
            </div>
          );
        })}
      </div>
      {caption && <p className='mt-3 text-xs text-zinc-500'>{caption}</p>}
    </div>
  );
};
