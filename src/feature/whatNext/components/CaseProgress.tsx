import { cn } from "assets/lib/utils";
import { selectCurrentUserStats } from "feature/user/store/userSlice";
import { FEATURE_GOALS_PER_CASE } from "feature/whatNext/data/featureGoals";
import { useFeatureGoals } from "feature/whatNext/hooks/useFeatureGoals";
import { useNextMessage } from "feature/whatNext/hooks/useNextMessage";
import { pendingFeatureGoals } from "feature/whatNext/utils/featureGoalsView";
import { useAppSelector } from "store/hooks";

/**
 * How far to the next free case: one thick bar, the count on the right and
 * what is left on the left. Gone once the goals still open could not fill it
 * anyway, so it never asks for something the player cannot do.
 */
export const CaseProgress = ({ className }: { className?: string }) => {
  const { t } = useNextMessage();
  const lvl = useAppSelector(selectCurrentUserStats)?.lvl ?? 1;
  const { data } = useFeatureGoals();

  if (!data) return null;
  const { toNext, owed } = data.cases;
  // An earned case held back by the daily limit: the bar stays full until it is paid.
  const waiting = owed > 0;
  if (!waiting && pendingFeatureGoals(data.goals, lvl).length < toNext)
    return null;
  const filled = waiting
    ? FEATURE_GOALS_PER_CASE
    : FEATURE_GOALS_PER_CASE - toNext;
  const label = waiting
    ? t("discover.case_tomorrow")
    : t("discover.to_case", { count: toNext });

  return (
    <div className={cn("w-full max-w-sm", className)}>
      <div className='flex items-baseline justify-between gap-3 text-sm'>
        <span className='font-medium text-zinc-300'>{label}</span>
        <span className='font-bold tabular-nums text-amber-300'>
          {filled}/{FEATURE_GOALS_PER_CASE}
        </span>
      </div>
      <div
        className='mt-2 h-4 overflow-hidden rounded-full bg-zinc-800'
        role='progressbar'
        aria-valuemin={0}
        aria-valuemax={FEATURE_GOALS_PER_CASE}
        aria-valuenow={filled}
        aria-label={label}>
        <div
          className='h-full rounded-full bg-amber-400 px-2 pt-1 transition-[width] duration-500'
          style={{ width: `${(filled / FEATURE_GOALS_PER_CASE) * 100}%` }}>
          {/* The light catching the top of the bar. */}
          <div className='h-1 rounded-full bg-white/35' />
        </div>
      </div>
    </div>
  );
};
