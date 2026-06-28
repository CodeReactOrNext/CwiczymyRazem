import { cn } from "assets/lib/utils";
import { GUITARS_BY_ID } from "feature/arsenal/data/guitarDefinitions";
import { getItemLevel } from "feature/arsenal/data/itemStats";
import { Guitar, Plus, X } from "lucide-react";

import type { InventoryItem } from "../../types/arsenal.types";
import { GuitarCard } from "../GuitarInventory/GuitarCard";
import { RARITY_STYLES } from "../RarityBadge";

interface GuitarSlotProps {
  slotIndex: number;
  itemId: string | null;
  inventory: InventoryItem[];
  onOpenPicker: (slotIndex: number) => void;
  onRemove: (slotIndex: number) => void;
  onHover?: (e: React.MouseEvent | null, content: React.ReactNode | null) => void;
}

export const GuitarSlot = ({ slotIndex, itemId, inventory, onOpenPicker, onRemove, onHover }: GuitarSlotProps) => {
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
      onMouseMove={(e) => onHover?.(e, <GuitarCard item={item} readOnly />)}
      onMouseLeave={() => onHover?.(null, null)}
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
          <span className="rounded border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 text-[10px] font-black tabular-nums text-amber-300" title="Item level">
            Lv {getItemLevel(item, guitar)}
          </span>
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
      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
        {/* Subtle structural grid */}
        <div
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            backgroundImage: [
              `linear-gradient(${rs.baseColor} 1px, transparent 1px)`,
              `linear-gradient(90deg, ${rs.baseColor} 1px, transparent 1px)`,
            ].join(","),
            backgroundSize: "22px 22px",
            opacity: 0.04,
          }}
        />
        {/* Neutral spotlight so dark guitars separate from the background */}
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{ background: `radial-gradient(60% 55% at 50% 48%, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 40%, transparent 72%)` }}
        />
        {/* Rarity glow backdrop */}
        <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none translate-y-[60px] opacity-50">
          <div
            className="absolute w-[170px] h-[170px] rounded-full blur-[34px]"
            style={{ background: `radial-gradient(circle at center, ${rs.baseColor}66 0%, ${rs.baseColor}1f 45%, transparent 72%)` }}
          />
        </div>
        <img
          src={`/static/images/rank/${guitar.imageId}.webp`}
          alt={guitar.name}
          className="relative z-10 -rotate-45 object-contain"
          style={{ height: 260, width: 260 }}
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
