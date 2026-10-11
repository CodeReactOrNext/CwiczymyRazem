import type { TraderComponentOffer } from "feature/arsenal/types/trader.types";
import { ComponentThumb } from "feature/guitarBuilder/components/ComponentThumb";
import { PartPlate } from "feature/guitarBuilder/components/PartPlate";
import { SLOT_LABELS } from "feature/guitarBuilder/data/components";
import {
  getComponent,
  levelRange,
} from "feature/guitarBuilder/utils/components";

import { BuyButton } from "../BuyButton";
import { getRarityColor } from "../RarityBadge";
import {
  OfferRowActions,
  offerRowClass,
  OfferRowIdentity,
  OfferRowPrice,
  OfferRowStats,
  PickerSpacer,
  TakenForToday,
} from "./offerRow";

interface ComponentOfferRowProps {
  offer: TraderComponentOffer;
  /** False once the player has taken this offer in the current window. */
  available: boolean;
  /** Copies of this exact part already in the Builder stash. */
  owned: number;
  currentFame: number;
  onBuy: () => void;
  isBuying: boolean;
}

/**
 * A Guitar Builder part on the price list, one line like every part above it.
 *
 * It lies on the Builder's own wooden bench rather than a tier plate, so it
 * reads as the build part it is — and never as a scrap part or a mod. The level
 * sits over its rarity's ceiling: a part is bought for its roll, and "Lvl 10"
 * alone does not say whether 10 was the best it could have been.
 */
export const ComponentOfferRow = ({
  offer,
  available,
  owned,
  currentFame,
  onBuy,
  isBuying,
}: ComponentOfferRowProps) => {
  const def = getComponent(offer.roll.defId);
  if (!def) return null;

  const [, maxLevel] = levelRange(def);

  return (
    <div className={offerRowClass(!available)}>
      <OfferRowIdentity
        plate={
          <PartPlate className='h-11 w-11'>
            <ComponentThumb def={def} className='h-full p-1' />
          </PartPlate>
        }
        name={def.name}
        detail={
          <>
            <span style={{ color: getRarityColor(def.rarity) }}>
              {def.rarity}
            </span>
            <span className='text-zinc-400'>
              {" "}
              · {SLOT_LABELS[def.slot]} · Lvl {offer.roll.level}/{maxLevel}
            </span>
          </>
        }
      />

      <OfferRowStats
        owned={owned}
        remaining={available ? 1 : 0}
        stock={offer.stock}
      />

      <OfferRowPrice unitPrice={offer.unitPrice} />

      <OfferRowActions>
        {available ? (
          <>
            <PickerSpacer />
            <BuyButton
              price={offer.unitPrice}
              canAfford={currentFame >= offer.unitPrice}
              isBuying={isBuying}
              onClick={onBuy}
              size='sm'
              unaffordableLabel='Buy'
              className='min-w-0 flex-1 sm:w-40 sm:flex-none'
            />
          </>
        ) : (
          <TakenForToday />
        )}
      </OfferRowActions>
    </div>
  );
};
