import type {
  HardwareKind,
  UpgradeRigResult,
} from "feature/arsenal/data/rigHardware";
import { boardTierOf, nextTier } from "feature/arsenal/data/rigHardware";
import type { DocumentReference, Transaction } from "firebase-admin/firestore";
import type { NextApiRequest, NextApiResponse } from "next";
import { auth, firestore } from "utils/firebase/api/firebase.config";

/**
 * Buys the next rung of a rig's hardware: a bigger case.
 *
 * The client sends only *which ladder* — never a tier and never a price. Both
 * are recomputed here from what the account already owns, the same way the
 * trader recomputes its offers, so the only thing a tampered request can do is
 * buy the upgrade the player was going to be sold anyway.
 *
 * One rung at a time, deliberately. A player who can afford the top case can
 * buy it in three presses, and each of those presses is a board that visibly
 * changes shape — which is the thing being paid for.
 */

/**
 * A refusal that carries what it was refused for.
 *
 * A bare "not enough" is unanswerable: the card that offered the upgrade priced
 * it against the wallet the *client* is holding, and a client wallet that has
 * drifted above the stored one leaves the player pressing a button that can
 * never work, with nothing on screen to say why. So the two numbers travel back
 * with the error — to be read out, and to put the client's wallet right. See
 * `useUpgradeRig`.
 */
class InsufficientFame extends Error {
  constructor(
    readonly have: number,
    readonly need: number,
    readonly tierName: string,
  ) {
    super("INSUFFICIENT_FAME");
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { idToken, kind } = req.body as { idToken: string; kind: HardwareKind };

  if (!idToken) return res.status(401).json({ error: "Unauthorized" });
  if (kind !== "board") {
    return res.status(400).json({ error: "Unknown hardware" });
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

    const result = await firestore.runTransaction(
      async (t: Transaction): Promise<UpgradeRigResult> => {
        const userDoc = await t.get(userRef);
        if (!userDoc.exists) throw new Error("USER_NOT_FOUND");

        const data = userDoc.data()!;
        const rig = data.arsenal?.rig;
        const owned = boardTierOf(rig?.boardTier).id;

        const next = nextTier(kind, owned);
        if (!next) throw new Error("ALREADY_TOP_TIER");

        const currentFame: number = data.statistics?.fame || 0;
        if (currentFame < next.fame) {
          throw new InsufficientFame(currentFame, next.fame, next.name);
        }

        const newFame = currentFame - next.fame;

        // The board is not re-laid out here. A bigger case only ever *adds*
        // room, so nothing that fitted before can stop fitting; the client
        // re-runs its own layout pass on the next read and puts the parked
        // pedals back on the surface itself.
        t.update(userRef, {
          "statistics.fame": newFame,
          "arsenal.rig.boardTier": next.id,
        });

        return {
          kind,
          tier: next.id,
          name: next.name,
          spent: next.fame,
          newFame,
        };
      },
    );

    return res.status(200).json(result);
  } catch (error: any) {
    if (error instanceof InsufficientFame) {
      return res.status(400).json({
        error: `Not enough Fame: the ${error.tierName} costs ${error.need} and you have ${error.have}.`,
        // The stored wallet, so the client can correct the one it was pricing
        // against instead of offering the same button again.
        have: error.have,
        need: error.need,
      });
    }

    switch (error?.message) {
      case "USER_NOT_FOUND":
        return res.status(404).json({ error: "User not found" });
      case "ALREADY_TOP_TIER":
        return res
          .status(409)
          .json({ error: "There is nothing bigger to buy — this is the top" });
      default:
        console.error("[upgrade-rig]", error);
        return res.status(500).json({ error: "Internal server error" });
    }
  }
}
