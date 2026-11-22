import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "assets/components/ui/tooltip";
import type { ScrapPart } from "feature/arsenal/types/arsenal.types";
import { countScrapParts } from "feature/arsenal/utils/scrap";
import { useTranslation } from "hooks/useTranslation";

import { PartIcon } from "./PartIcon";
import { ScrapYieldList } from "./ScrapYieldList";

interface ScrapYieldStripProps {
  parts: ScrapPart[];
}

/**
 * One line saying what an instance breaks down into, with the full payout behind
 * a hover. Teardown value is half the reason to buy a duplicate, so it belongs
 * next to the price on a card that sells something. The parts on the left, the
 * count on the right edge — a row of a small table rather than a sentence, so
 * it lines up with the mod row a listing puts under it.
 *
 * Only the parts. What *mod* survives a teardown is a function of the item's own
 * id, and the trader has not minted one yet, so that strip stays on the listings
 * where the instance already exists.
 */
export const ScrapYieldStrip = ({ parts }: ScrapYieldStripProps) => {
  const { t } = useTranslation("arsenal");
  if (parts.length === 0) return null;

  const total = countScrapParts(parts);

  return (
    <TooltipProvider>
      <Tooltip delayDuration={150}>
        <TooltipTrigger asChild>
          <div className='flex cursor-help items-center justify-between gap-3'>
            <span className='flex min-w-0 items-center gap-1.5 overflow-hidden'>
              {parts.map((part) => (
                <PartIcon
                  key={`${part.partId}:${part.tier}`}
                  partId={part.partId}
                  size={24}
                />
              ))}
            </span>
            <span className='shrink-0 text-xs tabular-nums text-zinc-300'>
              {t("trader.scrap_parts", { count: total })}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent
          side='top'
          className='tooltip-ink max-w-[260px]'>
          <div className='flex flex-col gap-1.5'>
            <span className='text-xs text-black/60'>
              {t("card.scraps_into", { count: total })}
            </span>
            <ScrapYieldList parts={parts} compact />
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
