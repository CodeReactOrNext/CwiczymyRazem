import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { SupportToken } from "components/UI/SupportToken/SupportToken";
import { TOKENS_PER_DOLLAR } from "feature/supporterPanel/constants/supporterPanel.constants";
import { Check } from "lucide-react";
import type { ReactNode } from "react";

export interface ShopItemLabels {
  buy: string;
  confirm: string;
  owned: string;
  /** "Wearing" / "On your board". */
  worn: string;
  wear: string;
  takeOff: string;
  /** On the disabled button of something out of reach. */
  notEnough: string;
}

/** 45 tokens → "$4.50", 80 → "$8". */
export const tokensInDollars = (tokens: number): string => {
  const dollars = tokens / TOKENS_PER_DOLLAR;
  return `$${Number.isInteger(dollars) ? dollars : dollars.toFixed(2)}`;
};

interface ShopItemCardProps {
  art: ReactNode;
  name: string;
  price: number;
  owned: boolean;
  worn: boolean;
  canAfford: boolean;
  /** The first press landed: the button now carries the price and buys. */
  confirming: boolean;
  busy: boolean;
  /** Window shopping without the badge: the price, and nothing to press. */
  preview: boolean;
  labels: ShopItemLabels;
  onAskBuy: () => void;
  onBuy: () => void;
  onToggleWear: () => void;
}

/**
 * One item on a shelf of the skin shop — a banner, an avatar effect, a board
 * or a cable. Shared by every shelf so they read as one shop.
 *
 * Something out of reach shows its price dimmed and says so on its button;
 * the piece being worn sits on a lighter card, not behind a frame.
 */
export const ShopItemCard = ({
  art,
  name,
  price,
  owned,
  worn,
  canAfford,
  confirming,
  busy,
  preview,
  labels,
  onAskBuy,
  onBuy,
  onToggleWear,
}: ShopItemCardProps) => (
  <div
    className={cn(
      "flex flex-col gap-4 rounded-lg p-3 transition-colors",
      worn ? "bg-zinc-800/70" : "bg-zinc-900/40",
    )}>
    {art}

    <div className='mt-auto flex min-h-9 items-center justify-between gap-3 px-1'>
      <div className='min-w-0'>
        <p className='truncate text-sm font-semibold text-zinc-100'>{name}</p>
        {owned ? (
          <p
            className={cn(
              "mt-1 flex items-center gap-1 text-xs",
              worn ? "text-emerald-400" : "text-zinc-400",
            )}>
            {worn && <Check size={12} />}
            {worn ? labels.worn : labels.owned}
          </p>
        ) : (
          <p
            className={cn(
              "mt-1 flex items-center gap-1.5 text-lg font-semibold tabular-nums",
              canAfford || preview ? "text-amber-300" : "text-zinc-500",
            )}>
            <SupportToken size={20} />
            {price}
            {/* In the window only: what tells a visitor this is a currency
                donations bring, not points earned by practising. */}
            {preview && (
              <span className='ml-1 text-sm font-normal text-zinc-400'>
                {tokensInDollars(price)}
              </span>
            )}
          </p>
        )}
      </div>

      {preview ? null : owned ? (
        <Button
          size='sm'
          variant='secondary'
          disabled={busy}
          onClick={onToggleWear}>
          {worn ? labels.takeOff : labels.wear}
        </Button>
      ) : confirming ? (
        <Button size='sm' disabled={busy} onClick={onBuy}>
          <span className='flex items-center gap-1.5'>
            {labels.confirm}
            <SupportToken size={16} />
            {price}
          </span>
        </Button>
      ) : (
        <Button
          size='sm'
          variant='secondary'
          disabled={busy || !canAfford}
          onClick={onAskBuy}>
          {canAfford ? labels.buy : labels.notEnough}
        </Button>
      )}
    </div>
  </div>
);
