import { requireSupporter } from "lib/support/supporterAuth";
import { voteForItem } from "lib/supporterCase/supporterCase";
import type { NextApiRequest, NextApiResponse } from "next";

/**
 * Burns a token onto one item for one seat of the next slate. Supporters only —
 * this is the thing the donation buys, and the server re-checks that the item
 * really is of that seat's rarity so the case's composition cannot be bent.
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
    const { rarity, key } = req.body as { rarity?: string; key?: string };

    const result = await voteForItem(
      authResult.session,
      rarity ?? "",
      key ?? "",
    );

    if (!result.ok) {
      return res.status(result.status).json({ error: result.error });
    }

    return res.status(200).json(result.state);
  } catch (error: any) {
    console.error("[supporter/case/vote]", error);
    return res.status(500).json({ error: "Failed to save the vote" });
  }
}
