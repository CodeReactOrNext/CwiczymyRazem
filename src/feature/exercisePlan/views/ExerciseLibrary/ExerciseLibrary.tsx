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
import type {
  Exercise,
  ExercisePlan,
  LocalizedContent,
} from "feature/exercisePlan/types/exercise.types";
import { useRouter } from "next/router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { v4 as uuidv4 } from "uuid";

interface ExerciseLibraryProps {
  onPlanSelect?: (plan: ExercisePlan) => void;
}

export const ExerciseLibrary = ({ onPlanSelect }: ExerciseLibraryProps) => {
  const { t, i18n } = useTranslation("exercises");
  const router = useRouter();
  const currentLang = i18n.language as keyof LocalizedContent;

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isCreating, setIsCreating] = useState(false);

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

  const handleCreateExercise = async (exerciseData: Omit<Exercise, "id">) => {
    try {
      const newExercise: Exercise = {
        ...exerciseData,
        id: uuidv4(),
      };

      // Tutaj logika zapisywania do bazy danych

      setIsCreating(false);
    } catch (error) {
      console.error("Error creating exercise:", error);
    }
  };

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
            <SelectItem value='beginner'>{t("difficulty.beginner")}</SelectItem>
            <SelectItem value='intermediate'>
              {t("difficulty.intermediate")}
            </SelectItem>
            <SelectItem value='advanced'>{t("difficulty.advanced")}</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className='sm:w-[180px]'>
            <SelectValue placeholder={t("filters.category")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>{t("filters.all")}</SelectItem>
            <SelectItem value='technique'>
              {t("filters.categories.technique")}
            </SelectItem>
            <SelectItem value='theory'>
              {t("filters.categories.theory")}
            </SelectItem>
            <SelectItem value='creativity'>
              {t("filters.categories.creativity")}
            </SelectItem>
            <SelectItem value='hearing'>
              {t("filters.categories.hearing")}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
        {filteredExercises.map((exercise) => (
          <ExerciseCard
            key={exercise.id}
            exercise={exercise}
          />
        ))}
      </div>
{/* 
      {isCreating && (
        <CreateExerciseDialog
          isOpen={isCreating}
          onClose={() => setIsCreating(false)}
          onCreateExercise={handleCreateExercise}
        />
      )} */}
    </div>
  );
};
