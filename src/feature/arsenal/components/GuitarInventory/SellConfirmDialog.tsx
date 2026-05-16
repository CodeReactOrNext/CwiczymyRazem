import { GUITARS_BY_ID } from "feature/arsenal/data/guitarDefinitions";

const RARITY_FAME_VALUES: Record<string, number> = {
  Common: 1,
  Uncommon: 2,
  Rare: 5,
  Epic: 10,
  Legendary: 20,
  Mythic: 50,
};

interface SellConfirmDialogProps {
  isOpen: boolean;
  guitarId: number | string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}

export const SellConfirmDialog = ({ isOpen, guitarId, onConfirm, onCancel, isLoading }: SellConfirmDialogProps) => {
  if (!isOpen) return null;

  const guitar = GUITARS_BY_ID.get(guitarId);
  if (!guitar) return null;

  const fameReward = RARITY_FAME_VALUES[guitar.rarity] || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-zinc-900 rounded-lg p-6 max-w-sm w-full mx-4 border border-zinc-700">
        <h2 className="text-lg font-bold text-white mb-2">Sell Guitar?</h2>
        <p className="text-sm text-zinc-400 mb-4">{guitar.brand} {guitar.name}</p>

        <div className="bg-zinc-800/50 rounded p-3 mb-6 text-center">
          <p className="text-xs text-zinc-400 mb-1">You will receive</p>
          <div className="flex items-center justify-center gap-2">
            <img src="/images/coin.png" alt="coin" className="h-4 w-4 object-contain" />
            <span className="text-2xl font-bold text-amber-400">{fameReward}</span>
            <span className="text-xs text-zinc-400">Fame Points</span>
          </div>
        </div>

        <div className="flex gap-2">
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
            {isLoading ? "Selling..." : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
};
