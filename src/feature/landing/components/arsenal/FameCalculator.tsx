import { cn } from "assets/lib/utils";
import {
  cumulativeRateFame,
  getRigFameRate,
} from "feature/arsenal/data/rigFame";
import { useState } from "react";
import { cumulativeDailyFame } from "utils/gameLogic/calculateSessionFame";

const Slider = ({
  id,
  label,
  value,
  unit,
  min,
  max,
  step,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) => (
  <div>
    <div className='flex items-baseline justify-between'>
      <label htmlFor={id} className='text-sm text-zinc-400'>
        {label}
      </label>
      <span className='font-teko text-3xl tabular-nums leading-none text-white'>
        {value}
        <span className='ml-1 font-sans text-xs text-zinc-500'>{unit}</span>
      </span>
    </div>
    <input
      id={id}
      type='range'
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
      className='mt-3 w-full accent-zinc-200'
    />
  </div>
);

/**
 * What a day of practice is worth in Fame, worked out with the functions the
 * server pays with: the practice curve (`cumulativeDailyFame`) and the rig's
 * hourly rate (`getRigFameRate`). The quests and the case prices are passed in
 * from the page's data. Streak bonuses, the accuracy multiplier and the
 * fixed rewards are left out, so it errs low.
 */
export const FameCalculator = ({
  questFame,
  cases,
}: {
  questFame: number;
  /** Cases to price the day against, cheapest first. */
  cases: { name: string; fame: number }[];
}) => {
  const [minutes, setMinutes] = useState(30);
  const [rigLevel, setRigLevel] = useState(120);
  const [quests, setQuests] = useState(true);

  const practice = cumulativeDailyFame(minutes);
  const rig = cumulativeRateFame(minutes, getRigFameRate(rigLevel));
  const total = practice + rig + (quests ? questFame : 0);

  return (
    <div className='rounded-lg bg-zinc-900/40 p-6 sm:p-8'>
      <div className='space-y-6'>
        <Slider
          id='fame-minutes'
          label='Practice a day'
          value={minutes}
          unit='min'
          min={15}
          max={180}
          step={15}
          onChange={setMinutes}
        />
        <Slider
          id='fame-rig'
          label='Your Rig Level'
          value={rigLevel}
          unit='lvl'
          min={0}
          max={750}
          step={10}
          onChange={setRigLevel}
        />
        <label className='flex cursor-pointer items-center gap-3 text-sm text-zinc-300'>
          <input
            type='checkbox'
            checked={quests}
            onChange={(event) => setQuests(event.target.checked)}
            className='h-4 w-4 accent-zinc-200'
          />
          Finish the daily quests (+{questFame})
        </label>
      </div>

      <dl className='mt-8 grid grid-cols-3 gap-4' aria-live='polite'>
        {[
          { label: "Practice", value: practice },
          { label: "Rig", value: rig },
          { label: "A day", value: total, strong: true },
        ].map((cell) => (
          <div key={cell.label}>
            <dt className='text-xs text-zinc-500'>{cell.label}</dt>
            <dd
              className={cn(
                "mt-1 font-teko text-4xl tabular-nums leading-none",
                cell.strong ? "text-white" : "text-zinc-300",
              )}>
              {cell.value}
            </dd>
          </div>
        ))}
      </dl>
      <ul className='mt-6 space-y-1.5 text-sm text-zinc-400'>
        {cases.map((entry) => (
          <li key={entry.name} className='flex justify-between gap-4'>
            <span>{entry.name}</span>
            <span className='tabular-nums text-zinc-300'>
              {total > 0 ? `every ${Math.ceil(entry.fame / total)} days` : "—"}
            </span>
          </li>
        ))}
      </ul>
      <p className='mt-4 text-xs leading-relaxed text-zinc-500'>
        Leaves out streak bonuses, the accuracy multiplier, challenges and
        seasons, so the real number is higher.
      </p>
    </div>
  );
};
