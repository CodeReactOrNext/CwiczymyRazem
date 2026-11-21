import { cn } from "assets/lib/utils";
import type { CommissionTarget } from "feature/arsenal/data/commission";
import { useArsenalLabels } from "feature/arsenal/hooks/useArsenalLabels";
import { getEffectImageSrc } from "feature/arsenal/utils/effectImage";
import { getRankBadgeSrc } from "feature/arsenal/utils/guitarImage";

import { RARITY_STYLES } from "../RarityBadge";
import { FameCoin } from "../Workshop/FameCoin";

interface CommissionCardProps {
  target: CommissionTarget;
  /** Fame price of the order. */
  price: number;
  /** Fame and every part of the bill are in hand. */
  affordable: boolean;
  onClick: () => void;
}

/**
 * One model on the order form: the instrument, its rarity and its Fame price.
 *
 * The parts bill is left to the dialog — on a card it would be a second row of
 * numbers nobody compares across a grid. The price simply dims while the order
 * cannot be paid for, so the cards that can be ordered today read first.
 *
 * Two lines under the picture: the name with its price, then the maker with the
 * rarity. The rarity's colour is one dot; the words stay grey.
 */
export const CommissionCard = ({
  target,
  price,
  affordable,
  onClick,
}: CommissionCardProps) => {
  const { def } = target;
  const labels = useArsenalLabels();
  const imageSrc =
    target.kind === "guitar"
      ? getRankBadgeSrc(target.def.imageId, "medium")
      : getEffectImageSrc(target.def.imageId, "medium");
  const rarityColor = RARITY_STYLES[def.rarity].baseColor;

  return (
    <button
      type='button'
      onClick={onClick}
      aria-label={labels.t("commissions.commission_name", {
        name: `${def.brand} ${def.name}`,
      })}
      className='flex flex-col gap-4 rounded-lg bg-arsenal-section p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400 hover:bg-zinc-800/60'>
      <span className='flex aspect-[4/3] items-center justify-center overflow-hidden rounded-md bg-arsenal-bg'>
        <img
          src={imageSrc}
          alt=''
          draggable={false}
          loading='lazy'
          className='h-full w-full object-contain p-3'
        />
      </span>

      <span className='flex min-w-0 flex-col gap-1'>
        <span className='flex items-baseline justify-between gap-3'>
          <span className='min-w-0 truncate text-sm font-semibold text-zinc-100'>
            {def.name}
          </span>
          <span
            className={cn(
              "flex shrink-0 items-center gap-1 self-center text-sm font-bold tabular-nums",
              affordable ? "text-amber-400" : "text-zinc-500",
            )}>
            <FameCoin size={14} />
            {price.toLocaleString()}
          </span>
        </span>
        <span className='flex items-center justify-between gap-3 text-xs text-zinc-400'>
          <span className='min-w-0 truncate'>{def.brand}</span>
          <span className='flex shrink-0 items-center gap-1.5'>
            <span
              aria-hidden
              className='h-1.5 w-1.5 rounded-full'
              style={{ backgroundColor: rarityColor }}
            />
            {labels.rarity(def.rarity)}
          </span>
        </span>
      </span>
    </button>
  );
};
