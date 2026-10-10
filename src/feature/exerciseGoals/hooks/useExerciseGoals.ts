import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createExerciseGoal,
  deleteExerciseGoal,
  getExerciseGoals,
  getExerciseHistory,
  getExerciseRuns,
} from "../services/exerciseGoals.service";
import type {
  ExerciseGoal,
  ExerciseRun,
  NewExerciseGoal,
} from "../types/exerciseGoal.types";

export const exerciseGoalsKey = (uid: string | null) =>
  ["exercise-goals", uid] as const;
export const exerciseRunsKey = (uid: string | null, exerciseId: string) =>
  ["exercise-runs", uid, exerciseId] as const;
export const exerciseHistoryKey = (uid: string | null, exerciseId: string) =>
  ["exercise-history", uid, exerciseId] as const;

/** The player's goals, open and reached, with create/delete that refresh the list. */
export const useExerciseGoals = (uid: string | null) => {
  const queryClient = useQueryClient();

  const goalsQuery = useQuery({
    queryKey: exerciseGoalsKey(uid),
    queryFn: () => getExerciseGoals(uid!),
    enabled: !!uid,
  });

  const createMutation = useMutation({
    mutationFn: (goal: NewExerciseGoal) => createExerciseGoal(uid!, goal),
    onSuccess: (created) => {
      queryClient.setQueryData<ExerciseGoal[]>(
        exerciseGoalsKey(uid),
        (goals = []) =>
          goals.some((goal) => goal.id === created.id)
            ? goals
            : [created, ...goals],
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (goalId: string) => deleteExerciseGoal(uid!, goalId),
    onSuccess: (_, goalId) => {
      queryClient.setQueryData<ExerciseGoal[]>(
        exerciseGoalsKey(uid),
        (goals = []) => goals.filter((goal) => goal.id !== goalId),
      );
    },
  });

  return {
    goals: goalsQuery.data ?? [],
    isLoading: goalsQuery.isLoading,
    createGoal: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    deleteGoal: deleteMutation.mutateAsync,
  };
};

/**
 * Everything the goal chart draws for one exercise: the runs tracked since the
 * exercise first had a goal, and before them the scored sessions the activity
 * log remembers — so a fresh goal opens on the climb that led to it.
 */
export const useExerciseProgress = (
  uid: string | null,
  exerciseId: string,
  goalCreatedAt: number,
) => {
  const runsQuery = useQuery({
    queryKey: exerciseRunsKey(uid, exerciseId),
    queryFn: () => getExerciseRuns(uid!, exerciseId),
    enabled: !!uid,
  });
  const tracked = runsQuery.data;
  // History stops where tracking starts, so no session is drawn twice.
  const trackedFrom = tracked?.length
    ? Math.min(tracked[0].createdAt, goalCreatedAt)
    : goalCreatedAt;
  const historyQuery = useQuery({
    queryKey: exerciseHistoryKey(uid, exerciseId),
    queryFn: () => getExerciseHistory(uid!, exerciseId, trackedFrom),
    enabled: !!uid && !!tracked,
    staleTime: 10 * 60 * 1000,
  });

  const runs: ExerciseRun[] = [
    ...(historyQuery.data ?? []),
    ...(tracked ?? []),
  ];
  return { runs, isLoading: runsQuery.isLoading || historyQuery.isLoading };
};
