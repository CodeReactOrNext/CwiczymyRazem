import type { MarketplaceItemType } from "feature/arsenal/types/marketplace.types";
import type { DocumentReference, Transaction } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import type { NextApiRequest, NextApiResponse } from "next";
import { auth, firestore } from "utils/firebase/api/firebase.config";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { idToken, listingId } = req.body as {
    idToken: string;
    listingId: string;
  };

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
    const listingRef = firestore
      .collection("marketplace")
      .doc(listingId) as DocumentReference;
    const buyerRef = firestore
      .collection("users")
      .doc(buyerId) as DocumentReference;

    const result = await firestore.runTransaction(async (t: Transaction) => {
      const listingDoc = await t.get(listingRef);
      if (!listingDoc.exists) throw new Error("LISTING_NOT_FOUND");
      const listing = listingDoc.data()!;

      if (listing.status !== "active") throw new Error("LISTING_UNAVAILABLE");
      if (listing.sellerId === buyerId) throw new Error("OWN_LISTING");

      const sellerRef = firestore
        .collection("users")
        .doc(listing.sellerId) as DocumentReference;

      // All reads before any write.
      const buyerDoc = await t.get(buyerRef);
      if (!buyerDoc.exists) throw new Error("USER_NOT_FOUND");
      const sellerDoc = await t.get(sellerRef);
      if (!sellerDoc.exists) throw new Error("SELLER_NOT_FOUND");

      const buyerData = buyerDoc.data()!;
      const sellerData = sellerDoc.data()!;
      const price: number = listing.price;
      const buyerFame: number = buyerData.statistics?.fame || 0;
      if (buyerFame < price) throw new Error("INSUFFICIENT_FAME");

      const itemType: MarketplaceItemType = listing.itemType;

      // Where the escrowed thing lands. Gear goes into an inventory flagged new
      // and marks the model discovered; a mod goes into the stash, which has no
      // Dex behind it — mods have never been part of the collection.
      let transferredItem: any;
      const buyerUpdate: Record<string, any> = {
        "statistics.fame": buyerFame - price,
      };

      if (itemType === "mod") {
        // Re-keyed on the way in. A stash id only has to be unique inside one
        // player's stash, and a trader mod's is `trader:<window>-mod` — the same
        // string for everyone who bought that day — so handing one over untouched
        // could leave the buyer holding two entries nothing can tell apart, and
        // fitting either would consume both. A listing id cannot repeat.
        transferredItem = {
          ...listing.item,
          id: `market:${listingId}`,
          salvagedAt: Date.now(),
        };
        const stash: any[] = buyerData.arsenal?.salvagedMods || [];
        buyerUpdate["arsenal.salvagedMods"] = [...stash, transferredItem];
      } else {
        const invKey = itemType === "guitar" ? "inventory" : "effectInventory";
        const dexKey = itemType === "guitar" ? "dexGuitars" : "dexEffects";
        const definitionId =
          itemType === "guitar"
            ? listing.item?.guitarId
            : listing.item?.effectId;

        // Transfer the escrowed instance into the buyer's inventory (flagged new).
        transferredItem = {
          ...listing.item,
          isNew: true,
          acquiredAt: Date.now(),
        };
        const buyerInventory: any[] = buyerData.arsenal?.[invKey] || [];
        buyerUpdate[`arsenal.${invKey}`] = [...buyerInventory, transferredItem];
        // The buyer has now held this model — discovery is permanent, so it
        // stays in their Dex even if they flip it straight back onto the market.
        if (definitionId != null) {
          buyerUpdate[`arsenal.${dexKey}`] =
            FieldValue.arrayUnion(definitionId);
        }
      }

      t.update(buyerRef, buyerUpdate);
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
        sellerName: sellerData.displayName || listing.sellerName || "Unknown",
        itemName: listing.itemName,
        itemBrand: listing.itemBrand,
        itemImageId: listing.itemImageId,
        itemRarity: listing.itemRarity,
        buyerName: buyerData.displayName || "Someone",
        buyerAvatarUrl: buyerData.avatar || buyerData.photoURL || null,
        buyerFrame: buyerData.statistics?.lvl ?? 0,
      };
    });

    // Notify the seller — include the buyer's identity so the seller can see
    // who purchased the item they listed on the marketplace.
    try {
      await firestore.collection("notifications").add({
        userId: result.sellerId,
        type: "marketplace_sold",
        senderId: buyerId,
        senderName: result.buyerName,
        senderAvatarUrl: result.buyerAvatarUrl,
        senderFrame: result.buyerFrame,
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

    // Public activity log (panel only) — mirrors the listing log so purchases are visible
    // in the feed and can be motivated like any other activity.
    try {
      await firestore.collection("logs").add({
        type: "marketplace_purchase",
        uid: buyerId,
        userName: result.buyerName,
        avatarUrl: result.buyerAvatarUrl,
        userAvatarFrame: result.buyerFrame,
        timestamp: new Date().toISOString(),
        data: new Date().toISOString(),
        sellerId: result.sellerId,
        sellerName: result.sellerName,
        itemType: result.itemType,
        itemName: result.itemName,
        itemBrand: result.itemBrand,
        itemRarity: result.itemRarity,
        itemImageId: result.itemImageId,
        price: result.price,
        rolledItem: result.item,
      });
    } catch (logError) {
      console.error("[marketplace/buy-item] log write failed:", logError);
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
        return res
          .status(409)
          .json({ error: "This listing is no longer available" });
      case "OWN_LISTING":
        return res
          .status(400)
          .json({ error: "You cannot buy your own listing" });
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
