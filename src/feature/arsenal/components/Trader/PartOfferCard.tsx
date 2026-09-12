import { Chip } from "assets/components/ui/chip";
import { cn } from "assets/lib/utils";
import {
  getPartLabel,
  PART_TIER_COLORS,
} from "feature/arsenal/data/partDefinitions";
import type { TraderPartOffer } from "feature/arsenal/types/trader.types";
import type { LucideIcon } from "lucide-react";
import { Minus, Plus } from "lucide-react";
import { useState } from "react";

import { BuyButton } from "../BuyButton";
import { PartIcon } from "../Parts/PartIcon";
import { TierPlate } from "../TierPlate";
import { OfferPrice, StockMeter } from "./offerBits";

interface PartOfferCardProps {
  offer: TraderPartOffer;
  /** Pieces this player can still take today. */
  remaining: number;
  currentFame: number;
  onBuy: (qty: number) => void;
  isBuying: boolean;
}

const PickerButton = ({
  icon: Icon,
  label,
  disabled,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  disabled: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    aria-label={label}
    className='flex h-8 w-9 shrink-0 items-center justify-center rounded-md text-zinc-300 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-30 hover:bg-zinc-100/10 hover:text-white'>
    <Icon size={13} strokeWidth={3} />
  </button>
);

/**
 * One part on the counter. Parts sell by the piece, so the card is a quantity
 * picker rather than a take-it-or-leave-it bundle: a player with thirty Fame to
 * their name can still walk out with something.
 *
 * Read top to bottom the way a shelf label is: the thing, its name and tier,
 * what it costs, how many are left, and the two controls at the foot. The
 * picker and the button sit on one line, because "how many" and "buy" are one
 * decision, and a card that stacked them read as a form.
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
  const tierColor = PART_TIER_COLORS[offer.tier];

  return (
    <div
      className={cn(
        "flex h-full flex-col gap-4 rounded-lg bg-zinc-800/40 p-4 transition-colors",
        soldOut ? "opacity-60" : "hover:bg-zinc-800/60",
      )}>
      <div className='flex items-center gap-3.5'>
        {/* The same lit hollow the stash sockets and the bench bills use, so a
            part on the counter reads as the very object it will become in the
            pile — a bare glyph on flat zinc read as an icon, not as loot. */}
        <TierPlate color={tierColor} size={56}>
          <PartIcon partId={offer.partId} size={36} />
        </TierPlate>
        <div className='flex min-w-0 flex-1 flex-col gap-1'>
          <span className='truncate text-[15px] font-bold leading-tight text-zinc-100'>
            {getPartLabel(offer.partId)}
          </span>
          <span className='flex flex-wrap items-center gap-1.5'>
            <span
              className='text-[11px] font-semibold'
              style={{ color: tierColor }}>
              {offer.tier}
            </span>
            {offer.discountPct > 0 && (
              <Chip color='emerald' className='px-1.5 py-0 text-[10px]'>
                −{offer.discountPct}% today
              </Chip>
            )}
          </span>
        </div>
      </div>

      <OfferPrice
        unitPrice={offer.unitPrice}
        basePrice={offer.discountPct > 0 ? offer.basePrice : undefined}
        suffix='each'
      />

      <StockMeter remaining={remaining} stock={offer.stock} color={tierColor} />

      {!soldOut && (
        <div className='mt-auto flex flex-col gap-2'>
          <div className='flex items-center gap-2'>
            {/* A picker with nothing to pick is just two dead buttons — a slot
                that only ever hands over one piece says so by having no picker. */}
            {remaining > 1 && (
              <span className='flex shrink-0 items-center rounded-lg bg-zinc-900/60 p-0.5'>
                <PickerButton
                  icon={Minus}
                  label='One fewer'
                  disabled={qty <= 1}
                  onClick={() => setQty(Math.max(1, qty - 1))}
                />
                <span className='w-8 text-center text-sm font-black tabular-nums text-white'>
                  {qty}
                </span>
                <PickerButton
                  icon={Plus}
                  label='One more'
                  disabled={qty >= remaining}
                  onClick={() => setQty(Math.min(remaining, qty + 1))}
                />
              </span>
            )}
            <BuyButton
              price={total}
              canAfford={canAfford}
              isBuying={isBuying}
              onClick={() => onBuy(qty)}
              className='min-w-0 flex-1'
            />
          </div>

          {/* Only worth saying while it is the binding limit — not once the
              player could clear the whole slot anyway. */}
          {!canAfford && affordable > 0 && (
            <button
              onClick={() => setQty(Math.min(affordable, remaining))}
              className='self-start rounded text-xs font-medium text-zinc-400 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:text-zinc-200'>
              You can afford {Math.min(affordable, remaining)}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
