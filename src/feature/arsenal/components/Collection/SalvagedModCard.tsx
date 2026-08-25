import { getModResaleValue } from "feature/arsenal/data/resale";
import { getModDef } from "feature/arsenal/data/workshop";
import type { SalvagedMod } from "feature/arsenal/types/arsenal.types";

import { FameCoin } from "../Workshop/FameCoin";
import { ModArt } from "../Workshop/ModArt";

interface SalvagedModCardProps {
  mod: SalvagedMod;
  /** Absent on the hover card — a tooltip is a look, not a place to act. */
  onSellClick?: (modId: string) => void;
  isSelling?: boolean;
}

/**
 * What a rescued mod is, opened from its socket.
 *
 * It has no card of its own anywhere else in the game — it is not gear you can
 * play, it is a component waiting for an instrument — so this is the one place
 * that says what it is worth and what can be done with it.
 */
export const SalvagedModCard = ({
  mod,
  onSellClick,
  isSelling = false,
}: SalvagedModCardProps) => {
  const def = getModDef(mod.kind, mod.featureId);
  const resale = getModResaleValue(mod.kind, mod.featureId, mod.points);

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

      <p className='text-sm text-zinc-400'>
        Drag it onto any {mod.kind === "guitar" ? "guitar" : "pedal"} that
        lights up and it goes on at the value it carries: nothing to pay,
        nothing re-rolled. It is also waiting on the workshop bench.
      </p>

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
  );
};
