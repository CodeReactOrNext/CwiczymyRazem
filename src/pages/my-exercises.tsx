import { cn } from "assets/lib/utils";
import { HeroBanner } from "components/UI/HeroBanner";
import { getUserCommunityExercises } from "feature/communityExercises/services/communityExerciseService";
import type { CommunityExercise } from "feature/communityExercises/types";
import { selectUserAuth } from "feature/user/store/userSlice";
import AppLayout from "layouts/AppLayout";
import { Music2, Plus, Star } from "lucide-react";
import { useRouter } from "next/router";
import type { ReactElement } from "react";
import { useEffect, useState } from "react";
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

const MyExercisesPage: NextPageWithLayout = () => {
  const router = useRouter();
  const userAuth = useAppSelector(selectUserAuth);
  const [exercises, setExercises] = useState<CommunityExercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  return (
    <div className="bg-second-600 rounded-xl overflow-visible flex flex-col border-none shadow-sm min-h-screen lg:mt-16">
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
                  <p className="font-semibold text-white truncate">{ex.title}</p>
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
                  {ex.ratingCount > 0 ? (
                    <>
                      <div className="flex items-center gap-1">
                        <Star size={12} className="text-amber-400" fill="currentColor" />
                        <span className="text-sm font-bold text-zinc-200">{ex.averageRating.toFixed(1)}</span>
                      </div>
                      <span className="text-[10px] text-zinc-600">{ex.ratingCount} rating{ex.ratingCount !== 1 ? "s" : ""}</span>
                    </>
                  ) : (
                    <span className="text-[10px] text-zinc-700">No ratings yet</span>
                  )}
                </div>

                {/* View in community */}
                <button
                  onClick={() => router.push("/profile/skills?tab=community")}
                  className="shrink-0 px-3 py-1.5 rounded border border-zinc-700 bg-zinc-800/40 text-zinc-400 hover:text-white hover:border-zinc-600 text-xs font-semibold transition-all"
                >
                  View
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
