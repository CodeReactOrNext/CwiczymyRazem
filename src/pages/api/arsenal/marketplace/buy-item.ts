import type { DocumentReference, Transaction } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import type { NextApiRequest, NextApiResponse } from "next";
import { auth, firestore } from "utils/firebase/api/firebase.config";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { idToken, listingId } = req.body as { idToken: string; listingId: string };

  if (!idToken) return res.status(401).json({ error: "Unauthorized" });
  if (!listingId) return res.status(400).json({ error: "Missing listingId" });

  let buyerId: string;
  try {
    const decoded = await auth.verifyIdToken(idToken);
    buyerId = decoded.uid;
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const listingRef = firestore.collection("marketplace").doc(listingId) as DocumentReference;
    const buyerRef = firestore.collection("users").doc(buyerId) as DocumentReference;

    const result = await firestore.runTransaction(async (t: Transaction) => {
      const listingDoc = await t.get(listingRef);
      if (!listingDoc.exists) throw new Error("LISTING_NOT_FOUND");
      const listing = listingDoc.data()!;

      if (listing.status !== "active") throw new Error("LISTING_UNAVAILABLE");
      if (listing.sellerId === buyerId) throw new Error("OWN_LISTING");

      const sellerRef = firestore.collection("users").doc(listing.sellerId) as DocumentReference;

      // All reads before any write.
      const buyerDoc = await t.get(buyerRef);
      if (!buyerDoc.exists) throw new Error("USER_NOT_FOUND");
      const sellerDoc = await t.get(sellerRef);
      if (!sellerDoc.exists) throw new Error("SELLER_NOT_FOUND");

      const buyerData = buyerDoc.data()!;
      const price: number = listing.price;
      const buyerFame: number = buyerData.statistics?.fame || 0;
      if (buyerFame < price) throw new Error("INSUFFICIENT_FAME");

      const itemType: "guitar" | "effect" = listing.itemType;
      const invKey = itemType === "guitar" ? "inventory" : "effectInventory";

      // Transfer the escrowed instance into the buyer's inventory (flagged new).
      const transferredItem = { ...listing.item, isNew: true, acquiredAt: Date.now() };
      const buyerInventory: any[] = buyerData.arsenal?.[invKey] || [];
      const newBuyerInventory = [...buyerInventory, transferredItem];

      t.update(buyerRef, {
        [`arsenal.${invKey}`]: newBuyerInventory,
        "statistics.fame": buyerFame - price,
      });
      t.update(sellerRef, {
        "statistics.fame": FieldValue.increment(price),
      });
      t.update(listingRef, {
        status: "sold",
        soldAt: Date.now(),
        buyerId,
      });

      return {
        newFame: buyerFame - price,
        itemType,
        item: transferredItem,
        price,
        sellerId: listing.sellerId,
        itemName: listing.itemName,
        itemBrand: listing.itemBrand,
        itemImageId: listing.itemImageId,
        itemRarity: listing.itemRarity,
      };
    });

    // Notify the seller (system notification — no sender).
    try {
      await firestore.collection("notifications").add({
        userId: result.sellerId,
        type: "marketplace_sold",
        fameAwarded: result.price,
        itemType: result.itemType,
        itemName: `${result.itemBrand} ${result.itemName}`,
        itemImageId: result.itemImageId,
        itemRarity: result.itemRarity,
        isRead: false,
        timestamp: FieldValue.serverTimestamp(),
      });
    } catch (notifError) {
      console.error("[marketplace/buy-item] notification failed:", notifError);
    }

    return res.status(200).json({
      newFame: result.newFame,
      itemType: result.itemType,
      item: result.item,
    });
  } catch (error: any) {
    switch (error.message) {
      case "LISTING_NOT_FOUND":
        return res.status(404).json({ error: "Listing not found" });
      case "LISTING_UNAVAILABLE":
        return res.status(409).json({ error: "This listing is no longer available" });
      case "OWN_LISTING":
        return res.status(400).json({ error: "You cannot buy your own listing" });
      case "USER_NOT_FOUND":
        return res.status(404).json({ error: "User not found" });
      case "SELLER_NOT_FOUND":
        return res.status(404).json({ error: "Seller not found" });
      case "INSUFFICIENT_FAME":
        return res.status(400).json({ error: "Not enough Fame Points" });
      default:
        console.error("[marketplace/buy-item]", error);
        return res.status(500).json({ error: "Internal server error" });
    }
  }
}
