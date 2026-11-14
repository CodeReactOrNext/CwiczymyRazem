import { readWardrobeFor, uidFromRequest } from "lib/cosmetics/cosmeticsStore";
import type { NextApiRequest, NextApiResponse } from "next";

/** The caller's own wardrobe: what they own and what they have on. */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const uid = await uidFromRequest(req);
  if (!uid) return res.status(401).json({ error: "Unauthorized" });

  try {
    return res.status(200).json(await readWardrobeFor(uid));
  } catch (error) {
    console.error("[cosmetics/state]", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
