import { useState } from "react";
import { useSellEffect } from "feature/arsenal/hooks/useSellEffect";

import type { ArsenalUserData } from "../../types/arsenal.types";
import { EffectCard } from "./EffectCard";
import { SellConfirmDialog as EffectSellConfirmDialog } from "./SellConfirmDialog";

interface EffectCollectionProps {
  data: ArsenalUserData;
}

export const EffectCollection = ({ data }: EffectCollectionProps) => {
  const { mutate: sellEffect, isPending: isSelling } = useSellEffect();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedEffectId, setSelectedEffectId] = useState<number | string | null>(null);

  if (!data.effectInventory || data.effectInventory.length === 0) return null;

  // Group by effectId, count duplicates
  const groupedMap = new Map<number | string, { item: typeof data.effectInventory[0]; count: number }>();
  for (const item of data.effectInventory) {
    const existing = groupedMap.get(item.effectId);
    if (!existing || item.acquiredAt > existing.item.acquiredAt) {
      groupedMap.set(item.effectId, { item, count: (existing?.count ?? 0) + 1 });
    } else {
      groupedMap.set(item.effectId, { item: existing.item, count: existing.count + 1 });
    }
  }
  const items = Array.from(groupedMap.values()).sort((a, b) => b.item.acquiredAt - a.item.acquiredAt);

  const handleSellClick = (inventoryItemId: string, effectId: number | string) => {
    setSelectedItemId(inventoryItemId);
    setSelectedEffectId(effectId);
    setIsDialogOpen(true);
  };

  const handleConfirmSell = () => {
    if (selectedItemId) {
      sellEffect(selectedItemId, {
        onSuccess: () => {
          setIsDialogOpen(false);
          setSelectedItemId(null);
          setSelectedEffectId(null);
        },
      });
    }
  };

  const pedalboardItemIds = new Set(data.rig?.pedalboardItems?.map((p) => p.itemId) || []);

  return (
    <>
      <div className="flex flex-col gap-3 mt-8">
        <div className="flex flex-col gap-0.5">
          <p className="text-[9px] font-bold capitalize tracking-[0.2em] text-zinc-500">Effects</p>
          <p className="text-base font-black text-white capitalize tracking-wide">Pedals</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {items.map(({ item, count }) => (
            <EffectCard
              key={item.id}
              item={item}
              count={count}
              isOnPedalboard={pedalboardItemIds.has(item.id)}
              onSellClick={handleSellClick}
              isSelling={isSelling}
            />
          ))}
        </div>
      </div>

      <EffectSellConfirmDialog
        isOpen={isDialogOpen}
        guitarId={selectedEffectId || 0}
        onConfirm={handleConfirmSell}
        onCancel={() => {
          setIsDialogOpen(false);
          setSelectedItemId(null);
          setSelectedEffectId(null);
        }}
        isLoading={isSelling}
      />
    </>
  );
};
