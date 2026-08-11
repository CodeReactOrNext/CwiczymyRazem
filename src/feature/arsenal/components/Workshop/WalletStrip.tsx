import { cn } from "assets/lib/utils";
import { PART_TIER_COLORS } from "feature/arsenal/data/partDefinitions";
import type { ScrapPart } from "feature/arsenal/types/arsenal.types";
import { getWalletTierTotals } from "feature/arsenal/utils/scrap";
import { ChevronDown, Wrench } from "lucide-react";
import { useMemo, useState } from "react";

import { PartsWallet } from "../Parts/PartsWallet";

interface WalletStripProps {
  parts: ScrapPart[];
}

/**
 * What is in the parts bin, without leaving the bench.
 *
 * Each job already spells out the parts it consumes, but planning — "can I make
 * anything at all today?" — needs the stock itself, and it used to live one tab
 * away in Collection. The strip stays with the player as they scroll the rack,
 * and unfolds into the same full wallet the Collection tab shows.
 */
export const WalletStrip = ({ parts }: WalletStripProps) => {
  const [open, setOpen] = useState(false);
  const tierTotals = useMemo(() => getWalletTierTotals(parts), [parts]);

  return (
    <div className='sticky top-0 z-20 flex flex-col gap-4 rounded-lg bg-zinc-900/80 p-4 backdrop-blur'>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={cn(
          "flex flex-wrap items-center gap-x-6 gap-y-2 text-left",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/50",
        )}>
        <span className='flex items-center gap-2.5'>
          <Wrench size={16} className='text-zinc-500' />
          <span className='text-sm font-bold text-zinc-200'>Parts</span>
        </span>

        <span className='flex min-w-0 flex-1 flex-wrap items-baseline gap-x-5 gap-y-1'>
          {tierTotals.length === 0 ? (
            <span className='text-xs text-zinc-500'>
              Nothing salvaged yet — scrap something from your collection.
            </span>
          ) : (
            tierTotals.map(({ tier, qty }) => (
              <span key={tier} className='flex items-baseline gap-1.5'>
                <span className='text-base font-black tabular-nums text-white'>
                  {qty}
                </span>
                <span
                  className='text-[11px] font-semibold'
                  style={{ color: PART_TIER_COLORS[tier] }}>
                  {tier}
                </span>
              </span>
            ))
          )}
        </span>

        <ChevronDown
          size={16}
          className={cn(
            "shrink-0 text-zinc-500 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <PartsWallet parts={parts} className='mb-0 bg-transparent p-0' />
      )}
    </div>
  );
};
