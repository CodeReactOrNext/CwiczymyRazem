import { Card } from "assets/components/ui/card";
import { cn } from "assets/lib/utils";
import { useTranslation } from "hooks/useTranslation";
import { CalendarCheck, ListChecks, Timer } from "lucide-react";
import type { ReactNode } from "react";
import { convertMsToHM } from "utils/converter";

import type { PracticeLogSummaryData } from "../types/practiceLog.types";
import { CategorySplit } from "./CategorySplit";

interface PracticeLogSummaryProps {
  summary: PracticeLogSummaryData;
  className?: string;
}

const StatTile = ({
  value,
  label,
  icon,
  className,
}: {
  value: string;
  label: string;
  icon?: ReactNode;
  className?: string;
}) => (
  <Card
    size='sm'
    className={cn("flex min-w-0 items-center gap-3", className)}>
    {icon && (
      <span className='shrink-0 text-zinc-400' aria-hidden>
        {icon}
      </span>
    )}
    <div className='flex min-w-0 flex-col-reverse'>
      <dt className='truncate text-xs text-zinc-400'>{label}</dt>
      <dd className='whitespace-nowrap text-[17px] font-bold leading-tight tabular-nums text-zinc-50'>
        {value}
      </dd>
    </div>
  </Card>
);

const useStats = (summary: PracticeLogSummaryData) => {
  const { t } = useTranslation("practice_log");
  return {
    time: {
      label: t("summary.total_time"),
      value: convertMsToHM(summary.totalTimeMs),
    },
    sessions: {
      label: t("summary.sessions"),
      value: String(summary.sessionCount),
      icon: <ListChecks className='h-5 w-5' />,
    },
    points: {
      label: t("summary.points"),
      value: summary.totalPoints.toLocaleString(),
      icon: (
        <img
          src='/images/tokens/pick.png'
          alt=''
          className='h-5 w-5 object-contain'
        />
      ),
    },
    days: {
      label: t("summary.active_days"),
      value: String(summary.activeDays),
      icon: <CalendarCheck className='h-5 w-5' />,
    },
    average: {
      label: t("summary.avg_session"),
      value: convertMsToHM(summary.avgSessionMs),
      icon: <Timer className='h-5 w-5' />,
    },
  };
};

/** The sidebar's numbers: the total time leads, the rest sit two by two under it. */
export const PracticeLogTiles = ({
  summary,
  className,
}: PracticeLogSummaryProps) => {
  const { time, sessions, points, days, average } = useStats(summary);
  return (
    <dl className={cn("grid grid-cols-2 gap-2", className)}>
      <Card size='sm' className='col-span-2 flex flex-col-reverse gap-0.5'>
        <dt className='text-xs text-zinc-400'>{time.label}</dt>
        <dd className='font-teko text-[42px] font-semibold leading-none tabular-nums text-zinc-50'>
          {time.value}
        </dd>
      </Card>
      <StatTile {...sessions} />
      <StatTile {...points} />
      <StatTile {...days} />
      <StatTile {...average} />
    </dl>
  );
};

/**
 * Phones read the page top to bottom, so there the three headline numbers stay
 * on one line above the list and the other two wait under it, with the split.
 */
export const PracticeLogTopTiles = ({
  summary,
  className,
}: PracticeLogSummaryProps) => {
  const { time, sessions, days } = useStats(summary);
  return (
    <dl className={cn("grid grid-cols-[1.4fr_1fr_1fr] gap-2", className)}>
      <StatTile {...time} className='p-3' />
      <StatTile {...days} icon={undefined} className='p-3' />
      <StatTile {...sessions} icon={undefined} className='p-3' />
    </dl>
  );
};

export const PracticeLogRestTiles = ({
  summary,
  className,
}: PracticeLogSummaryProps) => {
  const { points, average } = useStats(summary);
  return (
    <dl className={cn("grid grid-cols-2 gap-2", className)}>
      <StatTile {...points} />
      <StatTile {...average} />
    </dl>
  );
};

/** Where the time went; left out when nothing in the range carries a split. */
export const PracticeLogTimeSplit = ({
  summary,
  className,
}: PracticeLogSummaryProps) => {
  const { t } = useTranslation("practice_log");
  const hasSplit = Object.values(summary.perCategoryMs).some((ms) => ms > 0);
  if (!hasSplit) return null;

  return (
    <Card className={cn("flex flex-col gap-4 p-5", className)}>
      <h3 className='text-sm font-semibold text-zinc-100'>
        {t("summary.time_split")}
      </h3>
      <CategorySplit split={summary.perCategoryMs} />
    </Card>
  );
};
