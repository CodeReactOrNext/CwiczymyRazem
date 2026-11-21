import { cn } from "assets/lib/utils";
import { useArsenalLabels } from "feature/arsenal/hooks/useArsenalLabels";
import type { TraderModOffer } from "feature/arsenal/types/trader.types";

import { BuyButton } from "../BuyButton";
import { MOD_ACCENT, TierPlate } from "../TierPlate";
import { ModArt } from "../Workshop/ModArt";
import { PurchaseStamp, PurchaseSweep, useTakenHere } from "./purchaseMotion";

interface ModOfferCardProps {
  offer: TraderModOffer;
  /** False once the player has taken today's mod. */
  available: boolean;
  currentFame: number;
  onBuy: () => void;
  isBuying: boolean;
  className?: string;
}

/**
 * The day's mod, on a wide row of its own above the parts list.
 *
 * There is one a day and it is gone once taken, and it is the only thing on the
 * counter a player cannot make at the bench without owning the parts first —
 * so it gets the bigger plate and the counter's one white key. Its roll is
 * written against the best it could have been ("+6 / +8"): that one figure says
 * what a bar and a "top roll" tag used to say three times.
 *
 * It does not show the bench bill the price is derived from. The bill is what
 * prices the mod, not what the buyer is choosing between; the mod, its roll and
 * its price are the offer.
 */
export const ModOfferCard = ({
  offer,
  available,
  currentFame,
  onBuy,
  isBuying,
  className,
}: ModOfferCardProps) => {
  const labels = useArsenalLabels();
  const { t } = labels;
  const canAfford = currentFame >= offer.unitPrice;
  const takenHere = useTakenHere(available);

  return (
    <div
      className={cn(
        "relative flex flex-col gap-4 overflow-hidden rounded-lg bg-zinc-800/40 p-5 transition-colors sm:flex-row sm:items-center sm:gap-6",
        available ? "hover:bg-zinc-800/60" : "opacity-60",
        className,
      )}>
      <PurchaseSweep trigger={takenHere ? 1 : 0} color={MOD_ACCENT} />

      <div className='relative flex min-w-0 flex-1 items-center gap-4 sm:gap-5'>
        {/* Socketed the way the stash board shows a rescued mod: the blueprint
            tile sitting in a hollow lit by the mods' own purple. */}
        <TierPlate color={MOD_ACCENT} size={64} className='shrink-0'>
          <ModArt modId={offer.featureId} size={54} />
        </TierPlate>

        <div className='flex min-w-0 flex-1 flex-col gap-1'>
          <span className='truncate text-xs text-zinc-400'>
            {t("trader.mod_of_day")} ·{" "}
            {offer.modKind === "guitar"
              ? t("trader.guitar_mod")
              : t("trader.pedal_mod")}
          </span>
          <span className='truncate text-lg font-bold leading-tight text-zinc-100'>
            {labels.mod(offer.featureId, offer.label)}
          </span>
          <span className='text-sm tabular-nums text-zinc-400'>
            <span className='font-bold text-zinc-100'>+{offer.points}</span> / +
            {offer.maxPoints}
          </span>
        </div>
      </div>

      <div className='relative flex flex-col sm:items-end'>
        {available ? (
          <BuyButton
            variant='primary'
            price={offer.unitPrice}
            canAfford={canAfford}
            isBuying={isBuying}
            onClick={onBuy}
            size='sm'
            unaffordableLabel={t("buy.buy")}
            className='w-full sm:w-36'
          />
        ) : (
          <PurchaseStamp
            slam={takenHere}
            className='text-xs text-zinc-500 sm:w-36 sm:text-center'>
            {t("trader.taken")}
          </PurchaseStamp>
        )}
      </div>
    </div>
  );
};
