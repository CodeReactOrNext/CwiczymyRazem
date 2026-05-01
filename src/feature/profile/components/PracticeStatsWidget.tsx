import { Card } from "assets/components/ui/card";
import { cn } from "assets/lib/utils";
import { addDays, isSameDay, startOfWeek } from "date-fns";
import { FaFire } from "react-icons/fa";
import {
  Bar,
  BarChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import type { StatisticsDataInterface } from "types/api.types";
import { checkIsPracticeToday, getUpdatedActualDayWithoutBreak } from "utils/gameLogic";

const DAILY_GOAL_MIN = 15;
const DAILY_GOAL_MS = DAILY_GOAL_MIN * 60 * 1000;

interface ActivityDetail {
  title: string;
  time: number;
  points: number;
}

interface FormattedReport {
  date: Date;
  techniqueTime: number;
  theoryTime: number;
  hearingTime: number;
  creativityTime: number;
  exceriseTitle?: string;
  totalTime: number;
  activities?: ActivityDetail[];
}

interface PracticeStatsWidgetProps {
  userStats: StatisticsDataInterface;
  totalTimeValue: string;
  trendData: number[];
  reportList: FormattedReport[];
  className?: string;
}

const formatMin = (ms: number) => {
  const m = Math.floor(ms / 60000);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem > 0 ? `${h}h ${rem}m` : `${h}h`;
};

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const data = payload[0]?.payload;
  if (!data || data.minutes == null || data.minutes === 0) return null;

  return (
    <div className="bg-zinc-900 border border-white/10 rounded-[8px] p-3 shadow-xl min-w-[180px] max-w-[240px]">
      <p className="text-[11px] font-semibold text-zinc-400 mb-2">{data.dateLabel}</p>
      {data.activities && data.activities.length > 0 ? (
        <div className="space-y-1.5">
          {data.activities.map((act: ActivityDetail, i: number) => (
            <div key={i} className="flex items-center justify-between gap-3">
              <span className="text-xs text-zinc-200 truncate">{act.title}</span>
              <span className="text-[11px] text-zinc-500 shrink-0 tabular-nums">
                {formatMin(act.time)}
              </span>
            </div>
          ))}
          <div className="border-t border-white/10 pt-1.5 mt-1.5 flex items-center justify-between">
            <span className="text-[11px] text-zinc-500">Total</span>
            <span className={cn(
              "text-[11px] font-bold tabular-nums",
              data.minutes >= DAILY_GOAL_MIN ? "text-green-400" : "text-zinc-300"
            )}>
              {formatMin(data.totalMs)}
            </span>
          </div>
        </div>
      ) : (
        <p className="text-xs text-zinc-300">{formatMin(data.totalMs)} practiced</p>
      )}
    </div>
  );
};

const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const PracticeStatsWidget = ({
  userStats,
  reportList,
  className,
}: PracticeStatsWidgetProps) => {
  const today = new Date();

  const lastReportDate = userStats?.lastReportDate || "";
  const actualDayWithoutBreak = userStats?.actualDayWithoutBreak || 0;
  const userLastReportDate = new Date(lastReportDate);
  const didPracticeToday = checkIsPracticeToday(userLastReportDate);
  const isStreak = getUpdatedActualDayWithoutBreak(actualDayWithoutBreak, userLastReportDate, didPracticeToday);
  const dayWithoutBreak = isStreak === 1 && !didPracticeToday ? 0 : actualDayWithoutBreak;

  const weekStart = startOfWeek(today, { weekStartsOn: 1 });

  const weekDays = DAYS_OF_WEEK.map((label, index) => {
    const dayDate = addDays(weekStart, index);
    const dayReport = reportList.find((r) => isSameDay(new Date(r.date), dayDate));
    const timeMs = dayReport
      ? dayReport.totalTime ||
        dayReport.techniqueTime + dayReport.theoryTime + dayReport.hearingTime + dayReport.creativityTime
      : 0;
    const isToday = isSameDay(dayDate, today);
    const isFuture = dayDate > today;
    const isGoalMet = timeMs >= DAILY_GOAL_MS;
    return {
      label,
      dayDate,
      timeMs,
      isToday,
      isFuture,
      isGoalMet,
      activities: dayReport?.activities,
      dateLabel: isToday
        ? "Today"
        : dayDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
    };
  });

  const practicedDaysThisWeek = weekDays.filter((d) => d.timeMs > 0 && !d.isFuture).length;
  const maxMinutes = Math.max(DAILY_GOAL_MIN * 2, ...weekDays.map((d) => d.timeMs / 60000));

  const chartData = weekDays.map(({ label, timeMs, isFuture, isToday, isGoalMet, activities, dateLabel }) => ({
    day: label,
    minutes: isFuture && !isToday ? 0 : Math.round(timeMs / 60000),
    totalMs: timeMs,
    isGoalMet,
    isToday,
    isFuture,
    activities,
    dateLabel,
  }));

  return (
    <Card className={cn("flex flex-col border-0 bg-zinc-800/40 shadow-sm backdrop-blur-sm", className)}>
      <div className="flex flex-col flex-1 gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FaFire
              className={cn(
                "text-lg transition-all duration-500",
                dayWithoutBreak > 0
                  ? "text-orange-500 drop-shadow-[0_0_10px_rgba(249,115,22,0.6)]"
                  : "text-zinc-700"
              )}
            />
            <span className="text-[11px] font-semibold text-zinc-400">This week</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-zinc-500">
              <span className="text-white font-bold">{practicedDaysThisWeek}</span>/7 days
            </span>
            {dayWithoutBreak > 0 && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-[8px] bg-orange-500/10 border border-orange-500/20">
                <span className="text-sm font-black text-orange-400 tabular-nums">{dayWithoutBreak}</span>
                <span className="text-[10px] text-orange-400/70 font-semibold">streak</span>
              </div>
            )}
          </div>
        </div>

        {/* Chart */}
        <div className="flex-1 min-h-[130px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 6, right: 28, bottom: 0, left: 0 }} barCategoryGap="20%">
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                interval={0}
                height={38}
                tick={(tickProps) => {
                  const { x, y, payload, index } = tickProps;
                  const day = weekDays[index];
                  if (!day) return <g />;

                  const isPast = !day.isToday && !day.isFuture;
                  const showCheck = day.isGoalMet;
                  const showX = isPast && !day.isGoalMet;

                  const labelColor = day.isGoalMet
                    ? "#4ade80"
                    : day.isToday
                    ? "#e4e4e7"
                    : day.isFuture
                    ? "#3f3f46"
                    : "#71717a";

                  const cx = Number(x);
                  const labelY = Number(y) + 12;
                  const iconY = labelY + 14;

                  return (
                    <g>
                      <text
                        x={cx}
                        y={labelY}
                        textAnchor="middle"
                        fontSize={9}
                        fontWeight={700}
                        fill={labelColor}
                      >
                        {payload.value}
                      </text>
                      {showCheck && (
                        <path
                          d={`M ${cx - 4},${iconY} L ${cx - 1},${iconY + 3.5} L ${cx + 4},${iconY - 3}`}
                          fill="none"
                          stroke="#4ade80"
                          strokeWidth={1.8}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      )}
                      {showX && (
                        <g>
                          <line x1={cx - 3} y1={iconY - 3} x2={cx + 3} y2={iconY + 3} stroke="#ef4444" strokeOpacity={0.6} strokeWidth={1.6} strokeLinecap="round" />
                          <line x1={cx + 3} y1={iconY - 3} x2={cx - 3} y2={iconY + 3} stroke="#ef4444" strokeOpacity={0.6} strokeWidth={1.6} strokeLinecap="round" />
                        </g>
                      )}
                    </g>
                  );
                }}
              />

              <ReferenceLine
                y={DAILY_GOAL_MIN}
                stroke="rgba(255,255,255,0.18)"
                strokeDasharray="4 3"
                label={{
                  value: "15 min",
                  position: "right",
                  fill: "rgba(255,255,255,0.25)",
                  fontSize: 8,
                  fontWeight: 600,
                }}
              />

              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "rgba(255,255,255,0.04)" }}
              />

              <Bar
                dataKey="minutes"
                maxBarSize={36}
                isAnimationActive={false}
                background={{ fill: "rgba(255,255,255,0.03)", radius: 3 }}
                shape={(props: any) => {
                  const { x, y, width, height, payload } = props;
                  const isUnfulfilled = !payload.isGoalMet && !payload.isFuture && !payload.isToday;
                  
                  if (!width || !height) {
                    if (isUnfulfilled) {
                      return <rect x={x} y={y - 2} width={width || 36} height={2} fill="rgba(239, 68, 68, 0.3)" rx={1} ry={1} />;
                    }
                    return <g />;
                  }

                  let fill = "rgba(6,182,212,0.6)";
                  if (payload.isGoalMet) {
                    fill = "rgba(74,222,128,0.75)";
                  } else if (isUnfulfilled) {
                    fill = "rgba(239, 68, 68, 0.4)";
                  } else if (payload.minutes === 0) {
                    fill = "rgba(255,255,255,0.06)";
                  }

                  return <rect x={x} y={y} width={width} height={height} fill={fill} rx={3} ry={3} />;
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  );
};
