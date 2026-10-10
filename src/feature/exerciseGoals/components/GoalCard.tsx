import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "assets/components/ui/alert-dialog";
import { cn } from "assets/lib/utils";
import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import { useTranslation } from "hooks/useTranslation";
import { Play, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { useExerciseProgress } from "../hooks/useExerciseGoals";
import type { ExerciseGoal } from "../types/exerciseGoal.types";
import {
  GOAL_CLEAN_RUNS_REQUIRED,
  STRICTNESS_ACCURACY,
} from "../utils/goalRules";
import { GoalProgressDots } from "./GoalProgressDots";
import type { GoalChartMetric } from "./GoalRunsChart";
import { GoalRunsChart } from "./GoalRunsChart";

const CHART_METRICS: GoalChartMetric[] = ["tempo", "timing"];

interface GoalCardProps {
  uid: string;
  goal: ExerciseGoal;
  onDelete: (goalId: string) => Promise<void>;
}

/**
 * An open goal: the fastest tempo played so far against the goal's, the clean
 * runs counted, the runs that led here, and the way into goal mode.
 */
export const GoalCard = ({ uid, goal, onDelete }: GoalCardProps) => {
  const { t } = useTranslation("goals");
  const { runs, isLoading } = useExerciseProgress(
    uid,
    goal.exerciseId,
    goal.createdAt,
  );
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [metric, setMetric] = useState<GoalChartMetric>("tempo");

  const bestBpm = runs.length ? Math.max(...runs.map((run) => run.bpm)) : null;
  // The bar runs from the bottom of the exercise's own range to the goal, so a
  // first run near the range's floor reads as a start, not as nothing.
  const exerciseFloor =
    exercisesAgregat.find((exercise) => exercise.id === goal.exerciseId)
      ?.metronomeSpeed?.min ?? 0;
  const floorBpm = Math.min(
    exerciseFloor,
    bestBpm ?? exerciseFloor,
    goal.targetBpm - 1,
  );
  const tempoShare =
    bestBpm === null
      ? 0
      : Math.min(
          1,
          Math.max(0, (bestBpm - floorBpm) / (goal.targetBpm - floorBpm)),
        );
  const atTempo = bestBpm !== null && bestBpm >= goal.targetBpm;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(goal.id);
    } finally {
      setIsDeleting(false);
      setIsConfirmingDelete(false);
    }
  };

  return (
    <section className='grid gap-8 rounded-lg bg-zinc-900/40 p-5 md:p-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-10'>
      <div className='flex min-w-0 flex-col gap-6'>
        <div className='flex items-start justify-between gap-4'>
          <div className='min-w-0'>
            <h3 className='text-base font-semibold leading-snug text-zinc-100'>
              {goal.exerciseTitle}
            </h3>
            <p className='mt-1 text-sm text-zinc-400'>
              {t("card.rules", {
                accuracy: STRICTNESS_ACCURACY[goal.strictness],
                counting: t(`counting.${goal.counting}`),
              })}
            </p>
          </div>
          <button
            type='button'
            onClick={() => setIsConfirmingDelete(true)}
            aria-label={t("card.delete")}
            className='flex h-8 w-8 shrink-0 items-center justify-center rounded text-zinc-500 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-500 hover:bg-zinc-800 hover:text-zinc-200'>
            <Trash2 className='h-4 w-4' />
          </button>
        </div>

        <div className='space-y-3'>
          <p className='text-xs text-zinc-500'>{t("card.best_so_far")}</p>
          <p className='flex items-baseline gap-2 font-teko leading-none'>
            <span
              className={cn(
                "text-5xl font-bold tabular-nums",
                bestBpm === null ? "text-zinc-600" : "text-zinc-100",
              )}>
              {bestBpm ?? "—"}
            </span>
            <span className='text-2xl tabular-nums text-zinc-500'>
              / {goal.targetBpm} BPM
            </span>
          </p>
          <div
            className='h-2 overflow-hidden rounded-full bg-zinc-800'
            role='progressbar'
            aria-label={t("card.best_so_far")}
            aria-valuemin={floorBpm}
            aria-valuemax={goal.targetBpm}
            aria-valuenow={bestBpm ?? floorBpm}>
            <div
              className={cn(
                "h-full rounded-full",
                atTempo ? "bg-emerald-400" : "bg-zinc-300",
              )}
              style={{ width: `${Math.round(tempoShare * 100)}%` }}
            />
          </div>
          <p className='text-sm text-zinc-400'>
            {bestBpm === null
              ? t("card.no_tempo")
              : atTempo
                ? t("card.at_tempo")
                : t("card.to_go", { bpm: goal.targetBpm - bestBpm })}
          </p>
        </div>

        <div className='flex items-center gap-3'>
          <GoalProgressDots cleanRuns={goal.cleanRuns} />
          <p className='text-sm text-zinc-300'>
            {t("card.progress", {
              count: goal.cleanRuns,
              total: GOAL_CLEAN_RUNS_REQUIRED,
            })}
          </p>
        </div>

        <Link
          href={`/practice/goal/${goal.id}`}
          className='mt-auto flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-white px-6 text-sm font-semibold text-zinc-950 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 hover:bg-zinc-200 sm:w-auto sm:self-start'>
          <Play className='h-4 w-4 fill-current' />
          {t("card.start")}
        </Link>
      </div>

      {/* An empty chart earns its space beside the card on a wide screen; on a
          phone the card already says nothing has been played. */}
      <div
        className={cn(
          "min-w-0",
          !isLoading && runs.length === 0 && "hidden lg:block",
        )}>
        <div className='mb-4 flex justify-end'>
          <div
            role='tablist'
            aria-label={t("chart.metric_label")}
            className='flex gap-1 rounded-lg bg-zinc-800/50 p-1'>
            {CHART_METRICS.map((option) => (
              <button
                key={option}
                type='button'
                role='tab'
                aria-selected={metric === option}
                onClick={() => setMetric(option)}
                className={cn(
                  "rounded px-3 py-1.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400",
                  metric === option
                    ? "bg-zinc-700 font-semibold text-zinc-100"
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200",
                )}>
                {t(`chart.metric_${option}`)}
              </button>
            ))}
          </div>
        </div>
        {isLoading ? (
          <div className='h-56 w-full animate-pulse rounded-lg bg-zinc-800/30' />
        ) : (
          <GoalRunsChart
            runs={runs}
            targetBpm={goal.targetBpm}
            floorBpm={floorBpm}
            metric={metric}
          />
        )}
      </div>

      <AlertDialog
        open={isConfirmingDelete}
        onOpenChange={(open) => !isDeleting && setIsConfirmingDelete(open)}>
        <AlertDialogContent className='max-w-sm gap-6 border-0 bg-zinc-900 p-6'>
          <AlertDialogHeader className='space-y-2'>
            <AlertDialogTitle className='text-lg font-bold text-white'>
              {t("delete_confirm.title")}
            </AlertDialogTitle>
            <AlertDialogDescription className='text-sm text-zinc-400'>
              {t("delete_confirm.body")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className='gap-2 sm:space-x-0'>
            <AlertDialogCancel
              disabled={isDeleting}
              className='mt-0 border-0 bg-zinc-800 text-white hover:bg-zinc-700 hover:text-white sm:flex-1'>
              {t("delete_confirm.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void handleDelete();
              }}
              disabled={isDeleting}
              className='bg-zinc-100 text-zinc-950 hover:bg-white sm:flex-1'>
              {t("delete_confirm.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
};
