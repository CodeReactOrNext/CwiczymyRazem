import { cn } from "assets/lib/utils";
import { PartIcon } from "feature/arsenal/components/Parts/PartIcon";
import {
  getPartLabel,
  PART_TIER_COLORS,
} from "feature/arsenal/data/partDefinitions";
import { useTranslation } from "hooks/useTranslation";
import { readableText } from "lib/colorTheme/colorTheme";
import type { RewardPayout } from "lib/rewards/rewardPayout";

import { FreeCaseIcon } from "./FreeCaseIcon";

interface RewardSummaryProps {
  reward: RewardPayout;
  /**
   * Dims the whole thing for a badge that has not been earned yet, where the
   * reward is a promise rather than something to go and collect.
   */
  muted?: boolean;
  /**
   * `sm` is the inline strip — a summary sitting inside something else. `md` is
   * the same strip at reading size, for a total that is the point of its card
   * (everything waiting on the achievements page). `lg` is the full read, and
   * only ever appears somewhere the player has asked for it: a tooltip, or the
   * mobile dialog behind it.
   */
  size?: "sm" | "md" | "lg";
  /**
   * Inside a white tooltip: the bright accents drawn for a dark surface wash
   * out on white, so the text steps down to the black scale and 700 accents.
   * Pair it with `tooltip-ink` on the tooltip so the part tier ink follows.
   */
  inTooltip?: boolean;
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
  inTooltip,
  className,
}: RewardSummaryProps) => {
  const { t } = useTranslation("ui");
  const isLarge = size === "lg";
  const isMedium = size === "md";
  // Large enough to read the part *art* rather than merely register that a
  // glyph is there — the pickup and the bridge are only tellable apart at this
  // size, and telling them apart is the whole point of naming which part drops.
  const iconSize = isLarge ? 28 : isMedium ? 18 : 14;

  const row = isLarge
    ? "flex items-center gap-3"
    : isMedium
      ? "flex items-center gap-1.5"
      : "flex items-center gap-1";

  return (
    <div
      className={cn(
        isLarge
          ? "flex flex-col gap-3 text-sm font-semibold"
          : isMedium
            ? "flex flex-wrap items-center gap-x-4 gap-y-2 text-[0.8125rem] font-semibold"
            : "flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[0.6875rem] font-semibold",
        muted && "opacity-60",
        className,
      )}>
      {reward.caseTokens > 0 && (
        <span className={cn(row, inTooltip ? "text-cyan-700" : "text-cyan-300")}>
          <FreeCaseIcon size={iconSize} />
          {reward.caseTokens > 1
            ? t("free_cases", { count: reward.caseTokens })
            : t("free_case")}
        </span>
      )}

      {reward.fame > 0 && (
        <span
          className={cn(
            row,
            "tabular-nums",
            inTooltip ? "text-amber-700" : "text-amber-400",
          )}>
          <img
            src='/images/tokens/coin.png'
            alt=''
            className='shrink-0 object-contain'
            style={{ width: iconSize, height: iconSize }}
          />
          {reward.fame.toLocaleString()}
          {(isLarge || isMedium) && (
            <span className={inTooltip ? "text-black/60" : "text-zinc-400"}>
              Fame
            </span>
          )}
        </span>
      )}

      {reward.parts.map((part) => (
        <span
          key={`${part.partId}-${part.tier}`}
          className={cn(
            row,
            "tabular-nums",
            inTooltip ? "text-black/70" : "text-zinc-300",
          )}
          title={
            isLarge
              ? undefined
              : `${part.qty}× ${part.tier} ${getPartLabel(part.partId)}`
          }>
          <PartIcon partId={part.partId} size={iconSize} />
          {part.qty}
          <span style={{ color: readableText(PART_TIER_COLORS[part.tier]) }}>
            {part.tier}
          </span>
          {isLarge && (
            <span className={inTooltip ? "text-black/60" : "text-zinc-400"}>
              {getPartLabel(part.partId)}
            </span>
          )}
        </span>
      ))}
    </div>
  );
};
