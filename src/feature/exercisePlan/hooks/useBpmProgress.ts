import { useCallback, useEffect, useState } from "react";
import { useAppSelector } from "store/hooks";
import { selectUserAuth } from "feature/user/store/userSlice";
import type { Exercise } from "../types/exercise.types";
import {
  getExerciseBpmProgress,
  toggleBpmStage,
} from "../services/bpmProgressService";
import { generateBpmStages } from "../utils/generateBpmStages";

interface UseBpmProgressReturn {
  bpmStages: number[];
  completedBpms: number[];
  isLoading: boolean;
  handleToggleBpm: (bpm: number) => Promise<void>;
}

export const useBpmProgress = (exercise: Exercise): UseBpmProgressReturn => {
  const userAuth = useAppSelector(selectUserAuth);
  const [completedBpms, setCompletedBpms] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const bpmStages = generateBpmStages(exercise.metronomeSpeed);

  useEffect(() => {
    if (!userAuth || !exercise.metronomeSpeed) return;

    let cancelled = false;
    setIsLoading(true);

    getExerciseBpmProgress(userAuth, exercise.id).then((data) => {
      if (!cancelled) {
        setCompletedBpms(data?.completedBpms || []);
        setIsLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [userAuth, exercise.id, exercise.metronomeSpeed]);

  const handleToggleBpm = useCallback(
    async (bpm: number) => {
      if (!userAuth || !exercise.metronomeSpeed) return;

      // Optimistic update
      setCompletedBpms((prev) => {
        const index = prev.indexOf(bpm);
        if (index > -1) {
          return prev.filter((b) => b !== bpm);
        }
        return [...prev, bpm].sort((a, b) => a - b);
      });

      try {
        const updatedBpms = await toggleBpmStage(
          userAuth,
          exercise.id,
          bpm,
          exercise.title,
          exercise.category
        );
        setCompletedBpms(updatedBpms);
      } catch {
        // Revert on failure
        const data = await getExerciseBpmProgress(userAuth, exercise.id);
        setCompletedBpms(data?.completedBpms || []);
      }
    },
    [userAuth, exercise.id, exercise.title, exercise.category, exercise.metronomeSpeed]
  );

  return {
    bpmStages,
    completedBpms,
    isLoading,
    handleToggleBpm,
  };
};
