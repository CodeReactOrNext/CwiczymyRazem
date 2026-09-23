import { isAdminRequest } from "lib/roadmaps/generation/adminGuard";
import { GenerationError } from "lib/roadmaps/generation/openaiJson";
import { UsageLedger } from "lib/roadmaps/generation/usage";
import {
  getOrCreatePhaseQuiz,
  resolveQuizSource,
} from "lib/roadmaps/phaseQuizzes";
import { requirePlayer } from "lib/support/supporterAuth";
import type { NextApiRequest, NextApiResponse } from "next";

interface QuizRequest {
  roadmapId?: string;
  phaseId?: string;
}

/**
 * The checkpoint quiz of one phase, for the signed-in player — any player,
 * since the curated roadmaps are everyone's. Written once per roadmap and
 * phase and served from Firestore after that. The admin editor gets in with
 * its password, to preview a quiz on a roadmap nobody owns yet.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const isAdmin = isAdminRequest(req);
  let uid: string | null = null;
  if (!isAdmin) {
    const player = await requirePlayer(req);
    if (!player.ok)
      return res.status(player.status).json({ message: player.error });
    uid = player.session.uid;
  }

  const { roadmapId, phaseId } = req.body as QuizRequest;
  if (
    typeof roadmapId !== "string" ||
    !roadmapId ||
    typeof phaseId !== "string" ||
    !phaseId
  ) {
    return res.status(400).json({ message: "Missing roadmapId or phaseId." });
  }

  try {
    const source = await resolveQuizSource(roadmapId, { uid, isAdmin });
    if (!source) return res.status(404).json({ message: "Roadmap not found." });

    const ledger = new UsageLedger();
    const quiz = await getOrCreatePhaseQuiz(source, phaseId, ledger);
    return res.status(200).json({ quiz, usage: ledger.totals() });
  } catch (error) {
    if (error instanceof GenerationError) {
      console.error("[roadmap-phase-quiz]", error.message);
      return res.status(error.status).json({ message: error.message });
    }
    console.error("[roadmap-phase-quiz]", error);
    return res.status(500).json({ message: "Unexpected server error." });
  }
}
