import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "assets/components/ui/button";
import { Chip } from "assets/components/ui/chip";
import { Skeleton } from "assets/components/ui/skeleton";
import { cn } from "assets/lib/utils";
import { BackLink } from "components/BackLink/BackLink";
import { EmptyState } from "components/EmptyState/EmptyState";
import { LibrarySortSelect } from "components/LibrarySortSelect/LibrarySortSelect";
import { LoadingSwap } from "components/LoadingSwap/LoadingSwap";
import { PAGE_CONTENT, PAGE_GUTTER, PageShell } from "components/PageShell/PageShell";
import { PageTabs } from "components/PageTabs/PageTabs";
import { HeroBanner, HeroPattern } from "components/UI/HeroBanner";
import { LIBRARY_HERO_CLASS, LIBRARY_TABS } from "constants/navTabs";
import { userCommunityExercisesQuery } from "feature/communityExercises/hooks/communityExerciseQueries";
import { deleteCommunityExercise, setCommunityExerciseVisibility } from "feature/communityExercises/services/communityExerciseService";
import type { CommunityExercise } from "feature/communityExercises/types";
import { isReadyToPublish } from "feature/communityExercises/utils/isReadyToPublish";
import { getCategoryChipColor } from "feature/exercisePlan/constants/categoryChip";
import { clearTabEditorDraft, saveTabEditorDraft } from "feature/exercisePlan/utils/tabEditorDraft";
import { PracticeSession } from "feature/exercisePlan/views/PracticeSession/PracticeSession";
import { useSessionEntryGate } from "feature/sessionEntry/useSessionEntryGate";
import type { DashboardExercise } from "feature/skills/components/SkillDashboard";
import { selectUserAuth } from "feature/user/store/userSlice";
import { useLibrarySort } from "hooks/useLibrarySort";
import { useTranslation } from "hooks/useTranslation";
import AppLayout from "layouts/AppLayout";
import { FileText, Globe, Lock, Music2, Pencil, Play, Plus, Star, Trash2 } from "lucide-react";
import { useRouter } from "next/router";
import type { ReactElement } from "react";
import { useState } from "react";
import { toast } from "sonner";
import { useAppSelector } from "store/hooks";
import type { NextPageWithLayout } from "types/page";
import { withAuthInitialProps } from "utils/auth/authInitialProps";
import { sortLibraryItems } from "utils/librarySort";

const buildChallenge = (ex: CommunityExercise): DashboardExercise => ({
  id: ex.id,
  title: ex.title,
  description: ex.description,
  category: ex.category as any,
  requiredSkillId: ex.relatedSkills[0] || "general",
  requiredLevel: ex.difficulty === "hard" ? 2 : ex.difficulty === "medium" ? 1 : 0,
  rewardDescription: "Practice complete",
  exercises: [{
    id: ex.id,
    title: ex.title,
    description: ex.description,
    difficulty: ex.difficulty,
    category: ex.category,
    timeInMinutes: ex.timeInMinutes,
    instructions: ex.instructions,
    tips: ex.tips,
    metronomeSpeed: ex.metronomeSpeed,
    relatedSkills: ex.relatedSkills,
    tablature: ex.tablature,
    ...(ex.instrument === "bass" && { instrument: ex.instrument }),
    // Set on exercises saved from the plan creator instead of the Tab Editor
    videoUrl: ex.videoUrl,
    imageUrl: ex.imageUrl,
    gpFileUrl: ex.gpFileUrl,
    backingTracks: ex.backingTracks,
  }],
  unlockDescription: "",
  streakDays: 0,
  intensity: "medium",
  shortGoal: "",
  accentColor: "#ffffff",
  difficulty: ex.difficulty,
  tablature: ex.tablature,
});

const NO_EXERCISES: CommunityExercise[] = [];

const MyExercisesPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { t } = useTranslation("library");
  const userAuth = useAppSelector(selectUserAuth);
  const queryClient = useQueryClient();
  const exercisesQuery = userCommunityExercisesQuery(userAuth ?? "");
  const { data: exercises = NO_EXERCISES, isPending: isLoading } = useQuery({
    ...exercisesQuery,
    enabled: !!userAuth,
  });
  // Edits made here go straight into the cached list.
  const setExercises = (update: (prev: CommunityExercise[]) => CommunityExercise[]) =>
    queryClient.setQueryData(exercisesQuery.queryKey, (prev) => update(prev ?? []));
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [activeExercise, setActiveExercise] = useState<DashboardExercise | null>(null);
  const [sort, setSort] = useLibrarySort("riffquest.myExercisesSort");
  const sortedExercises = sortLibraryItems(exercises, sort, (ex) => ({
    title: ex.title ?? "",
    createdAtMs: ex.createdAt?.toMillis?.() ?? null,
  }));

  const handleCreate = () => {
    clearTabEditorDraft();
    router.push("/tab-editor");
  };

  // No tab to write — skip the editor and go straight to the details form,
  // which saves an exercise with instructions only.
  const handleCreateWithoutTab = () => {
    clearTabEditorDraft();
    router.push("/tab-editor/publish");
  };

  // Straight to the details form. The draft is re-seeded from the exercise's own
  // saved tab so a leftover draft can't overwrite it on save.
  const openDetailsForm = (ex: CommunityExercise, publish = false) => {
    saveTabEditorDraft(ex.id, ex.tablature ?? [], ex.instrument);
    router.push(`/tab-editor/publish?edit=${ex.id}${publish ? "&publish=1" : ""}`);
  };

  const handleEdit = (ex: CommunityExercise) => {
    // A Guitar Pro file uploaded from the plan creator lives in Storage, not in
    // `tablature`, so the Tab Editor would open on an empty grid — skip it.
    if (ex.gpFileUrl) {
      openDetailsForm(ex);
      return;
    }
    saveTabEditorDraft(ex.id, ex.tablature ?? [], ex.instrument);
    router.push(`/tab-editor?edit=${ex.id}`);
  };

  const handleToggleVisibility = async (ex: CommunityExercise) => {
    const isPublic = !ex.isPublic;
    if (isPublic && !isReadyToPublish(ex)) {
      toast.info(t("my_exercises.publish_incomplete"));
      openDetailsForm(ex, true);
      return;
    }

    setTogglingId(ex.id);
    const ok = await setCommunityExerciseVisibility(ex.id, isPublic);
    if (ok) {
      setExercises(prev => prev.map(e => (e.id === ex.id ? { ...e, isPublic } : e)));
      toast.success(t(isPublic ? "my_exercises.published" : "my_exercises.made_private"));
    } else {
      toast.error(t("my_exercises.visibility_failed"));
    }
    setTogglingId(null);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const ok = await deleteCommunityExercise(id);
    if (ok) {
      setExercises(prev => prev.filter(e => e.id !== id));
      toast.success(t("my_exercises.deleted"));
    } else {
      toast.error(t("my_exercises.delete_failed"));
    }
    setDeletingId(null);
  };

  const sessionOpen = useSessionEntryGate(!!activeExercise);

  if (activeExercise && sessionOpen) {
    return (
      <PageShell>
        <div className="px-4 pt-6 pb-2">
          <BackLink label={t("my_exercises.back")} onClick={() => setActiveExercise(null)} />
        </div>
        <div className="flex-1 overflow-hidden rounded-lg mx-4 mb-4">
          <PracticeSession
            plan={activeExercise as any}
            onFinish={() => setActiveExercise(null)}
            onClose={() => setActiveExercise(null)}
            forceFullDuration={true}
          />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <HeroBanner
        title={t("my_exercises.title")}
        subtitle={t("my_exercises.subtitle")}
        eyebrow={t("my_exercises.eyebrow")}
        className={LIBRARY_HERO_CLASS}
        backgroundContent={<HeroPattern />}
        buttonText={t("my_exercises.create")}
        onClick={handleCreate}
      />

      <div className={cn(PAGE_GUTTER, "pt-6")}>
        <PageTabs
          tabs={LIBRARY_TABS}
          activeHref="/my-exercises"
          ariaLabel={t("sections")}
        />
      </div>

      <div className={PAGE_CONTENT}>
        <LoadingSwap
          isLoading={isLoading}
          skeleton={
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} variant="block" className="h-20" />
              ))}
            </div>
          }>
          {exercises.length === 0 ? (
            // No exercises of your own: Kostek looks around for the first one.
            <EmptyState
              mood='lookAround'
              title={t("my_exercises.empty_title")}
              description={t("my_exercises.empty_body")}
              action={
                <>
                  <Button onClick={handleCreate}>
                    <Music2 />
                    {t("my_exercises.with_tab")}
                  </Button>
                  <Button variant='ghost' onClick={handleCreateWithoutTab}>
                    <FileText />
                    {t("my_exercises.instructions_only")}
                  </Button>
                </>
              }
            />
          ) : (
            <div className="space-y-3">
              {exercises.length > 1 && (
                <div className="mb-6 flex justify-end">
                  <LibrarySortSelect value={sort} onChange={setSort} />
                </div>
              )}
              {sortedExercises.map(ex => (
                <div
                  key={ex.id}
                  className="flex flex-col gap-3 bg-zinc-800/40 hover:bg-zinc-800/60 rounded-lg px-4 py-4 transition-background sm:flex-row sm:items-center sm:gap-4 sm:px-5"
                >
                  {/* Title + meta */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-zinc-100 truncate">{ex.title}</p>
                      {ex.isPublic ? (
                        <Chip color='emerald' size='sm' className="shrink-0">
                          <Globe size={10} />
                          {t("my_exercises.public")}
                        </Chip>
                      ) : (
                        <Chip color='gray' size='sm' className="shrink-0">
                          <Lock size={10} />
                          {t("my_exercises.private")}
                        </Chip>
                      )}
                    </div>
                    {ex.description && (
                      <p className="text-xs text-zinc-500 truncate">{ex.description}</p>
                    )}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Chip color={getCategoryChipColor(ex.category)} size='sm'>
                        {t(`common:categories.${ex.category}`, ex.category)}
                      </Chip>
                      <Chip color='gray' size='sm'>
                        {t(`common:difficulty.${ex.difficulty}`, ex.difficulty)}
                      </Chip>
                      {ex.metronomeSpeed && (
                        <span className="text-xs text-zinc-500 font-mono">
                          {ex.metronomeSpeed.min}–{ex.metronomeSpeed.max} BPM
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Phones: the actions drop under the title as one row of keys
                      (Practice takes the spare width) instead of squeezing the
                      title column down to a sliver. */}
                  <div className="flex items-center gap-2 sm:gap-4">
                  {/* Rating */}
                  <div className="hidden flex-col items-end gap-0.5 shrink-0 sm:flex">
                    {ex.isPublic && ex.ratingCount > 0 ? (
                      <>
                        <div className="flex items-center gap-1">
                          <Star size={12} className="text-amber-400" fill="currentColor" />
                          <span className="text-sm font-bold text-zinc-200">{ex.averageRating.toFixed(1)}</span>
                        </div>
                        <span className="text-xs text-zinc-500">{t("my_exercises.ratings", { count: ex.ratingCount })}</span>
                      </>
                    ) : ex.isPublic ? (
                      <span className="text-xs text-zinc-500">{t("my_exercises.no_ratings")}</span>
                    ) : null}
                  </div>

                  {/* Play */}
                  <Button
                    variant="subtle"
                    onClick={() => setActiveExercise(buildChallenge(ex))}
                    className="flex-1 shrink-0 sm:flex-none"
                  >
                    <Play fill="currentColor" />
                    {t("my_exercises.practice")}
                  </Button>

                  {/* View in community — only for public */}
                  {ex.isPublic && (
                    <Button
                      variant="subtle"
                      onClick={() => router.push(`/profile/skills?tab=community&communityExercise=${ex.id}`)}
                      className="shrink-0"
                    >
                      {t("my_exercises.view")}
                    </Button>
                  )}

                  {/* Visibility */}
                  {ex.isPublic ? (
                    <Button
                      variant="subtle"
                      size="icon"
                      onClick={() => handleToggleVisibility(ex)}
                      disabled={togglingId === ex.id}
                      className="shrink-0 hover:text-cyan-400"
                      title={t("my_exercises.make_private")}
                      aria-label={t("my_exercises.make_private")}
                    >
                      <Lock />
                    </Button>
                  ) : (
                    <Button
                      variant="subtle"
                      onClick={() => handleToggleVisibility(ex)}
                      disabled={togglingId === ex.id}
                      className="shrink-0 hover:text-emerald-400"
                    >
                      <Globe />
                      {t("my_exercises.make_public")}
                    </Button>
                  )}

                  {/* Edit */}
                  <Button
                    variant="subtle"
                    size="icon"
                    onClick={() => handleEdit(ex)}
                    className="shrink-0 hover:text-cyan-400"
                    title={t("my_exercises.edit")}
                    aria-label={t("my_exercises.edit")}
                  >
                    <Pencil />
                  </Button>

                  {/* Delete */}
                  <Button
                    variant="subtle"
                    size="icon"
                    onClick={() => handleDelete(ex.id)}
                    disabled={deletingId === ex.id}
                    className="shrink-0 hover:text-rose-400"
                    title={t("my_exercises.delete")}
                    aria-label={t("my_exercises.delete")}
                  >
                    <Trash2 />
                  </Button>
                  </div>
                </div>
              ))}

              <button
                onClick={handleCreate}
                className="w-full mt-4 py-4 bg-zinc-900/40 hover:bg-zinc-900/60 rounded-lg flex items-center justify-center gap-2 text-zinc-500 hover:text-cyan-400 text-sm font-semibold transition-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <Plus size={16} />
                {t("my_exercises.create_another")}
              </button>
            </div>
          )}
        </LoadingSwap>
      </div>
    </PageShell>
  );
};

MyExercisesPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout pageId="my-exercises" variant="secondary">
      {page}
    </AppLayout>
  );
};

export default MyExercisesPage;

MyExercisesPage.getInitialProps = withAuthInitialProps();
