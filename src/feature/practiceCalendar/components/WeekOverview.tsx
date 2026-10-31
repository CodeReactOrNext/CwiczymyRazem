import { useCalendarDisplay } from "../hooks/useCalendarDisplay";
import type { PracticeArea } from "../types/calendar.types";
import { AreaBalance } from "./AreaBalance";

interface WeekOverviewProps {
  planned: number;
  played: number;
  activeDays: number;
  minutesByArea: Record<PracticeArea, number>;
}

/** The week at a glance: how much is planned, how much is played, and how it splits. */
export const WeekOverview = ({
  planned,
  played,
  activeDays,
  minutesByArea,
}: WeekOverviewProps) => {
  const { formatMinutes, t } = useCalendarDisplay();
  const percent = planned > 0 ? Math.round((played / planned) * 100) : 0;

  return (
    <section className='grid gap-8 rounded-lg bg-zinc-900/40 p-5 sm:p-6 md:grid-cols-[auto_1fr] md:gap-12'>
      <dl className='flex gap-10'>
        <div>
          <dt className='text-xs text-zinc-400'>{t("week.planned")}</dt>
          <dd className='mt-1.5 text-2xl font-semibold tabular-nums text-zinc-100'>
            {formatMinutes(planned)}
          </dd>
        </div>
        <div>
          <dt className='text-xs text-zinc-400'>{t("week.played")}</dt>
          <dd className='mt-1.5 flex items-baseline gap-2 text-2xl font-semibold tabular-nums text-zinc-100'>
            {formatMinutes(played)}
            {planned > 0 && (
              <span className='text-sm font-medium text-emerald-400'>
                {percent}%
              </span>
            )}
          </dd>
        </div>
        <div className='hidden sm:block'>
          <dt className='text-xs text-zinc-400'>{t("week.days")}</dt>
          <dd className='mt-1.5 text-2xl font-semibold tabular-nums text-zinc-100'>
            {activeDays}
            <span className='text-base font-medium text-zinc-500'>/7</span>
          </dd>
        </div>
      </dl>
      <AreaBalance minutesByArea={minutesByArea} className='self-center' />
    </section>
  );
};
