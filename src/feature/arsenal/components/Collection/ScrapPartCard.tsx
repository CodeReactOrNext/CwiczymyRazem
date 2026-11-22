import { buttonVariants } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import {
  getFusionQuote,
  getMaxFusionCrafts,
} from "feature/arsenal/data/fusion";
import { PART_TIER_COLORS } from "feature/arsenal/data/partDefinitions";
import { getPartResaleValue } from "feature/arsenal/data/resale";
import { useArsenalLabels } from "feature/arsenal/hooks/useArsenalLabels";
import type { PartId, PartTier } from "feature/arsenal/types/arsenal.types";
import { readableText } from "lib/colorTheme/colorTheme";
import { ArrowRight, Hammer } from "lucide-react";

import { PartIcon } from "../Parts/PartIcon";
import { TierPlate } from "../TierPlate";
import { FameCoin } from "../Workshop/FameCoin";
import { GO_KEY } from "../Workshop/goKey";

interface ScrapPartCardProps {
  partId: PartId;
  tier: PartTier;
  /** How many pieces of this exact tier the player is holding. */
  qty: number;
  /** Absent on the hover card — a tooltip is a look, not a place to act. */
  onSellClick?: (qty: number) => void;
  isSelling?: boolean;
  /** Reworks `crafts` pieces up a tier. Absent on the hover card, as above. */
  onFuseClick?: (crafts: number) => void;
  isFusing?: boolean;
  /** What the player can spend on the bench fee. Only read when reworking. */
  fame?: number;
}

/** A price on a key, coin first — amber on a dark key, ink on the green one. */
const Price = ({ amount, onGreen = false }: { amount: number; onGreen?: boolean }) => (
  <span
    className={cn(
      "flex shrink-0 items-center gap-1.5 tabular-nums",
      onGreen ? "text-emerald-950" : "text-amber-400",
    )}>
    <FameCoin size={18} />
    {amount}
  </span>
);

/**
 * A stack of loose parts, opened from its socket.
 *
 * One question and one answer, the way a lesson screen is: what this stack
 * becomes one tier up (the trade, drawn), how close it is (one thick bar), and
 * one green key that does it. Reworking the whole pile is the quieter key under
 * it, and selling sits at the bottom — the bin is the fallback, never the
 * first thing on the card.
 *
 * Everything the old card spelled out in sentences — what parts are for, "5
 * Standard pieces + 20 Fame", "uses 10 of your 13", "you have 3 of 5" — is
 * now said by the picture, the bar and the price on the key.
 */
export const ScrapPartCard = ({
  partId,
  tier,
  qty,
  onSellClick,
  isSelling = false,
  onFuseClick,
  isFusing = false,
  fame = 0,
}: ScrapPartCardProps) => {
  const color = PART_TIER_COLORS[tier];
  const labels = useArsenalLabels();
  const { t } = labels;
  const one = getPartResaleValue(partId, tier, 1);
  const all = getPartResaleValue(partId, tier, qty);

  const quote = getFusionQuote(partId, tier);
  const maxCrafts = quote
    ? getMaxFusionCrafts([{ partId, tier, qty }], partId, tier, fame)
    : 0;
  const ready = maxCrafts > 0;
  // The bar fills towards one rework; a stack that already covers it is full.
  const fill = quote ? Math.min(1, qty / quote.ratio) : 0;
  const outColor = quote ? PART_TIER_COLORS[quote.outputTier] : color;
  // The hover card is 260px and only looks; the opened sheet has room and acts.
  const sheet = onFuseClick != null || onSellClick != null;
  const tradeSize = sheet ? 96 : 56;

  return (
    <div
      className={cn(
        "flex flex-col rounded-lg bg-zinc-900",
        sheet ? "gap-9 px-6 pb-8 pt-7 sm:px-10 sm:pb-10 sm:pt-9" : "gap-5 p-5",
      )}>
      <div className='flex items-center gap-4'>
        <TierPlate color={color} size={72}>
          <PartIcon partId={partId} size={46} />
        </TierPlate>
        <div className='flex min-w-0 flex-col gap-1'>
          <span className='truncate text-2xl font-black text-zinc-100'>
            {labels.part(partId)}
          </span>
          <span className='text-sm font-semibold' style={{ color: readableText(color) }}>
            {labels.partTier(tier)} · ×{qty}
          </span>
        </div>
      </div>

      {/* A part with nowhere to climb — screws, a pot already at Epic — has no
          trade at all rather than a greyed one: that is a fact about the part,
          not a shortage the player can fix. */}
      {quote && (
        <div className='flex flex-col items-center gap-5'>
          <div className={cn("flex items-center", sheet ? "gap-8" : "gap-4")}>
            <TierPlate color={color} size={tradeSize} count={quote.ratio}>
              <PartIcon partId={partId} size={Math.round(tradeSize * 0.65)} />
            </TierPlate>
            <ArrowRight size={sheet ? 26 : 18} className='shrink-0 text-zinc-500' />
            <TierPlate color={outColor} size={tradeSize} count={1}>
              <PartIcon partId={partId} size={Math.round(tradeSize * 0.65)} />
            </TierPlate>
          </div>

          <span
            className='text-xl font-black'
            style={{ color: readableText(outColor) }}>
            {labels.partName(quote.outputTier, partId)}
          </span>

          {/* How close the stack is to one rework — the summary's thick bar,
              highlight and all; emerald once it can be paid for. */}
          <div
            role='progressbar'
            aria-valuemin={0}
            aria-valuemax={quote.ratio}
            aria-valuenow={Math.min(qty, quote.ratio)}
            className='relative mt-2 h-4 w-full overflow-hidden rounded-full bg-zinc-800'>
            <div
              className='absolute inset-y-0 left-0 rounded-full transition-[width] duration-slow ease-out'
              style={{
                width: `${fill * 100}%`,
                backgroundColor: ready ? "#10b981" : outColor,
              }}
            />
            {fill > 0 && (
              <div
                aria-hidden
                className='light-hide absolute left-2 top-[4px] h-[4px] rounded-full bg-white/30'
                style={{ width: `calc(${fill * 100}% - 16px)` }}
              />
            )}
          </div>
          <span className='-mt-1 text-sm font-bold tabular-nums text-zinc-500'>
            {Math.min(qty, quote.ratio)}/{quote.ratio}
          </span>
        </div>
      )}

      {quote && onFuseClick && (
        <div className='flex flex-col gap-3'>
          <button
            type='button'
            onClick={() => onFuseClick(1)}
            disabled={!ready || isFusing}
            className={cn(
              buttonVariants({ size: "xl" }),
              ready && GO_KEY,
              "h-14 w-full justify-between px-6 text-lg",
            )}>
            <span className='flex items-center gap-2.5'>
              <Hammer size={18} />
              {t("parts.rework_one")}
            </span>
            <Price amount={quote.fame} onGreen={ready} />
          </button>

          {maxCrafts > 1 && (
            <button
              type='button'
              onClick={() => onFuseClick(maxCrafts)}
              disabled={isFusing}
              className={cn(
                buttonVariants({ variant: "ghost", size: "lg" }),
                "h-12 w-full justify-between px-6",
              )}>
              {t("parts.rework_times", { count: maxCrafts })}
              <Price amount={quote.fame * maxCrafts} />
            </button>
          )}
        </div>
      )}

      {onSellClick && one > 0 && (
        <div className='flex gap-3'>
          {qty > 1 && (
            <button
              type='button'
              onClick={() => onSellClick(1)}
              disabled={isSelling}
              className={cn(
                buttonVariants({ variant: "ghost" }),
                "h-11 flex-1 justify-between px-4 hover:bg-red-500/15 hover:text-red-300",
              )}>
              {t("parts.sell_one_short")}
              <Price amount={one} />
            </button>
          )}
          <button
            type='button'
            onClick={() => onSellClick(qty)}
            disabled={isSelling}
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "h-11 flex-1 justify-between px-4 hover:bg-red-500/15 hover:text-red-300",
            )}>
            {qty > 1 ? t("parts.sell_all", { count: qty }) : t("parts.sell_it")}
            <Price amount={all} />
          </button>
        </div>
      )}
    </div>
  );
};
