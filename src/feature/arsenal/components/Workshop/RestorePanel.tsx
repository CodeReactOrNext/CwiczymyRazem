import { cn } from "assets/lib/utils";
import { getConditionGrade } from "feature/arsenal/data/itemStats";
import { ArrowRight } from "lucide-react";

import { ConditionMeter } from "../ConditionMeter";
import { SectionLabel } from "../SectionLabel";

interface SideProps {
  caption: string;
  condition: number;
  level: number;
  /** The "after" half: tinted, with the level gain called out. */
  after?: boolean;
  gain?: number;
}

/** One half of the restoration: a grade, its meter, and the level it is worth. */
const Side = ({
  caption,
  condition,
  level,
  after = false,
  gain,
}: SideProps) => {
  const grade = getConditionGrade(condition);
  return (
    <div
      className={cn(
        "flex flex-col gap-4 p-5 sm:p-6",
        after ? "bg-emerald-500/[0.07]" : "bg-zinc-950/40",
      )}>
      <SectionLabel>{caption}</SectionLabel>

      <div className='flex flex-col gap-3'>
        <span
          className='self-start rounded px-3 py-1 text-sm font-bold'
          style={{
            backgroundColor: `${grade.color}${after ? "1f" : "14"}`,
            color: grade.color,
            opacity: after ? 1 : 0.7,
          }}>
          {grade.label}
        </span>
        <ConditionMeter
          condition={condition}
          showLabel={false}
          dimmed={!after}
        />
      </div>

      <div className='flex items-center gap-3'>
        <span className='text-sm text-zinc-400'>Level</span>
        <span
          className={cn(
            "text-2xl font-black tabular-nums leading-none",
            after ? "text-white" : "text-zinc-300",
          )}>
          {level}
        </span>
        {after && gain != null && gain !== 0 && (
          <span className='rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-sm font-bold tabular-nums text-emerald-300'>
            {gain > 0 ? `+${gain}` : gain}
          </span>
        )}
      </div>
    </div>
  );
};

interface RestorePanelProps {
  fromCondition: number;
  toCondition: number;
  fromLevel: number;
  toLevel: number;
}

/**
 * The restoration as a before → after, side by side.
 *
 * The "current" half is dark and the "after" half is tinted, so which side is
 * the promise reads before a word of it does. Both halves are built from the
 * same grade chip and meter the item card wears, so the player recognises the
 * stat they are about to change.
 */
export const RestorePanel = ({
  fromCondition,
  toCondition,
  fromLevel,
  toLevel,
}: RestorePanelProps) => (
  <div className='grid grid-cols-1 overflow-hidden rounded-lg sm:grid-cols-[1fr_auto_1fr]'>
    <Side caption='Current' condition={fromCondition} level={fromLevel} />
    <div className='flex items-center justify-center bg-zinc-950/40 px-1 py-2 sm:px-2'>
      <ArrowRight size={18} className='rotate-90 text-zinc-500 sm:rotate-0' />
    </div>
    <Side
      caption='After restoration'
      condition={toCondition}
      level={toLevel}
      gain={toLevel - fromLevel}
      after
    />
  </div>
);
