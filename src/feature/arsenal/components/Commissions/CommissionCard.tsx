import { cn } from "assets/lib/utils";
import type { CommissionTarget } from "feature/arsenal/data/commission";
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
 */
export const CommissionCard = ({
  target,
  price,
  affordable,
  onClick,
}: CommissionCardProps) => {
  const { def } = target;
  const imageSrc =
    target.kind === "guitar"
      ? getRankBadgeSrc(target.def.imageId, "medium")
      : getEffectImageSrc(target.def.imageId, "medium");
  const rarityColor = RARITY_STYLES[def.rarity].baseColor;

  return (
    <button
      type='button'
      onClick={onClick}
      aria-label={`Commission ${def.brand} ${def.name}`}
      className='flex flex-col gap-3 rounded-lg bg-arsenal-section p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400 hover:bg-zinc-800/60'>
      <span className='flex aspect-[4/3] items-center justify-center overflow-hidden rounded-md bg-arsenal-bg'>
        <img
          src={imageSrc}
          alt=''
          draggable={false}
          loading='lazy'
          className='h-full w-full object-contain p-3'
        />
      </span>

      <span className='flex min-w-0 flex-col gap-0.5 px-1'>
        <span className='truncate text-sm font-semibold text-zinc-100'>
          {def.name}
        </span>
        <span className='truncate text-xs text-zinc-500'>{def.brand}</span>
      </span>

      <span className='flex items-center justify-between gap-2 px-1'>
        <span
          className='flex items-center gap-1.5 text-[11px] font-medium'
          style={{ color: rarityColor }}>
          <span
            className='h-1.5 w-1.5 rounded-full'
            style={{ backgroundColor: rarityColor }}
          />
          {def.rarity}
        </span>
        <span
          className={cn(
            "flex items-center gap-1 text-sm font-bold tabular-nums",
            affordable ? "text-zinc-100" : "text-zinc-500",
          )}>
          <FameCoin size={14} />
          {price.toLocaleString()}
        </span>
      </span>
    </button>
  );
};
