import type { DocumentReference, Transaction } from "firebase-admin/firestore";
import type { NextApiRequest, NextApiResponse } from "next";
import { auth, firestore } from "utils/firebase/api/firebase.config";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { idToken, listingId } = req.body as { idToken: string; listingId: string };

  if (!idToken) return res.status(401).json({ error: "Unauthorized" });
  if (!listingId) return res.status(400).json({ error: "Missing listingId" });

  let userId: string;
  try {
    const decoded = await auth.verifyIdToken(idToken);
    userId = decoded.uid;
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const listingRef = firestore.collection("marketplace").doc(listingId) as DocumentReference;
    const userRef = firestore.collection("users").doc(userId) as DocumentReference;

    await firestore.runTransaction(async (t: Transaction) => {
      const listingDoc = await t.get(listingRef);
      if (!listingDoc.exists) throw new Error("LISTING_NOT_FOUND");
      const listing = listingDoc.data()!;

      if (listing.sellerId !== userId) throw new Error("NOT_OWNER");
      if (listing.status !== "active") throw new Error("LISTING_UNAVAILABLE");

      const userDoc = await t.get(userRef);
      if (!userDoc.exists) throw new Error("USER_NOT_FOUND");
      const data = userDoc.data()!;

      const invKey = listing.itemType === "guitar" ? "inventory" : "effectInventory";
      const inventory: any[] = data.arsenal?.[invKey] || [];
      // Return the escrowed instance to the seller (5 Fame fee is not refunded).
      const restored = [...inventory, listing.item];

      t.update(userRef, { [`arsenal.${invKey}`]: restored });
      t.update(listingRef, { status: "cancelled" });
    });

    return res.status(200).json({ success: true });
  } catch (error: any) {
    switch (error.message) {
      case "LISTING_NOT_FOUND":
        return res.status(404).json({ error: "Listing not found" });
      case "NOT_OWNER":
        return res.status(403).json({ error: "Not your listing" });
      case "LISTING_UNAVAILABLE":
        return res.status(409).json({ error: "This listing is no longer active" });
      case "USER_NOT_FOUND":
        return res.status(404).json({ error: "User not found" });
      default:
        console.error("[marketplace/cancel-listing]", error);
        return res.status(500).json({ error: "Internal server error" });
    }
  }
}
