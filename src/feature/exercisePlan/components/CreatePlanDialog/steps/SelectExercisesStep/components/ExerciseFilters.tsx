import { Input } from "assets/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "assets/components/ui/select";
import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { useTranslation } from "hooks/useTranslation";
import { FaSearch } from "react-icons/fa";

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

  return (
    <div className='flex flex-col gap-4'>
      <div className='relative w-full'>
        <FaSearch className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
        <Input
          placeholder={t("common:search.placeholder")}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className='pl-10 h-11 bg-zinc-900/50 border-white/10'
          aria-label='Search exercises'
        />
      </div>
      
      <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
        {/* Category Filter */}
        <Select value={selectedCategory} onValueChange={onCategoryChange}>
          <SelectTrigger className='h-10 bg-zinc-900/50 border-white/10'>
            <SelectValue placeholder={t("common:filters.category")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>{t("common:filters.all")}</SelectItem>
            {Object.keys(groupedExercises).map((category) => (
              <SelectItem key={category} value={category}>
                {t(`common:categories.${category}` as any)}
                <span className='ml-2 text-[10px] text-muted-foreground'>
                  ({groupedExercises[category].length})
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Difficulty Filter */}
        <Select value={selectedDifficulty} onValueChange={onDifficultyChange}>
          <SelectTrigger className='h-10 bg-zinc-900/50 border-white/10'>
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All difficulties</SelectItem>
            <SelectItem value='easy'>Easy</SelectItem>
            <SelectItem value='medium'>Medium</SelectItem>
            <SelectItem value='hard'>Hard</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
