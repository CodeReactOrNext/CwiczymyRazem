import { cn } from "assets/lib/utils";
import { useTranslation } from "hooks/useTranslation";
import { Check } from "lucide-react";

export interface StreakDay {
  label: string;
  practised: boolean;
  isToday: boolean;
}

interface StreakWeekProps {
  streak: number;
  week: StreakDay[];
  bonusPct: number;
}

/** The streak and the week that made it, on one row. */
export const StreakWeek = ({ streak, week, bonusPct }: StreakWeekProps) => {
  const { t } = useTranslation("session_summary");
  return (
    <div className='flex w-full flex-col items-center gap-5 rounded-lg bg-zinc-800/40 px-5 py-5 sm:flex-row sm:justify-between sm:gap-8 sm:px-7 shortwide:w-auto shortwide:flex-none shortwide:flex-row shortwide:gap-4 shortwide:px-4 shortwide:py-3'>
      <div className='flex items-center gap-4 shortwide:gap-2'>
        <img src='/images/tokens/flame.png' alt='' className='h-14 w-14 object-contain shortwide:h-9 shortwide:w-9' />
        <span className='font-teko text-6xl font-semibold leading-[0.85] tabular-nums text-orange-400 shortwide:text-5xl'>{streak}</span>
        <span className='whitespace-nowrap text-left'>
          <span className='block text-sm font-medium text-zinc-300'>{t("days_in_a_row", { count: streak })}</span>
          {bonusPct > 0 && (
            <span className='block text-sm font-bold text-orange-400'>{t("streak_bonus_points", { pct: bonusPct })}</span>
          )}
        </span>
      </div>

      <ol className='flex gap-2 sm:gap-2.5 shortwide:gap-1'>
        {week.map((day, i) => (
          <li key={i} className='flex w-9 flex-col items-center gap-2 sm:w-10 shortwide:w-7 shortwide:gap-1'>
            <span
              className={cn(
                "flex aspect-square w-full items-center justify-center rounded-full",
                day.practised ? "bg-orange-500" : "bg-zinc-700/50",
              )}>
              {day.practised && <Check className='h-5 w-5 text-white shortwide:h-4 shortwide:w-4' strokeWidth={3} aria-hidden />}
            </span>
            <span className={cn("text-xs", day.isToday ? "font-bold text-zinc-100" : "font-medium text-zinc-400")}>
              {day.isToday ? t("today") : day.label.slice(0, 1)}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
};
