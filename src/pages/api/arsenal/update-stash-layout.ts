import type { StashLayout } from "feature/arsenal/utils/stashLayout";
import type { NextApiRequest, NextApiResponse } from "next";
import { auth, firestore } from "utils/firebase/api/firebase.config";

/**
 * A ceiling on how much arrangement one user can store. Comfortably above any
 * real collection, and low enough that a broken client cannot inflate the user
 * document — the whole map is read back on every Arsenal load.
 */
const MAX_ENTRIES = 2000;
const MAX_CELL = 100000;

/** Drop anything that isn't a plain "id → cell" pair before it reaches the document. */
const sanitize = (raw: unknown): StashLayout | null => {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw))
    return null;
  const entries = Object.entries(raw as Record<string, unknown>);
  if (entries.length > MAX_ENTRIES) return null;

  const layout: StashLayout = {};
  for (const [id, cell] of entries) {
    if (!id || id.length > 200) return null;
    if (typeof cell !== "number" || !Number.isInteger(cell)) return null;
    if (cell < 0 || cell > MAX_CELL) return null;
    layout[id] = cell;
  }
  return layout;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { idToken, layout } = req.body as {
    idToken: string;
    layout: unknown;
  };

  if (!idToken) return res.status(401).json({ error: "Unauthorized" });

  const sanitized = sanitize(layout);
  if (!sanitized) return res.status(400).json({ error: "Invalid layout" });

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

    // Purely cosmetic: where things hang says nothing about what is owned, so
    // it is written as-is without touching the inventory itself.
    await userRef.update({ "arsenal.stashLayout": sanitized });
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("[update-stash-layout]", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
