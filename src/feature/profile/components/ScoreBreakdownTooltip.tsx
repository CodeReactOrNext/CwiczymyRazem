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
import type { ReactNode } from "react";
import { FaFire } from "react-icons/fa";
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
  children: ReactNode;
}

export const ScoreBreakdownTooltip = ({
  streak,
  children,
}: ScoreBreakdownTooltipProps) => {
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
          className='w-[300px] border-0 bg-zinc-900 p-0 text-zinc-100 shadow-2xl'
        >
          <div className='space-y-4 p-4'>
            {/* Header: streak + current multiplier */}
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-1.5'>
                <FaFire
                  className={cn(
                    streak > 0
                      ? "text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.6)]"
                      : "text-zinc-500"
                  )}
                />
                <span className='text-sm font-bold text-white'>
                  {streak > 0 ? `${streak}-day streak` : "No streak yet"}
                </span>
              </div>
              <span className='rounded-md bg-orange-500/20 px-2 py-0.5 text-sm font-black tabular-nums text-orange-300'>
                ×{totalMultiplier.toFixed(1)}
              </span>
            </div>

            {/* What you earn right now */}
            <div className='space-y-2.5 rounded-lg bg-white/5 p-3'>
              <p className='text-[10px] font-semibold tracking-wider text-zinc-400'>
                You earn right now
              </p>
              <div className='flex items-center justify-between text-xs'>
                <span className='text-zinc-300'>Per hour of practice</span>
                <span className='flex items-center gap-1 font-bold tabular-nums text-white'>
                  {pointsPerHour}
                  <img
                    src='/images/points.png'
                    alt='points'
                    className='h-4 w-4 object-contain'
                  />
                </span>
              </div>
              <div className='flex items-center justify-between text-xs'>
                <span className='text-zinc-300'>Per habit ticked</span>
                <span className='flex items-center gap-1 font-bold tabular-nums text-white'>
                  {fmtPts(pointsPerHabit)}
                  <img
                    src='/images/points.png'
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
                      "flex-1 space-y-0.5 rounded-md px-1 py-1.5 text-center transition-colors",
                      isActive
                        ? "bg-orange-500/25 ring-1 ring-orange-400/60"
                        : "bg-white/5"
                    )}
                  >
                    <div className='text-[8px] tracking-wide text-zinc-400'>
                      {tier.label}
                    </div>
                    <div
                      className={cn(
                        "text-[11px] font-bold tabular-nums",
                        isActive ? "text-orange-300" : "text-zinc-300"
                      )}
                    >
                      ×{(1 + tier.mult).toFixed(1)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
