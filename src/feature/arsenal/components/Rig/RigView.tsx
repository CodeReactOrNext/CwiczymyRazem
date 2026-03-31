import { useState } from "react";
import type { ArsenalUserData, RigSetup } from "../../types/arsenal.types";
import { GUITARS_BY_ID } from "../../data/guitarDefinitions";
import { useUpdateRig } from "../../hooks/useUpdateRig";
import { useUpdatePedalboard } from "../../hooks/useUpdatePedalboard";
import { GuitarSlot } from "./GuitarSlot";
import { GuitarPickerModal } from "./GuitarPickerModal";
import { PedalboardView } from "./PedalboardView";

interface RigViewProps {
  data: ArsenalUserData;
}

export const RigView = ({ data }: RigViewProps) => {
  const { mutate: saveRig } = useUpdateRig();
  const { mutate: savePedalboard } = useUpdatePedalboard();
  const [pickerSlot, setPickerSlot] = useState<number | null>(null);

  const rig = data.rig;

  const getSelectedGuitarMeta = (slots: RigSetup["guitarSlots"]) => {
    const slot0ItemId = slots[0];
    if (!slot0ItemId) return { imageId: null };
    const inventoryItem = data.inventory.find((item) => item.id === slot0ItemId);
    if (!inventoryItem) return { imageId: null };
    const guitarDef = GUITARS_BY_ID.get(inventoryItem.guitarId);
    return {
      imageId: guitarDef?.imageId ?? null,
      year: inventoryItem.year,
      country: inventoryItem.country,
    };
  };

  const handleGuitarSelect = (itemId: string | null) => {
    if (pickerSlot === null) return;
    const newSlots = [...rig.guitarSlots] as RigSetup["guitarSlots"];
    newSlots[pickerSlot] = itemId;
    const meta = getSelectedGuitarMeta(newSlots);
    saveRig({ rig: { ...rig, guitarSlots: newSlots }, selectedGuitar: meta.imageId, selectedGuitarYear: meta.year, selectedGuitarCountry: meta.country });
  };

  const handleGuitarRemove = (slotIndex: number) => {
    const newSlots = [...rig.guitarSlots] as RigSetup["guitarSlots"];
    newSlots[slotIndex] = null;
    const meta = getSelectedGuitarMeta(newSlots);
    saveRig({ rig: { ...rig, guitarSlots: newSlots }, selectedGuitar: meta.imageId, selectedGuitarYear: meta.year, selectedGuitarCountry: meta.country });
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Guitars */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-0.5">
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500">Your Rig</p>
          <p className="text-base font-black text-white uppercase tracking-wide">Guitars</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {([0, 1, 2] as const).map((i) => (
            <GuitarSlot
              key={i}
              slotIndex={i}
              itemId={rig.guitarSlots[i]}
              inventory={data.inventory}
              onOpenPicker={setPickerSlot}
              onRemove={handleGuitarRemove}
            />
          ))}
        </div>
      </div>

      {/* Pedalboard */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-0.5">
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500">Effects</p>
          <p className="text-base font-black text-white uppercase tracking-wide">Pedalboard</p>
        </div>
        <PedalboardView data={data} onUpdateItems={savePedalboard} />
      </div>

      {pickerSlot !== null && (
        <GuitarPickerModal
          inventory={data.inventory}
          occupiedItemIds={rig.guitarSlots}
          slotIndex={pickerSlot}
          currentItemId={rig.guitarSlots[pickerSlot]}
          onSelect={handleGuitarSelect}
          onClose={() => setPickerSlot(null)}
        />
      )}
    </div>
  );
};
