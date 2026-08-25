import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "assets/components/ui/tooltip";
import { cn } from "assets/lib/utils";
import { Info } from "lucide-react";

import type { CaseDefinition, GuitarRarity } from "../../types/arsenal.types";
import { RARITY_STYLES } from "../RarityBadge";

/**
 * A single rarity's odds out of one case, for the per-item tooltip.
 *
 * `GuitarRarity` carries one member no case table has — Custom Shop gear is
 * built at the bench, never rolled — so this returns undefined rather than
 * making every caller widen the table's type.
 */
export const rollChance = (
  probabilities: CaseDefinition["probabilities"],
  rarity: GuitarRarity
): number | undefined => (rarity === "Custom Shop" ? undefined : probabilities[rarity]);

/** The odds table itself, without a trigger around it. */
export const RarityOddsTable = ({
  probabilities,
}: {
  probabilities: CaseDefinition["probabilities"];
}) => {
  const probs = (Object.entries(probabilities) as [GuitarRarity, number][]).filter(
    ([, prob]) => prob > 0
  );
  return (
    <div className='space-y-1.5'>
      {probs.map(([rarity, prob]) => {
        const rs = RARITY_STYLES[rarity];
        const logWidth = (Math.log10(prob * 100 + 1) / Math.log10(101)) * 100;
        return (
          <div key={rarity} className='flex items-center gap-2'>
            <span
              className='w-16 flex-shrink-0 text-[10px] font-semibold capitalize tracking-wider'
              style={{ color: rs.baseColor }}>
              {rarity}
            </span>
            <div className='h-1 flex-1 overflow-hidden rounded bg-black/40'>
              <div
                className='h-full rounded'
                style={{
                  width: `${logWidth}%`,
                  backgroundColor: rs.baseColor,
                  opacity: 0.85,
                }}
              />
            </div>
            <span
              className='w-12 flex-shrink-0 text-right text-[11px] font-bold'
              style={{ color: rs.baseColor }}>
              {(prob * 100).toFixed(1)}%
            </span>
          </div>
        );
      })}
    </div>
  );
};

/** Shared tooltip surface — the base component's popover is light, and an odds
    table in rarity colours needs the dark one it was coloured for. */
export const oddsTooltipClass = "w-60 border border-zinc-700 bg-zinc-950 p-3";

/** "Drop Rates" link with the per-rarity odds tooltip — used by every case card. */
export const DropRates = ({
  probabilities,
  className,
}: {
  probabilities: CaseDefinition["probabilities"];
  className?: string;
}) => (
  <TooltipProvider>
    <Tooltip delayDuration={150}>
      <TooltipTrigger asChild>
        <button
          type='button'
          className={cn(
            "flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-zinc-400 transition-colors hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            className
          )}>
          <Info size={12} />
          Drop Rates
        </button>
      </TooltipTrigger>
      <TooltipContent side='top' className={oddsTooltipClass}>
        <RarityOddsTable probabilities={probabilities} />
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);
