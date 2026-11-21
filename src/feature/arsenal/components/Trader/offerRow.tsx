import { cn } from "assets/lib/utils";
import { useTranslation } from "hooks/useTranslation";
import type { ReactNode } from "react";

import { GainCount, PurchaseStamp } from "./purchaseMotion";

/**
 * The price list's columns — shared by the header and every row, so the
 * figures line up down the page the way a counter's price board does.
 * Below `xl` a row folds into two lines and the header is hidden.
 *
 * There is no price column: the price rides on the Buy key, once, and the keys
 * sit in one column of their own.
 */
export const PART_ROW_COLS = "xl:grid-cols-[minmax(0,1fr)_5rem_4rem_auto]";

/**
 * The row itself — one shared surface, dimmed once the slot is taken. Relative
 * and clipped so a purchase can sweep its colour across it.
 */
export const offerRowClass = (soldOut: boolean) =>
  cn(
    "relative grid grid-cols-1 items-center overflow-hidden gap-x-6 gap-y-3 rounded-lg bg-zinc-800/30 px-4 py-3.5 transition-colors",
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
  <div className='flex min-w-0 items-center gap-3.5'>
    {plate}
    <div className='flex min-w-0 flex-col gap-0.5'>
      <span className='truncate text-sm font-semibold text-zinc-100'>
        {name}
      </span>
      <span className='truncate text-xs text-zinc-400'>{detail}</span>
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
 * The two figures of a row. On the wide list each takes its own column under
 * the header that names it; on a narrow row they are one quiet line of words.
 *
 * What is left is only said for a slot that holds more than one piece — on a
 * one-off, the row being there at all is the answer.
 */
export const OfferRowStats = ({
  owned,
  accent,
  remaining,
  stock,
}: OfferRowStatsProps) => {
  const { t } = useTranslation("arsenal");
  const showLeft = stock > 1 && remaining > 0;

  return (
    <div className='flex gap-4 text-xs tabular-nums text-zinc-400 xl:contents'>
      <span className='xl:text-sm'>
        <GainCount
          value={owned}
          color={accent}
          className={cn(
            "font-semibold",
            owned > 0 ? "text-zinc-300" : "text-zinc-500",
          )}
        />
        <span className='xl:hidden'> {t("trader.in_stash")}</span>
      </span>
      <span className='xl:text-sm'>
        {showLeft && (
          <>
            <span className='font-semibold text-zinc-300'>{remaining}</span>
            <span className='xl:hidden'> {t("trader.left")}</span>
          </>
        )}
      </span>
    </div>
  );
};

/** The controls' cell — buttons right-aligned so every Buy sits in one column. */
export const OfferRowActions = ({ children }: { children: ReactNode }) => (
  <div className='flex items-center justify-end gap-2'>{children}</div>
);

/**
 * What the piece cost before today's discount, struck through beside the key.
 * The key carries the price being paid; this is the only other figure.
 */
export const WasPrice = ({ price }: { price: number }) => (
  <span className='shrink-0 text-xs tabular-nums text-zinc-500 line-through'>
    {price.toLocaleString()}
  </span>
);

/**
 * One word where the Buy key was, the same width as the key so it sits in the
 * keys' column. Stamped on when the slot was emptied here rather than on load.
 */
export const Taken = ({ slam = false }: { slam?: boolean }) => {
  const { t } = useTranslation("arsenal");

  return (
    <PurchaseStamp
      slam={slam}
      className='text-xs text-zinc-500 sm:w-36 sm:text-center'>
      {t("trader.taken")}
    </PurchaseStamp>
  );
};

/** Holds the picker's place on a one-piece slot, so the Buy keys line up. */
export const PickerSpacer = () => (
  <span aria-hidden className='hidden w-40 xl:block' />
);
