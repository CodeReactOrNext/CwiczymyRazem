import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "assets/components/ui/tooltip";
import { cn } from "assets/lib/utils";
import { ExercisePreviewDialog } from "feature/exercisePlan/components/CreatePlanDialog/steps/SelectExercisesStep/components/ExercisePreviewDialog";
import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import type { BpmProgressData } from "feature/exercisePlan/services/bpmProgressService";
import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { generateBpmStages } from "feature/exercisePlan/utils/generateBpmStages";
import { isExerciseNew } from "feature/exercisePlan/utils/isExerciseNew";
import { getExerciseUserRank } from "feature/leadboard/services/getExerciseUserRank";
import { guitarSkills } from "feature/skills/data/guitarSkills";
import type { GuitarSkillId } from "feature/skills/skills.types";
import { selectUserAuth, selectUserInfo } from "feature/user/store/userSlice";
import { toggleFavoriteExercise } from "feature/user/store/userSlice.favoriteActions";
import { useTranslation } from "hooks/useTranslation";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronsUpDown, ChevronUp, Heart, Info, Lock,Search, Trophy } from "lucide-react";
import { useEffect,useMemo, useState } from "react";
import { FaCheck } from "react-icons/fa";
import { useAppDispatch, useAppSelector } from "store/hooks";

import type { DashboardExercise } from "./SkillDashboard";

interface ExerciseBrowseTabProps {
  progressMap: Map<string, BpmProgressData>;
  isPremium: boolean;
  onStartExercise: (challenge: DashboardExercise) => void;
  onShowUpgrade: () => void;
  onShowLeaderboard: (id: string, title: string) => void;
}

const PAGE_SIZE = 15;

const CATEGORY_COLORS: Record<string, string> = {
  technique: "bg-blue-500/[0.12] text-blue-400 border-blue-500/30",
  theory: "bg-violet-500/[0.12] text-violet-400 border-violet-500/30",
  hearing: "bg-cyan-500/[0.12] text-cyan-400 border-cyan-500/30",
  creativity: "bg-green-500/[0.12] text-green-400 border-green-500/30",
  mixed: "bg-zinc-500/[0.12] text-zinc-400 border-zinc-500/30",
};

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: "bg-sky-500/[0.12] text-sky-400 border-sky-500/30",
  easy: "bg-emerald-500/[0.12] text-emerald-400 border-emerald-500/30",
  medium: "bg-amber-500/[0.12] text-amber-400 border-amber-500/30",
  hard: "bg-rose-500/[0.12] text-rose-400 border-rose-500/30",
};

const CATEGORIES = ["all", "technique", "theory", "hearing", "creativity", "mixed"] as const;
const DIFFICULTIES = ["all", "beginner", "easy", "medium", "hard"] as const;

type SortKey = "default" | "name" | "difficulty" | "time";
const DIFFICULTY_RANK: Record<string, number> = { beginner: 0, easy: 1, medium: 2, hard: 3 };
const exTitle = (ex: { title: unknown; id: string }): string =>
  typeof ex.title === "string" ? ex.title : ((ex.title as any)?.en ?? ex.id);

const filterPill = (active: boolean) =>
  cn(
    "px-3 py-1 rounded text-[11px] font-semibold transition-colors capitalize whitespace-nowrap",
    active
      ? "bg-cyan-500/15 text-cyan-300"
      : "bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
  );

export const ExerciseBrowseTab = ({
  progressMap,
  isPremium,
  onStartExercise,
  onShowUpgrade,
  onShowLeaderboard,
}: ExerciseBrowseTabProps) => {
  const { t } = useTranslation(["common", "skills"]);
  const dispatch = useAppDispatch();
  const userInfo = useAppSelector(selectUserInfo);
  const favoriteExerciseIds = useMemo(
    () => userInfo?.favoriteExerciseIds ?? [],
    [userInfo?.favoriteExerciseIds]
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [selectedSkill, setSelectedSkill] = useState("all");
  const [page, setPage] = useState(1);
  const [previewExercise, setPreviewExercise] = useState<Exercise | null>(null);
  const [leaderboardRanks, setLeaderboardRanks] = useState<Record<string, number>>({});
  const [isLoadingRanks, setIsLoadingRanks] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("default");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const toggleSort = (key: Exclude<SortKey, "default">) => {
    if (sortKey === key) {
      setSortDir(d => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const availableSkills = useMemo(() => {
    const skillSet = new Set<GuitarSkillId>();
    exercisesAgregat.forEach(ex => {
      if (ex.isHiddenFromLibrary) return;
      ex.relatedSkills.forEach(s => skillSet.add(s as GuitarSkillId));
    });
    return Array.from(skillSet).sort((a, b) => {
      const na = guitarSkills.find(s => s.id === a)?.id ?? a;
      const nb = guitarSkills.find(s => s.id === b)?.id ?? b;
      return na.localeCompare(nb);
    });
  }, []);

  const filteredExercises = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return exercisesAgregat
      .filter(ex => {
        if (ex.isHiddenFromLibrary) return false;
        if (ex.isPlayalong) return false;
        if (selectedCategory !== "all" && ex.category !== selectedCategory) return false;
        if (selectedDifficulty !== "all" && ex.difficulty !== selectedDifficulty) return false;
        if (selectedSkill !== "all" && !ex.relatedSkills.includes(selectedSkill as GuitarSkillId)) return false;
        if (q) {
          const title = (typeof ex.title === "string" ? ex.title : (ex.title as any)?.en ?? "").toLowerCase();
          const desc = (typeof ex.description === "string" ? ex.description : "").toLowerCase();
          if (!title.includes(q) && !desc.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const dir = sortDir === "asc" ? 1 : -1;
        if (sortKey === "name") return exTitle(a).localeCompare(exTitle(b)) * dir;
        if (sortKey === "difficulty")
          return ((DIFFICULTY_RANK[a.difficulty] ?? 99) - (DIFFICULTY_RANK[b.difficulty] ?? 99)) * dir;
        if (sortKey === "time")
          return ((a.timeInMinutes ?? 0) - (b.timeInMinutes ?? 0)) * dir;
        // default: favorites pinned to the very top, then newest, attempted, alphabetical
        const aFav = favoriteExerciseIds.includes(a.id);
        const bFav = favoriteExerciseIds.includes(b.id);
        if (aFav !== bFav) return aFav ? -1 : 1;
        const aNew = isExerciseNew(a);
        const bNew = isExerciseNew(b);
        if (aNew !== bNew) return aNew ? -1 : 1;
        if (aNew && bNew) {
          const diff = new Date(b.addedAt!).getTime() - new Date(a.addedAt!).getTime();
          if (diff !== 0) return diff;
        }
        const aAttempted = !!progressMap.get(a.id);
        const bAttempted = !!progressMap.get(b.id);
        if (aAttempted !== bAttempted) return aAttempted ? -1 : 1;
        return exTitle(a).localeCompare(exTitle(b));
      });
  }, [searchQuery, selectedCategory, selectedDifficulty, selectedSkill, progressMap, sortKey, sortDir, favoriteExerciseIds]);

  const totalPages = Math.max(1, Math.ceil(filteredExercises.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageExercises = filteredExercises.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // reset to page 1 whenever filters change
  useEffect(() => { setPage(1); }, [searchQuery, selectedCategory, selectedDifficulty, selectedSkill, sortKey, sortDir]);

  const userAuth = useAppSelector(selectUserAuth);

  useEffect(() => {
    if (!userAuth || pageExercises.length === 0) return;

    const fetchRanks = async () => {
      setIsLoadingRanks(true);
      const rankPromises = pageExercises.map(async (ex) => {
        const progress = progressMap.get(ex.id);
        const score = progress?.micHighScore || progress?.earTrainingHighScore;
        if (score && score > 0) {
          const rank = await getExerciseUserRank(ex.id, score);
          if (rank !== null) {
            return { id: ex.id, rank };
          }
        }
        return null;
      });

      const results = await Promise.all(rankPromises);
      const newRanks: Record<string, number> = {};
      results.forEach(res => {
        if (res) newRanks[res.id] = res.rank;
      });
      setLeaderboardRanks(prev => ({ ...prev, ...newRanks }));
      setIsLoadingRanks(false);
    };

    if (pageExercises.length > 0) {
      fetchRanks();
    }
  }, [pageExercises, progressMap]);

  const buildChallenge = (exercise: typeof exercisesAgregat[0]): DashboardExercise => {
    const skillId = exercise.relatedSkills[0] || "general";
    const skillData = guitarSkills.find(s => s.id === skillId);
    const category = skillData?.category || (exercise.category !== "mixed" ? exercise.category : "technique");
    return {
      id: exercise.id,
      title: exercise.title as any,
      description: exercise.description as any,
      category: category as any,
      requiredSkillId: skillId,
      requiredLevel: exercise.difficulty === "hard" ? 2 : exercise.difficulty === "medium" ? 1 : 0,
      rewardDescription: "Practice complete",
      exercises: [exercise],
      unlockDescription: "",
      streakDays: 0,
      intensity: "medium",
      shortGoal: "",
      accentColor: "#ffffff",
      difficulty: exercise.difficulty,
      tablature: exercise.tablature,
    };
  };

  const handleToggleFavorite = (exerciseId: string) => {
    if (!userAuth) return;
    dispatch(toggleFavoriteExercise({ exerciseId, isFavorite: !favoriteExerciseIds.includes(exerciseId) }));
  };

  const renderSortHead = (
    col: Exclude<SortKey, "default">,
    label: string,
    align: "left" | "right" = "left",
  ) => {
    const active = sortKey === col;
    return (
      <th className={cn("px-3 py-3 text-[11px] font-bold capitalize tracking-wider text-zinc-500", align === "right" ? "text-right" : "text-left")}>
        <button
          onClick={() => toggleSort(col)}
          className={cn(
            "group/sort inline-flex items-center gap-1 rounded transition-colors hover:text-zinc-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-500",
            align === "right" && "flex-row-reverse",
            active && "text-zinc-300",
          )}
        >
          {label}
          {active ? (
            sortDir === "asc"
              ? <ChevronUp className="h-3 w-3 text-cyan-400" />
              : <ChevronDown className="h-3 w-3 text-cyan-400" />
          ) : (
            <ChevronsUpDown className="h-3 w-3 opacity-0 transition-opacity group-hover/sort:opacity-50" />
          )}
        </button>
      </th>
    );
  };

  return (
    <TooltipProvider delayDuration={300}>
    <div className="max-w-7xl mx-auto px-4 lg:px-6 w-full pt-6 pb-24 flex flex-col gap-5">

      {/* ── Filters bar ── */}
      <div className="flex flex-col gap-3 bg-zinc-900/60 rounded-lg px-5 py-4">

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search exercises…"
            className="w-full pl-9 pr-4 h-9 rounded-lg bg-zinc-800/70 border border-zinc-700/60 text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20 transition-colors"
          />
        </div>

        {/* Category */}
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-[10px] font-bold capitalize tracking-wider text-zinc-600 mr-1">Category</span>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={filterPill(selectedCategory === cat)}
            >
              {cat === "all" ? "All" : cat}
            </button>
          ))}
        </div>

        {/* Difficulty + Skill row */}
        <div className="flex flex-wrap gap-4">
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-[10px] font-bold capitalize tracking-wider text-zinc-600 mr-1">Difficulty</span>
            {DIFFICULTIES.map(diff => (
              <button
                key={diff}
                onClick={() => setSelectedDifficulty(diff)}
                className={filterPill(selectedDifficulty === diff)}
              >
                {diff === "all" ? "All" : diff}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-[10px] font-bold capitalize tracking-wider text-zinc-600 mr-1">Skill</span>
            <button
              onClick={() => setSelectedSkill("all")}
              className={filterPill(selectedSkill === "all")}
            >
              All
            </button>
            {availableSkills.map(skillId => {
              const skillData = guitarSkills.find(s => s.id === skillId);
              const Icon = skillData?.icon;
              return (
                <button
                  key={skillId}
                  onClick={() => setSelectedSkill(skillId)}
                  className={cn(filterPill(selectedSkill === skillId), "flex items-center gap-1")}
                >
                  {Icon && <Icon className="h-3 w-3 shrink-0" />}
                  {t(`skills:skills.${skillId}.name` as any)}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-xs text-zinc-500">
            {filteredExercises.length} exercise{filteredExercises.length !== 1 ? "s" : ""}
            {totalPages > 1 && <span className="ml-1 text-zinc-600">— page {safePage} / {totalPages}</span>}
          </p>
        </div>

        <div className="overflow-x-auto rounded-lg border border-zinc-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/80">
                <th className="text-left px-4 py-3 text-[11px] font-bold capitalize tracking-wider text-zinc-500">
                  <button
                    onClick={() => toggleSort("name")}
                    className={cn(
                      "group/sort inline-flex items-center gap-1 rounded transition-colors hover:text-zinc-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-500",
                      sortKey === "name" && "text-zinc-300",
                    )}
                  >
                    Name
                    {sortKey === "name" ? (
                      sortDir === "asc"
                        ? <ChevronUp className="h-3 w-3 text-cyan-400" />
                        : <ChevronDown className="h-3 w-3 text-cyan-400" />
                    ) : (
                      <ChevronsUpDown className="h-3 w-3 opacity-0 transition-opacity group-hover/sort:opacity-50" />
                    )}
                  </button>
                </th>
                <th className="text-left px-3 py-3 text-[11px] font-bold capitalize tracking-wider text-zinc-500">Category</th>
                {renderSortHead("difficulty", "Difficulty")}
                <th className="text-left px-3 py-3 text-[11px] font-bold capitalize tracking-wider text-zinc-500">Skill</th>
                {renderSortHead("time", "Time", "right")}
                <th className="text-left px-3 py-3 text-[11px] font-bold capitalize tracking-wider text-zinc-500 min-w-[120px]">Result</th>
                <th className="px-3 py-3 text-right text-[11px] font-bold capitalize tracking-wider text-zinc-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageExercises.map((exercise) => {
                const isLocked = !!exercise.premium && !isPremium;
                const progress = progressMap.get(exercise.id);
                const bpmStages = exercise.metronomeSpeed ? generateBpmStages(exercise.metronomeSpeed) : [];
                const completedBpms = progress?.completedBpms || [];
                const micScore = progress?.micHighScore;
                const earScore = progress?.earTrainingHighScore;
                const hasBpmProgress = bpmStages.length > 0 && completedBpms.length > 0;
                const hasBeenAttempted = !!progress && (
                  completedBpms.length > 0 ||
                  (micScore != null && micScore > 0) ||
                  (earScore != null && earScore > 0)
                );
                const title = typeof exercise.title === "string"
                  ? exercise.title
                  : (exercise.title as any)?.en ?? exercise.id;
                const isNew = isExerciseNew(exercise);
                const skillId = exercise.relatedSkills[0];
                const skillData = skillId ? guitarSkills.find(s => s.id === skillId) : null;
                const SkillIcon = skillData?.icon;
                const bpmPct = hasBpmProgress ? Math.round((completedBpms.length / bpmStages.length) * 100) : 0;
                const hasLeaderboard = bpmStages.length > 0 || !!exercise.riddleConfig || (!!exercise.tablature && exercise.tablature.length > 0);
                const maxBpm = completedBpms.length > 0 ? Math.max(...completedBpms) : null;
                const micAccuracy = progress?.micHighScoreAccuracy;
                const rank = leaderboardRanks[exercise.id];
                const isFavorite = favoriteExerciseIds.includes(exercise.id);
                const resultText = hasBpmProgress
                  ? `${maxBpm} BPM`
                  : micScore != null && micScore > 0
                    ? micAccuracy != null ? `${micAccuracy}%` : `${micScore} pts`
                    : earScore != null && earScore > 0
                      ? `${earScore} pts`
                      : null;

                return (
                  <tr
                    key={exercise.id}
                    onClick={() => setPreviewExercise(exercise as Exercise)}
                    className={cn(
                      "border-b border-zinc-800/50 cursor-pointer transition-colors",
                      hasBeenAttempted
                        ? "bg-zinc-900/60 hover:bg-zinc-800/80"
                        : "bg-zinc-950/40 hover:bg-zinc-900/60"
                    )}
                  >
                    {/* Name */}
                    <td className="px-4 py-3.5">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-2 cursor-pointer">
                            {hasBeenAttempted && (
                              <div className="flex-shrink-0 flex items-center justify-center bg-emerald-500/10 rounded-full h-4 w-4 border border-emerald-500/20">
                                <FaCheck className="h-2 w-2 text-emerald-400" />
                              </div>
                            )}
                            <span className={cn("font-semibold leading-snug", hasBeenAttempted ? "text-white" : "text-zinc-300")}>
                              {title}
                            </span>
                            {isNew && (
                              <span className="flex-shrink-0 inline-flex items-center gap-1.5 rounded-full bg-sky-500/10 px-2 py-0.5 ring-1 ring-inset ring-sky-500/20">
                                <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                                <span className="text-[9px] font-semibold uppercase tracking-wider text-sky-300">New</span>
                              </span>
                            )}
                            {isLocked && (
                              <span className="flex-shrink-0 flex items-center gap-1 rounded-full bg-amber-500/10 px-1.5 py-0.5 ring-1 ring-amber-500/25">
                                <Lock className="h-2.5 w-2.5 text-amber-500" />
                                <span className="text-[9px] font-bold capitalize tracking-wider text-amber-500">Pro</span>
                              </span>
                            )}
                          </div>
                        </TooltipTrigger>
                        {exercise.description && (
                          <TooltipContent side="right" className="max-w-[280px] whitespace-normal font-normal text-xs leading-relaxed">
                            {typeof exercise.description === "string"
                              ? exercise.description
                              : (exercise.description as any)?.en ?? ""}
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </td>

                    {/* Category */}
                    <td className="px-3 py-3.5">
                      <span className={cn("px-2 py-0.5 rounded text-[10px] font-medium capitalize tracking-wider border", CATEGORY_COLORS[exercise.category] ?? CATEGORY_COLORS.mixed)}>
                        {exercise.category}
                      </span>
                    </td>

                    {/* Difficulty */}
                    <td className="px-3 py-3.5">
                      <span className={cn("px-2 py-0.5 rounded text-[10px] font-medium capitalize tracking-wider border", DIFFICULTY_COLORS[exercise.difficulty])}>
                        {exercise.difficulty}
                      </span>
                    </td>

                    {/* Skill */}
                    <td className="px-3 py-3.5">
                      {SkillIcon ? (
                        <span className="flex items-center gap-1.5 text-zinc-400 text-xs">
                          <SkillIcon className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate max-w-[90px]">{t(`skills:skills.${skillId}.name` as any)}</span>
                        </span>
                      ) : (
                        <span className="text-zinc-600 text-xs">—</span>
                      )}
                    </td>

                    {/* Time */}
                    <td className="px-3 py-3.5 text-right text-zinc-500 text-xs tabular-nums whitespace-nowrap">
                      {exercise.timeInMinutes < 1
                        ? `${Math.round(exercise.timeInMinutes * 60)} s`
                        : `${exercise.timeInMinutes} min`
                      }
                    </td>

                    {/* Result (best score + leaderboard rank) */}
                    <td className="px-3 py-3.5">
                      {hasBeenAttempted && resultText != null ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={(e) => { e.stopPropagation(); if (hasLeaderboard) onShowLeaderboard(exercise.id, title); }}
                              className={cn(
                                "flex items-center gap-2 rounded transition-opacity focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-500",
                                hasLeaderboard ? "cursor-pointer hover:opacity-80" : "cursor-default"
                              )}
                              title={hasLeaderboard ? "View Leaderboard" : undefined}
                            >
                              {rank ? (
                                <span className={cn(
                                  "flex items-center justify-center min-w-[24px] h-6 px-1 rounded font-bold text-[11px]",
                                  rank === 1 ? "bg-amber-500/20 text-amber-500" :
                                  rank === 2 ? "bg-zinc-300/20 text-zinc-300" :
                                  rank === 3 ? "bg-amber-700/20 text-amber-600" :
                                  "bg-zinc-800/40 text-zinc-400"
                                )}>
                                  #{rank}
                                </span>
                              ) : isLoadingRanks ? (
                                <span className="h-6 w-6 rounded bg-zinc-800 animate-pulse" />
                              ) : null}
                              <span className="text-[11px] font-bold text-zinc-300 tabular-nums whitespace-nowrap">{resultText}</span>
                            </button>
                          </TooltipTrigger>
                          {hasBpmProgress && (
                            <TooltipContent side="top" className="font-normal text-xs">
                              <div className="flex flex-col gap-1.5">
                                <span className="text-zinc-200">{completedBpms.length} / {bpmStages.length} tempos · {bpmPct}%</span>
                                <div className="h-1 w-32 rounded-full bg-zinc-700 overflow-hidden">
                                  <div className="h-full rounded-full bg-cyan-400" style={{ width: `${bpmPct}%` }} />
                                </div>
                              </div>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      ) : (
                        <span className="text-zinc-700 text-xs ml-1">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-3 py-3.5">
                      <div className="flex items-center justify-end gap-1.5">
                        {userAuth && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleToggleFavorite(exercise.id); }}
                            className={cn(
                              "flex items-center justify-center h-7 w-7 rounded transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-rose-500/50",
                              isFavorite
                                ? "bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 hover:text-rose-300"
                                : "bg-zinc-800/40 text-zinc-400 hover:text-rose-300 hover:bg-rose-500/10"
                            )}
                            title={isFavorite ? "Remove from favorites" : "Add to favorites"}
                            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
                            aria-pressed={isFavorite}
                          >
                            <Heart size={13} className={cn(isFavorite && "fill-current")} />
                          </button>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); setPreviewExercise(exercise as Exercise); }}
                          className="flex items-center justify-center h-7 w-7 rounded bg-zinc-800/40 text-zinc-400 hover:text-white hover:bg-zinc-700/60 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-500"
                          title="Exercise details"
                        >
                          <Info size={13} />
                        </button>
                        {hasLeaderboard && (
                          <button
                            onClick={(e) => { e.stopPropagation(); onShowLeaderboard(exercise.id, title); }}
                            className="flex items-center justify-center h-7 w-7 rounded bg-zinc-800/40 text-zinc-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500/50"
                            title="Leaderboard"
                            aria-label="Leaderboard"
                          >
                            <Trophy size={13} />
                          </button>
                        )}
                        {isLocked ? (
                          <button
                            onClick={(e) => { e.stopPropagation(); onShowUpgrade(); }}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/10 text-amber-500 text-xs font-bold hover:bg-amber-500/20 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500/50"
                          >
                            <Lock size={10} />
                            Pro
                          </button>
                        ) : (
                          <button
                            onClick={(e) => { e.stopPropagation(); onStartExercise(buildChallenge(exercise)); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
                          >
                            <ChevronRight size={12} strokeWidth={2.5} />
                            Start
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredExercises.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-zinc-600 text-sm">
                    No exercises match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
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
                  const isGap = Math.abs(p - safePage) === 3;
                  return isGap ? (
                    <span key={p} className="text-zinc-600 text-xs px-1">…</span>
                  ) : null;
                }
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={cn(
                      "h-7 min-w-[28px] px-2 rounded text-xs font-semibold transition-all",
                      isActive
                        ? "bg-zinc-700 text-white"
                        : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800"
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

      <ExercisePreviewDialog
        exercise={previewExercise}
        onClose={() => setPreviewExercise(null)}
      />
    </div>
    </TooltipProvider>
  );
};
