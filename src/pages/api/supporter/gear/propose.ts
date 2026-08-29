import type { ProposalStatus } from "feature/gearProposals/types/gearProposal.types";
import type { GearProposalInput } from "lib/gear/gearBoard";
import { proposeGear, setProposalStatus } from "lib/gear/gearBoard";
import { requireSupporter } from "lib/support/supporterAuth";
import type { NextApiRequest, NextApiResponse } from "next";

/**
 * POST files a gear proposal and burns the tokens for it; PATCH moves one along
 * and is refused for anyone but the owner. Every field is re-validated
 * server-side — the image link especially, which is rendered straight onto the
 * board for other people.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST" && req.method !== "PATCH") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const authResult = await requireSupporter(req);
  if (!authResult.ok) {
    return res.status(authResult.status).json({ error: authResult.error });
  }

  try {
    const body = req.body as GearProposalInput & {
      proposalId?: string;
      status?: ProposalStatus;
    };

    const result =
      req.method === "POST"
        ? await proposeGear(authResult.session, body)
        : await setProposalStatus(
            authResult.session,
            body.proposalId ?? "",
            body.status as ProposalStatus,
          );

    if (!result.ok) {
      return res.status(result.status).json({ error: result.error });
    }

    return res.status(200).json(result.board);
  } catch (error: any) {
    console.error("[supporter/gear/propose]", error);
    return res.status(500).json({ error: "Failed to save the proposal" });
  }
}
