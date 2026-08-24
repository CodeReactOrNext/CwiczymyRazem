import {
  applyFusion,
  countHeldParts,
  getFusionQuote,
} from "feature/arsenal/data/fusion";
import type {
  PartId,
  PartTier,
  ScrapPart,
} from "feature/arsenal/types/arsenal.types";
import type { DocumentReference, Transaction } from "firebase-admin/firestore";
import type { NextApiRequest, NextApiResponse } from "next";
import { auth, firestore } from "utils/firebase/api/firebase.config";

/**
 * Reworks a stack of loose parts into a smaller stack one tier up.
 *
 * The client says *what* to rework and *how many* pieces it wants out; it never
 * says what that costs. `getFusionQuote` is deterministic, so the bill recomputed
 * here is the bill the card showed — the same contract `workshop/build` runs on.
 *
 * In a transaction because it moves two balances at once: a rework that took the
 * parts and then failed to charge the Fame would be free.
 */

/**
 * Pieces one request may produce. The bench is meant to be clicked, not looped —
 * this only exists so a malformed or hostile quantity cannot ask the transaction
 * to do unbounded arithmetic.
 */
const MAX_CRAFTS_PER_REQUEST = 50;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { idToken, partId, tier, crafts } = req.body as {
    idToken: string;
    partId: PartId;
    tier: PartTier;
    crafts: number;
  };

  if (!idToken) return res.status(401).json({ error: "Unauthorized" });
  if (!partId || !tier) return res.status(400).json({ error: "Missing part" });

  const wanted = Math.floor(Number(crafts));
  if (!Number.isFinite(wanted) || wanted <= 0) {
    return res.status(400).json({ error: "Invalid quantity" });
  }
  if (wanted > MAX_CRAFTS_PER_REQUEST) {
    return res.status(400).json({
      error: `Rework at most ${MAX_CRAFTS_PER_REQUEST} pieces at once`,
    });
  }

  let userId: string;
  try {
    const decoded = await auth.verifyIdToken(idToken);
    userId = decoded.uid;
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const quote = getFusionQuote(partId, tier, wanted);
  if (!quote) {
    return res.status(400).json({ error: "This part cannot be reworked" });
  }

  try {
    const userRef = firestore
      .collection("users")
      .doc(userId) as DocumentReference;

    const result = await firestore.runTransaction(async (t: Transaction) => {
      const userDoc = await t.get(userRef);
      if (!userDoc.exists) throw new Error("USER_NOT_FOUND");

      const data = userDoc.data()!;
      const held: ScrapPart[] = data.arsenal?.parts ?? [];
      const fame: number = data.statistics?.fame ?? 0;

      if (countHeldParts(held, partId, tier) < quote.inputQty) {
        throw new Error("NOT_ENOUGH_PARTS");
      }
      if (fame < quote.fame) throw new Error("NOT_ENOUGH_FAME");

      const newParts = applyFusion(held, quote);
      const newFame = fame - quote.fame;

      t.update(userRef, {
        "arsenal.parts": newParts,
        "statistics.fame": newFame,
      });

      return {
        // Mirrored into the client's Fame counter, which lives outside this query.
        fameSpent: quote.fame,
        produced: {
          partId,
          tier: quote.outputTier,
          qty: quote.crafts,
        } as ScrapPart,
        spent: {
          partId,
          tier: quote.inputTier,
          qty: quote.inputQty,
        } as ScrapPart,
        newParts,
        newFame,
      };
    });

    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    if (code === "USER_NOT_FOUND") {
      return res.status(404).json({ error: "User not found" });
    }
    if (code === "NOT_ENOUGH_PARTS") {
      return res.status(400).json({ error: "Not enough parts to rework" });
    }
    if (code === "NOT_ENOUGH_FAME") {
      return res.status(400).json({ error: "Not enough Fame for this rework" });
    }
    console.error("[parts-fuse]", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
