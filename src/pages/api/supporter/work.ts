import { requireSupporter } from "lib/support/supporterAuth";
import { readWorkItems } from "lib/work/workBoard";
import type { NextApiRequest, NextApiResponse } from "next";

/**
 * The work board, read-only. Supporters get to see what is actually being built
 * and what is behind it; changing any of it is the owner's job in /admin/work.
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
    return res.status(200).json({ items: await readWorkItems() });
  } catch (error: any) {
    console.error("[supporter/work]", error);
    return res.status(500).json({ error: "Failed to load the board" });
  }
}
