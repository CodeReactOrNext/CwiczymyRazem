import roadmaps from "data/roadmaps";
import { firebaseGetAllUserProgress } from "feature/aiCoach/services/userProgress.service";
import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import { getAllBpmProgress } from "feature/exercisePlan/services/bpmProgressService";
import { hasExerciseProgress } from "feature/exercisePlan/utils/hasExerciseProgress";
import { journeyModules } from "feature/journey/data/journeyModules";
import { firebaseGetJourneyProgress } from "feature/journey/services/journey.service";
import type { ModeProgressSummary } from "feature/practice/utils/modeProgress";
import {
  summarizeCount,
  summarizeJourney,
  summarizeRoadmaps,
} from "feature/practice/utils/modeProgress";
import { computeNodeStatuses } from "feature/scaleTree/services/scaleTree.service";
import { useEffect, useState } from "react";

export type { ModeProgressSummary };

interface PracticeModeProgress {
  learningPath?: ModeProgressSummary;
  roadmaps?: ModeProgressSummary;
  scaleMap?: ModeProgressSummary;
  skills?: ModeProgressSummary;
}

/** Lightweight progress summaries for the Practice mode-selector cards — each feature keeps its own detailed progress model, this only says where the player stands. */
export function usePracticeModeProgress(userId: string | null | undefined) {
  const [progress, setProgress] = useState<PracticeModeProgress>({});

  useEffect(() => {
    if (!userId) return undefined;
    let cancelled = false;

    firebaseGetJourneyProgress(userId)
      .then((doc) => {
        if (cancelled) return;
        setProgress((p) => ({ ...p, learningPath: summarizeJourney(journeyModules, doc) }));
      })
      .catch(() => {});

    getAllBpmProgress(userId)
      .then((bpmProgress) => {
        if (cancelled) return;

        const bpmMap = new Map<string, number[]>();
        bpmProgress.forEach((data, exerciseId) => bpmMap.set(exerciseId, data.completedBpms ?? []));
        const statuses = computeNodeStatuses(bpmMap);
        const scaleMapDone = Object.values(statuses).filter((s) => s === "completed").length;
        setProgress((p) => ({
          ...p,
          scaleMap: summarizeCount(scaleMapDone, ["scale", "scales"], "Start with your first scale"),
        }));

        // Same "completed" rule as the Skill Tree checkmarks — one shared helper,
        // so this count can't drift away from what the tree itself shows.
        const skillsDone = exercisesAgregat.filter((exercise) =>
          hasExerciseProgress(bpmProgress.get(exercise.id))
        ).length;
        setProgress((p) => ({
          ...p,
          skills: summarizeCount(skillsDone, ["exercise", "exercises"], "Pick a technique to start"),
        }));
      })
      .catch(() => {});

    firebaseGetAllUserProgress(userId)
      .then((all) => {
        if (cancelled) return;
        setProgress((p) => ({ ...p, roadmaps: summarizeRoadmaps(roadmaps, all) }));
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return progress;
}
