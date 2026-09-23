import type { RoadmapVisibility } from "feature/aiCoach/types/roadmap.types";
import { ensureJob } from "lib/roadmaps/generation/backgroundJob";
import { openTicket } from "lib/roadmaps/generation/generationTicket";
import {
  MAX_TITLE_LENGTH,
  MIN_TITLE_LENGTH,
  sanitizeGoalContext,
  sanitizeTitle,
} from "lib/roadmaps/generation/goalContext";
import {
  isRoadmapLevel,
  MAX_GOAL_LENGTH,
} from "lib/roadmaps/generation/levels";
import { isRoadmapVisibility } from "lib/roadmaps/visibility";
import { requireSupporter } from "lib/support/supporterAuth";
import type { NextApiRequest, NextApiResponse } from "next";

/**
 * Starts a supporter's roadmap generation on the server: the tokens are
 * charged (once per goal, as with the browser pipeline), and a job is put on
 * the ticket. Nothing is generated in this request — the player's open tab
 * advances the job through /api/roadmap-jobs/advance, and the cron picks it up
 * once the tab is gone.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }
  const auth = await requireSupporter(req);
  if (!auth.ok) return res.status(auth.status).json({ message: auth.error });

  const { title, goal, level, visibility, context } = req.body as {
    title?: unknown;
    goal?: unknown;
    level?: unknown;
    visibility?: unknown;
    context?: unknown;
  };

  const cleanTitle = sanitizeTitle(title);
  if (!cleanTitle) {
    return res.status(400).json({
      message: `Give the roadmap a title of ${MIN_TITLE_LENGTH}–${MAX_TITLE_LENGTH} characters.`,
    });
  }
  if (typeof goal !== "string" || goal.trim().length < 5) {
    return res.status(400).json({
      message: "Please enter a guitar-related goal (minimum 5 characters).",
    });
  }
  if (goal.length > MAX_GOAL_LENGTH) {
    return res
      .status(400)
      .json({ message: `Goal must be at most ${MAX_GOAL_LENGTH} characters.` });
  }
  if (!isRoadmapLevel(level)) {
    return res.status(400).json({ message: "Invalid skill level." });
  }
  if (visibility !== undefined && !isRoadmapVisibility(visibility)) {
    return res.status(400).json({ message: "Invalid visibility." });
  }
  const chosenVisibility: RoadmapVisibility = isRoadmapVisibility(visibility)
    ? visibility
    : "public";

  try {
    const opened = await openTicket(
      auth.session.uid,
      goal,
      level,
      chosenVisibility,
      sanitizeGoalContext(context),
      cleanTitle,
    );
    if (!opened.ok) {
      return res.status(opened.status).json({ message: opened.error });
    }
    const job = await ensureJob(opened.ticket);
    return res.status(200).json({
      job,
      charged: opened.charged,
      tokensCharged: opened.charged ? opened.ticket.tokensCharged : 0,
      wallet: opened.wallet,
    });
  } catch (error) {
    console.error("[roadmap-jobs/start]", error);
    return res.status(500).json({ message: "Could not start the generation." });
  }
}
