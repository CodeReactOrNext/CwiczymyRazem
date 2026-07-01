import { useQueryClient } from "@tanstack/react-query";
import { GUITAR_DEFINITIONS, GUITARS_BY_ID } from "feature/arsenal/data/guitarDefinitions";
import { getItemLevel, getItemValue } from "feature/arsenal/data/itemStats";
import { ARSENAL_QUERY_KEY } from "feature/arsenal/hooks/useArsenalData";
import { useEquipGuitar } from "feature/arsenal/hooks/useEquipGuitar";
import { useListItem } from "feature/arsenal/hooks/useMarketplace";
import { useSellGuitar } from "feature/arsenal/hooks/useSellGuitar";
import { useSellGuitarsBulk } from "feature/arsenal/hooks/useSellGuitarsBulk";
import { useUnequipGuitar } from "feature/arsenal/hooks/useUnequipGuitar";
import { useUpdateRig } from "feature/arsenal/hooks/useUpdateRig";
import { clearNewFlags } from "feature/arsenal/services/arsenal.service";
import { selectCurrentUserStats } from "feature/user/store/userSlice";
import { Layers,PackageOpen } from "lucide-react";
import { useEffect,useMemo,useState } from "react";
import { useAppSelector } from "store/hooks";

import type { ArsenalUserData, GuitarRarity, InventoryItem, RigSetup } from "../../types/arsenal.types";
import { DEFAULT_RIG } from "../../types/arsenal.types";
import { ListItemDialog } from "../Marketplace/ListItemDialog";
import { RARITY_ORDER, RaritySectionHeader } from "../RarityProgress";
import type { BulkSellItem } from "./BulkSellConfirmDialog";
import { BulkSellConfirmDialog } from "./BulkSellConfirmDialog";
import { EquipTargetDialog } from "./EquipTargetDialog";
import type { EquipTarget } from "./GuitarCard";
import { GuitarCard } from "./GuitarCard";
import { SellConfirmDialog } from "./SellConfirmDialog";

const GUITAR_FAME_VALUES: Record<string, number> = {
  Common: 15, Uncommon: 30, Rare: 75, Epic: 150, Legendary: 300, Mythic: 750,
};

interface GuitarInventoryProps {
  data: ArsenalUserData;
}

export const GuitarInventory = ({ data }: GuitarInventoryProps) => {
  const { mutate: equip, isPending: isEquipping } = useEquipGuitar();
  const { mutate: unequip } = useUnequipGuitar();
  const { mutate: sell, isPending: isSelling } = useSellGuitar();
  const { mutate: sellBulk, isPending: isSellingBulk } = useSellGuitarsBulk();
  const { mutate: listOnMarket, isPending: isListing } = useListItem();
  const { mutate: saveRig } = useUpdateRig();
  const queryClient = useQueryClient();
  const userStats = useAppSelector(selectCurrentUserStats);
  const currentFame = userStats?.fame || 0;

  const rig: RigSetup = data.rig ?? DEFAULT_RIG;

  // Sellable duplicates: for every guitar owned more than once, keep the
  // highest-level instance and mark the lower-level copies for bulk selling.
  // The equipped guitar and any rig-slotted guitar are never sold.
  const { duplicateIds, duplicateItems, duplicateFame } = useMemo(() => {
    const byGuitar = new Map<number | string, InventoryItem[]>();
    for (const item of data.inventory) {
      const arr = byGuitar.get(item.guitarId);
      if (arr) arr.push(item);
      else byGuitar.set(item.guitarId, [item]);
    }

    const ids: string[] = [];
    const items: BulkSellItem[] = [];
    let fame = 0;
    for (const [guitarId, group] of byGuitar) {
      if (group.length < 2) continue;
      const guitar = GUITARS_BY_ID.get(guitarId);
      if (!guitar) continue;
      // Best copy first (level desc, value as tie-break); keep it, sell the rest.
      const sorted = [...group].sort(
        (a, b) =>
          getItemLevel(b, guitar) - getItemLevel(a, guitar) ||
          getItemValue(b, guitar) - getItemValue(a, guitar)
      );
      for (let i = 1; i < sorted.length; i++) {
        const it = sorted[i];
        if (it.id === data.equippedItemId) continue;
        if (rig.guitarSlots.includes(it.id)) continue;
        const value = getItemValue(it, guitar);
        ids.push(it.id);
        items.push({
          id: it.id,
          name: `${guitar.brand} ${guitar.name}`,
          rarity: guitar.rarity,
          level: getItemLevel(it, guitar),
          value,
        });
        fame += value;
      }
    }
    // Highest-level (most valuable) first so the biggest losses are visible up top.
    items.sort((a, b) => b.level - a.level || b.value - a.value);
    return { duplicateIds: ids, duplicateItems: items, duplicateFame: fame };
  }, [data.inventory, data.equippedItemId, rig.guitarSlots]);

  const handleEquipTo = (item: InventoryItem, target: EquipTarget) => {
    if (target === "profile") {
      equip({ guitarId: item.guitarId, itemId: item.id, year: item.year, country: item.country });
      return;
    }
    // Place into a rig slot without touching the avatar/profile guitar.
    // A guitar instance can occupy only one slot — clear it from any other slot first.
    const newSlots = rig.guitarSlots.map((id) => (id === item.id ? null : id)) as RigSetup["guitarSlots"];
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
  const [selectedGuitarId, setSelectedGuitarId] = useState<number | string | null>(null);
  const [equipItem, setEquipItem] = useState<InventoryItem | null>(null);
  const [isListDialogOpen, setIsListDialogOpen] = useState(false);
  const [listItemId, setListItemId] = useState<string | null>(null);
  const [listGuitarId, setListGuitarId] = useState<number | string | null>(null);
  const [isBulkSellOpen, setIsBulkSellOpen] = useState(false);

  const handleConfirmBulkSell = () => {
    if (duplicateIds.length === 0) return;
    sellBulk(duplicateIds, {
      onSuccess: () => setIsBulkSellOpen(false),
    });
  };

  // Clear "new" flags when user opens collection tab
  useEffect(() => {
    const hasNew = data.inventory.some((item) => item.isNew);
    if (hasNew) {
      clearNewFlags().then(() => {
        queryClient.invalidateQueries({ queryKey: ARSENAL_QUERY_KEY });
      });
    }
  }, []);

  if (data.inventory.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-zinc-500">
        <PackageOpen size={48} className="opacity-30" />
        <p className="text-sm font-medium">Your collection is empty. Open a case to start!</p>
      </div>
    );
  }

  const uniqueOwnedIds = new Set(data.inventory.map((item) => item.guitarId));
  const uniqueOwnedCount = uniqueOwnedIds.size;
  const totalGuitarsCount = GUITAR_DEFINITIONS.length;

  // Group inventory items per rarity (by guitar type, then highest level first
  // within a type), and count how many of each rarity exist / are owned.
  const itemsByRarity = {} as Record<GuitarRarity, typeof data.inventory>;
  const totalByRarity = {} as Record<GuitarRarity, number>;
  const ownedByRarity = {} as Record<GuitarRarity, number>;
  for (const rarity of RARITY_ORDER) {
    itemsByRarity[rarity] = [];
    totalByRarity[rarity] = 0;
    ownedByRarity[rarity] = 0;
  }
  for (const guitar of GUITAR_DEFINITIONS) {
    totalByRarity[guitar.rarity]++;
    if (uniqueOwnedIds.has(guitar.id)) ownedByRarity[guitar.rarity]++;
  }
  for (const item of data.inventory) {
    const rarity = GUITARS_BY_ID.get(item.guitarId)?.rarity ?? "Common";
    itemsByRarity[rarity].push(item);
  }
  for (const rarity of RARITY_ORDER) {
    itemsByRarity[rarity].sort((a, b) => {
      // Keep every copy of the same guitar model together...
      if (a.guitarId !== b.guitarId) {
        return String(a.guitarId).localeCompare(String(b.guitarId), undefined, { numeric: true });
      }
      // ...then highest level first within that model.
      const guitar = GUITARS_BY_ID.get(a.guitarId);
      const levelDiff = guitar ? getItemLevel(b, guitar) - getItemLevel(a, guitar) : 0;
      if (levelDiff !== 0) return levelDiff;
      return b.acquiredAt - a.acquiredAt;
    });
  }

  const handleSellClick = (inventoryItemId: string, guitarId: number | string) => {
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

  const handleListClick = (inventoryItemId: string, guitarId: number | string) => {
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
        { onSuccess: closeListDialog }
      );
    }
  };

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-baseline gap-1.5">
          <span className="text-lg font-black text-white">{uniqueOwnedCount}</span>
          <span className="text-sm font-bold text-zinc-500">/ {totalGuitarsCount}</span>
          <span className="ml-1 text-xs font-medium text-zinc-500">guitars collected</span>
        </div>

        {duplicateIds.length > 0 && (
          <button
            onClick={() => setIsBulkSellOpen(true)}
            disabled={isSellingBulk}
            className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-300 transition-colors hover:bg-red-500/20 disabled:opacity-50"
            title="Sell every lower-level duplicate, keeping the best copy of each guitar"
          >
            <Layers size={14} />
            Sell duplicates ({duplicateIds.length})
          </button>
        )}
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
              <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {items.map((item) => (
                  <GuitarCard
                    key={item.id}
                    item={item}
                    isEquipped={data.equippedItemId === item.id}
                    rigSlot={(() => { const i = rig.guitarSlots.indexOf(item.id); return i >= 0 ? i : null; })()}
                    onEquipClick={() => setEquipItem(item)}
                    isEquipping={isEquipping}
                    onSellClick={handleSellClick}
                    isSelling={isSelling}
                    onListClick={handleListClick}
                    isListing={isListing}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {(() => {
        const guitar = selectedGuitarId != null ? GUITARS_BY_ID.get(selectedGuitarId) : null;
        const selectedItem = selectedItemId
          ? data.inventory.find((i) => i.id === selectedItemId)
          : null;
        return guitar ? (
          <SellConfirmDialog
            isOpen={isDialogOpen}
            itemType="Guitar"
            itemName={`${guitar.brand} ${guitar.name}`}
            fameReward={selectedItem ? getItemValue(selectedItem, guitar) : GUITAR_FAME_VALUES[guitar.rarity] ?? 0}
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
        const guitar = listGuitarId != null ? GUITARS_BY_ID.get(listGuitarId) : null;
        const listItem = listItemId ? data.inventory.find((i) => i.id === listItemId) : null;
        return guitar ? (
          <ListItemDialog
            isOpen={isListDialogOpen}
            itemType="Guitar"
            itemName={`${guitar.brand} ${guitar.name}`}
            minPrice={listItem ? getItemValue(listItem, guitar) : GUITAR_FAME_VALUES[guitar.rarity] ?? 0}
            currentFame={currentFame}
            onConfirm={handleConfirmList}
            onCancel={closeListDialog}
            isLoading={isListing}
          />
        ) : null;
      })()}

      <BulkSellConfirmDialog
        isOpen={isBulkSellOpen}
        items={duplicateItems}
        fameReward={duplicateFame}
        onConfirm={handleConfirmBulkSell}
        onCancel={() => setIsBulkSellOpen(false)}
        isLoading={isSellingBulk}
      />

      <EquipTargetDialog
        isOpen={equipItem !== null}
        itemName={equipItem ? `${GUITARS_BY_ID.get(equipItem.guitarId)?.brand ?? ""} ${GUITARS_BY_ID.get(equipItem.guitarId)?.name ?? ""}` : ""}
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
