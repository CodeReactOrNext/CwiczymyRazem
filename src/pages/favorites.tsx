import { cn } from "assets/lib/utils";
import { PageTabs } from "components/PageTabs/PageTabs";
import { HeroBanner, HeroPattern } from "components/UI/HeroBanner";
import { LIBRARY_TABS } from "constants/navTabs";
import { PlanCard } from "feature/exercisePlan/components/PlanCard";
import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import { defaultPlans } from "feature/exercisePlan/data/plansAgregat";
import { guitarSkills } from "feature/skills/data/guitarSkills";
import { SongBoardRow } from "feature/songs/components/SongBoard/SongBoardRow";
import { SongPracticePickerModal } from "feature/songs/components/SongPracticePickerModal/SongPracticePickerModal";
import { useUserSongProgress } from "feature/songs/hooks/useUserSongProgress";
import { getUserSongs } from "feature/songs/services/getUserSongs";
import type { Song } from "feature/songs/types/songs.type";
import { selectUserAuth, selectUserInfo } from "feature/user/store/userSlice";
import {
  toggleFavoriteExercise,
  toggleFavoritePlan,
  toggleFavoriteSong,
} from "feature/user/store/userSlice.favoriteActions";
import { useTranslation } from "hooks/useTranslation";
import AppLayout from "layouts/AppLayout";
import { Clock, Heart } from "lucide-react";
import { useRouter } from "next/router";
import type { ReactElement } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "store/hooks";
import type { NextPageWithLayout } from "types/page";
import { withAuth } from "utils/auth/serverAuth";

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: "bg-sky-500/[0.12] text-sky-400 border-sky-500/30",
  easy: "bg-emerald-500/[0.12] text-emerald-400 border-emerald-500/30",
  medium: "bg-amber-500/[0.12] text-amber-400 border-amber-500/30",
  hard: "bg-rose-500/[0.12] text-rose-400 border-rose-500/30",
};

const CATEGORY_COLORS: Record<string, string> = {
  technique: "bg-blue-500/[0.12] text-blue-400 border-blue-500/30",
  theory: "bg-violet-500/[0.12] text-violet-400 border-violet-500/30",
  hearing: "bg-cyan-500/[0.12] text-cyan-400 border-cyan-500/30",
  creativity: "bg-green-500/[0.12] text-green-400 border-green-500/30",
  mixed: "bg-zinc-500/[0.12] text-zinc-400 border-zinc-500/30",
};

const localizedTitle = (value: unknown): string => {
  if (!value) return "";
  if (typeof value === "string") return value;
  const obj = value as { en?: string; pl?: string };
  return obj.pl || obj.en || "";
};

const FavoritesPage: NextPageWithLayout = () => {
  const { t } = useTranslation(["common", "skills"]);
  const router = useRouter();
  const dispatch = useAppDispatch();
  const userAuth = useAppSelector(selectUserAuth);
  const userInfo = useAppSelector(selectUserInfo);
  const isPremium =
    userInfo?.role === "pro" ||
    userInfo?.role === "master" ||
    userInfo?.role === "admin";

  const favoritePlanIds = userInfo?.favoritePlanIds ?? [];
  const favoriteExerciseIds = userInfo?.favoriteExerciseIds ?? [];
  const favoriteSongIds = userInfo?.favoriteSongIds ?? [];

  const favoritePlans = favoritePlanIds
    .map((id) => defaultPlans.find((p) => p.id === id))
    .filter((p): p is (typeof defaultPlans)[number] => Boolean(p));

  const favoriteExercises = favoriteExerciseIds
    .map((id) => exercisesAgregat.find((e) => e.id === id))
    .filter((e): e is (typeof exercisesAgregat)[number] => Boolean(e));

  // Songs live in the user's Firestore library (not a static bundle), so we load
  // them and keep only the ones that are both in the library and favorited.
  const [songLists, setSongLists] = useState<{
    wantToLearn: Song[];
    learning: Song[];
    learned: Song[];
  }>({ wantToLearn: [], learning: [], learned: [] });

  const loadSongs = useCallback(() => {
    if (!userAuth) return Promise.resolve();
    return getUserSongs(userAuth)
      .then((lists) => {
        setSongLists({
          wantToLearn: lists.wantToLearn,
          learning: lists.learning,
          learned: lists.learned,
        });
      })
      .catch((error) => console.error("Failed to load songs:", error));
  }, [userAuth]);

  useEffect(() => {
    loadSongs();
  }, [loadSongs]);

  // Flatten the library so favorited songs can be looked up regardless of
  // which status list they currently live in.
  const librarySongs = useMemo(
    () => [
      ...songLists.wantToLearn,
      ...songLists.learning,
      ...songLists.learned,
    ],
    [songLists]
  );

  const favoriteSongs = favoriteSongIds
    .map((id) => librarySongs.find((s) => s.id === id))
    .filter((s): s is Song => Boolean(s));

  // Practice/GP picker — same chooser you get when clicking a song on /songs.
  const [practiceTarget, setPracticeTarget] = useState<Song | null>(null);
  const { progressMap, attachGpFile, detachGpFile } = useUserSongProgress(
    userAuth ?? null
  );

  const isEmpty =
    favoritePlans.length === 0 &&
    favoriteExercises.length === 0 &&
    favoriteSongs.length === 0;

  return (
    <div className="bg-second-600 flex min-h-screen flex-col overflow-visible rounded-xl border-none shadow-sm">
      <HeroBanner
        title="Favorites"
        subtitle="Your hearted plans, exercises and songs, all in one place"
        eyebrow="Favorites"
        eyebrowClassName="text-rose-400/80"
        backgroundContent={<HeroPattern withHeart />}
        className="mb-6 min-h-[100px] w-full !rounded-none !shadow-none md:min-h-[90px] lg:min-h-[100px]"
      />

      <div className="px-3 md:px-6 lg:px-8">
        <PageTabs
          tabs={LIBRARY_TABS}
          activeHref="/favorites"
          ariaLabel="Library sections"
        />
      </div>

      <div className="space-y-12 px-3 py-6 md:px-6 md:py-8 lg:px-8">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center rounded-lg bg-zinc-900/30 px-6 py-20 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10">
              <Heart className="h-5 w-5 text-rose-400" />
            </div>
            <p className="text-sm font-medium text-zinc-300">
              You haven&apos;t favorited anything yet
            </p>
            <p className="mt-2 max-w-sm text-xs text-zinc-500">
              Tap the heart on any plan or exercise to pin it here for quick access.
            </p>
          </div>
        ) : (
          <>
            {favoritePlans.length > 0 && (
              <section className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="h-1.5 w-1.5 rounded-full bg-current text-rose-500" />
                  <h2 className="text-sm font-medium tracking-wide text-white">
                    Plans
                  </h2>
                  <span className="text-xs text-zinc-600">
                    {favoritePlans.length}
                  </span>
                </div>

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {favoritePlans.map((plan) => {
                    const locked = !!plan.premium && !isPremium;
                    return (
                      <PlanCard
                        key={plan.id}
                        plan={plan}
                        isLocked={locked}
                        onSelect={
                          locked
                            ? undefined
                            : () => router.push(`/timer/plans?planId=${plan.id}`)
                        }
                        onStart={
                          locked
                            ? undefined
                            : () => router.push(`/timer/plans?planId=${plan.id}`)
                        }
                        onToggleFavorite={() =>
                          dispatch(
                            toggleFavoritePlan({ planId: plan.id, isFavorite: false })
                          )
                        }
                        isFavorite
                        startButtonText="Start"
                      />
                    );
                  })}
                </div>
              </section>
            )}

            {favoriteExercises.length > 0 && (
              <section className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="h-1.5 w-1.5 rounded-full bg-current text-rose-500" />
                  <h2 className="text-sm font-medium tracking-wide text-white">
                    Exercises
                  </h2>
                  <span className="text-xs text-zinc-600">
                    {favoriteExercises.length}
                  </span>
                </div>

                <div className="overflow-hidden rounded-lg border border-zinc-800">
                  {favoriteExercises.map((exercise, index) => {
                    const skillId = exercise.relatedSkills[0];
                    const skillData = skillId
                      ? guitarSkills.find((s) => s.id === skillId)
                      : null;
                    const SkillIcon = skillData?.icon;
                    return (
                    <button
                      key={exercise.id}
                      type="button"
                      onClick={() =>
                        router.push(`/profile/skills?exerciseId=${exercise.id}`)
                      }
                      className={cn(
                        "group flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-zinc-900/70 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-cyan-500/40",
                        index % 2 === 0 ? "bg-zinc-900/40" : "bg-zinc-950/40",
                        index !== 0 && "border-t border-zinc-800/60"
                      )}
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-zinc-800/60 text-zinc-400">
                        {SkillIcon ? (
                          <SkillIcon className="h-4 w-4" />
                        ) : (
                          <Heart className="h-4 w-4" />
                        )}
                      </span>

                      <span className="flex-1 truncate font-medium text-zinc-100">
                        {localizedTitle(exercise.title)}
                      </span>

                      {skillId && (
                        <span className="hidden max-w-[120px] shrink-0 items-center gap-1.5 truncate text-xs text-zinc-400 md:flex">
                          {SkillIcon && <SkillIcon className="h-3.5 w-3.5 shrink-0" />}
                          <span className="truncate">
                            {t(`skills:skills.${skillId}.name` as any)}
                          </span>
                        </span>
                      )}

                      <span
                        className={cn(
                          "hidden shrink-0 rounded border px-2 py-0.5 text-[10px] font-medium capitalize tracking-wider sm:inline-block",
                          CATEGORY_COLORS[exercise.category] ?? CATEGORY_COLORS.mixed
                        )}
                      >
                        {exercise.category}
                      </span>

                      <span
                        className={cn(
                          "hidden shrink-0 rounded border px-2 py-0.5 text-[10px] font-medium capitalize tracking-wider sm:inline-block",
                          DIFFICULTY_COLORS[exercise.difficulty] ??
                            DIFFICULTY_COLORS.easy
                        )}
                      >
                        {exercise.difficulty}
                      </span>

                      <span className="hidden w-16 shrink-0 items-center justify-end gap-1 text-[11px] text-zinc-500 sm:flex">
                        <Clock className="h-3 w-3" />
                        {exercise.timeInMinutes < 1
                          ? `${Math.round(exercise.timeInMinutes * 60)} s`
                          : `${exercise.timeInMinutes} min`}
                      </span>

                      <span
                        role="button"
                        tabIndex={0}
                        aria-label="Remove from favorites"
                        onClick={(e) => {
                          e.stopPropagation();
                          dispatch(
                            toggleFavoriteExercise({
                              exerciseId: exercise.id,
                              isFavorite: false,
                            })
                          );
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            e.stopPropagation();
                            dispatch(
                              toggleFavoriteExercise({
                                exerciseId: exercise.id,
                                isFavorite: false,
                              })
                            );
                          }
                        }}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-rose-500/15 text-rose-400 transition-colors hover:bg-rose-500/25 hover:text-rose-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-rose-500/50"
                      >
                        <Heart className="h-4 w-4 fill-current" />
                      </span>
                    </button>
                    );
                  })}
                </div>
              </section>
            )}

            {favoriteSongs.length > 0 && (
              <section className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="h-1.5 w-1.5 rounded-full bg-current text-rose-500" />
                  <h2 className="text-sm font-medium tracking-wide text-white">
                    Songs
                  </h2>
                  <span className="text-xs text-zinc-600">
                    {favoriteSongs.length}
                  </span>
                </div>

                <div className="space-y-2">
                  {favoriteSongs.map((song) => (
                    <SongBoardRow
                      key={song.id}
                      song={song}
                      progress={progressMap[song.id] ?? null}
                      onOpenDetails={() => setPracticeTarget(song)}
                      onPractice={() => setPracticeTarget(song)}
                      isFavorite
                      onToggleFavorite={() =>
                        dispatch(
                          toggleFavoriteSong({ songId: song.id, isFavorite: false })
                        )
                      }
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      {practiceTarget && userAuth && (
        <SongPracticePickerModal
          song={practiceTarget}
          userId={userAuth}
          isPremium={isPremium}
          progress={progressMap[practiceTarget.id] ?? null}
          onAttachGpFile={attachGpFile}
          onDetachGpFile={detachGpFile}
          onClose={() => setPracticeTarget(null)}
        />
      )}
    </div>
  );
};

FavoritesPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout pageId="favorites" variant="secondary">
      {page}
    </AppLayout>
  );
};

export default FavoritesPage;

export const getServerSideProps = withAuth({
  redirectIfUnauthenticated: "/login",
  translations: ["common", "exercises", "timer", "skills"],
});
