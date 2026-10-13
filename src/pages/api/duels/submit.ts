import type { DuelRunSubmission } from "feature/duels/types/duel.types";
import { authenticateDuelRequest, sendDuelError } from "lib/duels/duelApi";
import { submitDuelRun } from "lib/duels/duelServer";
import type { NextApiRequest, NextApiResponse } from "next";

/**
 * Books a scored run from a duel session. Only runs started from the duel
 * itself come here — the same exercise played anywhere else never counts.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const userId = await authenticateDuelRequest(req, res);
  if (!userId) return;

  const { duelId, score, accuracy, bpm } =
    req.body as Partial<DuelRunSubmission>;
  if (typeof duelId !== "string" || !duelId) {
    return res.status(400).json({ error: "Missing duel" });
  }
  if (!Number.isFinite(score) || score! < 0 || !Number.isFinite(accuracy)) {
    return res.status(400).json({ error: "Invalid score" });
  }

  try {
    const result = await submitDuelRun(userId, {
      duelId,
      score: score!,
      accuracy: accuracy!,
      ...(Number.isFinite(bpm) ? { bpm } : {}),
    });
    return res.status(200).json(result);
  } catch (error) {
    return sendDuelError(res, error, "submit");
  }
}
