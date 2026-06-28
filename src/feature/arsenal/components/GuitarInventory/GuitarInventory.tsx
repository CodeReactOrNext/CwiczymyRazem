import { useQueryClient } from "@tanstack/react-query";
import { GUITAR_DEFINITIONS, GUITARS_BY_ID } from "feature/arsenal/data/guitarDefinitions";
import { getItemValue } from "feature/arsenal/data/itemStats";
import { ARSENAL_QUERY_KEY } from "feature/arsenal/hooks/useArsenalData";
import { useEquipGuitar } from "feature/arsenal/hooks/useEquipGuitar";
import { useSellGuitar } from "feature/arsenal/hooks/useSellGuitar";
import { useUpdateRig } from "feature/arsenal/hooks/useUpdateRig";
import { clearNewFlags } from "feature/arsenal/services/arsenal.service";
import { PackageOpen } from "lucide-react";
import { useEffect,useState } from "react";

import type { ArsenalUserData, GuitarRarity, InventoryItem, RigSetup } from "../../types/arsenal.types";
import { DEFAULT_RIG } from "../../types/arsenal.types";
import { RARITY_ORDER, RaritySectionHeader } from "../RarityProgress";
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
  const { mutate: sell, isPending: isSelling } = useSellGuitar();
  const { mutate: saveRig } = useUpdateRig();
  const queryClient = useQueryClient();

  const rig: RigSetup = data.rig ?? DEFAULT_RIG;

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

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedGuitarId, setSelectedGuitarId] = useState<number | string | null>(null);
  const [equipItem, setEquipItem] = useState<InventoryItem | null>(null);

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

  // Group inventory items per rarity (newest first within a group),
  // and count how many of each rarity exist / are owned.
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
    itemsByRarity[rarity].sort((a, b) => b.acquiredAt - a.acquiredAt);
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

  return (
    <>
      <div className="mb-6 flex items-baseline gap-1.5">
        <span className="text-lg font-black text-white">{uniqueOwnedCount}</span>
        <span className="text-sm font-bold text-zinc-500">/ {totalGuitarsCount}</span>
        <span className="ml-1 text-xs font-medium text-zinc-500">guitars collected</span>
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
                  <GuitarCard
                    key={item.id}
                    item={item}
                    isEquipped={data.equippedItemId === item.id}
                    rigSlot={(() => { const i = rig.guitarSlots.indexOf(item.id); return i >= 0 ? i : null; })()}
                    onEquipClick={() => setEquipItem(item)}
                    isEquipping={isEquipping}
                    onSellClick={handleSellClick}
                    isSelling={isSelling}
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
        onClose={() => setEquipItem(null)}
      />
    </>
  );
};
