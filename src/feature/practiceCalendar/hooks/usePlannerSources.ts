import { useQuery } from "@tanstack/react-query";
import curatedRoadmaps from "data/roadmaps";
import { firebaseGetUserRoadmaps } from "feature/aiCoach/services/roadmap.service";
import { firebaseGetAllUserProgress } from "feature/aiCoach/services/userProgress.service";
import type {
  StaticRoadmap,
  StaticRoadmapStep,
} from "feature/aiCoach/types/roadmap.types";
import { useExerciseGoals } from "feature/exerciseGoals/hooks/useExerciseGoals";
import { rotationQueryKey } from "feature/rotation/hooks/useRotation";
import { getRotation } from "feature/rotation/services/rotation.service";
import type { LastPracticedMap } from "feature/rotation/types/rotation.types";
import { useUserSongs } from "feature/songs/hooks/useUserSongs";
import { useMemo } from "react";

import type {
  PlannerGoal,
  PlannerRoadmapStep,
  PlannerSong,
} from "../utils/planner";

export interface PlannerSources {
  songs: PlannerSong[];
  goals: PlannerGoal[];
  roadmapSteps: PlannerRoadmapStep[];
  /** Exercise id → epoch ms of the last session that played it. */
  lastPracticed: Record<string, number>;
  /** All the stamps — songs too — for telling which slots were played. */
  practicedStamps: LastPracticedMap | null;
  isLoading: boolean;
}

/** Up to this many songs are offered to the planner — the ones being learned first. */
const MAX_SONGS = 8;

const orderedSteps = (roadmap: Pick<StaticRoadmap, "phases">) =>
  [...roadmap.phases]
    .sort((a, b) => a.order - b.order)
    .flatMap((phase) => [...phase.steps].sort((a, b) => a.order - b.order));

/**
 * The step a run is on: the first one whose sessions aren't all logged.
 * `null` once the whole roadmap is done.
 */
export const nextRoadmapStep = (
  roadmap: Pick<StaticRoadmap, "phases">,
  stepProgress: Record<string, number>,
): StaticRoadmapStep | null =>
  orderedSteps(roadmap).find(
    (step) => (stepProgress[step.id] ?? 0) < step.sessionsRequired,
  ) ?? null;

/**
 * Everything else in the app the planner draws from: the songs being learned,
 * the open tempo goals, the step each started roadmap is on, and when each
 * exercise was last played (stamped by the report on the rotation doc).
 * Roadmaps count as started once there is a progress document for them —
 * curated ones and the player's own; somebody else's roadmap can only be read
 * through the supporter API, so those stay out.
 */
export const usePlannerSources = (uid: string | null): PlannerSources => {
  const { songs: songLists, isLoading: songsLoading } = useUserSongs(uid);
  const { goals, isLoading: goalsLoading } = useExerciseGoals(uid);

  const rotationQuery = useQuery({
    queryKey: rotationQueryKey(uid),
    queryFn: () => getRotation(uid!),
    enabled: !!uid,
  });

  const roadmapsQuery = useQuery({
    queryKey: ["practice-calendar-roadmaps", uid],
    queryFn: async () => {
      const [own, progress] = await Promise.all([
        firebaseGetUserRoadmaps(uid!).catch(() => []),
        firebaseGetAllUserProgress(uid!).catch(() => []),
      ]);
      return { own, progress };
    },
    enabled: !!uid,
    staleTime: 5 * 60 * 1000,
  });

  const songs = useMemo<PlannerSong[]>(() => {
    if (!songLists) return [];
    const toRef =
      (status: PlannerSong["status"]) =>
      (song: {
        id: string;
        title: string;
        artist: string;
        coverUrl?: string;
      }): PlannerSong => ({
        status,
        song: {
          id: song.id,
          title: song.title,
          artist: song.artist,
          ...(song.coverUrl && { coverUrl: song.coverUrl }),
        },
      });
    return [
      ...songLists.learning.map(toRef("learning")),
      ...songLists.wantToLearn.map(toRef("wantToLearn")),
    ].slice(0, MAX_SONGS);
  }, [songLists]);

  const plannerGoals = useMemo<PlannerGoal[]>(
    () =>
      goals
        .filter((goal) => goal.status === "active")
        .map((goal) => ({
          goalId: goal.id,
          exerciseId: goal.exerciseId,
          title: goal.exerciseTitle,
          bpm: goal.stageBpm,
        })),
    [goals],
  );

  const roadmapSteps = useMemo<PlannerRoadmapStep[]>(() => {
    const data = roadmapsQuery.data;
    if (!data) return [];
    const byId = new Map<
      string,
      Pick<StaticRoadmap, "id" | "title" | "phases">
    >(
      [...curatedRoadmaps, ...data.own].map((roadmap) => [roadmap.id, roadmap]),
    );
    const progressById = new Map(
      data.progress.map((entry) => [entry.roadmapId, entry]),
    );
    // Own roadmaps count as started without a progress doc; curated ones need one.
    const startedIds = new Set([
      ...data.progress.map((entry) => entry.roadmapId),
      ...data.own.map((roadmap) => roadmap.id),
    ]);
    const recentFirst = [...startedIds].sort((a, b) =>
      (progressById.get(b)?.updatedAt ?? "").localeCompare(
        progressById.get(a)?.updatedAt ?? "",
      ),
    );

    return recentFirst.flatMap((roadmapId) => {
      const roadmap = byId.get(roadmapId);
      if (!roadmap) return [];
      const step = nextRoadmapStep(
        roadmap,
        progressById.get(roadmapId)?.stepProgress ?? {},
      );
      if (!step) return [];
      return [
        {
          roadmapId,
          roadmapTitle: roadmap.title,
          stepId: step.id,
          title: step.title,
          ...(step.suggestedExerciseId &&
            !step.noExercise && {
              exerciseId: step.suggestedExerciseId,
            }),
          ...(step.suggestedSong && {
            song: {
              id: step.suggestedSong.id,
              title: step.suggestedSong.title,
              artist: step.suggestedSong.artist,
              ...(step.suggestedSong.coverUrl && {
                coverUrl: step.suggestedSong.coverUrl,
              }),
            },
          }),
        },
      ];
    });
  }, [roadmapsQuery.data]);

  return {
    songs,
    goals: plannerGoals,
    roadmapSteps,
    lastPracticed: rotationQuery.data?.lastPracticed.exercise ?? {},
    practicedStamps: rotationQuery.data?.lastPracticed ?? null,
    isLoading:
      !uid ||
      songsLoading ||
      goalsLoading ||
      rotationQuery.isLoading ||
      roadmapsQuery.isLoading,
  };
};
