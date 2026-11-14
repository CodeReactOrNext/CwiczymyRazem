import { readEquippedLookup } from "lib/cosmetics/cosmeticsStore";
import type { NextApiRequest, NextApiResponse } from "next";

/**
 * What every player is wearing, keyed by uid — the feed's one lookup.
 *
 * Nothing private is in it (a uid and two catalog ids), so it is cached at the
 * edge: a busy feed costs one Firestore read a minute, not one per viewer. A
 * player's own change shows at once because the client patches its cached copy.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
    return res.status(200).json({ players: await readEquippedLookup() });
  } catch (error) {
    console.error("[cosmetics/equipped]", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
