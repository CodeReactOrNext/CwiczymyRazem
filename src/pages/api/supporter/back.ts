import { backIdea } from "lib/support/roadmapBoard";
import { requireSupporter } from "lib/support/supporterAuth";
import type { NextApiRequest, NextApiResponse } from "next";

/**
 * Burns tokens onto an idea. The client sends how much to add, and it is
 * charged for exactly that — the wallet is re-read inside the transaction, so
 * two tabs cannot spend the same token twice.
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
    const { ideaId, amount } = req.body as { ideaId?: string; amount?: number };

    const result = await backIdea(
      authResult.session,
      ideaId ?? "",
      Number(amount ?? 1),
    );

    if (!result.ok) {
      return res.status(result.status).json({ error: result.error });
    }

    return res.status(200).json(result.board);
  } catch (error: any) {
    console.error("[supporter/back]", error);
    return res.status(500).json({ error: "Failed to back the idea" });
  }
}
