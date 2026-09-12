import { cn } from "assets/lib/utils";
import {
  getPartLabel,
  PART_TIER_COLORS,
} from "feature/arsenal/data/partDefinitions";
import type { RecipeLine } from "feature/arsenal/data/workshop";
import { Check, CircleAlert, CircleCheck } from "lucide-react";
import type { ReactNode } from "react";

import { PartIcon } from "../Parts/PartIcon";
import { TierPlate } from "../TierPlate";
import { FameCoin } from "./FameCoin";

interface RowProps {
  icon: ReactNode;
  label: string;
  /** The tier under the name, in its colour — absent on a currency. */
  tier?: { label: string; color: string };
  need: number;
  have: number;
}

/** One line of the cost: what it is, what is asked, what is held, and whether that covers it. */
const Row = ({ icon, label, tier, need, have }: RowProps) => {
  const ok = have >= need;
  return (
    <div
      className={cn(
        "grid grid-cols-[auto_1fr_5rem_5rem_2rem] items-center gap-x-3 rounded-lg px-3 py-2.5",
        ok ? "bg-zinc-800/40" : "bg-zinc-800/20",
      )}>
      <span
        className={cn(
          "flex h-10 w-10 items-center justify-center",
          !ok && "opacity-50 grayscale",
        )}>
        {icon}
      </span>
      <span className='flex min-w-0 flex-col gap-0.5'>
        <span className='truncate text-sm font-bold text-zinc-100'>
          {label}
        </span>
        {tier && (
          <span className='text-xs font-semibold' style={{ color: tier.color }}>
            {tier.label}
          </span>
        )}
      </span>
      <span
        className={cn(
          "text-right text-sm font-black tabular-nums",
          ok ? "text-zinc-100" : "text-amber-400",
        )}>
        {need.toLocaleString()}
      </span>
      <span
        className={cn(
          "text-right text-sm tabular-nums",
          ok ? "text-zinc-300" : "text-amber-400/80",
        )}>
        {have.toLocaleString()}
      </span>
      <span
        className={cn(
          "ml-auto flex h-6 w-6 items-center justify-center rounded-full",
          ok ? "bg-emerald-500/15" : "bg-zinc-800",
        )}>
        {ok ? (
          <Check size={13} strokeWidth={3} className='text-emerald-400' />
        ) : (
          <span className='h-1.5 w-1.5 rounded-full bg-zinc-600' />
        )}
      </span>
    </div>
  );
};

interface CostTableProps {
  title: string;
  recipe: RecipeLine[];
  /** Fame sits in the same table as the parts, because it is the same thing: a cost. */
  fame?: { need: number; have: number };
}

/**
 * Everything a job takes, as a table: one row per cost, what is required
 * against what is owned, and one verdict over the lot.
 *
 * Two aligned columns of numbers instead of a sentence per line — with three
 * or four costs the eye wants to scan down, not read across.
 */
export const CostTable = ({ title, recipe, fame }: CostTableProps) => {
  const short =
    recipe.filter((line) => !line.ok).length +
    (fame && fame.have < fame.need ? 1 : 0);
  const ready = short === 0;

  return (
    <div className='flex flex-col gap-3 rounded-lg bg-zinc-900/60 p-5'>
      <div className='flex flex-wrap items-center justify-between gap-x-4 gap-y-1'>
        <span className='text-base font-semibold text-zinc-100'>{title}</span>
        <span
          className={cn(
            "flex items-center gap-2 text-sm font-bold",
            ready ? "text-emerald-400" : "text-amber-400",
          )}>
          {ready ? <CircleCheck size={18} /> : <CircleAlert size={18} />}
          {ready ? "Resources available" : `${short} still short`}
        </span>
      </div>

      <div className='grid grid-cols-[auto_1fr_5rem_5rem_2rem] gap-x-3 px-3 text-xs text-zinc-500'>
        <span className='w-10' />
        <span />
        <span className='text-right'>Required</span>
        <span className='text-right'>Owned</span>
        <span />
      </div>

      <div className='flex flex-col gap-1.5'>
        {fame && (
          <Row
            icon={<FameCoin size={30} />}
            label='Fame'
            need={fame.need}
            have={fame.have}
          />
        )}
        {recipe.map((line) => (
          <Row
            key={`${line.partId}:${line.tier}`}
            icon={
              <TierPlate
                color={PART_TIER_COLORS[line.tier]}
                size={40}
                muted={!line.ok}>
                <PartIcon partId={line.partId} size={30} />
              </TierPlate>
            }
            label={getPartLabel(line.partId)}
            tier={{ label: line.tier, color: PART_TIER_COLORS[line.tier] }}
            need={line.need}
            have={line.have}
          />
        ))}
      </div>
    </div>
  );
};
