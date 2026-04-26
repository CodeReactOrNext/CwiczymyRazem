import { cn } from "assets/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "assets/components/ui/tooltip";
import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import type { BpmProgressData } from "feature/exercisePlan/services/bpmProgressService";
import { generateBpmStages } from "feature/exercisePlan/utils/generateBpmStages";
import { ExercisePreviewDialog } from "feature/exercisePlan/components/CreatePlanDialog/steps/SelectExercisesStep/components/ExercisePreviewDialog";
import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { guitarSkills } from "feature/skills/data/guitarSkills";
import type { GuitarSkillId } from "feature/skills/skills.types";
import { useTranslation } from "hooks/useTranslation";
import { ChevronLeft, ChevronRight, Ear, Info, Mic, Search, Lock } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { FaCheck } from "react-icons/fa";
import type { DashboardExercise } from "./SkillDashboard";

interface ExerciseBrowseTabProps {
  progressMap: Map<string, BpmProgressData>;
  isPremium: boolean;
  onStartExercise: (challenge: DashboardExercise) => void;
  onShowUpgrade: () => void;
}

const PAGE_SIZE = 15;

const CATEGORY_COLORS: Record<string, string> = {
  technique: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  theory: "bg-violet-500/15 text-violet-400 border-violet-500/20",
  hearing: "bg-cyan-500/15 text-cyan-400 border-cyan-500/20",
  creativity: "bg-green-500/15 text-green-400 border-green-500/20",
  mixed: "bg-zinc-500/15 text-zinc-400 border-zinc-500/20",
};

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  medium: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  hard: "bg-rose-500/15 text-rose-400 border-rose-500/20",
};

const CATEGORIES = ["all", "technique", "theory", "hearing", "creativity", "mixed"] as const;
const DIFFICULTIES = ["all", "easy", "medium", "hard"] as const;

const filterPill = (active: boolean) =>
  cn(
    "px-3 py-1 rounded-lg text-[11px] font-semibold border transition-all capitalize whitespace-nowrap",
    active
      ? "bg-cyan-500/15 border-cyan-500/30 text-cyan-300"
      : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
  );

export const ExerciseBrowseTab = ({
  progressMap,
  isPremium,
  onStartExercise,
  onShowUpgrade,
}: ExerciseBrowseTabProps) => {
  const { t } = useTranslation(["common", "skills"]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [selectedSkill, setSelectedSkill] = useState("all");
  const [page, setPage] = useState(1);
  const [previewExercise, setPreviewExercise] = useState<Exercise | null>(null);

  const availableSkills = useMemo(() => {
    const skillSet = new Set<GuitarSkillId>();
    exercisesAgregat.forEach(ex => ex.relatedSkills.forEach(s => skillSet.add(s as GuitarSkillId)));
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
        const aAttempted = !!progressMap.get(a.id);
        const bAttempted = !!progressMap.get(b.id);
        if (aAttempted !== bAttempted) return aAttempted ? -1 : 1;
        const aTitle = typeof a.title === "string" ? a.title : (a.title as any)?.en ?? "";
        const bTitle = typeof b.title === "string" ? b.title : (b.title as any)?.en ?? "";
        return aTitle.localeCompare(bTitle);
      });
  }, [searchQuery, selectedCategory, selectedDifficulty, selectedSkill, progressMap]);

  const totalPages = Math.max(1, Math.ceil(filteredExercises.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageExercises = filteredExercises.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // reset to page 1 whenever filters change
  useEffect(() => { setPage(1); }, [searchQuery, selectedCategory, selectedDifficulty, selectedSkill]);

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
      requiredLevel: exercise.difficulty === "easy" ? 0 : exercise.difficulty === "medium" ? 1 : 2,
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

  return (
    <TooltipProvider delayDuration={300}>
    <div className="max-w-7xl mx-auto px-4 lg:px-6 w-full pt-6 pb-24 flex flex-col gap-5">

      {/* ── Filters bar ── */}
      <div className="flex flex-col gap-3 bg-zinc-900/60 border border-zinc-800 rounded-xl px-5 py-4">

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search exercises…"
            className="w-full pl-9 pr-4 h-9 rounded-lg bg-zinc-800/70 border border-zinc-700/60 text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20 transition-all"
          />
        </div>

        {/* Category */}
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 mr-1">Category</span>
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
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 mr-1">Difficulty</span>
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
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 mr-1">Skill</span>
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

        <div className="overflow-x-auto rounded-xl border border-zinc-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/80">
                <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-zinc-500">Name</th>
                <th className="text-left px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-zinc-500">Category</th>
                <th className="text-left px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-zinc-500">Difficulty</th>
                <th className="text-left px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-zinc-500">Skill</th>
                <th className="text-left px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-zinc-500">BPM</th>
                <th className="text-left px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-zinc-500">Min</th>
                <th className="text-left px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-zinc-500 min-w-[160px]">Progress</th>
                <th className="px-3 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-zinc-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageExercises.map((exercise) => {
                const isLocked = !!exercise.premium && !isPremium;
                const progress = progressMap.get(exercise.id);
                const bpmStages = exercise.metronomeSpeed ? generateBpmStages(exercise.metronomeSpeed) : [];
                const completedBpms = progress?.completedBpms || [];
                const micScore = progress?.micHighScore;
                const micAccuracy = progress?.micHighScoreAccuracy;
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
                const skillId = exercise.relatedSkills[0];
                const skillData = skillId ? guitarSkills.find(s => s.id === skillId) : null;
                const SkillIcon = skillData?.icon;
                const bpmPct = hasBpmProgress ? Math.round((completedBpms.length / bpmStages.length) * 100) : 0;

                return (
                  <tr
                    key={exercise.id}
                    className={cn(
                      "border-b border-zinc-800/50 transition-colors",
                      hasBeenAttempted
                        ? "bg-zinc-900/60 hover:bg-zinc-800/80"
                        : "bg-zinc-950/40 hover:bg-zinc-900/60"
                    )}
                  >
                    {/* Name */}
                    <td className="px-4 py-3.5">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-2 max-w-[220px] cursor-default">
                            {hasBeenAttempted && (
                              <div className="flex-shrink-0 flex items-center justify-center bg-emerald-500/10 rounded-full h-4 w-4 border border-emerald-500/20">
                                <FaCheck className="h-2 w-2 text-emerald-400" />
                              </div>
                            )}
                            <span className={cn("font-semibold leading-snug truncate", hasBeenAttempted ? "text-white" : "text-zinc-300")}>
                              {title}
                            </span>
                            {isLocked && (
                              <span className="flex-shrink-0 flex items-center gap-1 rounded-full bg-amber-500/10 px-1.5 py-0.5 ring-1 ring-amber-500/25">
                                <Lock className="h-2.5 w-2.5 text-amber-500" />
                                <span className="text-[9px] font-bold uppercase tracking-wider text-amber-500">Pro</span>
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
                      <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border", CATEGORY_COLORS[exercise.category] ?? CATEGORY_COLORS.mixed)}>
                        {exercise.category}
                      </span>
                    </td>

                    {/* Difficulty */}
                    <td className="px-3 py-3.5">
                      <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border", DIFFICULTY_COLORS[exercise.difficulty])}>
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

                    {/* BPM */}
                    <td className="px-3 py-3.5 text-zinc-500 text-xs font-mono whitespace-nowrap">
                      {exercise.metronomeSpeed
                        ? `${exercise.metronomeSpeed.min}–${exercise.metronomeSpeed.max}`
                        : <span className="text-zinc-700">—</span>
                      }
                    </td>

                    {/* Min */}
                    <td className="px-3 py-3.5 text-zinc-500 text-xs">
                      {exercise.timeInMinutes}
                    </td>

                    {/* Progress */}
                    <td className="px-3 py-3.5">
                      {!hasBeenAttempted ? (
                        <span className="text-zinc-700 text-xs">—</span>
                      ) : (
                        <div className="flex flex-col gap-1.5">
                          {hasBpmProgress && (
                            <div className="flex flex-col gap-0.5">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[11px] font-bold text-main-400 tabular-nums">
                                  {completedBpms.length}/{bpmStages.length} BPM
                                </span>
                                <span className="text-[10px] text-zinc-600">({bpmPct}%)</span>
                              </div>
                              <div className="h-1 w-24 rounded-full bg-zinc-800 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-main-500 transition-all"
                                  style={{ width: `${bpmPct}%` }}
                                />
                              </div>
                            </div>
                          )}
                          {micScore != null && micScore > 0 && (
                            <div className="flex items-center gap-1.5">
                              <Mic className="h-3 w-3 text-amber-500/80 shrink-0" />
                              <span className="text-[11px] font-semibold text-amber-400 tabular-nums">
                                {micScore.toLocaleString()} pts
                              </span>
                              {micAccuracy != null && (
                                <span className="text-[10px] text-amber-600">({micAccuracy}%)</span>
                              )}
                            </div>
                          )}
                          {earScore != null && earScore > 0 && (
                            <div className="flex items-center gap-1.5">
                              <Ear className="h-3 w-3 text-cyan-400/80 shrink-0" />
                              <span className="text-[11px] font-semibold text-cyan-400 tabular-nums">
                                {earScore.toLocaleString()} pts
                              </span>
                            </div>
                          )}
                          {!hasBpmProgress && micScore == null && earScore == null && (
                            <span className="text-[11px] text-emerald-400 font-semibold">Done</span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-3 py-3.5">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={(e) => { e.stopPropagation(); setPreviewExercise(exercise as Exercise); }}
                          className="flex items-center justify-center h-7 w-7 rounded-lg border border-zinc-700/60 bg-zinc-800/40 text-zinc-400 hover:text-white hover:border-zinc-600 hover:bg-zinc-700/60 transition-all"
                          title="Exercise details"
                        >
                          <Info size={13} />
                        </button>
                        {isLocked ? (
                          <button
                            onClick={onShowUpgrade}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-bold hover:bg-amber-500/20 transition-colors"
                          >
                            <Lock size={10} />
                            Pro
                          </button>
                        ) : (
                          <button
                            onClick={() => onStartExercise(buildChallenge(exercise))}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-bold transition-all scale-95 hover:scale-100"
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
                  <td colSpan={8} className="px-4 py-12 text-center text-zinc-600 text-sm">
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 text-xs font-semibold disabled:opacity-30 hover:enabled:border-zinc-700 hover:enabled:text-zinc-200 transition-all"
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
                      "h-7 min-w-[28px] px-2 rounded-md text-xs font-semibold transition-all",
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 text-xs font-semibold disabled:opacity-30 hover:enabled:border-zinc-700 hover:enabled:text-zinc-200 transition-all"
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
