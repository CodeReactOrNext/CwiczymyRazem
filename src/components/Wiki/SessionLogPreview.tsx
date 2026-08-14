import { withCurrencyIcons } from "components/CurrencyIcons/withCurrencyIcons";
import { Check, Square } from "lucide-react";

import { AppScreen } from "./AppScreen";
import { parseList, parsePairs } from "./parseProps";

interface SessionLogPreviewProps {
  /** Pipe-separated `"Category::time"` rows, e.g. `"Technique::20 min"`. */
  categories: string;
  /** Pipe-separated habit labels. Prefix one with `*` to show it ticked. */
  habits?: string;
  /** The line the app shows once the session is saved, e.g. `"+19 points"`. */
  total?: string;
  caption?: string;
}

/**
 * Mock of the session log form: time split across the four categories, the
 * healthy-habit ticks, and what the session ends up being worth.
 */
export const SessionLogPreview = ({
  categories,
  habits,
  total,
  caption,
}: SessionLogPreviewProps) => {
  const rows = parsePairs(categories);
  const habitLabels = habits ? parseList(habits) : [];

  return (
    <AppScreen title='Log a session' caption={caption}>
      <div className='grid gap-2 sm:grid-cols-2'>
        {rows.map((row) => (
          <div
            key={row.title}
            className='flex items-center justify-between gap-4 rounded bg-zinc-800/40 px-4 py-3'>
            <span className='text-sm text-zinc-400'>{row.title}</span>
            <span className='text-sm font-bold text-zinc-100'>
              {row.description}
            </span>
          </div>
        ))}
      </div>

      {habitLabels.length > 0 && (
        <div className='mt-5'>
          <p className='mb-3 text-xs font-bold text-zinc-400'>Healthy habits</p>
          <div className='flex flex-wrap gap-2'>
            {habitLabels.map((habit) => {
              const isChecked = habit.startsWith("*");
              const label = isChecked ? habit.slice(1).trim() : habit;

              return (
                <span
                  key={label}
                  className={`flex items-center gap-2 rounded px-3 py-1.5 text-xs font-medium ${
                    isChecked
                      ? "bg-emerald-950/40 text-emerald-400"
                      : "bg-zinc-800/40 text-zinc-400"
                  }`}>
                  {isChecked ? (
                    <Check className='h-3.5 w-3.5' aria-hidden='true' />
                  ) : (
                    <Square className='h-3.5 w-3.5' aria-hidden='true' />
                  )}
                  {label}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {total && (
        <div className='mt-5 flex items-center justify-between gap-4 rounded bg-zinc-800/40 px-4 py-3'>
          <span className='text-sm text-zinc-400'>Session is worth</span>
          <span className='text-sm font-bold text-cyan-400'>
            {withCurrencyIcons(total)}
          </span>
        </div>
      )}
    </AppScreen>
  );
};
