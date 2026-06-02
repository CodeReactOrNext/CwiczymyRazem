import { cn } from "assets/lib/utils";
import { HeroBanner } from "components/UI/HeroBanner";
import { deleteCommunityExercise, getUserCommunityExercises } from "feature/communityExercises/services/communityExerciseService";
import type { CommunityExercise } from "feature/communityExercises/types";
import { PracticeSession } from "feature/exercisePlan/views/PracticeSession/PracticeSession";
import type { DashboardExercise } from "feature/skills/components/SkillDashboard";
import { selectUserAuth } from "feature/user/store/userSlice";
import AppLayout from "layouts/AppLayout";
import { ChevronLeft, Globe, Lock, Music2, Pencil, Play, Plus, Star, Trash2 } from "lucide-react";
import { useRouter } from "next/router";
import type { ReactElement } from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAppSelector } from "store/hooks";
import type { NextPageWithLayout } from "types/page";

const DIFFICULTY_COLORS: Record<string, string> = {
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
  requiredLevel: ex.difficulty === "easy" ? 0 : ex.difficulty === "medium" ? 1 : 2,
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
  const userAuth = useAppSelector(selectUserAuth);
  const [exercises, setExercises] = useState<CommunityExercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [activeExercise, setActiveExercise] = useState<DashboardExercise | null>(null);

  useEffect(() => {
    if (!userAuth) return;
    getUserCommunityExercises(userAuth).then(data => {
      setExercises(data);
      setIsLoading(false);
    });
  }, [userAuth]);

  const handleCreate = () => {
    router.push("/tab-editor");
  };

  const handleEdit = (ex: CommunityExercise) => {
    localStorage.setItem("tab-editor-draft", JSON.stringify(ex.tablature ?? []));
    router.push(`/tab-editor?edit=${ex.id}`);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const ok = await deleteCommunityExercise(id);
    if (ok) {
      setExercises(prev => prev.filter(e => e.id !== id));
      toast.success("Exercise deleted.");
    } else {
      toast.error("Failed to delete. Try again.");
    }
    setDeletingId(null);
  };

  if (activeExercise) {
    return (
      <div className="bg-second-600 rounded-xl overflow-visible flex flex-col border-none shadow-sm min-h-screen ">
        <div className="px-4 pt-6 pb-2">
          <button
            onClick={() => setActiveExercise(null)}
            className="flex items-center gap-1.5 text-zinc-500 hover:text-white text-sm font-semibold transition-colors"
          >
            <ChevronLeft size={16} />
            Back to My Exercises
          </button>
        </div>
        <div className="flex-1 overflow-hidden rounded-2xl mx-4 mb-4 border border-zinc-900 shadow-2xl">
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
    <div className="bg-second-600 rounded-xl overflow-visible flex flex-col border-none shadow-sm min-h-screen ">
      <HeroBanner
        title="My Exercises"
        subtitle="Create and share your own guitar exercises with the community"
        eyebrow="Custom Exercises"
        className="w-full !rounded-none !shadow-none min-h-[100px] md:min-h-[90px] lg:min-h-[100px] mb-6"
        buttonText="Create Exercise"
        onClick={handleCreate}
      />

      <div className="max-w-4xl mx-auto w-full px-4 lg:px-6 pb-24">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 bg-zinc-900 border border-zinc-800 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : exercises.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-6 text-center">
            <div className="w-16 h-16 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              <Music2 className="text-zinc-600" size={28} />
            </div>
            <div className="space-y-2">
              <p className="text-white font-semibold">No exercises yet</p>
              <p className="text-zinc-500 text-sm max-w-xs">
                Use the Tab Editor to build a tablature, then publish it as a community exercise.
              </p>
            </div>
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black text-sm font-bold rounded-lg transition-all shadow-[0_0_20px_rgba(6,182,212,0.2)]"
            >
              <Plus size={16} />
              Create your first exercise
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {exercises.map(ex => (
              <div
                key={ex.id}
                className="flex items-center gap-4 bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 rounded-lg px-5 py-4 transition-all"
              >
                {/* Title + meta */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-white truncate">{ex.title}</p>
                    {ex.isPublic ? (
                      <span className="shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                        <Globe size={9} />
                        Public
                      </span>
                    ) : (
                      <span className="shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border border-cyan-500/30 bg-cyan-500/10 text-cyan-400">
                        <Lock size={9} />
                        Private
                      </span>
                    )}
                  </div>
                  {ex.description && (
                    <p className="text-xs text-zinc-500 truncate">{ex.description}</p>
                  )}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold capitalize tracking-wider border", CATEGORY_COLORS[ex.category] ?? CATEGORY_COLORS.mixed)}>
                      {ex.category}
                    </span>
                    <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold capitalize tracking-wider border", DIFFICULTY_COLORS[ex.difficulty])}>
                      {ex.difficulty}
                    </span>
                    {ex.metronomeSpeed && (
                      <span className="text-[10px] text-zinc-600 font-mono">
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
                      <span className="text-[10px] text-zinc-600">{ex.ratingCount} rating{ex.ratingCount !== 1 ? "s" : ""}</span>
                    </>
                  ) : ex.isPublic ? (
                    <span className="text-[10px] text-zinc-700">No ratings yet</span>
                  ) : null}
                </div>

                {/* Play */}
                <button
                  onClick={() => setActiveExercise(buildChallenge(ex))}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded border border-zinc-700 bg-zinc-800/40 text-zinc-300 hover:text-white hover:border-cyan-500/50 hover:bg-cyan-500/10 text-xs font-semibold transition-all"
                >
                  <Play size={12} fill="currentColor" />
                  Practice
                </button>

                {/* View in community — only for public */}
                {ex.isPublic && (
                  <button
                    onClick={() => router.push("/profile/skills?tab=community")}
                    className="shrink-0 px-3 py-1.5 rounded border border-zinc-700 bg-zinc-800/40 text-zinc-400 hover:text-white hover:border-zinc-600 text-xs font-semibold transition-all"
                  >
                    View
                  </button>
                )}

                {/* Edit */}
                <button
                  onClick={() => handleEdit(ex)}
                  className="shrink-0 p-2 rounded border border-zinc-800 bg-zinc-900/40 text-zinc-500 hover:text-cyan-400 hover:border-cyan-500/40 hover:bg-cyan-500/5 transition-all"
                  title="Edit exercise"
                >
                  <Pencil size={14} />
                </button>

                {/* Delete */}
                <button
                  onClick={() => handleDelete(ex.id)}
                  disabled={deletingId === ex.id}
                  className="shrink-0 p-2 rounded border border-zinc-800 bg-zinc-900/40 text-zinc-600 hover:text-rose-400 hover:border-rose-500/40 hover:bg-rose-500/5 disabled:opacity-40 transition-all"
                  title="Delete exercise"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}

            <button
              onClick={handleCreate}
              className="w-full mt-4 py-4 border-2 border-dashed border-zinc-800 hover:border-cyan-500/40 hover:bg-cyan-500/[0.02] rounded-lg flex items-center justify-center gap-2 text-zinc-600 hover:text-cyan-400 text-sm font-semibold transition-all"
            >
              <Plus size={16} />
              Create another exercise
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
