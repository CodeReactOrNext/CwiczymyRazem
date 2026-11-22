import { Button } from "assets/components/ui/button";
import { Chip } from "assets/components/ui/chip";
import { cn } from "assets/lib/utils";
import { EmptyState } from "components/EmptyState/EmptyState";
import {
  PAGE_CONTENT,
  PAGE_GUTTER,
  PageShell,
} from "components/PageShell/PageShell";
import { PageTabs } from "components/PageTabs/PageTabs";
import { SectionHeader } from "components/SectionHeader/SectionHeader";
import { HeroBanner, HeroPattern } from "components/UI/HeroBanner";
import { LIBRARY_HERO_CLASS, LIBRARY_TABS } from "constants/navTabs";
import { ExercisePreviewDialog } from "feature/exercisePlan/components/CreatePlanDialog/steps/SelectExercisesStep/components/ExercisePreviewDialog";
import { PlanCard } from "feature/exercisePlan/components/PlanCard";
import { getCategoryChipColor } from "feature/exercisePlan/constants/categoryChip";
import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import { defaultPlans } from "feature/exercisePlan/data/plansAgregat";
import { useLocalizeExercise } from "feature/exercisePlan/hooks/useLocalizedExercises";
import type { Exercise } from "feature/exercisePlan/types/exercise.types";
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
import Link from "next/link";
import { useRouter } from "next/router";
import type { ReactElement } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "store/hooks";
import type { NextPageWithLayout } from "types/page";
import { withAuthInitialProps } from "utils/auth/authInitialProps";
import { formatMinutesDuration } from "utils/converter";

const localizedTitle = (value: unknown): string => {
  if (!value) return "";
  if (typeof value === "string") return value;
  const obj = value as { en?: string; pl?: string };
  return obj.pl || obj.en || "";
};

const FavoritesPage: NextPageWithLayout = () => {
  const { t } = useTranslation(["common", "skills", "library"]);
  const localizeExercise = useLocalizeExercise();
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
  // An exercise opens in the same preview the catalog uses; Start leaves for the session.
  const [previewExercise, setPreviewExercise] = useState<Exercise | null>(null);
  const { progressMap, attachGpFile, detachGpFile, setSongParts } = useUserSongProgress(
    userAuth ?? null
  );

  const isEmpty =
    favoritePlans.length === 0 &&
    favoriteExercises.length === 0 &&
    favoriteSongs.length === 0;

  return (
    <PageShell>
      <HeroBanner
        title={t("library:favorites.title")}
        subtitle={t("library:favorites.subtitle")}
        eyebrow={t("library:favorites.eyebrow")}
        className={LIBRARY_HERO_CLASS}
        backgroundContent={<HeroPattern withHeart />}
      />

      <div className={cn(PAGE_GUTTER, "pt-6")}>
        <PageTabs
          tabs={LIBRARY_TABS}
          activeHref="/favorites"
          ariaLabel={t("library:sections")}
        />
      </div>

      <div className={cn("space-y-12", PAGE_CONTENT)}>
        {isEmpty ? (
          // Nothing saved: Kostek looks around for something to keep.
          <EmptyState
            mood='lookAround'
            title={t("library:favorites.empty_title")}
            description={t("library:favorites.empty_body")}
            action={
              <>
                <Button asChild>
                  <Link href='/profile/skills?tab=browse'>
                    {t("library:favorites.browse_exercises")}
                  </Link>
                </Button>
                <Button asChild variant='ghost'>
                  <Link href='/timer/plans'>
                    {t("library:favorites.browse_plans")}
                  </Link>
                </Button>
                <Button asChild variant='ghost'>
                  <Link href='/songs?view=explore'>
                    {t("library:favorites.browse_songs")}
                  </Link>
                </Button>
              </>
            }
          />
        ) : (
          <>
            {favoritePlans.length > 0 && (
              <section className="space-y-6">
                <SectionHeader
                  title='Plans'
                  count={favoritePlans.length}
                  className="mb-0"
                />

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
                <SectionHeader
                  title='Exercises'
                  count={favoriteExercises.length}
                  className="mb-0"
                />

                <div className="space-y-2">
                  {favoriteExercises.map((exercise) => {
                    const skillId = exercise.relatedSkills[0];
                    const skillData = skillId
                      ? guitarSkills.find((s) => s.id === skillId)
                      : null;
                    const SkillIcon = skillData?.icon;
                    return (
                    <button
                      key={exercise.id}
                      type="button"
                      onClick={() => setPreviewExercise(exercise)}
                      className="group flex w-full items-center gap-3 rounded-lg bg-zinc-800/40 px-4 py-3 text-left transition-colors hover:bg-zinc-800/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-cyan-500/40"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-zinc-800/60 text-zinc-400">
                        {SkillIcon ? (
                          <SkillIcon className="h-4 w-4" />
                        ) : (
                          <Heart className="h-4 w-4" />
                        )}
                      </span>

                      <span className="flex-1 truncate font-medium text-zinc-100">
                        {localizedTitle(localizeExercise(exercise).title)}
                      </span>

                      {skillId && (
                        <span className="hidden max-w-[120px] shrink-0 items-center gap-1.5 truncate text-xs text-zinc-400 md:flex">
                          {SkillIcon && <SkillIcon className="h-3.5 w-3.5 shrink-0" />}
                          <span className="truncate">
                            {t(`skills:skills.${skillId}.name` as any)}
                          </span>
                        </span>
                      )}

                      <Chip
                        color={getCategoryChipColor(exercise.category)}
                        size='sm'
                        className="hidden shrink-0 sm:inline-flex"
                      >
                        {t(`common:categories.${exercise.category}`, exercise.category)}
                      </Chip>

                      <Chip color='gray' size='sm' className="hidden shrink-0 sm:inline-flex">
                        {t(`common:difficulty.${exercise.difficulty}`, exercise.difficulty)}
                      </Chip>

                      <span className="hidden w-16 shrink-0 items-center justify-end gap-1 text-[11px] text-zinc-500 sm:flex">
                        <Clock className="h-3 w-3" />
                        {exercise.timeInMinutes < 1
                          ? `${Math.round(exercise.timeInMinutes * 60)} s`
                          : formatMinutesDuration(exercise.timeInMinutes)}
                      </span>

                      <span
                        role="button"
                        tabIndex={0}
                        aria-label={t("library:favorites.remove")}
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
                <SectionHeader
                  title='Songs'
                  count={favoriteSongs.length}
                  className="mb-0"
                />

                <div className="space-y-2">
                  {favoriteSongs.map((song) => (
                    <SongBoardRow
                      key={song.id}
                      song={song}
                      progress={progressMap[song.id] ?? null}
                      onOpenDetails={() => setPracticeTarget(song)}
                      onPractice={() => setPracticeTarget(song)}
                      onPartsChange={(parts) => setSongParts(song.id, parts)}
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

      <ExercisePreviewDialog
        exercise={previewExercise ? localizeExercise(previewExercise) : null}
        onClose={() => setPreviewExercise(null)}
        onStart={() => {
          if (!previewExercise) return;
          const id = previewExercise.id;
          setPreviewExercise(null);
          router.push(
            `/profile/skills?exerciseId=${id}&returnTo=${encodeURIComponent("/favorites")}`
          );
        }}
      />

      {practiceTarget && userAuth && (
        <SongPracticePickerModal
          song={practiceTarget}
          userId={userAuth}
          progress={progressMap[practiceTarget.id] ?? null}
          onAttachGpFile={attachGpFile}
          onDetachGpFile={detachGpFile}
          onClose={() => setPracticeTarget(null)}
        />
      )}
    </PageShell>
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

FavoritesPage.getInitialProps = withAuthInitialProps();
