import { cn } from "assets/lib/utils";
import { GuitarPatternBackground } from "components/GuitarPatternBackground/GuitarPatternBackground";
import { SupportToken } from "components/UI/SupportToken/SupportToken";
import { FameCoin } from "feature/arsenal/components/Workshop/FameCoin";
import { Coins, HandCoins, PiggyBank, Wallet } from "lucide-react";
import type { ReactNode } from "react";

/**
 * The one shape every place a guild puts money in wears.
 *
 * Seats, shelf rows and the guild's Fame used to be three quiet grey boxes
 * that looked like every other panel on the page, so a member could not tell
 * at a glance which box was asking for something and how far it had got. This
 * is the answer: a tinted surface in the currency's own colour with the app's
 * tiled-icon pattern behind it, and the two numbers that matter — what is in
 * and what is needed — drawn big, with the currency's own coin sitting right
 * on them rather than named in a caption above. A coin is read faster than a
 * word, and it is the same coin the header and the shop already taught a
 * member to recognise.
 *
 * Tokens are cyan and Fame is amber everywhere else in the app, so the panel
 * borrows those rather than inventing a third colour for "spending".
 */

export type SpendCurrency = "tokens" | "fame";

const LOOK: Record<
  SpendCurrency,
  {
    hex: string;
    surface: string;
    text: string;
    bar: string;
    button: string;
    buttonStrong: string;
  }
> = {
  tokens: {
    hex: "#22d3ee",
    surface: "bg-cyan-950/25",
    text: "text-cyan-300",
    bar: "bg-cyan-400",
    button: "bg-cyan-500/15 text-cyan-200 hover:bg-cyan-500/25",
    buttonStrong: "bg-cyan-500/30 text-cyan-100 hover:bg-cyan-500/40",
  },
  fame: {
    hex: "#fbbf24",
    surface: "bg-amber-950/25",
    text: "text-amber-400",
    bar: "bg-amber-400",
    button: "bg-amber-500/15 text-amber-200 hover:bg-amber-500/25",
    buttonStrong: "bg-amber-500/30 text-amber-100 hover:bg-amber-500/40",
  },
};

/** "1 token" vs "12 tokens" — Fame stays Fame either way, same as "money". */
const unitWord = (currency: SpendCurrency, amount: number): string =>
  currency === "fame" ? "Fame" : amount === 1 ? "token" : "tokens";

/** The same coins the header and the shop draw, so the currency is recognised. */
export const CurrencyIcon = ({
  currency,
  size,
}: {
  currency: SpendCurrency;
  size: number;
}) =>
  currency === "tokens" ? (
    <SupportToken size={size} />
  ) : (
    <FameCoin size={size} />
  );

/** Money icons in the pattern, not guitars: this box is about paying. */
const PATTERN_ICONS = [Coins, HandCoins, Wallet, PiggyBank];

interface GuildSpendPanelProps {
  currency: SpendCurrency;
  title: ReactNode;
  /** One line under the title on what it buys or counts. */
  blurb?: ReactNode;
  /** What is in. */
  have: number;
  /** What is needed, or null when there is nothing left to buy or save for. */
  need: number | null;
  /** The ways to put in, and who already did — rendered under the bar. */
  children?: ReactNode;
  className?: string;
}

export const GuildSpendPanel = ({
  currency,
  title,
  blurb,
  have,
  need,
  children,
  className,
}: GuildSpendPanelProps) => {
  const look = LOOK[currency];
  const owed = need === null ? 0 : Math.max(0, need - have);
  const covered = need !== null && owed === 0;
  const percent =
    need === null || need <= 0
      ? 100
      : Math.min(100, Math.round((have / need) * 100));

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-lg p-5",
        look.surface,
        className,
      )}>
      <GuitarPatternBackground
        opacity={0.09}
        scale={0.55}
        color={look.hex}
        icons={PATTERN_ICONS}
      />

      <div className='relative space-y-4'>
        <div className='flex flex-wrap items-start justify-between gap-x-6 gap-y-3'>
          <div className='min-w-0 space-y-1'>
            <h3 className='text-base font-bold text-zinc-100'>{title}</h3>
            {blurb && (
              <p className='max-w-xl text-xs leading-relaxed text-zinc-400'>
                {blurb}
              </p>
            )}
          </div>

          {(need !== null || have > 0) && (
            <div className='shrink-0 text-right'>
              <p className='flex items-center justify-end gap-2'>
                <CurrencyIcon currency={currency} size={24} />
                <span
                  className={cn(
                    "text-3xl font-bold tabular-nums leading-none",
                    covered ? "text-emerald-400" : look.text,
                  )}>
                  {have.toLocaleString()}
                </span>
                {need !== null && (
                  <span className='text-lg tabular-nums text-zinc-500'>
                    / {need.toLocaleString()}
                  </span>
                )}
              </p>
              <p className='mt-1 text-[11px] text-zinc-500'>
                {need === null
                  ? `${unitWord(currency, have)} in the bank`
                  : covered
                    ? "covered"
                    : `${owed.toLocaleString()} ${unitWord(currency, owed)} to go`}
              </p>
            </div>
          )}
        </div>

        {need !== null && (
          <div
            role='progressbar'
            aria-valuenow={Math.min(have, need)}
            aria-valuemin={0}
            aria-valuemax={need}
            aria-label={`${have} of ${need} ${unitWord(currency, need)}`}
            className='h-2.5 overflow-hidden rounded-full bg-zinc-950/60'>
            <div
              className={cn(
                "h-full rounded-full transition-[width] duration-500",
                covered ? "bg-emerald-400" : look.bar,
              )}
              style={{ width: `${percent}%` }}
            />
          </div>
        )}

        {children}
      </div>
    </section>
  );
};

/**
 * One amount a member can put in, as an actual button rather than a ghost
 * link — solid tinted fill in the currency's own colour, the coin and the
 * number at a size worth tapping. The amount that finishes the pot gets the
 * stronger fill and says so, so it reads as the one worth pressing.
 */
export const PledgeButton = ({
  currency,
  amount,
  finishes = false,
  disabled = false,
  onClick,
}: {
  currency: SpendCurrency;
  amount: number;
  /** This amount is exactly what is left owing. */
  finishes?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) => {
  const look = LOOK[currency];

  return (
    <button
      type='button'
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40",
        finishes ? look.buttonStrong : look.button,
      )}>
      <CurrencyIcon currency={currency} size={18} />
      {amount.toLocaleString()}
      {finishes && (
        <span className='text-xs font-semibold opacity-80'>· finish it</span>
      )}
    </button>
  );
};
