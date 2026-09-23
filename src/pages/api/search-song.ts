import { isAdminRequest } from "lib/roadmaps/generation/adminGuard";
import { MAX_GOAL_LENGTH } from "lib/roadmaps/generation/levels";
import { GenerationError } from "lib/roadmaps/generation/openaiJson";
import { extractSongFromStep } from "lib/roadmaps/generation/songMatch";
import { findLibrarySong } from "lib/roadmaps/songLookup";
import type { NextApiRequest, NextApiResponse } from "next";

/**
 * The library song one step is about, for the roadmap editor. The model says
 * which song the step names; the `songs` collection says whether we have it.
 * A step about no particular song, or about a song the library lacks, gets
 * `song: null` — never a guess.
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

  const { stepTitle, description, goal } = req.body as {
    stepTitle?: string;
    description?: string;
    goal?: string;
  };

  if (!stepTitle || typeof stepTitle !== "string" || stepTitle.length > 100) {
    return res.status(400).json({ error: "Invalid stepTitle." });
  }
  if (
    goal !== undefined &&
    (typeof goal !== "string" || goal.length > MAX_GOAL_LENGTH)
  ) {
    return res.status(400).json({ error: "Invalid goal." });
  }
  if (description !== undefined && typeof description !== "string") {
    return res.status(400).json({ error: "Invalid description." });
  }

  try {
    const requested = await extractSongFromStep({
      stepTitle,
      description: description ?? "",
      goal: goal ?? "",
    });
    const song = requested ? await findLibrarySong(requested) : null;
    return res.status(200).json({ requested, song });
  } catch (error) {
    if (error instanceof GenerationError) {
      console.error("[search-song]", error.message);
      return res.status(error.status).json({ error: error.message });
    }
    console.error("[search-song]", error);
    return res.status(500).json({ error: "Unexpected server error." });
  }
}
