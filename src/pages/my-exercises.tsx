import { cn } from "assets/lib/utils";
import { BackLink } from "components/BackLink/BackLink";
import { PageTabs } from "components/PageTabs/PageTabs";
import { HeroBanner, HeroPattern } from "components/UI/HeroBanner";
import { LIBRARY_TABS } from "constants/navTabs";
import { deleteCommunityExercise, getUserCommunityExercises, setCommunityExerciseVisibility } from "feature/communityExercises/services/communityExerciseService";
import type { CommunityExercise } from "feature/communityExercises/types";
import { isReadyToPublish } from "feature/communityExercises/utils/isReadyToPublish";
import { clearTabEditorDraft, saveTabEditorDraft } from "feature/exercisePlan/utils/tabEditorDraft";
import { PracticeSession } from "feature/exercisePlan/views/PracticeSession/PracticeSession";
import type { DashboardExercise } from "feature/skills/components/SkillDashboard";
import { selectUserAuth } from "feature/user/store/userSlice";
import { useTranslation } from "hooks/useTranslation";
import AppLayout from "layouts/AppLayout";
import { FileText, Globe, Lock, Music2, Pencil, Play, Plus, Star, Trash2 } from "lucide-react";
import { useRouter } from "next/router";
import type { ReactElement } from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAppSelector } from "store/hooks";
import type { NextPageWithLayout } from "types/page";
import { withAuth } from "utils/auth/serverAuth";

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: "bg-sky-500/15 text-sky-400 border-sky-500/20",
  easy: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  medium: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  hard: "bg-rose-500/15 text-rose-400 border-rose-500/20",
};

const CATEGORY_COLORS: Record<string, string> = {
  technique: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  theory: "bg-violet-500/15 text-violet-400 border-violet-500/20",
  hearing: "bg-cyan-500/15 text-cyan-400 border-cyan-500/20",
  creativity: "bg-green-500/15 text-green-400 border-green-500/20",
  mixed: "bg-zinc-500/15 text-zinc-400 border-zinc-500/20",
};

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

const MyExercisesPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { t } = useTranslation("library");
  const userAuth = useAppSelector(selectUserAuth);
  const [exercises, setExercises] = useState<CommunityExercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [activeExercise, setActiveExercise] = useState<DashboardExercise | null>(null);

  useEffect(() => {
    if (!userAuth) return;
    getUserCommunityExercises(userAuth).then(data => {
      setExercises(data);
      setIsLoading(false);
    });
  }, [userAuth]);

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
    saveTabEditorDraft(ex.id, ex.tablature ?? []);
    router.push(`/tab-editor/publish?edit=${ex.id}${publish ? "&publish=1" : ""}`);
  };

  const handleEdit = (ex: CommunityExercise) => {
    // A Guitar Pro file uploaded from the plan creator lives in Storage, not in
    // `tablature`, so the Tab Editor would open on an empty grid — skip it.
    if (ex.gpFileUrl) {
      openDetailsForm(ex);
      return;
    }
    saveTabEditorDraft(ex.id, ex.tablature ?? []);
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

  if (activeExercise) {
    return (
      <div className="bg-second-600 rounded-lg overflow-visible flex flex-col min-h-screen ">
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
      </div>
    );
  }

  return (
    <div className="bg-second-600 rounded-lg overflow-visible flex flex-col min-h-screen ">
      <HeroBanner
        title={t("my_exercises.title")}
        subtitle={t("my_exercises.subtitle")}
        eyebrow={t("my_exercises.eyebrow")}
        backgroundContent={<HeroPattern />}
        className="w-full !rounded-none !shadow-none min-h-[100px] md:min-h-[90px] lg:min-h-[100px] mb-6"
        buttonText={t("my_exercises.create")}
        onClick={handleCreate}
      />

      <div className="px-4 lg:px-6 mb-6">
        <PageTabs
          tabs={LIBRARY_TABS}
          activeHref="/my-exercises"
          ariaLabel={t("sections")}
        />
      </div>

      <div className="px-4 lg:px-6 pb-24">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 bg-zinc-900/40 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : exercises.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-6 text-center">
            <div className="w-16 h-16 rounded-lg bg-zinc-900/60 flex items-center justify-center">
              <Music2 className="text-zinc-500" size={28} />
            </div>
            <div className="space-y-2">
              <p className="text-zinc-100 font-semibold">{t("my_exercises.empty_title")}</p>
              <p className="text-zinc-400 text-sm max-w-sm">
                {t("my_exercises.empty_body")}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={handleCreate}
                className="flex items-center gap-2 px-5 py-2.5 bg-zinc-100 hover:bg-white text-zinc-950 text-sm font-semibold rounded-lg transition-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <Music2 size={16} />
                {t("my_exercises.with_tab")}
              </button>
              <button
                onClick={handleCreateWithoutTab}
                className="flex items-center gap-2 px-5 py-2.5 bg-zinc-800/60 hover:bg-zinc-800 text-zinc-200 text-sm font-semibold rounded-lg transition-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <FileText size={16} />
                {t("my_exercises.instructions_only")}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {exercises.map(ex => (
              <div
                key={ex.id}
                className="flex items-center gap-4 bg-zinc-900/40 hover:bg-zinc-900/60 rounded-lg px-5 py-4 transition-background"
              >
                {/* Title + meta */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-zinc-100 truncate">{ex.title}</p>
                    {ex.isPublic ? (
                      <span className="shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                        <Globe size={9} />
                        {t("my_exercises.public")}
                      </span>
                    ) : (
                      <span className="shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border border-cyan-500/30 bg-cyan-500/10 text-cyan-400">
                        <Lock size={9} />
                        {t("my_exercises.private")}
                      </span>
                    )}
                  </div>
                  {ex.description && (
                    <p className="text-xs text-zinc-500 truncate">{ex.description}</p>
                  )}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold capitalize tracking-wider border", CATEGORY_COLORS[ex.category] ?? CATEGORY_COLORS.mixed)}>
                      {t(`common:categories.${ex.category}`, ex.category)}
                    </span>
                    <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold capitalize tracking-wider border", DIFFICULTY_COLORS[ex.difficulty])}>
                      {t(`common:difficulty.${ex.difficulty}`, ex.difficulty)}
                    </span>
                    {ex.metronomeSpeed && (
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {ex.metronomeSpeed.min}–{ex.metronomeSpeed.max} BPM
                      </span>
                    )}
                  </div>
                </div>

                {/* Rating */}
                <div className="flex flex-col items-end gap-0.5 shrink-0">
                  {ex.isPublic && ex.ratingCount > 0 ? (
                    <>
                      <div className="flex items-center gap-1">
                        <Star size={12} className="text-amber-400" fill="currentColor" />
                        <span className="text-sm font-bold text-zinc-200">{ex.averageRating.toFixed(1)}</span>
                      </div>
                      <span className="text-[10px] text-zinc-500">{t("my_exercises.ratings", { count: ex.ratingCount })}</span>
                    </>
                  ) : ex.isPublic ? (
                    <span className="text-[10px] text-zinc-500">{t("my_exercises.no_ratings")}</span>
                  ) : null}
                </div>

                {/* Play */}
                <button
                  onClick={() => setActiveExercise(buildChallenge(ex))}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded bg-zinc-800/60 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 text-xs font-semibold transition-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <Play size={12} fill="currentColor" />
                  {t("my_exercises.practice")}
                </button>

                {/* View in community — only for public */}
                {ex.isPublic && (
                  <button
                    onClick={() => router.push("/profile/skills?tab=community")}
                    className="shrink-0 px-3 py-1.5 rounded bg-zinc-800/60 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 text-xs font-semibold transition-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    {t("my_exercises.view")}
                  </button>
                )}

                {/* Visibility */}
                {ex.isPublic ? (
                  <button
                    onClick={() => handleToggleVisibility(ex)}
                    disabled={togglingId === ex.id}
                    className="shrink-0 p-2 rounded bg-zinc-800/60 text-zinc-400 hover:text-cyan-400 hover:bg-zinc-800 disabled:opacity-40 transition-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    title={t("my_exercises.make_private")}
                    aria-label={t("my_exercises.make_private")}
                  >
                    <Lock size={14} />
                  </button>
                ) : (
                  <button
                    onClick={() => handleToggleVisibility(ex)}
                    disabled={togglingId === ex.id}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded bg-zinc-800/60 text-zinc-300 hover:bg-zinc-800 hover:text-emerald-400 disabled:opacity-40 text-xs font-semibold transition-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <Globe size={12} />
                    {t("my_exercises.make_public")}
                  </button>
                )}

                {/* Edit */}
                <button
                  onClick={() => handleEdit(ex)}
                  className="shrink-0 p-2 rounded bg-zinc-800/60 text-zinc-400 hover:text-cyan-400 hover:bg-zinc-800 transition-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  title={t("my_exercises.edit")}
                  aria-label={t("my_exercises.edit")}
                >
                  <Pencil size={14} />
                </button>

                {/* Delete */}
                <button
                  onClick={() => handleDelete(ex.id)}
                  disabled={deletingId === ex.id}
                  className="shrink-0 p-2 rounded bg-zinc-800/60 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 disabled:opacity-40 transition-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  title={t("my_exercises.delete")}
                  aria-label={t("my_exercises.delete")}
                >
                  <Trash2 size={14} />
                </button>
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
      </div>
    </div>
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

export const getServerSideProps = withAuth({
  redirectIfUnauthenticated: "/login",
});
