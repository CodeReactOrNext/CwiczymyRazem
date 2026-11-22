import { cn } from "assets/lib/utils";
import type { MilestoneStatus } from "feature/dashboard/utils/milestoneSummary";
import { Check, Gift, Lock } from "lucide-react";
import type { CSSProperties } from "react";

/** "Reached" — the app's success emerald, shared by the trail, the ring and the bars. */
export const MILESTONE_GREEN = "#10b981";
const NODE = 56;
const CENTER = NODE / 2;
const RING_R = 23;
const CIRC = 2 * Math.PI * RING_R;

/** The key's lip: the face's own hue, a few shades down. */
const LIP = {
  reached: "#047857",
  reward: "#b45309",
  open: "#1f1f23",
  locked: "#141417",
};

/** What a node needs to know about its tier — the strip and the Home card both have this much. */
export type MilestoneNodeStatus = Pick<
  MilestoneStatus,
  | "met"
  | "owned"
  | "claimed"
  | "cost"
  | "lockedAtLvl"
  | "Icon"
  | "progress"
>;

/** A tier is shut either because it was never bought or because the account is too low. */
export const isLockedNode = (status: MilestoneNodeStatus): boolean =>
  !status.owned && (status.cost > 0 || status.lockedAtLvl !== null);

export const isClaimableNode = (status: MilestoneNodeStatus): boolean =>
  status.met && status.owned && !status.claimed;

/**
 * One milestone as a round key: a solid face over a darker lip, the tier's
 * icon on it, and a ring that fills with the week's progress. Green and ticked
 * once the goal is met, amber with a gift while its Fame waits to be claimed,
 * padlocked with a dashed ring while the tier is shut.
 *
 * `pressable` sinks the face onto its lip when the button around it (which
 * carries `group`) is hovered or pressed — the strip's nodes are buttons, the
 * Home card's disc is not.
 */
export const MilestoneNode = ({
  status,
  isCurrent = false,
  selected = false,
  pressable = false,
}: {
  status: MilestoneNodeStatus;
  /** The goal being worked towards — a brighter icon and a thicker ring. */
  isCurrent?: boolean;
  /** Picked in the strip: an outline around the key, not a glow. */
  selected?: boolean;
  pressable?: boolean;
}) => {
  const locked = isLockedNode(status);
  const claimable = isClaimableNode(status);
  const percent =
    status.progress.max > 0 ? status.progress.value / status.progress.max : 0;
  const stroke = isCurrent ? 4 : 3;
  const Icon = status.Icon;

  const face = locked
    ? "#1e1e22"
    : claimable
      ? "#f59e0b"
      : status.met
        ? MILESTONE_GREEN
        : "#2e2e34";
  const lip = locked
    ? LIP.locked
    : claimable
      ? LIP.reward
      : status.met
        ? LIP.reached
        : LIP.open;

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center rounded-full",
        selected && "outline outline-2 outline-offset-4 outline-zinc-500",
      )}
      style={{ width: NODE, height: NODE }}>
      <span
        aria-hidden
        style={{ backgroundColor: face, "--lip": lip } as CSSProperties}
        className={cn(
          "absolute inset-0 rounded-full shadow-[0_4px_0_0_var(--lip)] transition-[transform,box-shadow,background-color] duration-100 ease-out",
          pressable &&
            !locked &&
            "group-hover:translate-y-[2px] group-hover:shadow-[0_2px_0_0_var(--lip)] group-active:translate-y-[4px] group-active:shadow-none",
        )}
      />

      {!status.met && (
        <svg
          aria-hidden
          viewBox={`0 0 ${NODE} ${NODE}`}
          className={cn(
            "absolute inset-0 h-full w-full -rotate-90 transition-transform duration-100 ease-out",
            pressable &&
              !locked &&
              "group-hover:translate-y-[2px] group-active:translate-y-[4px]",
          )}>
          <circle
            cx={CENTER}
            cy={CENTER}
            r={RING_R}
            fill='none'
            stroke={locked ? "#45454d" : "#52525b"}
            strokeWidth={stroke}
            strokeDasharray={locked ? "3 4" : undefined}
          />
          {!locked && percent > 0 && (
            <circle
              cx={CENTER}
              cy={CENTER}
              r={RING_R}
              fill='none'
              stroke={MILESTONE_GREEN}
              strokeWidth={stroke}
              strokeLinecap='round'
              strokeDasharray={CIRC}
              strokeDashoffset={CIRC - percent * CIRC}
              className='transition-[stroke-dashoffset] duration-slow ease-out'
            />
          )}
        </svg>
      )}

      <span
        className={cn(
          "relative transition-transform duration-100 ease-out",
          pressable &&
            !locked &&
            "group-hover:translate-y-[2px] group-active:translate-y-[4px]",
        )}>
        {locked ? (
          <Lock className='h-5 w-5 text-zinc-500' />
        ) : claimable ? (
          <Gift className='h-6 w-6 text-amber-950' strokeWidth={2.5} />
        ) : status.met ? (
          <Check className='h-6 w-6 text-emerald-950' strokeWidth={3} />
        ) : (
          <Icon
            className='h-5 w-5'
            style={{ color: isCurrent ? "#f4f4f5" : "#8e8e98" }}
          />
        )}
      </span>
    </div>
  );
};
