import {
  SUPPORTER_WELCOME_TOKENS,
  TOKENS_PER_DOLLAR,
} from "feature/supporterPanel/constants/supporterPanel.constants";

/**
 * What Firestore holds on a user: a lifetime ledger, not a monthly one.
 *
 * Only what has been spent and what has been handed over are stored. What the
 * wallet is worth is derived from the donation total the webhook keeps, so a
 * re-priced economy is a constant to change rather than every wallet in the
 * database to rewrite.
 */
export interface TokenWallet {
  /** Lifetime tokens spent. It only ever grows — nothing here refunds. */
  spent: number;
  /**
   * Tokens handed out by hand — a thank-you, a test account, a fix for
   * something that went wrong. Kept separate from `supportTotal` on purpose:
   * inflating the donation total to fake a grant would have the panel telling
   * the person they gave money they never gave.
   */
  granted: number;
}

export const EMPTY_WALLET: TokenWallet = { spent: 0, granted: 0 };

/** Cents and bad data reach this from Firestore; the ledger is whole tokens. */
const whole = (value: unknown): number =>
  typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.floor(value))
    : 0;

/**
 * The wallet, read off whatever Firestore holds.
 *
 * Wallets written while tokens were a monthly allowance carry a `period` and a
 * `spent` that counts one month — the months before it were wiped by the
 * calendar and were never added up anywhere. That figure is not a lifetime
 * total and cannot be turned into one, so a wallet still in the old shape opens
 * the new economy with its spending at zero and keeps the grants it was given.
 */
export const walletFromStored = (stored: unknown): TokenWallet => {
  const raw = (stored ?? {}) as Record<string, unknown>;
  const isMonthlyEra = typeof raw.period === "string" && raw.period.length > 0;

  return {
    spent: isMonthlyEra ? 0 : whole(raw.spent),
    granted: whole(raw.granted),
  };
};

/** What the money is worth. Whole dollars — a $2.50 coffee buys two dollars. */
export const tokensFromDonation = (supportTotal: number): number =>
  whole(supportTotal) * TOKENS_PER_DOLLAR;

/**
 * Everything this wallet has ever been worth: the welcome tokens the badge
 * comes with, every dollar donated since — a membership pays this again on
 * every renewal, because each renewal is another donation — and anything handed
 * over by hand.
 *
 * The welcome tokens belong to the badge, so somebody without one is worth
 * their donations alone. In practice that is a player who has money on the way
 * but no badge yet; the panel is closed to them either way.
 */
export const tokensEarned = (
  supportTotal: number,
  wallet: TokenWallet | null | undefined,
  isSupporter: boolean,
): number =>
  (isSupporter ? SUPPORTER_WELCOME_TOKENS : 0) +
  tokensFromDonation(supportTotal) +
  whole(wallet?.granted);

export const tokensSpent = (wallet: TokenWallet | null | undefined): number =>
  whole(wallet?.spent);

export const tokensLeft = (
  supportTotal: number,
  wallet: TokenWallet | null | undefined,
  isSupporter: boolean,
): number =>
  Math.max(
    0,
    tokensEarned(supportTotal, wallet, isSupporter) - tokensSpent(wallet),
  );

export const canSpend = (
  supportTotal: number,
  wallet: TokenWallet | null | undefined,
  cost: number,
  isSupporter: boolean,
): boolean =>
  Number.isInteger(cost) &&
  cost > 0 &&
  tokensLeft(supportTotal, wallet, isSupporter) >= cost;

/** The wallet after a spend. Grants are spent down like anything else. */
export const spendFromWallet = (
  wallet: TokenWallet | null | undefined,
  cost: number,
): TokenWallet => ({
  spent: tokensSpent(wallet) + whole(cost),
  granted: whole(wallet?.granted),
});
