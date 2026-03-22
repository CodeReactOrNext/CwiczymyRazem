import { Plus, X } from "lucide-react";
import { GUITARS_BY_ID } from "feature/arsenal/data/guitarDefinitions";
import { RARITY_STYLES } from "../RarityBadge";
import type { InventoryItem } from "../../types/arsenal.types";

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
        className="flex flex-col items-center justify-center gap-2 rounded-sm border border-dashed border-zinc-700/60 bg-zinc-900/30 min-h-[260px] w-full transition-colors hover:border-zinc-500 hover:bg-zinc-900/60 group"
      >
        <Plus size={24} className="text-zinc-600 group-hover:text-zinc-400 transition-colors" strokeWidth={1.5} />
        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600 group-hover:text-zinc-400 transition-colors">
          Add Guitar
        </span>
      </button>
    );
  }

  return (
    <div
      className="relative flex flex-col rounded-sm overflow-hidden"
      style={{
        background: `linear-gradient(160deg, ${rs.baseColor}22 0%, #0f0f12 40%, #0f0f12 100%)`,
        border: `1px solid ${rs.baseColor}30`,
        borderBottom: `3px solid ${rs.baseColor}`,
      }}
    >
      {/* Slot number badge */}
      <div
        className="absolute top-2 left-2 z-20 w-5 h-5 flex items-center justify-center text-[9px] font-black rounded-sm"
        style={{ backgroundColor: `${rs.baseColor}20`, color: rs.baseColor, border: `1px solid ${rs.baseColor}40` }}
      >
        {slotIndex + 1}
      </div>

      {/* Remove button */}
      <button
        onClick={() => onRemove(slotIndex)}
        className="absolute top-2 right-2 z-20 rounded-sm bg-zinc-900/80 border border-zinc-700 p-1 text-zinc-500 hover:text-white hover:border-zinc-500 transition-colors"
      >
        <X size={12} />
      </button>

      {/* Header */}
      <div className="px-3 pt-2.5 pb-1">
        <p className="text-[9px] font-semibold tracking-wide leading-none truncate" style={{ color: rs.baseColor }}>
          {guitar.brand}
        </p>
        <p className="text-[15px] font-bold text-white leading-snug truncate">
          {guitar.name}
        </p>
        <p className="text-[8px] font-medium uppercase tracking-widest mt-0.5" style={{ color: `${rs.baseColor}bb` }}>
          {guitar.rarity}
        </p>
      </div>

      {/* Image */}
      <div
        className="flex items-end justify-center overflow-hidden"
        style={{
          height: 200,
          background: `radial-gradient(ellipse at 50% 100%, ${rs.baseColor}25 0%, ${rs.baseColor}06 45%, transparent 70%)`,
        }}
      >
        <img
          src={`/static/images/rank/${guitar.imageId}.png`}
          alt={guitar.name}
          className="-rotate-90 object-contain"
          style={{ height: 180, width: 180 }}
        />
      </div>

      {/* Meta */}
      <div className="flex items-center border-t border-zinc-800/60 min-h-[26px]">
        {item.year && (
          <div className="flex-1 flex items-center justify-center py-1 border-r border-zinc-800/60">
            <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">{item.year}</span>
          </div>
        )}
        {item.country && (
          <div className="flex-1 flex items-center justify-center py-1">
            <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest truncate px-1">{item.country}</span>
          </div>
        )}
      </div>

      {/* Edit button */}
      <button
        onClick={() => onOpenPicker(slotIndex)}
        className="w-full py-1.5 text-[9px] font-black uppercase tracking-widest border-t border-zinc-800/60 text-zinc-600 hover:text-white hover:bg-zinc-800/40 transition-colors"
      >
        Change
      </button>
    </div>
  );
};
