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
  /** Which owned copies are excluded from the sweep (shown in the warning line). */
  protectedNote?: string;
}

export const BulkSellConfirmDialog = ({
  isOpen,
  items,
  fameReward,
  onConfirm,
  onCancel,
  isLoading,
  protectedNote = "Equipped and rig guitars are never sold.",
}: BulkSellConfirmDialogProps) => {
  if (!isOpen) return null;

  const count = items.length;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm'>
      <div className='mx-4 flex max-h-[85vh] w-full max-w-md flex-col rounded-lg border border-zinc-700 bg-zinc-900 p-6'>
        <h2 className='mb-2 text-lg font-bold text-white'>Sell duplicates?</h2>
        <p className='mb-4 text-sm text-zinc-400'>
          This sells <span className='font-semibold text-white'>{count}</span>{" "}
          lower-level duplicate
          {count === 1 ? "" : "s"}, keeping the best copy of each.{" "}
          {protectedNote} This can&apos;t be undone.
        </p>

        <div className='-mx-1 mb-4 max-h-[45vh] overflow-y-auto px-1'>
          <ul className='flex flex-col gap-1'>
            {items.map((item) => {
              const color = RARITY_STYLES[item.rarity].baseColor;
              return (
                <li
                  key={item.id}
                  className='flex items-center gap-2 rounded bg-zinc-800/50 px-2.5 py-1.5'>
                  <span
                    className='flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-black text-white'
                    style={{
                      border: `1.5px solid ${color}`,
                      boxShadow: `0 0 6px ${color}55`,
                    }}
                    title='Guitar level'>
                    {item.level}
                  </span>
                  <div className='min-w-0 flex-1'>
                    <p className='truncate text-xs font-semibold text-white'>
                      {item.name}
                    </p>
                    <p
                      className='text-[10px] font-medium tracking-wider'
                      style={{ color }}>
                      {item.rarity}
                    </p>
                  </div>
                  <span className='flex flex-shrink-0 items-center gap-1 text-xs font-bold text-amber-400'>
                    <img
                      src='/images/coin.png'
                      alt='coin'
                      className='h-3 w-3 object-contain'
                    />
                    {item.value}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className='mb-6 flex-shrink-0 rounded bg-zinc-800/50 p-3 text-center'>
          <p className='mb-1 text-xs text-zinc-400'>You will receive</p>
          <div className='flex items-center justify-center gap-2'>
            <img
              src='/images/coin.png'
              alt='coin'
              className='h-4 w-4 object-contain'
            />
            <span className='text-2xl font-bold text-amber-400'>
              {fameReward}
            </span>
            <span className='text-xs text-zinc-400'>Fame Points</span>
          </div>
        </div>

        <div className='flex flex-shrink-0 gap-2'>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className='flex-1 rounded bg-zinc-700 px-4 py-2 text-sm font-semibold text-white transition-colors disabled:opacity-50 hover:bg-zinc-600'>
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className='flex-1 rounded bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors disabled:opacity-50 hover:bg-red-700'>
            {isLoading ? "Selling..." : `Sell ${count}`}
          </button>
        </div>
      </div>
    </div>
  );
};
