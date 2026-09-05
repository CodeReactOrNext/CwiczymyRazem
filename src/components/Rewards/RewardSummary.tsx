import { cn } from "assets/lib/utils";
import { PartIcon } from "feature/arsenal/components/Parts/PartIcon";
import {
  getPartLabel,
  PART_TIER_COLORS,
} from "feature/arsenal/data/partDefinitions";
import type { RewardPayout } from "lib/rewards/rewardPayout";
import { Ticket } from "lucide-react";

interface RewardSummaryProps {
  reward: RewardPayout;
  /**
   * Dims the whole thing for a badge that has not been earned yet, where the
   * reward is a promise rather than something to go and collect.
   */
  muted?: boolean;
  /**
   * `sm` is the inline strip — a summary sitting inside something else, like the
   * banner's total. `lg` is the full read, and only ever appears somewhere the
   * player has asked for it: a tooltip, or the mobile dialog behind it.
   */
  size?: "sm" | "lg";
  className?: string;
}

/**
 * What a badge pays.
 *
 * Free cases lead: they are the one line of the three that cannot be bought,
 * and a player weighing up whether to go and finish a badge is weighing up
 * those.
 *
 * The large size lays the three out as a list rather than as a wrapped strip.
 * Once there is room to read them properly, a column of aligned rows is the
 * shape a receipt takes — a strip only makes sense when it has to fit into a
 * line of something else.
 */
export const RewardSummary = ({
  reward,
  muted,
  size = "sm",
  className,
}: RewardSummaryProps) => {
  const isLarge = size === "lg";
  // Large enough to read the part *art* rather than merely register that a
  // glyph is there — the pickup and the bridge are only tellable apart at this
  // size, and telling them apart is the whole point of naming which part drops.
  const iconSize = isLarge ? 28 : 14;

  const row = isLarge ? "flex items-center gap-3" : "flex items-center gap-1";

  return (
    <div
      className={cn(
        isLarge
          ? "flex flex-col gap-3 text-sm font-semibold"
          : "flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[0.6875rem] font-semibold",
        muted && "opacity-60",
        className,
      )}>
      {reward.caseTokens > 0 && (
        <span className={cn(row, "text-cyan-300")}>
          <Ticket size={iconSize} strokeWidth={2.5} className='shrink-0' />
          {reward.caseTokens > 1
            ? `${reward.caseTokens} free cases`
            : "Free case"}
        </span>
      )}

      {reward.fame > 0 && (
        <span className={cn(row, "tabular-nums text-amber-400")}>
          <img
            src='/images/coin.png'
            alt=''
            className='shrink-0 object-contain'
            style={{ width: iconSize, height: iconSize }}
          />
          {reward.fame.toLocaleString()}
          {isLarge && <span className='text-zinc-400'>Fame</span>}
        </span>
      )}

      {reward.parts.map((part) => (
        <span
          key={`${part.partId}-${part.tier}`}
          className={cn(row, "tabular-nums text-zinc-300")}
          title={
            isLarge
              ? undefined
              : `${part.qty}× ${part.tier} ${getPartLabel(part.partId)}`
          }>
          <PartIcon partId={part.partId} size={iconSize} />
          {part.qty}
          <span style={{ color: PART_TIER_COLORS[part.tier] }}>
            {part.tier}
          </span>
          {isLarge && (
            <span className='text-zinc-400'>{getPartLabel(part.partId)}</span>
          )}
        </span>
      ))}
    </div>
  );
};
