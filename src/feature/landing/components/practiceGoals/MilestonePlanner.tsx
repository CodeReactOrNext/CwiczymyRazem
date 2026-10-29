import { cn } from "assets/lib/utils";
import type { GoalStrictness } from "feature/exerciseGoals/types/exerciseGoal.types";
import {
  autoStepBpm,
  GOAL_CLEAN_RUNS_REQUIRED,
  GOAL_STRICTNESS_OPTIONS,
  goalPath,
  STRICTNESS_ACCURACY,
} from "feature/exerciseGoals/utils/goalRules";
import { motion, useReducedMotion } from "framer-motion";
import { transitions } from "lib/motion/motion";
import { useState } from "react";

const STRICTNESS_LABEL: Record<GoalStrictness, string> = {
  relaxed: "Relaxed",
  standard: "Standard",
  strict: "Strict",
};

const BpmSlider = ({
  id,
  label,
  value,
  min,
  max,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) => (
  <div>
    <div className='flex items-baseline justify-between'>
      <label htmlFor={id} className='text-sm text-zinc-400'>
        {label}
      </label>
      <span className='font-teko text-3xl tabular-nums leading-none text-white'>
        {value}
        <span className='ml-1 font-sans text-xs text-zinc-500'>BPM</span>
      </span>
    </div>
    <input
      id={id}
      type='range'
      min={min}
      max={max}
      step={1}
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
      className='mt-3 w-full accent-zinc-200'
    />
  </div>
);

/**
 * The goal form's preview as a toy: pick a start and a goal tempo and a
 * strictness, and see the milestones the app would lay out — the same
 * `goalPath` and `autoStepBpm` the goal is saved with.
 */
export const MilestonePlanner = () => {
  const still = !!useReducedMotion();
  const [start, setStart] = useState(80);
  const [target, setTarget] = useState(120);
  const [strictness, setStrictness] = useState<GoalStrictness>("standard");

  const step = autoStepBpm(start, target);
  const path = goalPath(start, target, step);

  return (
    <div className='rounded-lg bg-zinc-900/40 p-6 sm:p-8'>
      <div className='space-y-6'>
        <BpmSlider
          id='goal-start'
          label='Where you are'
          value={start}
          min={40}
          max={200}
          onChange={(value) => {
            setStart(value);
            if (value >= target) setTarget(Math.min(400, value + 5));
          }}
        />
        <BpmSlider
          id='goal-target'
          label='Where you want to be'
          value={target}
          min={45}
          max={300}
          onChange={(value) => {
            setTarget(value);
            if (value <= start) setStart(Math.max(20, value - 5));
          }}
        />
        <div
          role='radiogroup'
          aria-label='How clean a run must be'
          className='flex flex-wrap gap-2'>
          {GOAL_STRICTNESS_OPTIONS.map((option) => (
            <button
              key={option}
              type='button'
              role='radio'
              aria-checked={strictness === option}
              onClick={() => setStrictness(option)}
              className={cn(
                "rounded px-3 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400",
                strictness === option
                  ? "bg-zinc-100 font-semibold text-zinc-950"
                  : "bg-zinc-800/60 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200",
              )}>
              {STRICTNESS_LABEL[option]} · {STRICTNESS_ACCURACY[option]}%
            </button>
          ))}
        </div>
      </div>

      <ol className='mt-8 flex flex-wrap gap-1.5' aria-live='polite'>
        {path.map((bpm, idx) => (
          <motion.li
            key={bpm}
            layout={!still}
            transition={transitions.spring}
            className={cn(
              "rounded px-2 py-1 text-xs font-semibold tabular-nums",
              idx === path.length - 1
                ? "bg-emerald-500/15 text-emerald-400"
                : "bg-zinc-800/70 text-zinc-300",
            )}>
            {bpm}
          </motion.li>
        ))}
      </ol>
      <p className='mt-4 text-sm text-zinc-500'>
        <span className='font-semibold tabular-nums text-zinc-300'>
          {path.length}
        </span>{" "}
        milestones, up to {step} BPM apart, each cleared by{" "}
        {GOAL_CLEAN_RUNS_REQUIRED} runs at {STRICTNESS_ACCURACY[strictness]}% or
        better:{" "}
        <span className='font-semibold tabular-nums text-zinc-300'>
          {path.length * GOAL_CLEAN_RUNS_REQUIRED}
        </span>{" "}
        clean runs to the top.
      </p>
    </div>
  );
};
