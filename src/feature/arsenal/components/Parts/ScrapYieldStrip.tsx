import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "assets/components/ui/tooltip";
import type { ScrapPart } from "feature/arsenal/types/arsenal.types";
import { countScrapParts } from "feature/arsenal/utils/scrap";
import { Wrench } from "lucide-react";

import { PartIcon } from "./PartIcon";
import { ScrapYieldList } from "./ScrapYieldList";

interface ScrapYieldStripProps {
  parts: ScrapPart[];
}

/**
 * One line saying what an instance breaks down into, with the full payout behind
 * a hover. Teardown value is half the reason to buy a duplicate, so it belongs
 * next to the price on every card that sells something — the marketplace listing
 * and the trader's counter both, which is why this is shared rather than copied.
 *
 * Only the parts. What *mod* survives a teardown is a function of the item's own
 * id, and the trader has not minted one yet, so that strip stays on the listings
 * where the instance already exists.
 */
export const ScrapYieldStrip = ({ parts }: ScrapYieldStripProps) => {
  if (parts.length === 0) return null;

  const total = countScrapParts(parts);

  return (
    <TooltipProvider>
      <Tooltip delayDuration={150}>
        <TooltipTrigger asChild>
          <div className='flex cursor-help items-center gap-2 text-zinc-500 transition-colors hover:text-orange-400'>
            <Wrench size={13} strokeWidth={2.5} className='shrink-0' />
            <span className='flex items-center gap-1'>
              {parts.map((part) => (
                <PartIcon
                  key={`${part.partId}:${part.tier}`}
                  partId={part.partId}
                  size={24}
                />
              ))}
            </span>
            <span className='text-[11px] font-semibold tabular-nums'>
              {total} parts
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent
          side='top'
          className='max-w-[260px] border border-zinc-700 bg-zinc-950 text-white'>
          <div className='flex flex-col gap-1.5'>
            <span className='text-[10px] font-bold capitalize tracking-wider text-zinc-400'>
              Scraps into {total} parts
            </span>
            <ScrapYieldList parts={parts} compact />
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
