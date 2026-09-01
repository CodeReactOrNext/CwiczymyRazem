import { supplyTierOf } from "feature/arsenal/data/rigHardware";
import { getRigLevel } from "feature/arsenal/data/rigLevel";
import type {
  PedalboardPlacement,
  PowerLink,
} from "feature/arsenal/types/arsenal.types";
import { DEFAULT_RIG } from "feature/arsenal/types/arsenal.types";
import type { NextApiRequest, NextApiResponse } from "next";
import { auth, firestore } from "utils/firebase/api/firebase.config";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { idToken, items, power } = req.body as {
    idToken: string;
    items: PedalboardPlacement[];
    power?: PowerLink[];
  };

  if (!idToken) return res.status(401).json({ error: "Unauthorized" });
  if (!Array.isArray(items))
    return res.status(400).json({ error: "Missing items" });

  let userId: string;
  try {
    const decoded = await auth.verifyIdToken(idToken);
    userId = decoded.uid;
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const userRef = firestore.collection("users").doc(userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists)
      return res.status(404).json({ error: "User not found" });

    const arsenal = userDoc.data()!.arsenal;

    // The DC cables decide which pedals count towards the wiring bonus, so they
    // are checked here rather than trusted: a link has to name a pedal that is
    // actually on the board and an output the brick actually has, and no two
    // may claim the same one. One pedal is one output, so that is the whole
    // check — there is no budget left to add up.
    //
    // "The brick actually has" is read off the rig rather than off a constant,
    // because the supply is bought: a client claiming output eleven on a
    // four-output brick is claiming a brick it has not paid for, and the
    // wiring bonus is exactly what it would be claiming it for.
    const supply = supplyTierOf(arsenal?.rig?.supplyTier);
    const boarded = new Set(items.map((item) => item?.itemId));
    const claimed = new Set<number>();
    const links: PowerLink[] = (Array.isArray(power) ? power : [])
      .filter((link) => {
        const ok =
          link &&
          typeof link.itemId === "string" &&
          boarded.has(link.itemId) &&
          Number.isInteger(link.out) &&
          link.out >= 0 &&
          link.out < supply.outputs &&
          !claimed.has(link.out);
        if (ok) claimed.add(link.out);
        return ok;
      })
      .map((link) => ({ itemId: link.itemId, out: link.out }));

    const rigLevel = getRigLevel({
      inventory: arsenal?.inventory ?? [],
      effectInventory: arsenal?.effectInventory ?? [],
      rig: {
        ...(arsenal?.rig ?? DEFAULT_RIG),
        pedalboardItems: items,
        power: links,
      },
    });
    await userRef.update({
      "arsenal.rig.pedalboardItems": items,
      "arsenal.rig.power": links,
      rigLevel,
    });
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("[update-pedalboard]", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
