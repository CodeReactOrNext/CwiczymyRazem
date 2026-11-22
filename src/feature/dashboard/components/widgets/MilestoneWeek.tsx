import { cn } from "assets/lib/utils";
import type {
  MilestoneDay,
  MilestoneDayRule,
} from "feature/dashboard/utils/milestoneWeek";
import { dayMeetsRule } from "feature/dashboard/utils/milestoneWeek";

/** Every milestone chart is this tall, so a row of cards lines up. */
export const CHART_H = 44;
/** A day that met the goal — the app's success emerald. */
const MET = "#10b981";
/** A day with some practice that fell short — neutral, not an accent. */
const SHORT = "#71717a";

/** The empty track behind a day: brighter for today, fainter for days to come. */
export const dayTrack = (day: Pick<MilestoneDay, "isToday" | "isFuture">) =>
  day.isToday
    ? "rgba(255,255,255,0.07)"
    : day.isFuture
      ? "rgba(255,255,255,0.02)"
      : "rgba(255,255,255,0.035)";

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
  <div className='mt-1.5 flex gap-1'>
    {days.map((day) => (
      <span
        key={day.date.toISOString()}
        className={cn(
          "flex-1 text-center text-xs font-medium leading-none",
          day.isToday
            ? "text-zinc-50"
            : day.isFuture
              ? "text-zinc-600"
              : "text-zinc-400",
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
        {/* The goal as a faint solid rule, not a dashed border. */}
        <div
          aria-hidden
          data-goal-line
          className='pointer-events-none absolute inset-x-0 z-10 h-0.5 rounded-full bg-zinc-400/25'
          style={{ bottom: goalOffset - 1 }}
        />
        <div className='flex h-full items-end gap-1'>
          {days.map((day) => {
            const met = !day.isFuture && dayMeetsRule(day, rule);
            // A day with nothing logged stays an empty track — no red stub.
            const height = day.minutes
              ? Math.max((day.minutes / peak) * CHART_H, 4)
              : 0;

            return (
              <div
                key={day.date.toISOString()}
                title={milestoneDayTitle(day, rule, met)}
                className='flex h-full flex-1 items-end rounded'
                style={{ backgroundColor: dayTrack(day) }}>
                <div
                  className='w-full rounded-b-sm rounded-t transition-all'
                  style={{ height, backgroundColor: met ? MET : SHORT }}
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
