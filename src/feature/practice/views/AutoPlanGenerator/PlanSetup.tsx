import { Button } from "assets/components/ui/button";
import { Card } from "assets/components/ui/card";
import { Checkbox } from "assets/components/ui/checkbox";
import { Slider } from "assets/components/ui/slider";
import { cn } from "assets/lib/utils";
import MainContainer from "components/MainContainer";
import type { DifficultyLevel, ExerciseCategory } from "feature/exercisePlan/types/exercise.types";
import { useTranslation } from "hooks/useTranslation";

const RadioOption = ({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    role="radio"
    aria-checked={selected}
    onClick={onClick}
    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium capitalize text-zinc-400 transition-colors hover:text-zinc-200"
  >
    <span
      className={cn(
        "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors",
        selected ? "border-zinc-100" : "border-zinc-600"
      )}
    >
      {selected && <span className="h-2 w-2 rounded-full bg-zinc-100" />}
    </span>
    <span className={selected ? "text-zinc-100" : undefined}>{label}</span>
  </button>
);

const CheckboxOption = ({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    role="checkbox"
    aria-checked={selected}
    onClick={onClick}
    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium capitalize text-zinc-400 transition-colors hover:text-zinc-200"
  >
    <Checkbox
      checked={selected}
      tabIndex={-1}
      className="pointer-events-none border-zinc-600 data-[state=checked]:border-zinc-100 data-[state=checked]:bg-zinc-100 data-[state=checked]:text-zinc-900"
    />
    <span className={selected ? "text-zinc-100" : undefined}>{label}</span>
  </button>
);

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
    <MainContainer noBorder>
      <div className='mx-auto max-w-3xl space-y-8 p-8 font-openSans'>

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
          <div className="flex flex-wrap gap-1" role="group" aria-label="Categories">
            {categories.map((cat) => (
              <CheckboxOption
                key={cat}
                label={cat}
                selected={selectedCategories.includes(cat)}
                onClick={() => toggleCategory(cat)}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Select specific categories to focus on, or leave empty for all.</p>
        </div>

        {/* Difficulty Section */}
        <div className='space-y-4'>
          <h2 className='text-xl font-semibold'>Difficulty</h2>
          <div className="flex flex-wrap gap-1" role="radiogroup" aria-label="Difficulty">
            {difficulties.map((diff) => (
              <RadioOption
                key={diff}
                label={diff}
                selected={selectedDifficulty === diff}
                onClick={() => setSelectedDifficulty(diff)}
              />
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
