import { authorizeGeneration } from "lib/roadmaps/generation/adminGuard";
import { searchLessonsForStep } from "lib/roadmaps/lessonSearch";
import type { NextApiRequest, NextApiResponse } from "next";

/**
 * The lessons that fit one step, for the generation pipeline. The search
 * itself lives in lib/roadmaps/lessonSearch, where the paid "find lessons
 * again" of a refined roadmap reaches it too.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const auth = await authorizeGeneration(req);
  if (!auth.ok) {
    return res.status(auth.status).json({ error: auth.message });
  }

  const { stepTitle, stepDescription, roadmapGoal, roadmapLevel } =
    req.body as {
      stepTitle: string;
      stepDescription?: string;
      roadmapGoal?: string;
      roadmapLevel?: string;
    };

  if (!stepTitle || typeof stepTitle !== "string" || stepTitle.length > 200) {
    return res.status(400).json({ error: "Invalid stepTitle" });
  }

  try {
    const result = await searchLessonsForStep({
      stepTitle,
      stepDescription,
      roadmapGoal,
      roadmapLevel,
    });
    return res.status(200).json(result);
  } catch (err) {
    // A missed lesson search never sinks a roadmap: the step just has none.
    console.error("search-youtube-lessons error:", err);
    return res.status(200).json({ lessons: [] });
  }
}
