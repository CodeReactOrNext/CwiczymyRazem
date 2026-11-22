import { cn } from "assets/lib/utils";
import { PRACTICE_CATEGORIES } from "feature/aiSummary/utils/milestoneLogic";
import type {
  MilestoneChartKind,
  MilestoneDay,
  MilestoneDayRule,
} from "feature/dashboard/utils/milestoneWeek";
import {
  dayMeetsRule,
  milestoneStreakDays,
} from "feature/dashboard/utils/milestoneWeek";
import { Check } from "lucide-react";
import type { ReactNode } from "react";

import {
  CHART_H,
  dayTrack,
  MilestoneDayLabels,
  milestoneDayTitle,
  MilestoneWeek,
} from "./MilestoneWeek";

interface ChartProps {
  days: MilestoneDay[];
  rule: MilestoneDayRule;
}

/** A running streak is tinted the app's streak orange, not the tier's own colour. */
const STREAK = "#fb923c";
const STREAK_TINT = "rgba(249,115,22,0.16)";
/** A day that covered all four categories — lifted, not coloured. */
const FULL_DAY = "rgba(255,255,255,0.09)";

/** The day cell every non-bar chart is built from. */
const Tile = ({
  day,
  rule,
  met,
  tint,
  joinNext = false,
  children,
}: {
  day: MilestoneDay;
  rule: MilestoneDayRule;
  met: boolean;
  /** Background for a day in the running streak or a full day; none = the plain track. */
  tint?: string;
  /** The run carries on into tomorrow — a band bridges the gap so the streak reads as one piece. */
  joinNext?: boolean;
  children?: ReactNode;
}) => (
  <div
    title={milestoneDayTitle(day, rule, met)}
    className='relative flex flex-1 flex-col items-center justify-center gap-[3px] rounded px-1'
    style={{
      height: CHART_H,
      backgroundColor: tint ?? dayTrack(day),
    }}>
    {joinNext && (
      <span
        aria-hidden
        className='absolute -right-1 top-1/2 h-3 w-1 -translate-y-1/2'
        style={{ backgroundColor: tint }}
      />
    )}
    {children}
  </div>
);

/**
 * The streak tiers' week: one tile a day, tinted along the run the player is
 * currently on. A cleared day carries the tick, a short one its minutes; a
 * missed one is left empty — the gap in the tint already shows the break.
 */
const StreakWeek = ({ days, rule }: ChartProps) => {
  const streak = milestoneStreakDays(days, rule);

  return (
    <div className='w-full'>
      <div className='flex gap-1'>
        {days.map((day, index) => {
          const met = !day.isFuture && dayMeetsRule(day, rule);

          return (
            <Tile
              key={day.date.toISOString()}
              day={day}
              rule={rule}
              met={met}
              tint={streak[index] ? STREAK_TINT : undefined}
              joinNext={streak[index] && !!streak[index + 1]}>
              {met ? (
                <Check
                  size={16}
                  strokeWidth={3}
                  style={{ color: streak[index] ? STREAK : "#a1a1aa" }}
                />
              ) : day.minutes > 0 ? (
                <span className='text-xs font-semibold tabular-nums text-zinc-400'>
                  {day.minutes}
                </span>
              ) : null}
            </Tile>
          );
        })}
      </div>

      <MilestoneDayLabels days={days} />
    </div>
  );
};

/** Which colour is which category — only the two charts that use them carry it. */
const CategoryLegend = () => (
  <div className='mt-2 flex flex-wrap gap-x-3 gap-y-1'>
    {PRACTICE_CATEGORIES.map((cat) => (
      <span
        key={cat.k}
        className='flex items-center gap-1 text-xs leading-none text-zinc-400'>
        <span
          className='h-1.5 w-1.5 rounded-full'
          style={{ backgroundColor: cat.color }}
        />
        {cat.label}
      </span>
    ))}
  </div>
);

/** One dot per practice category, lit once that category cleared the bar. */
const CategoryDots = ({
  day,
  rule,
}: {
  day: MilestoneDay;
  rule: MilestoneDayRule;
}) => (
  <div className='grid grid-cols-2 gap-[3px]'>
    {PRACTICE_CATEGORIES.map((cat) => {
      const met = day.categories[cat.k] >= rule.goalMin;
      return (
        <span
          key={cat.k}
          className='h-1.5 w-1.5 rounded-full transition-colors'
          style={{ backgroundColor: met ? cat.color : "#3f3f46" }}
        />
      );
    })}
  </div>
);

/**
 * The all-round tier's week: four dots a day saying which corners of practice
 * that day actually touched, so a full day and a lopsided one cannot look
 * alike the way two equally tall bars would.
 */
const CategoryWeek = ({ days, rule }: ChartProps) => (
  <div className='w-full'>
    <div className='flex gap-1'>
      {days.map((day) => {
        const met = !day.isFuture && dayMeetsRule(day, rule);
        return (
          <Tile
            key={day.date.toISOString()}
            day={day}
            rule={rule}
            met={met}
            tint={met ? FULL_DAY : undefined}>
            <CategoryDots day={day} rule={rule} />
          </Tile>
        );
      })}
    </div>

    <MilestoneDayLabels days={days} />
    <CategoryLegend />
  </div>
);

/**
 * The all-round streak tiers' week: the same four categories, but drawn as how
 * far each one got rather than whether it arrived — on goals this long, the
 * useful question is which category is about to break the run.
 */
const CategoryStreakWeek = ({ days, rule }: ChartProps) => {
  const streak = milestoneStreakDays(days, rule);

  return (
    <div className='w-full'>
      <div className='flex gap-1'>
        {days.map((day, index) => {
          const met = !day.isFuture && dayMeetsRule(day, rule);

          return (
            <Tile
              key={day.date.toISOString()}
              day={day}
              rule={rule}
              met={met}
              tint={streak[index] ? STREAK_TINT : undefined}
              joinNext={streak[index] && !!streak[index + 1]}>
              {PRACTICE_CATEGORIES.map((cat) => {
                const filled = Math.min(
                  day.categories[cat.k] / rule.goalMin,
                  1,
                );
                return (
                  <span
                    key={cat.k}
                    className='h-1 w-full overflow-hidden rounded-full bg-white/[0.06]'>
                    <span
                      className='block h-full rounded-full transition-all'
                      style={{
                        width: `${filled * 100}%`,
                        backgroundColor: cat.color,
                      }}
                    />
                  </span>
                );
              })}
            </Tile>
          );
        })}
      </div>

      <MilestoneDayLabels days={days} />
      <CategoryLegend />
    </div>
  );
};

/**
 * A tier's week, drawn the way the Milestones page draws that tier: bars under
 * a goal line for the plain-minutes goals, a tinted run of tiles for the
 * streaks, and the four categories for the all-round goals.
 *
 * A goal about covering four categories read as one stack of minutes was the
 * whole problem: every card carried the same chart, so nine different promises
 * looked like one repeated nine times.
 */
export const MilestoneChart = ({
  kind,
  className,
  ...chart
}: ChartProps & { kind: MilestoneChartKind; className?: string }) => (
  <div className={cn("w-full", className)}>
    {kind === "streak-simple" ? (
      <StreakWeek {...chart} />
    ) : kind === "week-cats" ? (
      <CategoryWeek {...chart} />
    ) : kind === "streak-cats" ? (
      <CategoryStreakWeek {...chart} />
    ) : (
      <MilestoneWeek days={chart.days} rule={chart.rule} />
    )}
  </div>
);
