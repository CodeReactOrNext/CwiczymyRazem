import { EFFECTS_BY_ID } from "feature/arsenal/data/effectDefinitions";
import { GUITARS_BY_ID } from "feature/arsenal/data/guitarDefinitions";
import {
  getTraderOffers,
  getTraderWindow,
} from "feature/arsenal/data/traderShop";
import type {
  EffectInventoryItem,
  InventoryItem,
  ScrapPart,
} from "feature/arsenal/types/arsenal.types";
import type {
  TraderBuyResult,
  TraderState,
} from "feature/arsenal/types/trader.types";
import { addPartsToWallet } from "feature/arsenal/utils/scrap";
import type { DocumentReference, Transaction } from "firebase-admin/firestore";
import type { NextApiRequest, NextApiResponse } from "next";
import { auth, firestore } from "utils/firebase/api/firebase.config";

/**
 * Buys from the trader's current stock.
 *
 * The client sends only *what* it wants and *how many* — the offer, its price and
 * the rolled instance behind it are all recomputed here from the window number,
 * exactly as `dailyCase` does. It also sends the window it was looking at: if the
 * counter restocked in between, the purchase is refused rather than silently
 * charging for whatever now sits in that slot.
 *
 * Stock is per player: an offer's `stock` is that player's limit for the window,
 * counted in `arsenal.trader`. Nobody can sell out from under anybody else, and
 * no shared document is written, so purchases never contend.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { idToken, offerId, qty, window } = req.body as {
    idToken: string;
    offerId: string;
    qty: number;
    window: number;
  };

  if (!idToken) return res.status(401).json({ error: "Unauthorized" });
  if (!offerId) return res.status(400).json({ error: "Missing offerId" });

  const quantity = Math.floor(Number(qty));
  if (!Number.isFinite(quantity) || quantity < 1) {
    return res.status(400).json({ error: "Invalid quantity" });
  }

  // One timestamp for both, so a request landing on midnight can't validate
  // against one window and then be served the next one's stock.
  const now = new Date();
  const currentWindow = getTraderWindow(now);
  if (Number(window) !== currentWindow) {
    return res.status(409).json({ error: "The trader has restocked" });
  }

  const offer = getTraderOffers(now).find((o) => o.id === offerId);
  if (!offer) return res.status(404).json({ error: "Offer not found" });

  let userId: string;
  try {
    const decoded = await auth.verifyIdToken(idToken);
    userId = decoded.uid;
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const userRef = firestore.collection("users").doc(userId) as DocumentReference;

    const result = await firestore.runTransaction(
      async (t: Transaction): Promise<TraderBuyResult> => {
        const userDoc = await t.get(userRef);
        if (!userDoc.exists) throw new Error("USER_NOT_FOUND");

        const data = userDoc.data()!;

        // A counter from an earlier window is stale — this window starts at zero.
        const stored = data.arsenal?.trader as TraderState | undefined;
        const trader: TraderState =
          stored?.window === currentWindow
            ? { window: currentWindow, bought: { ...(stored.bought ?? {}) } }
            : { window: currentWindow, bought: {} };

        const alreadyBought = trader.bought[offer.id] ?? 0;
        if (alreadyBought + quantity > offer.stock) {
          throw new Error("SOLD_OUT");
        }

        const cost = offer.unitPrice * quantity;
        const currentFame: number = data.statistics?.fame || 0;
        if (currentFame < cost) throw new Error("INSUFFICIENT_FAME");

        const newFame = currentFame - cost;
        trader.bought[offer.id] = alreadyBought + quantity;

        const base = {
          offerId: offer.id,
          kind: offer.kind,
          qty: quantity,
          spent: cost,
          newFame,
          bought: trader.bought[offer.id],
        };

        if (offer.kind === "part") {
          const wallet: ScrapPart[] = data.arsenal?.parts ?? [];
          const newParts = addPartsToWallet(wallet, [
            { partId: offer.partId, tier: offer.tier, qty: quantity },
          ]);

          t.update(userRef, {
            "statistics.fame": newFame,
            "arsenal.parts": newParts,
            "arsenal.trader": trader,
          });

          return { ...base, newParts };
        }

        // Items are one-offs: a rolled instance, sold once per player per window.
        if (quantity !== 1) throw new Error("INVALID_QUANTITY");

        if (offer.kind === "guitar") {
          const def = GUITARS_BY_ID.get(offer.roll.guitarId);
          if (!def) throw new Error("DEFINITION_NOT_FOUND");

          const serialRef = firestore
            .collection("arsenalSerials")
            .doc(`guitar-${def.id}`) as DocumentReference;
          const serialDoc = await t.get(serialRef);
          const serial = (serialDoc.data()?.count || 0) + 1;

          const item: InventoryItem = {
            ...offer.roll,
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            acquiredAt: Date.now(),
            isNew: true,
            serial,
          };

          const inventory: InventoryItem[] = data.arsenal?.inventory || [];
          const isNewToDex = !inventory.some((i) => i.guitarId === def.id);

          t.update(userRef, {
            "statistics.fame": newFame,
            "arsenal.inventory": [...inventory, item],
            "arsenal.trader": trader,
          });
          t.set(serialRef, { count: serial }, { merge: true });

          return { ...base, item, isNewToDex };
        }

        const def = EFFECTS_BY_ID.get(offer.roll.effectId);
        if (!def) throw new Error("DEFINITION_NOT_FOUND");

        const serialRef = firestore
          .collection("arsenalSerials")
          .doc(`effect-${def.id}`) as DocumentReference;
        const serialDoc = await t.get(serialRef);
        const serial = (serialDoc.data()?.count || 0) + 1;

        const item: EffectInventoryItem = {
          ...offer.roll,
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          acquiredAt: Date.now(),
          isNew: true,
          serial,
        };

        const effectInventory: EffectInventoryItem[] =
          data.arsenal?.effectInventory || [];
        const isNewToDex = !effectInventory.some((i) => i.effectId === def.id);

        t.update(userRef, {
          "statistics.fame": newFame,
          "arsenal.effectInventory": [...effectInventory, item],
          "arsenal.trader": trader,
        });
        t.set(serialRef, { count: serial }, { merge: true });

        return { ...base, item, isNewToDex };
      },
    );

    return res.status(200).json(result);
  } catch (error: any) {
    switch (error?.message) {
      case "USER_NOT_FOUND":
        return res.status(404).json({ error: "User not found" });
      case "SOLD_OUT":
        return res
          .status(409)
          .json({ error: "You have taken everything this offer stocks today" });
      case "INSUFFICIENT_FAME":
        return res.status(400).json({ error: "Not enough Fame Points" });
      case "INVALID_QUANTITY":
        return res.status(400).json({ error: "Invalid quantity" });
      case "DEFINITION_NOT_FOUND":
        return res.status(404).json({ error: "Item definition not found" });
      default:
        console.error("[trader-buy]", error);
        return res.status(500).json({ error: "Internal server error" });
    }
  }
}
