import { cn } from "assets/lib/utils";
import { useArsenalLabels } from "feature/arsenal/hooks/useArsenalLabels";
import { AlertTriangle, Cable, Check, Plug, Zap } from "lucide-react";

import type { PowerState } from "../../data/powerSupply";
import type { SupplyTier } from "../../data/rigHardware";
import { CHAIN_TIERS, type ChainVerdict } from "../../data/signalChain";
import { CountUp, Pop } from "../Workshop/workshopMotion";
import {
  RIG_BUTTON,
  RIG_BUTTON_FIX,
  StatusTile,
  type StatusTone,
} from "./RigSection";

/**
 * The readouts over the board, as a row of tiles cut to one pattern: what the
 * wiring is worth, whether the brick has a hole left, and — passed in as a
 * child, only while there is one — what duplicates cost.
 *
 * Both read the *live* board rather than the saved one, so the verdict and the
 * numbers move under the player's hand while a pedal is still being dragged.
 * That immediacy is the whole strip: a number climbing as the pedal lands
 * teaches the rule faster than a paragraph would.
 *
 * Each tile says its verdict in words and carries the button that fixes it
 * when there is something to fix; what the verdict means is on its tooltip. The complaint and
 * its cure sit together, so the heading above the board is left with the
 * actions that are nobody's fault.
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

/** A chain tier's tone, as the tile it is drawn on names it. */
const CHAIN_TILE_TONE: Record<keyof typeof LAMP, StatusTone> = {
  good: "good",
  warn: "fix",
  bad: "fix",
  idle: "idle",
};

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
  /** More tiles for the same row — the duplicates one. */
  children?: React.ReactNode;
}

export const BoardStatusStrip = ({
  verdict,
  supply,
  power,
  unpowered,
  onWireUp,
  onPatch,
  children,
}: BoardStatusStripProps) => {
  const cables = verdict.links.length;
  const labels = useArsenalLabels();
  const { t } = labels;
  const tierLabel = labels.chainTierLabel(verdict.tier);
  const chainTone = CHAIN_TILE_TONE[CHAIN_TIERS[verdict.tier].tone];

  const powerTone: StatusTone =
    unpowered.length > 0
      ? "fix"
      : power.outputsUsed === 0
        ? "idle"
        : "good";

  return (
    <div className='grid grid-cols-1 gap-4 md:grid-cols-[repeat(auto-fit,minmax(18rem,1fr))]'>
      <StatusTile
        label={t("signal.path")}
        side={
          <span className='text-amber-300'>
            <CountUp value={verdict.rate} decimals={1} prefix='+' />
            <span className='text-xs text-amber-500/70'> /h</span>
          </span>
        }
        tone={chainTone}
        icon={
          chainTone === "good" ? (
            <Check size={18} strokeWidth={3} />
          ) : chainTone === "fix" ? (
            <AlertTriangle size={18} strokeWidth={2.2} />
          ) : (
            <Cable size={18} strokeWidth={2} />
          )
        }
        title={
          <Pop trigger={tierLabel}>
            <span
              className='capitalize'
              title={
                verdict.wrongLinks > 0
                  ? `${t("signal.backwards", { wrong: verdict.wrongLinks, cables })}. ${labels.chainTierNote(verdict.tier)}`
                  : labels.chainTierNote(verdict.tier)
              }>
              {tierLabel}
            </span>
          </Pop>
        }
        action={
          onWireUp && (
            <FixButton
              icon={<Zap size={15} strokeWidth={2.5} />}
              label={t("signal.wire_it_up")}
              title={t("signal.wire_it_up_hint")}
              onClick={onWireUp}
            />
          )
        }
      />

      <StatusTile
        label={t("power.label")}
        side={
          <span title={supply.name}>
            {t("power.outputs", {
              used: power.outputsUsed,
              total: supply.outputs,
            })}
          </span>
        }
        tone={powerTone}
        icon={
          powerTone === "good" ? (
            <Check size={18} strokeWidth={3} />
          ) : powerTone === "fix" ? (
            <AlertTriangle size={18} strokeWidth={2.2} />
          ) : (
            <Plug size={18} strokeWidth={2} />
          )
        }
        title={
          unpowered.length > 0 ? (
            // A crowd is counted, and the names go on the tooltip: a row of
            // full pedal names is longer than the tile. So does what a dead
            // pedal costs — it is off the board as far as the game goes.
            <span
              title={`${unpowered.join("\n")}\n\n${t("power.dead_pedal_note")}`}>
              {unpowered.length === 1
                ? t("power.one_unpowered", { name: unpowered[0] })
                : t("power.many_unpowered", { count: unpowered.length })}
            </span>
          ) : power.outputsUsed === 0 ? (
            t("power.nothing_plugged")
          ) : (
            t("power.all_running")
          )
        }
        action={
          onPatch && (
            <FixButton
              icon={<Plug size={15} strokeWidth={2.5} />}
              label={t("power.patch")}
              title={t("power.patch_hint")}
              onClick={onPatch}
            />
          )
        }
      />

      {children}
    </div>
  );
};
