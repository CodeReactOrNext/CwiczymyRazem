import { cn } from "assets/lib/utils";
import { useArsenalLabels } from "feature/arsenal/hooks/useArsenalLabels";
import type { TraderModOffer } from "feature/arsenal/types/trader.types";

import { BuyButton } from "../BuyButton";
import { MOD_ACCENT, TierPlate } from "../TierPlate";
import { ModArt } from "../Workshop/ModArt";
import { RollMeter } from "./offerBits";

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
 * so it gets the bigger plate and its roll drawn on the range it came out of.
 * It still pays through the same button as the parts, on the same right-hand
 * edge: it is a loose component, not a different kind of purchase.
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
  const isTopRoll = offer.points >= offer.maxPoints;

  return (
    <div
      className={cn(
        "relative flex flex-col gap-4 overflow-hidden rounded-lg bg-zinc-800/40 p-4 transition-colors sm:flex-row sm:items-center sm:gap-6 sm:p-5",
        available ? "hover:bg-zinc-800/60" : "opacity-60",
        className,
      )}>
      {/* The mods' own purple, as light off the plate rather than a frame. */}
      <div
        className='pointer-events-none absolute inset-0'
        style={{
          background: `radial-gradient(40% 120% at 0% 50%, ${MOD_ACCENT}1f 0%, transparent 70%)`,
        }}
      />

      <div className='relative flex min-w-0 flex-1 items-center gap-4 sm:gap-5'>
        {/* Socketed the way the stash board shows a rescued mod: the blueprint
            tile sitting in a hollow lit by the mods' own purple. */}
        <TierPlate color={MOD_ACCENT} size={80} className='shrink-0'>
          <ModArt modId={offer.featureId} size={68} />
        </TierPlate>

        <div className='flex min-w-0 flex-1 flex-col gap-2'>
          <span className='flex flex-wrap items-center gap-x-2 gap-y-1 text-xs'>
            <span className='font-semibold text-purple-300'>
              {t("trader.mod_of_day")}
            </span>
            <span className='text-zinc-400'>
              {offer.modKind === "guitar" ? t("trader.guitar_mod") : t("trader.pedal_mod")}
            </span>
            {isTopRoll && (
              <span className='font-semibold text-amber-400'>{t("trader.top_roll")}</span>
            )}
          </span>
          <span className='truncate text-lg font-bold leading-tight text-zinc-100'>
            {labels.mod(offer.featureId, offer.label)}
          </span>
          <RollMeter
            points={offer.points}
            minPoints={offer.minPoints}
            maxPoints={offer.maxPoints}
            color={MOD_ACCENT}
            className='max-w-xs'
          />
        </div>
      </div>

      <div className='relative flex flex-col sm:items-end'>
        {available ? (
          <BuyButton
            price={offer.unitPrice}
            canAfford={canAfford}
            isBuying={isBuying}
            onClick={onBuy}
            size='sm'
            unaffordableLabel={t("buy.buy")}
            className='w-full sm:w-40'
          />
        ) : (
          <span className='text-xs text-zinc-500'>Taken for today</span>
        )}
      </div>
    </div>
  );
};
