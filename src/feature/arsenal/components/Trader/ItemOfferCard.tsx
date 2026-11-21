import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "assets/components/ui/tooltip";
import { EFFECTS_BY_ID } from "feature/arsenal/data/effectDefinitions";
import { GUITARS_BY_ID } from "feature/arsenal/data/guitarDefinitions";
import type {
  EffectInventoryItem,
  InventoryItem,
  ScrapPart,
} from "feature/arsenal/types/arsenal.types";
import type { TraderItemOffer } from "feature/arsenal/types/trader.types";
import type { DexStatus } from "feature/arsenal/utils/dex";
import {
  countScrapParts,
  getEffectScrapYield,
  getGuitarScrapYield,
} from "feature/arsenal/utils/scrap";
import { useTranslation } from "hooks/useTranslation";

import { BuyButton } from "../BuyButton";
import { DexWord } from "../DexMarks";
import { EffectCard } from "../GuitarInventory/EffectCard";
import { GuitarCard } from "../GuitarInventory/GuitarCard";
import { ScrapYieldList } from "../Parts/ScrapYieldList";
import { PurchaseStamp, useTakenHere } from "./purchaseMotion";

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
  /**
   * Where this model stands with the player — owned, on the Dex, or new. The
   * same answer the market and the guild's shelf show, read off the same
   * lookup, so a duplicate is a duplicate wherever it is offered.
   */
  dexStatus?: DexStatus;
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
 * arsenal. Above it the footer is one line of two facts: where the model stands
 * with the player, and how many parts this copy breaks down into — the payout
 * itself is behind a hover, since the count is what decides a purchase.
 */
export const ItemOfferCard = ({
  offer,
  available,
  dexStatus,
  currentFame,
  onBuy,
  isBuying,
}: ItemOfferCardProps) => {
  const { t } = useTranslation("arsenal");
  const canAfford = currentFame >= offer.unitPrice;
  const takenHere = useTakenHere(available);
  const scrapParts = getOfferScrapYield(offer);
  const scrapTotal = countScrapParts(scrapParts);

  const footer = (
    <div className='flex flex-col gap-3 p-3'>
      <div className='flex items-baseline justify-between gap-3 text-xs text-zinc-300'>
        {dexStatus ? (
          <DexWord status={dexStatus} className='min-w-0' />
        ) : (
          <span />
        )}
        {scrapTotal > 0 && (
          <TooltipProvider>
            <Tooltip delayDuration={150}>
              <TooltipTrigger asChild>
                <span className='shrink-0 cursor-help tabular-nums'>
                  {t("trader.scrap_parts", { count: scrapTotal })}
                </span>
              </TooltipTrigger>
              <TooltipContent
                side='top'
                className='max-w-[260px] border border-zinc-700 bg-zinc-950 text-white'>
                <div className='flex flex-col gap-1.5'>
                  <span className='text-xs text-zinc-400'>
                    {t("card.scraps_into", { count: scrapTotal })}
                  </span>
                  <ScrapYieldList parts={scrapParts} compact />
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {available ? (
        <BuyButton
          variant='key'
          size='sm'
          price={offer.unitPrice}
          canAfford={canAfford}
          isBuying={isBuying}
          onClick={onBuy}
        />
      ) : (
        <PurchaseStamp
          slam={takenHere}
          className='flex h-9 items-center justify-center text-xs text-zinc-500'>
          {t("trader.taken")}
        </PurchaseStamp>
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
