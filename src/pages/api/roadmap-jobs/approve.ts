import { answerApproval } from "lib/roadmaps/generation/backgroundJob";
import { MAX_FEEDBACK_LENGTH } from "lib/roadmaps/generation/jobPlan";
import { requireSupporter } from "lib/support/supporterAuth";
import type { NextApiRequest, NextApiResponse } from "next";

/**
 * The owner's answer to the plan their generation stopped on: an OK, or —
 * once per roadmap, free — a note on what to change before the descriptions
 * and the lessons are written. Nothing is generated in this request; the job
 * goes back to running and the tab (or the cron) advances it as before.
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

  const { ticketId, feedback } = req.body as {
    ticketId?: unknown;
    feedback?: unknown;
  };
  if (typeof ticketId !== "string" || !ticketId) {
    return res.status(400).json({ message: "Missing ticketId." });
  }
  if (feedback !== undefined && typeof feedback !== "string") {
    return res.status(400).json({ message: "Invalid feedback." });
  }
  if (typeof feedback === "string" && feedback.length > MAX_FEEDBACK_LENGTH) {
    return res.status(400).json({
      message: `Keep the note under ${MAX_FEEDBACK_LENGTH} characters.`,
    });
  }

  try {
    const job = await answerApproval(
      auth.session.uid,
      ticketId,
      typeof feedback === "string" ? feedback : null,
    );
    if (!job) return res.status(404).json({ message: "No such generation." });
    return res.status(200).json({ job });
  } catch (error) {
    console.error("[roadmap-jobs/approve]", error);
    return res.status(500).json({ message: "Could not save your answer." });
  }
}
