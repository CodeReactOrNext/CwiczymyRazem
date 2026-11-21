import { cn } from "assets/lib/utils";
import { getRarityColor } from "feature/arsenal/components/RarityBadge";
import { useArsenalLabels } from "feature/arsenal/hooks/useArsenalLabels";

import type { Owned } from "../utils/components";
import { ComponentThumb } from "./ComponentThumb";
import { PartPlate } from "./PartPlate";

interface ComponentCardProps {
  owned: Owned;
  active: boolean;
  isNew?: boolean;
  /** Why it can't go on — shown on hover, and the card is dimmed. */
  problem?: string | null;
  onClick: () => void;
}

/**
 * One part in the grid: its picture, its name, then rarity and level. The part
 * on the build is told apart by a lighter surface; the rarity's colour is one
 * dot, so a grid of parts is not a grid of coloured words.
 */
export const ComponentCard = ({
  owned,
  active,
  isNew,
  problem,
  onClick,
}: ComponentCardProps) => {
  const color = getRarityColor(owned.def.rarity);
  const labels = useArsenalLabels();
  return (
    <button
      type='button'
      aria-pressed={active}
      title={problem ? labels.builderError(problem) : undefined}
      onClick={onClick}
      className={cn(
        "relative flex flex-col gap-3 rounded-lg p-3 text-left transition-colors click-behavior focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400",
        active ? "bg-zinc-100/15" : "bg-zinc-800/40 hover:bg-zinc-800",
        problem && "opacity-40",
      )}>
      {isNew && (
        <span className='absolute right-3 top-2.5 z-10 text-xs font-semibold text-zinc-100'>
          {labels.t("card.new")}
        </span>
      )}
      <PartPlate className='h-20'>
        <ComponentThumb def={owned.def} className='h-full p-2' />
      </PartPlate>
      <span className='space-y-1'>
        <span
          className={cn(
            "block truncate text-sm",
            active ? "font-semibold text-zinc-50" : "text-zinc-200",
          )}>
          {owned.def.name}
        </span>
        <span className='flex items-center justify-between gap-2 text-xs text-zinc-400'>
          <span className='flex min-w-0 items-center gap-1.5'>
            <span
              aria-hidden
              className='h-1.5 w-1.5 shrink-0 rounded-full'
              style={{ backgroundColor: color }}
            />
            <span className='truncate'>{labels.rarity(owned.def.rarity)}</span>
          </span>
          <span className='shrink-0 tabular-nums text-zinc-300'>
            {labels.t("common.lvl", { level: owned.level })}
          </span>
        </span>
      </span>
    </button>
  );
};
