import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "assets/components/ui/tooltip";
import { cn } from "assets/lib/utils";
import {
  FIVE_DAY_MULTIPLER,
  FOUR_DAY_MULTIPLER,
  HABBITS_POINTS_VALUE,
  THREE_DAY_MULTIPLER,
  TIME_POINTS_VALUE,
  TWO_DAY_MULTIPLER,
} from "constants/ratingValue";
import { useTranslation } from "hooks/useTranslation";
import { Flame } from "lucide-react";
import type { ReactNode } from "react";
import { getDailyStreakMultiplier } from "utils/gameLogic";

// Everything below is derived from the live scoring constants, so the tooltip
// stays correct automatically if the point balance is ever changed again.
const MS_PER_HOUR = 3_600_000;
const BASE_POINTS_PER_HOUR = Math.round(TIME_POINTS_VALUE * MS_PER_HOUR);

const LADDER = [
  { label: "Day 1", mult: 0 },
  { label: "Day 2", mult: TWO_DAY_MULTIPLER },
  { label: "Day 3", mult: THREE_DAY_MULTIPLER },
  { label: "Day 4", mult: FOUR_DAY_MULTIPLER },
  { label: "Day 5+", mult: FIVE_DAY_MULTIPLER },
];

const fmtPts = (n: number) => (Number.isInteger(n) ? `${n}` : n.toFixed(1));

interface ScoreBreakdownTooltipProps {
  streak: number;
  /** Whether the player has rest days on, which adds the rule under the ladder. */
  restDays?: boolean;
  children: ReactNode;
}

export const ScoreBreakdownTooltip = ({
  streak,
  restDays = false,
  children,
}: ScoreBreakdownTooltipProps) => {
  const { t } = useTranslation("profile");
  const multiplier = getDailyStreakMultiplier(streak); // 0 / .2 / .3 / .4 / .5
  const totalMultiplier = 1 + multiplier;

  const pointsPerHour = Math.round(BASE_POINTS_PER_HOUR * totalMultiplier);
  const pointsPerHabit = HABBITS_POINTS_VALUE * totalMultiplier;

  const activeIndex = streak >= 5 ? 4 : streak >= 2 ? streak - 1 : 0;

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent
          side='bottom'
          className='w-[300px] p-3'
        >
          <div className='space-y-4'>
            {/* Header: streak + current multiplier */}
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-1.5'>
                <Flame size='1em'
                  className={cn(
                    streak > 0
                      ? "text-orange-600"
                      : "text-black/50"
                  )}
                />
                <span className='text-sm font-bold'>
                  {streak > 0 ? t("score_tooltip.streak", { count: streak }) : t("score_tooltip.no_streak")}
                </span>
              </div>
              <span className='rounded bg-orange-500/15 px-2 py-0.5 text-sm font-black tabular-nums text-orange-700'>
                ×{totalMultiplier.toFixed(1)}
              </span>
            </div>

            {/* What you earn right now */}
            <div className='space-y-2.5 rounded-lg bg-black/5 p-3'>
              <p className='text-xs font-semibold text-black/60'>
                {t("score_tooltip.earn_now")}
              </p>
              <div className='flex items-center justify-between text-xs'>
                <span className='text-black/70'>{t("score_tooltip.per_hour")}</span>
                <span className='flex items-center gap-1 font-bold tabular-nums'>
                  {pointsPerHour}
                  <img
                    src='/images/tokens/pick.png'
                    alt='points'
                    className='h-4 w-4 object-contain'
                  />
                </span>
              </div>
              <div className='flex items-center justify-between text-xs'>
                <span className='text-black/70'>{t("score_tooltip.per_habit")}</span>
                <span className='flex items-center gap-1 font-bold tabular-nums'>
                  {fmtPts(pointsPerHabit)}
                  <img
                    src='/images/tokens/pick.png'
                    alt='points'
                    className='h-4 w-4 object-contain'
                  />
                </span>
              </div>
            </div>

            {/* Multiplier ladder */}
            <div className='flex gap-1.5'>
              {LADDER.map((tier, index) => {
                const isActive = index === activeIndex;
                return (
                  <div
                    key={tier.label}
                    className={cn(
                      "flex-1 space-y-0.5 rounded px-1 py-1.5 text-center transition-colors",
                      isActive
                        ? "bg-orange-500/15"
                        : "bg-black/5"
                    )}
                  >
                    <div className='text-[8px] text-black/60'>
                      {t(`score_tooltip.ladder.${index}`, tier.label)}
                    </div>
                    <div
                      className={cn(
                        "text-[11px] font-bold tabular-nums",
                        isActive ? "text-orange-700" : "text-black/70"
                      )}
                    >
                      ×{(1 + tier.mult).toFixed(1)}
                    </div>
                  </div>
                );
              })}
            </div>

            {restDays && (
              <p className='text-xs text-black/60'>
                {t("score_tooltip.rest_day")}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
