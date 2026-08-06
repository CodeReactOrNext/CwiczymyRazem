import type { ScrapPart } from "feature/arsenal/types/arsenal.types";
import { countScrapParts } from "feature/arsenal/utils/scrap";

import { ScrapYieldList } from "./ScrapYieldList";

interface ScrapConfirmDialogProps {
  isOpen: boolean;
  itemType: "Guitar" | "Effect";
  itemName: string;
  parts: ScrapPart[];
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}

export const ScrapConfirmDialog = ({
  isOpen,
  itemType,
  itemName,
  parts,
  onConfirm,
  onCancel,
  isLoading,
}: ScrapConfirmDialogProps) => {
  if (!isOpen) return null;

  const total = countScrapParts(parts);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-sm rounded-xl bg-zinc-900 p-6">
        <h2 className="mb-2 text-lg font-bold text-white">Scrap {itemType}?</h2>
        <p className="mb-1 text-sm text-zinc-400">{itemName}</p>
        <p className="mb-5 text-xs text-zinc-500">
          This is permanent — the {itemType.toLowerCase()} is gone for good.
        </p>

        <div className="mb-6 rounded-lg bg-zinc-800/50 p-4">
          <p className="mb-3 text-xs text-zinc-400">
            You will salvage {total} {total === 1 ? "part" : "parts"}
          </p>
          <ScrapYieldList parts={parts} />
        </div>

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 rounded bg-zinc-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-zinc-600 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 rounded bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-700 disabled:opacity-50"
          >
            {isLoading ? "Scrapping..." : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
};
