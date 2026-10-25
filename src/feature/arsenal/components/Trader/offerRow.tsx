import { cn } from "assets/lib/utils";
import { useTranslation } from "hooks/useTranslation";
import type { ReactNode } from "react";

import { GainCount, PurchaseStamp } from "./purchaseMotion";

/**
 * The price list's columns — shared by the header and every row, so the
 * figures line up down the page the way a counter's price board does.
 * Below `xl` a row folds into two lines and the header is hidden.
 */
export const PART_ROW_COLS =
  "xl:grid-cols-[minmax(0,1fr)_5.5rem_5.5rem_7.5rem_auto]";

/**
 * The row itself — one shared surface, dimmed once the slot is taken. Relative
 * and clipped so a purchase can sweep its colour across it.
 */
export const offerRowClass = (soldOut: boolean) =>
  cn(
    "relative grid grid-cols-[minmax(0,1fr)_auto] items-center overflow-hidden gap-x-4 gap-y-3 rounded-lg bg-zinc-800/30 px-4 py-3 transition-colors xl:gap-x-6",
    PART_ROW_COLS,
    soldOut ? "opacity-50" : "hover:bg-zinc-800/50",
  );

interface OfferRowIdentityProps {
  plate: ReactNode;
  name: string;
  detail: ReactNode;
}

/** What it is: the plate, the name, and one line under it. */
export const OfferRowIdentity = ({
  plate,
  name,
  detail,
}: OfferRowIdentityProps) => (
  <div className='order-1 flex min-w-0 items-center gap-3 xl:order-none'>
    {plate}
    <div className='flex min-w-0 flex-col gap-0.5'>
      <span className='truncate text-sm font-semibold text-zinc-100'>
        {name}
      </span>
      <span className='truncate text-xs font-medium'>{detail}</span>
    </div>
  </div>
);

interface OfferRowStatsProps {
  owned: number;
  /** The colour a purchase floats off the holding in. */
  accent?: string;
  remaining: number;
  stock: number;
}

/**
 * One line of two figures on a narrow row; on the wide list the wrapper
 * dissolves and each figure takes its own column, where the header names it
 * and the trailing words drop.
 */
export const OfferRowStats = ({
  owned,
  accent,
  remaining,
  stock,
}: OfferRowStatsProps) => {
  const { t } = useTranslation("arsenal");

  return (
  <div className='order-3 col-span-2 flex gap-4 text-xs tabular-nums text-zinc-400 sm:col-span-1 xl:contents'>
    <span className='xl:text-sm'>
      <GainCount
        value={owned}
        color={accent}
        className='font-semibold text-zinc-200'
      />
      <span className='xl:hidden'> {t("trader.in_stash")}</span>
    </span>
    <span className='xl:text-sm'>
      <span
        className={cn(
          "font-semibold",
          remaining === 0 ? "text-zinc-500" : "text-zinc-200",
        )}>
        {remaining}
      </span>
      <span className='text-zinc-500'>/{stock}</span>
      <span className='xl:hidden'> {t("trader.left")}</span>
    </span>
  </div>
  );
};

interface OfferRowPriceProps {
  unitPrice: number;
  basePrice?: number;
  discountPct?: number;
}

export const OfferRowPrice = ({
  unitPrice,
  basePrice,
  discountPct = 0,
}: OfferRowPriceProps) => (
  <div className='order-2 flex items-baseline justify-end gap-1.5 tabular-nums xl:order-none xl:justify-start'>
    <img
      src='/images/coin.png'
      alt=''
      aria-hidden
      className='h-5 w-5 self-center object-contain'
    />
    <span className='text-base font-bold text-amber-400'>
      {unitPrice.toLocaleString()}
    </span>
    {discountPct > 0 && basePrice != null && (
      <>
        <span className='text-xs text-zinc-500 line-through'>
          {basePrice.toLocaleString()}
        </span>
        <span className='text-xs font-semibold text-emerald-400'>
          −{discountPct}%
        </span>
      </>
    )}
  </div>
);

/** The controls' cell — buttons right-aligned so every Buy sits in one column. */
export const OfferRowActions = ({ children }: { children: ReactNode }) => (
  <div className='order-4 col-span-2 flex items-center justify-end gap-2 sm:col-span-1 xl:order-none'>
    {children}
  </div>
);

/**
 * Same width as picker + All + Buy, so the line sits where the controls were.
 * Stamped on when the slot was emptied here rather than on load.
 */
export const TakenForToday = ({ slam = false }: { slam?: boolean }) => {
  const { t } = useTranslation("arsenal");

  return (
  <PurchaseStamp
    slam={slam}
    className='text-xs text-zinc-500 sm:w-[20.5rem] sm:text-center'>
    {t("trader.taken_for_today")}
  </PurchaseStamp>
  );
};

/** Holds the picker's place on a one-piece slot, so the Buy buttons line up. */
export const PickerSpacer = () => (
  <span aria-hidden className='hidden w-40 sm:block' />
);
