import { cn } from "assets/lib/utils";
import { PROGRESS_HABITS, sessionPoints } from "feature/landing/data/progress";
import { useState } from "react";

const STREAK_DAYS = [1, 2, 3, 4, 5] as const;

/**
 * One session's points as a toy, worked out by `sessionPoints`, which mirrors
 * the report's `makeRatingData`: minutes, ticked habits, and the day of the
 * streak you are on. The breakdown is the same one the log form shows.
 */
export const PointsCalculator = () => {
  const [minutes, setMinutes] = useState(30);
  const [habits, setHabits] = useState<Set<string>>(
    () => new Set(PROGRESS_HABITS.slice(0, 2)),
  );
  const [streakDay, setStreakDay] = useState(5);
  const points = sessionPoints(minutes, habits.size, streakDay);

  const toggleHabit = (habit: string) =>
    setHabits((current) => {
      const next = new Set(current);
      if (next.has(habit)) next.delete(habit);
      else next.add(habit);
      return next;
    });

  return (
    <div className='rounded-lg bg-zinc-900/40 p-6 sm:p-8'>
      <div>
        <div className='flex items-baseline justify-between'>
          <label htmlFor='points-minutes' className='text-sm text-zinc-400'>
            Practice
          </label>
          <span className='font-teko text-3xl tabular-nums leading-none text-white'>
            {minutes}
            <span className='ml-1 font-sans text-xs text-zinc-500'>min</span>
          </span>
        </div>
        <input
          id='points-minutes'
          type='range'
          min={5}
          max={180}
          step={5}
          value={minutes}
          onChange={(event) => setMinutes(Number(event.target.value))}
          className='mt-3 w-full accent-zinc-200'
        />
      </div>

      <fieldset className='mt-6'>
        <legend className='text-sm text-zinc-400'>Healthy habits</legend>
        <div className='mt-3 flex flex-wrap gap-2'>
          {PROGRESS_HABITS.map((habit) => {
            const on = habits.has(habit);
            return (
              <button
                key={habit}
                type='button'
                aria-pressed={on}
                onClick={() => toggleHabit(habit)}
                className={cn(
                  "rounded px-3 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400",
                  on
                    ? "bg-zinc-100 font-semibold text-zinc-950"
                    : "bg-zinc-800/60 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200",
                )}>
                {habit}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div role='radiogroup' aria-label='Day of your streak' className='mt-6'>
        <p className='text-sm text-zinc-400'>Day of your streak</p>
        <div className='mt-3 flex gap-2'>
          {STREAK_DAYS.map((day) => (
            <button
              key={day}
              type='button'
              role='radio'
              aria-checked={streakDay === day}
              onClick={() => setStreakDay(day)}
              className={cn(
                "h-9 w-12 rounded text-sm tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400",
                streakDay === day
                  ? "bg-zinc-100 font-semibold text-zinc-950"
                  : "bg-zinc-800/60 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200",
              )}>
              {day === 5 ? "5+" : day}
            </button>
          ))}
        </div>
      </div>

      <dl className='mt-8 space-y-1.5 text-sm' aria-live='polite'>
        <div className='flex justify-between gap-4 text-zinc-400'>
          <dt>Practice time</dt>
          <dd className='tabular-nums text-zinc-200'>+{points.time}</dd>
        </div>
        <div className='flex justify-between gap-4 text-zinc-400'>
          <dt>Habits</dt>
          <dd className='tabular-nums text-zinc-200'>+{points.habits}</dd>
        </div>
        <div className='flex justify-between gap-4 text-zinc-400'>
          <dt>
            Streak bonus
            {points.multiplier > 0 &&
              ` (+${Math.round(points.multiplier * 100)}%)`}
          </dt>
          <dd className='tabular-nums text-zinc-200'>+{points.bonus}</dd>
        </div>
        <div className='flex items-baseline justify-between gap-4 pt-2 font-semibold text-white'>
          <dt>Points for this session</dt>
          <dd className='font-teko text-4xl tabular-nums leading-none'>
            +{points.total}
          </dd>
        </div>
      </dl>
    </div>
  );
};
