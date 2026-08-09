import { Chip, chipVariants, getChipCustomStyle } from "assets/components/ui/chip";
import { Sheet, SheetContent, SheetTitle } from "assets/components/ui/sheet";
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
import { ChevronDown, ChevronLeft, ChevronRight, ChevronsUpDown, ChevronUp, Heart, Info, Lock,Search, SlidersHorizontal, Trophy, X } from "lucide-react";
import { useEffect,useMemo, useRef,useState } from "react";
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

// Hex values match this app's usual tinted-Chip look for hues that have no
// named Chip variant (see `getChipCustomStyle`).
const CATEGORY_HEX: Record<string, string> = {
  technique: "#60a5fa", // blue-400
  theory: "#a78bfa", // violet-400
  hearing: "#22d3ee", // cyan-400
  creativity: "#4ade80", // green-400
  mixed: "#a1a1aa", // zinc-400
};

const DIFFICULTY_HEX: Record<string, string> = {
  beginner: "#38bdf8", // sky-400
  easy: "#34d399", // emerald-400
  medium: "#fbbf24", // amber-400
  hard: "#fb7185", // rose-400
};

const CATEGORIES = ["all", "technique", "theory", "hearing", "creativity", "mixed"] as const;
const DIFFICULTIES = ["all", "beginner", "easy", "medium", "hard"] as const;

type SortKey = "default" | "name" | "difficulty" | "time";
const DIFFICULTY_RANK: Record<string, number> = { beginner: 0, easy: 1, medium: 2, hard: 3 };
const exTitle = (ex: { title: unknown; id: string }): string =>
  typeof ex.title === "string" ? ex.title : ((ex.title as any)?.en ?? ex.id);

const filterPill = (active: boolean, big = false) =>
  cn(
    chipVariants({ color: active ? "cyan" : "gray" }),
    "cursor-pointer whitespace-nowrap capitalize focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
    // The sheet's pills are finger-sized; the desktop bar keeps its compact look.
    big ? "px-3.5 py-2 text-xs" : "px-3 py-1 text-[11px]"
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
  // Mobile only - filters live in a bottom sheet so the list keeps the screen.
  // From `sm` up they are laid out inline and this stays unused.
  const [showFilters, setShowFilters] = useState(false);

  const activeFilterCount =
    (selectedCategory !== "all" ? 1 : 0) +
    (selectedDifficulty !== "all" ? 1 : 0) +
    (selectedSkill !== "all" ? 1 : 0);

  // The sheet is hidden from `sm` up, so a rotation/resize while it is open
  // would otherwise leave an invisible overlay swallowing clicks.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)");
    const onChange = (e: MediaQueryListEvent) => {
      if (e.matches) setShowFilters(false);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const listRef = useRef<HTMLDivElement>(null);

  // Paging from the bottom of a long phone list would otherwise leave the user
  // stranded at the end of the new page.
  const goToPage = (p: number) => {
    setPage(p);
    listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const clearFilters = () => {
    setSelectedCategory("all");
    setSelectedDifficulty("all");
    setSelectedSkill("all");
    setPage(1);
  };

  const toggleSort = (key: Exclude<SortKey, "default">) => {
    if (sortKey === key) {
      setSortDir(d => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setPage(1);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setPage(1);
  };

  const handleDifficultyChange = (difficulty: string) => {
    setSelectedDifficulty(difficulty);
    setPage(1);
  };

  const handleSkillChange = (skill: string) => {
    setSelectedSkill(skill);
    setPage(1);
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
  // Memoized so the rank-fetching effect below doesn't re-run on every render.
  const pageExercises = useMemo(
    () => filteredExercises.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filteredExercises, safePage]
  );

  const userAuth = useAppSelector(selectUserAuth);

  useEffect(() => {
    if (!userAuth || pageExercises.length === 0) return;

    const fetchRanks = async () => {
      setIsLoadingRanks(true);
      const rankPromises = pageExercises.map(async (ex) => {
        const progress = progressMap.get(ex.id);
        const score = progress?.micHighScore || progress?.earTrainingHighScore || progress?.clickHighScore;
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

  const handleStartPreview = () => {
    if (!previewExercise) return;
    const exercise = previewExercise;
    setPreviewExercise(null);
    if (exercise.premium && !isPremium) {
      onShowUpgrade();
      return;
    }
    onStartExercise(buildChallenge(exercise as typeof exercisesAgregat[0]));
  };

  // Pill sets shared by the desktop filter bar and the mobile filter sheet.
  const categoryPills = (big = false) =>
    CATEGORIES.map(cat => (
      <button key={cat} onClick={() => handleCategoryChange(cat)} className={filterPill(selectedCategory === cat, big)}>
        {cat === "all" ? "All" : cat}
      </button>
    ));

  const difficultyPills = (big = false) =>
    DIFFICULTIES.map(diff => (
      <button key={diff} onClick={() => handleDifficultyChange(diff)} className={filterPill(selectedDifficulty === diff, big)}>
        {diff === "all" ? "All" : diff}
      </button>
    ));

  const skillPills = (big = false) => [
    <button key="all" onClick={() => handleSkillChange("all")} className={filterPill(selectedSkill === "all", big)}>
      All
    </button>,
    ...availableSkills.map(skillId => {
      const Icon = guitarSkills.find(s => s.id === skillId)?.icon;
      return (
        <button
          key={skillId}
          onClick={() => handleSkillChange(skillId)}
          className={cn(filterPill(selectedSkill === skillId, big), "flex items-center gap-1")}
        >
          {Icon && <Icon className="h-3 w-3 shrink-0" />}
          {t(`skills:skills.${skillId}.name` as any)}
        </button>
      );
    }),
  ];

  const groupLabel = "text-[10px] font-bold capitalize tracking-wider text-zinc-500";

  // Shown under the search box on mobile so applied filters stay visible while
  // the sheet is closed - each chip removes its own filter.
  const activeFilterChips = [
    selectedCategory !== "all" && { key: "cat", label: selectedCategory, clear: () => handleCategoryChange("all") },
    selectedDifficulty !== "all" && { key: "diff", label: selectedDifficulty, clear: () => handleDifficultyChange("all") },
    selectedSkill !== "all" && {
      key: "skill",
      label: t(`skills:skills.${selectedSkill}.name` as any),
      clear: () => handleSkillChange("all"),
    },
  ].filter(Boolean) as { key: string; label: string; clear: () => void }[];

  // Everything both the desktop table row and the mobile card need, derived
  // once per exercise so the two layouts can't drift apart.
  const rows = pageExercises.map((exercise) => {
    const progress = progressMap.get(exercise.id);
    const bpmStages = exercise.metronomeSpeed ? generateBpmStages(exercise.metronomeSpeed) : [];
    const completedBpms = progress?.completedBpms || [];
    const micScore = progress?.micHighScore;
    const earScore = progress?.earTrainingHighScore;
    const clickScore = progress?.clickHighScore;
    const hasBpmProgress = bpmStages.length > 0 && completedBpms.length > 0;
    const micAccuracy = progress?.micHighScoreAccuracy;
    const clickAccuracy = progress?.clickHighScoreAccuracy;
    const maxBpm = completedBpms.length > 0 ? Math.max(...completedBpms) : null;
    const skillId = exercise.relatedSkills[0];

    return {
      exercise,
      isLocked: !!exercise.premium && !isPremium,
      title: typeof exercise.title === "string"
        ? exercise.title
        : (exercise.title as any)?.en ?? exercise.id,
      isNew: isExerciseNew(exercise),
      skillId,
      SkillIcon: skillId ? guitarSkills.find(s => s.id === skillId)?.icon : null,
      isFavorite: favoriteExerciseIds.includes(exercise.id),
      rank: leaderboardRanks[exercise.id],
      hasLeaderboard: bpmStages.length > 0 || !!exercise.riddleConfig || exercise.noteHuntConfig?.mode === "click" || (!!exercise.tablature && exercise.tablature.length > 0),
      hasBpmProgress,
      bpmStages,
      completedBpms,
      bpmPct: hasBpmProgress ? Math.round((completedBpms.length / bpmStages.length) * 100) : 0,
      hasBeenAttempted: !!progress && (
        completedBpms.length > 0 ||
        (micScore != null && micScore > 0) ||
        (earScore != null && earScore > 0) ||
        (clickScore != null && clickScore > 0)
      ),
      resultText: hasBpmProgress
        ? `${maxBpm} BPM`
        : micScore != null && micScore > 0
          ? micAccuracy != null ? `${micAccuracy}%` : `${micScore} pts`
          : earScore != null && earScore > 0
            ? `${earScore} pts`
            : clickScore != null && clickScore > 0
              ? clickAccuracy != null ? `${clickAccuracy}%` : `${clickScore} pts`
              : null,
    };
  });

  const rankClass = (rank: number) =>
    rank === 1 ? "bg-amber-500/20 text-amber-500" :
    rank === 2 ? "bg-zinc-300/20 text-zinc-300" :
    rank === 3 ? "bg-amber-700/20 text-amber-600" :
    "bg-zinc-800/40 text-zinc-400";

  const renderSortHead = (
    col: Exclude<SortKey, "default">,
    label: string,
    align: "left" | "right" = "left",
    widthClass?: string,
  ) => {
    const active = sortKey === col;
    return (
      <th className={cn("px-3 pb-2 text-[11px] font-bold capitalize tracking-wider text-zinc-500", widthClass, align === "right" ? "text-right" : "text-left")}>
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
    <div className="max-w-7xl mx-auto px-4 lg:px-6 w-full pt-5 sm:pt-6 pb-24 flex flex-col gap-5 sm:gap-6">

      {/* ── Filters bar ── */}
      <div className="flex flex-col gap-3 sm:gap-4 bg-zinc-900/60 rounded-lg p-3 sm:p-5">

        {/* Search + (mobile) filters trigger */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
            <input
              value={searchQuery}
              onChange={e => handleSearchChange(e.target.value)}
              placeholder="Search exercises…"
              // text-base on mobile stops iOS Safari zooming in on focus.
              className="w-full pl-9 pr-9 h-11 sm:h-9 rounded-lg bg-zinc-800/70 text-base sm:text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => handleSearchChange("")}
                className="absolute right-1 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded text-zinc-500 hover:text-zinc-300 transition-colors"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(true)}
            className={cn(
              "sm:hidden flex shrink-0 items-center gap-1.5 h-11 px-3.5 rounded-lg text-xs font-bold transition-colors",
              activeFilterCount > 0 ? "bg-cyan-500/15 text-cyan-400" : "bg-zinc-800/70 text-zinc-400"
            )}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filters
            {activeFilterCount > 0 && (
              <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-cyan-500/25 px-1 text-[10px] tabular-nums">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Active filters stay visible on mobile while the sheet is closed */}
        {activeFilterChips.length > 0 && (
          <div className="flex sm:hidden flex-wrap gap-1.5">
            {activeFilterChips.map(chip => (
              <button
                key={chip.key}
                onClick={chip.clear}
                className={cn(filterPill(true), "flex items-center gap-1 pr-2")}
              >
                {chip.label}
                <X className="h-3 w-3 opacity-60" />
              </button>
            ))}
          </div>
        )}

        {/* Desktop: filters inline */}
        <div className="hidden sm:flex flex-col gap-4">
          <div className="flex flex-wrap gap-2 items-center">
            <span className={cn(groupLabel, "mr-1")}>Category</span>
            {categoryPills()}
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="flex flex-wrap gap-2 items-center">
              <span className={cn(groupLabel, "mr-1")}>Difficulty</span>
              {difficultyPills()}
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              <span className={cn(groupLabel, "mr-1")}>Skill</span>
              {skillPills()}
            </div>
          </div>

          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="self-start flex items-center gap-1.5 text-[11px] font-bold text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <X className="h-3 w-3" />
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Mobile: filters live in a bottom sheet so the list keeps the screen */}
      <Sheet open={showFilters} onOpenChange={setShowFilters}>
        <SheetContent
          side="bottom"
          className="sm:hidden flex max-h-[85vh] flex-col gap-0 rounded-t-2xl bg-zinc-950 p-0"
        >
          <SheetTitle className="px-5 pt-5 pb-2 text-lg font-bold text-white">Filters</SheetTitle>

          <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4 flex flex-col gap-6">
            <div className="flex flex-col gap-2.5">
              <span className={groupLabel}>Category</span>
              <div className="flex flex-wrap gap-2">{categoryPills(true)}</div>
            </div>
            <div className="flex flex-col gap-2.5">
              <span className={groupLabel}>Difficulty</span>
              <div className="flex flex-wrap gap-2">{difficultyPills(true)}</div>
            </div>
            <div className="flex flex-col gap-2.5">
              <span className={groupLabel}>Skill</span>
              <div className="flex flex-wrap gap-2">{skillPills(true)}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 px-5 pt-4 pb-6 bg-zinc-950">
            <button
              onClick={clearFilters}
              disabled={activeFilterCount === 0}
              className="h-11 px-4 rounded-lg bg-zinc-900 text-sm font-bold text-zinc-400 transition-colors disabled:opacity-40"
            >
              Clear
            </button>
            <button
              onClick={() => setShowFilters(false)}
              className="flex-1 h-11 rounded-lg bg-zinc-100 text-sm font-bold text-zinc-950 transition-colors active:bg-zinc-300"
            >
              Show {filteredExercises.length} exercise{filteredExercises.length !== 1 ? "s" : ""}
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Table ── */}
      <div ref={listRef} className="flex flex-col gap-3 scroll-mt-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-zinc-500">
            {filteredExercises.length} exercise{filteredExercises.length !== 1 ? "s" : ""}
            {totalPages > 1 && <span className="ml-1">— page {safePage} / {totalPages}</span>}
          </p>

          {/* The card layout has no sortable headers, so mobile gets its own sort pills. */}
          <div className="flex lg:hidden items-center gap-1.5">
            <span className="text-[10px] font-bold capitalize tracking-wider text-zinc-500">Sort</span>
            {([["name", "Name"], ["difficulty", "Level"], ["time", "Time"]] as const).map(([key, label]) => {
              const active = sortKey === key;
              return (
                <button
                  key={key}
                  onClick={() => toggleSort(key)}
                  className={cn(
                    "flex items-center gap-1 rounded px-2 py-1 text-[11px] font-bold transition-colors",
                    active ? "bg-zinc-800 text-zinc-200" : "text-zinc-500"
                  )}
                >
                  {label}
                  {active && (sortDir === "asc"
                    ? <ChevronUp className="h-3 w-3 text-cyan-400" />
                    : <ChevronDown className="h-3 w-3 text-cyan-400" />)}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Mobile / tablet: cards ── */}
        <div className="flex flex-col gap-2 lg:hidden">
          {rows.map(({
            exercise, isLocked, title, isNew, skillId, SkillIcon, isFavorite, rank,
            hasLeaderboard, hasBeenAttempted, resultText,
          }) => (
            <div
              key={exercise.id}
              onClick={() => setPreviewExercise(exercise as Exercise)}
              className={cn(
                "flex items-center gap-3 rounded-lg py-3 pl-3.5 pr-3 transition-colors cursor-pointer select-none",
                hasBeenAttempted ? "bg-zinc-900/70 active:bg-zinc-800/70" : "bg-zinc-900/30 active:bg-zinc-900/60"
              )}
            >
              <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                {/* Title */}
                <div className="flex items-start gap-2">
                  {hasBeenAttempted && (
                    <div className="mt-[3px] flex-shrink-0 flex items-center justify-center bg-emerald-500/10 rounded-full h-4 w-4">
                      <FaCheck className="h-2 w-2 text-emerald-400" />
                    </div>
                  )}
                  <span className={cn("min-w-0 text-[15px] font-semibold leading-snug line-clamp-2", hasBeenAttempted ? "text-white" : "text-zinc-300")}>
                    {title}
                  </span>
                </div>

                {/* Meta: badges, then plain text so the row stays quiet */}
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  {isNew && (
                    <Chip color="cyan" className="flex-shrink-0 px-1.5 py-0 text-[9px] tracking-wider">New</Chip>
                  )}
                  {isLocked && (
                    <span className="flex-shrink-0 flex items-center gap-1 rounded-full bg-amber-500/10 px-1.5 py-0.5 ring-1 ring-amber-500/25">
                      <Lock className="h-2.5 w-2.5 text-amber-500" />
                      <span className="text-[9px] font-bold capitalize tracking-wider text-amber-500">Pro</span>
                    </span>
                  )}
                  <Chip
                    color="custom"
                    style={getChipCustomStyle(CATEGORY_HEX[exercise.category] ?? CATEGORY_HEX.mixed)}
                    className="px-1.5 py-0 text-[10px] capitalize tracking-wider"
                  >
                    {exercise.category}
                  </Chip>
                  <Chip
                    color="custom"
                    style={getChipCustomStyle(DIFFICULTY_HEX[exercise.difficulty])}
                    className="px-1.5 py-0 text-[10px] capitalize tracking-wider"
                  >
                    {exercise.difficulty}
                  </Chip>
                  {SkillIcon && (
                    <span className="flex items-center gap-1 text-[11px] text-zinc-500 min-w-0">
                      <SkillIcon className="h-3 w-3 shrink-0" />
                      <span className="truncate">{t(`skills:skills.${skillId}.name` as any)}</span>
                    </span>
                  )}
                  <span className="text-[11px] text-zinc-500 tabular-nums whitespace-nowrap">
                    {exercise.timeInMinutes < 1
                      ? `${Math.round(exercise.timeInMinutes * 60)} s`
                      : `${exercise.timeInMinutes} min`}
                  </span>
                </div>

                {/* Result + secondary actions share one row to keep cards short */}
                <div className="flex items-center gap-1">
                  {hasBeenAttempted && resultText != null && (
                    <button
                      onClick={(e) => { e.stopPropagation(); if (hasLeaderboard) onShowLeaderboard(exercise.id, title); }}
                      className="flex items-center gap-1.5 pr-2 rounded"
                    >
                      {rank && (
                        <span className={cn("flex items-center justify-center min-w-[22px] h-5 px-1 rounded font-bold text-[11px]", rankClass(rank))}>
                          #{rank}
                        </span>
                      )}
                      <span className="text-[11px] font-bold text-zinc-300 tabular-nums whitespace-nowrap">{resultText}</span>
                    </button>
                  )}
                  {userAuth && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleToggleFavorite(exercise.id); }}
                      className={cn(
                        "flex items-center justify-center h-8 w-8 -ml-1.5 rounded transition-colors",
                        isFavorite ? "text-rose-400" : "text-zinc-600 active:text-zinc-400"
                      )}
                      aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
                      aria-pressed={isFavorite}
                    >
                      <Heart size={15} className={cn(isFavorite && "fill-current")} />
                    </button>
                  )}
                  {hasLeaderboard && !hasBeenAttempted && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onShowLeaderboard(exercise.id, title); }}
                      className="flex items-center justify-center h-8 w-8 rounded text-zinc-600 active:text-zinc-400 transition-colors"
                      aria-label="Leaderboard"
                    >
                      <Trophy size={15} />
                    </button>
                  )}
                </div>
              </div>

              {/* Primary action, thumb-height and vertically centred */}
              {isLocked ? (
                <button
                  onClick={(e) => { e.stopPropagation(); onShowUpgrade(); }}
                  className="flex shrink-0 items-center gap-1 h-10 px-4 rounded-lg bg-amber-500/10 text-amber-500 text-xs font-bold transition-colors active:bg-amber-500/20"
                >
                  <Lock size={12} />
                  Pro
                </button>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); onStartExercise(buildChallenge(exercise)); }}
                  className="flex shrink-0 items-center gap-0.5 h-10 pl-3 pr-4 rounded-lg bg-zinc-100 text-zinc-950 text-xs font-bold transition-colors active:bg-zinc-300"
                >
                  <ChevronRight size={14} strokeWidth={2.5} />
                  Start
                </button>
              )}
            </div>
          ))}

          {filteredExercises.length === 0 && (
            <div className="flex flex-col items-center gap-4 rounded-lg bg-zinc-900/40 px-4 py-12 text-center">
              <p className="text-zinc-500 text-sm">No exercises match the current filters.</p>
              {(activeFilterCount > 0 || searchQuery) && (
                <button
                  onClick={() => { clearFilters(); handleSearchChange(""); }}
                  className="h-9 px-4 rounded-lg bg-zinc-800 text-xs font-bold text-zinc-200 transition-colors active:bg-zinc-700"
                >
                  Reset filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Desktop: table ── */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full min-w-[980px] table-fixed border-separate border-spacing-y-3 text-sm">
            <thead>
              <tr>
                <th className="text-left px-4 pb-2 text-[11px] font-bold capitalize tracking-wider text-zinc-500">
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
                <th className="w-28 text-left px-3 pb-2 text-[11px] font-bold capitalize tracking-wider text-zinc-500">Category</th>
                {renderSortHead("difficulty", "Difficulty", "left", "w-28")}
                <th className="w-36 text-left px-3 pb-2 text-[11px] font-bold capitalize tracking-wider text-zinc-500">Skill</th>
                {renderSortHead("time", "Time", "right", "w-20")}
                <th className="w-32 text-left px-3 pb-2 text-[11px] font-bold capitalize tracking-wider text-zinc-500">Result</th>
                <th className="w-56 px-3 pb-2 text-right text-[11px] font-bold capitalize tracking-wider text-zinc-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({
                exercise, isLocked, title, isNew, skillId, SkillIcon, isFavorite, rank,
                hasLeaderboard, hasBeenAttempted, resultText, hasBpmProgress, bpmStages,
                completedBpms, bpmPct,
              }) => {
                const cellBg = cn(
                  "border-y border-zinc-800 transition-colors",
                  hasBeenAttempted
                    ? "bg-zinc-900/60 group-hover:bg-zinc-800/60"
                    : "bg-zinc-950/40 group-hover:bg-zinc-900/60"
                );

                return (
                  <tr
                    key={exercise.id}
                    onClick={() => setPreviewExercise(exercise as Exercise)}
                    className="group cursor-pointer"
                  >
                    {/* Name */}
                    <td className={cn(cellBg, "rounded-l-lg border-l py-4 pl-4 pr-3")}>
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
                              <Chip color="cyan" className="flex-shrink-0 px-2 py-0.5 text-[9px] tracking-wider">
                                New
                              </Chip>
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
                    <td className={cn(cellBg, "px-3 py-4")}>
                      <Chip
                        color="custom"
                        style={getChipCustomStyle(CATEGORY_HEX[exercise.category] ?? CATEGORY_HEX.mixed)}
                        className="px-2 py-0.5 text-[10px] capitalize tracking-wider"
                      >
                        {exercise.category}
                      </Chip>
                    </td>

                    {/* Difficulty */}
                    <td className={cn(cellBg, "px-3 py-4")}>
                      <Chip
                        color="custom"
                        style={getChipCustomStyle(DIFFICULTY_HEX[exercise.difficulty])}
                        className="px-2 py-0.5 text-[10px] capitalize tracking-wider"
                      >
                        {exercise.difficulty}
                      </Chip>
                    </td>

                    {/* Skill */}
                    <td className={cn(cellBg, "px-3 py-4")}>
                      {SkillIcon ? (
                        <span className="flex items-center gap-1.5 text-zinc-400 text-xs">
                          <SkillIcon className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate max-w-[90px]">{t(`skills:skills.${skillId}.name` as any)}</span>
                        </span>
                      ) : (
                        <span className="text-zinc-500 text-xs">—</span>
                      )}
                    </td>

                    {/* Time */}
                    <td className={cn(cellBg, "px-3 py-4 text-right text-zinc-400 text-xs tabular-nums whitespace-nowrap")}>
                      {exercise.timeInMinutes < 1
                        ? `${Math.round(exercise.timeInMinutes * 60)} s`
                        : `${exercise.timeInMinutes} min`
                      }
                    </td>

                    {/* Result (best score + leaderboard rank) */}
                    <td className={cn(cellBg, "px-3 py-4")}>
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
                        <span className="text-zinc-500 text-xs ml-1">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className={cn(cellBg, "rounded-r-lg border-r py-4 pl-3 pr-4")}>
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
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-amber-500/10 text-amber-500 text-xs font-bold hover:bg-amber-500/20 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500/50"
                          >
                            <Lock size={10} />
                            Pro
                          </button>
                        ) : (
                          <button
                            onClick={(e) => { e.stopPropagation(); onStartExercise(buildChallenge(exercise)); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
                  <td colSpan={7} className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-12 text-center text-zinc-500 text-sm">
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
              onClick={() => goToPage(Math.max(1, safePage - 1))}
              disabled={safePage === 1}
              className="flex items-center gap-1.5 h-9 sm:h-auto px-4 sm:px-3 sm:py-1.5 rounded bg-zinc-800/50 text-zinc-400 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-30 hover:enabled:bg-zinc-800 hover:enabled:text-zinc-200"
            >
              <ChevronLeft size={13} />
              Previous
            </button>

            {/* Numbered pages need too much room on a phone - show a counter instead. */}
            <span className="sm:hidden text-xs font-semibold text-zinc-400 tabular-nums">
              {safePage} / {totalPages}
            </span>

            <div className="hidden sm:flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => {
                const isActive = p === safePage;
                const isNear = Math.abs(p - safePage) <= 2 || p === 1 || p === totalPages;
                if (!isNear) {
                  const isGap = Math.abs(p - safePage) === 3;
                  return isGap ? (
                    <span key={p} className="text-zinc-500 text-xs px-1">…</span>
                  ) : null;
                }
                return (
                  <button
                    key={p}
                    onClick={() => goToPage(p)}
                    className={cn(
                      "h-7 min-w-[28px] px-2 rounded text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
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
              onClick={() => goToPage(Math.min(totalPages, safePage + 1))}
              disabled={safePage === totalPages}
              className="flex items-center gap-1.5 h-9 sm:h-auto px-4 sm:px-3 sm:py-1.5 rounded bg-zinc-800/50 text-zinc-400 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-30 hover:enabled:bg-zinc-800 hover:enabled:text-zinc-200"
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
        onStart={handleStartPreview}
      />
    </div>
    </TooltipProvider>
  );
};
