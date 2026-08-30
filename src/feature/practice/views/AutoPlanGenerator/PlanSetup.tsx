import { Button } from "assets/components/ui/button";
import { Card } from "assets/components/ui/card";
import { Checkbox } from "assets/components/ui/checkbox";
import { Slider } from "assets/components/ui/slider";
import { cn } from "assets/lib/utils";
import MainContainer from "components/MainContainer";
import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import type { CategoryDifficultyFilter } from "feature/practice/utils/autoPlan";
import {
  countExercises,
  filterExercises,
  isEverythingSelected,
  isFilterEmpty,
  isSelected,
  PLAN_CATEGORIES,
  PLAN_DIFFICULTIES,
  selectAllAvailable,
  toggleCategory,
  toggleDifficulty,
  toggleDifficultyEverywhere,
} from "feature/practice/utils/autoPlan";
import { useTranslation } from "hooks/useTranslation";
import { Fragment, useMemo } from "react";

interface PlanSetupProps {
  time: number;
  setTime: (time: number) => void;
  filter: CategoryDifficultyFilter;
  setFilter: (filter: CategoryDifficultyFilter) => void;
  onBack: () => void;
  onGenerate: () => void;
}

export const PlanSetup = ({
  time,
  setTime,
  filter,
  setFilter,
  onGenerate,
}: PlanSetupProps) => {
  const { t } = useTranslation(["exercises", "common"]);

  const counts = useMemo(() => countExercises(exercisesAgregat), []);
  const matchingCount = useMemo(
    () => filterExercises(exercisesAgregat, filter).length,
    [filter],
  );
  const everythingSelected = isEverythingSelected(filter, counts);

  return (
    <MainContainer noBorder>
      <div className='font-openSans mx-auto max-w-3xl space-y-8 p-8'>
        <Card className='space-y-10 p-6'>
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

                <div className='w-20 text-center font-medium'>{time} min</div>
              </div>
            </div>
          </div>

          {/* Difficulties picked per category */}
          <div className='space-y-5'>
            <div className='flex flex-wrap items-start justify-between gap-3'>
              <div className='space-y-1'>
                <h2 className='text-xl font-semibold'>
                  {t("exercises:auto_plan.focus")}
                </h2>
                <p className='text-sm text-zinc-400'>
                  Pick the difficulties you want in each category, for example
                  medium technique and easy hearing. Leave everything unchecked
                  to draw from the whole library.
                </p>
              </div>

              <div className='flex items-center gap-1'>
                <Button
                  variant='ghost'
                  size='sm'
                  className='text-zinc-400'
                  disabled={everythingSelected}
                  onClick={() => setFilter(selectAllAvailable(counts))}>
                  Select all
                </Button>
                <Button
                  variant='ghost'
                  size='sm'
                  className='text-zinc-400'
                  disabled={isFilterEmpty(filter)}
                  onClick={() => setFilter({})}>
                  Clear all
                </Button>
              </div>
            </div>

            <div className='overflow-x-auto'>
              <div
                role='group'
                aria-label={t("exercises:auto_plan.focus")}
                className='grid min-w-[20rem] grid-cols-[minmax(5.5rem,1.4fr)_repeat(4,minmax(3.25rem,1fr))] items-center gap-x-1 gap-y-1'>
                <span />
                {PLAN_DIFFICULTIES.map((difficulty) => (
                  <button
                    key={difficulty}
                    type='button'
                    onClick={() =>
                      setFilter(toggleDifficultyEverywhere(filter, difficulty))
                    }
                    title={`Toggle ${t(
                      `exercises:difficulty.${difficulty}`,
                    )} in every category`}
                    className='rounded px-1 py-2 text-center text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-800/50 hover:text-zinc-200'>
                    {t(`exercises:difficulty.${difficulty}`)}
                  </button>
                ))}

                {PLAN_CATEGORIES.map((category) => (
                  <Fragment key={category}>
                    <button
                      type='button'
                      onClick={() =>
                        setFilter(toggleCategory(filter, category))
                      }
                      title={`Toggle every difficulty in ${t(
                        `exercises:categories.${category}`,
                      )}`}
                      className='rounded px-2 py-2 text-left text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800/50 hover:text-zinc-100'>
                      {t(`exercises:categories.${category}`)}
                    </button>

                    {PLAN_DIFFICULTIES.map((difficulty) => {
                      const available = counts[category]?.[difficulty] ?? 0;
                      const selected = isSelected(filter, category, difficulty);

                      return (
                        <button
                          key={difficulty}
                          type='button'
                          role='checkbox'
                          aria-checked={selected}
                          aria-label={`${t(
                            `exercises:categories.${category}`,
                          )} ${t(
                            `exercises:difficulty.${difficulty}`,
                          )} (${available})`}
                          disabled={available === 0}
                          onClick={() =>
                            setFilter(
                              toggleDifficulty(filter, category, difficulty),
                            )
                          }
                          className={cn(
                            "flex items-center justify-center gap-1.5 rounded py-2.5 transition-colors",
                            available === 0
                              ? "cursor-not-allowed opacity-30"
                              : "hover:bg-zinc-800/50",
                            selected && "bg-cyan-500/10 hover:bg-cyan-500/20",
                          )}>
                          <Checkbox
                            checked={selected}
                            tabIndex={-1}
                            className='pointer-events-none border-zinc-600 data-[state=checked]:border-cyan-500 data-[state=checked]:bg-cyan-500 data-[state=checked]:text-zinc-950'
                          />
                          <span
                            className={cn(
                              "text-xs tabular-nums",
                              selected ? "text-cyan-400" : "text-zinc-500",
                            )}>
                            {available}
                          </span>
                        </button>
                      );
                    })}
                  </Fragment>
                ))}
              </div>
            </div>
          </div>

          <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
            <p
              className={cn(
                "text-sm",
                matchingCount === 0 ? "text-amber-400" : "text-zinc-400",
              )}>
              {matchingCount === 0
                ? t("exercises:auto_plan.no_exercises")
                : `${
                    matchingCount === 1
                      ? "1 exercise matches"
                      : `${matchingCount} exercises match`
                  } your picks`}
            </p>

            <Button onClick={onGenerate} disabled={matchingCount === 0}>
              {t("exercises:auto_plan.generate")}
            </Button>
          </div>
        </Card>
      </div>
    </MainContainer>
  );
};
