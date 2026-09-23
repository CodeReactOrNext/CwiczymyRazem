import { isAdminRequest } from "lib/roadmaps/generation/adminGuard";
import { matchExercisesForStep } from "lib/roadmaps/generation/exerciseMatch";
import { isRoadmapLevel, MAX_GOAL_LENGTH } from "lib/roadmaps/generation/levels";
import { GenerationError } from "lib/roadmaps/generation/openaiJson";
import type { NextApiRequest, NextApiResponse } from "next";

/**
 * Exercise search for one step, from the library in context. The queue no
 * longer needs it — the structure call assigns exercises — but the roadmap
 * editor still re-searches a single step with it.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (!isAdminRequest(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { stepTitle, description, goal, level } = req.body as {
    stepTitle?: string;
    description?: string;
    goal?: string;
    level?: string;
  };

  if (!stepTitle || typeof stepTitle !== "string" || stepTitle.length > 100) {
    return res.status(400).json({ error: "Invalid stepTitle." });
  }
  if (goal !== undefined && (typeof goal !== "string" || goal.length > MAX_GOAL_LENGTH)) {
    return res.status(400).json({ error: "Invalid goal." });
  }
  if (description !== undefined && typeof description !== "string") {
    return res.status(400).json({ error: "Invalid description." });
  }
  if (level !== undefined && !isRoadmapLevel(level)) {
    return res.status(400).json({ error: "Invalid skill level." });
  }

  try {
    const exercise_ids = await matchExercisesForStep({
      stepTitle,
      description: description ?? "",
      goal: goal ?? "",
      level: level ?? "Intermediate",
    });
    return res.status(200).json({ exercise_ids });
  } catch (error) {
    if (error instanceof GenerationError) {
      console.error("[search-exercise]", error.message);
      return res.status(error.status).json({ error: error.message });
    }
    console.error("[search-exercise]", error);
    return res.status(500).json({ error: "Unexpected server error." });
  }
}
