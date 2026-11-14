import type { BuyCosmeticResult } from "feature/cosmetics/types/cosmetics.types";
import {
  checkPurchase,
  readWardrobe,
  withPurchase,
} from "feature/cosmetics/utils/wardrobe";
import type { DocumentSnapshot, Transaction } from "firebase-admin/firestore";
import { saveWardrobe, userRef, wardrobeRef } from "lib/cosmetics/cosmeticsStore";
import { requireSupporter } from "lib/support/supporterAuth";
import { chargeTokens, readWalletFor } from "lib/support/tokenWallet";
import type { NextApiRequest, NextApiResponse } from "next";
import { firestore } from "utils/firebase/api/firebase.config";

/**
 * Buys one cosmetic with supporter tokens and puts it on. Supporters only.
 *
 * The client sends only the id. The price comes from the catalog and the
 * wallet from the stored user document, and the charge, the wardrobe and the
 * public lookup are written in one transaction — so a double click can neither
 * pay twice nor end up with the piece and the tokens both.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const authResult = await requireSupporter(req);
  if (!authResult.ok) {
    return res.status(authResult.status).json({ error: authResult.error });
  }
  const { uid } = authResult.session;

  const itemId = (req.body as { itemId?: unknown }).itemId;
  if (typeof itemId !== "string" || !itemId) {
    return res.status(400).json({ error: "Missing itemId" });
  }

  try {
    const wardrobe = await firestore.runTransaction(async (tx: Transaction) => {
      const [user, stored] = (await Promise.all([
        tx.get(userRef(uid)),
        tx.get(wardrobeRef(uid)),
      ])) as DocumentSnapshot[];
      if (!user.exists) throw new Error("USER_NOT_FOUND");

      const current = readWardrobe(stored.data());
      const check = checkPurchase(current, itemId);
      if (!check.ok) throw new Error(check.reason.toUpperCase());
      if (!chargeTokens(tx, user, check.price)) throw new Error("TOKENS");

      const next = withPurchase(current, itemId);
      saveWardrobe(tx, uid, next);
      return next;
    });

    // Read after the commit rather than worked out inside it: the wallet's
    // arithmetic lives in tokenWallet, and the header must show what was stored.
    const result: BuyCosmeticResult = { ...wardrobe, wallet: await readWalletFor(uid) };
    return res.status(200).json(result);
  } catch (error: any) {
    switch (error?.message) {
      case "USER_NOT_FOUND":
        return res.status(404).json({ error: "User not found" });
      case "UNKNOWN":
        return res.status(404).json({ error: "Item not found" });
      case "OWNED":
        return res.status(409).json({ error: "You already own this" });
      case "TOKENS":
        return res.status(402).json({ error: "Not enough tokens left" });
      default:
        console.error("[cosmetics/buy]", error);
        return res.status(500).json({ error: "Internal server error" });
    }
  }
}
