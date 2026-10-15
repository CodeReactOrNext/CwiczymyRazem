import type { NextApiRequest, NextApiResponse } from "next";
import { auth } from "utils/firebase/api/firebase.config";

import { DuelError, type DuelErrorCode } from "./duelServer";

/**
 * POST-only, authenticated by the Firebase id token in the body — the same
 * shape as the other player-scoped routes. Answers the request itself and
 * returns null when the caller can't go on.
 */
export async function authenticateDuelRequest(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<string | null> {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method not allowed" });
    return null;
  }
  const { idToken } = (req.body ?? {}) as { idToken?: string };
  if (!idToken) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  try {
    return (await auth.verifyIdToken(idToken)).uid as string;
  } catch {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
}

const STATUS: Record<DuelErrorCode, number> = {
  LOCKED: 403,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  LIMIT: 409,
  CLOSED: 409,
  NO_RUN: 409,
};

/** Maps a DuelError to its status (the code goes back as `error`); anything else is a 500. */
export function sendDuelError(
  res: NextApiResponse,
  error: unknown,
  context: string,
) {
  if (error instanceof DuelError) {
    return res.status(STATUS[error.code]).json({ error: error.code });
  }
  console.error(`duels/${context} failed`, error);
  return res.status(500).json({ error: "INTERNAL" });
}
