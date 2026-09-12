import { Chip } from "assets/components/ui/chip";
import { cn } from "assets/lib/utils";
import type { TraderModOffer } from "feature/arsenal/types/trader.types";
import { Sparkles } from "lucide-react";

import { BuyButton } from "../BuyButton";
import { MOD_ACCENT, TierPlate } from "../TierPlate";
import { ModArt } from "../Workshop/ModArt";
import { OfferPrice, RollMeter, TakenToday } from "./offerBits";

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
 * The day's mod, first on the shelf and twice as wide as a part.
 *
 * There is one a day and it is gone once taken, and it is the only thing on the
 * counter a player cannot make at the bench without owning the parts first —
 * so it earns the double card, with the blueprint big and the roll drawn on the
 * range it came out of. It still pays through the same button as everything
 * else: it is a loose component, not a different kind of purchase.
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
  const canAfford = currentFame >= offer.unitPrice;
  const isTopRoll = offer.points >= offer.maxPoints;

  return (
    <div
      className={cn(
        "relative flex h-full flex-col gap-4 overflow-hidden rounded-lg bg-zinc-800/40 p-4 transition-colors sm:flex-row sm:items-stretch sm:gap-6 sm:p-5",
        available ? "hover:bg-zinc-800/60" : "opacity-60",
        className,
      )}>
      {/* The mods' own purple, as light off the plate rather than a frame. */}
      <div
        className='pointer-events-none absolute inset-0'
        style={{
          background: `radial-gradient(70% 90% at 0% 50%, ${MOD_ACCENT}1f 0%, transparent 60%)`,
        }}
      />

      {/* Socketed the way the stash board shows a rescued mod: the blueprint
          tile sitting in a hollow lit by the mods' own purple. */}
      <TierPlate
        color={MOD_ACCENT}
        size={112}
        className='relative shrink-0 self-start'>
        <ModArt modId={offer.featureId} size={96} />
      </TierPlate>

      <div className='relative flex min-w-0 flex-1 flex-col gap-3'>
        <div className='flex flex-wrap items-center gap-2'>
          <Chip color='purple' className='px-2 py-0.5 text-[10px]'>
            <Sparkles size={10} strokeWidth={2.5} />
            Mod of the day
          </Chip>
          <span className='text-[11px] font-semibold text-purple-300'>
            {offer.modKind === "guitar" ? "Guitar mod" : "Pedal mod"}
          </span>
          {isTopRoll && (
            <Chip color='amber' className='px-2 py-0.5 text-[10px]'>
              Top roll
            </Chip>
          )}
        </div>

        <span className='truncate text-xl font-bold leading-tight text-zinc-100'>
          {offer.label}
        </span>

        <RollMeter
          points={offer.points}
          minPoints={offer.minPoints}
          maxPoints={offer.maxPoints}
          color={MOD_ACCENT}
        />

        <div className='mt-auto flex flex-wrap items-center justify-between gap-3 pt-1'>
          <OfferPrice unitPrice={offer.unitPrice} />
          <span className='text-[11px] text-zinc-500'>
            {available ? "1 left · lands in your stash" : "Taken for today"}
          </span>
        </div>

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
