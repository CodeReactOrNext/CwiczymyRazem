import { useState } from "react";

import { MARKETPLACE_LISTING_FEE } from "../../types/marketplace.types";

interface ListItemDialogProps {
  isOpen: boolean;
  itemType: "Guitar" | "Effect";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-zinc-900 rounded-lg p-6 max-w-sm w-full mx-4 border border-zinc-700">
        <h2 className="text-lg font-bold text-white mb-2">List {itemType} on Market</h2>
        <p className="text-sm text-zinc-400 mb-4">{itemName}</p>

        <label className="block text-xs text-zinc-400 mb-1.5" htmlFor="market-price">
          Your price
        </label>
        <div className="flex items-center gap-2 mb-1.5">
          <img src="/images/coin.png" alt="coin" className="h-4 w-4 object-contain" />
          <input
            id="market-price"
            type="number"
            min={minPrice}
            step={1}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="flex-1 rounded bg-zinc-800 border border-zinc-700 px-3 py-2 text-white text-sm outline-none focus:border-amber-500/60"
          />
        </div>
        <p className={`text-xs mb-4 ${belowMin ? "text-red-400" : "text-zinc-500"}`}>
          Minimum: {minPrice} Fame (the normal sell value)
        </p>

        <div className="bg-zinc-800/50 rounded p-3 mb-6 flex items-center justify-between text-sm">
          <span className="text-zinc-400">Listing fee</span>
          <span className="flex items-center gap-1.5 font-bold text-amber-400">
            <img src="/images/coin.png" alt="coin" className="h-3.5 w-3.5 object-contain" />
            {MARKETPLACE_LISTING_FEE}
          </span>
        </div>

        {cantAffordFee && (
          <p className="text-xs text-red-400 mb-4 -mt-3">
            Not enough Fame for the {MARKETPLACE_LISTING_FEE} listing fee.
          </p>
        )}

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 py-2 px-4 rounded bg-zinc-700 hover:bg-zinc-600 text-white font-semibold text-sm transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => canConfirm && onConfirm(parsed)}
            disabled={!canConfirm}
            className="flex-1 py-2 px-4 rounded bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isLoading ? "Listing..." : "List item"}
          </button>
        </div>
      </div>
    </div>
  );
};
