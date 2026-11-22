import { Button, PRESSABLE_KEY } from "assets/components/ui/button";
import { Card } from "assets/components/ui/card";
import { Slider } from "assets/components/ui/slider";
import { cn } from "assets/lib/utils";
import MainContainer from "components/MainContainer";
import { PAGE_CONTENT } from "components/PageShell/PageShell";
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
import { Check, Minus, Plus } from "lucide-react";
import { Fragment, useMemo } from "react";

import { CATEGORY_DOT, FALLBACK_DOT } from "./categoryStyles";

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
  const { t } = useTranslation(["exercises", "common", "practice_hub"]);

  const counts = useMemo(() => countExercises(exercisesAgregat), []);
  const matchingCount = useMemo(
    () => filterExercises(exercisesAgregat, filter).length,
    [filter],
  );
  const everythingSelected = isEverythingSelected(filter, counts);

  return (
    <MainContainer noBorder>
      <div className={cn(" mx-auto max-w-3xl space-y-8", PAGE_CONTENT)}>
        <Card className='space-y-10 bg-transparent p-0 sm:bg-zinc-800/40 sm:p-6'>
          {/* Duration Section */}
          <div className='space-y-4'>
            <h2 className='text-xl font-extrabold'>
              {t("exercises:auto_plan.duration")}
            </h2>

            {/* On a phone the number sits above the slider, so the slider
                keeps the whole row. */}
            <div className='flex flex-wrap items-center gap-x-3 gap-y-2'>
              <div className='order-first w-full text-3xl font-extrabold tabular-nums leading-none sm:order-last sm:w-auto sm:min-w-[6.5rem] sm:text-right'>
                {time}{" "}
                <span className='text-base font-bold text-zinc-400'>min</span>
              </div>

              <Button
                variant='secondary'
                size='icon'
                className='flex-shrink-0'
                aria-label='-15 min'
                onClick={() => setTime(Math.max(15, time - 15))}
                disabled={time <= 15}>
                <Minus />
              </Button>

              <Slider
                value={[time]}
                min={15}
                max={120}
                step={15}
                onValueChange={(value) => setTime(value[0])}
                aria-label={t("exercises:auto_plan.duration")}
                className='w-auto min-w-0 flex-1 py-4 [&_[data-slot=slider-track]]:h-3.5 [&_[data-slot=slider-track]]:bg-zinc-800 [&_[role=slider]]:h-7 [&_[role=slider]]:w-7 [&_[role=slider]]:border-0 [&_[role=slider]]:bg-primary [&_[role=slider]]:shadow-none'
              />

              <Button
                variant='secondary'
                size='icon'
                className='flex-shrink-0'
                aria-label='+15 min'
                onClick={() => setTime(Math.min(120, time + 15))}
                disabled={time >= 120}>
                <Plus />
              </Button>
            </div>
          </div>

          {/* Difficulties picked per category */}
          <div className='space-y-5'>
            <div className='flex flex-wrap items-start justify-between gap-3'>
              <div className='space-y-1'>
                <h2 className='text-xl font-extrabold'>
                  {t("exercises:auto_plan.focus")}
                </h2>
                <p className='text-sm text-zinc-400'>
                  {t("practice_hub:auto.pick_hint")}
                </p>
              </div>

              <div className='flex items-center gap-1'>
                <Button
                  variant='ghost'
                  size='sm'
                  className='text-zinc-400'
                  disabled={everythingSelected}
                  onClick={() => setFilter(selectAllAvailable(counts))}>
                  {t("practice_hub:auto.select_all")}
                </Button>
                <Button
                  variant='ghost'
                  size='sm'
                  className='text-zinc-400'
                  disabled={isFilterEmpty(filter)}
                  onClick={() => setFilter({})}>
                  {t("practice_hub:auto.clear_all")}
                </Button>
              </div>
            </div>

            <div className='overflow-x-auto'>
              <div
                role='group'
                aria-label={t("exercises:auto_plan.focus")}
                className='grid min-w-[20rem] grid-cols-[minmax(5.5rem,1.4fr)_repeat(4,minmax(3.25rem,1fr))] items-center gap-2 pb-1'>
                <span />
                {PLAN_DIFFICULTIES.map((difficulty) => (
                  <button
                    key={difficulty}
                    type='button'
                    onClick={() =>
                      setFilter(toggleDifficultyEverywhere(filter, difficulty))
                    }
                    title={t("practice_hub:auto.toggle_difficulty", {
                      difficulty: t(`exercises:difficulty.${difficulty}`),
                    })}
                    className='rounded-lg px-1 py-2 text-center text-[13px] font-bold text-zinc-300 transition-colors hover:bg-zinc-800/50 hover:text-zinc-100'>
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
                      title={t("practice_hub:auto.toggle_category", {
                        category: t(`exercises:categories.${category}`),
                      })}
                      className='flex items-center gap-2.5 rounded-lg px-2 py-2 text-left text-[15px] font-bold text-zinc-100 transition-colors hover:bg-zinc-800/50'>
                      <span
                        className={cn(
                          "h-2.5 w-2.5 shrink-0 rounded-full",
                          CATEGORY_DOT[category] ?? FALLBACK_DOT,
                        )}
                      />
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
                          )} ${t(`exercises:difficulty.${difficulty}`)}${
                            available === 0
                              ? ` ${t("practice_hub:auto.none_available")}`
                              : ""
                          }`}
                          disabled={available === 0}
                          onClick={() =>
                            setFilter(
                              toggleDifficulty(filter, category, difficulty),
                            )
                          }
                          className={cn(
                            "flex h-12 items-center justify-center gap-1.5 rounded-xl text-sm tabular-nums",
                            available === 0
                              ? "cursor-not-allowed"
                              : [
                                  PRESSABLE_KEY,
                                  "font-bold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                                  selected
                                    ? "border-b-black/25 bg-primary bg-clip-border text-primary-foreground"
                                    : "bg-zinc-700/50 text-zinc-300 hover:bg-zinc-700/80 hover:text-zinc-100",
                                ],
                          )}>
                          {/* A picked tile turns light and gets a tick; a free
                              one shows a faint plus, an empty one a dash. */}
                          {available === 0 ? (
                            <Minus
                              aria-hidden
                              className='h-4 w-4 text-zinc-600'
                            />
                          ) : selected ? (
                            <Check
                              aria-hidden
                              strokeWidth={3.5}
                              className='h-4 w-4'
                            />
                          ) : (
                            <Plus
                              aria-hidden
                              className='h-4 w-4 text-zinc-500'
                            />
                          )}
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
                "text-[15px]",
                matchingCount === 0 ? "text-amber-400" : "text-zinc-400",
              )}>
              {matchingCount === 0 ? (
                t("exercises:auto_plan.no_exercises")
              ) : (
                <>
                  <span className='font-extrabold tabular-nums text-zinc-100'>
                    {matchingCount}
                  </span>{" "}
                  {t("practice_hub:auto.matches", { count: matchingCount })}
                </>
              )}
            </p>

            <Button
              size='lg'
              onClick={onGenerate}
              disabled={matchingCount === 0}
              className='w-full sm:w-auto'>
              {t("exercises:auto_plan.generate")}
            </Button>
          </div>
        </Card>
      </div>
    </MainContainer>
  );
};
