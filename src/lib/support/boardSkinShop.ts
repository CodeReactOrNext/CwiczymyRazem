import type { BoardSkinState } from "feature/arsenal/data/boardSkins";
import {
  readBoardSkins,
  readRackBays,
  SKINS_BY_ID,
  withPurchase,
  withRackOnBays,
} from "feature/arsenal/data/boardSkins";
import type { SupporterWallet } from "feature/supporterPanel/types/supporterPanel.types";
import type { DocumentSnapshot, Transaction } from "firebase-admin/firestore";
import { chargeTokens, readWalletFor, userRef } from "lib/support/tokenWallet";
import { firestore } from "utils/firebase/api/firebase.config";

/**
 * The rig skin shop: buying a skin with tokens, and choosing which of the ones
 * already bought the board wears and which display case hangs in which bay of
 * the guitar wall.
 *
 * What an account owns lives at `arsenal.boardSkins`, beside the rest of the
 * rig, so a public profile draws the board its owner paid for from the same
 * read it already makes. The id is the only thing taken from the request — the
 * price is looked up here, and the charge and the grant share one transaction,
 * so nobody is charged for a skin they did not get or handed one for free.
 */

const SKINS_FIELD = "arsenal.boardSkins";

export interface SkinShopState {
  wallet: SupporterWallet;
  boardSkins: BoardSkinState;
}

export type SkinShopOutcome =
  | ({ ok: true } & SkinShopState)
  | { ok: false; status: 400 | 402 | 404 | 409; error: string };

type Refusal = Extract<SkinShopOutcome, { ok: false }>;

const refuse = (status: Refusal["status"], error: string): Refusal => ({
  ok: false,
  status,
  error,
});

const storedSkins = (user: DocumentSnapshot): BoardSkinState =>
  readBoardSkins(user.data()?.arsenal?.boardSkins);

/** The wallet is re-read after the write, so it is the stored one. */
const settled = async (
  uid: string,
  boardSkins: BoardSkinState,
): Promise<SkinShopOutcome> => ({
  ok: true,
  wallet: await readWalletFor(uid),
  boardSkins,
});

/**
 * `bays` only matters for a display case: the bays of the guitar wall it goes
 * straight into. Left out, it goes into all three.
 */
export async function buyBoardSkin(
  uid: string,
  skinId: unknown,
  bays?: unknown,
): Promise<SkinShopOutcome> {
  const skin = typeof skinId === "string" ? SKINS_BY_ID.get(skinId) : undefined;
  if (!skin) return refuse(400, "Unknown skin");
  const rackBays = readRackBays(bays);
  if (!rackBays) return refuse(400, "Unknown bay");

  const result = await firestore.runTransaction(
    async (tx: Transaction): Promise<Refusal | BoardSkinState> => {
      const user = (await tx.get(userRef(uid))) as DocumentSnapshot;
      if (!user.exists) return refuse(404, "User not found");

      const state = storedSkins(user);
      if (state.owned.includes(skin.id)) {
        return refuse(409, "You already own this skin");
      }
      if (!chargeTokens(tx, user, skin.price)) {
        return refuse(402, "Not enough tokens left");
      }

      const next = withPurchase(state, skin, rackBays);
      tx.update(user.ref, { [SKINS_FIELD]: next });
      return next;
    },
  );

  return "ok" in result ? result : settled(uid, result);
}

/**
 * Puts on a skin the account owns, or — with no id — goes back to stock. A
 * display case goes into the `bays` named, every bay when none are.
 */
export async function wearBoardSkin(
  uid: string,
  kind: unknown,
  skinId: unknown,
  bays?: unknown,
): Promise<SkinShopOutcome> {
  if (kind !== "cable" && kind !== "board" && kind !== "rack") {
    return refuse(400, "Unknown kind of skin");
  }
  const slot = kind;
  if (skinId !== null && typeof skinId !== "string") {
    return refuse(400, "Unknown skin");
  }
  const rackBays = readRackBays(bays);
  if (!rackBays) return refuse(400, "Unknown bay");

  const result = await firestore.runTransaction(
    async (tx: Transaction): Promise<Refusal | BoardSkinState> => {
      const user = (await tx.get(userRef(uid))) as DocumentSnapshot;
      if (!user.exists) return refuse(404, "User not found");

      const state = storedSkins(user);
      if (skinId !== null) {
        if (SKINS_BY_ID.get(skinId)?.kind !== slot) {
          return refuse(400, "Unknown skin");
        }
        if (!state.owned.includes(skinId)) {
          return refuse(409, "You do not own this skin");
        }
      }

      const next: BoardSkinState =
        slot === "rack"
          ? { ...state, rack: withRackOnBays(state.rack, skinId, rackBays) }
          : { ...state, [slot]: skinId };
      tx.update(user.ref, { [SKINS_FIELD]: next });
      return next;
    },
  );

  return "ok" in result ? result : settled(uid, result);
}

export const readSkinShop = async (uid: string): Promise<SkinShopState> => {
  const user = (await userRef(uid).get()) as DocumentSnapshot;
  return {
    wallet: await readWalletFor(uid),
    boardSkins: storedSkins(user),
  };
};
