import {
  EFFECT_DEFINITIONS,
  EFFECTS_BY_ID,
} from "feature/arsenal/data/effectDefinitions";
import {
  getEffectLevel,
  getEffectValue,
} from "feature/arsenal/data/effectStats";
import { getEffectiveRarity } from "feature/arsenal/data/itemStats";
import { useListItem } from "feature/arsenal/hooks/useMarketplace";
import { useScrapEffect } from "feature/arsenal/hooks/useScrapEffect";
import { useSellEffect } from "feature/arsenal/hooks/useSellEffect";
import { useSellEffectsBulk } from "feature/arsenal/hooks/useSellEffectsBulk";
import { useUpdatePedalboard } from "feature/arsenal/hooks/useUpdatePedalboard";
import type {
  CollectionEntry,
  CollectionSort,
} from "feature/arsenal/utils/collectionFilter";
import { filterAndSortEntries } from "feature/arsenal/utils/collectionFilter";
import { getEffectScrapYield } from "feature/arsenal/utils/scrap";
import { selectCurrentUserStats } from "feature/user/store/userSlice";
import { Layers } from "lucide-react";
import { useMemo, useState } from "react";
import { useAppSelector } from "store/hooks";

import type {
  ArsenalUserData,
  EffectInventoryItem,
} from "../../types/arsenal.types";
import { CollectionEmptyResult } from "../Collection/CollectionEmptyResult";
import { CollectionSectionHeader } from "../Collection/CollectionSectionHeader";
import { ListItemDialog } from "../Marketplace/ListItemDialog";
import { ScrapConfirmDialog } from "../Parts/ScrapConfirmDialog";
import type { BulkSellItem } from "./BulkSellConfirmDialog";
import { BulkSellConfirmDialog } from "./BulkSellConfirmDialog";
import { EffectCard } from "./EffectCard";
import { SellConfirmDialog } from "./SellConfirmDialog";

const EFFECT_FAME_VALUES: Record<string, number> = {
  Common: 8,
  Uncommon: 15,
  Rare: 40,
  Epic: 75,
  Legendary: 150,
  Mythic: 375,
};

interface EffectCollectionProps {
  data: ArsenalUserData;
  /** Free-text filter driven by the collection toolbar. */
  query?: string;
  sort?: CollectionSort;
}

export const EffectCollection = ({
  data,
  query = "",
  sort = "rarity",
}: EffectCollectionProps) => {
  const { mutate: sellEffect, isPending: isSelling } = useSellEffect();
  const { mutate: sellBulk, isPending: isSellingBulk } = useSellEffectsBulk();
  const { mutate: listOnMarket, isPending: isListing } = useListItem();
  const { mutate: scrap, isPending: isScrapping } = useScrapEffect();
  const { mutate: savePedalboard, isPending: isRemovingFromBoard } =
    useUpdatePedalboard();
  const userStats = useAppSelector(selectCurrentUserStats);
  const currentFame = userStats?.fame || 0;
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedEffectId, setSelectedEffectId] = useState<
    number | string | null
  >(null);
  const [isListDialogOpen, setIsListDialogOpen] = useState(false);
  const [listItemId, setListItemId] = useState<string | null>(null);
  const [listEffectId, setListEffectId] = useState<number | string | null>(
    null,
  );
  const [isBulkSellOpen, setIsBulkSellOpen] = useState(false);
  const [scrapItemId, setScrapItemId] = useState<string | null>(null);
  const [scrapEffectId, setScrapEffectId] = useState<number | string | null>(
    null,
  );

  const handleScrapClick = (
    inventoryItemId: string,
    effectId: number | string,
  ) => {
    setScrapItemId(inventoryItemId);
    setScrapEffectId(effectId);
  };

  const closeScrapDialog = () => {
    setScrapItemId(null);
    setScrapEffectId(null);
  };

  const handleConfirmScrap = () => {
    if (scrapItemId) scrap(scrapItemId, { onSuccess: closeScrapDialog });
  };

  // Unplug a pedal without leaving the collection tab — otherwise Market/Scrap/
  // Sell stay locked until the user goes back to the rig.
  const handleRemoveFromBoard = (inventoryItemId: string) => {
    const placements = data.rig?.pedalboardItems || [];
    savePedalboard(placements.filter((p) => p.itemId !== inventoryItemId));
  };

  // Sellable duplicates: for every pedal owned more than once, keep the
  // highest-level copy and mark the lower-level ones for bulk selling.
  // Pedals placed on the pedalboard are never sold.
  const { duplicateIds, duplicateItems, duplicateFame } = useMemo(() => {
    const pedalboardItemIds = new Set(
      data.rig?.pedalboardItems?.map((p) => p.itemId) || [],
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
        (a, b) => getEffectLevel(b, effect) - getEffectLevel(a, effect),
      );
      for (let i = 1; i < sorted.length; i++) {
        const it = sorted[i];
        if (pedalboardItemIds.has(it.id)) continue;
        ids.push(it.id);
        items.push({
          id: it.id,
          name: `${effect.brand} ${effect.name}`,
          rarity: getEffectiveRarity(effect.rarity, it.buildLevel),
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

  if (!data.effectInventory || data.effectInventory.length === 0) return null;

  const pedalboardItemIds = new Set(
    data.rig?.pedalboardItems?.map((p) => p.itemId) || [],
  );

  // Each owned copy is its own card (distinct rolls). "Collected" still counts unique models.
  const ownedEffectIds = new Set(data.effectInventory.map((i) => i.effectId));
  const uniqueOwnedCount = ownedEffectIds.size;
  const totalEffectsCount = EFFECT_DEFINITIONS.length;

  // Single flat grid: the toolbar decides the order, the entries only describe
  // what each card can be searched and sorted by.
  const entries: CollectionEntry<EffectInventoryItem>[] =
    data.effectInventory.map((item) => {
      const effect = EFFECTS_BY_ID.get(item.effectId);
      return {
        item,
        name: effect ? `${effect.brand} ${effect.name}` : "",
        // Effective, not mint: a promoted pedal belongs with its new tier.
        rarity: getEffectiveRarity(effect?.rarity ?? "Common", item.buildLevel),
        level: effect ? getEffectLevel(item, effect) : 0,
        acquiredAt: item.acquiredAt,
        groupKey: String(item.effectId),
      };
    });
  const sortedItems = filterAndSortEntries(entries, query, sort);

  const handleSellClick = (
    inventoryItemId: string,
    effectId: number | string,
  ) => {
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

  const handleListClick = (
    inventoryItemId: string,
    effectId: number | string,
  ) => {
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
        { onSuccess: closeListDialog },
      );
    }
  };

  return (
    <>
      <div className='flex flex-col gap-3'>
        <CollectionSectionHeader
          eyebrow='Effects'
          title='Pedals'
          owned={uniqueOwnedCount}
          total={totalEffectsCount}
          unit='pedals collected'
          action={
            duplicateIds.length > 0 ? (
              <button
                onClick={() => setIsBulkSellOpen(true)}
                disabled={isSellingBulk}
                className='flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-xs font-bold text-red-300 transition-colors disabled:opacity-50 hover:bg-red-500/20'
                title='Sell every lower-level duplicate, keeping the best copy of each pedal'>
                <Layers size={14} />
                Sell duplicates ({duplicateIds.length})
              </button>
            ) : null
          }
        />
        {sortedItems.length === 0 ? (
          <CollectionEmptyResult query={query} />
        ) : (
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'>
            {sortedItems.map((item) => (
              <EffectCard
                key={item.id}
                item={item}
                isOnPedalboard={pedalboardItemIds.has(item.id)}
                onSellClick={handleSellClick}
                isSelling={isSelling}
                onListClick={handleListClick}
                isListing={isListing}
                onScrapClick={handleScrapClick}
                isScrapping={isScrapping}
                onRemoveFromBoard={handleRemoveFromBoard}
                isRemovingFromBoard={isRemovingFromBoard}
              />
            ))}
          </div>
        )}
      </div>

      {(() => {
        const effect =
          scrapEffectId != null ? EFFECTS_BY_ID.get(scrapEffectId) : null;
        const item = scrapItemId
          ? data.effectInventory.find((i) => i.id === scrapItemId)
          : null;
        return effect && item ? (
          <ScrapConfirmDialog
            isOpen
            itemType='Effect'
            itemName={`${effect.brand} ${effect.name}`}
            parts={getEffectScrapYield(item, effect)}
            onConfirm={handleConfirmScrap}
            onCancel={closeScrapDialog}
            isLoading={isScrapping}
          />
        ) : null;
      })()}

      <BulkSellConfirmDialog
        isOpen={isBulkSellOpen}
        items={duplicateItems}
        fameReward={duplicateFame}
        protectedNote='Pedals on your pedalboard are never sold.'
        onConfirm={handleConfirmBulkSell}
        onCancel={() => setIsBulkSellOpen(false)}
        isLoading={isSellingBulk}
      />

      {(() => {
        const effect =
          selectedEffectId != null ? EFFECTS_BY_ID.get(selectedEffectId) : null;
        return effect ? (
          <SellConfirmDialog
            isOpen={isDialogOpen}
            itemType='Effect'
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
        const effect =
          listEffectId != null ? EFFECTS_BY_ID.get(listEffectId) : null;
        return effect ? (
          <ListItemDialog
            isOpen={isListDialogOpen}
            itemType='Effect'
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
