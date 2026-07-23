import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "assets/components/ui/tooltip";
import { Info } from "lucide-react";

import type { CaseDefinition, GuitarRarity } from "../../types/arsenal.types";
import { RARITY_STYLES } from "../RarityBadge";

/** "Drop Rates" link with the per-rarity odds tooltip — shared by every case card. */
export const DropRates = ({
  probabilities,
}: {
  probabilities: CaseDefinition["probabilities"];
}) => {
  const probs = Object.entries(probabilities) as [GuitarRarity, number][];
  return (
    <TooltipProvider>
      <Tooltip delayDuration={150}>
        <TooltipTrigger asChild>
          <button
            type='button'
            className='flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-zinc-400 transition-colors hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'>
            <Info size={12} />
            Drop Rates
          </button>
        </TooltipTrigger>
        <TooltipContent side='top' className='w-60 border border-zinc-700 bg-zinc-950 p-3'>
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
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
