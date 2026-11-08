import type { NextApiRequest, NextApiResponse } from "next";
import { auth } from "utils/firebase/api/firebase.config";

/**
 * Trades a player's ID token, from /desktop-login in their browser, for a
 * Firebase custom token the desktop app signs in with
 * (see electron/desktopAuth.js).
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const idToken: unknown = req.body?.idToken;
  if (typeof idToken !== "string" || !idToken) {
    return res.status(400).json({ error: "Missing ID token" });
  }

  try {
    // checkRevoked: a signed-out-everywhere or disabled account gets nothing.
    const { uid } = await auth.verifyIdToken(idToken, true);
    const token: string = await auth.createCustomToken(uid);
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ token });
  } catch (error) {
    console.error("[desktop-token] refused:", error);
    return res.status(401).json({ error: "Unauthorized request" });
  }
}
