import { Button } from "assets/components/ui/button";
import { Card } from "assets/components/ui/card";
import { Slider } from "assets/components/ui/slider";
import MainContainer from "components/MainContainer";
import { PageHeader } from "constants/PageHeader";
import type { DifficultyLevel, ExerciseCategory } from "feature/exercisePlan/types/exercise.types";
import { useTranslation } from "hooks/useTranslation";

interface PlanSetupProps {
  time: number;
  setTime: (time: number) => void;
  selectedCategories: ExerciseCategory[];
  setSelectedCategories: (categories: ExerciseCategory[]) => void;
  selectedDifficulty: DifficultyLevel | "all";
  setSelectedDifficulty: (difficulty: DifficultyLevel | "all") => void;
  onBack: () => void;
  onGenerate: () => void;
}

export const PlanSetup = ({
  time,
  setTime,
  selectedCategories,
  setSelectedCategories,
  selectedDifficulty,
  setSelectedDifficulty,
  onBack,
  onGenerate,
}: PlanSetupProps) => {
  const { t } = useTranslation(["exercises", "common"]);

  const toggleCategory = (category: ExerciseCategory) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  const categories: ExerciseCategory[] = [
    "technique",
    "theory",
    "creativity",
    "hearing",
  ];

  const difficulties: (DifficultyLevel | "all")[] = ["easy", "medium", "hard", "all"];

  return (
    <MainContainer>
      <div className='mx-auto max-w-3xl space-y-8 p-8 font-openSans'>
        <PageHeader
          title={t("exercises:auto_plan.title")}
          description={t("exercises:auto_plan.description")}
          onBack={onBack}
        />

        <Card className='space-y-8 p-6'>
        {/* Duration Section */}
        <div className='space-y-4'>
          <h2 className='text-xl font-semibold'>
            {t("exercises:auto_plan.duration")}
          </h2>

          <div className='flex flex-col gap-4 sm:flex-row sm:items-center'>
            <div className='flex w-full flex-1 items-center gap-2'>
              <Button
                variant='outline'
                size='icon'
                className='h-9 w-9 flex-shrink-0'
                onClick={() => setTime(Math.max(15, time - 15))}
                disabled={time <= 15}>
                <span className='text-lg'>-</span>
              </Button>

              <div className='relative flex-1 py-4'>
                <Slider
                  value={[time]}
                  min={15}
                  max={120}
                  step={15}
                  onValueChange={(value) => setTime(value[0])}
                  className='h-2'
                />
              </div>

              <Button
                variant='outline'
                size='icon'
                className='h-9 w-9 flex-shrink-0'
                onClick={() => setTime(Math.min(120, time + 15))}
                disabled={time >= 120}>
                <span className='text-lg'>+</span>
              </Button>

              <div className='w-20 text-center font-medium'>
                {time} min
              </div>
            </div>
          </div>
        </div>

        {/* Categories Section */}
        <div className='space-y-4'>
          <h2 className='text-xl font-semibold'>Categories (Optional)</h2>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={selectedCategories.includes(cat) ? "default" : "outline"}
                size="sm"
                onClick={() => toggleCategory(cat)}
                className="capitalize"
              >
                {cat}
              </Button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Select specific categories to focus on, or leave empty for all.</p>
        </div>

        {/* Difficulty Section */}
        <div className='space-y-4'>
          <h2 className='text-xl font-semibold'>Difficulty</h2>
          <div className="flex flex-wrap gap-2">
            {difficulties.map((diff) => (
              <Button
                key={diff}
                variant={selectedDifficulty === diff ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedDifficulty(diff)}
                className="capitalize"
              >
                {diff}
              </Button>
            ))}
          </div>
        </div>

        <div className='flex justify-end pt-4'>
          <Button onClick={onGenerate}>
            {t("exercises:auto_plan.generate")}
          </Button>
        </div>
      </Card>
      </div>
    </MainContainer>
  );
};
