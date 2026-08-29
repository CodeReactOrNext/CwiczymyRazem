import { readGearBoard } from "lib/gear/gearBoard";
import { requireSupporter } from "lib/support/supporterAuth";
import type { NextApiRequest, NextApiResponse } from "next";

/** The gear board as one supporter sees it: proposals, their backing, the wallet. */
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
    return res.status(200).json(await readGearBoard(authResult.session));
  } catch (error: any) {
    console.error("[supporter/gear]", error);
    return res.status(500).json({ error: "Failed to load the gear board" });
  }
}
