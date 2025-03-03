import { Button } from "assets/components/ui/button";
import { Card } from "assets/components/ui/card";
import { Slider } from "assets/components/ui/slider";
import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FaClock } from "react-icons/fa";

import type {
  DifficultyLevel,
  Exercise,
  ExerciseCategory,
  ExercisePlan,
  LocalizedContent,
} from "../../../exercisePlan/types/exercise.types";

interface AutoPlanGeneratorProps {
  onBack: () => void;
  onSelectPlan?: (plan: ExercisePlan) => void;
}

export const AutoPlanGenerator = ({
  onBack,
  onSelectPlan,
}: AutoPlanGeneratorProps) => {
  const { t, i18n } = useTranslation(["exercises", "common"]);
  const currentLang = i18n.language as keyof LocalizedContent;
  const [time, setTime] = useState(30);
  const [generatedPlan, setGeneratedPlan] = useState<ExercisePlan | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(
    null
  );

  const generatePlan = () => {
    // Przykładowa logika generowania planu
    const allExercises = exercisesAgregat;
    const selectedExercises = allExercises
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.floor(time / 15)); // Zakładamy, że każde ćwiczenie trwa około 15 minut

    // Determine the primary category based on exercises
    const categoryCount: Record<string, number> = {};
    selectedExercises.forEach((exercise) => {
      categoryCount[exercise.category] =
        (categoryCount[exercise.category] || 0) + 1;
    });

    const primaryCategory = Object.entries(categoryCount).sort(
      (a, b) => b[1] - a[1]
    )[0][0] as ExerciseCategory;

    // Determine difficulty level based on exercises
    const difficultyLevels = {
      beginner: 1,
      intermediate: 2,
      advanced: 3,
    };

    const avgDifficulty =
      selectedExercises.reduce(
        (acc, exercise) =>
          acc +
          difficultyLevels[
            exercise.difficulty as keyof typeof difficultyLevels
          ],
        0
      ) / selectedExercises.length;

    let difficulty: DifficultyLevel = "beginner";
    if (avgDifficulty > 2.3) difficulty = "advanced";
    else if (avgDifficulty > 1.5) difficulty = "intermediate";

    // Tworzymy tytuł i opis jako obiekty LocalizedContent
    const title: LocalizedContent = {
      pl: `Plan ${time} minut`,
      en: `${time} minute plan`,
    };

    const description: LocalizedContent = {
      pl: "Automatycznie wygenerowany plan ćwiczeń",
      en: "Automatically generated practice plan",
    };

    const newPlan: ExercisePlan = {
      id: "auto-" + Date.now(),
      title,
      description,
      difficulty,
      category: primaryCategory,
      exercises: selectedExercises,
      totalDuration: time,
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: "system",
    };

    setGeneratedPlan(newPlan);
  };

  if (generatedPlan) {
    return (
      <div className='mx-auto mt-3 max-w-3xl space-y-6 font-openSans'>
        <div className='mb-8 flex items-center justify-between'>
          <h1 className='text-3xl font-bold'>
            {t("exercises:auto_plan.generated_plan")}
          </h1>
          <div className='flex gap-2'>
            <Button variant='outline' onClick={() => setGeneratedPlan(null)}>
              {t("common:back")}
            </Button>
            <Button onClick={() => onSelectPlan?.(generatedPlan)}>
              {t("common:start")}
            </Button>
          </div>
        </div>

        <Card className='p-6'>
          <h2 className='mb-4 text-xl font-semibold'>
            {typeof generatedPlan.title === "string"
              ? generatedPlan.title
              : generatedPlan.title[currentLang] || generatedPlan.title.en}
          </h2>
          <p className='mb-6 text-muted-foreground'>
            {typeof generatedPlan.description === "string"
              ? generatedPlan.description
              : generatedPlan.description[currentLang] ||
                generatedPlan.description.en}
          </p>

          <div className='space-y-4'>
            {generatedPlan.exercises.map((exercise) => (
              <Card
                key={exercise.id}
                className='cursor-pointer overflow-hidden border border-border/50 transition-all hover:border-primary/50'
                onClick={() => setSelectedExercise(exercise)}>
                <div className='flex items-center justify-between p-4'>
                  <div>
                    <h3 className='font-medium'>
                      {typeof exercise.title === "string"
                        ? exercise.title
                        : exercise.title[currentLang] || exercise.title.en}
                    </h3>
                    <p className='text-sm text-muted-foreground'>
                      {exercise.timeInMinutes} {t("common:min")}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className='mx-auto max-w-2xl space-y-8 py-12 font-openSans'>
      <div className='text-center'>
        <h1 className='text-3xl font-bold'>{t("exercises:auto_plan.title")}</h1>
        <p className='mt-2 text-muted-foreground'>
          {t("exercises:auto_plan.description")}
        </p>
      </div>

      <Card className='p-6'>
        <div className='mb-6 space-y-4'>
          <h2 className='text-xl font-semibold'>
            {t("exercises:auto_plan.duration")}
          </h2>
          <div className='flex items-center gap-4'>
            <FaClock className='h-5 w-5 text-muted-foreground' />
            <Slider
              value={[time]}
              min={15}
              max={120}
              step={15}
              onValueChange={(value) => setTime(value[0])}
              className='flex-1'
            />
            <span className='w-16 text-right font-medium'>
              {time} {t("common:min")}
            </span>
          </div>
        </div>

        <div className='flex justify-end'>
          <div className='space-x-2'>
            <Button variant='outline' onClick={onBack}>
              {t("common:back")}
            </Button>
            <Button onClick={generatePlan}>
              {t("exercises:auto_plan.generate")}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
