import type { WorkStatus } from "feature/workBoard/types/workBoard.types";
import {
  createWorkItem,
  deleteWorkItem,
  moveWorkItem,
  readWorkItems,
  updateWorkItem,
} from "lib/work/workBoard";
import type { NextApiRequest, NextApiResponse } from "next";

/**
 * Owner-side CRUD for the work board, behind the same admin password as the
 * rest of /admin. Every write answers with the whole board so the panel never
 * has to reconstruct what a move did to the ordering.
 */
function isAuthorized(req: NextApiRequest): boolean {
  const password = req.headers["x-admin-password"] ?? req.body?.password;
  return (
    !!process.env.ADMIN_PASSWORD && password === process.env.ADMIN_PASSWORD
  );
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (!isAuthorized(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    if (req.method === "GET") {
      return res.status(200).json({ items: await readWorkItems() });
    }

    if (req.method === "POST") {
      const { title, note, status, ideaId } = req.body as {
        title?: string;
        note?: string;
        status?: WorkStatus;
        ideaId?: string | null;
      };

      const result = await createWorkItem({ title, note, status, ideaId });
      if (!result.ok) {
        return res.status(result.status).json({ error: result.error });
      }
      return res.status(200).json({ items: result.items });
    }

    if (req.method === "PATCH") {
      const { id, title, note, status, move } = req.body as {
        id?: string;
        title?: string;
        note?: string;
        status?: WorkStatus;
        move?: "up" | "down";
      };

      const result = move
        ? await moveWorkItem(id ?? "", move)
        : await updateWorkItem(id ?? "", { title, note, status });

      if (!result.ok) {
        return res.status(result.status).json({ error: result.error });
      }
      return res.status(200).json({ items: result.items });
    }

    if (req.method === "DELETE") {
      const { id } = req.body as { id?: string };

      const result = await deleteWorkItem(id ?? "");
      if (!result.ok) {
        return res.status(result.status).json({ error: result.error });
      }
      return res.status(200).json({ items: result.items });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error: any) {
    console.error("[admin/work]", error);
    return res.status(500).json({ error: error?.message ?? "Unknown error" });
  }
}
