import { Input } from "assets/components/ui/input";
import { cn } from "assets/lib/utils";
import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { guitarSkills } from "feature/skills/data/guitarSkills";
import type { GuitarSkillId } from "feature/skills/skills.types";
import { useTranslation } from "hooks/useTranslation";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { FaFilter,FaSearch } from "react-icons/fa";

interface ExerciseFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  selectedDifficulty: string;
  onDifficultyChange: (difficulty: string) => void;
  selectedSkill: string;
  onSkillChange: (skill: string) => void;
  availableSkills: GuitarSkillId[];
  groupedExercises: Record<string, Exercise[]>;
}

export const ExerciseFilters = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedDifficulty,
  onDifficultyChange,
  selectedSkill,
  onSkillChange,
  availableSkills,
  groupedExercises,
}: ExerciseFiltersProps) => {
  const { t } = useTranslation(["common", "exercises", "skills"]);
  const [isSkillOpen, setIsSkillOpen] = useState(false);

  const difficulties = ["all", "easy", "medium", "hard"];

  return (
    <div className='flex flex-col gap-6 relative'>
      <div className='relative w-full group'>
        <FaSearch className='absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 group-focus-within:text-cyan-400 transition-colors duration-300' />
        <Input
          placeholder={t("common:search.placeholder")}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className='pl-11 h-[42px] bg-white/[0.03] backdrop-blur-md border border-white/5 rounded-[8px] text-[13px] text-zinc-200 placeholder:text-zinc-500 focus:border-cyan-500/30 focus:bg-white/[0.05] focus:ring-1 focus:ring-cyan-500/20 shadow-sm transition-all duration-300'
          aria-label='Search exercises'
        />
      </div>
      
      <div className="space-y-5">
        {/* Category Pills */}
        <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-0.5">
                <FaFilter className="h-2.5 w-2.5 opacity-70" />
                <span>{t("common:filters.category")}</span>
            </div>
            <div className="flex flex-wrap gap-2">
                <button
                    onClick={() => onCategoryChange("all")}
                    className={cn(
                        "px-3.5 py-1.5 rounded-[8px] text-[11px] scale-100 active:scale-95 font-medium transition-all duration-300 border backdrop-blur-md",
                        selectedCategory === "all"
                            ? "bg-cyan-500/15 border-cyan-500/30 text-cyan-300 shadow-[0_0_10px_-2px_rgba(6,182,212,0.2)]"
                            : "bg-white/[0.03] border-white/5 text-zinc-400 hover:bg-white/10 hover:border-white/10 hover:text-zinc-200"
                    )}
                >
                    {t("common:filters.all")}
                </button>
                {Object.keys(groupedExercises).map((category) => (
                    <button
                        key={category}
                        onClick={() => onCategoryChange(category)}
                        className={cn(
                            "px-3.5 py-1.5 rounded-[8px] text-[11px] scale-100 active:scale-95 font-medium transition-all duration-300 border backdrop-blur-md flex items-center shadow-sm",
                            selectedCategory === category
                                ? "bg-cyan-500/15 border-cyan-500/30 text-cyan-300 shadow-[0_0_10px_-2px_rgba(6,182,212,0.2)]"
                                : "bg-white/[0.03] border-white/5 text-zinc-400 hover:bg-white/10 hover:border-white/10 hover:text-zinc-200"
                        )}
                    >
                        {t(`common:categories.${category}` as any)}
                        <span className={cn(
                            "ml-1.5 px-1.5 py-0.5 rounded-[4px] text-[9px] font-bold transition-colors duration-300",
                            selectedCategory === category ? "bg-cyan-500/20 text-cyan-300" : "bg-zinc-800/80 text-zinc-500 group-hover:bg-zinc-700"
                        )}>
                            {groupedExercises[category].length}
                        </span>
                    </button>
                ))}
            </div>
        </div>

        {/* Difficulty Pills */}
        <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-0.5">
                {t("common:filters.difficulty")}
            </span>
            <div className="flex flex-wrap gap-2">
                {difficulties.map((diff) => (
                    <button
                        key={diff}
                        onClick={() => onDifficultyChange(diff)}
                        className={cn(
                            "px-3.5 py-1.5 rounded-[8px] text-[11px] scale-100 active:scale-95 font-medium transition-all duration-300 border capitalize backdrop-blur-md shadow-sm",
                            selectedDifficulty === diff
                                ? "bg-cyan-500/15 border-cyan-500/30 text-cyan-300 shadow-[0_0_10px_-2px_rgba(6,182,212,0.2)]"
                                : "bg-white/[0.03] border-white/5 text-zinc-400 hover:bg-white/10 hover:border-white/10 hover:text-zinc-200"
                        )}
                    >
                        {diff === "all" ? t("common:filters.all") : t(`common:difficulty.${diff}` as any)}
                    </button>
                ))}
            </div>
        </div>

        {/* Skill Filter — collapsible dropdown */}
        {availableSkills.length > 1 && (() => {
          const activeSkillData = selectedSkill !== "all" ? guitarSkills.find(s => s.id === selectedSkill) : null;
          const ActiveIcon = activeSkillData?.icon;
          return (
            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => setIsSkillOpen(v => !v)}
                className={cn(
                  "flex items-center justify-between w-full px-4 py-2.5 rounded-[8px] text-[11px] scale-100 active:scale-[0.99] font-medium transition-all duration-300 border backdrop-blur-md shadow-sm",
                  selectedSkill !== "all"
                    ? "bg-cyan-500/15 border-cyan-500/30 text-cyan-300 shadow-[0_0_10px_-2px_rgba(6,182,212,0.2)]"
                    : "bg-white/[0.03] border-white/5 text-zinc-400 hover:bg-white/10 hover:border-white/10 hover:text-zinc-200"
                )}
              >
                <div className="flex items-center gap-2 uppercase tracking-wider text-[10px] font-bold">
                  <FaFilter className="h-2.5 w-2.5 opacity-70" />
                  <span>Skill</span>
                  {activeSkillData && (
                    <span className="flex items-center gap-1.5 normal-case tracking-normal text-[11px] font-semibold bg-cyan-500/20 px-2 py-0.5 rounded-[4px] ml-1">
                      {ActiveIcon && <ActiveIcon className="h-3 w-3" />}
                      {t(`skills:skills.${selectedSkill}.name` as any)}
                    </span>
                  )}
                </div>
                <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-300 opacity-70", isSkillOpen && "rotate-180")} />
              </button>

              {isSkillOpen && (
                <div className="flex flex-wrap gap-2 pl-1 mt-1 animate-in fade-in slide-in-from-top-2 duration-200">
                  <button
                    onClick={() => { onSkillChange("all"); setIsSkillOpen(false); }}
                    className={cn(
                      "px-3.5 py-1.5 rounded-[8px] text-[11px] scale-100 active:scale-95 font-medium transition-all duration-300 border backdrop-blur-md shadow-sm",
                      selectedSkill === "all"
                        ? "bg-cyan-500/15 border-cyan-500/30 text-cyan-300 shadow-[0_0_10px_-2px_rgba(6,182,212,0.2)]"
                        : "bg-white/[0.03] border-white/5 text-zinc-400 hover:bg-white/10 hover:border-white/10 hover:text-zinc-200"
                    )}
                  >
                    {t("common:filters.all")}
                  </button>
                  {availableSkills.map((skill) => {
                    const skillData = guitarSkills.find((s) => s.id === skill);
                    const Icon = skillData?.icon;
                    return (
                      <button
                        key={skill}
                        onClick={() => { onSkillChange(skill); setIsSkillOpen(false); }}
                        className={cn(
                          "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[8px] text-[11px] scale-100 active:scale-95 font-medium transition-all duration-300 border backdrop-blur-md shadow-sm",
                          selectedSkill === skill
                            ? "bg-cyan-500/15 border-cyan-500/30 text-cyan-300 shadow-[0_0_10px_-2px_rgba(6,182,212,0.2)]"
                            : "bg-white/[0.03] border-white/5 text-zinc-400 hover:bg-white/10 hover:border-white/10 hover:text-zinc-200"
                        )}
                      >
                        {Icon && <Icon className="h-3 w-3 shrink-0 opacity-80" />}
                        {t(`skills:skills.${skill}.name` as any)}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
};
