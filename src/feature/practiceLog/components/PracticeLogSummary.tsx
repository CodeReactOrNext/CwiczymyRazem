import { useTranslation } from "hooks/useTranslation";
import { convertMsToHM } from "utils/converter";

import { CATEGORY_META } from "../config/sessionType";
import type { PracticeLogSummaryData } from "../types/practiceLog.types";

interface PracticeLogSummaryProps {
  summary: PracticeLogSummaryData;
}

/**
 * Stats + time-split panel. Reads as a horizontal band on small screens and
 * folds into a vertical column when placed in the desktop sidebar.
 */
export const PracticeLogSummary = ({ summary }: PracticeLogSummaryProps) => {
  const { t } = useTranslation(["practice_log", "common"]);

  const stats = [
    {
      label: t("summary.total_time"),
      value: `${convertMsToHM(summary.totalTimeMs)}h`,
    },
    { label: t("summary.sessions"), value: String(summary.sessionCount) },
    { label: t("summary.points"), value: String(summary.totalPoints) },
    { label: t("summary.active_days"), value: String(summary.activeDays) },
    {
      label: t("summary.avg_session"),
      value: `${convertMsToHM(summary.avgSessionMs)}h`,
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-500">
          {t("summary.heading")}
        </p>
        <dl className="flex flex-row flex-wrap gap-x-8 gap-y-5 lg:flex-col lg:gap-5">
          {stats.map((stat) => (
            <div key={stat.label}>
              <dd className="font-display text-2xl font-semibold leading-none tracking-tight text-zinc-50 tabular-nums">
                {stat.value}
              </dd>
              <dt className="mt-1.5 text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500">
                {stat.label}
              </dt>
            </div>
          ))}
        </dl>
      </div>

      <div className="flex flex-col gap-3.5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-500">
          {t("summary.time_split")}
        </p>
        <ul className="flex flex-row flex-wrap gap-x-7 gap-y-2.5 lg:flex-col lg:gap-3">
          {CATEGORY_META.map(({ key, labelKey, dot }) => (
            <li key={key} className="flex items-center gap-2.5">
              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} />
              <span className="text-sm font-semibold tabular-nums text-zinc-200">
                {convertMsToHM(summary.perCategoryMs[key])}h
              </span>
              <span className="text-xs text-zinc-500">{t(labelKey)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
