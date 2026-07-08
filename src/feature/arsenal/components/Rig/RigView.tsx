import { X } from "lucide-react";
import { useState } from "react";
import { createPortal } from "react-dom";
import { useResponsiveStore } from "store/useResponsiveStore";

import { GUITARS_BY_ID } from "../../data/guitarDefinitions";
import { useUpdatePedalboard } from "../../hooks/useUpdatePedalboard";
import { useUpdateRig } from "../../hooks/useUpdateRig";
import type { ArsenalUserData, RigSetup } from "../../types/arsenal.types";
import { GuitarPickerModal } from "./GuitarPickerModal";
import { GuitarSlot } from "./GuitarSlot";
import { PedalboardView } from "./PedalboardView";

interface RigViewProps {
  data: ArsenalUserData;
}

export interface RigHoverState {
  x: number;
  y: number;
  content: React.ReactNode;
}

export const RigView = ({ data }: RigViewProps) => {
  const { mutate: saveRig } = useUpdateRig();
  const { mutate: savePedalboard } = useUpdatePedalboard();
  const isMobile = useResponsiveStore((state) => state.isMobile);
  const [pickerSlot, setPickerSlot] = useState<number | null>(null);
  const [hover, setHover] = useState<RigHoverState | null>(null);
  // On touch devices there is no hover — tapping an item opens its card in a centered modal instead.
  const [pinnedCard, setPinnedCard] = useState<React.ReactNode | null>(null);

  const handleHover = (e: React.MouseEvent | null, content: React.ReactNode | null) => {
    if (isMobile) return;
    if (!e || !content) return setHover(null);
    setHover({ x: e.clientX, y: e.clientY, content });
  };

  const handleShowCard = isMobile ? (content: React.ReactNode) => setPinnedCard(content) : undefined;

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
    // A guitar instance can occupy only one slot — clear it from any other slot first.
    const newSlots = rig.guitarSlots.map((id) => (itemId && id === itemId ? null : id)) as RigSetup["guitarSlots"];
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
          <p className="text-[9px] font-bold capitalize tracking-[0.2em] text-zinc-500">Instruments</p>
          <p className="text-base font-black text-white capitalize tracking-wide">Guitars</p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {([0, 1, 2] as const).map((slotIndex) => (
            <GuitarSlot
              key={slotIndex}
              slotIndex={slotIndex}
              itemId={rig.guitarSlots[slotIndex]}
              inventory={data.inventory}
              onOpenPicker={setPickerSlot}
              onRemove={handleGuitarRemove}
              onHover={handleHover}
              onShowCard={handleShowCard}
            />
          ))}
        </div>
      </div>

      {/* Pedalboard */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-0.5">
          <p className="text-[9px] font-bold capitalize tracking-[0.2em] text-zinc-500">Effects</p>
          <p className="text-base font-black text-white capitalize tracking-wide">Pedalboard</p>
        </div>
        <PedalboardView data={data} onUpdateItems={savePedalboard} onHover={handleHover} onShowCard={handleShowCard} />
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

      {hover && typeof document !== "undefined" &&
        createPortal(
          <div
            className="pointer-events-none fixed z-[9999]"
            style={{ left: hover.x + 16, top: hover.y - 8, width: 250 }}
          >
            {hover.content}
          </div>,
          document.body
        )}

      {pinnedCard && typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
            onClick={() => setPinnedCard(null)}
          >
            <div
              className="relative w-full max-w-[320px]"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setPinnedCard(null)}
                aria-label="Close"
                className="absolute -right-2 -top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-zinc-600 bg-zinc-900 text-zinc-300 shadow-lg hover:text-white"
              >
                <X size={15} />
              </button>
              {pinnedCard}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
