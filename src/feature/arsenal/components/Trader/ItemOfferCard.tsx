import { Chip } from "assets/components/ui/chip";
import { EFFECTS_BY_ID } from "feature/arsenal/data/effectDefinitions";
import { GUITARS_BY_ID } from "feature/arsenal/data/guitarDefinitions";
import type {
  EffectInventoryItem,
  InventoryItem,
  ScrapPart,
} from "feature/arsenal/types/arsenal.types";
import type { TraderItemOffer } from "feature/arsenal/types/trader.types";
import {
  getEffectScrapYield,
  getGuitarScrapYield,
} from "feature/arsenal/utils/scrap";
import { Check, Tag } from "lucide-react";

import { BuyButton } from "../BuyButton";
import { EffectCard } from "../GuitarInventory/EffectCard";
import { GuitarCard } from "../GuitarInventory/GuitarCard";
import { ScrapYieldStrip } from "../Parts/ScrapYieldStrip";

/**
 * What the offered instance would break down into. The offer *is* the roll, so
 * this is the same deterministic yield the bought item will pay out — a duplicate
 * model is often worth buying for its parts alone, and that has to be readable
 * before the Fame is spent, not after.
 */
const getOfferScrapYield = (offer: TraderItemOffer): ScrapPart[] => {
  if (offer.kind === "guitar") {
    const guitar = GUITARS_BY_ID.get(offer.roll.guitarId);
    return guitar ? getGuitarScrapYield(offer.roll, guitar) : [];
  }

  const effect = EFFECTS_BY_ID.get(offer.roll.effectId);
  return effect ? getEffectScrapYield(offer.roll, effect) : [];
};

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
 *
 * The price rides on the button, the way it does on every other Fame CTA in the
 * arsenal. The footer used to open with a "Trader" caption, which only repeated
 * the tab the player was already standing in.
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
  const scrapParts = getOfferScrapYield(offer);

  const footer = (
    <div className='flex flex-col gap-2.5 p-2.5'>
      <ScrapYieldStrip parts={scrapParts} />

      {notInCollection && available && (
        <Chip color='amber' className='self-start px-2 py-1 text-[11px]'>
          <Tag size={11} strokeWidth={2.5} className='shrink-0' />
          New for your collection
        </Chip>
      )}

      {available ? (
        <BuyButton
          size='sm'
          price={offer.unitPrice}
          canAfford={canAfford}
          isBuying={isBuying}
          onClick={onBuy}
        />
      ) : (
        <div className='flex h-9 items-center justify-center gap-1.5 rounded-lg bg-zinc-800 text-xs font-semibold text-zinc-400'>
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
