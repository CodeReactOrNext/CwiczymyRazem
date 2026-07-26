import { useQuery } from "@tanstack/react-query";
import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import { getUserExercisePlans } from "feature/exercisePlan/services/getUserExercisePlans";
import { idToSlug } from "feature/exercises/lib/slugUtils";
import { getUserSongs } from "feature/songs/services/getUserSongs";
import { selectUserAuth } from "feature/user/store/userSlice";
import { useMemo } from "react";
import { useAppSelector } from "store/hooks";

const MAX_RESULTS_PER_GROUP = 5;
const MIN_QUERY_LENGTH = 2;

export interface GlobalSearchResult {
  type: "exercise" | "plan" | "song";
  id: string;
  title: string;
  subtitle: string;
  href: string;
  coverUrl?: string;
}

const matches = (query: string, ...fields: (string | undefined)[]) =>
  fields.some((field) => field?.toLowerCase().includes(query));

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

export const useGlobalSearch = (query: string, enabled: boolean) => {
  const userId = useAppSelector(selectUserAuth);
  const normalizedQuery = query.trim().toLowerCase();
  const hasQuery = normalizedQuery.length >= MIN_QUERY_LENGTH;

  const { data: plans, isLoading: isPlansLoading } = useQuery({
    queryKey: ["global-search-plans", userId],
    queryFn: () => getUserExercisePlans(userId as string),
    enabled: enabled && !!userId,
    staleTime: 5 * 60 * 1000,
  });

  const { data: userSongs, isLoading: isSongsLoading } = useQuery({
    queryKey: ["user-songs", userId],
    queryFn: () => getUserSongs(userId as string),
    enabled: enabled && !!userId,
    staleTime: 10 * 60 * 1000,
  });

  const exerciseResults = useMemo<GlobalSearchResult[]>(() => {
    if (!hasQuery) return [];
    return exercisesAgregat
      .filter((exercise) => !exercise.isHiddenFromLibrary && !exercise.isPlayalong)
      .filter((exercise) => matches(normalizedQuery, exercise.title, exercise.description))
      .slice(0, MAX_RESULTS_PER_GROUP)
      .map((exercise) => ({
        type: "exercise" as const,
        id: exercise.id,
        title: exercise.title,
        subtitle: `${capitalize(exercise.category)} · ${capitalize(exercise.difficulty)}`,
        href: `/practice/exercise/${idToSlug(exercise.id)}`,
      }));
  }, [normalizedQuery, hasQuery]);

  const planResults = useMemo<GlobalSearchResult[]>(() => {
    if (!hasQuery || !plans) return [];
    return plans
      .filter((plan) => matches(normalizedQuery, plan.title, plan.description))
      .slice(0, MAX_RESULTS_PER_GROUP)
      .map((plan) => ({
        type: "plan" as const,
        id: plan.id,
        title: plan.title,
        subtitle: `${plan.exercises?.length ?? 0} exercises`,
        href: `/practice/${plan.id}`,
      }));
  }, [plans, normalizedQuery, hasQuery]);

  const songResults = useMemo<GlobalSearchResult[]>(() => {
    if (!hasQuery || !userSongs) return [];
    const allSongs = [...userSongs.wantToLearn, ...userSongs.learning, ...userSongs.learned];
    return allSongs
      .filter((song) => matches(normalizedQuery, song.title, song.artist))
      .slice(0, MAX_RESULTS_PER_GROUP)
      .map((song) => ({
        type: "song" as const,
        id: song.id,
        title: song.title,
        subtitle: song.artist,
        href: `/songs?songId=${song.id}`,
        coverUrl: song.coverUrl,
      }));
  }, [userSongs, normalizedQuery, hasQuery]);

  const results = useMemo(
    () => [...exerciseResults, ...planResults, ...songResults],
    [exerciseResults, planResults, songResults],
  );

  return {
    exerciseResults,
    planResults,
    songResults,
    results,
    isLoading: hasQuery && (isPlansLoading || isSongsLoading),
    hasQuery,
  };
};
