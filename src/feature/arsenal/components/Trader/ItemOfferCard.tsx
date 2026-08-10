import type {
  EffectInventoryItem,
  InventoryItem,
} from "feature/arsenal/types/arsenal.types";
import type { TraderItemOffer } from "feature/arsenal/types/trader.types";
import { Check, ShoppingCart, Tag } from "lucide-react";

import { EffectCard } from "../GuitarInventory/EffectCard";
import { GuitarCard } from "../GuitarInventory/GuitarCard";

interface ItemOfferCardProps {
  offer: TraderItemOffer;
  /** False once the player has taken this offer in the current window. */
  available: boolean;
  /** True when the player doesn't own this model yet. */
  notInCollection: boolean;
  currentFame: number;
  onBuy: () => void;
  isBuying: boolean;
}

/**
 * The featured instrument, rendered as the same trading card the collection and
 * the marketplace use — the offer *is* the instance, rolled from the window seed,
 * so condition, features and vintage are all on the card before paying.
 */
export const ItemOfferCard = ({
  offer,
  available,
  notInCollection,
  currentFame,
  onBuy,
  isBuying,
}: ItemOfferCardProps) => {
  const canAfford = currentFame >= offer.unitPrice;

  const footer = (
    <div className='flex flex-col gap-2 p-2.5'>
      <div className='flex items-center justify-between gap-2'>
        <span className='text-[10px] font-bold capitalize tracking-wider text-zinc-500'>
          Trader
        </span>
        <span className='flex shrink-0 items-center gap-1 font-black text-amber-400'>
          <img src='/images/coin.png' alt='coin' className='h-4 w-4 object-contain' />
          {offer.unitPrice.toLocaleString()}
        </span>
      </div>

      {notInCollection && available && (
        <div className='flex items-center gap-1.5 rounded bg-amber-500/10 px-2 py-1 text-[10px] font-medium text-amber-300'>
          <Tag size={11} strokeWidth={2.5} className='shrink-0' />
          <span>New for your collection</span>
        </div>
      )}

      {available ? (
        <button
          onClick={onBuy}
          disabled={isBuying || !canAfford}
          title={!canAfford ? "Not enough Fame Points" : undefined}
          className='flex items-center justify-center gap-1.5 rounded bg-amber-600 py-2 text-xs font-bold text-white transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-40'>
          <ShoppingCart size={13} strokeWidth={2.5} />
          {isBuying ? "Buying..." : canAfford ? "Buy" : "Not enough Fame"}
        </button>
      ) : (
        <div className='flex items-center justify-center gap-1.5 rounded bg-zinc-800 py-2 text-xs font-semibold text-zinc-400'>
          <Check size={13} strokeWidth={3} />
          Bought today
        </div>
      )}
    </div>
  );

  if (offer.kind === "guitar") {
    // acquiredAt/isNew belong to an owned instance; a shop preview has neither.
    const preview: InventoryItem = {
      ...offer.roll,
      id: offer.id,
      acquiredAt: 0,
      isNew: false,
    };
    return <GuitarCard item={preview} readOnly footer={footer} />;
  }

  const preview: EffectInventoryItem = {
    ...offer.roll,
    id: offer.id,
    acquiredAt: 0,
    isNew: false,
  };
  return <EffectCard item={preview} readOnly footer={footer} />;
};
