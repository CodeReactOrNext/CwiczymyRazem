import { Button } from "assets/components/ui/button";
import { useTranslation } from "hooks/useTranslation";
import { Plus, Target } from "lucide-react";
import { useMemo, useState } from "react";

import type {
  ExerciseGoal,
  NewExerciseGoal,
} from "../types/exerciseGoal.types";
import { raisedTargetBpm } from "../utils/goalRules";
import { CreateGoalDialog } from "./CreateGoalDialog";
import { GoalCard } from "./GoalCard";
import { GoalHistory } from "./GoalHistory";

type DialogState =
  | { mode: "new" }
  | { mode: "raise"; from: ExerciseGoal }
  | null;

interface GoalsPanelProps {
  uid: string | null;
  goals: ExerciseGoal[];
  isLoading: boolean;
  isCreating: boolean;
  /** Resolves true once the goal is saved — the dialog closes on that. */
  onCreate: (goal: NewExerciseGoal) => Promise<boolean>;
  onDelete: (goalId: string) => Promise<void>;
  /** A goal just reached in goal mode: offers to raise the bar on it, once. */
  completedId: string | null;
  onCompletedSeen: () => void;
}

/** The open goals with their charts, the reached ones below, and the create/raise dialog. */
export const GoalsPanel = ({
  uid,
  goals,
  isLoading,
  isCreating,
  onCreate,
  onDelete,
  completedId,
  onCompletedSeen,
}: GoalsPanelProps) => {
  const { t } = useTranslation("goals");
  const [dialog, setDialog] = useState<DialogState>(null);
  const [dismissedCompletedId, setDismissedCompletedId] = useState<
    string | null
  >(null);

  const activeGoals = goals.filter((goal) => goal.status === "active");
  const reachedGoals = goals.filter((goal) => goal.status === "completed");
  const busyExerciseIds = useMemo(
    () =>
      new Set(
        goals
          .filter((goal) => goal.status === "active")
          .map((goal) => goal.exerciseId),
      ),
    [goals],
  );

  const justReached =
    completedId && completedId !== dismissedCompletedId
      ? reachedGoals.find(
          (goal) =>
            goal.id === completedId && !busyExerciseIds.has(goal.exerciseId),
        )
      : undefined;
  const raiseFrom = dialog
    ? dialog.mode === "raise"
      ? dialog.from
      : undefined
    : justReached;
  const isDialogOpen = dialog !== null || !!justReached;

  const closeDialog = () => {
    setDialog(null);
    if (completedId) {
      setDismissedCompletedId(completedId);
      onCompletedSeen();
    }
  };

  const handleCreate = async (goal: NewExerciseGoal) => {
    if (await onCreate(goal)) closeDialog();
  };

  if (!uid || isLoading) {
    return (
      <div className='space-y-6 px-3 py-6 md:px-6 md:py-8 lg:px-8'>
        <div className='h-72 animate-pulse rounded-lg bg-zinc-900/40' />
      </div>
    );
  }

  return (
    <div className='space-y-12 px-3 py-6 md:px-6 md:py-8 lg:px-8'>
      {goals.length === 0 ? (
        <div className='flex flex-col items-center justify-center rounded-lg bg-zinc-900/40 px-6 py-20 text-center'>
          <div className='mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10'>
            <Target className='h-5 w-5 text-emerald-400' />
          </div>
          <p className='text-base font-semibold text-zinc-100'>
            {t("empty.title")}
          </p>
          <p className='mt-2 max-w-md text-sm text-zinc-400'>
            {t("empty.body")}
          </p>
          <Button
            onClick={() => setDialog({ mode: "new" })}
            className='mt-8 h-11 rounded-lg bg-white px-6 font-bold text-zinc-950 hover:bg-zinc-200'>
            <Plus className='h-4 w-4' />
            {t("empty.cta")}
          </Button>
        </div>
      ) : (
        <>
          <section className='space-y-6'>
            <div className='flex items-center justify-between gap-4'>
              <h2 className='text-sm font-medium text-zinc-100'>
                {t("active_title")}{" "}
                <span className='ml-1 text-zinc-500'>{activeGoals.length}</span>
              </h2>
              <Button
                onClick={() => setDialog({ mode: "new" })}
                className='h-9 rounded-lg bg-zinc-800 px-4 text-sm text-zinc-100 hover:bg-zinc-700'>
                <Plus className='h-4 w-4' />
                {t("page.new_goal")}
              </Button>
            </div>
            {activeGoals.length ? (
              <div className='grid gap-6'>
                {activeGoals.map((goal) => (
                  <GoalCard
                    key={goal.id}
                    uid={uid}
                    goal={goal}
                    onDelete={onDelete}
                  />
                ))}
              </div>
            ) : (
              <p className='rounded-lg bg-zinc-900/40 px-5 py-6 text-sm text-zinc-400'>
                {t("no_active")}
              </p>
            )}
          </section>

          {reachedGoals.length > 0 && (
            <section className='space-y-6'>
              <h2 className='text-sm font-medium text-zinc-100'>
                {t("history_title")}{" "}
                <span className='ml-1 text-zinc-500'>
                  {reachedGoals.length}
                </span>
              </h2>
              <GoalHistory
                goals={reachedGoals}
                busyExerciseIds={busyExerciseIds}
                onRaise={(goal) => setDialog({ mode: "raise", from: goal })}
              />
            </section>
          )}
        </>
      )}

      {isDialogOpen && (
        <CreateGoalDialog
          key={raiseFrom?.id ?? "new"}
          onClose={closeDialog}
          onCreate={handleCreate}
          busyExerciseIds={busyExerciseIds}
          isSaving={isCreating}
          {...(raiseFrom
            ? {
                initialExerciseId: raiseFrom.exerciseId,
                initialBpm: raisedTargetBpm(raiseFrom.targetBpm),
                initialStrictness: raiseFrom.strictness,
                initialCounting: raiseFrom.counting,
                title:
                  raiseFrom.id === justReached?.id
                    ? t("create.reached_title")
                    : t("create.raise_title"),
                description: t("create.raise_description", {
                  exercise: raiseFrom.exerciseTitle,
                  bpm: raiseFrom.targetBpm,
                }),
              }
            : {})}
        />
      )}
    </div>
  );
};
