import { ScrollArea } from "assets/components/ui/scroll-area";
import { useEquipGuitar } from "feature/arsenal/hooks/useEquipGuitar";
import { clearNewFlags } from "feature/arsenal/services/arsenal.service";
import { useQueryClient } from "@tanstack/react-query";
import { PackageOpen } from "lucide-react";
import { useEffect } from "react";
import { ARSENAL_QUERY_KEY } from "feature/arsenal/hooks/useArsenalData";
import type { ArsenalUserData } from "../../types/arsenal.types";
import { GuitarCard } from "./GuitarCard";

interface GuitarInventoryProps {
  data: ArsenalUserData;
}

export const GuitarInventory = ({ data }: GuitarInventoryProps) => {
  const { mutate: equip, isPending: isEquipping } = useEquipGuitar();
  const queryClient = useQueryClient();

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

  // Group by guitarId to show count per guitar, but keep the latest item for display
  const groupedMap = new Map<
    number | string,
    { item: typeof data.inventory[0]; count: number }
  >();
  for (const item of data.inventory) {
    const existing = groupedMap.get(item.guitarId);
    if (!existing || item.acquiredAt > existing.item.acquiredAt) {
      groupedMap.set(item.guitarId, {
        item,
        count: (existing?.count || 0) + 1,
      });
    } else {
      groupedMap.set(item.guitarId, {
        item: existing.item,
        count: existing.count + 1,
      });
    }
  }

  const grouped = Array.from(groupedMap.values()).sort(
    (a, b) => b.item.acquiredAt - a.item.acquiredAt
  );

  return (
    <ScrollArea className="h-[600px] w-full">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-1">
        {grouped.map(({ item, count }) => (
          <GuitarCard
            key={item.guitarId}
            item={item}
            count={count}
            isEquipped={data.equippedGuitarId === item.guitarId}
            onEquip={equip}
            isEquipping={isEquipping}
          />
        ))}
      </div>
    </ScrollArea>
  );
};
