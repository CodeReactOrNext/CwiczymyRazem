import { RARITY_STYLES } from "feature/arsenal/components/RarityBadge";
import { getConditionGrade } from "feature/arsenal/data/itemStats";
import type { GuitarRarity } from "feature/arsenal/types/arsenal.types";
import { ArrowRight } from "lucide-react";

import { ConditionMeter } from "../ConditionMeter";
import { LevelEmblem } from "../LevelEmblem";

/**
 * Before → after previews built from the very same emblem and meter the item card
 * uses. The player should recognise the shape of what they are about to change,
 * not have to map a new widget onto a stat they already know.
 */

interface LevelDeltaProps {
  from: number;
  to: number;
  rarity: GuitarRarity;
}

export const LevelDelta = ({ from, to, rarity }: LevelDeltaProps) => (
  <div className='flex items-center gap-3'>
    <LevelEmblem
      level={from}
      rarity={rarity}
      dimmed
      size={36}
      title='Level now'
    />
    <ArrowRight size={14} className='text-zinc-600' />
    <LevelEmblem
      level={to}
      rarity={rarity}
      size={44}
      title='Level after this job'
    />
    <span className='text-sm font-black tabular-nums text-cyan-400'>
      +{to - from}
    </span>
  </div>
);

interface RarityDeltaProps {
  from: GuitarRarity;
  to: GuitarRarity;
}

/** The headline of a promotion level — the tier the item is about to become. */
export const RarityDelta = ({ from, to }: RarityDeltaProps) => (
  <div className='flex flex-wrap items-center gap-3'>
    <span
      className='rounded px-3 py-1.5 text-sm font-bold'
      style={{
        backgroundColor: `${RARITY_STYLES[from].baseColor}14`,
        color: RARITY_STYLES[from].baseColor,
        opacity: 0.6,
      }}>
      {from}
    </span>

    <ArrowRight size={16} className='text-zinc-600' />

    <span
      className='rounded px-4 py-1.5 text-base font-black'
      style={{
        backgroundColor: `${RARITY_STYLES[to].baseColor}1f`,
        color: RARITY_STYLES[to].baseColor,
      }}>
      {to}
    </span>
  </div>
);

interface ConditionDeltaProps {
  from: number;
  to: number;
}

export const ConditionDelta = ({ from, to }: ConditionDeltaProps) => {
  const fromGrade = getConditionGrade(from);
  const toGrade = getConditionGrade(to);

  return (
    <div className='flex items-center gap-3'>
      <div className='flex min-w-0 flex-1 flex-col gap-1.5'>
        <span className='text-[10px] font-semibold text-zinc-500'>
          {fromGrade.label}
        </span>
        <ConditionMeter condition={from} showLabel={false} dimmed />
      </div>

      <ArrowRight size={14} className='shrink-0 text-zinc-600' />

      <div className='flex min-w-0 flex-1 flex-col gap-1.5'>
        <span
          className='text-[10px] font-bold'
          style={{ color: toGrade.color }}>
          {toGrade.label}
        </span>
        <ConditionMeter condition={to} showLabel={false} />
      </div>
    </div>
  );
};
