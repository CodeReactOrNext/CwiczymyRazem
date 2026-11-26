import {
  EXTRACTOR_RESALE_FAME,
  getImprintResaleValue,
} from "feature/arsenal/data/traitCraft";
import type {
  TraitExtractor,
  TraitImprint,
} from "feature/arsenal/types/arsenal.types";
import type { DocumentReference, Transaction } from "firebase-admin/firestore";
import type { NextApiRequest, NextApiResponse } from "next";
import { auth, firestore } from "utils/firebase/api/firebase.config";

/**
 * Sells a Trait Extractor or a Trait Imprint to the bin. The payout is worked
 * out here from the stored thing, never taken from the request.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const { idToken, itemType, id } = req.body as {
    idToken?: string;
    itemType?: "imprint" | "extractor";
    id?: string;
  };
  if (!idToken) return res.status(401).json({ error: "Unauthorized" });
  if (itemType !== "imprint" && itemType !== "extractor") {
    return res.status(400).json({ error: "Invalid itemType" });
  }
  if (!id) return res.status(400).json({ error: "Missing id" });

  let userId: string;
  try {
    userId = (await auth.verifyIdToken(idToken)).uid;
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const userRef = firestore
      .collection("users")
      .doc(userId) as DocumentReference;

    const fameReward = await firestore.runTransaction(
      async (t: Transaction) => {
        const userDoc = await t.get(userRef);
        if (!userDoc.exists) throw new Error("USER_NOT_FOUND");
        const data = userDoc.data()!;
        const fame: number = data.statistics?.fame ?? 0;

        if (itemType === "extractor") {
          const extractors: TraitExtractor[] =
            data.arsenal?.traitExtractors ?? [];
          if (!extractors.some((entry) => entry.id === id))
            throw new Error("NOT_FOUND");
          t.update(userRef, {
            "arsenal.traitExtractors": extractors.filter(
              (entry) => entry.id !== id,
            ),
            "statistics.fame": fame + EXTRACTOR_RESALE_FAME,
          });
          return EXTRACTOR_RESALE_FAME;
        }

        const imprints: TraitImprint[] = data.arsenal?.traitImprints ?? [];
        const imprint = imprints.find((entry) => entry.id === id);
        if (!imprint) throw new Error("NOT_FOUND");
        const reward = getImprintResaleValue(imprint);
        t.update(userRef, {
          "arsenal.traitImprints": imprints.filter((entry) => entry.id !== id),
          "statistics.fame": fame + reward,
        });
        return reward;
      },
    );

    return res.status(200).json({ success: true, fameReward });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    if (code === "USER_NOT_FOUND")
      return res.status(404).json({ error: "User not found" });
    if (code === "NOT_FOUND")
      return res.status(404).json({ error: "Not in your stash" });
    console.error("[arsenal/traits/sell]", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
