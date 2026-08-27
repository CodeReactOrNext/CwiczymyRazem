import { getModResaleValue } from "feature/arsenal/data/resale";
import { getModDef } from "feature/arsenal/data/workshop";
import type { SalvagedMod } from "feature/arsenal/types/arsenal.types";
import { Store } from "lucide-react";
import type { ReactNode } from "react";

import { FameCoin } from "../Workshop/FameCoin";
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
  footer,
}: SalvagedModCardProps) => {
  const def = getModDef(mod.kind, mod.featureId);
  const resale = getModResaleValue(mod.kind, mod.featureId, mod.points);
  const noun = mod.kind === "guitar" ? "guitar" : "pedal";

  return (
    <div className='flex flex-col gap-6 rounded-lg bg-zinc-900 p-6'>
      <div className='flex items-center gap-4'>
        <ModArt modId={mod.featureId} size={72} />
        <div className='flex min-w-0 flex-col gap-1'>
          <span className='text-[10px] font-semibold tracking-[0.18em] text-purple-300/70'>
            SALVAGED MOD
          </span>
          {/* Wraps rather than truncates: mod labels run from "18V rail" to
              "Carbon comp resistors", and a clipped name tells the player
              nothing about what they are holding. */}
          <span className='text-lg font-black leading-tight text-white'>
            {def?.label ?? mod.featureId}
          </span>
          <span className='text-2xl font-black tabular-nums text-purple-300'>
            +{mod.points}
          </span>
        </div>
      </div>

      <p className='text-sm leading-relaxed text-zinc-400'>
        {footer
          ? `Fits any ${noun} with a mod slot free, and goes on at +${mod.points} with nothing re-rolled. The workshop cannot build one of these — a mod only ever changes hands.`
          : `Drag it onto any ${noun} that lights up and it goes on at the value it carries: nothing to pay, nothing re-rolled. It is also waiting on the workshop bench.`}
      </p>

      {footer ?? (
        <div className='flex flex-col gap-2'>
          {/* Listed first: a mod nobody can build is worth far more to another
              player than to the bin, and the bin is the fallback rather than
              the obvious move. */}
          {onListClick && (
            <button
              onClick={() => onListClick(mod.id)}
              disabled={isListing}
              className='flex items-center justify-center gap-2 rounded-lg bg-amber-500/15 px-4 py-3 text-sm font-bold text-amber-300 transition-colors disabled:cursor-not-allowed disabled:opacity-40 hover:bg-amber-500/25'>
              <Store size={16} />
              {isListing ? "Listing…" : "Sell on the market"}
            </button>
          )}

          {onSellClick && resale > 0 && (
            <button
              onClick={() => onSellClick(mod.id)}
              disabled={isSelling}
              className='flex items-center justify-center gap-2 rounded-lg bg-zinc-800/60 px-4 py-3 text-sm font-bold text-zinc-200 transition-colors disabled:cursor-not-allowed disabled:opacity-40 hover:bg-red-500/15 hover:text-red-300'>
              <FameCoin size={16} />
              Sell for {resale} Fame
            </button>
          )}
        </div>
      )}
    </div>
  );
};
