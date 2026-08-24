import {
  getPartLabel,
  PART_TIER_COLORS,
} from "feature/arsenal/data/partDefinitions";
import type { TraderPartOffer } from "feature/arsenal/types/trader.types";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { useState } from "react";

import { PartIcon } from "../Parts/PartIcon";
import { TierPlate } from "../TierPlate";

interface PartOfferCardProps {
  offer: TraderPartOffer;
  /** Pieces this player can still take today. */
  remaining: number;
  currentFame: number;
  onBuy: (qty: number) => void;
  isBuying: boolean;
}

/**
 * One part on the counter. Parts sell by the piece, so the card is a quantity
 * picker rather than a take-it-or-leave-it bundle: a player with thirty Fame to
 * their name can still walk out with something.
 */
export const PartOfferCard = ({
  offer,
  remaining,
  currentFame,
  onBuy,
  isBuying,
}: PartOfferCardProps) => {
  const [picked, setQty] = useState(1);
  // Clamped on the way out rather than stored clamped: a restock, or a purchase
  // that emptied the slot, must never leave the picker on a quantity that can no
  // longer be bought.
  const qty = Math.min(Math.max(1, picked), Math.max(1, remaining));

  const affordable = Math.floor(currentFame / offer.unitPrice);
  const total = offer.unitPrice * qty;
  const soldOut = remaining === 0;
  const canAfford = currentFame >= total;

  return (
    <div className='flex flex-col gap-5 rounded-lg bg-zinc-800/40 p-5'>
      <div className='flex items-start justify-between gap-3'>
        {/* The same lit hollow the stash sockets and the bench bills use, so a
            part on the counter reads as the very object it will become in the
            pile — a bare glyph on flat zinc read as an icon, not as loot. */}
        <TierPlate color={PART_TIER_COLORS[offer.tier]} size={72}>
          <PartIcon partId={offer.partId} size={40} />
        </TierPlate>
        <div className='flex flex-col items-end gap-1'>
          {offer.discountPct > 0 && (
            <span className='rounded bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-400'>
              −{offer.discountPct}% today
            </span>
          )}
          <span
            className='text-[10px] font-semibold'
            style={{ color: PART_TIER_COLORS[offer.tier] }}>
            {offer.tier}
          </span>
          <span className='text-[11px] font-medium tabular-nums text-zinc-500'>
            {remaining} / {offer.stock} left
          </span>
        </div>
      </div>

      <div className='flex flex-col gap-1'>
        <span className='truncate text-sm font-bold text-zinc-100'>
          {getPartLabel(offer.partId)}
        </span>
        <span className='flex items-baseline gap-2'>
          <span className='flex items-center gap-1.5 font-black text-amber-400'>
            <img
              src='/images/coin.png'
              alt='coin'
              className='h-4 w-4 object-contain'
            />
            {offer.unitPrice}
          </span>
          {offer.discountPct > 0 && (
            <span className='text-xs font-semibold text-zinc-500 line-through'>
              {offer.basePrice}
            </span>
          )}
          <span className='text-[11px] text-zinc-500'>each</span>
        </span>
      </div>

      {soldOut ? (
        <p className='py-2 text-center text-xs font-semibold text-zinc-500'>
          Taken for today
        </p>
      ) : (
        <div className='flex flex-col gap-3'>
          {/* A picker with nothing to pick is just two dead buttons — a slot that
              only ever hands over one piece says so by having no picker. */}
          {remaining > 1 && (
            <div className='flex items-center justify-between gap-2'>
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                disabled={qty <= 1}
                aria-label='One fewer'
                className='flex h-8 w-8 items-center justify-center rounded bg-zinc-900/60 text-zinc-300 transition-colors disabled:opacity-30 hover:bg-zinc-900'>
                <Minus size={14} strokeWidth={3} />
              </button>
              <span className='text-lg font-black tabular-nums text-white'>
                {qty}
              </span>
              <button
                onClick={() => setQty(Math.min(remaining, qty + 1))}
                disabled={qty >= remaining}
                aria-label='One more'
                className='flex h-8 w-8 items-center justify-center rounded bg-zinc-900/60 text-zinc-300 transition-colors disabled:opacity-30 hover:bg-zinc-900'>
                <Plus size={14} strokeWidth={3} />
              </button>
            </div>
          )}

          <button
            onClick={() => onBuy(qty)}
            disabled={isBuying || !canAfford}
            title={!canAfford ? "Not enough Fame Points" : undefined}
            className='flex items-center justify-center gap-1.5 rounded bg-amber-600 py-2 text-xs font-bold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-40 hover:bg-amber-700'>
            <ShoppingCart size={13} strokeWidth={2.5} />
            {isBuying
              ? "Buying..."
              : canAfford
                ? `Buy for ${total}`
                : "Not enough Fame"}
          </button>

          {/* Only worth saying while it is the binding limit — not once the
              player could clear the whole slot anyway. */}
          {!canAfford && affordable > 0 && (
            <button
              onClick={() => setQty(Math.min(affordable, remaining))}
              className='text-[11px] font-medium text-zinc-500 transition-colors hover:text-zinc-300'>
              You can afford {Math.min(affordable, remaining)}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
