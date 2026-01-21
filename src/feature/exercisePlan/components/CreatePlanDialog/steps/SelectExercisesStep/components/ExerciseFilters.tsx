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
  groupedExercises: Record<string, Exercise[]>;
}

export const ExerciseFilters = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  groupedExercises,
}: ExerciseFiltersProps) => {
  const { t } = useTranslation(["common"]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value);
  };

  return (
    <div className='flex flex-col gap-4 sm:flex-row'>
      <div className='relative flex-1'>
        <FaSearch className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
        <Input
          placeholder={t("common:search.placeholder")}
          value={searchQuery}
          onChange={handleSearchChange}
          className='pl-10'
          aria-label='Search exercises'
        />
      </div>
      <Select value={selectedCategory} onValueChange={onCategoryChange}>
        <SelectTrigger className='w-full sm:w-[180px]'>
          <SelectValue placeholder={t("common:filters.category")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='all'>{t("common:filters.all")}</SelectItem>
          {Object.keys(groupedExercises).map((category) => (
            <SelectItem key={category} value={category}>
              {t(`common:categories.${category}` as any)}
              <span className='ml-2 text-muted-foreground'>
                ({groupedExercises[category].length})
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
