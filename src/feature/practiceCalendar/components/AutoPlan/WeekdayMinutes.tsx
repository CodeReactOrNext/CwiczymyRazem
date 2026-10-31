import { cn } from "assets/lib/utils";

import { useCalendarDisplay } from "../../hooks/useCalendarDisplay";
import type { PlannerPrefs, Weekday } from "../../types/calendar.types";
import { addDays, WEEK_ORDER } from "../../utils/calendarDates";
import { MAX_MINUTES_PER_DAY } from "../../utils/planner";

type Overrides = PlannerPrefs["minutesByWeekday"];

/** A Monday, only to print weekday names in the player's language. */
const SAMPLE_MONDAY = "2026-11-02";

interface WeekdayMinutesProps {
  minutesPerDay: number;
  value: Overrides;
  onChange: (value: Overrides) => void;
}

/**
 * A different length for some days of the week — one field per day, empty to
 * use the default, 0 for a rest day — with a few common shapes one tap away.
 */
export const WeekdayMinutes = ({
  minutesPerDay,
  value,
  onChange,
}: WeekdayMinutesProps) => {
  const { formatDate, t } = useCalendarDisplay();

  const presets: { id: string; apply: () => Overrides }[] = [
    { id: "same", apply: () => ({}) },
    { id: "weekends_off", apply: () => ({ 6: 0, 0: 0 }) },
    {
      id: "longer_weekends",
      apply: () => {
        const longer = Math.min(MAX_MINUTES_PER_DAY, minutesPerDay * 2);
        return { 6: longer, 0: longer };
      },
    },
    { id: "every_other", apply: () => ({ 2: 0, 4: 0, 6: 0 }) },
  ];

  const setDay = (weekday: Weekday, raw: string) => {
    const next = { ...value };
    if (raw.trim() === "") delete next[weekday];
    else
      next[weekday] = Math.min(
        MAX_MINUTES_PER_DAY,
        Math.max(0, Math.round(Number(raw) || 0)),
      );
    onChange(next);
  };

  return (
    <div className='space-y-4'>
      <div className='flex flex-wrap gap-2'>
        {presets.map((preset) => (
          <button
            key={preset.id}
            type='button'
            onClick={() => onChange(preset.apply())}
            className='h-8 rounded bg-zinc-800/60 px-3 text-xs font-medium text-zinc-300 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'>
            {t(`planner.weekdays.presets.${preset.id}`)}
          </button>
        ))}
      </div>
      <div className='grid grid-cols-7 gap-1.5'>
        {WEEK_ORDER.map((weekday, index) => {
          const override = value[weekday];
          const isRest = override === 0;
          const isCustom = override !== undefined && !isRest;
          return (
            <label key={weekday} className='flex flex-col items-center gap-2'>
              <span
                className={cn(
                  "text-xs",
                  isRest ? "text-zinc-500" : "text-zinc-300",
                )}>
                {formatDate(addDays(SAMPLE_MONDAY, index), {
                  weekday: "short",
                })}
              </span>
              <input
                type='number'
                inputMode='numeric'
                min={0}
                max={MAX_MINUTES_PER_DAY}
                step={5}
                value={override ?? ""}
                placeholder={String(minutesPerDay)}
                onChange={(event) => setDay(weekday, event.target.value)}
                aria-label={formatDate(addDays(SAMPLE_MONDAY, index), {
                  weekday: "long",
                })}
                className={cn(
                  "h-11 w-full rounded-lg px-1 text-center text-base tabular-nums outline-none transition-colors [appearance:textfield] placeholder:text-zinc-500 focus-visible:ring-1 focus-visible:ring-zinc-400 lg:text-sm [&::-webkit-inner-spin-button]:appearance-none",
                  isRest
                    ? "bg-zinc-900 text-zinc-500"
                    : isCustom
                      ? "bg-zinc-700 text-zinc-100"
                      : "bg-zinc-800/60 text-zinc-100",
                )}
              />
              <span className='h-3 text-[10px] text-zinc-500'>
                {isRest ? t("planner.weekdays.rest") : ""}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
};
