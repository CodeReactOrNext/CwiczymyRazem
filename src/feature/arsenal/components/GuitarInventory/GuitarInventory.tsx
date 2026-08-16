import {
  GUITAR_DEFINITIONS,
  GUITARS_BY_ID,
} from "feature/arsenal/data/guitarDefinitions";
import { getItemValue } from "feature/arsenal/data/itemStats";
import {
  getSalvageableMod,
  getScrappedMods,
} from "feature/arsenal/data/salvage";
import { useEquipGuitar } from "feature/arsenal/hooks/useEquipGuitar";
import { useListItem } from "feature/arsenal/hooks/useMarketplace";
import { useScrapGuitar } from "feature/arsenal/hooks/useScrapGuitar";
import { useSellGuitar } from "feature/arsenal/hooks/useSellGuitar";
import { useSellGuitarsBulk } from "feature/arsenal/hooks/useSellGuitarsBulk";
import { useUnequipGuitar } from "feature/arsenal/hooks/useUnequipGuitar";
import { useUpdateRig } from "feature/arsenal/hooks/useUpdateRig";
import { getGuitarEntries } from "feature/arsenal/utils/collectionEntries";
import type { CollectionSort } from "feature/arsenal/utils/collectionFilter";
import { filterAndSortEntries } from "feature/arsenal/utils/collectionFilter";
import { getGuitarDuplicates } from "feature/arsenal/utils/duplicates";
import { getInUseGuitarIds } from "feature/arsenal/utils/inUse";
import { getGuitarScrapYield } from "feature/arsenal/utils/scrap";
import { selectCurrentUserStats } from "feature/user/store/userSlice";
import { Layers } from "lucide-react";
import { useMemo, useState } from "react";
import { useAppSelector } from "store/hooks";

import type {
  ArsenalUserData,
  InventoryItem,
  RigSetup,
} from "../../types/arsenal.types";
import { DEFAULT_RIG } from "../../types/arsenal.types";
import { CollectionEmptyResult } from "../Collection/CollectionEmptyResult";
import { CollectionSectionHeader } from "../Collection/CollectionSectionHeader";
import { ListItemDialog } from "../Marketplace/ListItemDialog";
import { ScrapConfirmDialog } from "../Parts/ScrapConfirmDialog";
import { BulkSellConfirmDialog } from "./BulkSellConfirmDialog";
import { EquipTargetDialog } from "./EquipTargetDialog";
import type { EquipTarget } from "./GuitarCard";
import { GuitarCard } from "./GuitarCard";
import { SellConfirmDialog } from "./SellConfirmDialog";

const GUITAR_FAME_VALUES: Record<string, number> = {
  Common: 15,
  Uncommon: 30,
  Rare: 75,
  Epic: 150,
  Legendary: 300,
  Mythic: 750,
};

interface GuitarInventoryProps {
  data: ArsenalUserData;
  /** Free-text filter driven by the collection toolbar. */
  query?: string;
  sort?: CollectionSort;
}

export const GuitarInventory = ({
  data,
  query = "",
  sort = "rarity",
}: GuitarInventoryProps) => {
  const { mutate: equip, isPending: isEquipping } = useEquipGuitar();
  const { mutate: unequip } = useUnequipGuitar();
  const { mutate: sell, isPending: isSelling } = useSellGuitar();
  const { mutate: sellBulk, isPending: isSellingBulk } = useSellGuitarsBulk();
  const { mutate: listOnMarket, isPending: isListing } = useListItem();
  const { mutate: scrap, isPending: isScrapping } = useScrapGuitar();
  const { mutate: saveRig } = useUpdateRig();
  const userStats = useAppSelector(selectCurrentUserStats);
  const currentFame = userStats?.fame || 0;

  const rig: RigSetup = data.rig ?? DEFAULT_RIG;

  // Sellable duplicates: for every guitar owned more than once, keep the
  // highest-level instance and mark the lower-level copies for bulk selling.
  // The equipped guitar and any rig-slotted guitar are never sold.
  const duplicates = useMemo(
    () =>
      getGuitarDuplicates(data.inventory, {
        equippedItemId: data.equippedItemId,
        rigSlots: rig.guitarSlots,
      }),
    [data.inventory, data.equippedItemId, rig.guitarSlots],
  );

  const handleEquipTo = (item: InventoryItem, target: EquipTarget) => {
    if (target === "profile") {
      equip({
        guitarId: item.guitarId,
        itemId: item.id,
        year: item.year,
        country: item.country,
      });
      return;
    }
    // Place into a rig slot without touching the avatar/profile guitar.
    // A guitar instance can occupy only one slot — clear it from any other slot first.
    const newSlots = rig.guitarSlots.map((id) =>
      id === item.id ? null : id,
    ) as RigSetup["guitarSlots"];
    newSlots[target] = item.id;
    saveRig({ rig: { ...rig, guitarSlots: newSlots } });
  };

  const handleRemoveFrom = (item: InventoryItem, target: EquipTarget) => {
    if (target === "profile") {
      unequip();
      return;
    }
    // Clear the guitar from the given rig slot, leaving the rest untouched.
    const newSlots = [...rig.guitarSlots] as RigSetup["guitarSlots"];
    if (newSlots[target] === item.id) newSlots[target] = null;
    saveRig({ rig: { ...rig, guitarSlots: newSlots } });
  };

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedGuitarId, setSelectedGuitarId] = useState<
    number | string | null
  >(null);
  const [equipItem, setEquipItem] = useState<InventoryItem | null>(null);
  const [isListDialogOpen, setIsListDialogOpen] = useState(false);
  const [listItemId, setListItemId] = useState<string | null>(null);
  const [listGuitarId, setListGuitarId] = useState<number | string | null>(
    null,
  );
  const [isBulkSellOpen, setIsBulkSellOpen] = useState(false);
  const [scrapItemId, setScrapItemId] = useState<string | null>(null);
  const [scrapGuitarId, setScrapGuitarId] = useState<number | string | null>(
    null,
  );

  const handleScrapClick = (
    inventoryItemId: string,
    guitarId: number | string,
  ) => {
    setScrapItemId(inventoryItemId);
    setScrapGuitarId(guitarId);
  };

  const closeScrapDialog = () => {
    setScrapItemId(null);
    setScrapGuitarId(null);
  };

  const handleConfirmScrap = () => {
    if (scrapItemId) scrap(scrapItemId, { onSuccess: closeScrapDialog });
  };

  const handleConfirmBulkSell = () => {
    if (duplicates.ids.length === 0) return;
    sellBulk(duplicates.ids, {
      onSuccess: () => setIsBulkSellOpen(false),
    });
  };

  if (data.inventory.length === 0) return null;

  const uniqueOwnedIds = new Set(data.inventory.map((item) => item.guitarId));
  const uniqueOwnedCount = uniqueOwnedIds.size;
  const totalGuitarsCount = GUITAR_DEFINITIONS.length;

  // Single flat grid: the toolbar decides the order, the entries only describe
  // what each card can be searched and sorted by.
  const sortedItems = filterAndSortEntries(
    getGuitarEntries(
      data.inventory,
      getInUseGuitarIds(data.equippedItemId, data.rig?.guitarSlots),
    ),
    query,
    sort,
  );

  const handleSellClick = (
    inventoryItemId: string,
    guitarId: number | string,
  ) => {
    setSelectedItemId(inventoryItemId);
    setSelectedGuitarId(guitarId);
    setIsDialogOpen(true);
  };

  const handleConfirmSell = () => {
    if (selectedItemId) {
      sell(selectedItemId, {
        onSuccess: () => {
          setIsDialogOpen(false);
          setSelectedItemId(null);
          setSelectedGuitarId(null);
        },
      });
    }
  };

  const handleListClick = (
    inventoryItemId: string,
    guitarId: number | string,
  ) => {
    setListItemId(inventoryItemId);
    setListGuitarId(guitarId);
    setIsListDialogOpen(true);
  };

  const closeListDialog = () => {
    setIsListDialogOpen(false);
    setListItemId(null);
    setListGuitarId(null);
  };

  const handleConfirmList = (price: number) => {
    if (listItemId) {
      listOnMarket(
        { itemType: "guitar", inventoryItemId: listItemId, price },
        { onSuccess: closeListDialog },
      );
    }
  };

  return (
    <>
      <div className='flex flex-col gap-3'>
        <CollectionSectionHeader
          eyebrow='Instruments'
          title='Guitars'
          owned={uniqueOwnedCount}
          total={totalGuitarsCount}
          unit='guitars collected'
          action={
            duplicates.ids.length > 0 ? (
              <button
                onClick={() => setIsBulkSellOpen(true)}
                disabled={isSellingBulk}
                className='flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-xs font-bold text-red-300 transition-colors disabled:opacity-50 hover:bg-red-500/20'
                title='Sell every lower-level duplicate, keeping the best copy of each guitar'>
                <Layers size={14} />
                Sell duplicates ({duplicates.ids.length})
              </button>
            ) : null
          }
        />

        {sortedItems.length === 0 ? (
          <CollectionEmptyResult query={query} />
        ) : (
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'>
            {sortedItems.map((item) => (
              <GuitarCard
                key={item.id}
                item={item}
                isEquipped={data.equippedItemId === item.id}
                rigSlot={(() => {
                  const i = rig.guitarSlots.indexOf(item.id);
                  return i >= 0 ? i : null;
                })()}
                onEquipClick={() => setEquipItem(item)}
                isEquipping={isEquipping}
                onSellClick={handleSellClick}
                isSelling={isSelling}
                onListClick={handleListClick}
                isListing={isListing}
                onScrapClick={handleScrapClick}
                isScrapping={isScrapping}
              />
            ))}
          </div>
        )}
      </div>

      {(() => {
        const guitar =
          selectedGuitarId != null ? GUITARS_BY_ID.get(selectedGuitarId) : null;
        const selectedItem = selectedItemId
          ? data.inventory.find((i) => i.id === selectedItemId)
          : null;
        return guitar ? (
          <SellConfirmDialog
            isOpen={isDialogOpen}
            itemType='Guitar'
            itemName={`${guitar.brand} ${guitar.name}`}
            fameReward={
              selectedItem
                ? getItemValue(selectedItem, guitar)
                : (GUITAR_FAME_VALUES[guitar.rarity] ?? 0)
            }
            onConfirm={handleConfirmSell}
            onCancel={() => {
              setIsDialogOpen(false);
              setSelectedItemId(null);
              setSelectedGuitarId(null);
            }}
            isLoading={isSelling}
          />
        ) : null;
      })()}

      {(() => {
        const guitar =
          listGuitarId != null ? GUITARS_BY_ID.get(listGuitarId) : null;
        const listItem = listItemId
          ? data.inventory.find((i) => i.id === listItemId)
          : null;
        return guitar ? (
          <ListItemDialog
            isOpen={isListDialogOpen}
            itemType='Guitar'
            itemName={`${guitar.brand} ${guitar.name}`}
            minPrice={
              listItem
                ? getItemValue(listItem, guitar)
                : (GUITAR_FAME_VALUES[guitar.rarity] ?? 0)
            }
            currentFame={currentFame}
            onConfirm={handleConfirmList}
            onCancel={closeListDialog}
            isLoading={isListing}
          />
        ) : null;
      })()}

      {(() => {
        const guitar =
          scrapGuitarId != null ? GUITARS_BY_ID.get(scrapGuitarId) : null;
        const item = scrapItemId
          ? data.inventory.find((i) => i.id === scrapItemId)
          : null;
        return guitar && item ? (
          <ScrapConfirmDialog
            isOpen
            itemType='Guitar'
            itemName={`${guitar.brand} ${guitar.name}`}
            parts={getGuitarScrapYield(item, guitar)}
            salvaged={getSalvageableMod(item, "guitar")}
            scrapped={getScrappedMods(item, "guitar")}
            onConfirm={handleConfirmScrap}
            onCancel={closeScrapDialog}
            isLoading={isScrapping}
          />
        ) : null;
      })()}

      <BulkSellConfirmDialog
        isOpen={isBulkSellOpen}
        items={duplicates.items}
        fameReward={duplicates.fame}
        onConfirm={handleConfirmBulkSell}
        onCancel={() => setIsBulkSellOpen(false)}
        isLoading={isSellingBulk}
      />

      <EquipTargetDialog
        isOpen={equipItem !== null}
        itemName={
          equipItem
            ? `${GUITARS_BY_ID.get(equipItem.guitarId)?.brand ?? ""} ${GUITARS_BY_ID.get(equipItem.guitarId)?.name ?? ""}`
            : ""
        }
        itemId={equipItem?.id ?? ""}
        isEquipped={data.equippedItemId === equipItem?.id}
        rigSlots={rig.guitarSlots}
        onSelect={(target) => {
          if (equipItem) handleEquipTo(equipItem, target);
          setEquipItem(null);
        }}
        onRemove={(target) => {
          if (equipItem) handleRemoveFrom(equipItem, target);
          setEquipItem(null);
        }}
        onClose={() => setEquipItem(null)}
      />
    </>
  );
};
