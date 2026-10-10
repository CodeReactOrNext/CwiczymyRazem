import { selectUserAuth } from "feature/user/store/userSlice";
import { useTranslation } from "hooks/useTranslation";
import { useRouter } from "next/router";
import { toast } from "sonner";
import { useAppSelector } from "store/hooks";

import { useExerciseGoals } from "../hooks/useExerciseGoals";
import type { NewExerciseGoal } from "../types/exerciseGoal.types";
import { GoalsPanel } from "./GoalsPanel";

/**
 * The goals panel wired to the signed-in player's goals. A goal reached in
 * goal mode comes back here as ?completed=<goalId>, which opens the
 * raise-the-bar offer once.
 */
export const GoalsView = () => {
  const { t } = useTranslation("goals");
  const router = useRouter();
  const uid = useAppSelector(selectUserAuth);
  const { goals, isLoading, createGoal, isCreating, deleteGoal } =
    useExerciseGoals(uid);
  const completedId =
    typeof router.query.completed === "string" ? router.query.completed : null;

  const handleCreate = async (goal: NewExerciseGoal) => {
    try {
      await createGoal(goal);
      toast.success(t("toast.created"));
      return true;
    } catch {
      toast.error(t("toast.error"));
      return false;
    }
  };

  const handleDelete = async (goalId: string) => {
    try {
      await deleteGoal(goalId);
      toast.success(t("toast.deleted"));
    } catch {
      toast.error(t("toast.error"));
    }
  };

  return (
    <GoalsPanel
      uid={uid}
      goals={goals}
      isLoading={!uid || isLoading}
      isCreating={isCreating}
      onCreate={handleCreate}
      onDelete={handleDelete}
      completedId={completedId}
      onCompletedSeen={() =>
        void router.replace("/goals", undefined, { shallow: true })
      }
    />
  );
};
