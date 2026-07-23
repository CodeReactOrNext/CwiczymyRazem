import { useQueryClient } from "@tanstack/react-query";
import { EFFECT_DEFINITIONS, EFFECTS_BY_ID } from "feature/arsenal/data/effectDefinitions";
import { getEffectLevel, getEffectValue } from "feature/arsenal/data/effectStats";
import { ARSENAL_QUERY_KEY } from "feature/arsenal/hooks/useArsenalData";
import { useListItem } from "feature/arsenal/hooks/useMarketplace";
import { useSellEffect } from "feature/arsenal/hooks/useSellEffect";
import { useSellEffectsBulk } from "feature/arsenal/hooks/useSellEffectsBulk";
import { clearNewFlags } from "feature/arsenal/services/arsenal.service";
import { selectCurrentUserStats } from "feature/user/store/userSlice";
import { Layers } from "lucide-react";
import { useEffect, useMemo,useState } from "react";
import { useAppSelector } from "store/hooks";

import type { ArsenalUserData, EffectInventoryItem } from "../../types/arsenal.types";
import { ListItemDialog } from "../Marketplace/ListItemDialog";
import { RARITY_RANK } from "../RarityProgress";
import type { BulkSellItem } from "./BulkSellConfirmDialog";
import { BulkSellConfirmDialog } from "./BulkSellConfirmDialog";
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
  const { mutate: sellBulk, isPending: isSellingBulk } = useSellEffectsBulk();
  const { mutate: listOnMarket, isPending: isListing } = useListItem();
  const queryClient = useQueryClient();
  const userStats = useAppSelector(selectCurrentUserStats);
  const currentFame = userStats?.fame || 0;
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedEffectId, setSelectedEffectId] = useState<number | string | null>(null);
  const [isListDialogOpen, setIsListDialogOpen] = useState(false);
  const [listItemId, setListItemId] = useState<string | null>(null);
  const [listEffectId, setListEffectId] = useState<number | string | null>(null);
  const [isBulkSellOpen, setIsBulkSellOpen] = useState(false);

  // Sellable duplicates: for every pedal owned more than once, keep the
  // highest-level copy and mark the lower-level ones for bulk selling.
  // Pedals placed on the pedalboard are never sold.
  const { duplicateIds, duplicateItems, duplicateFame } = useMemo(() => {
    const pedalboardItemIds = new Set(
      data.rig?.pedalboardItems?.map((p) => p.itemId) || []
    );
    const byEffect = new Map<number | string, EffectInventoryItem[]>();
    for (const item of data.effectInventory || []) {
      const arr = byEffect.get(item.effectId);
      if (arr) arr.push(item);
      else byEffect.set(item.effectId, [item]);
    }

    const ids: string[] = [];
    const items: BulkSellItem[] = [];
    let fame = 0;
    for (const [effectId, group] of byEffect) {
      if (group.length < 2) continue;
      const effect = EFFECTS_BY_ID.get(effectId);
      if (!effect) continue;
      const value = getEffectValue(effect); // rarity-based, same for every copy
      // Best copy first (level desc); keep it, sell the rest.
      const sorted = [...group].sort(
        (a, b) => getEffectLevel(b, effect) - getEffectLevel(a, effect)
      );
      for (let i = 1; i < sorted.length; i++) {
        const it = sorted[i];
        if (pedalboardItemIds.has(it.id)) continue;
        ids.push(it.id);
        items.push({
          id: it.id,
          name: `${effect.brand} ${effect.name}`,
          rarity: effect.rarity,
          level: getEffectLevel(it, effect),
          value,
        });
        fame += value;
      }
    }
    // Highest-level (most valuable) first.
    items.sort((a, b) => b.level - a.level || b.value - a.value);
    return { duplicateIds: ids, duplicateItems: items, duplicateFame: fame };
  }, [data.effectInventory, data.rig?.pedalboardItems]);

  const handleConfirmBulkSell = () => {
    if (duplicateIds.length === 0) return;
    sellBulk(duplicateIds, {
      onSuccess: () => setIsBulkSellOpen(false),
    });
  };

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

  // Single flat grid, sorted rarest-first then newest-first — no per-rarity sections.
  const sortedItems = [...data.effectInventory].sort((a, b) => {
    const rarityA = EFFECTS_BY_ID.get(a.effectId)?.rarity ?? "Common";
    const rarityB = EFFECTS_BY_ID.get(b.effectId)?.rarity ?? "Common";
    if (rarityA !== rarityB) return RARITY_RANK[rarityB] - RARITY_RANK[rarityA];
    return b.acquiredAt - a.acquiredAt;
  });

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

  const handleListClick = (inventoryItemId: string, effectId: number | string) => {
    setListItemId(inventoryItemId);
    setListEffectId(effectId);
    setIsListDialogOpen(true);
  };

  const closeListDialog = () => {
    setIsListDialogOpen(false);
    setListItemId(null);
    setListEffectId(null);
  };

  const handleConfirmList = (price: number) => {
    if (listItemId) {
      listOnMarket(
        { itemType: "effect", inventoryItemId: listItemId, price },
        { onSuccess: closeListDialog }
      );
    }
  };

  return (
    <>
      <div className="flex flex-col gap-3 mt-8">
        <div className="flex flex-col gap-0.5">
          <p className="text-[9px] font-bold capitalize tracking-[0.2em] text-zinc-500">Effects</p>
          <p className="text-base font-black text-white capitalize tracking-wide">Pedals</p>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-black text-white">{uniqueOwnedCount}</span>
            <span className="text-sm font-bold text-zinc-500">/ {totalEffectsCount}</span>
            <span className="ml-1 text-xs font-medium text-zinc-500">pedals collected</span>
          </div>

          {duplicateIds.length > 0 && (
            <button
              onClick={() => setIsBulkSellOpen(true)}
              disabled={isSellingBulk}
              className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-300 transition-colors hover:bg-red-500/20 disabled:opacity-50"
              title="Sell every lower-level duplicate, keeping the best copy of each pedal"
            >
              <Layers size={14} />
              Sell duplicates ({duplicateIds.length})
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {sortedItems.map((item) => (
            <EffectCard
              key={item.id}
              item={item}
              isOnPedalboard={pedalboardItemIds.has(item.id)}
              onSellClick={handleSellClick}
              isSelling={isSelling}
              onListClick={handleListClick}
              isListing={isListing}
            />
          ))}
        </div>
      </div>

      <BulkSellConfirmDialog
        isOpen={isBulkSellOpen}
        items={duplicateItems}
        fameReward={duplicateFame}
        protectedNote="Pedals on your pedalboard are never sold."
        onConfirm={handleConfirmBulkSell}
        onCancel={() => setIsBulkSellOpen(false)}
        isLoading={isSellingBulk}
      />

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

      {(() => {
        const effect = listEffectId != null ? EFFECTS_BY_ID.get(listEffectId) : null;
        return effect ? (
          <ListItemDialog
            isOpen={isListDialogOpen}
            itemType="Effect"
            itemName={`${effect.brand} ${effect.name}`}
            minPrice={EFFECT_FAME_VALUES[effect.rarity] ?? 0}
            currentFame={currentFame}
            onConfirm={handleConfirmList}
            onCancel={closeListDialog}
            isLoading={isListing}
          />
        ) : null;
      })()}
    </>
  );
};
