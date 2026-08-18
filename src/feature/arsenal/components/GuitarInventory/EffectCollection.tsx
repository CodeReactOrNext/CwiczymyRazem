import {
  EFFECT_DEFINITIONS,
  EFFECTS_BY_ID,
} from "feature/arsenal/data/effectDefinitions";
import {
  getSalvageableMod,
  getScrappedMods,
} from "feature/arsenal/data/salvage";
import { useListItem } from "feature/arsenal/hooks/useMarketplace";
import { useScrapEffect } from "feature/arsenal/hooks/useScrapEffect";
import { useScrapEffectsBulk } from "feature/arsenal/hooks/useScrapEffectsBulk";
import { useSellEffect } from "feature/arsenal/hooks/useSellEffect";
import { useSellEffectsBulk } from "feature/arsenal/hooks/useSellEffectsBulk";
import { useUpdatePedalboard } from "feature/arsenal/hooks/useUpdatePedalboard";
import { getEffectEntries } from "feature/arsenal/utils/collectionEntries";
import type { CollectionSort } from "feature/arsenal/utils/collectionFilter";
import { filterAndSortEntries } from "feature/arsenal/utils/collectionFilter";
import { getEffectDuplicates } from "feature/arsenal/utils/duplicates";
import { getEffectScrapYield } from "feature/arsenal/utils/scrap";
import { selectCurrentUserStats } from "feature/user/store/userSlice";
import { Layers } from "lucide-react";
import { useMemo, useState } from "react";
import { useAppSelector } from "store/hooks";

import type { ArsenalUserData } from "../../types/arsenal.types";
import { CollectionEmptyResult } from "../Collection/CollectionEmptyResult";
import { CollectionSectionHeader } from "../Collection/CollectionSectionHeader";
import { ListItemDialog } from "../Marketplace/ListItemDialog";
import { ScrapConfirmDialog } from "../Parts/ScrapConfirmDialog";
import { BulkDuplicatesDialog } from "./BulkDuplicatesDialog";
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
  const { mutate: scrapBulk, isPending: isScrappingBulk } =
    useScrapEffectsBulk();
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

  // Spare duplicates: for every pedal owned more than once, keep the
  // highest-level copy and offer the lower-level ones to the bulk sweep — sold
  // for Fame or scrapped for parts. Pedals on the pedalboard are never touched.
  const duplicates = useMemo(
    () =>
      getEffectDuplicates(
        data.effectInventory || [],
        new Set(data.rig?.pedalboardItems?.map((p) => p.itemId) || []),
      ),
    [data.effectInventory, data.rig?.pedalboardItems],
  );

  const handleConfirmBulkSell = () => {
    if (duplicates.ids.length === 0) return;
    sellBulk(duplicates.ids, {
      onSuccess: () => setIsBulkSellOpen(false),
    });
  };

  const handleConfirmBulkScrap = () => {
    if (duplicates.ids.length === 0) return;
    scrapBulk(duplicates.ids, {
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
  const sortedItems = filterAndSortEntries(
    getEffectEntries(data.effectInventory, pedalboardItemIds),
    query,
    sort,
  );

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
            duplicates.ids.length > 0 ? (
              <button
                onClick={() => setIsBulkSellOpen(true)}
                disabled={isSellingBulk || isScrappingBulk}
                className='flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-xs font-bold text-red-300 transition-colors disabled:opacity-50 hover:bg-red-500/20'
                title='Sell or scrap every lower-level duplicate, keeping the best copy of each pedal'>
                <Layers size={14} />
                Clear duplicates ({duplicates.ids.length})
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
            salvaged={getSalvageableMod(item, "effect")}
            scrapped={getScrappedMods(item, "effect")}
            onConfirm={handleConfirmScrap}
            onCancel={closeScrapDialog}
            isLoading={isScrapping}
          />
        ) : null;
      })()}

      <BulkDuplicatesDialog
        isOpen={isBulkSellOpen}
        items={duplicates.items}
        fameReward={duplicates.fame}
        scrapParts={duplicates.parts}
        salvagedCount={duplicates.salvagedCount}
        protectedNote='Pedals on your pedalboard are never touched.'
        onSell={handleConfirmBulkSell}
        onScrap={handleConfirmBulkScrap}
        onCancel={() => setIsBulkSellOpen(false)}
        isSelling={isSellingBulk}
        isScrapping={isScrappingBulk}
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
