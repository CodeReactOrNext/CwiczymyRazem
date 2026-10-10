import { format } from "date-fns";
import { useTranslation } from "hooks/useTranslation";
import { useDateFnsLocale } from "lib/i18n/dateLocale";
import { ArrowUp, Check } from "lucide-react";

import type { ExerciseGoal } from "../types/exerciseGoal.types";

interface GoalHistoryProps {
  goals: ExerciseGoal[];
  /** Exercises with an open goal — raising the bar there would make a second one. */
  busyExerciseIds: Set<string>;
  onRaise: (goal: ExerciseGoal) => void;
}

/** Reached goals, newest first. The latest one per exercise offers the next step up. */
export const GoalHistory = ({
  goals,
  busyExerciseIds,
  onRaise,
}: GoalHistoryProps) => {
  const { t } = useTranslation("goals");
  const dateLocale = useDateFnsLocale();

  const sorted = [...goals].sort(
    (a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0),
  );
  const latestPerExercise = new Set<string>();
  const raisable = new Set<string>();
  for (const goal of sorted) {
    if (latestPerExercise.has(goal.exerciseId)) continue;
    latestPerExercise.add(goal.exerciseId);
    if (!busyExerciseIds.has(goal.exerciseId)) raisable.add(goal.id);
  }

  return (
    <div className='space-y-1 rounded-lg bg-zinc-900/40 p-2 md:p-3'>
      {sorted.map((goal) => (
        <div
          key={goal.id}
          className='flex items-center gap-3 rounded-lg px-3 py-3'>
          <span className='flex h-8 w-8 shrink-0 items-center justify-center rounded bg-emerald-500/10 text-emerald-400'>
            <Check className='h-4 w-4' />
          </span>
          <div className='min-w-0 flex-1'>
            <p className='truncate text-sm font-medium text-zinc-100'>
              {goal.exerciseTitle}
            </p>
            {goal.completedAt && (
              <p className='mt-0.5 text-xs text-zinc-500'>
                {t("history.reached_on", {
                  date: format(goal.completedAt, "PP", { locale: dateLocale }),
                })}
              </p>
            )}
          </div>
          <span className='shrink-0 text-sm font-semibold tabular-nums text-zinc-200'>
            {goal.targetBpm} BPM
          </span>
          {raisable.has(goal.id) && (
            <button
              type='button'
              onClick={() => onRaise(goal)}
              className='flex shrink-0 items-center gap-1.5 rounded-lg bg-zinc-800 px-3 py-2 text-xs font-medium text-zinc-100 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 hover:bg-zinc-700'>
              <ArrowUp className='h-3.5 w-3.5' />
              <span className='hidden sm:inline'>{t("history.raise")}</span>
              <span className='sr-only sm:hidden'>{t("history.raise")}</span>
            </button>
          )}
        </div>
      ))}
    </div>
  );
};
