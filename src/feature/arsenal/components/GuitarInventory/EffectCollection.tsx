import { useQueryClient } from "@tanstack/react-query";
import { EFFECT_DEFINITIONS, EFFECTS_BY_ID } from "feature/arsenal/data/effectDefinitions";
import { ARSENAL_QUERY_KEY } from "feature/arsenal/hooks/useArsenalData";
import { useSellEffect } from "feature/arsenal/hooks/useSellEffect";
import { clearNewFlags } from "feature/arsenal/services/arsenal.service";
import { useEffect, useState } from "react";

import type { ArsenalUserData, EffectInventoryItem, GuitarRarity } from "../../types/arsenal.types";
import { RARITY_ORDER, RaritySectionHeader } from "../RarityProgress";
import { EffectCard } from "./EffectCard";
import { SellConfirmDialog } from "./SellConfirmDialog";

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

  // Each owned copy is its own card (distinct rolls). "Collected" still counts unique models.
  const ownedEffectIds = new Set(data.effectInventory.map((i) => i.effectId));
  const uniqueOwnedCount = ownedEffectIds.size;
  const totalEffectsCount = EFFECT_DEFINITIONS.length;

  // Bucket every owned copy per rarity (newest first),
  // and count how many models of each rarity exist / are owned.
  const itemsByRarity = {} as Record<GuitarRarity, EffectInventoryItem[]>;
  const totalByRarity = {} as Record<GuitarRarity, number>;
  const ownedByRarity = {} as Record<GuitarRarity, number>;
  for (const rarity of RARITY_ORDER) {
    itemsByRarity[rarity] = [];
    totalByRarity[rarity] = 0;
    ownedByRarity[rarity] = 0;
  }
  for (const effect of EFFECT_DEFINITIONS) {
    totalByRarity[effect.rarity]++;
    if (ownedEffectIds.has(effect.id)) ownedByRarity[effect.rarity]++;
  }
  for (const item of data.effectInventory) {
    const rarity = EFFECTS_BY_ID.get(item.effectId)?.rarity ?? "Common";
    itemsByRarity[rarity].push(item);
  }
  for (const rarity of RARITY_ORDER) {
    itemsByRarity[rarity].sort((a, b) => b.acquiredAt - a.acquiredAt);
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
            const items = itemsByRarity[rarity];
            if (items.length === 0) return null;
            return (
              <section key={rarity}>
                <RaritySectionHeader
                  rarity={rarity}
                  owned={ownedByRarity[rarity]}
                  total={totalByRarity[rarity]}
                />
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {items.map((item) => (
                    <EffectCard
                      key={item.id}
                      item={item}
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
