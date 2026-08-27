import { useState } from "react";

import { MARKETPLACE_LISTING_FEE } from "../../types/marketplace.types";

interface ListItemDialogProps {
  isOpen: boolean;
  itemType: "Guitar" | "Effect" | "Mod";
  itemName: string;
  /** Price floor — the normal system sell value of this instance. */
  minPrice: number;
  /** Seller's current Fame balance — used to validate the listing fee. */
  currentFame: number;
  onConfirm: (price: number) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export const ListItemDialog = ({
  isOpen,
  itemType,
  itemName,
  minPrice,
  currentFame,
  onConfirm,
  onCancel,
  isLoading,
}: ListItemDialogProps) => {
  const [price, setPrice] = useState<string>(String(minPrice));
  // Reset the field to the floor each time the dialog (re)opens — render-phase
  // pattern instead of an effect (avoids a cascading-render setState in useEffect).
  const [wasOpen, setWasOpen] = useState(false);
  if (isOpen && !wasOpen) {
    setWasOpen(true);
    setPrice(String(minPrice));
  } else if (!isOpen && wasOpen) {
    setWasOpen(false);
  }

  if (!isOpen) return null;

  const parsed = Number(price);
  const isValidNumber = Number.isInteger(parsed) && parsed > 0;
  const belowMin = isValidNumber && parsed < minPrice;
  const cantAffordFee = currentFame < MARKETPLACE_LISTING_FEE;
  const canConfirm = isValidNumber && !belowMin && !cantAffordFee && !isLoading;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm'>
      <div className='mx-4 w-full max-w-sm rounded-lg border border-zinc-700 bg-zinc-900 p-6'>
        <h2 className='mb-2 text-lg font-bold text-white'>
          List {itemType} on Market
        </h2>
        <p className='mb-4 text-sm text-zinc-400'>{itemName}</p>

        <label
          className='mb-1.5 block text-xs text-zinc-400'
          htmlFor='market-price'>
          Your price
        </label>
        <div className='mb-1.5 flex items-center gap-2'>
          <img
            src='/images/coin.png'
            alt='coin'
            className='h-4 w-4 object-contain'
          />
          <input
            id='market-price'
            type='number'
            min={minPrice}
            step={1}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className='flex-1 rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white outline-none focus:border-amber-500/60'
          />
        </div>
        <p
          className={`mb-4 text-xs ${belowMin ? "text-red-400" : "text-zinc-500"}`}>
          Minimum: {minPrice} Fame (the normal sell value)
        </p>

        {itemType === "Mod" && (
          <p className='-mt-2 mb-4 text-xs leading-relaxed text-zinc-500'>
            The minimum is only what the bin pays. Nobody can build a mod, so
            price it against what the Trader charges for one.
          </p>
        )}

        <div className='mb-6 flex items-center justify-between rounded bg-zinc-800/50 p-3 text-sm'>
          <span className='text-zinc-400'>Listing fee</span>
          <span className='flex items-center gap-1.5 font-bold text-amber-400'>
            <img
              src='/images/coin.png'
              alt='coin'
              className='h-3.5 w-3.5 object-contain'
            />
            {MARKETPLACE_LISTING_FEE}
          </span>
        </div>

        {cantAffordFee && (
          <p className='-mt-3 mb-4 text-xs text-red-400'>
            Not enough Fame for the {MARKETPLACE_LISTING_FEE} listing fee.
          </p>
        )}

        <div className='flex gap-2'>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className='flex-1 rounded bg-zinc-700 px-4 py-2 text-sm font-semibold text-white transition-colors disabled:opacity-50 hover:bg-zinc-600'>
            Cancel
          </button>
          <button
            onClick={() => canConfirm && onConfirm(parsed)}
            disabled={!canConfirm}
            className='flex-1 rounded bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-40 hover:bg-amber-700'>
            {isLoading ? "Listing..." : "List item"}
          </button>
        </div>
      </div>
    </div>
  );
};
