import type { TraderModOffer } from "feature/arsenal/types/trader.types";
import { ShoppingCart } from "lucide-react";

import { MOD_ACCENT, TierPlate } from "../TierPlate";
import { ModArt } from "../Workshop/ModArt";

interface ModOfferCardProps {
  offer: TraderModOffer;
  /** False once the player has taken today's mod. */
  available: boolean;
  currentFame: number;
  onBuy: () => void;
  isBuying: boolean;
}

/**
 * The day's mod, on the shelf with the parts.
 *
 * Built to the same card as `PartOfferCard`, in the same grid: a mod is another
 * loose component the counter sells by the piece, and giving it a wide feature
 * panel of its own said it was a different *kind* of purchase than it is. Same
 * plate, same headline row, same footer — the only thing missing is the quantity
 * picker, because there is exactly one of it.
 *
 * It does not show the bench bill the price is derived from. The bill is what
 * prices the mod, not what the buyer is choosing between: nobody standing at the
 * counter is deciding whether to go and gather three Epic diodes instead, and a
 * card is the wrong place to justify a number. The mod, its roll and its price
 * are the offer.
 */
export const ModOfferCard = ({
  offer,
  available,
  currentFame,
  onBuy,
  isBuying,
}: ModOfferCardProps) => {
  const canAfford = currentFame >= offer.unitPrice;
  const isTopRoll = offer.points >= offer.maxPoints;

  return (
    <div className='flex flex-col gap-5 rounded-lg bg-zinc-800/40 p-5'>
      <div className='flex items-start justify-between gap-3'>
        {/* Socketed the way the stash board shows a rescued mod: the blueprint
            tile sitting in a hollow lit by the mods' own purple. */}
        <TierPlate color={MOD_ACCENT} size={56}>
          <ModArt modId={offer.featureId} size={46} />
        </TierPlate>

        <div className='flex flex-col items-end gap-1'>
          {isTopRoll && (
            <span className='rounded bg-purple-500/15 px-2 py-0.5 text-[10px] font-bold text-purple-300'>
              Top roll
            </span>
          )}
          <span className='text-[10px] font-semibold text-purple-300'>
            {offer.modKind === "guitar" ? "Guitar mod" : "Pedal mod"}
          </span>
          <span className='text-[11px] font-medium tabular-nums text-zinc-500'>
            {available ? "1 left" : "0 left"} / 1
          </span>
        </div>
      </div>

      <div className='flex flex-col gap-1'>
        <span className='flex items-baseline gap-2'>
          <span className='text-xl font-black tabular-nums text-purple-300'>
            +{offer.points}
          </span>
          {/* The ceiling belongs to the roll, not to the price — a `+3` means
              nothing without knowing whether 4 or 8 was the best it could be. */}
          <span className='text-[11px] tabular-nums text-zinc-500'>
            of {offer.maxPoints}
          </span>
          <span className='min-w-0 truncate text-sm font-bold text-zinc-100'>
            {offer.label}
          </span>
        </span>
        <span className='flex items-center gap-1.5 font-black text-amber-400'>
          <img
            src='/images/coin.png'
            alt='coin'
            className='h-4 w-4 object-contain'
          />
          {offer.unitPrice.toLocaleString()}
        </span>
      </div>

      {available ? (
        <button
          onClick={onBuy}
          disabled={isBuying || !canAfford}
          title={!canAfford ? "Not enough Fame Points" : undefined}
          className='flex items-center justify-center gap-1.5 rounded bg-amber-600 py-2 text-xs font-bold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-40 hover:bg-amber-700'>
          <ShoppingCart size={13} strokeWidth={2.5} />
          {isBuying ? "Buying..." : canAfford ? "Buy" : "Not enough Fame"}
        </button>
      ) : (
        <p className='py-2 text-center text-xs font-semibold text-zinc-500'>
          Taken for today
        </p>
      )}
    </div>
  );
};
