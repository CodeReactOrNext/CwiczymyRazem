import { cn } from "assets/lib/utils";
import { getRarityColor } from "feature/arsenal/components/RarityBadge";

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

export const ComponentCard = ({
  owned,
  active,
  isNew,
  problem,
  onClick,
}: ComponentCardProps) => {
  const color = getRarityColor(owned.def.rarity);
  return (
    <button
      type='button'
      aria-pressed={active}
      title={problem ?? undefined}
      onClick={onClick}
      className={cn(
        "relative flex flex-col gap-2 rounded-lg p-3 text-left transition-colors click-behavior focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400",
        active ? "bg-cyan-500/10" : "bg-zinc-800/40 hover:bg-zinc-800",
        problem && "opacity-40",
      )}>
      {isNew && (
        <span className='absolute right-2 top-2 rounded bg-amber-500/10 px-1.5 py-0.5 text-xs text-amber-400'>
          New
        </span>
      )}
      <PartPlate className='h-20'>
        <ComponentThumb def={owned.def} className='h-full p-2' />
      </PartPlate>
      <span className='space-y-0.5'>
        <span
          className={cn(
            "block truncate text-xs",
            active ? "text-cyan-400" : "text-zinc-200",
          )}>
          {owned.def.name}
        </span>
        <span className='flex items-center justify-between gap-2 text-xs'>
          <span style={{ color }}>{owned.def.rarity}</span>
          <span className='tabular-nums text-zinc-400'>Lvl {owned.level}</span>
        </span>
      </span>
    </button>
  );
};
