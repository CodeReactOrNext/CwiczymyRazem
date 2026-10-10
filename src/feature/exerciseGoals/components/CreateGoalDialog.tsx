import { Button } from "assets/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "assets/components/ui/dialog";
import { Input } from "assets/components/ui/input";
import { cn } from "assets/lib/utils";
import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { useTranslation } from "hooks/useTranslation";
import { Minus, Plus, Search } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";

import type {
  GoalCounting,
  GoalStrictness,
  NewExerciseGoal,
} from "../types/exerciseGoal.types";
import {
  clampGoalBpm,
  GOAL_STRICTNESS_OPTIONS,
  isGoalEligibleExercise,
  MAX_GOAL_BPM,
  MIN_GOAL_BPM,
  STRICTNESS_ACCURACY,
  suggestTargetBpm,
} from "../utils/goalRules";

const GOAL_EXERCISES = exercisesAgregat.filter(isGoalEligibleExercise);
const COUNTING_OPTIONS: GoalCounting[] = ["streak", "total"];

interface SegmentedProps<T extends string> {
  value: T;
  options: { value: T; label: ReactNode }[];
  onChange: (value: T) => void;
  label: string;
}

const Segmented = <T extends string>({
  value,
  options,
  onChange,
  label,
}: SegmentedProps<T>) => (
  <div
    role='radiogroup'
    aria-label={label}
    className='grid auto-cols-fr grid-flow-col gap-1 rounded-lg bg-zinc-800/50 p-1'>
    {options.map((option) => (
      <button
        key={option.value}
        type='button'
        role='radio'
        aria-checked={value === option.value}
        onClick={() => onChange(option.value)}
        className={cn(
          "rounded px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400",
          value === option.value
            ? "bg-zinc-700 font-semibold text-zinc-100"
            : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200",
        )}>
        {option.label}
      </button>
    ))}
  </div>
);

interface CreateGoalDialogProps {
  onClose: () => void;
  onCreate: (goal: NewExerciseGoal) => Promise<unknown>;
  /** Exercises that already have an open goal — they can't take a second one. */
  busyExerciseIds: Set<string>;
  isSaving: boolean;
  /** Raising the bar: the exercise is fixed and the tempo starts higher. */
  initialExerciseId?: string;
  initialBpm?: number;
  initialStrictness?: GoalStrictness;
  initialCounting?: GoalCounting;
  title?: string;
  description?: string;
}

/**
 * Sets a goal: an exercise, the tempo to reach on it, how clean a run must be
 * and whether the three clean runs need to come in a row. Mounted only while
 * open, so every opening starts from a fresh form.
 */
export const CreateGoalDialog = ({
  onClose,
  onCreate,
  busyExerciseIds,
  isSaving,
  initialExerciseId,
  initialBpm,
  initialStrictness = "standard",
  initialCounting = "streak",
  title,
  description,
}: CreateGoalDialogProps) => {
  const { t } = useTranslation("goals");
  const [exercise, setExercise] = useState<Exercise | null>(
    () =>
      GOAL_EXERCISES.find((candidate) => candidate.id === initialExerciseId) ??
      null,
  );
  const [search, setSearch] = useState("");
  const [bpmInput, setBpmInput] = useState(() =>
    initialBpm
      ? String(initialBpm)
      : exercise
        ? String(suggestTargetBpm(exercise))
        : "",
  );
  const [strictness, setStrictness] =
    useState<GoalStrictness>(initialStrictness);
  const [counting, setCounting] = useState<GoalCounting>(initialCounting);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return needle
      ? GOAL_EXERCISES.filter((candidate) =>
          candidate.title.toLowerCase().includes(needle),
        )
      : GOAL_EXERCISES;
  }, [search]);

  const bpm = Number(bpmInput);
  const isBpmValid =
    Number.isFinite(bpm) && bpm >= MIN_GOAL_BPM && bpm <= MAX_GOAL_BPM;
  const canSave =
    !!exercise && isBpmValid && !busyExerciseIds.has(exercise.id) && !isSaving;

  const stepBpm = (delta: number) => {
    const base =
      Number.isFinite(bpm) && bpmInput !== ""
        ? bpm
        : exercise
          ? suggestTargetBpm(exercise)
          : 100;
    setBpmInput(String(clampGoalBpm(Math.round((base + delta) / 5) * 5)));
  };

  const pickExercise = (picked: Exercise) => {
    setExercise(picked);
    setBpmInput(String(suggestTargetBpm(picked)));
  };

  const handleSave = async () => {
    if (!exercise || !canSave) return;
    await onCreate({
      exerciseId: exercise.id,
      exerciseTitle: exercise.title,
      targetBpm: clampGoalBpm(bpm),
      strictness,
      counting,
    });
  };

  return (
    <Dialog open onOpenChange={(open) => !open && !isSaving && onClose()}>
      <DialogContent className='flex flex-col gap-8 border-0 bg-zinc-900 shadow-none sm:max-w-lg sm:p-8'>
        <div className='space-y-2 pr-10'>
          <DialogTitle className='text-xl font-bold text-zinc-100'>
            {title ?? t("create.title")}
          </DialogTitle>
          <DialogDescription className='text-sm text-zinc-400'>
            {description ?? t("create.description")}
          </DialogDescription>
        </div>

        <div className='space-y-3'>
          <p className='text-sm font-medium text-zinc-200'>
            {t("create.exercise_label")}
          </p>
          {exercise ? (
            <div className='flex items-center justify-between gap-3 rounded-lg bg-zinc-800/50 px-4 py-3'>
              <div className='min-w-0'>
                <p className='truncate text-sm font-semibold text-zinc-100'>
                  {exercise.title}
                </p>
                {exercise.metronomeSpeed && (
                  <p className='mt-0.5 text-xs text-zinc-400'>
                    {t("create.bpm_range", {
                      min: exercise.metronomeSpeed.min,
                      max: exercise.metronomeSpeed.max,
                    })}
                  </p>
                )}
              </div>
              {!initialExerciseId && (
                <button
                  type='button'
                  onClick={() => setExercise(null)}
                  className='shrink-0 rounded px-2 py-1 text-sm text-zinc-400 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 hover:bg-zinc-700 hover:text-zinc-100'>
                  {t("create.change_exercise")}
                </button>
              )}
            </div>
          ) : (
            <div className='space-y-2'>
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t("create.search")}
                aria-label={t("create.search")}
                startIcon={<Search className='h-4 w-4 text-zinc-500' />}
                className='h-11 border-0 bg-zinc-800/60 text-zinc-100'
              />
              <div className='max-h-72 space-y-1 overflow-y-auto pr-1'>
                {filtered.length === 0 && (
                  <p className='px-1 py-4 text-sm text-zinc-500'>
                    {t("create.no_results")}
                  </p>
                )}
                {filtered.map((candidate) => {
                  const isBusy = busyExerciseIds.has(candidate.id);
                  return (
                    <button
                      key={candidate.id}
                      type='button'
                      disabled={isBusy}
                      onClick={() => pickExercise(candidate)}
                      className='flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 disabled:cursor-not-allowed disabled:opacity-50 hover:bg-zinc-800/70'>
                      <span className='min-w-0 text-sm leading-snug text-zinc-200'>
                        {candidate.title}
                      </span>
                      <span className='shrink-0 text-xs tabular-nums text-zinc-500'>
                        {isBusy
                          ? t("create.has_goal")
                          : `${candidate.metronomeSpeed?.min}–${candidate.metronomeSpeed?.max} BPM`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {exercise && (
          <>
            <div className='space-y-3'>
              <label
                htmlFor='goal-bpm'
                className='block text-sm font-medium text-zinc-200'>
                {t("create.bpm_label")}
              </label>
              <div className='flex items-center gap-2'>
                <button
                  type='button'
                  onClick={() => stepBpm(-5)}
                  aria-label={t("create.bpm_down")}
                  className='flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-zinc-800/60 text-zinc-300 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 hover:bg-zinc-700 hover:text-zinc-100'>
                  <Minus className='h-4 w-4' />
                </button>
                <div className='w-24'>
                  <Input
                    id='goal-bpm'
                    type='number'
                    inputMode='numeric'
                    min={MIN_GOAL_BPM}
                    max={MAX_GOAL_BPM}
                    value={bpmInput}
                    onChange={(event) => setBpmInput(event.target.value)}
                    className='h-11 border-0 bg-zinc-800/60 text-center text-lg font-semibold tabular-nums text-zinc-100 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'
                  />
                </div>
                <button
                  type='button'
                  onClick={() => stepBpm(5)}
                  aria-label={t("create.bpm_up")}
                  className='flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-zinc-800/60 text-zinc-300 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 hover:bg-zinc-700 hover:text-zinc-100'>
                  <Plus className='h-4 w-4' />
                </button>
                <span className='ml-1 text-sm text-zinc-400'>BPM</span>
              </div>
              {!isBpmValid && bpmInput !== "" && (
                <p className='text-xs text-zinc-400'>
                  {t("create.bpm_invalid", {
                    min: MIN_GOAL_BPM,
                    max: MAX_GOAL_BPM,
                  })}
                </p>
              )}
            </div>

            <div className='space-y-3'>
              <p className='text-sm font-medium text-zinc-200'>
                {t("create.strictness_label")}
              </p>
              <Segmented
                label={t("create.strictness_label")}
                value={strictness}
                onChange={setStrictness}
                options={GOAL_STRICTNESS_OPTIONS.map((option) => ({
                  value: option,
                  label: (
                    <span className='flex flex-col items-center leading-tight'>
                      <span>{t(`strictness.${option}`)}</span>
                      <span
                        className={cn(
                          "text-xs font-normal tabular-nums",
                          strictness === option
                            ? "text-zinc-300"
                            : "text-zinc-500",
                        )}>
                        {STRICTNESS_ACCURACY[option]}%
                      </span>
                    </span>
                  ),
                }))}
              />
              <p className='text-xs text-zinc-500'>
                {t("create.strictness_hint")}
              </p>
            </div>

            <div className='space-y-3'>
              <p className='text-sm font-medium text-zinc-200'>
                {t("create.counting_label")}
              </p>
              <Segmented
                label={t("create.counting_label")}
                value={counting}
                onChange={setCounting}
                options={COUNTING_OPTIONS.map((option) => ({
                  value: option,
                  label: t(`create.counting_option.${option}`),
                }))}
              />
              <p className='text-xs text-zinc-500'>
                {t(`create.counting_hint_${counting}`)}
              </p>
            </div>
          </>
        )}

        <div className='flex flex-col-reverse gap-2 sm:flex-row sm:justify-end'>
          <Button
            type='button'
            onClick={onClose}
            disabled={isSaving}
            className='h-11 rounded-lg bg-zinc-800 px-5 text-zinc-100 hover:bg-zinc-700'>
            {t("create.cancel")}
          </Button>
          <Button
            type='button'
            onClick={() => void handleSave()}
            disabled={!canSave}
            className='h-11 rounded-lg bg-white px-6 font-semibold text-zinc-950 hover:bg-zinc-200'>
            {t("create.save")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
