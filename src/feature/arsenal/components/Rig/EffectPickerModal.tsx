import { cn } from "assets/lib/utils";
import { EFFECTS_BY_ID } from "feature/arsenal/data/effectDefinitions";
import { getEffectiveRarity } from "feature/arsenal/data/itemStats";
import { X } from "lucide-react";

import type { EffectInventoryItem } from "../../types/arsenal.types";
import { EffectStashTile } from "../GuitarInventory/EffectStashTile";
import { RARITY_STYLES } from "../RarityBadge";

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
      className='fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm'
      onClick={onClose}>
      <div
        className='relative max-h-[80vh] w-full max-w-xl overflow-y-auto rounded-lg bg-zinc-900 p-6 shadow-2xl'
        onClick={(e) => e.stopPropagation()}>
        <div className='mb-6 flex items-start justify-between gap-4'>
          <div className='flex flex-col gap-0.5'>
            <p className='text-[10px] font-bold capitalize tracking-widest text-zinc-500'>
              Pedalboard · Slot {slotIndex + 1}
            </p>
            <p className='text-base font-black capitalize tracking-wide text-white'>
              Choose an effect
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

        {items.length === 0 && (
          <p className='py-8 text-center text-sm text-zinc-500'>
            No effects in your collection yet.
            <br />
            Draw an effect pack to get started!
          </p>
        )}

        {/* The stash's own sockets, square the way a pedal sits on the board. */}
        <div className='grid grid-cols-3 gap-x-3 gap-y-4 xsm:grid-cols-4'>
          {items.map((item) => {
            const effect = EFFECTS_BY_ID.get(item.effectId);
            if (!effect) return null;

            const rarity = getEffectiveRarity(effect.rarity, item.buildLevel);
            const isSelected = item.id === currentItemId;
            const isOccupied = occupiedItemIds.includes(item.id) && !isSelected;

            return (
              <div key={item.id} className='flex flex-col gap-2'>
                <div className='aspect-square'>
                  <EffectStashTile
                    item={item}
                    isOnPedalboard={isSelected}
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
                    {effect.type}
                  </span>
                  <span className='truncate text-xs font-black capitalize leading-snug text-white'>
                    {effect.name}
                  </span>
                  {isOccupied && (
                    <span className='text-[10px] font-semibold text-zinc-500'>
                      On another slot
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
