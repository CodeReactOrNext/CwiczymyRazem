import { Button } from "assets/components/ui/button";
import { Skeleton } from "assets/components/ui/skeleton";
import { cn } from "assets/lib/utils";
import { EmptyState } from "components/EmptyState/EmptyState";
import { PAGE_CONTENT } from "components/PageShell/PageShell";
import { SectionHeader } from "components/SectionHeader/SectionHeader";
import { useTranslation } from "hooks/useTranslation";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";

import type {
  ExerciseGoal,
  GoalEdit,
  NewExerciseGoal,
} from "../types/exerciseGoal.types";
import { raisedTargetBpm } from "../utils/goalRules";
import { CreateGoalDialog } from "./CreateGoalDialog";
import { GoalCard } from "./GoalCard";
import { GoalHistory } from "./GoalHistory";

type DialogState =
  | { mode: "new" }
  | { mode: "raise"; from: ExerciseGoal }
  | { mode: "edit"; goal: ExerciseGoal }
  | null;

interface GoalsPanelProps {
  uid: string | null;
  goals: ExerciseGoal[];
  isLoading: boolean;
  isCreating: boolean;
  /** Resolves true once the goal is saved — the dialog closes on that. */
  onCreate: (goal: NewExerciseGoal) => Promise<boolean>;
  isUpdating: boolean;
  /** Resolves true once the edit is saved — the dialog closes on that. */
  onUpdate: (goalId: string, edit: GoalEdit) => Promise<boolean>;
  onDelete: (goalId: string) => Promise<void>;
  /** A goal just reached in goal mode: offers to raise the bar on it, once. */
  completedId: string | null;
  onCompletedSeen: () => void;
}

/** The open goals with their charts, the reached ones below, and the create/raise/edit dialog. */
export const GoalsPanel = ({
  uid,
  goals,
  isLoading,
  isCreating,
  onCreate,
  isUpdating,
  onUpdate,
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
  const editing = dialog?.mode === "edit" ? dialog.goal : undefined;
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

  const handleUpdate = async (
    goalId: string,
    { startBpm, targetBpm, stepBpm, strictness, counting }: NewExerciseGoal,
  ) => {
    const edit = { startBpm, targetBpm, stepBpm, strictness, counting };
    if (await onUpdate(goalId, edit)) closeDialog();
  };

  if (!uid || isLoading) {
    return (
      <div
        className={cn("space-y-6", PAGE_CONTENT)}
        aria-busy='true'>
        <div className='flex items-center justify-between gap-4'>
          <Skeleton className='h-4 w-28' />
          <Skeleton className='h-9 w-32 rounded-lg' />
        </div>
        <Skeleton variant='block' className='h-72' />
        <Skeleton variant='block' className='h-72' />
      </div>
    );
  }

  return (
    <div className={cn("space-y-12", PAGE_CONTENT)}>
      {goals.length === 0 ? (
        // No goals: Kostek looks around for one to aim at.
        <EmptyState
          mood='lookAround'
          title={t("empty.title")}
          description={t("empty.body")}
          action={
            <Button onClick={() => setDialog({ mode: "new" })}>
              <Plus />
              {t("empty.cta")}
            </Button>
          }
        />
      ) : (
        <>
          <section className='space-y-6'>
            <div className='flex items-center justify-between gap-4'>
              <SectionHeader
                title={t("active_title")}
                count={activeGoals.length}
                className='mb-0'
              />
              <Button
                variant='secondary'
                onClick={() => setDialog({ mode: "new" })}>
                <Plus />
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
                    onEdit={(edited) =>
                      setDialog({ mode: "edit", goal: edited })
                    }
                    onDelete={onDelete}
                  />
                ))}
              </div>
            ) : (
              <p className='rounded-lg bg-zinc-800/40 px-5 py-6 text-sm text-zinc-400'>
                {t("no_active")}
              </p>
            )}
          </section>

          {reachedGoals.length > 0 && (
            <section className='space-y-6'>
              <SectionHeader
                title={t("history_title")}
                count={reachedGoals.length}
                className='mb-0'
              />
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
          key={editing ? `edit-${editing.id}` : (raiseFrom?.id ?? "new")}
          uid={uid}
          onClose={closeDialog}
          onCreate={
            editing ? (goal) => handleUpdate(editing.id, goal) : handleCreate
          }
          busyExerciseIds={busyExerciseIds}
          isSaving={editing ? isUpdating : isCreating}
          {...(editing
            ? {
                editing,
                initialExerciseId: editing.exerciseId,
                initialStartBpm: editing.startBpm,
                initialBpm: editing.targetBpm,
                initialStrictness: editing.strictness,
                initialCounting: editing.counting,
                title: t("edit.title"),
                description: t("edit.description", {
                  exercise: editing.exerciseTitle,
                }),
              }
            : raiseFrom
              ? {
                  initialExerciseId: raiseFrom.exerciseId,
                  // The old goal is already played clean — the path picks up
                  // one step past it.
                  initialStartBpm: Math.min(
                    raiseFrom.targetBpm + 5,
                    raisedTargetBpm(raiseFrom.targetBpm),
                  ),
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
