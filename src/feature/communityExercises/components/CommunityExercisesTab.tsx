import { cn } from "assets/lib/utils";
import type { CommunityExercise } from "feature/communityExercises/types";
import {
  getCommunityExercises,
  getUserRatingForExercise,
  rateExercise,
} from "feature/communityExercises/services/communityExerciseService";
import { TablatureViewer } from "feature/exercisePlan/views/PracticeSession/components/TablatureViewer";
import type { DashboardExercise } from "feature/skills/components/SkillDashboard";
import { selectUserAuth } from "feature/user/store/userSlice";
import { UserTooltip } from "components/UserTooltip/UserTooltip";
import { firebaseGetUserTooltipData } from "utils/firebase/client/firebase.utils";
import { ChevronLeft, ChevronRight, ChevronRight as StartIcon, Search, Star } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAppSelector } from "store/hooks";

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
  }],
  unlockDescription: "",
  streakDays: 0,
  intensity: "medium",
  shortGoal: "",
  accentColor: "#ffffff",
  difficulty: ex.difficulty,
  tablature: ex.tablature,
});

const PAGE_SIZE = 10;

const CATEGORY_COLORS: Record<string, string> = {
  technique: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  theory: "bg-violet-500/15 text-violet-400 border-violet-500/20",
  hearing: "bg-cyan-500/15 text-cyan-400 border-cyan-500/20",
  creativity: "bg-green-500/15 text-green-400 border-green-500/20",
  mixed: "bg-zinc-500/15 text-zinc-400 border-zinc-500/20",
};

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: "bg-sky-500/15 text-sky-400 border-sky-500/20",
  easy: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  medium: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  hard: "bg-rose-500/15 text-rose-400 border-rose-500/20",
};

interface StarRatingProps {
  exerciseId: string;
  currentAverage: number;
  ratingCount: number;
  userRating: number | null;
  onRate: (exerciseId: string, rating: number) => void;
  isLoading: boolean;
}

const StarRating = ({ exerciseId, currentAverage, ratingCount, userRating, onRate, isLoading }: StarRatingProps) => {
  const [hovered, setHovered] = useState<number | null>(null);
  const display = hovered ?? userRating ?? 0;

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            disabled={isLoading}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => onRate(exerciseId, star)}
            className={cn(
              "transition-all disabled:cursor-wait",
              star <= display
                ? "text-amber-400 scale-110"
                : "text-zinc-700 hover:text-zinc-500"
            )}
          >
            <Star size={14} fill={star <= display ? "currentColor" : "none"} strokeWidth={1.5} />
          </button>
        ))}
      </div>
      <div className="flex items-center gap-1.5 text-right">
        {ratingCount > 0 ? (
          <>
            <span className="text-[11px] font-bold text-zinc-300 tabular-nums">{currentAverage.toFixed(1)}</span>
            <span className="text-[10px] text-zinc-600">({ratingCount})</span>
          </>
        ) : (
          <span className="text-[10px] text-zinc-700">No ratings yet</span>
        )}
      </div>
    </div>
  );
};

interface ExerciseRowProps {
  exercise: CommunityExercise;
  authorAvatar?: string | null;
  userRating: number | null;
  onRate: (exerciseId: string, rating: number) => void;
  isRatingLoading: boolean;
  onExpand: (id: string) => void;
  isExpanded: boolean;
  onStart: (exercise: CommunityExercise) => void;
}

const ExerciseRow = ({ exercise, authorAvatar, userRating, onRate, isRatingLoading, onExpand, isExpanded, onStart }: ExerciseRowProps) => {
  const authorInitial = exercise.authorUsername?.[0]?.toUpperCase() ?? "?";
  return (
    <>
      <tr
        className="border-b border-zinc-800/50 hover:bg-zinc-900/60 transition-colors cursor-pointer"
        onClick={() => onExpand(exercise.id)}
      >
        {/* Title + author */}
        <td className="px-4 py-3.5">
          <div className="flex items-center gap-3 max-w-[260px]">
            <UserTooltip userId={exercise.authorId}>
              <Link
                href={`/user/${exercise.authorId}`}
                onClick={e => e.stopPropagation()}
                className="shrink-0"
                aria-label={`View ${exercise.authorUsername}'s profile`}
              >
                {authorAvatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={authorAvatar}
                    alt={exercise.authorUsername}
                    className="h-8 w-8 rounded-full object-cover ring-1 ring-zinc-700 transition-all hover:ring-cyan-500/60"
                  />
                ) : (
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-xs font-bold text-zinc-300 ring-1 ring-zinc-700 transition-all hover:ring-cyan-500/60">
                    {authorInitial}
                  </span>
                )}
              </Link>
            </UserTooltip>
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="font-semibold text-white leading-snug truncate">{exercise.title}</span>
              <UserTooltip userId={exercise.authorId}>
                <Link
                  href={`/user/${exercise.authorId}`}
                  onClick={e => e.stopPropagation()}
                  className="w-fit text-[11px] font-medium text-zinc-400 hover:text-cyan-400 transition-colors truncate max-w-full"
                >
                  {exercise.authorUsername}
                </Link>
              </UserTooltip>
            </div>
          </div>
        </td>

        {/* Category */}
        <td className="px-3 py-3.5">
          <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold capitalize tracking-wider border", CATEGORY_COLORS[exercise.category] ?? CATEGORY_COLORS.mixed)}>
            {exercise.category}
          </span>
        </td>

        {/* Difficulty */}
        <td className="px-3 py-3.5">
          <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold capitalize tracking-wider border", DIFFICULTY_COLORS[exercise.difficulty])}>
            {exercise.difficulty}
          </span>
        </td>

        {/* BPM */}
        <td className="px-3 py-3.5 text-zinc-500 text-xs font-mono whitespace-nowrap">
          {exercise.metronomeSpeed
            ? `${exercise.metronomeSpeed.min}–${exercise.metronomeSpeed.max}`
            : <span className="text-zinc-700">—</span>
          }
        </td>

        {/* Min */}
        <td className="px-3 py-3.5 text-zinc-500 text-xs">
          {exercise.timeInMinutes}m
        </td>

        {/* Rating */}
        <td className="px-3 py-3.5" onClick={e => e.stopPropagation()}>
          <StarRating
            exerciseId={exercise.id}
            currentAverage={exercise.averageRating}
            ratingCount={exercise.ratingCount}
            userRating={userRating}
            onRate={onRate}
            isLoading={isRatingLoading}
          />
        </td>

        {/* Start */}
        <td className="px-3 py-3.5" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => onStart(exercise)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-bold transition-all scale-95 hover:scale-100"
          >
            <StartIcon size={12} strokeWidth={2.5} />
            Start
          </button>
        </td>
      </tr>

      {/* Expanded detail row */}
      {isExpanded && (
        <tr className="border-b border-zinc-800">
          <td colSpan={6} className="px-4 py-5 bg-zinc-950/60">
            <div className="space-y-4">

              {/* Tablature preview */}
              {exercise.tablature?.length > 0 && (
                <div className="border border-zinc-800 rounded-lg overflow-hidden">
                  <TablatureViewer
                    measures={exercise.tablature}
                    bpm={exercise.metronomeSpeed?.recommended ?? 80}
                    isPlaying={false}
                    startTime={null}
                    className="h-[280px]"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Description */}
                {exercise.description && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">About</p>
                    <p className="text-sm text-zinc-300 leading-relaxed">{exercise.description}</p>
                  </div>
                )}

                {/* Instructions */}
                {exercise.instructions?.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">Instructions</p>
                    <ol className="space-y-1.5 list-none">
                      {exercise.instructions.map((inst, i) => (
                        <li key={i} className="flex gap-2 text-sm text-zinc-300">
                          <span className="text-zinc-600 font-bold tabular-nums shrink-0">{i + 1}.</span>
                          {inst}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>

              {/* Tips */}
              {exercise.tips?.filter(Boolean).length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">Tips</p>
                  <ul className="space-y-1">
                    {exercise.tips.filter(Boolean).map((tip, i) => (
                      <li key={i} className="text-sm text-zinc-400 flex gap-2">
                        <span className="text-zinc-600">·</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

interface CommunityExercisesTabProps {
  onStartExercise: (challenge: DashboardExercise) => void;
}

export const CommunityExercisesTab = ({ onStartExercise }: CommunityExercisesTabProps) => {
  const userAuth = useAppSelector(selectUserAuth);
  const [exercises, setExercises] = useState<CommunityExercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userRatings, setUserRatings] = useState<Record<string, number | null>>({});
  const [authorAvatars, setAuthorAvatars] = useState<Record<string, string | null>>({});
  const [ratingLoading, setRatingLoading] = useState<Record<string, boolean>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    getCommunityExercises().then(data => {
      setExercises(data);
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!userAuth || exercises.length === 0) return;
    const fetchRatings = async () => {
      const pairs = await Promise.all(
        exercises.map(async ex => ({
          id: ex.id,
          rating: await getUserRatingForExercise(ex.id, userAuth),
        }))
      );
      const map: Record<string, number | null> = {};
      pairs.forEach(p => { map[p.id] = p.rating; });
      setUserRatings(map);
    };
    fetchRatings();
  }, [userAuth, exercises]);

  const filteredExercises = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return exercises.filter(ex => {
      if (selectedDifficulty !== "all" && ex.difficulty !== selectedDifficulty) return false;
      if (selectedCategory !== "all" && ex.category !== selectedCategory) return false;
      if (q && !ex.title.toLowerCase().includes(q) && !ex.description.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [exercises, searchQuery, selectedDifficulty, selectedCategory]);

  const totalPages = Math.max(1, Math.ceil(filteredExercises.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageExercises = filteredExercises.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [searchQuery, selectedDifficulty, selectedCategory]);

  // Fetch author avatars for the visible page (deduped, cached across pages).
  useEffect(() => {
    const missingIds = Array.from(
      new Set(pageExercises.map(ex => ex.authorId).filter(Boolean))
    ).filter(id => !(id in authorAvatars));
    if (missingIds.length === 0) return;

    let cancelled = false;
    Promise.all(
      missingIds.map(async id => ({ id, data: await firebaseGetUserTooltipData(id) }))
    ).then(results => {
      if (cancelled) return;
      setAuthorAvatars(prev => {
        const next = { ...prev };
        results.forEach(({ id, data }) => { next[id] = data?.avatar ?? null; });
        return next;
      });
    });
    return () => { cancelled = true; };
  }, [pageExercises, authorAvatars]);

  const handleRate = async (exerciseId: string, rating: number) => {
    if (!userAuth) return;
    setRatingLoading(prev => ({ ...prev, [exerciseId]: true }));
    const ok = await rateExercise(exerciseId, userAuth, rating);
    if (ok) {
      setUserRatings(prev => ({ ...prev, [exerciseId]: rating }));
      setExercises(prev => prev.map(ex => {
        if (ex.id !== exerciseId) return ex;
        const prevRating = userRatings[exerciseId];
        const wasRated = prevRating !== null && prevRating !== undefined;
        const newCount = wasRated ? ex.ratingCount : ex.ratingCount + 1;
        const newSum = wasRated
          ? ex.averageRating * ex.ratingCount - (prevRating ?? 0) + rating
          : ex.averageRating * ex.ratingCount + rating;
        return { ...ex, ratingCount: newCount, averageRating: newCount > 0 ? newSum / newCount : 0 };
      }));
    }
    setRatingLoading(prev => ({ ...prev, [exerciseId]: false }));
  };

  const filterPill = (active: boolean) =>
    cn(
      "px-3 py-1 rounded text-[11px] font-semibold border transition-all capitalize whitespace-nowrap",
      active
        ? "bg-cyan-500/15 border-cyan-500/30 text-cyan-300"
        : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
    );

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6 w-full pt-6 pb-24 flex flex-col gap-5">

      {/* Filters */}
      <div className="flex flex-col gap-3 bg-zinc-900/60 border border-zinc-800 rounded px-5 py-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search community exercises…"
            className="w-full pl-9 pr-4 h-9 rounded bg-zinc-800/70 border border-zinc-700/60 text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-cyan-500/40 transition-all"
          />
        </div>

        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-[10px] font-bold capitalize tracking-wider text-zinc-600 mr-1">Category</span>
          {["all", "technique", "theory", "hearing", "creativity", "mixed"].map(cat => (
            <button key={cat} onClick={() => setSelectedCategory(cat)} className={filterPill(selectedCategory === cat)}>
              {cat === "all" ? "All" : cat}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-[10px] font-bold capitalize tracking-wider text-zinc-600 mr-1">Difficulty</span>
          {["all", "easy", "medium", "hard"].map(d => (
            <button key={d} onClick={() => setSelectedDifficulty(d)} className={filterPill(selectedDifficulty === d)}>
              {d === "all" ? "All" : d}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="flex flex-col gap-3">
        <p className="text-xs text-zinc-500">
          {filteredExercises.length} exercise{filteredExercises.length !== 1 ? "s" : ""} · sorted by rating
          {totalPages > 1 && <span className="ml-1 text-zinc-600">— page {safePage} / {totalPages}</span>}
        </p>

        <div className="overflow-x-auto rounded border border-zinc-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/80">
                <th className="text-left px-4 py-3 text-[11px] font-bold tracking-wider text-zinc-500">Exercise</th>
                <th className="text-left px-3 py-3 text-[11px] font-bold tracking-wider text-zinc-500">Category</th>
                <th className="text-left px-3 py-3 text-[11px] font-bold tracking-wider text-zinc-500">Difficulty</th>
                <th className="text-left px-3 py-3 text-[11px] font-bold tracking-wider text-zinc-500">BPM</th>
                <th className="text-left px-3 py-3 text-[11px] font-bold tracking-wider text-zinc-500">Min</th>
                <th className="text-right px-3 py-3 text-[11px] font-bold tracking-wider text-zinc-500">Rating</th>
                <th className="px-3 py-3 text-[11px] font-bold tracking-wider text-zinc-500"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-zinc-800/50">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-3 py-4">
                        <div className="h-4 bg-zinc-800 rounded animate-pulse" style={{ width: j === 0 ? "60%" : "40%" }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : pageExercises.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-zinc-600 text-sm">
                    {exercises.length === 0
                      ? "No community exercises yet. Be the first to publish one!"
                      : "No exercises match the current filters."}
                  </td>
                </tr>
              ) : (
                pageExercises.map(ex => (
                  <ExerciseRow
                    key={ex.id}
                    exercise={ex}
                    authorAvatar={authorAvatars[ex.authorId]}
                    userRating={userRatings[ex.id] ?? null}
                    onRate={handleRate}
                    isRatingLoading={!!ratingLoading[ex.id]}
                    onExpand={id => setExpandedId(expandedId === id ? null : id)}
                    isExpanded={expandedId === ex.id}
                    onStart={ex => onStartExercise(buildChallenge(ex))}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-zinc-800 bg-zinc-900 text-zinc-400 text-xs font-semibold disabled:opacity-30 hover:enabled:border-zinc-700 hover:enabled:text-zinc-200 transition-all"
            >
              <ChevronLeft size={13} />
              Previous
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => {
                const isActive = p === safePage;
                const isNear = Math.abs(p - safePage) <= 2 || p === 1 || p === totalPages;
                if (!isNear) {
                  return Math.abs(p - safePage) === 3 ? (
                    <span key={p} className="text-zinc-600 text-xs px-1">…</span>
                  ) : null;
                }
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={cn(
                      "h-7 min-w-[28px] px-2 rounded text-xs font-semibold transition-all",
                      isActive ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800"
                    )}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-zinc-800 bg-zinc-900 text-zinc-400 text-xs font-semibold disabled:opacity-30 hover:enabled:border-zinc-700 hover:enabled:text-zinc-200 transition-all"
            >
              Next
              <ChevronRight size={13} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
