import type {
  RoadmapIdeaIcon,
  RoadmapIdeaStatus,
} from "feature/supporterPanel/types/supporterPanel.types";
import { createIdea, setIdeaStatus } from "lib/support/roadmapBoard";
import { requireSupporter } from "lib/support/supporterAuth";
import type { NextApiRequest, NextApiResponse } from "next";

/**
 * POST posts an idea and burns the credits for it; PATCH moves an existing one
 * along the board and is refused for anyone but the owner. Both answer with the
 * whole board, so the client never has to guess what the write did to the
 * budget.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST" && req.method !== "PATCH") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const authResult = await requireSupporter(req);
  if (!authResult.ok) {
    return res.status(authResult.status).json({ error: authResult.error });
  }

  try {
    const { title, description, icon, ideaId, status } = req.body as {
      title?: string;
      description?: string;
      icon?: RoadmapIdeaIcon;
      ideaId?: string;
      status?: RoadmapIdeaStatus;
    };

    const result =
      req.method === "POST"
        ? await createIdea(authResult.session, { title, description, icon })
        : await setIdeaStatus(
            authResult.session,
            ideaId ?? "",
            status as RoadmapIdeaStatus,
          );

    if (!result.ok) {
      return res.status(result.status).json({ error: result.error });
    }

    return res.status(200).json(result.board);
  } catch (error: any) {
    console.error("[supporter/idea]", error);
    return res.status(500).json({ error: "Failed to save the idea" });
  }
}
