import { requirePlayer } from "lib/support/supporterAuth";
import { readState } from "lib/supporterCase/supporterCase";
import type { NextApiRequest, NextApiResponse } from "next";

/**
 * The live slate and the open ballot. Readable by any signed-in player, not
 * just supporters: anyone can buy the case, so everyone has to be able to see
 * what is in it — that the six items were chosen by supporters is the whole
 * point, and it only lands if it is visible from outside the club.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const authResult = await requirePlayer(req);
  if (!authResult.ok) {
    return res.status(authResult.status).json({ error: authResult.error });
  }

  try {
    const state = await readState(
      authResult.session.uid,
      authResult.session.isSupporter,
    );
    return res.status(200).json(state);
  } catch (error: any) {
    console.error("[supporter/case]", error);
    return res.status(500).json({ error: "Failed to load the case" });
  }
}
