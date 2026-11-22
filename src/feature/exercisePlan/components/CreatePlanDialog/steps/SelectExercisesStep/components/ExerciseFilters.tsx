import { PRESSABLE } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { SearchInput } from "components/SearchInput/SearchInput";
import { SegmentedControl } from "components/SegmentedControl/SegmentedControl";
import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { guitarSkills } from "feature/skills/data/guitarSkills";
import type { GuitarSkillId } from "feature/skills/skills.types";
import { useTranslation } from "hooks/useTranslation";
import { ChevronDown, Funnel, SlidersHorizontal } from "lucide-react";
import { useState } from "react";

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
  const { t } = useTranslation(["common", "exercises", "skills", "plans"]);
  const [isSkillOpen, setIsSkillOpen] = useState(false);
  const activeExtraFilters =
    (selectedDifficulty !== "all" ? 1 : 0) + (selectedSkill !== "all" ? 1 : 0);
  // Difficulty and skill are the rarer filters — folded away so the first
  // screen reaches the exercise list.
  const [showMore, setShowMore] = useState(activeExtraFilters > 0);

  const difficulties = ["all", "beginner", "easy", "medium", "hard"];

  return (
    <div className='flex flex-col gap-4 relative'>
      <div className='flex items-center gap-2'>
      <SearchInput
        containerClassName='flex-1'
        placeholder={t("common:search.placeholder")}
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        aria-label={t("plans:search_exercises")}
      />
        <button
          type='button'
          onClick={() => setShowMore((v) => !v)}
          aria-expanded={showMore}
          className={cn(PRESSABLE, "border-b-black/30", 
            "flex h-10 shrink-0 items-center gap-2 rounded-lg px-4 text-xs font-semibold transition-colors",
            showMore || activeExtraFilters > 0
              ? "bg-zinc-800 text-zinc-50 hover:bg-zinc-700"
              : "bg-white/[0.05] text-zinc-300 hover:bg-white/10 hover:text-white"
          )}>
          <SlidersHorizontal className='h-3.5 w-3.5' />
          {t("plans:filters")}
          {activeExtraFilters > 0 && (
            <span className='rounded bg-zinc-700 px-1.5 text-xs font-semibold tabular-nums'>{activeExtraFilters}</span>
          )}
        </button>
      </div>
      
      <div className="space-y-5">
        {/* Category Pills */}
        <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 mb-0.5">
                <Funnel className="h-3 w-3 opacity-70" />
                <span>{t("common:filters.category")}</span>
            </div>
            <SegmentedControl
                label={t("common:filters.category")}
                selected={[selectedCategory]}
                onSelect={onCategoryChange}
                options={[
                    { value: "all", label: t("common:filters.all") },
                    ...Object.keys(groupedExercises).map((category) => ({
                        value: category,
                        label: t(`common:categories.${category}` as any),
                        count: groupedExercises[category].length,
                    })),
                ]}
            />
        </div>

        {showMore && (
        <>
        {/* Difficulty Pills */}
        <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-zinc-400 mb-0.5">
                {t("common:filters.difficulty")}
            </span>
            <SegmentedControl
                label={t("common:filters.difficulty")}
                selected={[selectedDifficulty]}
                onSelect={onDifficultyChange}
                options={difficulties.map((diff) => ({
                    value: diff,
                    label: diff === "all" ? t("common:filters.all") : t(`common:difficulty.${diff}` as any),
                }))}
            />
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
                  "flex items-center justify-between w-full px-4 py-2.5 rounded-lg text-xs font-medium transition-colors duration-base",
                  selectedSkill !== "all"
                    ? "bg-zinc-800 text-zinc-100"
                    : "bg-white/[0.05] text-zinc-300 hover:bg-white/10 hover:text-white"
                )}
              >
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <Funnel className="h-3 w-3 opacity-70" />
                  <span>{t("plans:skill")}</span>
                  {activeSkillData && (
                    <span className="flex items-center gap-1.5 text-xs font-semibold bg-zinc-700 px-2 py-0.5 rounded ml-1">
                      {ActiveIcon && <ActiveIcon className="h-3 w-3" />}
                      {t(`skills:skills.${selectedSkill}.name` as any)}
                    </span>
                  )}
                </div>
                <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-base opacity-70", isSkillOpen && "rotate-180")} />
              </button>

              {isSkillOpen && (
                <div className="mt-1 animate-in fade-in slide-in-from-top-2 duration-base">
                  <SegmentedControl
                    label={t("plans:skill")}
                    selected={[selectedSkill]}
                    onSelect={(skill) => { onSkillChange(skill); setIsSkillOpen(false); }}
                    options={[
                      { value: "all", label: t("common:filters.all") },
                      ...availableSkills.map((skill) => {
                        const Icon = guitarSkills.find((s) => s.id === skill)?.icon;
                        return {
                          value: skill as string,
                          label: t(`skills:skills.${skill}.name` as any),
                          icon: Icon ? <Icon className="h-3.5 w-3.5 shrink-0 opacity-80" /> : undefined,
                        };
                      }),
                    ]}
                  />
                </div>
              )}
            </div>
          );
        })()}
        </>
        )}
      </div>
    </div>
  );
};
