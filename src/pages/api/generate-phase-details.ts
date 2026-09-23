import type { RoadmapPhase } from "feature/aiCoach/types/roadmap.types";
import { authorizeGeneration } from "lib/roadmaps/generation/adminGuard";
import { describePhaseSteps } from "lib/roadmaps/generation/descriptions";
import { isRoadmapLevel, MAX_GOAL_LENGTH } from "lib/roadmaps/generation/levels";
import { GenerationError } from "lib/roadmaps/generation/openaiJson";
import { UsageLedger } from "lib/roadmaps/generation/usage";
import type { NextApiRequest, NextApiResponse } from "next";

interface PhaseDetailsRequest {
  goal?: string;
  level?: string;
  phases?: RoadmapPhase[];
  phaseIndex?: number;
  /** Only these steps of the phase; the whole phase when omitted. */
  stepIds?: string[];
}

/**
 * Description, success criteria and session count for the steps of one phase,
 * written together so they read as one author's work. Answers with the phase.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }
  const auth = await authorizeGeneration(req);
  if (!auth.ok) {
    return res.status(auth.status).json({ message: auth.message });
  }

  const { goal, level, phases, phaseIndex, stepIds } = req.body as PhaseDetailsRequest;

  if (!goal || typeof goal !== "string" || goal.length > MAX_GOAL_LENGTH) {
    return res.status(400).json({ message: "Invalid goal." });
  }
  if (!isRoadmapLevel(level)) {
    return res.status(400).json({ message: "Invalid skill level." });
  }
  if (
    !Array.isArray(phases) ||
    typeof phaseIndex !== "number" ||
    !phases[phaseIndex]?.steps?.length
  ) {
    return res.status(400).json({ message: "Invalid phases or phaseIndex." });
  }
  if (stepIds !== undefined && !Array.isArray(stepIds)) {
    return res.status(400).json({ message: "Invalid stepIds." });
  }

  try {
    const ledger = new UsageLedger();
    const phase = await describePhaseSteps({
      goal,
      level,
      phases,
      phaseIndex,
      stepIds,
      ledger,
    });
    return res.status(200).json({ phase, usage: ledger.totals() });
  } catch (error) {
    if (error instanceof GenerationError) {
      console.error("[generate-phase-details]", error.message);
      return res.status(error.status).json({ message: error.message });
    }
    console.error("[generate-phase-details]", error);
    return res.status(500).json({ message: "Unexpected server error." });
  }
}
