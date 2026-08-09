interface SellConfirmDialogProps {
  isOpen: boolean;
  itemType: "Guitar" | "Effect";
  itemName: string;
  fameReward: number;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}

export const SellConfirmDialog = ({
  isOpen,
  itemType,
  itemName,
  fameReward,
  onConfirm,
  onCancel,
  isLoading,
}: SellConfirmDialogProps) => {
  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm'>
      <div className='mx-4 w-full max-w-sm rounded-lg border border-zinc-700 bg-zinc-900 p-6'>
        <h2 className='mb-2 text-lg font-bold text-white'>Sell {itemType}?</h2>
        <p className='mb-4 text-sm text-zinc-400'>{itemName}</p>

        <div className='mb-6 rounded bg-zinc-800/50 p-3 text-center'>
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

        <div className='flex gap-2'>
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
            {isLoading ? "Selling..." : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
};
