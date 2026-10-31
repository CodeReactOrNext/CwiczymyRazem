import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { Check, Play, Plus } from "lucide-react";

import { useCalendarDisplay } from "../hooks/useCalendarDisplay";
import type { CalendarItem } from "../types/calendar.types";
import { CalendarItemRow } from "./CalendarItemRow";

export interface DayEntry {
  item: CalendarItem;
  done: boolean;
}

interface DayColumnProps {
  date: string;
  entries: DayEntry[];
  isToday: boolean;
  isPast: boolean;
  weekDates: string[];
  onAdd: () => void;
  onPlay: () => void;
  onToggleDone: (itemId: string) => void;
  onMove: (itemId: string, to: string) => void;
  onRemove: (itemId: string) => void;
}

/**
 * One day of the week: its date, how much of it is played, its slots, and a
 * Play that runs what is left of it as one session. Columns on desktop, a
 * stack of cards on a phone.
 */
export const DayColumn = ({
  date,
  entries,
  isToday,
  isPast,
  weekDates,
  onAdd,
  onPlay,
  onToggleDone,
  onMove,
  onRemove,
}: DayColumnProps) => {
  const { formatDate, formatMinutes, t } = useCalendarDisplay();
  const planned = entries.reduce((sum, entry) => sum + entry.item.minutes, 0);
  const played = entries
    .filter((entry) => entry.done)
    .reduce((sum, entry) => sum + entry.item.minutes, 0);
  const left = planned - played;
  const complete = entries.length > 0 && left === 0;
  const progress = planned > 0 ? played / planned : 0;

  return (
    <section
      aria-label={formatDate(date, {
        weekday: "long",
        day: "numeric",
        month: "long",
      })}
      className={cn(
        "flex min-w-0 flex-col rounded-lg p-4 lg:min-h-[22rem] lg:p-3",
        isToday ? "bg-zinc-800/50" : "bg-zinc-900/40",
      )}>
      <header className='flex items-start justify-between gap-2 px-2 pt-1'>
        <div className='flex items-baseline gap-2 lg:flex-col lg:gap-0.5'>
          <span
            className={cn(
              "text-xs font-medium",
              isToday ? "text-cyan-400" : "text-zinc-400",
            )}>
            {isToday ? t("week.today") : formatDate(date, { weekday: "short" })}
          </span>
          <span
            className={cn(
              "text-2xl font-semibold tabular-nums leading-none",
              isPast && !isToday ? "text-zinc-500" : "text-zinc-100",
            )}>
            {formatDate(date, { day: "numeric" })}
          </span>
        </div>
        {planned > 0 && (
          <span
            className={cn(
              "flex items-center gap-1 pt-0.5 text-xs tabular-nums",
              complete ? "text-emerald-400" : "text-zinc-400",
            )}>
            {complete && <Check className='h-3.5 w-3.5' aria-hidden />}
            {formatMinutes(planned)}
          </span>
        )}
      </header>

      <div
        className='mx-2 mt-3 h-1 overflow-hidden rounded-full bg-zinc-800'
        role='progressbar'
        aria-valuemin={0}
        aria-valuemax={planned}
        aria-valuenow={played}
        aria-label={t("day.progress")}>
        <div
          className='h-full rounded-full bg-emerald-400 transition-[width] duration-500'
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </div>

      {entries.length === 0 ? (
        <button
          type='button'
          onClick={onAdd}
          className='mt-3 flex flex-1 flex-col items-center justify-center gap-2 rounded-lg px-2 py-8 text-sm text-zinc-500 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-300 lg:py-6'>
          <Plus className='h-4 w-4' aria-hidden />
          {isPast ? t("day.nothing_past") : t("day.empty")}
        </button>
      ) : (
        <ul className='mt-3 flex-1 space-y-0.5'>
          {entries.map(({ item, done }) => (
            <CalendarItemRow
              key={item.id}
              item={item}
              done={done}
              date={date}
              weekDates={weekDates}
              onToggleDone={() => onToggleDone(item.id)}
              onMove={(to) => onMove(item.id, to)}
              onRemove={() => onRemove(item.id)}
            />
          ))}
        </ul>
      )}

      {entries.length > 0 && (
        <div className='mt-4 flex items-center gap-2'>
          {left > 0 ? (
            <Button
              onClick={onPlay}
              className={cn(
                "h-11 flex-1 rounded-lg px-3 text-sm focus-visible:ring-1 focus-visible:ring-zinc-400 lg:h-9 lg:text-[13px]",
                isToday
                  ? "border-b-black/25 bg-white text-zinc-950 hover:bg-zinc-200"
                  : "border-b-black/40 bg-zinc-800 text-zinc-100 hover:bg-zinc-700",
              )}>
              <Play className='h-3.5 w-3.5' aria-hidden />
              {formatMinutes(left)}
            </Button>
          ) : (
            <span className='flex-1 px-2 text-xs text-emerald-400'>
              {t("day.complete")}
            </span>
          )}
          <Button
            onClick={onAdd}
            aria-label={t("day.add")}
            className='h-11 w-11 shrink-0 rounded-lg border-b-black/40 bg-zinc-800/80 p-0 text-zinc-300 focus-visible:ring-1 focus-visible:ring-zinc-400 hover:bg-zinc-700 lg:h-9 lg:w-9'>
            <Plus className='h-4 w-4' />
          </Button>
        </div>
      )}
    </section>
  );
};
