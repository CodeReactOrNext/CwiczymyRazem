import { X } from "lucide-react";
import { GUITARS_BY_ID } from "feature/arsenal/data/guitarDefinitions";
import { RARITY_STYLES } from "../RarityBadge";
import type { InventoryItem } from "../../types/arsenal.types";

interface GuitarPickerModalProps {
  inventory: InventoryItem[];
  occupiedItemIds: (string | null)[];
  slotIndex: number;
  currentItemId: string | null;
  onSelect: (itemId: string | null) => void;
  onClose: () => void;
}

export const GuitarPickerModal = ({
  inventory,
  occupiedItemIds,
  slotIndex,
  currentItemId,
  onSelect,
  onClose,
}: GuitarPickerModalProps) => {
  // Deduplicate by guitarId — show one card per unique guitar (latest acquired)
  const uniqueMap = new Map<number | string, InventoryItem>();
  for (const item of inventory) {
    const existing = uniqueMap.get(item.guitarId);
    if (!existing || item.acquiredAt > existing.acquiredAt) {
      uniqueMap.set(item.guitarId, item);
    }
  }
  const items = Array.from(uniqueMap.values());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-sm bg-zinc-950 border border-zinc-800 p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Guitar Slot {slotIndex + 1}</p>
            <p className="text-base font-black text-white uppercase tracking-wide">Choose a guitar</p>
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

        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {items.map((item) => {
            const guitar = GUITARS_BY_ID.get(item.guitarId);
            if (!guitar) return null;
            const rs = RARITY_STYLES[guitar.rarity];
            const isSelected = item.id === currentItemId;
            const isOccupied = occupiedItemIds.includes(item.id) && !isSelected;

            return (
              <button
                key={item.id}
                disabled={isOccupied}
                onClick={() => { onSelect(item.id); onClose(); }}
                className="relative flex flex-col items-center rounded-sm overflow-hidden text-left transition-all duration-200 disabled:opacity-30"
                style={{
                  background: `linear-gradient(160deg, ${rs.baseColor}20 0%, #0f0f12 50%)`,
                  borderBottom: `2px solid ${rs.baseColor}`,
                  outline: isSelected ? `2px solid ${rs.baseColor}` : undefined,
                }}
              >
                <div className="flex items-center justify-center w-full" style={{ height: 90 }}>
                  <img
                    src={`/static/images/rank/${guitar.imageId}.png`}
                    alt={guitar.name}
                    className="-rotate-90 object-contain"
                    style={{ height: 80, width: 80 }}
                  />
                </div>
                <div className="px-2 pb-2 w-full">
                  <p className="text-[8px] font-bold uppercase truncate" style={{ color: rs.baseColor }}>{guitar.brand}</p>
                  <p className="text-[10px] font-black text-white uppercase truncate leading-snug">{guitar.name}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
