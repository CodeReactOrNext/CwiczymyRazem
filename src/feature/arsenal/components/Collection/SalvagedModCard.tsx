import { PRESSABLE } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { getModResaleValue } from "feature/arsenal/data/resale";
import { getModDef } from "feature/arsenal/data/workshop";
import { useArsenalLabels } from "feature/arsenal/hooks/useArsenalLabels";
import type { SalvagedMod } from "feature/arsenal/types/arsenal.types";
import { Hammer, Store } from "lucide-react";
import type { ReactNode } from "react";

import { FameCoin } from "../Workshop/FameCoin";
import { GO_KEY } from "../Workshop/goKey";
import { ModArt } from "../Workshop/ModArt";

interface SalvagedModCardProps {
  mod: SalvagedMod;
  /** Absent on the hover card — a tooltip is a look, not a place to act. */
  onSellClick?: (modId: string) => void;
  isSelling?: boolean;
  /** Puts the mod on the player-to-player market instead of in the bin. */
  onListClick?: (modId: string) => void;
  isListing?: boolean;
  /**
   * An instrument with a free slot that takes this mod, and the way onto its
   * bench. Absent when nothing the player owns has room for it.
   */
  install?: { targetName: string; onClick: () => void };
  /**
   * Replaces the card's own buttons, the way `GuitarCard` takes one: the
   * marketplace puts seller, price and a Buy button here. Its presence also
   * means the viewer does not own this mod, which changes what the card says.
   */
  footer?: ReactNode;
}

/**
 * What a rescued mod is, opened from its socket.
 *
 * It has no card of its own anywhere else in the game — it is not gear you can
 * play, it is a component waiting for an instrument — so this is the one place
 * that says what it is worth and what can be done with it. The marketplace
 * borrows the same card for a listing rather than growing a near-copy: a mod on
 * sale is the same object, described the same way, with a different footer.
 */
export const SalvagedModCard = ({
  mod,
  onSellClick,
  isSelling = false,
  onListClick,
  isListing = false,
  install,
  footer,
}: SalvagedModCardProps) => {
  const def = getModDef(mod.kind, mod.featureId);
  const resale = getModResaleValue(mod.kind, mod.featureId, mod.points);
  const labels = useArsenalLabels();
  const { t } = labels;

  return (
    <div className='flex flex-col gap-6 rounded-lg bg-zinc-900 p-6'>
      <div className='flex items-center gap-4'>
        <ModArt modId={mod.featureId} size={72} />
        <div className='flex min-w-0 flex-col gap-1'>
          <span className='text-xs font-medium text-purple-300/70'>
            {t("salvage.salvaged_mod_caps")}
          </span>
          {/* Wraps rather than truncates: mod labels run from "18V rail" to
              "Carbon comp resistors", and a clipped name tells the player
              nothing about what they are holding. */}
          <span className='text-lg font-black leading-tight text-white'>
            {labels.mod(mod.featureId, def?.label ?? mod.featureId)}
          </span>
          <span className='text-2xl font-black tabular-nums text-purple-300'>
            +{mod.points}
          </span>
        </div>
      </div>

      <p className='text-sm leading-relaxed text-zinc-400'>
        {footer
          ? t(`salvage.mod_listing_body.${mod.kind}`, { points: mod.points })
          : t(`salvage.mod_owned_body.${mod.kind}`)}
      </p>

      {footer ?? (
        <div className='flex flex-col gap-2'>
          {/* The constructive move first: a mod is a component waiting for an
              instrument, and here is one with room for it. */}
          {install && (
            <button
              onClick={install.onClick}
              className={cn(GO_KEY, "flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-bold")}>
              <Hammer size={16} strokeWidth={2.5} />
              {t("stash.menu.install_on", { name: install.targetName })}
            </button>
          )}

          {/* Listed first: a mod nobody can build is worth far more to another
              player than to the bin, and the bin is the fallback rather than
              the obvious move. */}
          {onListClick && (
            <button
              onClick={() => onListClick(mod.id)}
              disabled={isListing}
              className={cn(PRESSABLE, "flex items-center justify-center gap-2 rounded-lg bg-amber-500/15 px-4 py-3 text-sm font-bold text-amber-300 transition-colors disabled:cursor-not-allowed disabled:opacity-40 hover:bg-amber-500/25 border-b-black/30")}>
              <Store size={16} />
              {isListing ? t("market.listing") : t("market.sell_on_market")}
            </button>
          )}

          {onSellClick && resale > 0 && (
            <button
              onClick={() => onSellClick(mod.id)}
              disabled={isSelling}
              className={cn(PRESSABLE, "flex items-center justify-center gap-2 rounded-lg bg-zinc-800/60 px-4 py-3 text-sm font-bold text-zinc-200 transition-colors disabled:cursor-not-allowed disabled:opacity-40 hover:bg-red-500/15 hover:text-red-300 border-b-black/30")}>
              <FameCoin size={16} />
              {t("common.sell_for", { fame: resale })}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
