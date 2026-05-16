import { useQueryClient } from "@tanstack/react-query";
import { ARSENAL_QUERY_KEY } from "feature/arsenal/hooks/useArsenalData";
import { useEquipGuitar } from "feature/arsenal/hooks/useEquipGuitar";
import { useSellGuitar } from "feature/arsenal/hooks/useSellGuitar";
import { clearNewFlags } from "feature/arsenal/services/arsenal.service";
import { PackageOpen } from "lucide-react";
import { useState, useEffect } from "react";

import type { ArsenalUserData } from "../../types/arsenal.types";
import { SellConfirmDialog } from "./SellConfirmDialog";
import { GuitarCard } from "./GuitarCard";

interface GuitarInventoryProps {
  data: ArsenalUserData;
}

export const GuitarInventory = ({ data }: GuitarInventoryProps) => {
  const { mutate: equip, isPending: isEquipping } = useEquipGuitar();
  const { mutate: sell, isPending: isSelling } = useSellGuitar();
  const queryClient = useQueryClient();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedGuitarId, setSelectedGuitarId] = useState<number | string | null>(null);

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
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {sorted.map((item) => (
          <GuitarCard
            key={item.id}
            item={item}
            isEquipped={data.equippedGuitarId === item.guitarId}
            onEquip={(guitarId, year, country) => equip({ guitarId, year, country })}
            isEquipping={isEquipping}
            onSellClick={handleSellClick}
            isSelling={isSelling}
          />
        ))}
      </div>

      <SellConfirmDialog
        isOpen={isDialogOpen}
        guitarId={selectedGuitarId || 0}
        onConfirm={handleConfirmSell}
        onCancel={() => {
          setIsDialogOpen(false);
          setSelectedItemId(null);
          setSelectedGuitarId(null);
        }}
        isLoading={isSelling}
      />
    </>
  );
};
