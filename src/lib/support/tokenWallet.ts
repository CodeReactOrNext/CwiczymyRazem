import type { SupporterWallet } from "feature/supporterPanel/types/supporterPanel.types";
import type { TokenWallet } from "feature/supporterPanel/utils/supporterTokens";
import {
  canSpend,
  spendFromWallet,
  tokensEarned,
  tokensFromDonation,
  tokensLeft,
  walletFromStored,
} from "feature/supporterPanel/utils/supporterTokens";
import type {
  DocumentReference,
  DocumentSnapshot,
  Transaction,
} from "firebase-admin/firestore";
import { firestore } from "utils/firebase/api/firebase.config";

/**
 * Reading and spending the one currency, shared by the roadmap board, the gear
 * board, the case slate, the goal ballot and the guilds.
 *
 * Every spend happens inside the caller's transaction against the *stored*
 * user document, never against numbers the client sent — a token is bought with
 * real money, so the server is the only party allowed to say how many are left.
 */

const WALLET_FIELD = "supporterTokens";

export const userRef = (uid: string): DocumentReference =>
  firestore.collection("users").doc(uid);

const num = (value: unknown): number =>
  typeof value === "number" && Number.isFinite(value) ? value : 0;

const readWallet = (data: Record<string, any> | undefined): TokenWallet =>
  walletFromStored(data?.[WALLET_FIELD]);

/** The badge, which is what the welcome tokens hang off. */
const hasBadge = (data: Record<string, any> | undefined): boolean =>
  data?.isSupport === true;

/** The wallet as the panel shows it: what came in, what is gone, what is left. */
export const describeWallet = (
  data: Record<string, any> | undefined,
): SupporterWallet => {
  const wallet = readWallet(data);
  const supportTotal = num(data?.supportTotal);
  const isSupporter = hasBadge(data);

  return {
    supportTotal,
    fromDonation: tokensFromDonation(supportTotal),
    earned: tokensEarned(supportTotal, wallet, isSupporter),
    granted: wallet.granted,
    spent: wallet.spent,
    left: tokensLeft(supportTotal, wallet, isSupporter),
  };
};

export const readWalletFor = async (uid: string): Promise<SupporterWallet> =>
  describeWallet((await userRef(uid).get()).data());

/**
 * Charges the user inside an open transaction. Returns false when the wallet
 * can't cover it, having written nothing — the caller aborts on that rather
 * than half-applying whatever it was doing.
 */
export const chargeTokens = (
  tx: Transaction,
  user: DocumentSnapshot,
  cost: number,
): boolean => {
  const data = user.data() ?? {};
  const wallet = readWallet(data);

  if (!canSpend(num(data.supportTotal), wallet, cost, hasBadge(data))) {
    return false;
  }

  tx.update(user.ref, {
    [WALLET_FIELD]: spendFromWallet(wallet, cost),
  });
  return true;
};
