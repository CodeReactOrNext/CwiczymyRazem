import { Chip } from "assets/components/ui/chip";
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
import { OfferPrice, TakenToday } from "./offerBits";

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
    className='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-900/60 text-zinc-300 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-30 hover:bg-zinc-900 hover:text-white'>
    <Icon size={14} strokeWidth={3} />
  </button>
);

/**
 * One part on the counter. Parts sell by the piece, so the card is a quantity
 * picker rather than a take-it-or-leave-it bundle: a player with thirty Fame to
 * their name can still walk out with something.
 *
 * Same anatomy as the mod card beside it — plate, tier and stock top right, name
 * and price, then the footer pinned to the bottom so a row of cards lines up
 * whether or not a card has a picker.
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
    <div className='flex h-full flex-col gap-5 rounded-lg bg-zinc-800/40 p-5'>
      <div className='flex items-start justify-between gap-3'>
        {/* The same lit hollow the stash sockets and the bench bills use, so a
            part on the counter reads as the very object it will become in the
            pile — a bare glyph on flat zinc read as an icon, not as loot. */}
        <TierPlate color={tierColor} size={64}>
          <PartIcon partId={offer.partId} size={40} />
        </TierPlate>
        <div className='flex flex-col items-end gap-1.5 text-right'>
          {offer.discountPct > 0 && (
            <Chip color='emerald' className='px-2 py-0.5'>
              −{offer.discountPct}% today
            </Chip>
          )}
          <span className='text-xs font-semibold' style={{ color: tierColor }}>
            {offer.tier}
          </span>
          <span className='text-xs tabular-nums text-zinc-400'>
            {remaining} / {offer.stock} left
          </span>
        </div>
      </div>

      <div className='flex flex-col gap-1.5'>
        <span className='truncate text-base font-bold text-zinc-100'>
          {getPartLabel(offer.partId)}
        </span>
        <OfferPrice
          unitPrice={offer.unitPrice}
          basePrice={offer.discountPct > 0 ? offer.basePrice : undefined}
          suffix='each'
        />
      </div>

      <div className='mt-auto flex flex-col gap-3'>
        {soldOut ? (
          <TakenToday />
        ) : (
          <>
            {/* A picker with nothing to pick is just two dead buttons — a slot
                that only ever hands over one piece says so by having no picker. */}
            {remaining > 1 && (
              <div className='flex items-center gap-2'>
                <PickerButton
                  icon={Minus}
                  label='One fewer'
                  disabled={qty <= 1}
                  onClick={() => setQty(Math.max(1, qty - 1))}
                />
                <span className='flex-1 text-center text-lg font-black tabular-nums text-white'>
                  {qty}
                </span>
                <PickerButton
                  icon={Plus}
                  label='One more'
                  disabled={qty >= remaining}
                  onClick={() => setQty(Math.min(remaining, qty + 1))}
                />
              </div>
            )}

            <BuyButton
              price={total}
              canAfford={canAfford}
              isBuying={isBuying}
              onClick={() => onBuy(qty)}
            />

            {/* Only worth saying while it is the binding limit — not once the
                player could clear the whole slot anyway. */}
            {!canAfford && affordable > 0 && (
              <button
                onClick={() => setQty(Math.min(affordable, remaining))}
                className='rounded text-xs font-medium text-zinc-400 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:text-zinc-200'>
                You can afford {Math.min(affordable, remaining)}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};
