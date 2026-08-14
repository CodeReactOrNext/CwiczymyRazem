import { withCurrencyIcons } from "components/CurrencyIcons/withCurrencyIcons";
import { ChevronRight } from "lucide-react";

import { parseList } from "./parseProps";

interface ClickPathProps {
  /** Pipe-separated menu labels, exactly as they read in the app, e.g. `"Practice|Auto Plan"`. */
  steps: string;
  caption?: string;
}

/**
 * "Where do I click?" — a menu trail instead of a raw URL, so an article can point
 * at a screen without asking anyone to read a path like `/timer/auto`.
 */
export const ClickPath = ({ steps, caption }: ClickPathProps) => {
  const items = parseList(steps);

  return (
    <div className='not-prose my-8'>
      <div className='flex flex-wrap items-center gap-x-2 gap-y-3 rounded-lg bg-zinc-900/40 px-5 py-4'>
        {items.map((item, index) => (
          <span key={item} className='flex items-center gap-2'>
            {index > 0 && (
              <ChevronRight
                className='h-4 w-4 text-zinc-600'
                aria-hidden='true'
              />
            )}
            <span
              className={
                index === items.length - 1
                  ? "rounded bg-cyan-500/10 px-2.5 py-1 text-sm font-bold text-cyan-400"
                  : "text-sm font-medium text-zinc-400"
              }>
              {item}
            </span>
          </span>
        ))}
      </div>
      {caption && (
        <p className='mt-3 text-xs text-zinc-500'>
          {withCurrencyIcons(caption)}
        </p>
      )}
    </div>
  );
};
