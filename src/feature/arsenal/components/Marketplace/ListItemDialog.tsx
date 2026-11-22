import { Input } from "assets/components/ui/input";
import { ConfirmDialog } from "components/ConfirmDialog/ConfirmDialog";
import { useTranslation } from "hooks/useTranslation";
import { useState } from "react";

import { MARKETPLACE_LISTING_FEE } from "../../types/marketplace.types";

interface ListItemDialogProps {
  isOpen: boolean;
  itemType: "Guitar" | "Effect" | "Mod" | "Part";
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
  const { t } = useTranslation("arsenal");
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

  const parsed = Number(price);
  const isValidNumber = Number.isInteger(parsed) && parsed > 0;
  const belowMin = isValidNumber && parsed < minPrice;
  const cantAffordFee = currentFame < MARKETPLACE_LISTING_FEE;
  const canConfirm = isValidNumber && !belowMin && !cantAffordFee && !isLoading;

  return (
    <ConfirmDialog
      open={isOpen}
      onOpenChange={(open) => !open && onCancel()}
      title={t(`market.list_title.${itemType}`)}
      description={itemName}
      cancelLabel={t("common.cancel")}
      confirmLabel={isLoading ? t("market.listing") : t("market.list_item")}
      onConfirm={() => {
        if (canConfirm) onConfirm(parsed);
      }}
      loading={isLoading}
      confirmDisabled={!canConfirm}>
      <div className='flex flex-col gap-4'>
        <div className='flex flex-col gap-1.5'>
          <label className='block text-xs text-zinc-400' htmlFor='market-price'>
            {t("market.your_price")}
          </label>
          <div className='flex items-center gap-2'>
            <img
              src='/images/tokens/coin.png'
              alt='coin'
              className='h-4 w-4 object-contain'
            />
            <Input
              id='market-price'
              type='number'
              min={minPrice}
              step={1}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
          <p className={`text-xs ${belowMin ? "text-red-400" : "text-zinc-500"}`}>
            {t("market.minimum", { price: minPrice })}
          </p>
          {itemType === "Mod" && (
            <p className='text-xs leading-relaxed text-zinc-500'>
              {t("market.mod_price_hint")}
            </p>
          )}
        </div>

        <div className='flex flex-col gap-1.5'>
          <div className='flex items-center justify-between text-sm'>
            <span className='text-zinc-400'>{t("market.listing_fee")}</span>
            <span className='flex items-center gap-1.5 font-bold text-amber-400'>
              <img
                src='/images/tokens/coin.png'
                alt='coin'
                className='h-3.5 w-3.5 object-contain'
              />
              {MARKETPLACE_LISTING_FEE}
            </span>
          </div>
          {cantAffordFee && (
            <p className='text-xs text-red-400'>
              {t("market.fee_short", { fee: MARKETPLACE_LISTING_FEE })}
            </p>
          )}
        </div>
      </div>
    </ConfirmDialog>
  );
};
