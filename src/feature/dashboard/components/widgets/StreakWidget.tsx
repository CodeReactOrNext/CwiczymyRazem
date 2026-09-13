import { Card } from "assets/components/ui/card";
import { useDashboardData } from "feature/dashboard/context/DashboardContext";
import { ArrowRight, Flame } from "lucide-react";
import Link from "next/link";
import { getDailyStreakMultiplier, getReconciledStreak } from "utils/gameLogic";

import { WidgetHeader } from "./WidgetHeader";

/**
 * The streak on its own, with the two things the number alone does not say:
 * what it is worth right now and whether today has been taken care of.
 */
export const StreakWidget = () => {
  const { userStats, activity } = useDashboardData();

  // Same reconciliation as the This Week card: the activity log is the
  // timezone-correct source, the stored counter only fills in until it loads.
  const { dayWithoutBreak, didPracticeToday } = getReconciledStreak({
    actualDayWithoutBreak: userStats.actualDayWithoutBreak ?? 0,
    lastReportDate: userStats.lastReportDate ?? "",
    reportDates: activity.reportList.map((report) => report.date),
  });
  const multiplier = getDailyStreakMultiplier(dayWithoutBreak);

  return (
    <Card className='flex h-full flex-col p-5 sm:p-6'>
      <WidgetHeader
        icon={Flame}
        iconClassName='text-orange-400'
        title='Streak'
      />

      <div className='flex items-baseline gap-2'>
        <span className='text-4xl font-bold tabular-nums text-white'>
          {dayWithoutBreak}
        </span>
        <span className='text-sm text-zinc-400'>
          {dayWithoutBreak === 1 ? "day" : "days"}
        </span>
      </div>

      {multiplier > 0 && (
        <p className='mt-2 text-xs font-semibold text-orange-400'>
          +{Math.round(multiplier * 100)}% points on every session
        </p>
      )}

      <p className='mt-4 text-sm text-zinc-400'>
        {didPracticeToday
          ? "Today is in the bag."
          : "Nothing logged yet today. A short session keeps it alive."}
      </p>

      {!didPracticeToday && (
        <Link
          href='/timer'
          className='mt-4 inline-flex w-fit items-center gap-1.5 rounded-lg bg-zinc-900/60 px-3 py-2 text-sm font-semibold text-zinc-100 transition-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500 hover:bg-zinc-900'>
          Practice now
          <ArrowRight size={14} />
        </Link>
      )}
    </Card>
  );
};
