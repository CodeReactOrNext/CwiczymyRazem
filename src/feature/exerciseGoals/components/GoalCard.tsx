import { Button, buttonVariants } from "assets/components/ui/button";
import { Skeleton } from "assets/components/ui/skeleton";
import { cn } from "assets/lib/utils";
import { ConfirmDialog } from "components/ConfirmDialog/ConfirmDialog";
import { SegmentedControl } from "components/SegmentedControl/SegmentedControl";
import { useTranslation } from "hooks/useTranslation";
import { Pencil, Play, Trash2 } from "lucide-react";
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
  onEdit: (goal: ExerciseGoal) => void;
  onDelete: (goalId: string) => Promise<void>;
}

const ICON_BUTTON = "text-zinc-400";

/**
 * An open goal: the path of milestones up to its tempo with the current one
 * marked, the clean runs counted there, the runs that led here, and the way
 * into goal mode.
 */
export const GoalCard = ({ uid, goal, onEdit, onDelete }: GoalCardProps) => {
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
    <section className='grid gap-8 rounded-lg bg-zinc-800/40 p-5 md:p-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-10'>
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
          <div className='flex shrink-0 gap-1'>
            <Button
              type='button'
              variant='ghost'
              size='icon-sm'
              onClick={() => onEdit(goal)}
              aria-label={t("card.edit")}
              className={ICON_BUTTON}>
              <Pencil />
            </Button>
            <Button
              type='button'
              variant='ghost'
              size='icon-sm'
              onClick={() => setIsConfirmingDelete(true)}
              aria-label={t("card.delete")}
              className={ICON_BUTTON}>
              <Trash2 />
            </Button>
          </div>
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
          className={cn(
            buttonVariants({ size: "lg" }),
            "mt-auto w-full sm:w-auto sm:self-start",
          )}>
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
          <SegmentedControl
            label={t("chart.metric_label")}
            selected={[metric]}
            onSelect={setMetric}
            options={CHART_METRICS.map((option) => ({
              value: option,
              label: t(`chart.metric_${option}`),
            }))}
          />
        </div>
        {isLoading ? (
          <Skeleton className='h-56 w-full rounded-lg' />
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

      <ConfirmDialog
        open={isConfirmingDelete}
        onOpenChange={setIsConfirmingDelete}
        title={t("delete_confirm.title")}
        description={t("delete_confirm.body")}
        cancelLabel={t("delete_confirm.cancel")}
        confirmLabel={t("delete_confirm.confirm")}
        onConfirm={handleDelete}
        destructive
        loading={isDeleting}
      />
    </section>
  );
};
