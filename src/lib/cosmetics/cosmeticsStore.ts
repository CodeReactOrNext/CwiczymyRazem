import type {
  CosmeticsState,
  EquippedLookup,
} from "feature/cosmetics/types/cosmetics.types";
import { publicEntry, readWardrobe } from "feature/cosmetics/utils/wardrobe";
import type { DocumentReference, Transaction } from "firebase-admin/firestore";
import type { NextApiRequest } from "next";
import { auth, firestore } from "utils/firebase/api/firebase.config";

/**
 * Where cosmetics live, server-side.
 *
 * Both collections are Admin-SDK only — neither has a rule, so the default deny
 * in `firestore.rules` covers them. That is the point of keeping the wardrobe
 * out of the user document: a player may write most of their own profile, and
 * ownership of something bought with Fame must not be one of those fields.
 *
 *  - `cosmetics/{uid}` — what the player owns and is wearing.
 *  - `cosmeticsPublic/equipped` — everyone's equipped pieces in one document,
 *    so the feed dresses every row with a single cached read instead of one
 *    read per player.
 */

const WARDROBES = "cosmetics";
const PUBLIC_COLLECTION = "cosmeticsPublic";
const PUBLIC_DOC = "equipped";

export const wardrobeRef = (uid: string): DocumentReference =>
  firestore.collection(WARDROBES).doc(uid);

export const userRef = (uid: string): DocumentReference =>
  firestore.collection("users").doc(uid);

const publicRef = (): DocumentReference =>
  firestore.collection(PUBLIC_COLLECTION).doc(PUBLIC_DOC);

/** Writes the wardrobe and mirrors what is worn into the public lookup, in the caller's transaction. */
export const saveWardrobe = (
  tx: Transaction,
  uid: string,
  wardrobe: CosmeticsState,
): void => {
  tx.set(wardrobeRef(uid), {
    owned: wardrobe.owned,
    equipped: wardrobe.equipped,
    updatedAt: Date.now(),
  });
  // mergeFields replaces this player's entry whole — a plain merge would keep a
  // slot they have just taken off.
  tx.set(
    publicRef(),
    { players: { [uid]: publicEntry(wardrobe.equipped) } },
    { mergeFields: [`players.${uid}`] },
  );
};

export const readWardrobeFor = async (uid: string): Promise<CosmeticsState> =>
  readWardrobe((await wardrobeRef(uid).get()).data());

export const readEquippedLookup = async (): Promise<EquippedLookup> => {
  const players = (await publicRef().get()).data()?.players;
  return players && typeof players === "object" ? (players as EquippedLookup) : {};
};

/** The caller's uid from the id token in the body, or null when it does not verify. */
export const uidFromRequest = async (req: NextApiRequest): Promise<string | null> => {
  const idToken = (req.body as { idToken?: unknown } | undefined)?.idToken;
  if (typeof idToken !== "string" || !idToken) return null;
  try {
    return (await auth.verifyIdToken(idToken)).uid;
  } catch {
    return null;
  }
};
