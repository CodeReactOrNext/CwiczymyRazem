import type { GuitarRarity } from "../../types/arsenal.types";
import { RARITY_STYLES } from "../RarityBadge";

export interface BulkSellItem {
  id: string;
  name: string;
  rarity: GuitarRarity;
  level: number;
  value: number;
}

interface BulkSellConfirmDialogProps {
  isOpen: boolean;
  items: BulkSellItem[];
  fameReward: number;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}

export const BulkSellConfirmDialog = ({
  isOpen,
  items,
  fameReward,
  onConfirm,
  onCancel,
  isLoading,
}: BulkSellConfirmDialogProps) => {
  if (!isOpen) return null;

  const count = items.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-zinc-900 rounded-lg p-6 max-w-md w-full mx-4 border border-zinc-700 flex flex-col max-h-[85vh]">
        <h2 className="text-lg font-bold text-white mb-2">Sell duplicates?</h2>
        <p className="text-sm text-zinc-400 mb-4">
          This sells <span className="font-semibold text-white">{count}</span> lower-level duplicate
          {count === 1 ? "" : "s"}, keeping the best copy of each guitar. Equipped and rig guitars are
          never sold. This can&apos;t be undone.
        </p>

        <div className="max-h-[45vh] overflow-y-auto -mx-1 px-1 mb-4">
          <ul className="flex flex-col gap-1">
            {items.map((item) => {
              const color = RARITY_STYLES[item.rarity].baseColor;
              return (
                <li
                  key={item.id}
                  className="flex items-center gap-2 rounded bg-zinc-800/50 px-2.5 py-1.5"
                >
                  <span
                    className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-black text-white"
                    style={{ border: `1.5px solid ${color}`, boxShadow: `0 0 6px ${color}55` }}
                    title="Guitar level"
                  >
                    {item.level}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-white">{item.name}</p>
                    <p
                      className="text-[10px] font-medium tracking-wider"
                      style={{ color }}
                    >
                      {item.rarity}
                    </p>
                  </div>
                  <span className="flex flex-shrink-0 items-center gap-1 text-xs font-bold text-amber-400">
                    <img src="/images/coin.png" alt="coin" className="h-3 w-3 object-contain" />
                    {item.value}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="bg-zinc-800/50 rounded p-3 mb-6 text-center flex-shrink-0">
          <p className="text-xs text-zinc-400 mb-1">You will receive</p>
          <div className="flex items-center justify-center gap-2">
            <img src="/images/coin.png" alt="coin" className="h-4 w-4 object-contain" />
            <span className="text-2xl font-bold text-amber-400">{fameReward}</span>
            <span className="text-xs text-zinc-400">Fame Points</span>
          </div>
        </div>

        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 py-2 px-4 rounded bg-zinc-700 hover:bg-zinc-600 text-white font-semibold text-sm transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 py-2 px-4 rounded bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition-colors disabled:opacity-50"
          >
            {isLoading ? "Selling..." : `Sell ${count}`}
          </button>
        </div>
      </div>
    </div>
  );
};
