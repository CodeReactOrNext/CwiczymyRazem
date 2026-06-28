import { Check, Guitar, User } from "lucide-react";

import type { EquipTarget } from "./GuitarCard";

interface EquipTargetDialogProps {
  isOpen: boolean;
  itemName: string;
  itemId: string;
  isEquipped: boolean;
  rigSlots: (string | null)[];
  onSelect: (target: EquipTarget) => void;
  onClose: () => void;
}

export const EquipTargetDialog = ({
  isOpen,
  itemName,
  itemId,
  isEquipped,
  rigSlots,
  onSelect,
  onClose,
}: EquipTargetDialogProps) => {
  if (!isOpen) return null;

  const options: { target: EquipTarget; label: string; desc: string; active: boolean; taken: boolean }[] = [
    { target: "profile", label: "Profile guitar", desc: "Shown on your avatar", active: isEquipped, taken: false },
    { target: 0, label: "Rig slot 1", desc: "Place in your rig", active: rigSlots[0] === itemId, taken: !!rigSlots[0] && rigSlots[0] !== itemId },
    { target: 1, label: "Rig slot 2", desc: "Place in your rig", active: rigSlots[1] === itemId, taken: !!rigSlots[1] && rigSlots[1] !== itemId },
    { target: 2, label: "Rig slot 3", desc: "Place in your rig", active: rigSlots[2] === itemId, taken: !!rigSlots[2] && rigSlots[2] !== itemId },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="mx-4 w-full max-w-sm rounded-lg border border-zinc-700 bg-zinc-900 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-1 text-lg font-bold text-white">Equip guitar</h2>
        <p className="mb-4 truncate text-sm text-zinc-400">{itemName}</p>

        <div className="flex flex-col gap-2">
          {options.map((o) => (
            <button
              key={String(o.target)}
              onClick={() => onSelect(o.target)}
              className="flex items-center justify-between gap-3 rounded-md border border-zinc-700 bg-zinc-800/50 px-4 py-3 text-left transition-colors hover:border-zinc-600 hover:bg-zinc-800"
            >
              <span className="flex items-center gap-3">
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-zinc-700/60 text-zinc-300">
                  {o.target === "profile" ? <User size={15} /> : <Guitar size={15} />}
                </span>
                <span className="flex flex-col">
                  <span className="text-sm font-semibold text-white">{o.label}</span>
                  <span className="text-[11px] text-zinc-500">{o.taken ? "Occupied — will replace" : o.desc}</span>
                </span>
              </span>
              {o.active && <Check size={16} strokeWidth={3} className="text-amber-400" />}
            </button>
          ))}
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full rounded bg-zinc-700 py-2 text-sm font-semibold text-white transition-colors hover:bg-zinc-600"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
