import { cn } from "assets/lib/utils";
import { GUITARS_BY_ID } from "feature/arsenal/data/guitarDefinitions";
import { getEffectiveRarity } from "feature/arsenal/data/itemStats";
import { X } from "lucide-react";

import type { InventoryItem } from "../../types/arsenal.types";
import { GuitarStashTile } from "../GuitarInventory/GuitarStashTile";
import { RARITY_STYLES } from "../RarityBadge";

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
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm'
      onClick={onClose}>
      <div
        className='relative max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-zinc-900 p-6 shadow-2xl'
        onClick={(e) => e.stopPropagation()}>
        <div className='mb-6 flex items-start justify-between gap-4'>
          <div className='flex flex-col gap-0.5'>
            <p className='text-[10px] font-bold capitalize tracking-widest text-zinc-500'>
              Guitar Slot {slotIndex + 1}
            </p>
            <p className='text-base font-black capitalize tracking-wide text-white'>
              Choose a guitar
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label='Close'
            className='rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-white'>
            <X size={18} />
          </button>
        </div>

        {currentItemId && (
          <button
            onClick={() => {
              onSelect(null);
              onClose();
            }}
            className='mb-6 w-full rounded-lg bg-zinc-800/40 py-3 text-xs font-bold capitalize tracking-widest text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white'>
            Remove from slot
          </button>
        )}

        {/*
          The same sockets the stash is built from, so a guitar is the same object
          wherever the player meets it — lit by its rarity, standing upright, with
          its level in the corner and its full card behind a hover.
        */}
        <div className='grid grid-cols-3 gap-x-3 gap-y-4 xsm:grid-cols-4 sm:grid-cols-5'>
          {items.map((item) => {
            const guitar = GUITARS_BY_ID.get(item.guitarId);
            if (!guitar) return null;

            const rarity = getEffectiveRarity(guitar.rarity, item.buildLevel);
            const isSelected = item.id === currentItemId;
            const isOccupied = occupiedItemIds.includes(item.id) && !isSelected;

            return (
              <div key={item.id} className='flex flex-col gap-2'>
                {/* A guitar socket is one column by two rows on the board; here
                    there is no board, so the cell carries that shape itself. */}
                <div className='aspect-[1/2]'>
                  <GuitarStashTile
                    item={item}
                    isEquipped={isSelected}
                    dimmed={isOccupied}
                    disabled={isOccupied}
                    onClick={() => {
                      onSelect(item.id);
                      onClose();
                    }}
                  />
                </div>

                <div
                  className={cn(
                    "flex min-w-0 flex-col",
                    isOccupied && "opacity-40",
                  )}>
                  <span
                    className='truncate text-[10px] font-bold capitalize'
                    style={{ color: RARITY_STYLES[rarity].baseColor }}>
                    {guitar.brand}
                  </span>
                  <span className='truncate text-xs font-black capitalize leading-snug text-white'>
                    {guitar.name}
                  </span>
                  {isOccupied && (
                    <span className='text-[10px] font-semibold text-zinc-500'>
                      In another slot
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
