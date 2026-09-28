import { cn } from "assets/lib/utils";
import { AlertTriangle, Plug, Zap } from "lucide-react";

import type { PowerState } from "../../data/powerSupply";
import type { SupplyTier } from "../../data/rigHardware";
import { CHAIN_TIERS, type ChainVerdict } from "../../data/signalChain";
import { CountUp, Pop } from "../Workshop/workshopMotion";
import { RIG_BUTTON, RIG_BUTTON_FIX } from "./RigSection";

/**
 * The two readouts over the board, side by side on one line each: what the
 * wiring is worth and whether the brick has a hole left.
 *
 * Both read the *live* board rather than the saved one, so the verdict and the
 * numbers move under the player's hand while a pedal is still being dragged.
 * That immediacy is the whole strip: a number climbing as the pedal lands
 * teaches the rule faster than a paragraph would.
 *
 * Each panel is a headline and, on the right, the one detail worth acting on —
 * in colour only when it is a problem — followed by the button that fixes it,
 * when there is something to fix. No lamp beside the headline: it only
 * repeated, as a dot, the colour of the warning on the same line. The Lamp
 * stays exported for the strips that have no warning text to lean on.
 *
 * The complaint and its cure sit side by side, so the
 * something to fix. The complaint and its cure sit side by side, so the
 * heading above the board is left with the actions that are nobody's fault.
 */

/** Lamp colours: the same four the cables and the verdict already use. */
const LAMP = {
  good: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]",
  warn: "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.7)]",
  // Red rather than a palette accent, and deliberately: this board already uses
  // red for a pedal that cannot go where it is being dropped, so a cable running
  // backwards had better be the same red.
  bad: "bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.7)]",
  idle: "bg-zinc-600",
} as const;

export const Lamp = ({ tone }: { tone: keyof typeof LAMP }) => (
  <span
    aria-hidden
    className={cn("h-2 w-2 shrink-0 rounded-full", LAMP[tone])}
  />
);

interface PanelProps {
  label: string;
  children: React.ReactNode;
  /** The right-hand detail. */
  aside?: React.ReactNode;
}

const Panel = ({ label, children, aside }: PanelProps) => (
  <div className='flex min-h-[3.25rem] flex-wrap items-center gap-x-5 gap-y-2 rounded-lg bg-arsenal-section px-5 py-3'>
    <span className='text-sm font-semibold text-arsenal-text-primary'>
      {label}
    </span>
    <div className='flex items-center gap-2.5'>{children}</div>
    {aside && (
      <div className='ml-auto flex flex-wrap items-center gap-3 text-xs'>
        {aside}
      </div>
    )}
  </div>
);

interface FixButtonProps {
  icon: React.ReactNode;
  label: string;
  title: string;
  onClick: () => void;
}

const FixButton = ({ icon, label, title, onClick }: FixButtonProps) => (
  <button
    onClick={onClick}
    title={title}
    className={cn(RIG_BUTTON, RIG_BUTTON_FIX)}>
    {icon}
    {label}
  </button>
);

interface BoardStatusStripProps {
  verdict: ChainVerdict;
  /** The brick the rig owns — what the power numbers are measured against. */
  supply: SupplyTier;
  power: PowerState;
  /** Names of the boarded pedals with no cable to the brick. */
  unpowered: string[];
  /** Re-lays the board in chain order; `null` when there is nothing to fix. */
  onWireUp: (() => void) | null;
  /** Fills the brick's free outputs; `null` when it would do nothing. */
  onPatch: (() => void) | null;
}

export const BoardStatusStrip = ({
  verdict,
  supply,
  power,
  unpowered,
  onWireUp,
  onPatch,
}: BoardStatusStripProps) => {
  const tier = CHAIN_TIERS[verdict.tier];
  const cables = verdict.links.length;

  return (
    <div className='grid grid-cols-1 gap-3 lg:grid-cols-2'>
      <Panel
        label='Signal path'
        aside={
          <>
            {cables === 0 ? (
              <span className='text-arsenal-text-tertiary'>{tier.note}</span>
            ) : verdict.wrongLinks > 0 ? (
              // One sentence, not a tally beside a warning: how many are wrong
              // is the only half of the count anybody acts on.
              <span className='flex items-center gap-1.5 font-semibold tabular-nums text-amber-400'>
                <AlertTriangle size={13} strokeWidth={2.5} />
                {verdict.wrongLinks} of {cables} backwards
              </span>
            ) : (
              <span className='tabular-nums text-arsenal-text-tertiary'>
                All {cables} in order
              </span>
            )}
            {onWireUp && (
              <FixButton
                icon={<Zap size={12} strokeWidth={2.5} />}
                label='Wire it up'
                title='Lay the whole board out in the order the craft asks for'
                onClick={onWireUp}
              />
            )}
          </>
        }>
        <Pop trigger={tier.label}>
          <span className='text-sm font-semibold capitalize text-arsenal-text-primary'>
            {tier.label}
          </span>
        </Pop>
        <span className='flex items-baseline gap-0.5 text-sm font-bold tabular-nums text-amber-300'>
          <CountUp value={verdict.rate} decimals={1} prefix='+' />
          <span className='text-xs font-semibold text-amber-500/70'>/h</span>
        </span>
      </Panel>

      <Panel
        label='Power'
        aside={
          <>
            {unpowered.length > 0 ? (
              // A pedal's full name is long enough to push the fix off the
              // line, so a crowd is counted and the names go on the tooltip.
              <span
                title={unpowered.join("\n")}
                className='flex items-center gap-1.5 font-semibold text-red-400'>
                <AlertTriangle size={13} strokeWidth={2.5} />
                {unpowered.length === 1
                  ? `${unpowered[0]} has no power`
                  : `${unpowered.length} pedals have no power`}
              </span>
            ) : (
              <span className='text-arsenal-text-tertiary'>
                {power.outputsUsed === 0
                  ? "Nothing plugged in yet"
                  : "Every pedal is running"}
              </span>
            )}
            {onPatch && (
              <FixButton
                icon={<Plug size={12} strokeWidth={2.5} />}
                label='Patch power'
                title='Plug in everything the brick still has a hole for'
                onClick={onPatch}
              />
            )}
          </>
        }>
        <span
          title={supply.name}
          className='text-sm font-semibold tabular-nums text-arsenal-text-primary'>
          {power.outputsUsed} / {supply.outputs} outputs
        </span>
      </Panel>
    </div>
  );
};
