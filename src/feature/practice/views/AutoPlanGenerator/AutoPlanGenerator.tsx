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

  // Helper function to display localized content
  const getLocalizedText = (content: LocalizedContent | string): string => {
    if (typeof content === "string") return content;
    return content[currentLang] || content.en;
  };

  const generatePlan = () => {
    const allExercises = [...exercisesAgregat].sort(() => Math.random() - 0.5);
    const selectedExercises: Exercise[] = [];
    let totalTime = 0;

    for (const exercise of allExercises) {
      if (totalTime + exercise.timeInMinutes <= time) {
        selectedExercises.push(exercise);
        totalTime += exercise.timeInMinutes;
      }

      if (totalTime >= time * 0.9) break;
    }

    // Determine the primary category by finding the most common category
    const categoryCount: Record<string, number> = {};
    selectedExercises.forEach((exercise) => {
      categoryCount[exercise.category] =
        (categoryCount[exercise.category] || 0) + 1;
    });

    const primaryCategory = Object.entries(categoryCount).sort(
      (a, b) => b[1] - a[1]
    )[0][0] as ExerciseCategory;

    // Calculate average difficulty level
    const difficultyValues = {
      easy: 1,
      medium: 2,
      hard: 3,
    };

    const avgDifficulty =
      selectedExercises.reduce(
        (sum, exercise) =>
          sum +
          difficultyValues[
            exercise.difficulty as keyof typeof difficultyValues
          ],
        0
      ) / selectedExercises.length;

    // Determine overall difficulty based on average
    let difficulty: DifficultyLevel = "easy";
    if (avgDifficulty > 2.3) difficulty = "hard";
    else if (avgDifficulty > 1.5) difficulty = "medium";

    // Create localized title and description
    const title: LocalizedContent = {
      pl: `Plan ${time} minut`,
      en: `${time} minute plan`,
    };

    const description: LocalizedContent = {
      pl: "Automatycznie wygenerowany plan ćwiczeń",
      en: "Automatically generated practice plan",
    };

    // Create the complete plan
    const newPlan: ExercisePlan = {
      id: "auto-" + Date.now(),
      title,
      description,
      difficulty,
      category: primaryCategory,
      exercises: selectedExercises,
      userId: "system",
    };

    setGeneratedPlan(newPlan);
  };

  // Render plan setup view (initial screen)
  const renderPlanSetup = () => (
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

  // Render exercise card
  const renderExerciseCard = (exercise: Exercise) => {
    const difficultyClasses = {
      easy: "bg-green-100 text-green-800",
      medium: "bg-yellow-100 text-yellow-800",
      hard: "bg-red-100 text-red-800",
    };

    return (
      <Card
        key={exercise.id}
        className='cursor-pointer overflow-hidden border border-border/50 transition-all hover:border-primary/50'
      >
        <div className='p-4'>
          <div className='flex items-center justify-between mb-2'>
            <h3 className='font-medium text-lg'>{getLocalizedText(exercise.title)}</h3>
            <div className='flex items-center gap-2'>
              <span className='text-sm text-muted-foreground'>
                <FaClock className='inline mr-1 h-3 w-3' /> 
                {exercise.timeInMinutes} {t("common:min")}
              </span>
              <span className={`text-xs px-2 py-1 rounded-full ${difficultyClasses[exercise.difficulty as keyof typeof difficultyClasses]}`}>
                {exercise.difficulty}
              </span>
            </div>
          </div>
          
          <div className='text-sm mb-2'>
            <span className='inline-block bg-gray-100 text-gray-800 rounded px-2 py-0.5 text-xs'>
              {exercise.category}
            </span>
          </div>
          
          {exercise.description && (
            <p className='text-sm text-muted-foreground mt-2'>
              {getLocalizedText(exercise.description)}
            </p>
          )}
          
          {exercise.goals && (
            <div className='mt-2'>
              <p className='text-xs font-medium'>Cele:</p>
              <ul className='text-xs text-muted-foreground list-disc pl-4 mt-1'>
                {exercise.goals.map((goal, idx) => (
                  <li key={idx}>{getLocalizedText(goal)}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Card>
    );
  };

  // Render generated plan view
  const renderGeneratedPlan = () => {
    if (!generatedPlan) return null;

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
            <Button variant='secondary' onClick={generatePlan}>
              {t("common:regenerate")}
            </Button>
            <Button onClick={() => onSelectPlan?.(generatedPlan)}>
              {t("common:start")}
            </Button>
          </div>
        </div>

        <Card className='p-6'>
          <h2 className='mb-4 text-xl font-semibold'>
            {getLocalizedText(generatedPlan.title)}
          </h2>
          <p className='mb-6 text-muted-foreground'>
            {getLocalizedText(generatedPlan.description)}
          </p>

          <div className='space-y-4'>
            {generatedPlan.exercises.map(renderExerciseCard)}
          </div>
        </Card>
      </div>
    );
  };

  // Main render logic
  return generatedPlan ? renderGeneratedPlan() : renderPlanSetup();
};
