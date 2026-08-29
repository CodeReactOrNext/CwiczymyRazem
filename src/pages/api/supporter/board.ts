import { readBoard } from "lib/support/roadmapBoard";
import { requireSupporter } from "lib/support/supporterAuth";
import type { NextApiRequest, NextApiResponse } from "next";

/**
 * The roadmap board as one supporter sees it: every idea, where their own votes
 * sit, and what they have left to spend. POST rather than GET because the id
 * token travels in the body, the way the arsenal routes do it.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const authResult = await requireSupporter(req);
  if (!authResult.ok) {
    return res.status(authResult.status).json({ error: authResult.error });
  }

  try {
    return res.status(200).json(await readBoard(authResult.session));
  } catch (error: any) {
    console.error("[supporter/board]", error);
    return res.status(500).json({ error: "Failed to load the board" });
  }
}
