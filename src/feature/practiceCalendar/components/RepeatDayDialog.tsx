import { Button, PRESSABLE_KEY } from "assets/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "assets/components/ui/dialog";
import { Switch } from "assets/components/ui/switch";
import { cn } from "assets/lib/utils";
import { Link2Off } from "lucide-react";
import { useMemo, useState } from "react";

import { useCalendarDisplay } from "../hooks/useCalendarDisplay";
import type { CalendarDays } from "../types/calendar.types";
import { addDays, startOfWeek, weekDates } from "../utils/calendarDates";

/** How far ahead a day can be repeated: five weeks from its own Monday. */
const WEEKS_SHOWN = 5;
const SAME_WEEKDAY_REPEATS = 4;

interface RepeatDayDialogProps {
  source: string;
  today: string;
  days: CalendarDays;
  /** The days the source is already linked with. */
  siblings: string[];
  onApply: (targets: string[], link: boolean) => void;
  onUnlink: () => void;
  onClose: () => void;
}

/**
 * Copies one day onto others — picked on a five-week grid, or every same
 * weekday at once. Kept in sync, the days share one routine: change one and
 * the rest follow, while each keeps its own ticks.
 */
export const RepeatDayDialog = ({
  source,
  today,
  days,
  siblings,
  onApply,
  onUnlink,
  onClose,
}: RepeatDayDialogProps) => {
  const { formatDate, t } = useCalendarDisplay();
  // Past days of the group can't be picked; re-applying lets them go their own way.
  const [picked, setPicked] = useState<Set<string>>(
    () => new Set(siblings.filter((date) => date >= today)),
  );
  const [link, setLink] = useState(true);

  const weeks = useMemo(() => {
    const monday = startOfWeek(source);
    return Array.from({ length: WEEKS_SHOWN }, (_, index) =>
      weekDates(addDays(monday, index * 7)),
    );
  }, [source]);
  const lastShown = weeks[WEEKS_SHOWN - 1][6];

  const toggle = (date: string) =>
    setPicked((current) => {
      const next = new Set(current);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });

  const sameWeekday = Array.from({ length: SAME_WEEKDAY_REPEATS }, (_, index) =>
    addDays(source, (index + 1) * 7),
  ).filter((date) => date <= lastShown);
  const allSameWeekday = sameWeekday.every((date) => picked.has(date));

  // Days that already hold something lose it — worth a word in the footer.
  const replacing = [...picked].filter(
    (date) => !siblings.includes(date) && (days[date] ?? []).length > 0,
  ).length;

  const sourceLabel = formatDate(source, {
    weekday: "long",
    day: "numeric",
    month: "short",
  });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='flex flex-col gap-6 border-0 bg-zinc-900 shadow-none sm:max-h-[90vh] sm:max-w-md sm:p-8'>
        <div className='space-y-2 pr-10'>
          <DialogTitle className='text-xl font-bold text-zinc-100'>
            {t("repeat.title", { day: sourceLabel })}
          </DialogTitle>
          <DialogDescription className='text-sm text-zinc-400'>
            {t("repeat.description")}
          </DialogDescription>
        </div>

        {siblings.length > 0 && (
          <div className='flex items-center justify-between gap-4 rounded-lg bg-zinc-800/40 px-4 py-3'>
            <p className='text-sm text-zinc-300'>
              {t("repeat.linked_with", { count: siblings.length })}
            </p>
            <button
              type='button'
              onClick={onUnlink}
              className='flex shrink-0 items-center gap-1.5 rounded px-1 text-sm text-zinc-400 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 hover:text-zinc-100'>
              <Link2Off className='h-3.5 w-3.5' aria-hidden />
              {t("repeat.unlink")}
            </button>
          </div>
        )}

        <div className='space-y-3'>
          <div className='grid grid-cols-7 gap-1'>
            {weeks[0].map((date) => (
              <span
                key={date}
                className='pb-1 text-center text-[11px] text-zinc-500'>
                {formatDate(date, { weekday: "narrow" })}
              </span>
            ))}
            {weeks.flat().map((date) => {
              const isSource = date === source;
              const disabled = isSource || date < today;
              const selected = picked.has(date);
              const busy = (days[date] ?? []).length > 0;
              return (
                <button
                  key={date}
                  type='button'
                  disabled={disabled}
                  onClick={() => toggle(date)}
                  aria-pressed={selected}
                  aria-label={formatDate(date, {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                  className={cn(
                    "relative flex h-11 flex-col items-center justify-center rounded-lg text-sm tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400",
                    isSource
                      ? "bg-zinc-100 font-semibold text-zinc-950"
                      : selected
                        ? "bg-zinc-600 font-semibold text-zinc-50"
                        : "bg-zinc-800/40 text-zinc-300 hover:bg-zinc-800",
                    disabled && !isSource && "bg-transparent text-zinc-700",
                  )}>
                  {date.endsWith("-01") && (
                    <span className='text-[9px] leading-none opacity-70'>
                      {formatDate(date, { month: "short" })}
                    </span>
                  )}
                  {formatDate(date, { day: "numeric" })}
                  {busy && !isSource && !disabled && (
                    <span
                      className='absolute bottom-1 h-1 w-1 rounded-full bg-zinc-500'
                      aria-hidden
                    />
                  )}
                </button>
              );
            })}
          </div>
          {sameWeekday.length > 0 && (
            <button
              type='button'
              onClick={() =>
                setPicked((current) => {
                  const next = new Set(current);
                  sameWeekday.forEach((date) =>
                    allSameWeekday ? next.delete(date) : next.add(date),
                  );
                  return next;
                })
              }
              aria-pressed={allSameWeekday}
              className={cn(
                PRESSABLE_KEY,
                "h-9 rounded-lg px-3.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400",
                allSameWeekday
                  ? "bg-zinc-700 text-zinc-100"
                  : "bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200",
              )}>
              {t("repeat.same_weekday", { count: sameWeekday.length })}
            </button>
          )}
        </div>

        <div className='flex items-center gap-5'>
          <div className='min-w-0 flex-1'>
            <p className='text-sm font-medium text-zinc-100'>
              {t("repeat.sync")}
            </p>
            <p className='mt-1 text-sm text-zinc-400'>
              {link ? t("repeat.sync_on_hint") : t("repeat.sync_off_hint")}
            </p>
          </div>
          <Switch
            checked={link}
            onChange={() => setLink((value) => !value)}
            aria-label={t("repeat.sync")}
          />
        </div>

        <div className='space-y-3'>
          {replacing > 0 && (
            <p className='text-xs text-zinc-500'>
              {t("repeat.replaces", { count: replacing })}
            </p>
          )}
          <Button
            onClick={() => onApply([...picked].sort(), link)}
            disabled={picked.size === 0}
            className='h-11 w-full rounded-lg border-b-black/25 bg-white font-bold text-zinc-950 focus-visible:ring-1 focus-visible:ring-zinc-400 hover:bg-zinc-200'>
            {t("repeat.apply", { count: picked.size })}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
