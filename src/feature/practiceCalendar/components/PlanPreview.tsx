import { cn } from "assets/lib/utils";
import { RotationThumb } from "feature/rotation/components/RotationThumb";
import { Shuffle } from "lucide-react";
import { useState } from "react";

import { useCalendarDisplay } from "../hooks/useCalendarDisplay";
import { AREA_DOT } from "../utils/areaStyles";
import { sumMinutes } from "../utils/calendarItems";
import type { PlannerResult } from "../utils/planner";
import { AreaBalance } from "./AreaBalance";

interface PlanPreviewProps {
  dates: string[];
  today: string;
  result: PlannerResult;
  onReshuffle: () => void;
}

const BAR_HEIGHT = 128;

/**
 * What the fill will lay down, before it does: a column per day stacked by
 * area, the split over the range, and the slots of whichever day is picked.
 */
export const PlanPreview = ({
  dates,
  today,
  result,
  onReshuffle,
}: PlanPreviewProps) => {
  const { describe, formatDate, formatMinutes, t } = useCalendarDisplay();
  const [picked, setPicked] = useState<string | null>(null);
  const { days } = result;
  const longest = Math.max(
    1,
    ...dates.map((date) => sumMinutes(days[date] ?? [])),
  );
  const shown =
    picked && dates.includes(picked)
      ? picked
      : (dates.find((date) => (days[date] ?? []).length > 0) ?? dates[0]);
  const shownItems = days[shown] ?? [];
  const blocks = dates.reduce(
    (sum, date) => sum + (days[date] ?? []).length,
    0,
  );
  const restDays = dates.filter(
    (date) => (days[date] ?? []).length === 0,
  ).length;

  return (
    <div className='space-y-10'>
      <div className='flex items-start justify-between gap-4'>
        <div>
          <p className='text-3xl font-semibold tabular-nums text-zinc-100'>
            {formatMinutes(result.totalMinutes)}
          </p>
          <p className='mt-2 text-sm text-zinc-400'>
            {t("planner.summary.blocks", { count: blocks })}
            {restDays > 0 && (
              <>
                <span className='mx-2 text-zinc-600'>·</span>
                {t("planner.summary.rest", { count: restDays })}
              </>
            )}
          </p>
        </div>
        <button
          type='button'
          onClick={onReshuffle}
          className='flex h-9 shrink-0 items-center gap-2 rounded-lg bg-zinc-800 px-3 text-sm font-medium text-zinc-200 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 hover:bg-zinc-700'>
          <Shuffle className='h-4 w-4 text-zinc-400' aria-hidden />
          {t("planner.reshuffle")}
        </button>
      </div>

      <div
        className='grid items-end gap-1'
        style={{
          gridTemplateColumns: `repeat(${dates.length}, minmax(0, 1fr))`,
        }}>
        {dates.map((date) => {
          const items = days[date] ?? [];
          const minutes = sumMinutes(items);
          const active = date === shown;
          return (
            <button
              key={date}
              type='button'
              onClick={() => setPicked(date)}
              aria-pressed={active}
              aria-label={`${formatDate(date, { weekday: "long", day: "numeric" })}, ${formatMinutes(minutes)}`}
              className={cn(
                "flex min-w-0 flex-col items-center gap-2 rounded-lg px-0.5 pb-2 pt-2.5 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400",
                active ? "bg-zinc-800" : "hover:bg-zinc-800/50",
              )}>
              <span
                className={cn(
                  "text-[10px] tabular-nums",
                  active ? "text-zinc-200" : "text-zinc-500",
                )}>
                {minutes > 0 ? minutes : "–"}
              </span>
              <div
                className='flex w-full max-w-[20px] flex-col justify-end'
                style={{ height: BAR_HEIGHT }}>
                {items.length === 0 ? (
                  <div className='h-1 w-full rounded bg-zinc-800' />
                ) : (
                  <div className='flex flex-col-reverse gap-px overflow-hidden rounded'>
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className={cn(
                          "w-full",
                          AREA_DOT[item.area],
                          item.done && "opacity-40",
                        )}
                        style={{
                          height: Math.max(
                            3,
                            (item.minutes / longest) * BAR_HEIGHT,
                          ),
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
              <span className='flex flex-col items-center leading-tight'>
                <span
                  className={cn(
                    "text-[11px]",
                    date === today
                      ? "text-cyan-400"
                      : active
                        ? "text-zinc-100"
                        : "text-zinc-400",
                  )}>
                  {formatDate(date, { weekday: "narrow" })}
                </span>
                <span className='text-[10px] tabular-nums text-zinc-500'>
                  {formatDate(date, { day: "numeric" })}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <AreaBalance minutesByArea={result.minutesByArea} />

      <div className='space-y-4'>
        <p className='flex items-baseline justify-between gap-3 text-sm font-medium text-zinc-100'>
          {formatDate(shown, {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
          <span className='font-normal tabular-nums text-zinc-400'>
            {formatMinutes(sumMinutes(shownItems))}
          </span>
        </p>
        {shownItems.length === 0 ? (
          <p className='text-sm text-zinc-500'>{t("planner.rest_day")}</p>
        ) : (
          <ul className='space-y-3'>
            {shownItems.map((item) => {
              const display = describe(item);
              return (
                <li key={item.id} className='flex items-center gap-3'>
                  <RotationThumb
                    display={display}
                    className='h-9 w-9'
                    iconClassName='h-4 w-4'
                  />
                  <span className='min-w-0 flex-1'>
                    <span className='block truncate text-sm text-zinc-100'>
                      {display.title}
                    </span>
                    <span className='mt-0.5 flex items-center gap-1.5 text-xs text-zinc-400'>
                      <span
                        className={cn(
                          "h-1.5 w-1.5 shrink-0 rounded-full",
                          AREA_DOT[item.area],
                        )}
                      />
                      <span className='truncate'>
                        {item.role === "warmup"
                          ? t("item.warmup")
                          : display.subtitle}
                      </span>
                    </span>
                  </span>
                  <span className='shrink-0 text-sm tabular-nums text-zinc-400'>
                    {t("time.minutes_short", { count: item.minutes })}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};
