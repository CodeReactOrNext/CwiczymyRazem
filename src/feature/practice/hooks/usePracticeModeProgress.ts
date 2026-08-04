import roadmaps from "data/roadmaps";
import { firebaseGetAllUserProgress } from "feature/aiCoach/services/userProgress.service";
import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import { getAllBpmProgress } from "feature/exercisePlan/services/bpmProgressService";
import { journeyModules } from "feature/journey/data/journeyModules";
import { firebaseGetJourneyProgress } from "feature/journey/services/journey.service";
import { SCALE_TREE_NODES } from "feature/scaleTree/data/scaleTreeNodes";
import { computeNodeStatuses } from "feature/scaleTree/services/scaleTree.service";
import { useEffect, useState } from "react";

export interface ModeProgressSummary {
  done: number;
  total: number;
}

interface PracticeModeProgress {
  learningPath?: ModeProgressSummary;
  roadmaps?: ModeProgressSummary;
  scaleMap?: ModeProgressSummary;
  skills?: ModeProgressSummary;
}

/** Lightweight progress summaries for the Practice mode-selector cards — each feature keeps its own detailed progress model, this just counts done/total for a small badge. */
export function usePracticeModeProgress(userId: string | null | undefined) {
  const [progress, setProgress] = useState<PracticeModeProgress>({});

  useEffect(() => {
    if (!userId) return undefined;
    let cancelled = false;

    firebaseGetJourneyProgress(userId)
      .then((doc) => {
        if (cancelled) return;
        const allSteps = journeyModules.flatMap((m) => m.stages.flatMap((s) => s.steps));
        const done = journeyModules.reduce((sum, m) => {
          const savedSteps = doc?.moduleProgress?.[m.id]?.steps;
          const completedInModule = m.stages
            .flatMap((s) => s.steps)
            .filter((step) => savedSteps?.[step.id]?.completed).length;
          return sum + completedInModule;
        }, 0);
        setProgress((p) => ({ ...p, learningPath: { done, total: allSteps.length } }));
      })
      .catch(() => {});

    getAllBpmProgress(userId)
      .then((bpmProgress) => {
        if (cancelled) return;

        const bpmMap = new Map<string, number[]>();
        bpmProgress.forEach((data, exerciseId) => bpmMap.set(exerciseId, data.completedBpms ?? []));
        const statuses = computeNodeStatuses(bpmMap);
        const scaleMapDone = Object.values(statuses).filter((s) => s === "completed").length;
        setProgress((p) => ({ ...p, scaleMap: { done: scaleMapDone, total: SCALE_TREE_NODES.length } }));

        // Same "completed" rule as the Skill Tree checkmarks in SkillDashboard.tsx.
        const skillsDone = exercisesAgregat.filter((exercise) => {
          const data = bpmProgress.get(exercise.id);
          return (
            !!data &&
            ((data.completedBpms?.length ?? 0) > 0 ||
              (data.micHighScore != null && data.micHighScore > 0) ||
              (data.earTrainingHighScore != null && data.earTrainingHighScore > 0))
          );
        }).length;
        setProgress((p) => ({ ...p, skills: { done: skillsDone, total: exercisesAgregat.length } }));
      })
      .catch(() => {});

    firebaseGetAllUserProgress(userId)
      .then((all) => {
        if (cancelled) return;
        const progressByRoadmap = new Map(all.map((rp) => [rp.roadmapId, rp]));
        let done = 0;
        let total = 0;
        roadmaps.forEach((rm) => {
          const stepProgress = progressByRoadmap.get(rm.id)?.stepProgress ?? {};
          rm.phases.forEach((phase) => {
            phase.steps.forEach((step) => {
              total += 1;
              if ((stepProgress[step.id] ?? 0) >= step.sessionsRequired) done += 1;
            });
          });
        });
        setProgress((p) => ({ ...p, roadmaps: { done, total } }));
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return progress;
}
