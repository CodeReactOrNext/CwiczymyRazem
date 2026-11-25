import { Card } from "assets/components/ui/card";
import { cn } from "assets/lib/utils";
import { useTranslation } from "hooks/useTranslation";
import { useIntlLocale } from "lib/i18n/dateLocale";
import { useMemo } from "react";
import { convertMsToHM } from "utils/converter";

import type { DayGroup } from "../types/practiceLog.types";
import {
  barStart,
  buildPracticeBars,
  formatBarTime,
  type PracticeBarUnit,
  yearMarks,
} from "../utils/practiceBars";

/** Share of the column's height the tallest bar takes; the rest holds its label. */
const MAX_BAR_PCT = 78;
/** The same with a row of years under the labels. */
const MAX_BAR_PCT_WITH_YEARS = 67;
/** How many labels fit side by side on a phone. */
const PHONE_LABELS = 8;
/** More bars than this need a wide screen to label every one. */
const TABLET_LABELS = 14;
/** How many narrow bars a year label spans on a phone. */
const YEAR_LABEL_BARS = 3;

interface PracticeBarsProps {
  days: DayGroup[];
  totalMs: number;
  /** Last day of the picked range; today when there is none. */
  end?: Date;
}

const formatStart = (
  date: Date,
  unit: PracticeBarUnit,
  locale: string,
  barCount: number,
) => {
  if (unit === "year") return String(date.getFullYear());
  if (unit === "month")
    return date.toLocaleDateString(locale, { month: "short" });
  if (unit === "day" && barCount <= 7)
    return date.toLocaleDateString(locale, { weekday: "short" });
  return date.toLocaleDateString(locale, { day: "numeric", month: "short" });
};

/**
 * Practice time over the picked range as a few wide bars with their value on
 * top — no axis to decode. One colour: a shorter last day is not a failure.
 */
export const PracticeBars = ({ days, totalMs, end }: PracticeBarsProps) => {
  const { t } = useTranslation("practice_log");
  const locale = useIntlLocale() ?? "en";

  const { unit, bars, maxMs, currentStart } = useMemo(() => {
    const now = new Date();
    const built = buildPracticeBars(days, end ?? now);
    return {
      ...built,
      maxMs: Math.max(1, ...built.bars.map((bar) => bar.totalMs)),
      currentStart: barStart(now, built.unit).getTime(),
    };
  }, [days, end]);

  // On a phone every n-th bar is labelled, counted back from the newest one.
  const phoneStep = Math.ceil(bars.length / PHONE_LABELS);
  const skippedLabel =
    bars.length > TABLET_LABELS
      ? "invisible lg:visible"
      : "invisible sm:visible";
  const years = yearMarks(bars, unit);
  const maxBarPct = years.length > 0 ? MAX_BAR_PCT_WITH_YEARS : MAX_BAR_PCT;

  return (
    <Card className='flex flex-col gap-5'>
      <div className='flex items-baseline justify-between gap-3'>
        <h3 className='text-base font-semibold text-zinc-100'>
          {t(`chart.${unit}`)}
        </h3>
        <p className='text-sm tabular-nums text-zinc-400'>
          {convertMsToHM(totalMs)}
        </p>
      </div>

      <ul
        className={cn(
          "flex items-end gap-1 sm:gap-2.5",
          years.length > 0 ? "h-48 sm:h-60" : "h-40 sm:h-52",
        )}>
        {bars.map(({ start, totalMs: barMs }, index) => {
          const isCurrent = start.getTime() === currentStart;
          const labelClass =
            (bars.length - 1 - index) % phoneStep === 0 ? "" : skippedLabel;
          // The first year gives way when January is too close beside it.
          const yearClass =
            index === 0 && years[1] < YEAR_LABEL_BARS ? skippedLabel : "";
          return (
            <li
              key={start.getTime()}
              className='flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5'>
              {barMs > 0 && (
                <span
                  className={cn(
                    "whitespace-nowrap text-[11px] font-semibold tabular-nums text-zinc-300 sm:text-xs",
                    labelClass,
                  )}>
                  {formatBarTime(barMs, locale)}
                </span>
              )}
              {barMs > 0 ? (
                <span
                  className={cn(
                    "relative min-h-3.5 w-full max-w-14 shrink-0 rounded-lg",
                    isCurrent ? "bg-cyan-500" : "bg-cyan-500/50",
                  )}
                  style={{ height: `${(barMs / maxMs) * maxBarPct}%` }}>
                  <span className='light-hide absolute inset-x-1 top-1 h-1 rounded-full bg-white/30 sm:inset-x-2' />
                </span>
              ) : (
                <span className='h-1.5 w-full max-w-14 shrink-0 rounded bg-zinc-800' />
              )}
              <span
                className={cn(
                  "whitespace-nowrap text-[11px] sm:text-xs",
                  isCurrent ? "font-semibold text-zinc-100" : "text-zinc-400",
                  labelClass,
                )}>
                {formatStart(start, unit, locale, bars.length)}
              </span>
              {years.length > 0 && (
                <span
                  className={cn(
                    "-mt-1 h-4 whitespace-nowrap text-[11px] font-semibold tabular-nums leading-4 text-zinc-200 sm:text-xs sm:leading-4",
                    yearClass,
                  )}>
                  {years.includes(index) && start.getFullYear()}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </Card>
  );
};
