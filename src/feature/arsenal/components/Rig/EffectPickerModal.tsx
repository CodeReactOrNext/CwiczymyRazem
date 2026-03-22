import { X } from "lucide-react";
import { EFFECTS_BY_ID } from "feature/arsenal/data/effectDefinitions";
import { RARITY_STYLES } from "../RarityBadge";
import type { EffectInventoryItem } from "../../types/arsenal.types";

interface EffectPickerModalProps {
  effectInventory: EffectInventoryItem[];
  occupiedItemIds: string[];
  slotIndex: number;
  currentItemId: string | null;
  onSelect: (itemId: string | null) => void;
  onClose: () => void;
}

export const EffectPickerModal = ({
  effectInventory,
  occupiedItemIds,
  slotIndex,
  currentItemId,
  onSelect,
  onClose,
}: EffectPickerModalProps) => {
  // Deduplicate by effectId — show one per unique effect
  const uniqueMap = new Map<number | string, EffectInventoryItem>();
  for (const item of effectInventory) {
    const existing = uniqueMap.get(item.effectId);
    if (!existing || item.acquiredAt > existing.acquiredAt) {
      uniqueMap.set(item.effectId, item);
    }
  }
  const items = Array.from(uniqueMap.values());

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl max-h-[80vh] overflow-y-auto rounded-sm bg-zinc-950 border border-zinc-800 p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Pedalboard · Slot {slotIndex + 1}</p>
            <p className="text-base font-black text-white uppercase tracking-wide">Choose an effect</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {currentItemId && (
          <button
            onClick={() => { onSelect(null); onClose(); }}
            className="mb-4 w-full py-2 text-[10px] font-black uppercase tracking-widest border border-dashed border-zinc-700 text-zinc-500 hover:text-white hover:border-zinc-500 rounded-sm transition-colors"
          >
            Remove from slot
          </button>
        )}

        {items.length === 0 && (
          <p className="text-center text-zinc-600 text-sm py-8">No effects in your collection yet.<br />Draw an effect pack to get started!</p>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {items.map((item) => {
            const effect = EFFECTS_BY_ID.get(item.effectId);
            if (!effect) return null;
            const rs = RARITY_STYLES[effect.rarity];
            const isSelected = item.id === currentItemId;
            const isOccupied = occupiedItemIds.includes(item.id) && !isSelected;

            return (
              <button
                key={item.id}
                disabled={isOccupied}
                onClick={() => { onSelect(item.id); onClose(); }}
                className="relative flex flex-col items-center rounded-sm overflow-hidden transition-all duration-200 disabled:opacity-30"
                style={{
                  background: `linear-gradient(160deg, ${rs.baseColor}20 0%, #0f0f12 60%)`,
                  borderBottom: `2px solid ${rs.baseColor}`,
                  outline: isSelected ? `2px solid ${rs.baseColor}` : undefined,
                }}
              >
                <img
                  src={`/static/images/effects/${effect.imageId}.png`}
                  alt={effect.name}
                  className="object-contain w-full"
                  style={{ height: 120 }}
                />
                <div className="px-2 pb-2 w-full text-left">
                  <p className="text-[8px] font-bold uppercase truncate" style={{ color: rs.baseColor }}>{effect.type}</p>
                  <p className="text-[10px] font-black text-white uppercase truncate leading-snug">{effect.name}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
