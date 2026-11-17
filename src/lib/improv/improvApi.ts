import type { ImprovErrorCode } from "feature/improv/types/improv.types";
import type { NextApiRequest, NextApiResponse } from "next";
import { auth } from "utils/firebase/api/firebase.config";

import { ImprovError } from "./improvServer";

const STATUS: Record<ImprovErrorCode, number> = {
  BAD_LINK: 400,
  BAD_TRACK: 400,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  NO_ROUND: 409,
  LIMIT: 409,
  DUPLICATE: 409,
};

/**
 * One improv route: POST-only, authenticated by the Firebase id token in the
 * body (the same shape as the duels routes), an ImprovError mapped to its
 * status with the code as `error`, anything else a 500.
 */
export const improvRoute =
  <T>(
    context: string,
    run: (userId: string, body: Record<string, unknown>) => Promise<T>,
  ) =>
  async (req: NextApiRequest, res: NextApiResponse) => {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).json({ error: "Method not allowed" });
    }
    const body = (req.body ?? {}) as Record<string, unknown>;
    if (typeof body.idToken !== "string" || !body.idToken) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    let userId: string;
    try {
      userId = (await auth.verifyIdToken(body.idToken)).uid as string;
    } catch {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      return res.status(200).json((await run(userId, body)) ?? { ok: true });
    } catch (error) {
      if (error instanceof ImprovError) {
        return res.status(STATUS[error.code]).json({ error: error.code });
      }
      console.error(`improv/${context} failed`, error);
      return res.status(500).json({ error: "INTERNAL" });
    }
  };
