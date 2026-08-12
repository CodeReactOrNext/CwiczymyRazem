import {
  getPartLabel,
  PART_TIER_COLORS,
} from "feature/arsenal/data/partDefinitions";
import { getPartResaleValue } from "feature/arsenal/data/resale";
import type { PartId, PartTier } from "feature/arsenal/types/arsenal.types";

import { PartIcon } from "../Parts/PartIcon";
import { TierPlate } from "../TierPlate";
import { FameCoin } from "../Workshop/FameCoin";

interface ScrapPartCardProps {
  partId: PartId;
  tier: PartTier;
  /** How many pieces of this exact tier the player is holding. */
  qty: number;
  /** Absent on the hover card — a tooltip is a look, not a place to act. */
  onSellClick?: (qty: number) => void;
  isSelling?: boolean;
}

/**
 * What a stack of loose parts is, opened from its socket.
 *
 * Parts are a currency and have no card anywhere else, so this is where the
 * stack says what it is worth: what the workshop spends it on, and what the
 * counter pays for it if the player would rather have the Fame.
 */
export const ScrapPartCard = ({
  partId,
  tier,
  qty,
  onSellClick,
  isSelling = false,
}: ScrapPartCardProps) => {
  const color = PART_TIER_COLORS[tier];
  const one = getPartResaleValue(partId, tier, 1);
  const all = getPartResaleValue(partId, tier, qty);

  return (
    <div className='flex flex-col gap-6 rounded-lg bg-zinc-900 p-6'>
      <div className='flex items-center gap-4'>
        <TierPlate color={color} size={72}>
          <PartIcon partId={partId} size={40} />
        </TierPlate>
        <div className='flex min-w-0 flex-col gap-1'>
          <span
            className='text-[10px] font-semibold tracking-[0.18em]'
            style={{ color }}>
            {tier.toUpperCase()} PART
          </span>
          <span className='truncate text-lg font-black text-white'>
            {getPartLabel(partId)}
          </span>
          <span className='text-2xl font-black tabular-nums text-zinc-300'>
            ×{qty}
          </span>
        </div>
      </div>

      <p className='text-sm text-zinc-400'>
        Spent on the workshop bench — builds, repairs and mods all bill in
        parts. Selling is for what the bench will never ask for.
      </p>

      {onSellClick && one > 0 && (
        <div className='flex flex-col gap-2'>
          <button
            onClick={() => onSellClick(qty)}
            disabled={isSelling}
            className='flex items-center justify-center gap-2 rounded-lg bg-zinc-800/60 px-4 py-3 text-sm font-bold text-zinc-200 transition-colors disabled:cursor-not-allowed disabled:opacity-40 hover:bg-red-500/15 hover:text-red-300'>
            <FameCoin size={16} />
            Sell {qty > 1 ? `all ${qty}` : "it"} for {all} Fame
          </button>

          {/* Trimming a stack is the common case: the bench wants some of it. */}
          {qty > 1 && (
            <button
              onClick={() => onSellClick(1)}
              disabled={isSelling}
              className='rounded-lg px-4 py-2 text-xs font-bold text-zinc-500 transition-colors disabled:cursor-not-allowed disabled:opacity-40 hover:bg-zinc-800/40 hover:text-zinc-300'>
              Sell one for {one} Fame
            </button>
          )}
        </div>
      )}
    </div>
  );
};
