import { cn } from "assets/lib/utils";
import {
  getPartLabel,
  PART_TIER_COLORS,
} from "feature/arsenal/data/partDefinitions";
import type { ScrapPart } from "feature/arsenal/types/arsenal.types";
import {
  getWalletTierTotals,
  groupWalletByPart,
} from "feature/arsenal/utils/scrap";
import { Wrench } from "lucide-react";
import { useMemo } from "react";

import { SectionLabel } from "../SectionLabel";
import { PartIcon } from "./PartIcon";

interface PartsWalletProps {
  parts: ScrapPart[];
  /** Lets a host drop the panel's own surface, e.g. inside the workshop's strip. */
  className?: string;
}

/** Everything the player has torn down so far, stacked by part and tier. */
export const PartsWallet = ({ parts, className }: PartsWalletProps) => {
  const rows = useMemo(() => groupWalletByPart(parts), [parts]);
  const tierTotals = useMemo(() => getWalletTierTotals(parts), [parts]);

  return (
    <div
      className={cn(
        "mb-10 flex flex-col gap-5 rounded-lg bg-zinc-900/40 p-6",
        className,
      )}>
      <div className='flex flex-wrap items-end justify-between gap-x-8 gap-y-3'>
        <SectionLabel>Salvaged parts</SectionLabel>

        {/* Split by tier — a grand total tells the player nothing. */}
        <div className='flex flex-wrap items-baseline gap-x-6 gap-y-2'>
          {tierTotals.map(({ tier, qty }) => (
            <span key={tier} className='flex items-baseline gap-1.5'>
              <span className='text-xl font-black tabular-nums text-white'>
                {qty}
              </span>
              <span
                className='text-[11px] font-semibold'
                style={{ color: PART_TIER_COLORS[tier] }}>
                {tier}
              </span>
            </span>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <div className='flex items-center gap-3 py-6 text-zinc-500'>
          <Wrench size={18} className='opacity-40' />
          <p className='text-sm'>
            Scrap a guitar or pedal from your collection to salvage your first
            parts.
          </p>
        </div>
      ) : (
        <div className='grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'>
          {rows.map((row) => (
            <div
              key={row.partId}
              className='flex flex-col gap-3 rounded-lg bg-zinc-800/40 p-4'>
              <div className='flex items-start justify-between gap-3'>
                <PartIcon partId={row.partId} size={60} />
                {/* Per-tier counts, rarest at the top. */}
                <div className='flex flex-col items-end gap-1'>
                  {row.tiers.map((t) => (
                    <span key={t.tier} className='flex items-baseline gap-1.5'>
                      <span
                        className='text-[10px] font-semibold'
                        style={{ color: PART_TIER_COLORS[t.tier] }}>
                        {t.tier}
                      </span>
                      <span className='text-base font-black tabular-nums text-white'>
                        {t.qty}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
              <span className='truncate text-xs font-semibold text-zinc-300'>
                {getPartLabel(row.partId)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
