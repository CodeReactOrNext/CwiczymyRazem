import { cn } from "assets/lib/utils";

import { useCalendarDisplay } from "../hooks/useCalendarDisplay";
import type { PracticeArea } from "../types/calendar.types";
import { AREA_DOT } from "../utils/areaStyles";
import type { DayEntry } from "./DayColumn";

interface DayStripProps {
  dates: string[];
  byDate: Record<string, DayEntry[]>;
  selected: string;
  today: string;
  onSelect: (date: string) => void;
}

/** At most this many area dots under a day — enough to tell days apart. */
const MAX_DOTS = 3;

/**
 * The week as one row of days, for a phone: the day picked here opens below,
 * instead of seven cards stacked on top of each other. Each day shows the
 * areas it holds, or a check once all of it is played.
 */
export const DayStrip = ({
  dates,
  byDate,
  selected,
  today,
  onSelect,
}: DayStripProps) => {
  const { formatDate, formatMinutes } = useCalendarDisplay();

  return (
    <div
      role='tablist'
      className='grid grid-cols-7 gap-1 rounded-lg bg-zinc-900/40 p-1.5'>
      {dates.map((date) => {
        const entries = byDate[date] ?? [];
        const active = date === selected;
        const complete =
          entries.length > 0 && entries.every((entry) => entry.done);
        const areas = [
          ...new Set(entries.map((entry) => entry.item.area)),
        ].slice(0, MAX_DOTS) as PracticeArea[];
        const minutes = entries.reduce(
          (sum, entry) => sum + entry.item.minutes,
          0,
        );
        return (
          <button
            key={date}
            type='button'
            role='tab'
            aria-selected={active}
            aria-label={`${formatDate(date, { weekday: "long", day: "numeric", month: "long" })}${minutes > 0 ? `, ${formatMinutes(minutes)}` : ""}`}
            onClick={() => onSelect(date)}
            className={cn(
              "flex min-h-[4.25rem] flex-col items-center justify-center gap-1 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400",
              active ? "bg-zinc-700" : "hover:bg-zinc-800/60",
            )}>
            <span
              className={cn(
                "text-[11px]",
                date === today
                  ? "text-cyan-400"
                  : active
                    ? "text-zinc-200"
                    : "text-zinc-500",
              )}>
              {formatDate(date, { weekday: "narrow" })}
            </span>
            <span
              className={cn(
                "text-base font-semibold tabular-nums leading-none",
                active
                  ? "text-zinc-100"
                  : date < today
                    ? "text-zinc-500"
                    : "text-zinc-200",
              )}>
              {formatDate(date, { day: "numeric" })}
            </span>
            <span className='flex h-1.5 items-center gap-0.5' aria-hidden>
              {complete ? (
                <span className='h-1.5 w-3 rounded-full bg-emerald-400' />
              ) : (
                areas.map((area) => (
                  <span
                    key={area}
                    className={cn("h-1.5 w-1.5 rounded-full", AREA_DOT[area])}
                  />
                ))
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
};
