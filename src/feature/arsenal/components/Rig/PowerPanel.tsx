import { cn } from "assets/lib/utils";

import { type PowerState } from "../../data/powerSupply";
import type { SupplyTier } from "../../data/rigHardware";

/**
 * What the brick has left, in one tile — the twin of the signal one beside it.
 *
 * A fuel gauge, not a lesson. One pedal takes one output, so there is exactly
 * one number to read and one bar to read it off: holes used against holes
 * owned. It turns amber on the last output — capacity is the only thing this
 * stat itself measures. A pedal on the board with nothing feeding it is a
 * different, more specific problem, so it gets its own red line below rather
 * than recolouring the capacity count. The button that fixes that sits in the
 * section heading with the rest of the board actions.
 */

interface PowerPanelProps {
  /** The brick the rig owns — what the numbers below are measured against. */
  supply: SupplyTier;
  state: PowerState;
  /** Names of the boarded pedals with no cable to the brick. */
  unpowered: string[];
}

export const PowerPanel = ({ supply, state, unpowered }: PowerPanelProps) => {
  const share = Math.min(1, state.outputsUsed / supply.outputs);
  // Capacity only — amber at the last output. Whether a boarded pedal is
  // actually fed is a separate question, answered by the note below.
  const tone =
    state.outputsFree === 0
      ? { text: "text-amber-400", bar: "bg-amber-500/80" }
      : { text: "text-arsenal-text-primary", bar: "bg-arsenal-accent/60" };

  return (
    <div className='flex flex-col gap-3 rounded-lg bg-arsenal-section p-5'>
      <div className='flex items-center justify-between gap-4'>
        <p className='text-[11px] tracking-wide text-arsenal-text-tertiary'>
          Power
        </p>
        <p className='text-[11px] tracking-wide text-arsenal-text-secondary'>
          {supply.name}
        </p>
      </div>

      <p className='flex items-baseline gap-1.5'>
        <span
          className={cn(
            "font-teko text-3xl font-bold tabular-nums leading-none",
            tone.text,
          )}>
          {state.outputsUsed}
        </span>
        <span className='font-teko text-base leading-none text-arsenal-text-tertiary'>
          / {supply.outputs} outputs
        </span>
      </p>

      <div className='flex flex-col gap-2'>
        <div className='h-1.5 w-full overflow-hidden rounded bg-arsenal-bg'>
          <div
            className={cn(
              "h-full rounded transition-all duration-300",
              tone.bar,
            )}
            style={{ width: `${share * 100}%` }}
          />
        </div>
        <p className='text-[11px] tracking-wide text-arsenal-text-tertiary'>
          {unpowered.length === 0 ? (
            <>Every pedal is running</>
          ) : (
            <span className='text-red-400'>
              No power for {unpowered.join(", ")}
            </span>
          )}
        </p>

        {/* Said out loud because the rig level moves when it happens: a dead
            pedal is off the board as far as the game is concerned. */}
        {unpowered.length > 0 && (
          <p className='text-[11px] tracking-wide text-arsenal-text-tertiary'>
            A pedal with no power adds no rig level and earns no Fame.
          </p>
        )}
      </div>
    </div>
  );
};
