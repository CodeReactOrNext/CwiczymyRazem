import { Input } from "assets/components/ui/input";
import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { useTranslation } from "hooks/useTranslation";
import { FaSearch, FaFilter } from "react-icons/fa";
import { cn } from "assets/lib/utils";

interface ExerciseFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  selectedDifficulty: string;
  onDifficultyChange: (difficulty: string) => void;
  groupedExercises: Record<string, Exercise[]>;
}

export const ExerciseFilters = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedDifficulty,
  onDifficultyChange,
  groupedExercises,
}: ExerciseFiltersProps) => {
  const { t } = useTranslation(["common", "exercises"]);

  const difficulties = ["all", "easy", "medium", "hard"];

  return (
    <div className='flex flex-col gap-6'>
      <div className='relative w-full'>
        <FaSearch className='absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500' />
        <Input
          placeholder={t("common:search.placeholder")}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className='pl-11 h-12 bg-zinc-900/50 border-white/10 rounded-xl focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20'
          aria-label='Search exercises'
        />
      </div>
      
      <div className="space-y-4">
        {/* Category Pills */}
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">
                <FaFilter className="h-2.5 w-2.5" />
                <span>{t("common:filters.category")}</span>
            </div>
            <div className="flex flex-wrap gap-2">
                <button
                    onClick={() => onCategoryChange("all")}
                    className={cn(
                        "px-4 py-2 rounded-lg text-xs font-bold transition-all border",
                        selectedCategory === "all"
                            ? "bg-cyan-500/10 border-cyan-500/50 text-cyan-400"
                            : "bg-zinc-900/50 border-white/5 text-zinc-500 hover:border-white/10 hover:text-zinc-400"
                    )}
                >
                    {t("common:filters.all")}
                </button>
                {Object.keys(groupedExercises).map((category) => (
                    <button
                        key={category}
                        onClick={() => onCategoryChange(category)}
                        className={cn(
                            "px-4 py-2 rounded-lg text-xs font-bold transition-all border",
                            selectedCategory === category
                                ? "bg-cyan-500/10 border-cyan-500/50 text-cyan-400"
                                : "bg-zinc-900/50 border-white/5 text-zinc-500 hover:border-white/10 hover:text-zinc-400"
                        )}
                    >
                        {t(`common:categories.${category}` as any)}
                        <span className="ml-1.5 opacity-50 font-medium">
                            {groupedExercises[category].length}
                        </span>
                    </button>
                ))}
            </div>
        </div>

        {/* Difficulty Pills */}
        <div className="flex flex-col gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                {t("common:filters.difficulty")}
            </span>
            <div className="flex flex-wrap gap-2">
                {difficulties.map((diff) => (
                    <button
                        key={diff}
                        onClick={() => onDifficultyChange(diff)}
                        className={cn(
                            "px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all border capitalize",
                            selectedDifficulty === diff
                                ? "bg-white border-white text-black"
                                : "bg-zinc-950/50 border-white/5 text-zinc-500 hover:border-white/10 hover:text-zinc-400"
                        )}
                    >
                        {diff === "all" ? t("common:filters.all") : t(`common:difficulty.${diff}` as any)}
                    </button>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};
