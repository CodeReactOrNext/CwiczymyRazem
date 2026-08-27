import { EFFECTS_BY_ID } from "feature/arsenal/data/effectDefinitions";
import { getEffectValue } from "feature/arsenal/data/effectStats";
import { GUITARS_BY_ID } from "feature/arsenal/data/guitarDefinitions";
import { getItemValue } from "feature/arsenal/data/itemStats";
import { getModResaleValue } from "feature/arsenal/data/resale";
import { getRigLevel } from "feature/arsenal/data/rigLevel";
import { getModDef } from "feature/arsenal/data/workshop";
import type { SalvagedMod } from "feature/arsenal/types/arsenal.types";
import { DEFAULT_RIG } from "feature/arsenal/types/arsenal.types";
import type { MarketplaceItemType } from "feature/arsenal/types/marketplace.types";
import { MARKETPLACE_LISTING_FEE } from "feature/arsenal/types/marketplace.types";
import type { DocumentReference, Transaction } from "firebase-admin/firestore";
import type { NextApiRequest, NextApiResponse } from "next";
import { auth, firestore } from "utils/firebase/api/firebase.config";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { idToken, itemType, inventoryItemId, price } = req.body as {
    idToken: string;
    itemType: MarketplaceItemType;
    inventoryItemId: string;
    price: number;
  };

  if (!idToken) return res.status(401).json({ error: "Unauthorized" });
  if (itemType !== "guitar" && itemType !== "effect" && itemType !== "mod") {
    return res.status(400).json({ error: "Invalid itemType" });
  }
  if (!inventoryItemId)
    return res.status(400).json({ error: "Missing inventoryItemId" });
  if (!Number.isInteger(price) || price <= 0) {
    return res.status(400).json({ error: "Price must be a positive integer" });
  }

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
    const listingRef = firestore.collection("marketplace").doc();

    const result = await firestore.runTransaction(async (t: Transaction) => {
      const userDoc = await t.get(userRef);
      if (!userDoc.exists) throw new Error("USER_NOT_FOUND");

      const data = userDoc.data()!;
      const currentFame: number = data.statistics?.fame || 0;
      if (currentFame < MARKETPLACE_LISTING_FEE)
        throw new Error("INSUFFICIENT_FAME");

      // Everything the listing doc needs, resolved per kind. Gear moves out of
      // an inventory array and may free a rig slot; a mod moves out of the stash
      // and touches nothing else, because a stashed mod is on no instrument.
      const userUpdate: Record<string, any> = {
        "statistics.fame": currentFame - MARKETPLACE_LISTING_FEE,
      };
      let minPrice: number;
      let escrowed: any;
      let defId: number | string;
      let itemName: string;
      let itemBrand: string;
      let itemRarity: string;
      let itemImageId: number | string;

      if (itemType === "mod") {
        const salvagedMods: SalvagedMod[] = data.arsenal?.salvagedMods || [];
        const modIndex = salvagedMods.findIndex(
          (m) => m.id === inventoryItemId,
        );
        if (modIndex === -1) throw new Error("ITEM_NOT_FOUND");
        const mod = salvagedMods[modIndex];

        const modDef = getModDef(mod.kind, mod.featureId);
        if (!modDef) throw new Error("DEF_NOT_FOUND");

        // The bin price is the floor, exactly as an instrument's sell value is.
        // It is deliberately far under what a scarce mod is worth — the whole
        // point of listing one is that the seller sets the real number.
        minPrice = getModResaleValue(mod.kind, mod.featureId, mod.points);
        escrowed = mod;
        defId = mod.featureId;
        itemName = modDef.label;
        itemBrand = mod.kind === "guitar" ? "Guitar mod" : "Pedal mod";
        // A component has no rarity of its own, only a roll, and inventing one
        // would colour the card as if it did.
        itemRarity = "";
        itemImageId = mod.featureId;

        userUpdate["arsenal.salvagedMods"] = salvagedMods.filter(
          (_, i) => i !== modIndex,
        );
      } else {
        const invKey = itemType === "guitar" ? "inventory" : "effectInventory";
        const inventory: any[] = data.arsenal?.[invKey] || [];
        const itemIndex = inventory.findIndex((i) => i.id === inventoryItemId);
        if (itemIndex === -1) throw new Error("ITEM_NOT_FOUND");
        const item = inventory[itemIndex];

        // Resolve definition + price floor (= normal system sell value).
        let def: {
          name: string;
          brand: string;
          rarity: string;
          imageId: number | string;
        };
        if (itemType === "guitar") {
          const guitarDef = GUITARS_BY_ID.get(item.guitarId);
          if (!guitarDef) throw new Error("DEF_NOT_FOUND");
          minPrice = getItemValue(item, guitarDef);
          def = guitarDef;
          defId = item.guitarId;
        } else {
          const effectDef = EFFECTS_BY_ID.get(item.effectId);
          if (!effectDef) throw new Error("DEF_NOT_FOUND");
          // Effects on the pedalboard can't be listed (mirrors sell-effect).
          const pedalboardItems: any[] =
            data.arsenal?.rig?.pedalboardItems || [];
          if (pedalboardItems.some((pb) => pb.itemId === inventoryItemId)) {
            throw new Error("ON_PEDALBOARD");
          }
          minPrice = getEffectValue(effectDef);
          def = effectDef;
          defId = item.effectId;
        }

        escrowed = item;
        itemName = def.name;
        itemBrand = def.brand;
        itemRarity = def.rarity;
        itemImageId = def.imageId;

        // Escrow: remove the instance from the seller's inventory.
        const newInventory = inventory.filter((_, i) => i !== itemIndex);
        userUpdate[`arsenal.${invKey}`] = newInventory;

        // Auto-unequip if it's the equipped guitar.
        if (itemType === "guitar") {
          const equippedItemId = data.arsenal?.equippedItemId ?? null;
          const equippedGuitarId = data.arsenal?.equippedGuitarId ?? null;
          const sellingEquipped = equippedItemId
            ? equippedItemId === item.id
            : equippedGuitarId === item.guitarId;
          if (sellingEquipped) {
            userUpdate["arsenal.equippedGuitarId"] = null;
            userUpdate["arsenal.equippedItemId"] = null;
          }
        }

        // Escrow may remove a rig-slotted guitar: clear its slot and refresh the rig level
        const rig = data.arsenal?.rig ?? DEFAULT_RIG;
        let postEscrowRig = rig;
        if (itemType === "guitar") {
          const guitarSlots = (rig.guitarSlots ?? DEFAULT_RIG.guitarSlots).map(
            (slotId: string | null) => (slotId === item.id ? null : slotId),
          );
          postEscrowRig = { ...rig, guitarSlots };
          userUpdate["arsenal.rig.guitarSlots"] = guitarSlots;
        }
        userUpdate.rigLevel = getRigLevel({
          inventory:
            itemType === "guitar"
              ? newInventory
              : (data.arsenal?.inventory ?? []),
          effectInventory:
            itemType === "effect"
              ? newInventory
              : (data.arsenal?.effectInventory ?? []),
          rig: postEscrowRig,
        });
      }

      if (price < minPrice) throw new Error("PRICE_TOO_LOW");

      t.update(userRef, userUpdate);
      t.set(listingRef, {
        sellerId: userId,
        sellerName: data.displayName || "Unknown",
        sellerAvatarUrl: data.avatar || null,
        sellerFrame: data.statistics?.lvl ?? 0,
        itemType,
        item: escrowed,
        itemId: escrowed.id,
        defId,
        itemName,
        itemBrand,
        itemRarity,
        itemImageId,
        minPrice,
        price,
        status: "active",
        listedAt: Date.now(),
      });

      return {
        newFame: currentFame - MARKETPLACE_LISTING_FEE,
        item: escrowed,
        sellerName: data.displayName || "Unknown",
        avatarUrl: data.avatar || null,
        userAvatarFrame: data.statistics?.lvl ?? 0,
        itemName,
        itemBrand,
        itemRarity,
        itemImageId,
      };
    });

    // Public activity log (panel only).
    try {
      await firestore.collection("logs").add({
        type: "marketplace_listing",
        uid: userId,
        userName: result.sellerName,
        avatarUrl: result.avatarUrl,
        userAvatarFrame: result.userAvatarFrame,
        timestamp: new Date().toISOString(),
        data: new Date().toISOString(),
        itemType,
        itemName: result.itemName,
        itemBrand: result.itemBrand,
        itemRarity: result.itemRarity,
        itemImageId: result.itemImageId,
        price,
        rolledItem: result.item,
      });
    } catch (logError) {
      console.error("[marketplace/list-item] log write failed:", logError);
    }

    return res
      .status(200)
      .json({ listingId: listingRef.id, newFame: result.newFame });
  } catch (error: any) {
    switch (error.message) {
      case "USER_NOT_FOUND":
        return res.status(404).json({ error: "User not found" });
      case "ITEM_NOT_FOUND":
        return res.status(404).json({ error: "Item not found in inventory" });
      case "DEF_NOT_FOUND":
        return res.status(404).json({ error: "Item definition not found" });
      case "INSUFFICIENT_FAME":
        return res
          .status(400)
          .json({ error: "Not enough Fame Points for the listing fee" });
      case "PRICE_TOO_LOW":
        return res
          .status(400)
          .json({ error: "Price below the minimum sell value" });
      case "ON_PEDALBOARD":
        return res
          .status(400)
          .json({ error: "Cannot list an effect that is on the pedalboard" });
      default:
        console.error("[marketplace/list-item]", error);
        return res.status(500).json({ error: "Internal server error" });
    }
  }
}
