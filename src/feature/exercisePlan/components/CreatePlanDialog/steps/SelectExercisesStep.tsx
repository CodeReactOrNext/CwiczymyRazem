import { Badge } from "assets/components/ui/badge";
import { Button } from "assets/components/ui/button";
import { Card } from "assets/components/ui/card";
import { Input } from "assets/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "assets/components/ui/select";
import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import { guitarSkills } from "feature/skills/data/guitarSkills";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaCheck, FaClock, FaSearch, FaTimes } from "react-icons/fa";

import type { Exercise } from "../../../types/exercise.types";

interface SelectExercisesStepProps {
  selectedExercises: Exercise[];
  onExercisesSelect: (exercises: Exercise[]) => void;
  onNext: () => void;
}

export const SelectExercisesStep = ({
  selectedExercises,
  onExercisesSelect,
  onNext,
}: SelectExercisesStepProps) => {
  const { t, i18n } = useTranslation(["exercises", "common"]);
  const currentLang = i18n.language as "pl" | "en";
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const exercises = exercisesAgregat;
  const groupedExercises = exercises.reduce((acc, exercise) => {
    const category = exercise.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(exercise);
    return acc;
  }, {} as Record<string, Exercise[]>);

  const handleExerciseToggle = (exercise: Exercise) => {
    if (selectedExercises.find((e) => e.id === exercise.id)) {
      onExercisesSelect(selectedExercises.filter((e) => e.id !== exercise.id));
    } else {
      onExercisesSelect([...selectedExercises, exercise]);
    }
  };

  const totalDuration = useMemo(
    () =>
      selectedExercises.reduce(
        (total, exercise) => total + exercise.timeInMinutes,
        0
      ),
    [selectedExercises]
  );

  const filteredExercises = exercises.filter((exercise) => {
    const matchesSearch = exercise.title[currentLang]
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || exercise.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold'>
            {t("exercises:my_plans.create_dialog.exercises")}
          </h2>
          <p className='mt-2 text-sm text-muted-foreground'>
            {t("exercises:my_plans.create_dialog.select_exercises_description")}
          </p>
        </div>
        <div className='flex items-center gap-2 text-muted-foreground'>
          <FaClock className='h-4 w-4' />
          <span>{totalDuration} min</span>
        </div>
      </div>

      {selectedExercises.length > 0 && (
        <div className='rounded-lg border border-border bg-muted/30 p-4'>
          <h3 className='mb-3 text-sm font-medium text-muted-foreground'>
            {t("exercises:my_plans.create_dialog.selected_exercises", {
              count: selectedExercises.length,
            })}
          </h3>
          <div className='flex flex-wrap gap-2'>
            {selectedExercises.map((exercise) => (
              <div
                key={exercise.id}
                className='group flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-sm'>
                <span className='max-w-[150px] truncate'>
                  {exercise.title[currentLang]}
                </span>
                <div className='flex items-center gap-1 text-muted-foreground'>
                  <FaClock className='h-3 w-3' />
                  <span>{exercise.timeInMinutes} min</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleExerciseToggle(exercise);
                  }}
                  className='text-muted-foreground hover:text-foreground'>
                  <FaTimes className='h-3 w-3' />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className='flex gap-4'>
        <div className='relative flex-1'>
          <FaSearch className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
          <Input
            placeholder={t("common:search.placeholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='pl-10'
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className='w-[180px]'>
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

      <div className='grid gap-4 md:grid-cols-2'>
        {filteredExercises.map((exercise) => {
          const isSelected = selectedExercises.some(
            (e) => e.id === exercise.id
          );
          const skills = exercise.relatedSkills
            .map((skillId) => guitarSkills.find((s) => s.id === skillId))
            .filter(Boolean);

          return (
            <Card
              key={exercise.id}
              className={`cursor-pointer transition-colors hover:bg-accent ${
                isSelected ? "border-primary bg-primary/5" : ""
              }`}
              onClick={() => handleExerciseToggle(exercise)}>
              <div className='relative p-4'>
                {isSelected && (
                  <div className='absolute right-4 top-4'>
                    <FaCheck className='h-4 w-4 text-primary' />
                  </div>
                )}
                <h3 className='font-medium'>{exercise.title[currentLang]}</h3>
                <p className='mt-1 text-sm text-muted-foreground'>
                  {exercise.description[currentLang]}
                </p>
                <div className='mt-4 flex flex-wrap items-center gap-2'>
                  <Badge variant='secondary'>
                    {t(`common:categories.${exercise.category}`)}
                  </Badge>
                  <div className='flex items-center gap-1 text-sm text-muted-foreground'>
                    <FaClock className='h-3 w-3' />
                    <span>{exercise.timeInMinutes} min</span>
                  </div>
                  {skills.map((skill) => (
                    <Badge
                      key={skill?.id}
                      variant='outline'
                      className='text-xs'>
                      {skill ? t(`common:skills.${skill.id}` as any) : ""}
                    </Badge>
                  ))}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className='flex justify-end'>
        <Button
          onClick={onNext}
          disabled={selectedExercises.length === 0}
          className='w-full md:w-auto'>
          {t("common:next")}
        </Button>
      </div>
    </motion.div>
  );
};
