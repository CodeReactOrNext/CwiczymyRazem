import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { EFFECT_DEFINITIONS, EFFECTS_BY_ID } from "feature/arsenal/data/effectDefinitions";
import { useSellEffect } from "feature/arsenal/hooks/useSellEffect";
import { ARSENAL_QUERY_KEY } from "feature/arsenal/hooks/useArsenalData";
import { clearNewFlags } from "feature/arsenal/services/arsenal.service";

import type { ArsenalUserData, EffectInventoryItem, GuitarRarity } from "../../types/arsenal.types";
import { RARITY_ORDER, RaritySectionHeader } from "../RarityProgress";
import { EffectCard } from "./EffectCard";
import { SellConfirmDialog } from "./SellConfirmDialog";

type GroupedEffect = { item: EffectInventoryItem; sellItemId: string | null; count: number };

const EFFECT_FAME_VALUES: Record<string, number> = {
  Common: 8, Uncommon: 15, Rare: 40, Epic: 75, Legendary: 150, Mythic: 375,
};

interface EffectCollectionProps {
  data: ArsenalUserData;
}

export const EffectCollection = ({ data }: EffectCollectionProps) => {
  const { mutate: sellEffect, isPending: isSelling } = useSellEffect();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedEffectId, setSelectedEffectId] = useState<number | string | null>(null);

  // Clear "new" flags when user opens collection tab
  useEffect(() => {
    const hasNew = data.effectInventory.some((item) => item.isNew);
    if (hasNew) {
      clearNewFlags().then(() => {
        queryClient.invalidateQueries({ queryKey: ARSENAL_QUERY_KEY });
      });
    }
  }, []);

  if (!data.effectInventory || data.effectInventory.length === 0) return null;

  const pedalboardItemIds = new Set(data.rig?.pedalboardItems?.map((p) => p.itemId) || []);

  // Group by effectId; display = newest copy, sell target = oldest non-pedalboard copy
  const groupedMap = new Map<number | string, { item: typeof data.effectInventory[0]; sellItemId: string | null; count: number }>();
  for (const item of data.effectInventory) {
    const existing = groupedMap.get(item.effectId);
    const onBoard = pedalboardItemIds.has(item.id);

    if (!existing) {
      groupedMap.set(item.effectId, { item, sellItemId: onBoard ? null : item.id, count: 1 });
    } else {
      const displayItem = item.acquiredAt > existing.item.acquiredAt ? item : existing.item;
      let sellItemId = existing.sellItemId;
      if (!onBoard) {
        if (sellItemId === null) {
          sellItemId = item.id;
        } else {
          const prevSellItem = data.effectInventory.find(i => i.id === sellItemId)!;
          if (item.acquiredAt < prevSellItem.acquiredAt) sellItemId = item.id;
        }
      }
      groupedMap.set(item.effectId, { item: displayItem, sellItemId, count: existing.count + 1 });
    }
  }
  const uniqueOwnedCount = groupedMap.size;
  const totalEffectsCount = EFFECT_DEFINITIONS.length;

  // Group owned effects per rarity (newest first within a group),
  // and count how many of each rarity exist / are owned.
  const itemsByRarity = {} as Record<GuitarRarity, GroupedEffect[]>;
  const totalByRarity = {} as Record<GuitarRarity, number>;
  const ownedByRarity = {} as Record<GuitarRarity, number>;
  for (const rarity of RARITY_ORDER) {
    itemsByRarity[rarity] = [];
    totalByRarity[rarity] = 0;
    ownedByRarity[rarity] = 0;
  }
  for (const effect of EFFECT_DEFINITIONS) {
    totalByRarity[effect.rarity]++;
    if (groupedMap.has(effect.id)) ownedByRarity[effect.rarity]++;
  }
  for (const grouped of groupedMap.values()) {
    const rarity = EFFECTS_BY_ID.get(grouped.item.effectId)?.rarity ?? "Common";
    itemsByRarity[rarity].push(grouped);
  }
  for (const rarity of RARITY_ORDER) {
    itemsByRarity[rarity].sort((a, b) => b.item.acquiredAt - a.item.acquiredAt);
  }

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

  return (
    <>
      <div className="flex flex-col gap-3 mt-8">
        <div className="flex flex-col gap-0.5">
          <p className="text-[9px] font-bold capitalize tracking-[0.2em] text-zinc-500">Effects</p>
          <p className="text-base font-black text-white capitalize tracking-wide">Pedals</p>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-lg font-black text-white">{uniqueOwnedCount}</span>
          <span className="text-sm font-bold text-zinc-500">/ {totalEffectsCount}</span>
          <span className="ml-1 text-xs font-medium text-zinc-500">pedals collected</span>
        </div>
        <div className="flex flex-col gap-12">
          {RARITY_ORDER.map((rarity) => {
            const grouped = itemsByRarity[rarity];
            if (grouped.length === 0) return null;
            return (
              <section key={rarity}>
                <RaritySectionHeader
                  rarity={rarity}
                  owned={ownedByRarity[rarity]}
                  total={totalByRarity[rarity]}
                />
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {grouped.map(({ item, sellItemId, count }) => (
                    <EffectCard
                      key={item.id}
                      item={item}
                      sellItemId={sellItemId}
                      count={count}
                      isOnPedalboard={pedalboardItemIds.has(item.id)}
                      onSellClick={handleSellClick}
                      isSelling={isSelling}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      {(() => {
        const effect = selectedEffectId != null ? EFFECTS_BY_ID.get(selectedEffectId) : null;
        return effect ? (
          <SellConfirmDialog
            isOpen={isDialogOpen}
            itemType="Effect"
            itemName={`${effect.brand} ${effect.name}`}
            fameReward={EFFECT_FAME_VALUES[effect.rarity] ?? 0}
            onConfirm={handleConfirmSell}
            onCancel={() => {
              setIsDialogOpen(false);
              setSelectedItemId(null);
              setSelectedEffectId(null);
            }}
            isLoading={isSelling}
          />
        ) : null;
      })()}
    </>
  );
};
