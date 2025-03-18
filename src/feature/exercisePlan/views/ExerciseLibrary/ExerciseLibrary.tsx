import { Input } from "assets/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "assets/components/ui/select";
import { ExerciseCard } from "feature/exercisePlan/components/ExerciseCard";
import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import type { LocalizedContent } from "feature/exercisePlan/types/exercise.types";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export const ExerciseLibrary = () => {
  const { t, i18n } = useTranslation("exercises");
  const currentLang = i18n.language as keyof LocalizedContent;

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const filteredExercises = exercisesAgregat.filter((exercise) => {
    if (!exercise || !exercise.title) return false;

    const matchesSearch = exercise.title[currentLang]
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesDifficulty =
      selectedDifficulty === "all" ||
      exercise.difficulty === selectedDifficulty;
    const matchesCategory =
      selectedCategory === "all" || exercise.category === selectedCategory;

    return matchesSearch && matchesDifficulty && matchesCategory;
  });

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h2 className='text-2xl font-bold'>{t("library.title")}</h2>
      </div>

      <div className='flex flex-col gap-4 sm:flex-row'>
        <Input
          placeholder={t("library.search_placeholder")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className='sm:w-[200px]'
        />

        <Select
          value={selectedDifficulty}
          onValueChange={setSelectedDifficulty}>
          <SelectTrigger className='sm:w-[180px]'>
            <SelectValue placeholder={t("filters.difficulty")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>{t("filters.all")}</SelectItem>
            <SelectItem value='easy'>{t("difficulty.easy")}</SelectItem>
            <SelectItem value='medium'>{t("difficulty.medium")}</SelectItem>
            <SelectItem value='hard'>{t("difficulty.hard")}</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className='sm:w-[180px]'>
            <SelectValue placeholder={t("filters.category")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>{t("filters.all")}</SelectItem>
            <SelectItem value='technique'>
              {t("categories.technique")}
            </SelectItem>
            <SelectItem value='theory'>{t("categories.theory")}</SelectItem>
            <SelectItem value='creativity'>
              {t("categories.creativity")}
            </SelectItem>
            <SelectItem value='hearing'>{t("categories.hearing")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
        {filteredExercises.map((exercise) => (
          <ExerciseCard key={exercise.id} exercise={exercise} />
        ))}
      </div>
    </div>
  );
};
