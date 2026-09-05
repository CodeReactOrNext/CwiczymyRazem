import { Chip } from "assets/components/ui/chip";
import type { TraderModOffer } from "feature/arsenal/types/trader.types";

import { BuyButton } from "../BuyButton";
import { MOD_ACCENT, TierPlate } from "../TierPlate";
import { ModArt } from "../Workshop/ModArt";
import { OfferPrice, TakenToday } from "./offerBits";

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
    <div className='flex h-full flex-col gap-5 rounded-lg bg-zinc-800/40 p-5'>
      <div className='flex items-start justify-between gap-3'>
        {/* Socketed the way the stash board shows a rescued mod: the blueprint
            tile sitting in a hollow lit by the mods' own purple. */}
        <TierPlate color={MOD_ACCENT} size={64}>
          <ModArt modId={offer.featureId} size={52} />
        </TierPlate>

        <div className='flex flex-col items-end gap-1.5 text-right'>
          {isTopRoll && (
            <Chip color='purple' className='px-2 py-0.5'>
              Top roll
            </Chip>
          )}
          <span className='text-xs font-semibold text-purple-300'>
            {offer.modKind === "guitar" ? "Guitar mod" : "Pedal mod"}
          </span>
          <span className='text-xs tabular-nums text-zinc-400'>
            {available ? "1 left" : "Taken today"}
          </span>
        </div>
      </div>

      <div className='flex flex-col gap-1.5'>
        <span className='truncate text-base font-bold text-zinc-100'>
          {offer.label}
        </span>
        {/* The ceiling belongs to the roll, not to the price — a `+3` means
            nothing without knowing whether 4 or 8 was the best it could be. */}
        <span className='flex items-baseline gap-1.5'>
          <span className='text-lg font-black tabular-nums text-purple-300'>
            +{offer.points}
          </span>
          <span className='text-xs tabular-nums text-zinc-400'>
            of {offer.maxPoints} max
          </span>
        </span>
        <OfferPrice unitPrice={offer.unitPrice} />
      </div>

      <div className='mt-auto flex flex-col gap-3'>
        {available ? (
          <BuyButton
            price={offer.unitPrice}
            canAfford={canAfford}
            isBuying={isBuying}
            onClick={onBuy}
          />
        ) : (
          <TakenToday />
        )}
      </div>
    </div>
  );
};
