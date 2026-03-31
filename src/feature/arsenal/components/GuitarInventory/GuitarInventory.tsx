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

  const sorted = [...data.inventory].sort((a, b) => b.acquiredAt - a.acquiredAt);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {sorted.map((item) => (
        <GuitarCard
          key={item.id}
          item={item}
          isEquipped={data.equippedGuitarId === item.guitarId}
          onEquip={(guitarId, year, country) => equip({ guitarId, year, country })}
          isEquipping={isEquipping}
        />
      ))}
    </div>
  );
};
