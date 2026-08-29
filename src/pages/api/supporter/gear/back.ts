import { backProposal } from "lib/gear/gearBoard";
import { requireSupporter } from "lib/support/supporterAuth";
import type { NextApiRequest, NextApiResponse } from "next";

/** Burns tokens onto a gear proposal. Same wallet, same ceiling as the roadmap. */
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
    const { proposalId, amount } = req.body as {
      proposalId?: string;
      amount?: number;
    };

    const result = await backProposal(
      authResult.session,
      proposalId ?? "",
      Number(amount ?? 1),
    );

    if (!result.ok) {
      return res.status(result.status).json({ error: result.error });
    }

    return res.status(200).json(result.board);
  } catch (error: any) {
    console.error("[supporter/gear/back]", error);
    return res.status(500).json({ error: "Failed to back the proposal" });
  }
}
