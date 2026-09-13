import { cn } from "assets/lib/utils";
import type {
  MilestoneDay,
  MilestoneDayRule,
} from "feature/dashboard/utils/milestoneWeek";
import { dayMeetsRule } from "feature/dashboard/utils/milestoneWeek";

/** Every milestone chart is this tall, so a row of cards lines up. */
export const CHART_H = 44;
const GREEN = "#4ade80";
const CYAN = "rgb(6,182,212)";

/**
 * What one day says when pointed at. Shared by all four charts so hovering a
 * Monday means the same thing whichever tier's card it sits on.
 */
export const milestoneDayTitle = (
  day: MilestoneDay,
  rule: MilestoneDayRule,
  met: boolean,
): string => {
  const when = day.date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
  if (day.isFuture) return `${when} — still to come`;
  if (met) return `${when} — goal met`;
  if (rule.kind === "allCategories") {
    const { tech, theory, hearing, creat } = day.categories;
    return `${when} — ${tech}/${theory}/${hearing}/${creat} min across the four categories`;
  }
  return day.minutes > 0
    ? `${when} — ${day.minutes} min, short of ${rule.goalMin}`
    : `${when} — nothing logged`;
};

/** The weekday axis under a chart: M T W T F S S, today picked out. */
export const MilestoneDayLabels = ({ days }: { days: MilestoneDay[] }) => (
  <div className='mt-1 flex gap-1'>
    {days.map((day) => (
      <span
        key={day.date.toISOString()}
        className={cn(
          "flex-1 text-center text-[10px] font-semibold leading-none",
          day.isToday
            ? "text-zinc-200"
            : day.isFuture
              ? "text-zinc-700"
              : "text-zinc-500",
        )}>
        {day.label}
      </span>
    ))}
  </div>
);

/**
 * The week as seven bars, the same read-out the Milestones page puts under a
 * minutes goal: how long each day was, a dashed line where the goal sits, and
 * the days that cleared it in green.
 *
 * Shrunk to fit a card rather than a page — no minute labels above the bars and
 * no tick marks below, because the ring on the tier's disc already carries the
 * count and the card has one line of room, not six.
 */
export const MilestoneWeek = ({
  days,
  rule,
  className,
}: {
  days: MilestoneDay[];
  rule: MilestoneDayRule;
  className?: string;
}) => {
  // Against twice the goal, so a goal line always sits mid-chart on a quiet
  // week instead of hugging the top and reading as unreachable.
  const peak = Math.max(rule.goalMin * 2, ...days.map((day) => day.minutes));
  const goalOffset = (rule.goalMin / peak) * CHART_H;

  return (
    <div className={cn("w-full", className)}>
      <div className='relative' style={{ height: CHART_H }}>
        <div
          aria-hidden
          className='pointer-events-none absolute inset-x-0 border-t border-dashed border-white/20'
          style={{ bottom: goalOffset }}
        />
        <div className='flex h-full items-end gap-1'>
          {days.map((day) => {
            const met = !day.isFuture && dayMeetsRule(day, rule);
            const missed = !met && !day.isFuture && !day.isToday;
            const height = day.minutes
              ? Math.max((day.minutes / peak) * CHART_H, 4)
              : missed
                ? 2
                : 0;
            const color = met
              ? GREEN
              : day.minutes > 0
                ? CYAN
                : missed
                  ? "rgba(239,68,68,0.35)"
                  : "transparent";

            return (
              <div
                key={day.date.toISOString()}
                title={milestoneDayTitle(day, rule, met)}
                className='flex h-full flex-1 items-end rounded-sm bg-white/[0.03]'>
                <div
                  className='w-full rounded-sm transition-all'
                  style={{ height, backgroundColor: color }}
                />
              </div>
            );
          })}
        </div>
      </div>

      <MilestoneDayLabels days={days} />
    </div>
  );
};
