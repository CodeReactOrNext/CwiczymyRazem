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
import { useTranslation } from "hooks/useTranslation";
import { Play, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { useExerciseProgress } from "../hooks/useExerciseGoals";
import type { ExerciseGoal } from "../types/exerciseGoal.types";
import {
  GOAL_CLEAN_RUNS_REQUIRED,
  goalStages,
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
 * An open goal: the path of milestones up to its tempo with the current one
 * marked, the clean runs counted there, the runs that led here, and the way
 * into goal mode.
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

  const stages = goalStages(goal);
  const stageIndex = Math.max(
    0,
    stages.findIndex((bpm) => bpm >= goal.stageBpm),
  );
  // The chart starts at the path's first milestone when nothing has been played.
  const floorBpm = Math.min(goal.startBpm, goal.targetBpm - 1);

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

        <div className='space-y-4'>
          <p className='text-xs text-zinc-500'>
            {t("card.stage_of", {
              index: stageIndex + 1,
              total: stages.length,
            })}
          </p>
          <p className='flex items-baseline gap-2 font-teko leading-none'>
            <span className='text-5xl font-bold tabular-nums text-zinc-100'>
              {goal.stageBpm}
            </span>
            <span className='text-2xl tabular-nums text-zinc-500'>
              / {goal.targetBpm} BPM
            </span>
          </p>
          {stages.length > 1 && (
            <div>
              <ol className='flex gap-1' aria-label={t("card.path_label")}>
                {stages.map((bpm, index) => (
                  <li
                    key={bpm}
                    title={`${bpm} BPM`}
                    className={cn(
                      "h-2 flex-1 rounded-full",
                      index < stageIndex
                        ? "bg-emerald-400"
                        : index === stageIndex
                          ? "bg-zinc-300"
                          : "bg-zinc-800",
                    )}>
                    <span className='sr-only'>
                      {index < stageIndex
                        ? t("card.stage_done", { bpm })
                        : index === stageIndex
                          ? t("card.stage_current", { bpm })
                          : `${bpm} BPM`}
                    </span>
                  </li>
                ))}
              </ol>
              <div className='mt-2 flex justify-between text-xs tabular-nums text-zinc-500'>
                <span>{goal.startBpm}</span>
                <span>{goal.targetBpm}</span>
              </div>
            </div>
          )}
        </div>

        <div className='flex items-center gap-3'>
          <GoalProgressDots cleanRuns={goal.cleanRuns} />
          <p className='text-sm text-zinc-300'>
            {t("card.progress_at", {
              count: goal.cleanRuns,
              total: GOAL_CLEAN_RUNS_REQUIRED,
              bpm: goal.stageBpm,
            })}
          </p>
        </div>

        <Link
          href={`/practice/goal/${goal.id}`}
          className='mt-auto flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-white px-6 text-sm font-semibold text-zinc-950 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 hover:bg-zinc-200 sm:w-auto sm:self-start'>
          <Play className='h-4 w-4 fill-current' />
          {t("card.start_at", { bpm: goal.stageBpm })}
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
            stageBpm={goal.stageBpm}
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
