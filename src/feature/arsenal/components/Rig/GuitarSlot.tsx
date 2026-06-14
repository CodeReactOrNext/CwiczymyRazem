import { cn } from "assets/lib/utils";
import { GUITARS_BY_ID } from "feature/arsenal/data/guitarDefinitions";
import { Guitar, Plus, X } from "lucide-react";

import type { InventoryItem } from "../../types/arsenal.types";
import { RARITY_STYLES } from "../RarityBadge";

interface GuitarSlotProps {
  slotIndex: number;
  itemId: string | null;
  inventory: InventoryItem[];
  onOpenPicker: (slotIndex: number) => void;
  onRemove: (slotIndex: number) => void;
}

export const GuitarSlot = ({ slotIndex, itemId, inventory, onOpenPicker, onRemove }: GuitarSlotProps) => {
  const item = itemId ? inventory.find((i) => i.id === itemId) : null;
  const guitar = item ? GUITARS_BY_ID.get(item.guitarId) : null;
  const rs = guitar ? RARITY_STYLES[guitar.rarity] : null;

  if (!guitar || !rs || !item) {
    return (
      <button
        onClick={() => onOpenPicker(slotIndex)}
        className={cn(
          "group flex min-h-[300px] w-full flex-col items-center justify-center gap-3 rounded-lg bg-zinc-900/40 p-4",
          "transition-background hover:bg-zinc-800/50",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        )}
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800/60 transition-background group-hover:bg-zinc-700/60">
          <Guitar size={28} strokeWidth={1.2} className="text-zinc-400 transition-colors group-hover:text-zinc-200" />
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-sm font-bold text-zinc-300 transition-colors group-hover:text-zinc-100">
            Add Guitar
          </span>
          <span className="flex items-center gap-1 text-xs text-zinc-500">
            <Plus size={11} />
            Choose from collection
          </span>
        </div>
      </button>
    );
  }

  return (
    <div
      className="group relative flex min-h-[300px] flex-col overflow-hidden rounded-lg"
      style={{
        background: `linear-gradient(160deg, ${rs.baseColor}22 0%, #0f0f12 42%, #0f0f12 100%)`,
      }}
    >
      {/* Remove button */}
      <button
        onClick={() => onRemove(slotIndex)}
        aria-label="Remove guitar from slot"
        className={cn(
          "absolute right-2 top-2 z-20 rounded bg-zinc-900/70 p-1 text-zinc-400",
          "transition-background hover:bg-zinc-800 hover:text-white",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        )}
      >
        <X size={13} />
      </button>

      {/* Header */}
      <div className="flex flex-col gap-1 px-4 pt-4">
        <p className="truncate text-xs font-bold capitalize leading-none" style={{ color: rs.baseColor }}>
          {guitar.brand}
        </p>
        <p className="truncate text-base font-bold leading-snug text-zinc-100">
          {guitar.name}
        </p>
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
          <span className="rounded bg-zinc-800/60 px-2 py-0.5 text-[10px] font-semibold capitalize" style={{ color: `${rs.baseColor}dd` }}>
            {guitar.rarity}
          </span>
          {item.year && (
            <span className="rounded bg-zinc-800/60 px-2 py-0.5 text-[10px] font-semibold text-zinc-400">
              {item.year}
            </span>
          )}
          {item.country && (
            <span className="truncate rounded bg-zinc-800/60 px-2 py-0.5 text-[10px] font-semibold text-zinc-400">
              {item.country}
            </span>
          )}
        </div>
      </div>

      {/* Image */}
      <div
        className="flex flex-1 items-center justify-center overflow-hidden"
        style={{
          background: `radial-gradient(ellipse at 50% 100%, ${rs.baseColor}25 0%, ${rs.baseColor}06 45%, transparent 70%)`,
        }}
      >
        <img
          src={`/static/images/rank/${guitar.imageId}.webp`}
          alt={guitar.name}
          className="-rotate-90 object-contain"
          style={{ height: 170, width: 170 }}
        />
      </div>

      {/* Change button */}
      <button
        onClick={() => onOpenPicker(slotIndex)}
        className={cn(
          "w-full py-2 text-xs font-bold capitalize tracking-wide text-zinc-400",
          "transition-background hover:bg-zinc-800/40 hover:text-zinc-100",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        )}
      >
        Change
      </button>
    </div>
  );
};
