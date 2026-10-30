import { Card } from "assets/components/ui/card";
import { isSameWeek, isYesterday } from "date-fns";
import { useDashboardData } from "feature/dashboard/context/DashboardContext";
import { useTranslation } from "hooks/useTranslation";
import { ArrowRight, Coffee, Flame } from "lucide-react";
import Link from "next/link";
import {
  getDailyStreakMultiplier,
  getReconciledStreak,
  hasRestDays,
} from "utils/gameLogic";

import { WidgetHeader } from "./WidgetHeader";

/**
 * The streak on its own, with the two things the number alone does not say:
 * what it is worth right now and whether today has been taken care of.
 */
export const StreakWidget = () => {
  const { t } = useTranslation("dashboard");
  const { userStats, activity } = useDashboardData();

  // Same reconciliation as the This Week card: the activity log is the
  // timezone-correct source, the stored counter only fills in until it loads.
  const restDays = hasRestDays(userStats);
  const { dayWithoutBreak, didPracticeToday, restDayDates } =
    getReconciledStreak({
      actualDayWithoutBreak: userStats.actualDayWithoutBreak ?? 0,
      lastReportDate: userStats.lastReportDate ?? "",
      reportDates: activity.reportList.map((report) => report.date),
      restDays,
    });
  const multiplier = getDailyStreakMultiplier(dayWithoutBreak);

  // The rest day is a weekly allowance, so the widget only ever has to say
  // whether this week's is still free — and, the morning after one was taken,
  // that today has to count.
  const now = new Date();
  const restedYesterday = restDayDates.some((day) => isYesterday(day));
  const restUsedThisWeek = restDayDates.some((day) =>
    isSameWeek(day, now, { weekStartsOn: 1 }),
  );

  return (
    <Card className='flex h-full flex-col p-5 sm:p-6'>
      <WidgetHeader
        icon={Flame}
        iconClassName='text-orange-400'
        title={t("streak.title")}
      />

      <div className='flex items-baseline gap-2'>
        <span className='text-4xl font-bold tabular-nums text-white'>
          {dayWithoutBreak}
        </span>
        <span className='text-sm text-zinc-400'>
          {dayWithoutBreak === 1 ? t("streak.day") : t("streak.days")}
        </span>
      </div>

      {multiplier > 0 && (
        <p className='mt-2 text-xs font-semibold text-orange-400'>
          {t("streak.bonus", { pct: Math.round(multiplier * 100) })}
        </p>
      )}

      <p className='mt-4 text-sm text-zinc-400'>
        {didPracticeToday
          ? t("streak.done_today")
          : restedYesterday
            ? t("streak.rest_yesterday")
            : t("streak.not_yet")}
      </p>

      {/* The morning after a rest day the line above already says it. */}
      {restDays &&
        dayWithoutBreak > 0 &&
        !(restedYesterday && !didPracticeToday) && (
          <p className='mt-2 flex items-start gap-1.5 text-xs text-zinc-500'>
            <Coffee size={12} className='mt-0.5 shrink-0' />
            {restUsedThisWeek ? t("streak.rest_used") : t("streak.rest_free")}
          </p>
        )}

      {!didPracticeToday && (
        <Link
          href='/timer'
          className='mt-4 inline-flex min-h-11 w-fit items-center gap-1.5 rounded-lg bg-zinc-900/60 px-3 py-2 text-sm font-semibold text-zinc-100 transition-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500 hover:bg-zinc-900'>
          {t("streak.practice_now")}
          <ArrowRight size={14} />
        </Link>
      )}
    </Card>
  );
};
