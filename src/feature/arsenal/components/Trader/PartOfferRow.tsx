import {
  PART_TIER_COLORS,
} from "feature/arsenal/data/partDefinitions";
import { useArsenalLabels } from "feature/arsenal/hooks/useArsenalLabels";
import type { TraderPartOffer } from "feature/arsenal/types/trader.types";
import { useHoldRepeat } from "hooks/useHoldRepeat";
import type { LucideIcon } from "lucide-react";
import { Minus, Plus } from "lucide-react";
import { useState } from "react";

import { BuyButton } from "../BuyButton";
import { PartIcon } from "../Parts/PartIcon";
import { TierPlate } from "../TierPlate";
import {
  OfferRowActions,
  offerRowClass,
  OfferRowIdentity,
  OfferRowPrice,
  OfferRowStats,
  PickerSpacer,
  TakenForToday,
} from "./offerRow";
import { PurchaseSweep, useTakenHere } from "./purchaseMotion";

interface PartOfferRowProps {
  offer: TraderPartOffer;
  /** Pieces this player can still take today. */
  remaining: number;
  /** Pieces of this part and tier already in the player's pile. */
  owned: number;
  currentFame: number;
  onBuy: (qty: number) => void;
  isBuying: boolean;
}

/** Held down, it keeps stepping — and faster — until let go or out of room. */
const PickerButton = ({
  icon: Icon,
  label,
  disabled,
  onStep,
}: {
  icon: LucideIcon;
  label: string;
  disabled: boolean;
  onStep: () => void;
}) => {
  const hold = useHoldRepeat(onStep, disabled);
  return (
    <button
      {...hold}
      disabled={disabled}
      aria-label={label}
      className='flex h-8 w-8 shrink-0 touch-manipulation select-none items-center justify-center rounded-md text-zinc-300 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-30 hover:bg-zinc-100/10 hover:text-white'>
      <Icon size={13} strokeWidth={3} />
    </button>
  );
};

/**
 * One part on the counter, as a line of a price list.
 *
 * The counter used to be a grid of cards, each repeating its own labels —
 * "each", "of 40 left", "You own" — and a stock bar that sat full on almost
 * every one of them. As rows under one header, the column says what a number
 * is, so the row itself carries only the numbers: what it is, how many the
 * player has, how many are left, what one costs, and the controls.
 *
 * Parts sell by the piece, so the controls are a quantity picker: a player
 * with thirty Fame to their name can still walk out with something.
 */
export const PartOfferRow = ({
  offer,
  remaining,
  owned,
  currentFame,
  onBuy,
  isBuying,
}: PartOfferRowProps) => {
  const [picked, setQty] = useState(1);
  const labels = useArsenalLabels();
  const { t } = labels;
  // What is in the field while the player is typing into it — only ever
  // differs from `qty` while they have cleared it to type a new number.
  const [draft, setDraft] = useState<string | null>(null);
  // Clamped on the way out rather than stored clamped: a restock, or a purchase
  // that emptied the slot, must never leave the picker on a quantity that can no
  // longer be bought.
  const clamp = (n: number) => Math.min(Math.max(1, n), Math.max(1, remaining));
  const qty = clamp(picked);
  const step = (delta: number) => setQty((p) => clamp(clamp(p) + delta));

  const affordable = Math.floor(currentFame / offer.unitPrice);
  const total = offer.unitPrice * qty;
  const soldOut = remaining === 0;
  const canAfford = currentFame >= total;
  // The most one press can take: the whole slot, or as much of it as the
  // player's Fame covers — "Max" rather than "All" when Fame is the limit.
  const maxQty = Math.min(affordable, remaining);
  const fameBound = maxQty >= 1 && maxQty < remaining;
  const fillTo = fameBound ? maxQty : remaining;
  const tierColor = PART_TIER_COLORS[offer.tier];
  const takenHere = useTakenHere(!soldOut);

  return (
    <div className={offerRowClass(soldOut)}>
      <PurchaseSweep trigger={owned} color={tierColor} />
      {/* The same lit hollow the stash sockets use, so a part on the counter
          reads as the very object it will become in the pile. */}
      <OfferRowIdentity
        plate={
          <TierPlate color={tierColor} size={44}>
            <PartIcon partId={offer.partId} size={28} />
          </TierPlate>
        }
        name={labels.part(offer.partId)}
        detail={
          <span style={{ color: tierColor }}>{labels.partTier(offer.tier)}</span>
        }
      />

      <OfferRowStats
        owned={owned}
        accent={tierColor}
        remaining={remaining}
        stock={offer.stock}
      />

      <OfferRowPrice
        unitPrice={offer.unitPrice}
        basePrice={offer.basePrice}
        discountPct={offer.discountPct}
      />

      <OfferRowActions>
        {soldOut ? (
          <TakenForToday slam={takenHere} />
        ) : (
          <>
            {remaining > 1 ? (
              <>
                {/* A picker with nothing to pick is just two dead buttons —
                    a slot that only hands over one piece has an empty space
                    here instead, so the Buy buttons still line up. */}
                <span className='flex shrink-0 items-center rounded-lg bg-zinc-900/60 p-0.5'>
                  <PickerButton
                    icon={Minus}
                    label={t("trader.one_fewer")}
                    disabled={qty <= 1}
                    onStep={() => step(-1)}
                  />
                  {/* Typed straight in, for when the player already knows the
                      number — over the stock just lands on the stock. */}
                  <input
                    type='text'
                    inputMode='numeric'
                    aria-label={t("trader.quantity")}
                    value={draft ?? String(qty)}
                    onFocus={(e) => e.currentTarget.select()}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "");
                      if (!digits) {
                        setDraft("");
                        return;
                      }
                      const next = clamp(Number(digits));
                      setQty(next);
                      setDraft(String(next));
                    }}
                    onBlur={() => setDraft(null)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") e.currentTarget.blur();
                      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                        e.preventDefault();
                        setDraft(null);
                        step(e.key === "ArrowUp" ? 1 : -1);
                      }
                    }}
                    className='h-8 w-9 rounded-md bg-transparent text-center text-sm font-bold tabular-nums text-white transition-colors focus:bg-zinc-100/10 focus:outline-none'
                  />
                  <PickerButton
                    icon={Plus}
                    label={t("trader.one_more")}
                    disabled={qty >= remaining}
                    onStep={() => step(1)}
                  />
                </span>
                {/* Fills the picker rather than buying outright, so the Buy
                    button shows the total before any Fame leaves. */}
                <button
                  onClick={() => {
                    setDraft(null);
                    setQty(fillTo);
                  }}
                  disabled={maxQty < 1 || qty === fillTo}
                  aria-label={`${fameBound ? t("trader.max") : t("trader.all")} ${fillTo}`}
                  className='h-8 w-11 shrink-0 rounded-md text-xs font-semibold text-zinc-300 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-30 hover:bg-zinc-100/10 hover:text-white'>
                  {fameBound ? t("trader.max") : t("trader.all")}
                </button>
              </>
            ) : (
              <PickerSpacer />
            )}
            <BuyButton
              price={total}
              canAfford={canAfford}
              isBuying={isBuying}
              onClick={() => onBuy(qty)}
              size='sm'
              unaffordableLabel={t("buy.buy")}
              className='min-w-0 flex-1 sm:w-40 sm:flex-none'
            />
          </>
        )}
      </OfferRowActions>
    </div>
  );
};
