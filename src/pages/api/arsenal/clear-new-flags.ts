import type {
  EffectInventoryItem,
  InventoryItem,
} from "feature/arsenal/types/arsenal.types";
import type { DocumentReference, Transaction } from "firebase-admin/firestore";
import type { NextApiRequest, NextApiResponse } from "next";
import { auth, firestore } from "utils/firebase/api/firebase.config";

/**
 * Marks every drop as seen.
 *
 * Runs on its own whenever the collection opens and writes both inventories
 * whole, so it has to be a transaction: landing beside a teardown or a sale, a
 * plain read-then-write put the sold item back.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { idToken } = req.body as { idToken: string };
  if (!idToken) return res.status(401).json({ error: "Unauthorized" });

  let userId: string;
  try {
    const decoded = await auth.verifyIdToken(idToken);
    userId = decoded.uid;
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const userRef = firestore
      .collection("users")
      .doc(userId) as DocumentReference;

    const found = await firestore.runTransaction(async (t: Transaction) => {
      const userDoc = await t.get(userRef);
      if (!userDoc.exists) return false;

      const data = userDoc.data()!;
      const seen = <T extends { isNew?: boolean }>(items: T[]): T[] =>
        items.map((item) => (item.isNew ? { ...item, isNew: false } : item));
      const inventory: InventoryItem[] = data.arsenal?.inventory || [];
      const effectInventory: EffectInventoryItem[] =
        data.arsenal?.effectInventory || [];

      t.update(userRef, {
        "arsenal.inventory": seen(inventory),
        "arsenal.effectInventory": seen(effectInventory),
      });
      return true;
    });

    if (!found) return res.status(404).json({ error: "User not found" });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("[clear-new-flags]", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
