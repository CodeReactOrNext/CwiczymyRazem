import { Chip } from "assets/components/ui/chip";
import { cn } from "assets/lib/utils";
import { FUSION_FAME_COST, getFusionQuote, getMaxFusionCrafts } from "feature/arsenal/data/fusion";
import { PART_TIER_COLORS } from "feature/arsenal/data/partDefinitions";
import { getPartResaleValue } from "feature/arsenal/data/resale";
import { useArsenalLabels } from "feature/arsenal/hooks/useArsenalLabels";
import type { PartId, PartTier } from "feature/arsenal/types/arsenal.types";
import { ArrowRight } from "lucide-react";

import { PartIcon } from "../Parts/PartIcon";
import { SectionLabel } from "../SectionLabel";
import { TierPlate } from "../TierPlate";
import { FameCoin } from "../Workshop/FameCoin";

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

/** Both bills read the same way: what the action is on the left, what it costs
    or pays on the right. The price never wraps onto a second line, and Fame
    keeps its amber so the coin isn't a dark smudge on a dark button. */
const billButtonClass =
  "flex items-center justify-between gap-3 rounded-lg px-4 py-3 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-40";

/** The quieter second option under each bill — trimming one off the stack. */
const minorButtonClass =
  "rounded-lg px-4 py-2 text-xs font-bold text-zinc-400 transition-colors hover:bg-zinc-800/40 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-40";

const Price = ({ amount }: { amount: number }) => (
  <span className='flex shrink-0 items-center gap-1.5 tabular-nums text-amber-400'>
    <FameCoin size={18} />
    {amount}
  </span>
);

/**
 * What a stack of loose parts is, opened from its socket.
 *
 * Parts are a currency and have no card anywhere else, so this is where the
 * stack says what it is worth: what the workshop spends it on, what the bench
 * can rework it into, and what the counter pays for it if the player would
 * rather have the Fame.
 *
 * The three read in that order deliberately. Rework is the constructive move
 * and sits above the bin, because a stack too small to build with is nearly
 * always worth more climbing a tier than it is sold for a Fame a piece.
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
  const maxCrafts = quote ? getMaxFusionCrafts([{ partId, tier, qty }], partId, tier, fame) : 0;
  // Which of the two limits is actually biting, so the card can say so rather
  // than leaving a dead button with no explanation.
  const shortOfParts = quote ? Math.max(0, quote.ratio - qty) : 0;

  return (
    <div className='flex flex-col gap-7 rounded-lg bg-zinc-900 p-6'>
      <div className='flex items-center gap-4'>
        <TierPlate color={color} size={72}>
          <PartIcon partId={partId} size={40} />
        </TierPlate>
        <div className='flex min-w-0 flex-col gap-1.5'>
          <span className='text-[11px] font-semibold tracking-wide' style={{ color }}>
            {t("parts.tier_part", { tier: labels.partTier(tier) })}
          </span>
          {/* The holding is a count, not a headline — it used to be set larger
              than the part's own name, which read as the name of the thing. */}
          <div className='flex min-w-0 items-center gap-2'>
            <span className='truncate text-xl font-black text-zinc-100'>
              {labels.part(partId)}
            </span>
            <Chip className='shrink-0 px-2 py-0.5 tabular-nums'>×{qty}</Chip>
          </div>
        </div>
      </div>

      <p className='text-sm leading-relaxed text-zinc-400'>
        {t("parts.card_body")}
      </p>

      {/* The bench. Hidden outright for a part with nowhere to climb — screws,
          a pot already at Epic — rather than shown greyed out, because that is
          a permanent fact about the part, not a shortage the player can fix.

          Set apart by space and its own label rather than by a second card
          face: a panel inside the panel put a third surface on screen for a
          section that is four lines long. */}
      {quote && (
        <div className='flex flex-col gap-5'>
          <SectionLabel>{t("parts.rework")}</SectionLabel>

          {/*
            The trade reads down the card, not across it. Laid out in a row the
            output's name — "Unique Body" — had about ninety pixels left beside
            two plates and an arrow, so the one word the whole panel exists to
            say was the word that truncated. Centred over its own line it always
            fits, at any width the card is opened at.
          */}
          <div className='flex flex-col items-center gap-3'>
            <div className='flex items-center gap-4'>
              <TierPlate color={color} size={46} count={quote.ratio}>
                <PartIcon partId={partId} size={28} />
              </TierPlate>
              <ArrowRight size={16} className='shrink-0 text-zinc-600' />
              <TierPlate color={PART_TIER_COLORS[quote.outputTier]} size={46} count={1}>
                <PartIcon partId={partId} size={28} />
              </TierPlate>
            </div>

            <div className='flex flex-col items-center gap-1 text-center'>
              <span
                className='text-sm font-black'
                style={{ color: PART_TIER_COLORS[quote.outputTier] }}>
                {labels.partName(quote.outputTier, partId)}
              </span>
              <span className='text-[11px] text-zinc-500'>
                {t("parts.rework_cost", {
                  count: quote.ratio,
                  tier: labels.partTier(tier),
                  fame: FUSION_FAME_COST,
                })}
              </span>
            </div>
          </div>

          {/*
            The plate's `×3` is what the job *asks* for, which on a stack of two
            reads as a stock count and lands backwards. Spelling the holding out
            in the tier's own shortfall colour is what stops the two numbers
            being confused for each other.
          */}
          {shortOfParts > 0 && (
            <span className='text-center text-[11px] font-semibold text-amber-400/90'>
              {t("parts.you_have", { qty, needed: quote.ratio })}
            </span>
          )}

          {onFuseClick &&
            (maxCrafts > 0 ? (
              <div className='flex flex-col gap-2'>
                <button
                  onClick={() => onFuseClick(maxCrafts)}
                  disabled={isFusing}
                  className={cn(
                    billButtonClass,
                    "bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500/25"
                  )}>
                  <span>
                    {maxCrafts > 1
                      ? t("parts.rework_times", { count: maxCrafts })
                      : t("parts.rework_one")}
                  </span>
                  <Price amount={quote.fame * maxCrafts} />
                </button>

                {/* Spending the whole stack is rarely what the bench wants — the
                    build ladder bills in the tier below just as often, so the
                    batch says outright how much of the pile it eats. */}
                {maxCrafts > 1 && (
                  <>
                    <span className='text-center text-[11px] text-zinc-500'>
                      {t("parts.uses_of", { used: quote.ratio * maxCrafts, qty })}
                    </span>
                    <button
                      onClick={() => onFuseClick(1)}
                      disabled={isFusing}
                      className={minorButtonClass}>
                      {t("parts.rework_just_one", { fame: quote.fame })}
                    </button>
                  </>
                )}
              </div>
            ) : (
              shortOfParts === 0 && (
                <span className='text-center text-[11px] font-semibold text-amber-400/90'>
                  {t("parts.not_enough_fame", { fame: quote.fame })}
                </span>
              )
            ))}
        </div>
      )}

      {onSellClick && one > 0 && (
        <div className='flex flex-col gap-2'>
          <button
            onClick={() => onSellClick(qty)}
            disabled={isSelling}
            className={cn(
              billButtonClass,
              "bg-zinc-800/60 text-zinc-200 hover:bg-red-500/15 hover:text-red-300"
            )}>
            <span>
              {qty > 1 ? t("parts.sell_all", { count: qty }) : t("parts.sell_it")}
            </span>
            <Price amount={all} />
          </button>

          {/* Trimming a stack is the common case: the bench wants some of it. */}
          {qty > 1 && (
            <button onClick={() => onSellClick(1)} disabled={isSelling} className={minorButtonClass}>
              {t("parts.sell_one", { fame: one })}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
