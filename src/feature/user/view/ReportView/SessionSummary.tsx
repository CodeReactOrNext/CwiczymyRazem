import { cn } from "assets/lib/utils";
import { useTranslation } from "hooks/useTranslation";
import { CalendarDays, ListChecks } from "lucide-react";
import type { ReactNode } from "react";

import { formatPracticed, MINUTE_MS } from "./helpers/sessionSongs";

export interface SessionSummaryLine {
  key: string;
  label: string;
  minutes: number;
  /** Song titles are names — keep the browser from translating them. */
  isName: boolean;
  /** The line's cover or category icon. */
  leading: ReactNode;
}

interface SessionSummaryProps {
  lines: SessionSummaryLine[];
  totalMs: number;
  /** The day and habits, shown once the session has its "how long". */
  meta?: {
    dayLabel: string;
    habitsLabel: string;
    hasHabits: boolean;
    onOpenDay: () => void;
    onOpenHabits: () => void;
  };
  /** The save button and whatever belongs under it. */
  footer?: ReactNode;
}

const metaChipClass =
  "flex min-h-9 items-center gap-2 rounded-lg bg-zinc-800/60 px-3 text-sm font-medium transition-colors duration-fast hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

/**
 * The session as it stands, beside the questions on wide screens. The total
 * leads, large, because it is the one number the log is about; under it every
 * song or category gets a line with a bar for its share of that total, so the
 * split reads at a glance instead of from a column of minutes.
 */
const SessionSummary = ({
  lines,
  totalMs,
  meta,
  footer,
}: SessionSummaryProps) => {
  const { t } = useTranslation("report");
  const totalMinutes = totalMs / MINUTE_MS;

  return (
    <div className='sticky top-6 flex flex-col gap-7 rounded-lg bg-zinc-900/40 p-6'>
      <div className='flex flex-col gap-2'>
        <h3 className='text-sm font-semibold text-zinc-400'>
          {t("flow.your_session")}
        </h3>
        <p
          className={cn(
            "font-teko text-6xl font-semibold tabular-nums leading-[0.85] transition-colors duration-base",
            totalMs > 0 ? "text-zinc-100" : "text-zinc-500",
          )}>
          {formatPracticed(totalMs)}
        </p>
      </div>

      {lines.length === 0 ? (
        <p className='text-sm leading-relaxed text-zinc-400'>
          {t("flow.summary_empty")}
        </p>
      ) : (
        <ul className='flex flex-col gap-5'>
          {lines.map((line) => {
            const share = totalMinutes > 0 ? line.minutes / totalMinutes : 0;
            return (
              <li key={line.key} className='flex items-center gap-3'>
                {line.leading}
                <div className='flex min-w-0 flex-1 flex-col gap-2'>
                  <div className='flex items-baseline justify-between gap-3'>
                    <span
                      translate={line.isName ? "no" : undefined}
                      className='min-w-0 truncate text-sm font-medium text-zinc-100'>
                      {line.label}
                    </span>
                    <span
                      className={cn(
                        "shrink-0 text-sm font-semibold tabular-nums",
                        line.minutes > 0 ? "text-zinc-100" : "text-zinc-500",
                      )}>
                      {line.minutes > 0
                        ? formatPracticed(line.minutes * MINUTE_MS)
                        : "—"}
                    </span>
                  </div>
                  <div className='h-1.5 overflow-hidden rounded-full bg-zinc-800'>
                    <div
                      className='h-full rounded-full bg-emerald-500 transition-[width] duration-slow'
                      style={{ width: `${share * 100}%` }}
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {meta && (
        <div className='flex flex-wrap gap-2'>
          <button
            type='button'
            onClick={meta.onOpenDay}
            className={cn(metaChipClass, "text-zinc-100")}>
            <CalendarDays className='h-4 w-4 shrink-0 text-zinc-400' />
            {meta.dayLabel}
          </button>
          <button
            type='button'
            onClick={meta.onOpenHabits}
            className={cn(
              metaChipClass,
              meta.hasHabits ? "text-zinc-100" : "text-zinc-400",
            )}>
            <ListChecks className='h-4 w-4 shrink-0 text-zinc-400' />
            {meta.habitsLabel}
          </button>
        </div>
      )}

      {footer && <div className='flex flex-col gap-3'>{footer}</div>}
    </div>
  );
};

export default SessionSummary;
