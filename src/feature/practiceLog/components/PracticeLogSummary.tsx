import { ActivityChart } from "components/Charts/ActivityChart";
import { useTranslation } from "hooks/useTranslation";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  CalendarDays,
  Clock,
  ListMusic,
  PieChart,
  Star,
  Timer,
} from "lucide-react";
import { convertMsToHM } from "utils/converter";

import { CATEGORY_META } from "../config/sessionType";
import type { PracticeLogSummaryData } from "../types/practiceLog.types";

interface PracticeLogSummaryProps {
  summary: PracticeLogSummaryData;
}

const StatTile = ({
  icon: Icon,
  iconClass,
  label,
  value,
}: {
  icon: LucideIcon;
  iconClass: string;
  label: string;
  value: string;
}) => (
  <div className="flex items-center gap-3 rounded-xl bg-zinc-900/50 px-3.5 py-3 ring-1 ring-white/5">
    <div
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconClass}`}
    >
      <Icon size={16} />
    </div>
    <div className="min-w-0">
      <p className="truncate text-[10px] font-bold uppercase tracking-wider text-zinc-500">
        {label}
      </p>
      <p className="text-lg font-bold leading-tight text-zinc-100">{value}</p>
    </div>
  </div>
);

export const PracticeLogSummary = ({ summary }: PracticeLogSummaryProps) => {
  const { t } = useTranslation(["practice_log", "common"]);

  const statTiles = [
    {
      icon: Clock,
      iconClass: "bg-cyan-500/10 text-cyan-400",
      label: t("summary.total_time"),
      value: `${convertMsToHM(summary.totalTimeMs)}h`,
    },
    {
      icon: ListMusic,
      iconClass: "bg-emerald-500/10 text-emerald-400",
      label: t("summary.sessions"),
      value: String(summary.sessionCount),
    },
    {
      icon: Star,
      iconClass: "bg-amber-500/10 text-amber-400",
      label: t("summary.points"),
      value: String(summary.totalPoints),
    },
    {
      icon: CalendarDays,
      iconClass: "bg-violet-500/10 text-violet-400",
      label: t("summary.active_days"),
      value: String(summary.activeDays),
    },
    {
      icon: Timer,
      iconClass: "bg-rose-500/10 text-rose-400",
      label: t("summary.avg_session"),
      value: `${convertMsToHM(summary.avgSessionMs)}h`,
    },
  ];

  return (
    <section className="flex flex-col gap-4 rounded-2xl bg-zinc-800/30 p-4 ring-1 ring-white/5 sm:p-5">
      <header className="flex items-center gap-2">
        <BarChart3 size={16} className="text-cyan-400" />
        <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-300">
          {t("summary.heading")}
        </h2>
      </header>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
        {statTiles.map((tile) => (
          <StatTile key={tile.label} {...tile} />
        ))}
      </div>

      <div className="flex items-center gap-2 pt-1">
        <PieChart size={13} className="text-zinc-500" />
        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
          {t("summary.time_split")}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {CATEGORY_META.map(({ key, labelKey, text, dot }) => (
          <div
            key={key}
            className="flex items-center gap-2.5 rounded-xl bg-zinc-900/50 px-3.5 py-2.5 ring-1 ring-white/5"
          >
            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${dot}`} />
            <div className="min-w-0">
              <p className={`text-sm font-bold ${text}`}>
                {convertMsToHM(summary.perCategoryMs[key])}h
              </p>
              <p className="truncate text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                {t(labelKey)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {summary.dailyRows.length >= 2 && (
        <ActivityChart data={summary.dailyRows} showRangeSelect={false} />
      )}
    </section>
  );
};
